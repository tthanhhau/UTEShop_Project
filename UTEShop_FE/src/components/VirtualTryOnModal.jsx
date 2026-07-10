import { useState, useRef, useCallback } from "react";

/**
 * VirtualTryOnModal - Thử đồ ảo AI
 * ===================================
 * Gọi qua Node.js Backend (/api/try-on) → Backend tự điều phối:
 *   1. Google Colab (COLAB_TRYON_URL trong .env) — ưu tiên nhất
 *   2. HuggingFace Spaces — dự phòng
 *   3. Local GPU Port 8001 — fallback cuối
 */

// Base URL của Node.js backend
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Các bước tiến trình hiển thị cho user
const PROGRESS_STEPS = [
    { pct: 10, msg: "📤 Đang tải ảnh lên server..." },
    { pct: 25, msg: "🔍 AI đang phân tích ảnh người..." },
    { pct: 45, msg: "✂️  Đang tạo mask vùng quần áo..." },
    { pct: 65, msg: "🎨 AI đang tổng hợp hình ảnh..." },
    { pct: 85, msg: "✨ Đang hoàn thiện kết quả..." },
    { pct: 100, msg: "✅ Xong! Đang tải ảnh kết quả..." },
];

export default function VirtualTryOnModal({ isOpen, onClose, product }) {
    const [personImage, setPersonImage]     = useState(null);
    const [personPreview, setPersonPreview] = useState(null);
    const [resultImage, setResultImage]     = useState(null);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState(null);
    const [progress, setProgress]           = useState({ pct: 0, msg: "" });
    const [clothType, setClothType]         = useState("upper");
    const [aiSource, setAiSource]           = useState(null); // Colab / HF Space / Local
    const [elapsedSec, setElapsedSec]       = useState(0);
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver]           = useState(false);
    const timerRef = useRef(null);

    const productImage = product?.images?.[0] || null;

    // ---- Upload ảnh người ----
    const handleFileSelect = useCallback((file) => {
        if (!file || !file.type.startsWith("image/")) return;
        setPersonImage(file);
        setPersonPreview(URL.createObjectURL(file));
        setResultImage(null);
        setError(null);
        setProgress({ pct: 0, msg: "" });
        setAiSource(null);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files[0]);
    }, [handleFileSelect]);

    // ---- Hàm chính: Thử đồ ----
    const handleTryOn = async () => {
        if (!personImage) {
            setError("Vui lòng tải ảnh của bạn lên");
            return;
        }
        if (!productImage) {
            setError("Sản phẩm này chưa có ảnh để thử đồ");
            return;
        }

        setLoading(true);
        setError(null);
        setResultImage(null);
        setAiSource(null);
        setElapsedSec(0);

        // Đếm giây để user thấy tiến trình thời gian
        timerRef.current = setInterval(() => {
            setElapsedSec((s) => s + 1);
        }, 1000);

        // Mô phỏng tiến trình UI (vì AI xử lý không trả tiến trình thật)
        let stepIdx = 0;
        const advanceProgress = () => {
            if (stepIdx < PROGRESS_STEPS.length) {
                setProgress(PROGRESS_STEPS[stepIdx]);
                stepIdx++;
            }
        };
        advanceProgress();
        const progressTimer = setInterval(advanceProgress, 8000); // mỗi 8s tăng 1 bước

        try {
            // Tải ảnh sản phẩm từ URL Cloudinary
            // Ép Cloudinary trả về JPEG thay vì AVIF (tránh lỗi UnidentifiedImageError trên Colab)
            let fetchUrl = productImage;
            if (fetchUrl.includes("res.cloudinary.com") && fetchUrl.includes("/upload/")) {
                fetchUrl = fetchUrl.replace("/upload/", "/upload/f_jpg/");
            }
            const clothResponse = await fetch(fetchUrl);
            if (!clothResponse.ok) throw new Error("Không thể tải ảnh sản phẩm");
            const clothBlob = await clothResponse.blob();

            // Tạo FormData gửi lên Node.js backend
            const formData = new FormData();
            formData.append("person_image", personImage, "person.jpg");
            formData.append("cloth_image",  clothBlob,   "cloth.jpg");
            formData.append("clothType",    clothType);

            setProgress(PROGRESS_STEPS[1]); // "Đang phân tích..."

            // ⚠️ Gọi Node.js backend (không phải local Python)
            // Backend sẽ tự điều phối: Colab → HF Space → Local GPU
            const response = await fetch(`${BACKEND_URL}/api/try-on`, {
                method: "POST",
                body: formData,
                // Không set Content-Type header (browser tự set với boundary)
            });

            clearInterval(progressTimer);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Server lỗi (HTTP ${response.status})`);
            }

            const data = await response.json();

            if (data.success && data.result_url) {
                setProgress({ pct: 100, msg: "✅ Hoàn tất!" });
                setResultImage(data.result_url);
                setAiSource(data.source || "AI");
            } else {
                throw new Error(data.error || "AI không tạo được kết quả");
            }

        } catch (err) {
            clearInterval(progressTimer);
            console.error("[VirtualTryOn] Error:", err);

            // Thông báo lỗi thân thiện
            if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
                setError("Không thể kết nối đến server. Hãy kiểm tra kết nối mạng và thử lại.");
            } else if (
                err.message.includes("Ảnh không hợp lệ") ||
                err.message.includes("không phát hiện người") ||
                err.message.includes("Không phát hiện") ||
                err.message.includes("khuôn mặt") ||
                err.message.includes("người thật") ||
                err.message.toLowerCase().includes("invalid") ||
                err.message.toLowerCase().includes("not a person")
            ) {
                setError("Ảnh không hợp lệ! Vui lòng tải lên ảnh NGƯỜI THẬT (chụp toàn thân hoặc nửa người). Ảnh búp bê, robot, xe hoặc vật thể khác không được chấp nhận.");
            } else if (err.message.includes("Colab") || err.message.includes("COLAB")) {
                setError("Dịch vụ AI đang tạm thời không khả dụng. Vui lòng thử lại sau ít phút.");
            } else {
                setError(err.message || "Đã xảy ra lỗi, vui lòng thử lại.");
            }
            setProgress({ pct: 0, msg: "" });
        } finally {
            setLoading(false);
            clearInterval(timerRef.current);
        }
    };

    const handleClose = () => {
        setPersonImage(null);
        setPersonPreview(null);
        setResultImage(null);
        setError(null);
        setProgress({ pct: 0, msg: "" });
        setAiSource(null);
        setElapsedSec(0);
        clearInterval(timerRef.current);
        onClose();
    };

    const handleReset = () => {
        setPersonImage(null);
        setPersonPreview(null);
        setResultImage(null);
        setError(null);
        setProgress({ pct: 0, msg: "" });
        setAiSource(null);
        setElapsedSec(0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative">
                <div className="p-6">

                    {/* ===== CHỌN LOẠI ĐỒ ===== */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { value: "upper",   label: "👕 Áo",       desc: "Áo thun, sơ mi, hoodie..." },
                            { value: "lower",   label: "👖 Quần/Váy", desc: "Quần jeans, váy..." },
                            { value: "overall", label: "👗 Đồ liền",   desc: "Váy liền, jumpsuit..." },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => !loading && setClothType(opt.value)}
                                disabled={loading}
                                title={opt.desc}
                                className={`px-4 py-2 rounded-xl font-medium transition-all text-sm flex-1 ${
                                    clothType === opt.value
                                        ? "bg-purple-600 text-white shadow-md scale-105"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* ===== 3 CỘT: ẢNH NGƯỜI | SẢN PHẨM | KẾT QUẢ ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                        {/* Cột 1: Ảnh người */}
                        <div className="flex flex-col gap-2">
                            <p className="font-semibold text-gray-700 text-center text-sm">📸 Ảnh của bạn</p>
                            <div
                                onClick={() => !loading && fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                className={`aspect-[3/4] border-2 border-dashed rounded-xl flex items-center justify-center transition-all overflow-hidden ${
                                    loading
                                        ? "cursor-not-allowed opacity-80"
                                        : "cursor-pointer"
                                } ${
                                    dragOver
                                        ? "border-purple-500 bg-purple-50"
                                        : personPreview
                                            ? "border-green-400"
                                            : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                                }`}
                            >
                                {personPreview ? (
                                    <img src={personPreview} alt="Ảnh bạn" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-gray-400 p-4">
                                        <div className="text-4xl mb-2">📷</div>
                                        <p className="text-sm font-medium">Nhấn để chọn ảnh</p>
                                        <p className="text-xs mt-1">hoặc kéo thả vào đây</p>
                                        <p className="text-xs mt-2 text-gray-300">JPG, PNG ≤ 10MB</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files[0])}
                            />
                            {personPreview && !loading && (
                                <button
                                    onClick={handleReset}
                                    className="text-xs text-red-500 hover:text-red-700 text-center"
                                >
                                    🗑 Xóa và chọn lại
                                </button>
                            )}
                        </div>

                        {/* Cột 2: Sản phẩm */}
                        <div className="flex flex-col gap-2">
                            <p className="font-semibold text-gray-700 text-center text-sm">👕 Sản phẩm</p>
                            <div className="aspect-[3/4] border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                                {productImage ? (
                                    <img src={productImage} alt={product?.name} className="w-full h-full object-cover" />
                                ) : (
                                    <p className="text-gray-400 text-sm text-center p-4">Sản phẩm không có ảnh</p>
                                )}
                            </div>
                            <p className="text-center text-xs text-gray-500 truncate px-1" title={product?.name}>
                                {product?.name}
                            </p>
                        </div>

                        {/* Cột 3: Kết quả */}
                        <div className="flex flex-col gap-2">
                            <p className="font-semibold text-gray-700 text-center text-sm">✨ Kết quả AI</p>
                            <div className="aspect-[3/4] border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
                                {loading ? (
                                    <div className="text-center p-4 w-full">
                                        {/* Spinner */}
                                        <div className="relative w-16 h-16 mx-auto mb-3">
                                            <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
                                            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center text-purple-600 font-bold text-sm">
                                                {progress.pct}%
                                            </div>
                                        </div>

                                        {/* Thanh tiến trình */}
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-1000"
                                                style={{ width: `${progress.pct}%` }}
                                            />
                                        </div>

                                        <p className="text-xs text-purple-600 font-medium">{progress.msg}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            ⏱ {elapsedSec}s • AI đang xử lý (~30-60s)
                                        </p>
                                    </div>
                                ) : resultImage ? (
                                    <img src={resultImage} alt="Kết quả thử đồ" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-gray-400 p-4">
                                        <div className="text-4xl mb-2">🪄</div>
                                        <p className="text-sm">Kết quả sẽ hiện ở đây</p>
                                        <p className="text-xs mt-1 text-gray-300">Upload ảnh và nhấn Thử đồ</p>
                                    </div>
                                )}
                            </div>

                            {/* Badge AI Source + Nút tải */}
                            {resultImage && !loading && (
                                <div className="flex flex-col gap-1 items-center">
                                    {aiSource && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            ✅ {aiSource}
                                        </span>
                                    )}
                                    <a
                                        href={resultImage}
                                        download="uteshop_tryon_result.png"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-purple-600 hover:text-purple-800 underline"
                                    >
                                        ⬇ Tải ảnh kết quả
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ===== THÔNG BÁO LỖI ===== */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                            <span className="text-lg">❌</span>
                            <div>
                                <p className="font-medium">Đã xảy ra lỗi</p>
                                <p className="mt-0.5 text-red-600">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* ===== HƯỚNG DẪN ===== */}
                    {!personPreview && !loading && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-xl mb-4 text-sm">
                            <p className="font-medium mb-1">💡 Để có kết quả tốt nhất:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-blue-600 text-xs">
                                <li>Dùng ảnh chụp thẳng, toàn thân hoặc nửa người</li>
                                <li>Nền ảnh sạch, đủ sáng, không bị mờ</li>
                                <li>Quần áo hiện tại không trùng màu với đồ muốn thử</li>
                                <li>Thời gian xử lý: ~30-60 giây</li>
                            </ul>
                        </div>
                    )}

                    {/* ===== NÚT HÀNH ĐỘNG ===== */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleTryOn}
                            disabled={loading || !personImage}
                            id="btn-virtual-tryon-submit"
                            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                                loading || !personImage
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl active:scale-95"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin inline-block">⏳</span>
                                    Đang xử lý... ({elapsedSec}s)
                                </>
                            ) : resultImage ? (
                                <><span>🔄</span> Thử lại</>
                            ) : (
                                <><span>🪄</span> Thử đồ ngay</>
                            )}
                        </button>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Đóng
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
