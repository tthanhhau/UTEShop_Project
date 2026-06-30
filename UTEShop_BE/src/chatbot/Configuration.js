/**
 * Configuration.js — Cấu hình provider AI cho UTEShop Chatbot.
 *
 * KAGGLE ACTIVE:
 * - Mặc định chuyển chatbot sang dùng Kaggle GPU thông qua KAGGLE_AI_BASE_URL.
 *
 * COLAB CODE CŨ - GIỮ LẠI ĐỂ DÙNG KHI CẦN:
 * - Nếu muốn quay lại Google Colab, đổi CHATBOT_AI_PROVIDER=colab
 * - Hoặc dùng lại biến COLAB_AI_BASE_URL/COLAB_AI_MODEL ở ColabAIService.js
 */

export const AI_PROVIDER = (process.env.CHATBOT_AI_PROVIDER || "kaggle").toLowerCase();

export const KAGGLE_AI_BASE_URL =
  process.env.KAGGLE_AI_BASE_URL ||
  // Dán link ngrok Kaggle vào biến môi trường KAGGLE_AI_BASE_URL trên Render/local .env.
  "http://localhost:8000";

export const KAGGLE_AI_MODEL = process.env.KAGGLE_AI_MODEL || "uteshop-ai";

export const COLAB_AI_BASE_URL =
  process.env.COLAB_AI_BASE_URL ||
  // COLAB CODE CŨ - chỉ dùng khi CHATBOT_AI_PROVIDER=colab
  "http://localhost:11434";

export const COLAB_AI_MODEL =
  process.env.COLAB_AI_MODEL ||
  // COLAB CODE CŨ - chỉ dùng khi CHATBOT_AI_PROVIDER=colab
  "uteshop-ai";

export const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000);