import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

subprocess.check_call([
    sys.executable,
    "-m",
    "pip",
    "install",
    "-q",
    "fastapi",
    "uvicorn",
    "pyngrok",
    "huggingface_hub",
    "nest-asyncio",
])

# Kaggle Python 3.12 thuong bi loi khi build llama-cpp-python tu source.
# Vi vay uu tien cai prebuilt CUDA wheel tu abetlen de khong phai build wheel.
# Neu CUDA wheel khong cai duoc thi fallback sang CPU wheel de notebook van chay duoc.
def pip_install(args, env=None):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *args], env=env)


llama_installed = False
cuda_wheel_indexes = [
    "https://abetlen.github.io/llama-cpp-python/whl/cu124",
    "https://abetlen.github.io/llama-cpp-python/whl/cu122",
    "https://abetlen.github.io/llama-cpp-python/whl/cu121",
]

for wheel_index in cuda_wheel_indexes:
    try:
        print(f"[*] Dang cai llama-cpp-python CUDA wheel tu: {wheel_index}")
        pip_install([
            "--upgrade",
            "--force-reinstall",
            "llama-cpp-python",
            "--extra-index-url",
            wheel_index,
        ])
        llama_installed = True
        print("[OK] Da cai llama-cpp-python CUDA wheel!")
        break
    except subprocess.CalledProcessError:
        print(f"[WARN] Khong cai duoc CUDA wheel tu {wheel_index}, thu index khac...")

if not llama_installed:
    print("[WARN] Khong cai duoc CUDA wheel. Fallback sang CPU wheel.")
    print("[WARN] CPU wheel co the cham hon GPU, nhung giup tranh loi build wheel tren Kaggle.")
    pip_install([
        "--upgrade",
        "--force-reinstall",
        "llama-cpp-python",
    ])

print("[OK] Da cai dat xong cac thu vien cho Kaggle!")

# -------------------------------------------------------------------
# COLAB CODE CU - DA COMMENT LAI, KHONG XOA
# Khi copy code nay sang Google Colab co the dung lai lenh magic ben duoi.
# -------------------------------------------------------------------
# !pip install -q fastapi uvicorn pyngrok huggingface_hub nest-asyncio
# !pip install -q llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu122

# ===================== BUOC 2: LAY MODEL TU KAGGLE INPUT =====================

# ===================================================================
# KAGGLE ACTIVE CONFIG:
# - Neu upload model thanh Kaggle Dataset, duong dan se nam trong /kaggle/input/<ten-dataset>/
# - Co the override bang bien moi truong KAGGLE_MODEL_PATH neu can.
# ===================================================================
KAGGLE_INPUT_ROOT = Path("/kaggle/input")
KAGGLE_WORKING_ROOT = Path("/kaggle/working")
MODEL_FILE_NAME = "uteshop-ai-q4_k_m.gguf"
MODEL_ZIP_NAME = "uteshop-ai-model.zip"

KAGGLE_MODEL_PATH = "/kaggle/input/datasets/toohau/chatbot-uteshop/content/final_gguf/uteshop-ai-q4_k_m.gguf"
LOCAL_MODEL_PATH = str(KAGGLE_WORKING_ROOT / MODEL_FILE_NAME)


def find_first_file(root: Path, file_name: str):
    if not root.exists():
        return None
    matches = list(root.rglob(file_name))
    return matches[0] if matches else None


if KAGGLE_MODEL_PATH and os.path.exists(KAGGLE_MODEL_PATH):
    print(f"[*] Dang copy model tu KAGGLE_MODEL_PATH: {KAGGLE_MODEL_PATH}")
    shutil.copy2(KAGGLE_MODEL_PATH, LOCAL_MODEL_PATH)
elif (model_path := find_first_file(KAGGLE_INPUT_ROOT, MODEL_FILE_NAME)):
    print(f"[*] Dang copy model tu Kaggle Input: {model_path}")
    shutil.copy2(model_path, LOCAL_MODEL_PATH)
elif (zip_path := find_first_file(KAGGLE_INPUT_ROOT, MODEL_ZIP_NAME)):
    print(f"[*] Tim thay file ZIP trong Kaggle Input: {zip_path}")
    local_zip = KAGGLE_WORKING_ROOT / "model.zip"
    shutil.copy2(zip_path, local_zip)

    print("[*] Dang giai nen file ZIP...")
    with zipfile.ZipFile(local_zip, "r") as zip_ref:
        gguf_files = [f for f in zip_ref.namelist() if f.endswith(".gguf")]
        if not gguf_files:
            raise FileNotFoundError("Khong co file .gguf nao trong file ZIP!")

        extracted_name = gguf_files[0]
        zip_ref.extract(extracted_name, KAGGLE_WORKING_ROOT)

        extracted_path = KAGGLE_WORKING_ROOT / extracted_name
        shutil.move(str(extracted_path), LOCAL_MODEL_PATH)

    os.remove(local_zip)
else:
    print("[ERROR] Khong tim thay model .gguf hoac .zip trong /kaggle/input!")
    print("Hay Add Input dataset chua file uteshop-ai-q4_k_m.gguf hoac uteshop-ai-model.zip.")
    raise FileNotFoundError("Khong tim thay model tren Kaggle Input!")

file_size_gb = os.path.getsize(LOCAL_MODEL_PATH) / (1024**3)
print(f"[OK] Model san sang tai: {LOCAL_MODEL_PATH}")
print(f"[OK] Kich thuoc: {file_size_gb:.2f} GB")

# -------------------------------------------------------------------
# COLAB CODE CU - DA COMMENT LAI, KHONG XOA
# Dung lai block nay neu chay tren Google Colab va model nam tren Google Drive.
# -------------------------------------------------------------------
# from google.colab import drive
# drive.mount('/content/drive', force_remount=True)
#
# import os, shutil
#
# GDRIVE_MODEL_PATH = "/content/drive/MyDrive/UTEShop_AI/output/uteshop-ai-q4_k_m.gguf"
# GDRIVE_ZIP_PATH = "/content/drive/MyDrive/UTEShop_AI/output/uteshop-ai-model.zip"
# LOCAL_MODEL_PATH = "/content/uteshop-ai-q4_k_m.gguf"
#
# if os.path.exists(GDRIVE_MODEL_PATH):
#     print(f"[*] Dang copy model tu Google Drive... (mat khoang 1 phut)")
#     shutil.copy2(GDRIVE_MODEL_PATH, LOCAL_MODEL_PATH)
#     file_size_gb = os.path.getsize(LOCAL_MODEL_PATH) / (1024**3)
#     print(f"[OK] Da copy xong! Kich thuoc: {file_size_gb:.2f} GB")
# elif os.path.exists(GDRIVE_ZIP_PATH):
#     print(f"[*] Tim thay file ZIP. Dang copy tu Google Drive...")
#     LOCAL_ZIP = "/content/model.zip"
#     shutil.copy2(GDRIVE_ZIP_PATH, LOCAL_ZIP)
#     print(f"[*] Dang giai nen file ZIP (mat khoang 1-2 phut)...")
#     import zipfile
#     with zipfile.ZipFile(LOCAL_ZIP, 'r') as zip_ref:
#         gguf_files = [f for f in zip_ref.namelist() if f.endswith('.gguf')]
#         if not gguf_files:
#             raise FileNotFoundError("Khong co file .gguf nao trong file ZIP!")
#         zip_ref.extract(gguf_files[0], "/content/")
#         os.rename(f"/content/{gguf_files[0]}", LOCAL_MODEL_PATH)
#     os.remove(LOCAL_ZIP)
#     file_size_gb = os.path.getsize(LOCAL_MODEL_PATH) / (1024**3)
#     print(f"[OK] Da giai nen xong! Kich thuoc: {file_size_gb:.2f} GB")
# else:
#     print(f"[ERROR] Khong tim thay file .gguf hay .zip nao tren Drive!")
#     print(f"Ban hay KIEM TRA LAI TEN FILE tren Google Drive xem da dung chua.")
#     raise FileNotFoundError("Khong tim thay model!")

# ===================== BUOC 3: NAP MODEL VAO GPU =====================
import json
import nest_asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from llama_cpp import Llama

nest_asyncio.apply()

app = FastAPI(title="UTEShop AI Chatbot API - Kaggle")

print("[*] Dang nap mo hinh AI vao GPU Kaggle...")
llm = Llama(
    model_path=LOCAL_MODEL_PATH,
    n_ctx=4096,
    n_gpu_layers=-1,  # Dung TOAN BO GPU neu llama-cpp-python build CUDA thanh cong
    n_threads=4,
    verbose=False,
)
print("[OK] Mo hinh AI da san sang tren GPU Kaggle!")

# ===================== BUOC 4: TAO API SERVER =====================
@app.get("/")
def home():
    return {"message": "UTEShop AI Chatbot API - Running on Kaggle GPU!"}


@app.get("/api/tags")
def get_tags():
    return {"models": [{"name": "uteshop-ai:latest", "size": 4000000000}]}


@app.post("/api/chat")
async def chat(request: Request):
    try:
        body = await request.json()
    except Exception:
        return {
            "model": "uteshop-ai",
            "message": {"role": "assistant", "content": "Loi request"},
            "done": True,
        }

    messages = body.get("messages", [])
    stream = body.get("stream", False)

    system_msg, user_msg = "", ""
    for msg in messages:
        if msg.get("role") == "system":
            system_msg = msg.get("content", "")
        elif msg.get("role") == "user":
            user_msg = msg.get("content", "")

    prompt = f"### Instruction:\n{system_msg}\n\n### Input:\n{user_msg}\n\n### Response:\n"
    stop_tokens = ["### Input", "### Instruction", "<|endoftext|>", "<|im_end|>"]

    try:
        if stream:
            def generate():
                for chunk in llm(
                    prompt,
                    max_tokens=256,
                    stop=stop_tokens,
                    stream=True,
                    temperature=body.get("options", {}).get("temperature", 0.7),
                    top_p=body.get("options", {}).get("top_p", 0.9),
                ):
                    yield json.dumps({
                        "model": "uteshop-ai",
                        "message": {
                            "role": "assistant",
                            "content": chunk["choices"][0]["text"],
                        },
                        "done": False,
                    }) + "\n"
                yield json.dumps({"model": "uteshop-ai", "done": True}) + "\n"

            return StreamingResponse(generate(), media_type="application/x-ndjson")

        response = llm(
            prompt,
            max_tokens=256,
            stop=stop_tokens,
            temperature=body.get("options", {}).get("temperature", 0.7),
            top_p=body.get("options", {}).get("top_p", 0.9),
        )
        return {
            "model": "uteshop-ai",
            "message": {"role": "assistant", "content": response["choices"][0]["text"]},
            "done": True,
        }
    except Exception as e:
        return {
            "model": "uteshop-ai",
            "message": {"role": "assistant", "content": f"Loi AI: {str(e)}"},
            "done": True,
        }

# ===================== BUOC 5: MO NGROK TUNNEL =====================
from pyngrok import conf, ngrok

# ===================================================================
# NGROK TOKEN - Lay tu https://dashboard.ngrok.com/get-started/your-authtoken
# Khuyen nghi tren Kaggle: luu token vao Kaggle Secrets ten NGROK_TOKEN
# hoac sua truc tiep bien fallback ben duoi.
# ===================================================================
NGROK_TOKEN = os.environ.get("NGROK_TOKEN", "3DvYyODT65XNkitRzkb3qebnxo5_72G4M825U1FZi5BTLVFgv")
NGROK_DOMAIN = os.environ.get("NGROK_DOMAIN", "lure-reprint-october.ngrok-free.dev")

conf.get_default().auth_token = NGROK_TOKEN
conf.get_default().region = "ap"  # Server Chau A cho nhanh

try:
    ngrok.kill()
except Exception:
    pass

if NGROK_DOMAIN:
    public_url = ngrok.connect(8000, domain=NGROK_DOMAIN).public_url
else:
    public_url = ngrok.connect(8000).public_url

print("\n" + "=" * 60)
print(f"  LINK CHATBOT API KAGGLE: {public_url}")
print("=" * 60)
print("\n  Dan link nay vao Render/backend:")
print(f"  KAGGLE_AI_BASE_URL = {public_url}")
print("\n  Neu backend van dung ten bien cu thi co the tam thoi dan vao:")
print(f"  COLAB_AI_BASE_URL = {public_url}")
print("\n" + "=" * 60)

# Chay server tren Kaggle/Jupyter event loop.
# Khong dung server.run() vi uvicorn ban moi goi asyncio.run(..., loop_factory=...)
# va co the xung dot voi nest_asyncio trong Kaggle Notebook.
import asyncio
import uvicorn

config = uvicorn.Config(app, host="0.0.0.0", port=8000, loop="asyncio")
server = uvicorn.Server(config)

loop = asyncio.get_event_loop()
loop.run_until_complete(server.serve())