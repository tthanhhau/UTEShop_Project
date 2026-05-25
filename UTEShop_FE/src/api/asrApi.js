import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const transcribeAudio = async (audioBlob, { language = "vi" } = {}) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice.webm");
    if (language) {
        formData.append("language", language);
    }

    const token = sessionStorage.getItem("token");

    const response = await axios.post(`${API_URL}/asr/transcribe`, formData, {
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 60000,
    });

    return response.data;
};
