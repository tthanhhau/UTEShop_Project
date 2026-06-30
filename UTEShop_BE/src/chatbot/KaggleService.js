/**
 * KaggleService.js — Kết nối Kaggle GPU API cho UTEShop AI Chatbot.
 *
 * KAGGLE ACTIVE:
 * - Backend sẽ gọi FastAPI chạy trên Kaggle Notebook qua ngrok.
 * - API format giữ giống Colab/Ollama để không phải sửa logic chatbot nhiều.
 *
 * COLAB CODE CŨ:
 * - Không xóa ColabAIService.js.
 * - Nếu muốn quay lại Colab, đặt CHATBOT_AI_PROVIDER=colab.
 */

import {
  AI_REQUEST_TIMEOUT_MS,
  KAGGLE_AI_BASE_URL,
  KAGGLE_AI_MODEL,
} from "./Configuration.js";

class KaggleService {
  constructor() {
    this.baseUrl = KAGGLE_AI_BASE_URL;
    this.model = KAGGLE_AI_MODEL;
  }

  /**
   * Gọi Kaggle chat API non-streaming.
   * @param {Array} messages - [{role: "system"|"user"|"assistant", content: "..."}]
   * @param {Object} options - {temperature, top_p, num_ctx}
   * @returns {string} Response text
   */
  async chat(messages, options = {}) {
    const body = {
      model: this.model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        num_ctx: options.num_ctx ?? 2048,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Kaggle AI API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return data.message?.content || "";
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        console.error("⏱️ Kaggle AI timeout (Quá thời gian chờ)");
        throw new Error("AI Kaggle đang bận, vui lòng thử lại sau.");
      }
      console.error("❌ Kaggle AI chat error:", error.message);
      throw error;
    }
  }

  /**
   * Gọi Kaggle streaming API.
   * Trả về AsyncGenerator của từng chunk text.
   */
  async *chatStream(messages, options = {}) {
    const body = {
      model: this.model,
      messages,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        num_ctx: options.num_ctx ?? 2048,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Kaggle AI stream error ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
            if (data.done) return;
          } catch {
            // Bỏ qua line không phải JSON hợp lệ.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Phân tích intent từ tin nhắn user bằng Kaggle AI.
   */
  async analyzeIntent(message, contextPrompt) {
    const messages = [
      { role: "system", content: contextPrompt },
      { role: "user", content: message },
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.3 });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || "general",
          filters: parsed.filters || {},
          message: parsed.message || response.replace(/```json|```/g, "").trim(),
        };
      }

      return {
        intent: "general",
        filters: {},
        message: response.replace(/```json|```/g, "").trim(),
      };
    } catch (error) {
      console.error("❌ Kaggle AI analyzeIntent error:", error.message);
      return {
        intent: "error",
        filters: {},
        message: "Xin lỗi, hệ thống AI Kaggle đang bận. Vui lòng thử lại sau! ⏳",
      };
    }
  }

  /**
   * Sinh câu trả lời với context từ RAG + product data.
   */
  async generateResponse(userMessage, systemPrompt, ragContext = "", productData = "") {
    let fullContext = systemPrompt;
    if (ragContext) {
      fullContext += `\n\nTHÔNG TIN THAM KHẢO:\n${ragContext}`;
    }
    if (productData) {
      fullContext += `\n\nDỮ LIỆU SẢN PHẨM:\n${productData}`;
    }

    const messages = [
      { role: "system", content: fullContext },
      { role: "user", content: userMessage },
    ];

    return this.chat(messages);
  }

  /**
   * Health check Kaggle AI.
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: { "ngrok-skip-browser-warning": "true" },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };

      const data = await response.json();
      const models = data.models?.map((m) => m.name) || [];
      const hasModel = models.some((m) => m.includes(this.model));

      return {
        ok: true,
        provider: "kaggle",
        models,
        hasModel,
        activeModel: this.model,
        url: this.baseUrl,
      };
    } catch (error) {
      return {
        ok: false,
        provider: "kaggle",
        error: error.message,
        url: this.baseUrl,
      };
    }
  }
}

export default new KaggleService();