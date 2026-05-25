import axios from "axios";
import FormData from "form-data";

const ASR_SERVICE_URL = process.env.ASR_SERVICE_URL || "";
const ASR_SERVICE_PATH = process.env.ASR_SERVICE_PATH || "/transcribe";
const ASR_TIMEOUT_MS = Number(process.env.ASR_TIMEOUT_MS || 60000);
const HF_TOKEN = process.env.HF_TOKEN || "";

const buildAsrUrl = () => {
    const base = ASR_SERVICE_URL.replace(/\/+$/, "");
    const path = ASR_SERVICE_PATH.startsWith("/")
        ? ASR_SERVICE_PATH
        : `/${ASR_SERVICE_PATH}`;
    return `${base}${path}`;
};

export const transcribeAudio = async ({ buffer, mimetype, filename, language }) => {
    if (!ASR_SERVICE_URL) {
        throw new Error("ASR_SERVICE_URL is not configured");
    }

    const formData = new FormData();
    formData.append("audio", buffer, {
        filename: filename || "audio.webm",
        contentType: mimetype || "audio/webm",
    });
    if (language) {
        formData.append("language", language);
    }

    const headers = {
        ...formData.getHeaders(),
        ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
    };

    const response = await axios.post(buildAsrUrl(), formData, {
        headers,
        timeout: ASR_TIMEOUT_MS,
    });

    return response.data;
};
