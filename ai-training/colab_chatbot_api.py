# ============================================================
# UTEShop AI Chatbot - Google Colab API Server
# ============================================================
# HUONG DAN SU DUNG:
#   1. Mo Google Colab: https://colab.research.google.com
#   2. Tao notebook moi, copy toan bo code nay vao 1 cell
#   3. Runtime -> Change runtime type -> T4 GPU
#   4. Bam Run -> Doi khoang 2-3 phut
#   5. Copy link Ngrok, dan vao bien OLLAMA_BASE_URL tren Render
# ============================================================

# ===================== BUOC 1: CAI DAT THU VIEN =====================
!pip install -q fastapi uvicorn pyngrok huggingface_hub nest-asyncio
!pip install -q llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu122
print("[OK] Da cai dat xong cac thu vien!")

# ===================== BUOC 2: MOUNT GOOGLE DRIVE =====================
from google.colab import drive
drive.mount('/content/drive', force_remount=True)

import os, shutil

# ===================================================================
# QUAN TRONG: Sua lai duong dan nay cho dung voi vi tri file GGUF
# cua ban tren Google Drive!
# ===================================================================
GDRIVE_MODEL_PATH = "/content/drive/MyDrive/UTEShop_AI/output/uteshop-ai-q4_k_m.gguf"
GDRIVE_ZIP_PATH = "/content/drive/MyDrive/UTEShop_AI/output/uteshop-ai-model.zip"
LOCAL_MODEL_PATH = "/content/uteshop-ai-q4_k_m.gguf"

if os.path.exists(GDRIVE_MODEL_PATH):
    print(f"[*] Dang copy model tu Google Drive... (mat khoang 1 phut)")
    shutil.copy2(GDRIVE_MODEL_PATH, LOCAL_MODEL_PATH)
    file_size_gb = os.path.getsize(LOCAL_MODEL_PATH) / (1024**3)
    print(f"[OK] Da copy xong! Kich thuoc: {file_size_gb:.2f} GB")
elif os.path.exists(GDRIVE_ZIP_PATH):
    print(f"[*] Tim thay file ZIP. Dang copy tu Google Drive...")
    LOCAL_ZIP = "/content/model.zip"
    shutil.copy2(GDRIVE_ZIP_PATH, LOCAL_ZIP)
    print(f"[*] Dang giai nen file ZIP (mat khoang 1-2 phut)...")
    import zipfile
    with zipfile.ZipFile(LOCAL_ZIP, 'r') as zip_ref:
        gguf_files = [f for f in zip_ref.namelist() if f.endswith('.gguf')]
        if not gguf_files:
            raise FileNotFoundError("Khong co file .gguf nao trong file ZIP!")
        zip_ref.extract(gguf_files[0], "/content/")
        os.rename(f"/content/{gguf_files[0]}", LOCAL_MODEL_PATH)
    os.remove(LOCAL_ZIP)
    file_size_gb = os.path.getsize(LOCAL_MODEL_PATH) / (1024**3)
    print(f"[OK] Da giai nen xong! Kich thuoc: {file_size_gb:.2f} GB")
else:
    print(f"[ERROR] Khong tim thay file .gguf hay .zip nao tren Drive!")
    print(f"Ban hay KIEM TRA LAI TEN FILE tren Google Drive xem da dung chua.")
    raise FileNotFoundError("Khong tim thay model!")

# ===================== BUOC 3: NAP MODEL VAO GPU =====================
import json
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from llama_cpp import Llama

app = FastAPI(title="UTEShop AI Chatbot API")

print("[*] Dang nap mo hinh AI vao GPU T4...")
llm = Llama(
    model_path=LOCAL_MODEL_PATH,
    n_ctx=4096,
    n_gpu_layers=-1,   # Dung TOAN BO GPU
    n_threads=4,
    verbose=False,
)
print("[OK] Mo hinh AI da san sang tren GPU T4!")

# ===================== BUOC 4: TAO API SERVER =====================
@app.get("/")
def home():
    return {"message": "UTEShop AI Chatbot API - Running on Colab GPU T4!"}

@app.get("/api/tags")
def get_tags():
    return {"models": [{"name": "uteshop-ai:latest", "size": 4000000000}]}

@app.post("/api/chat")
async def chat(request: Request):
    try:
        body = await request.json()
    except:
        return {"model": "uteshop-ai", "message": {"role": "assistant", "content": "Loi request"}, "done": True}

    messages = body.get("messages", [])
    stream = body.get("stream", False)

    system_msg, user_msg = "", ""
    for msg in messages:
        if msg["role"] == "system": system_msg = msg["content"]
        elif msg["role"] == "user": user_msg = msg["content"]

    prompt = f"### Instruction:\n{system_msg}\n\n### Input:\n{user_msg}\n\n### Response:\n"
    stop_tokens = ["### Input", "### Instruction", "<|endoftext|>", "<|im_end|>"]

    try:
        if stream:
            def generate():
                for chunk in llm(prompt, max_tokens=256, stop=stop_tokens, stream=True,
                                 temperature=body.get("options", {}).get("temperature", 0.7),
                                 top_p=body.get("options", {}).get("top_p", 0.9)):
                    yield json.dumps({"model": "uteshop-ai", "message": {"role": "assistant", "content": chunk["choices"][0]["text"]}, "done": False}) + "\n"
                yield json.dumps({"model": "uteshop-ai", "done": True}) + "\n"
            return StreamingResponse(generate(), media_type="application/x-ndjson")
        else:
            response = llm(prompt, max_tokens=256, stop=stop_tokens,
                          temperature=body.get("options", {}).get("temperature", 0.7),
                          top_p=body.get("options", {}).get("top_p", 0.9))
            return {"model": "uteshop-ai", "message": {"role": "assistant", "content": response["choices"][0]["text"]}, "done": True}
    except Exception as e:
        return {"model": "uteshop-ai", "message": {"role": "assistant", "content": f"Loi AI: {str(e)}"}, "done": True}

# ===================== BUOC 5: MO NGROK TUNNEL =====================
from pyngrok import ngrok, conf

# ===================================================================
# NGROK TOKEN - Lay tu https://dashboard.ngrok.com/get-started/your-authtoken
# ===================================================================
NGROK_TOKEN = "3DvYyODT65XNkitRzkb3qebnxo5_72G4M825U1FZi5BTLVFgv"

conf.get_default().auth_token = NGROK_TOKEN
conf.get_default().region = "ap"  # Server Chau A cho nhanh

# Dong tunnel cu neu co
try:
    ngrok.kill()
except:
    pass

public_url = ngrok.connect(8000).public_url

print("\n" + "=" * 60)
print(f"  LINK CHATBOT API: {public_url}")
print("=" * 60)
print(f"\n  Dan link nay vao Render:")
print(f"  COLAB_AI_BASE_URL = {public_url}")
print("\n" + "=" * 60)

# Chay server tren cung luong chinh de khong bi loi CUDA deadlock
import uvicorn
import asyncio

config = uvicorn.Config(app, host="0.0.0.0", port=8000)
server = uvicorn.Server(config)

# Colab (Jupyter) ho tro top-level await
await server.serve()
