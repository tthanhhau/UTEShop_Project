import os
import json
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from huggingface_hub import hf_hub_download
# pyrefly: ignore [missing-import]
from llama_cpp import Llama

app = FastAPI(title="Ollama-compatible API for UTEShop AI")

# Tự động tải file GGUF từ Hugging Face Model Hub lúc khởi động
HF_MODEL_REPO = os.getenv("HF_MODEL_REPO", "") # Ví dụ: "username/uteshop-ai-gguf"
MODEL_FILENAME = "uteshop-ai-q4_k_m.gguf"
MODEL_PATH = f"./{MODEL_FILENAME}"

llm = None

@app.on_event("startup")
def startup_event():
    global llm
    if not HF_MODEL_REPO:
        print("❌ LỖI: Vui lòng cấu hình biến môi trường HF_MODEL_REPO trên Hugging Face Space.")
        return
        
    print(f"📥 Đang tải mô hình từ {HF_MODEL_REPO}/{MODEL_FILENAME} ...")
    try:
        model_file = hf_hub_download(repo_id=HF_MODEL_REPO, filename=MODEL_FILENAME)
        print(f"✅ Đã tải mô hình xong: {model_file}")
        
        # Load mô hình vào RAM
        print("🧠 Đang nạp mô hình vào bộ nhớ (CPU)...")
        llm = Llama(
            model_path=model_file,
            n_ctx=4096,           # Tăng từ 2048 lên 4096 để tránh tràn ngữ cảnh
            n_threads=2,          # CPU threads (HF Free Space có 2 vCPU)
            verbose=False
        )
        print("🚀 API Server đã sẵn sàng!")
    except Exception as e:
        print(f"❌ Lỗi tải mô hình: {e}")

@app.get("/")
def home():
    return {"message": "Ollama-compatible API for UTEShop AI is running!"}

# Giả lập endpoint /api/tags để Backend (OllamaService.js) health check thành công
@app.get("/api/tags")
def get_tags():
    return {
        "models": [
            {
                "name": "uteshop-ai:latest",
                "modified_at": "2026-05-19T00:00:00Z",
                "size": 4000000000
            }
        ]
    }

# Giả lập endpoint /api/chat của Ollama
@app.post("/api/chat")
async def chat(request: Request):
    global llm
    if llm is None:
        return {
            "model": "uteshop-ai",
            "message": {"role": "assistant", "content": f"🚨 Lỗi Hệ Thống AI: Mô hình chưa được nạp. Vui lòng kiểm tra log trên Hugging Face. (Biến HF_MODEL_REPO hiện tại: '{HF_MODEL_REPO}')"},
            "done": True
        }
        
    try:
        body = await request.json()
    except Exception:
        return {
            "model": "uteshop-ai",
            "message": {"role": "assistant", "content": "🚨 Lỗi: Request không phải là JSON hợp lệ."},
            "done": True
        }
        
    messages = body.get("messages", [])
    stream = body.get("stream", False)
    
    # OllamaService gửi: [{role: "system", content: "..."}, {role: "user", content: "..."}]
    # Chúng ta phải nối lại thành Prompt dạng Alpaca/Qwen mà mô hình đã học
    prompt = ""
    system_msg = ""
    user_msg = ""
    
    for msg in messages:
        if msg["role"] == "system":
            system_msg = msg["content"]
        elif msg["role"] == "user":
            user_msg = msg["content"]
            
    # Format Prompt đúng với chuẩn lúc huấn luyện (train_unsloth.py)
    prompt = f"### Instruction:\n{system_msg}\n\n### Input:\n{user_msg}\n\n### Response:\n"
    
    # Qwen 2.5 stop tokens
    stop_tokens = ["### Input", "### Instruction", "<|endoftext|>", "<|im_end|>"]
    
    try:
        if stream:
            def generate():
                # Gọi mô hình với streaming
                response_iter = llm(
                    prompt,
                    max_tokens=256,
                    stop=stop_tokens,
                    stream=True,
                    temperature=body.get("options", {}).get("temperature", 0.7),
                    top_p=body.get("options", {}).get("top_p", 0.9),
                )
                
                for chunk in response_iter:
                    text = chunk["choices"][0]["text"]
                    # Format kết quả trả về y hệt NDJSON của Ollama
                    result = {
                        "model": body.get("model", "uteshop-ai"),
                        "message": {"role": "assistant", "content": text},
                        "done": False
                    }
                    yield json.dumps(result) + "\n"
                    
                # Đánh dấu kết thúc
                yield json.dumps({"model": body.get("model", "uteshop-ai"), "done": True}) + "\n"
                
            return StreamingResponse(generate(), media_type="application/x-ndjson")
        else:
            # Xử lý non-streaming
            response = llm(
                prompt,
                max_tokens=256,
                stop=stop_tokens,
                temperature=body.get("options", {}).get("temperature", 0.7),
                top_p=body.get("options", {}).get("top_p", 0.9),
            )
            text = response["choices"][0]["text"]
            
            return {
                "model": body.get("model", "uteshop-ai"),
                "message": {"role": "assistant", "content": text},
                "done": True
            }
    except Exception as e:
        import traceback
        print("LỖI CHẠY AI:", traceback.format_exc())
        return {
            "model": body.get("model", "uteshop-ai"),
            "message": {"role": "assistant", "content": f"🚨 Lỗi chạy AI: {str(e)}"},
            "done": True
        }
