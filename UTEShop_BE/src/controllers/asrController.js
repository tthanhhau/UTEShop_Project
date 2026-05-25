import asyncHandler from "../middlewares/asyncHandler.js";
import { transcribeAudio as transcribeWithAsr } from "../services/asrService.js";

const extractTranscript = (payload) => {
    if (!payload) return "";
    if (typeof payload === "string") return payload;
    if (payload.text) return payload.text;
    if (payload.transcript) return payload.transcript;
    if (payload.data?.text) return payload.data.text;
    if (Array.isArray(payload) && payload[0]?.text) return payload[0].text;
    return "";
};

export const transcribeAudio = asyncHandler(async (req, res) => {
    if (!req.file?.buffer) {
        return res.status(400).json({
            success: false,
            message: "Vui long gui audio",
        });
    }

    const language = req.body?.language || req.query?.language || "vi";

    const result = await transcribeWithAsr({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        filename: req.file.originalname,
        language,
    });

    const text = extractTranscript(result)?.trim();

    if (!text) {
        return res.status(502).json({
            success: false,
            message: "ASR tra ve transcript trong",
        });
    }

    return res.json({
        success: true,
        text,
    });
});
