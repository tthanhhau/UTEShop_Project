import { Client, handle_file } from "@gradio/client";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Virtual Try-On Proxy Controller
 * ===================================================
 * Thứ tự ưu tiên:
 *   1. COLAB_TRYON_URL   ← Google Colab (T4 GPU, khuyến nghị)
 *   2. HF Spaces         ← Cloud AI (có thể chậm / giới hạn)
 *   3. Local GPU         ← localhost:8001 (nếu có GPU local)
 *
 * ⚠️ Cách kích hoạt Colab:
 *   - Chạy TryCloth/colab_tryon.py trên Google Colab
 *   - Copy link "https://XXXXXXXX.gradio.live"
 *   - Dán vào COLAB_TRYON_URL= trong file .env
 *   - Restart backend
 */

// ⚠️ Link này lấy từ .env — xem hướng dẫn ở trên
const COLAB_URL = process.env.COLAB_TRYON_URL; // "https://XXXXXXXX.gradio.live"

const HF_SPACES = [
    "yisol/IDM-VTON",        // Dự phòng (nếu Colab không chạy)
    "zhengchong/CatVTON",    // Dự phòng 2
];

const LOCAL_API = "http://localhost:8001";

/**
 * Chuyển Buffer thành Blob (Gradio Client yêu cầu Blob)
 */
function bufferToBlob(buffer, mimeType = "image/jpeg") {
    return new Blob([buffer], { type: mimeType });
}

/**
 * Gọi Gradio API trên Colab (dùng Gradio native API format)
 * Endpoint: /api/tryon_b64 (Gradio API, hoạt động qua share tunnel)
 */
async function callColabAPI(personBuffer, clothBuffer, clothType) {
    console.log(`[Colab AI] >>> Kết nối: ${COLAB_URL}...`);

    // Gửi theo format Gradio: {"data": [arg1, arg2, arg3]}
    const payload = {
        data: [
            Buffer.from(personBuffer).toString("base64"),
            Buffer.from(clothBuffer).toString("base64"),
            clothType || "upper",
        ],
    };

    console.log(`[Colab AI] >>> Đang xử lý (cloth_type=${clothType})...`);

    const response = await Promise.race([
        fetch(`${COLAB_URL}/api/tryon_b64`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify(payload),
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Colab xử lý quá lâu (3 phút)")), 180000)
        ),
    ]);

    if (!response.ok) {
        const errBody = (await response.text()).slice(0, 200);
        throw new Error(`Colab HTTP ${response.status}: ${errBody}`);
    }

    // Response Gradio format: {"data": ["base64..."]}
    const data = await response.json();
    const resultB64 = data?.data?.[0];
    if (!resultB64 || resultB64.startsWith("ERROR:")) {
        throw new Error(`Colab error: ${resultB64 || "empty response"}`);
    }
    const dataUrl = `data:image/jpeg;base64,${resultB64}`;
    return dataUrl;
}


/**
 * Gọi HuggingFace Spaces (IDM-VTON hoặc CatVTON)
 */
async function callHFSpace(spaceId, personBlob, clothBlob, clothType) {
    console.log(`[HF Space] >>> Kết nối: ${spaceId}...`);

    const client = await Promise.race([
        Client.connect(spaceId),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("HF connect timeout")), 25000)
        ),
    ]);

    console.log(`[HF Space] >>> Đang xử lý: ${spaceId}...`);
    let result;

    if (spaceId.includes("IDM-VTON")) {
        let garmentDes = "clothing item";
        if (clothType === "lower") garmentDes = "pants, skirt, trousers, lower-body clothing";
        if (clothType === "overall") garmentDes = "dress, jumpsuit, full-body clothing";

        // IDM-VTON: start_tryon(dict, garm_img, garment_des, is_checked, is_checked_crop, denoise_steps, seed)
        result = await Promise.race([
            client.predict("/tryon", [
                { background: personBlob, layers: [], composite: null },
                clothBlob,
                garmentDes,
                true,    // auto mask
                false,   // auto crop
                30,      // denoise steps
                42,      // seed
            ]),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("HF xử lý quá lâu")), 120000)
            ),
        ]);
    } else if (spaceId.includes("CatVTON")) {
        result = await Promise.race([
            client.predict("/submit", [
                { background: personBlob, layers: [], composite: null },
                clothBlob,
                clothType || "upper",
                30, 2.5, 42, "result only"
            ]),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("HF xử lý quá lâu")), 120000)
            ),
        ]);
    }

    const imgData = result?.data?.[0];
    const url = imgData?.url || (typeof imgData === "string" ? imgData : null);

    if (!url) throw new Error(`${spaceId} trả về kết quả trống`);
    return url;
}

export const tryOnProxy = async (req, res) => {
    try {
        const { clothType } = req.body;

        if (!req.files || !req.files["person_image"] || !req.files["cloth_image"]) {
            return res.status(400).json({ success: false, error: "Thiếu file ảnh (person_image, cloth_image)" });
        }

        const personBuffer = req.files["person_image"][0].buffer;
        const clothBuffer  = req.files["cloth_image"][0].buffer;

        // Debug: kiểm tra ảnh đầu vào
        console.log(`[Try-On] person: ${personBuffer.length} bytes, magic=${personBuffer.slice(0,4).toString("hex")}`);
        console.log(`[Try-On] cloth: ${clothBuffer.length} bytes, magic=${clothBuffer.slice(0,4).toString("hex")}`);

        // ===============================
        // PRIORITY 1: GOOGLE COLAB (REST API trực tiếp)
        // ===============================
        if (COLAB_URL && COLAB_URL.trim() !== "") {
            try {
                const url = await callColabAPI(personBuffer, clothBuffer, clothType);
                console.log(`[Colab AI] >>> ✅ THÀNH CÔNG`);
                return res.json({ success: true, result_url: url, source: "Google Colab (CatVTON)" });
            } catch (err) {
                console.error(`[Colab AI] >>> ❌ Lỗi:`, err.message);
                
                // Nếu là lỗi validate ảnh không phải người thật (có prefix ERROR: hoặc chứa thông tin validate), 
                // ta trả thẳng lỗi về frontend luôn chứ không nhảy sang HF Spaces.
                if (err.message.includes("ERROR:") || err.message.includes("Ảnh không hợp lệ") || err.message.includes("Không phát hiện") || err.message.includes("người thật")) {
                    throw err; 
                }
                
                console.log(`[Colab AI] >>> Chuyển sang HF Spaces...`);
            }
        } else {
            console.log("[Try-On] COLAB_TRYON_URL chưa được cấu hình. Dùng HF Spaces...");
            console.log("[Try-On] ⚠️  Hướng dẫn: Chạy TryCloth/colab_tryon.py trên Google Colab,");
            console.log("[Try-On]    sau đó điền link vào COLAB_TRYON_URL trong file .env");
        }

        // ===============================
        // PRIORITY 2: HUGGING FACE SPACES (Fallback)
        // ===============================
        // IDM-VTON chỉ hoạt động tốt cho áo (upper). Nếu là quần/váy (lower) thì nó sẽ bị lỗi biến quần thành áo.
        // Do đó, nếu thử quần mà Colab lỗi thì báo lỗi luôn chứ không fallback qua IDM-VTON.
        if (clothType !== "upper") {
            throw new Error("Colab đang lỗi hoặc chưa cấu hình. Thử quần/váy (lower) CHỈ hoạt động qua Colab CatVTON, vui lòng kiểm tra lại Colab!");
        }

        const personBlob = bufferToBlob(personBuffer);
        const clothBlob  = bufferToBlob(clothBuffer);

        let lastError = null;
        for (const spaceId of HF_SPACES) {
            try {
                const url = await callHFSpace(spaceId, personBlob, clothBlob, clothType);
                console.log(`[HF Space] >>> ✅ THÀNH CÔNG: ${spaceId}`);
                return res.json({ success: true, result_url: url, source: spaceId });
            } catch (err) {
                console.error(`[HF Space] >>> ❌ ${spaceId}:`, err.message);
                lastError = err;
            }
        }

        // ===============================
        // PRIORITY 3: LOCAL GPU (Port 8001)
        // ===============================
        console.log("[Local AI] >>> Tất cả Cloud lỗi. Thử Local GPU (port 8001)...");
        try {
            // Recreate standard blobs for fetch API
            const personBlob = bufferToBlob(req.files["person_image"][0].buffer);
            const clothBlob  = bufferToBlob(req.files["cloth_image"][0].buffer);

            const localForm = new FormData();
            localForm.append("person_image", personBlob, "person.jpg");
            localForm.append("cloth_image",  clothBlob,  "cloth.jpg");
            localForm.append("cloth_type",   clothType || "upper");

            const localRes = await fetch(`${LOCAL_API}/try-on`, {
                method: "POST",
                body: localForm,
            });

            const localData = await localRes.json();
            if (localData.success) {
                console.log("[Local AI] >>> ✅ Thành công!");
                return res.json({
                    success: true,
                    result_url: `${LOCAL_API}${localData.result_url}`,
                    source: "Local GPU",
                });
            }
        } catch (localErr) {
            console.error("[Local AI] >>> ❌:", localErr.message);
        }

        // Tất cả đều thất bại
        return res.status(503).json({
            success: false,
            error: "Tất cả AI server đều không khả dụng. Vui lòng chạy Google Colab và cấu hình COLAB_TRYON_URL.",
            hint: "Xem file TryCloth/colab_tryon.py để biết cách setup",
        });

    } catch (error) {
        console.error("[VirtualTryOn Error]:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
