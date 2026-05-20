/**
 * ColabAIService.js — Kết nối và gọi ColabAI API cho UTEShop AI Chatbot.
 * Thay thế hoàn toàn Google Gemini API.
 */

const COLAB_AI_BASE_URL = process.env.COLAB_AI_BASE_URL || "http://localhost:11434";
const COLAB_AI_MODEL = process.env.COLAB_AI_MODEL || "uteshop-ai";

class ColabAIService {
  constructor() {
    this.baseUrl = COLAB_AI_BASE_URL;
    this.model = COLAB_AI_MODEL;
  }

  /**
   * Gọi ColabAI chat API (non-streaming).
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
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000), // 120s (Colab GPU khoi dong lan dau co the cham)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ColabAI API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return data.message?.content || "";
    } catch (error) {
      if (error.name === "TimeoutError") {
        console.error("⏱️ HF API timeout (Quá thời gian chờ)");
        throw new Error("AI đang bận, vui lòng thử lại sau.");
      }
      console.error("❌ AI chat error:", error.message);
      throw error;
    }
  }

  /**
   * Gọi ColabAI streaming (cho SSE).
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
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`ColabAI stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // ColabAI trả về NDJSON (mỗi dòng là 1 JSON object)
        const lines = chunk.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
            if (data.done) return;
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Phân tích intent từ tin nhắn user bằng ColabAI.
   * @param {string} message - Tin nhắn user
   * @param {string} contextPrompt - System prompt + context
   * @returns {Object} {intent, filters, message}
   */
  async analyzeIntent(message, contextPrompt) {
    const messages = [
      { role: "system", content: contextPrompt },
      { role: "user", content: message },
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.3 });

      // Parse JSON từ response
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
      console.error("❌ AI analyzeIntent error:", error.message);
      return {
        intent: "error",
        filters: {},
        message: "Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau! ⏳",
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
   * Health check ColabAI.
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
        models,
        hasModel,
        activeModel: this.model,
        url: this.baseUrl,
      };
    } catch (error) {
      return { ok: false, error: error.message, url: this.baseUrl };
    }
  }
}

export default new ColabAIService();
