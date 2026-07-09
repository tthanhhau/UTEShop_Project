"""
Kaggle Qwen2.5-VL Product Description API - fixed version.

Fix chính:
- Bắt buộc có ảnh đầu vào.
- Validate ảnh bằng Qwen-VL trước khi sinh mô tả.
- Nếu ảnh không phải sản phẩm thời trang thì trả HTTP 400, không sinh mô tả.
- Dùng được cho cả /generate-description và /generate-description-upload.

Cách dùng trên Kaggle:
1. Copy toàn bộ nội dung file này vào 1 cell Kaggle, hoặc upload file và chạy:
   python kaggle_qwen_description_api_fixed.py
2. Đảm bảo Kaggle Secret có NGROK_AUTHTOKEN.
3. Copy URL /generate-description in ra cuối cell vào AI_DESCRIPTION_API_URL của BE Admin.
"""

# ============================================================
# CELL - RUN QWEN2.5-VL PRODUCT DESCRIPTION API ON KAGGLE
# FIXED FULL VERSION WITH FASHION IMAGE VALIDATION
# ============================================================

import os

# Chặn transformers dùng torchvision vì torchvision trên Kaggle hay lệch version với torch,
# gây lỗi: RuntimeError: operator torchvision::nms does not exist
os.environ["TRANSFORMERS_NO_TORCHVISION"] = "1"
os.environ["DISABLE_TRANSFORMERS_TORCHVISION"] = "1"

import sys
import subprocess
import importlib.util

# ============================================================
# CONFIG
# ============================================================

BASE_MODEL_ID = "Qwen/Qwen2.5-VL-3B-Instruct"

# Khuyến nghị để False trên Kaggle hiện tại vì bitsandbytes hay lỗi với torch/cu128.
USE_4BIT = False

# Nếu có HF token thì điền vào đây để tải model ổn định hơn.
HF_TOKEN = ""

# Secret Kaggle của bạn đang đặt tên là NGROK_AUTHTOKEN.
# Nếu đã lưu trong Kaggle Secrets thì để rỗng.
NGROK_AUTHTOKEN = ""

# Port ưu tiên
PREFERRED_PORTS = [8001, 8000, 8002, 8003, 7860]

# Giới hạn dung lượng ảnh upload từ web.
MAX_UPLOAD_SIZE_MB = 10

# Tắt test upload lúc khởi động để tránh chậm/timeout.
# Sau khi API chạy ổn, test upload từ web.
RUN_PUBLIC_UPLOAD_TEST = False

# Bật/tắt kiểm tra ảnh thời trang.
ENABLE_FASHION_IMAGE_VALIDATION = True

print("BASE_MODEL_ID:", BASE_MODEL_ID)
print("USE_4BIT:", USE_4BIT)
print("ENABLE_FASHION_IMAGE_VALIDATION:", ENABLE_FASHION_IMAGE_VALIDATION)

# ============================================================
# AUTO INSTALL / FIX PACKAGES
# ============================================================

print("\n===== CHECKING REQUIRED PACKAGES =====")


def pip_install(*packages):
    cmd = [sys.executable, "-m", "pip", "install", "-q", "-U", *packages]
    print("Running:", " ".join(cmd))
    subprocess.check_call(cmd)


def pip_uninstall(*packages):
    cmd = [sys.executable, "-m", "pip", "uninstall", "-y", *packages]
    print("Running:", " ".join(cmd))
    subprocess.run(cmd, check=False)


def ensure_package(import_name, pip_name=None):
    if pip_name is None:
        pip_name = import_name

    if importlib.util.find_spec(import_name) is None:
        print(f"Installing missing package: {pip_name}")
        pip_install(pip_name)
    else:
        print(f"Package exists: {import_name}")


# torchao trên Kaggle có thể không tương thích với PEFT.
if importlib.util.find_spec("torchao") is not None:
    print("Removing incompatible torchao...")
    pip_uninstall("torchao")

# Các package cần thiết
ensure_package("transformers")
ensure_package("peft")
ensure_package("pyngrok")
ensure_package("fastapi")
ensure_package("uvicorn")
ensure_package("multipart", "python-multipart")
ensure_package("requests")
ensure_package("accelerate")
ensure_package("qwen_vl_utils", "qwen-vl-utils")
ensure_package("safetensors")

if USE_4BIT:
    print("Ensuring bitsandbytes>=0.46.1 ...")
    pip_install("bitsandbytes>=0.46.1")

# ============================================================
# IMPORT LIBRARIES
# ============================================================

print("\n===== IMPORTING LIBRARIES =====")

import re
import time
import base64
import threading
import socket
import gc
from io import BytesIO
from pathlib import Path

import requests
import torch
from PIL import Image

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from pyngrok import ngrok

from peft import PeftModel
from transformers import (
    AutoProcessor,
    Qwen2_5_VLForConditionalGeneration,
)

try:
    from transformers import BitsAndBytesConfig
except Exception:
    BitsAndBytesConfig = None

try:
    from qwen_vl_utils import process_vision_info

    print("qwen_vl_utils imported successfully.")
except Exception as e:
    process_vision_info = None
    print("Warning: qwen_vl_utils import failed:", repr(e))

print("Imports successful.")
print("Pillow:", Image.__version__)

# ============================================================
# GPU CHECK
# ============================================================

print("\n===== GPU CHECK =====")
print("Torch:", torch.__version__)
print("Torch CUDA:", torch.version.cuda)
print("CUDA available:", torch.cuda.is_available())
print("CUDA device count:", torch.cuda.device_count())

if torch.cuda.is_available():
    for i in range(torch.cuda.device_count()):
        print(f"GPU {i}: {torch.cuda.get_device_name(i)}")
    print("VRAM allocated:", round(torch.cuda.memory_allocated() / 1024**3, 2), "GB")
    print("VRAM reserved:", round(torch.cuda.memory_reserved() / 1024**3, 2), "GB")

# ============================================================
# CLEAN OLD PROCESSES / PORTS / NGROK
# ============================================================

print("\n===== CLEANING OLD PROCESSES =====")

try:
    ngrok.kill()
    print("Killed old ngrok tunnels.")
except Exception as e:
    print("ngrok.kill warning:", repr(e))


def release_port(port):
    try:
        subprocess.run(
            f"fuser -k {port}/tcp",
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print(f"Released port {port} if occupied.")
    except Exception as e:
        print(f"Release port {port} warning:", repr(e))


for p in PREFERRED_PORTS:
    release_port(p)

time.sleep(2)

# ============================================================
# FIND FREE PORT
# ============================================================


def is_port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


def select_port():
    for port in PREFERRED_PORTS:
        if is_port_free(port):
            return port

    s = socket.socket()
    s.bind(("", 0))
    port = s.getsockname()[1]
    s.close()
    return port


# ============================================================
# AUTO DETECT FINAL LORA ADAPTER
# - Bỏ qua checkpoint-*
# - Ưu tiên folder có adapter_config.json + adapter_model.safetensors
# ============================================================

print("\n===== AUTO DETECTING FINAL LORA ADAPTER =====")

candidate_roots = [
    Path("/kaggle/input"),
    Path("/kaggle/working"),
]

adapter_candidates = []

for root in candidate_roots:
    if not root.exists():
        continue

    for adapter_config in root.rglob("adapter_config.json"):
        adapter_dir = adapter_config.parent
        adapter_dir_str = str(adapter_dir)

        # Bỏ qua checkpoint giữa quá trình train
        if "checkpoint-" in adapter_dir_str:
            print("Skip checkpoint adapter:", adapter_dir)
            continue

        has_safetensors = (adapter_dir / "adapter_model.safetensors").exists()
        has_bin = (adapter_dir / "adapter_model.bin").exists()
        has_adapter_model = has_safetensors or has_bin

        if has_adapter_model:
            adapter_candidates.append(adapter_dir)
            print("Found final adapter candidate:", adapter_dir)

if not adapter_candidates:
    print("\nAll adapter_config.json found:")
    for p in Path("/kaggle/input").rglob("adapter_config.json"):
        print(" -", p)

    raise RuntimeError(
        "Không tìm thấy final LoRA adapter. "
        "Cần folder có adapter_config.json và adapter_model.safetensors, "
        "đồng thời không nằm trong checkpoint-*."
    )

# Nếu có nhiều candidate, ưu tiên folder tên đúng adapter của bạn
preferred = []

for p in adapter_candidates:
    p_str = str(p)
    if (
        "qwen2.5-vl-uteshop-description-lora" in p_str
        or "qwen2_5-vl-uteshop-description-lora" in p_str
        or "qwen2-5-vl-uteshop-description-lora" in p_str
    ):
        preferred.append(p)

if preferred:
    ADAPTER_DIR = preferred[0]
else:
    ADAPTER_DIR = adapter_candidates[0]

ADAPTER_DIR = str(ADAPTER_DIR)

print("\nUsing FINAL ADAPTER_DIR:", ADAPTER_DIR)

adapter_path = Path(ADAPTER_DIR)

print("adapter_config exists:", (adapter_path / "adapter_config.json").exists())
print("adapter_model.safetensors exists:", (adapter_path / "adapter_model.safetensors").exists())
print("adapter_model.bin exists:", (adapter_path / "adapter_model.bin").exists())

print("\nAdapter files:")
for f in adapter_path.iterdir():
    print(" -", f.name)

# ============================================================
# LOAD MODEL DIRECTLY IN NOTEBOOK
# ============================================================

print("\n===== LOADING MODEL DIRECTLY IN NOTEBOOK =====")

if torch.cuda.is_available():
    torch_dtype = torch.bfloat16
else:
    torch_dtype = torch.float32

print("dtype:", torch_dtype)

print("\nLoading processor...")

try:
    processor = AutoProcessor.from_pretrained(
        ADAPTER_DIR,
        trust_remote_code=True,
        use_fast=True,
    )
    print("Loaded processor from adapter dir.")
except Exception as e:
    print("Load processor from adapter dir failed:", repr(e))
    print("Loading processor from base model...")

    processor_kwargs = {
        "trust_remote_code": True,
        "use_fast": True,
    }

    if HF_TOKEN:
        processor_kwargs["token"] = HF_TOKEN

    processor = AutoProcessor.from_pretrained(
        BASE_MODEL_ID,
        **processor_kwargs,
    )
    print("Loaded processor from base model.")

print("\nLoading base model:", BASE_MODEL_ID)

model_kwargs = {
    "torch_dtype": torch_dtype,
    "device_map": "auto",
    "trust_remote_code": True,
}

if HF_TOKEN:
    model_kwargs["token"] = HF_TOKEN

if USE_4BIT:
    if BitsAndBytesConfig is None:
        raise RuntimeError("USE_4BIT=True nhưng BitsAndBytesConfig không import được.")

    print("Using 4-bit quantization.")
    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch_dtype,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
    )
    model_kwargs["quantization_config"] = quantization_config
else:
    print("Not using 4-bit quantization.")

try:
    base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        BASE_MODEL_ID,
        **model_kwargs,
    )
except ImportError as e:
    err = str(e)
    print("\nBase model load failed:", err)

    if USE_4BIT and "bitsandbytes" in err.lower():
        print("\nRetrying with USE_4BIT=False because bitsandbytes failed...")
        USE_4BIT = False
        model_kwargs.pop("quantization_config", None)

        base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            BASE_MODEL_ID,
            **model_kwargs,
        )
    else:
        raise

print("\nLoading LoRA adapter:", ADAPTER_DIR)

model = PeftModel.from_pretrained(
    base_model,
    ADAPTER_DIR,
    is_trainable=False,
)

model.eval()

print("\nModel loaded successfully.")

if torch.cuda.is_available():
    print("VRAM allocated:", round(torch.cuda.memory_allocated() / 1024**3, 2), "GB")
    print("VRAM reserved:", round(torch.cuda.memory_reserved() / 1024**3, 2), "GB")

# ============================================================
# HELPER FUNCTIONS
# ============================================================


def pil_image_from_base64(image_base64: str):
    if not image_base64:
        return None

    if "," in image_base64 and image_base64.strip().lower().startswith("data:"):
        image_base64 = image_base64.split(",", 1)[1]

    image_bytes = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    return image


def pil_image_from_url(image_url: str):
    if not image_url:
        return None

    response = requests.get(
        image_url,
        timeout=30,
        headers={
            "User-Agent": "Mozilla/5.0 UteShop Qwen-VL Inference/1.0",
            "ngrok-skip-browser-warning": "true",
        },
    )
    response.raise_for_status()

    image = Image.open(BytesIO(response.content)).convert("RGB")
    return image


def safe_text(value):
    if value is None:
        return ""
    return str(value).strip()


def build_prompt(product_name="", category="", brand="", price="", old_description=""):
    product_name = safe_text(product_name)
    category = safe_text(category)
    brand = safe_text(brand) or "Không rõ"
    price = safe_text(price)
    old_description = safe_text(old_description)

    extra_info = []

    if category:
        extra_info.append(f"- Danh mục: {category}")

    if price:
        extra_info.append(f"- Giá: {price}")

    if old_description:
        extra_info.append(f"- Mô tả hiện có: {old_description}")

    extra_info_text = ""
    if extra_info:
        extra_info_text = "\n" + "\n".join(extra_info)

    prompt = f"""Bạn là trợ lý viết mô tả sản phẩm cho website thương mại điện tử bằng tiếng Việt.

Dựa trên ảnh sản phẩm và thông tin sau:
- Tên sản phẩm: {product_name}
- Thương hiệu: {brand}{extra_info_text}

Hãy viết một đoạn mô tả sản phẩm bằng tiếng Việt khoảng 50–120 từ.

Yêu cầu:
- Văn phong tự nhiên, chuyên nghiệp.
- Phù hợp với website bán hàng thời trang.
- Tập trung vào kiểu dáng, phong cách, mục đích sử dụng và khả năng phối đồ.
- Không bịa thông tin kỹ thuật, chất liệu hoặc công nghệ nếu không thể suy ra từ ảnh hoặc dữ liệu đầu vào.
- Không nhắc rằng mô tả được tạo bởi AI.
- Không dùng markdown.
- Không liệt kê bullet.
- Chỉ trả về nội dung mô tả, không giải thích thêm.
- Chỉ dùng tiếng Việt, không trộn tiếng Anh hoặc tiếng Trung."""

    return prompt.strip()


def build_fashion_validation_prompt(product_name="", category="", brand=""):
    product_name = safe_text(product_name)
    category = safe_text(category)
    brand = safe_text(brand)

    return f"""Bạn là hệ thống kiểm duyệt ảnh sản phẩm cho website bán hàng thời trang.

Nhiệm vụ:
Kiểm tra ảnh đầu vào có phải là sản phẩm thời trang hay không.

Sản phẩm thời trang hợp lệ gồm:
- Áo, quần, váy, đầm, áo khoác
- Giày, dép, sneaker
- Túi xách, balo, ví
- Mũ, nón, thắt lưng, kính, phụ kiện thời trang
- Trang phục thể thao, đồng phục, đồ mặc hằng ngày

Không hợp lệ nếu ảnh là:
- Xe, đồ điện tử, đồ ăn, động vật, phong cảnh, nội thất
- Người/đồ vật không liên quan đến sản phẩm thời trang
- Ảnh không thấy rõ sản phẩm thời trang

Thông tin sản phẩm:
- Tên: {product_name}
- Danh mục: {category}
- Thương hiệu: {brand}

Chỉ trả về đúng một trong hai giá trị:
VALID
INVALID"""


def clean_generated_text(text):
    if text is None:
        return ""

    text = str(text).strip()

    prefixes = [
        "Mô tả sản phẩm:",
        "Mô tả:",
        "Description:",
        "Generated description:",
        "generated_description:",
    ]

    for prefix in prefixes:
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix):].strip()

    text = text.replace("```", "").strip()
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


@torch.inference_mode()
def run_qwen_vl_text_generation(
    messages,
    max_new_tokens=220,
    do_sample=True,
    temperature=0.7,
    top_p=0.9,
    repetition_penalty=1.08,
):
    text = processor.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    has_image = any(
        item.get("type") == "image"
        for message in messages
        for item in message.get("content", [])
        if isinstance(item, dict)
    )

    if has_image:
        if process_vision_info is not None:
            image_inputs, video_inputs = process_vision_info(messages)
            inputs = processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            )
        else:
            images = [
                item["image"]
                for message in messages
                for item in message.get("content", [])
                if isinstance(item, dict) and item.get("type") == "image"
            ]
            inputs = processor(
                text=[text],
                images=images,
                padding=True,
                return_tensors="pt",
            )
    else:
        inputs = processor(
            text=[text],
            padding=True,
            return_tensors="pt",
        )

    inputs = inputs.to(model.device)

    generate_kwargs = {
        "max_new_tokens": int(max_new_tokens),
        "do_sample": bool(do_sample),
    }

    if do_sample:
        generate_kwargs.update(
            {
                "temperature": float(temperature),
                "top_p": float(top_p),
                "repetition_penalty": float(repetition_penalty),
            }
        )

    generated_ids = model.generate(
        **inputs,
        **generate_kwargs,
    )

    generated_ids_trimmed = [
        output_ids[len(input_ids):]
        for input_ids, output_ids in zip(inputs.input_ids, generated_ids)
    ]

    output_text = processor.batch_decode(
        generated_ids_trimmed,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    )[0]

    output_text = clean_generated_text(output_text)

    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    return output_text


@torch.inference_mode()
def validate_fashion_image(
    image,
    product_name="",
    category="",
    brand="",
):
    if image is None:
        return False, "Không có ảnh đầu vào."

    prompt = build_fashion_validation_prompt(
        product_name=product_name,
        category=category,
        brand=brand,
    )

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": prompt},
            ],
        }
    ]

    output_text = run_qwen_vl_text_generation(
        messages=messages,
        max_new_tokens=8,
        do_sample=False,
    )

    normalized = re.sub(r"[^A-Z]", "", output_text.upper())

    print("Fashion validation raw output:", repr(output_text))
    print("Fashion validation normalized:", repr(normalized))

    # Quan trọng: kiểm tra INVALID trước vì "INVALID" có chứa "VALID".
    if normalized.startswith("INVALID") or "INVALID" in normalized:
        return False, "Ảnh không phải sản phẩm thời trang."

    if normalized.startswith("VALID") or normalized == "VALID":
        return True, "Ảnh hợp lệ."

    # Nếu model trả lời không đúng format, xử lý an toàn: từ chối để tránh ảnh xe vẫn qua.
    return False, f"Không xác định được ảnh có phải sản phẩm thời trang hay không. Model trả về: {output_text}"


@torch.inference_mode()
def generate_description_internal(
    product_name="",
    category="",
    brand="",
    price="",
    old_description="",
    image_base64=None,
    image_url=None,
    max_new_tokens=220,
):
    image = None

    if image_base64:
        try:
            image = pil_image_from_base64(image_base64)
        except Exception as e:
            print("Decode base64 image failed:", repr(e))
            raise HTTPException(
                status_code=400,
                detail="Ảnh base64 không hợp lệ hoặc không đọc được.",
            )

    if image is None and image_url:
        try:
            image = pil_image_from_url(image_url)
        except Exception as e:
            print("Download image_url failed:", repr(e))
            raise HTTPException(
                status_code=400,
                detail="Không tải được ảnh từ image_url. Vui lòng kiểm tra lại URL ảnh.",
            )

    # FIX 1: Không cho sinh mô tả khi không có ảnh.
    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng cung cấp ảnh sản phẩm để tạo mô tả.",
        )

    # FIX 2: Validate ảnh phải là sản phẩm thời trang trước khi generate.
    if ENABLE_FASHION_IMAGE_VALIDATION:
        is_valid_fashion, validation_message = validate_fashion_image(
            image=image,
            product_name=product_name,
            category=category,
            brand=brand,
        )

        if not is_valid_fashion:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Ảnh không phải sản phẩm thời trang. "
                    "Vui lòng chọn ảnh quần áo, giày dép, túi xách hoặc phụ kiện thời trang."
                ),
            )

        print("Fashion validation passed:", validation_message)

    prompt = build_prompt(
        product_name=product_name,
        category=category,
        brand=brand,
        price=price,
        old_description=old_description,
    )

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": prompt},
            ],
        }
    ]

    output_text = run_qwen_vl_text_generation(
        messages=messages,
        max_new_tokens=max_new_tokens,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.08,
    )

    return output_text


# ============================================================
# QUICK MODEL TEST BEFORE API
# ============================================================

print("\n===== QUICK MODEL TEST BEFORE API =====")

try:
    # Không test text-only nữa vì API đã bắt buộc có ảnh.
    test_img = Image.new("RGB", (384, 384), color=(235, 235, 235))
    test_description = generate_description_internal(
        product_name="áo thun basic",
        category="Áo",
        brand="UTEShop",
        price="199000",
        old_description="",
        image_base64=None,
        image_url=None,
        max_new_tokens=80,
    )

    print("Generated test description:")
    print(test_description)
except HTTPException as e:
    # Ảnh test trống có thể bị validator từ chối, không xem là lỗi khởi động nghiêm trọng.
    print("Quick model test returned HTTPException:", e.detail)
except Exception as e:
    print("Quick model test failed:", repr(e))
    raise

# ============================================================
# CREATE FASTAPI APP
# ============================================================

print("\n===== CREATING FASTAPI APP =====")

app = FastAPI(
    title="UTEShop AI Product Description API",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateDescriptionRequest(BaseModel):
    product_name: str = Field(default="")
    name: str = Field(default="")
    category: str = Field(default="")
    brand: str = Field(default="")
    price: str | int | float = Field(default="")
    old_description: str = Field(default="")
    description: str = Field(default="")
    image_base64: str | None = Field(default=None)
    image_url: str | None = Field(default=None)
    max_new_tokens: int = Field(default=220)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "UTEShop AI Product Description API is running.",
        "json_endpoint": "/generate-description",
        "upload_endpoint": "/generate-description-upload",
        "fashion_validation": ENABLE_FASHION_IMAGE_VALIDATION,
        "note": "API bắt buộc ảnh đầu vào là sản phẩm thời trang.",
    }


@app.get("/health")
def health():
    gpu_name = None
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)

    return {
        "status": "ok",
        "base_model_id": BASE_MODEL_ID,
        "adapter_dir": ADAPTER_DIR,
        "use_4bit": USE_4BIT,
        "cuda": torch.cuda.is_available(),
        "gpu": gpu_name,
        "fashion_validation": ENABLE_FASHION_IMAGE_VALIDATION,
    }


@app.options("/generate-description")
def generate_description_options():
    return JSONResponse(
        content={"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )


@app.post("/generate-description")
def generate_description(payload: GenerateDescriptionRequest):
    try:
        product_name = payload.product_name or payload.name
        old_description = payload.old_description or payload.description

        generated_description = generate_description_internal(
            product_name=product_name,
            category=payload.category,
            brand=payload.brand,
            price=payload.price,
            old_description=old_description,
            image_base64=payload.image_base64,
            image_url=payload.image_url,
            max_new_tokens=payload.max_new_tokens,
        )

        return {
            "generated_description": generated_description,
            "used_image_input": bool(payload.image_base64 or payload.image_url),
            "input_type": "json_base64_or_url",
            "fashion_validation": "passed" if ENABLE_FASHION_IMAGE_VALIDATION else "disabled",
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Generate error:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@app.options("/generate-description-upload")
def generate_description_upload_options():
    return JSONResponse(
        content={"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )


@app.post("/generate-description-upload")
async def generate_description_upload(
    image: UploadFile | None = File(default=None),
    product_name: str = Form(default=""),
    name: str = Form(default=""),
    category: str = Form(default=""),
    brand: str = Form(default=""),
    price: str = Form(default=""),
    old_description: str = Form(default=""),
    description: str = Form(default=""),
    max_new_tokens: int = Form(default=220),
):
    """
    Endpoint dành cho frontend upload ảnh từ máy bằng FormData.

    Frontend gửi multipart/form-data:
    - image: file ảnh jpg/png/webp
    - product_name hoặc name
    - category
    - brand
    - price
    - old_description hoặc description
    - max_new_tokens
    """
    try:
        product_name_final = product_name or name
        old_description_final = old_description or description

        image_base64 = None
        used_image_input = False
        upload_filename = None
        upload_content_type = None
        upload_size_bytes = 0

        if image is not None:
            upload_filename = image.filename
            upload_content_type = image.content_type
            image_bytes = await image.read()
            upload_size_bytes = len(image_bytes or b"")

            if upload_size_bytes > 0:
                max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
                if upload_size_bytes > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Ảnh quá lớn. Dung lượng tối đa là {MAX_UPLOAD_SIZE_MB}MB.",
                    )

                try:
                    Image.open(BytesIO(image_bytes)).convert("RGB")
                except Exception as e:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File upload không phải ảnh hợp lệ: {repr(e)}",
                    )

                image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                used_image_input = True

        generated_description = generate_description_internal(
            product_name=product_name_final,
            category=category,
            brand=brand,
            price=price,
            old_description=old_description_final,
            image_base64=image_base64,
            image_url=None,
            max_new_tokens=max_new_tokens,
        )

        return {
            "generated_description": generated_description,
            "used_image_input": used_image_input,
            "input_type": "multipart_upload",
            "filename": upload_filename,
            "content_type": upload_content_type,
            "upload_size_bytes": upload_size_bytes,
            "fashion_validation": "passed" if ENABLE_FASHION_IMAGE_VALIDATION else "disabled",
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Generate upload error:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# START UVICORN IN BACKGROUND THREAD
# ============================================================

print("\n===== STARTING UVICORN IN BACKGROUND THREAD =====")

import uvicorn

PORT = select_port()
print("Selected PORT:", PORT)


def run_server():
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level="info",
    )


server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

time.sleep(8)

# ============================================================
# TEST LOCAL HEALTH
# ============================================================

print("Testing local /health...")

local_health_url = f"http://127.0.0.1:{PORT}/health"

try:
    r = requests.get(local_health_url, timeout=30)
    print("Local health status:", r.status_code)
    print(r.text)
except Exception as e:
    print("Local health failed:", repr(e))
    raise

# ============================================================
# LOAD NGROK TOKEN
# ============================================================

print("\n===== LOADING NGROK TOKEN =====")


def mask_token(token):
    if not token:
        return ""
    token = str(token).strip()
    if len(token) <= 10:
        return "***"
    return token[:6] + "..." + token[-4:]


NGROK_AUTHTOKEN = str(NGROK_AUTHTOKEN or "").strip()

try:
    from kaggle_secrets import UserSecretsClient

    user_secrets = UserSecretsClient()

    print("Trying Kaggle Secrets...")

    for secret_name in [
        "NGROK_AUTHTOKEN",
        "NGROK_AUTH_TOKEN",
        "NGROK_TOKEN",
        "ngrok_token",
    ]:
        if NGROK_AUTHTOKEN:
            break

        try:
            value = user_secrets.get_secret(secret_name)
            value = str(value or "").strip()

            if value:
                NGROK_AUTHTOKEN = value
                print(f"Found ngrok token in Kaggle Secret: {secret_name}")
                print("Token preview:", mask_token(NGROK_AUTHTOKEN))
                break
            else:
                print(f"Secret {secret_name} is empty.")
        except Exception as e:
            print(f"Secret {secret_name} not found or not accessible:", repr(e))

except Exception as e:
    print("Kaggle secrets not available:", repr(e))

if NGROK_AUTHTOKEN:
    ngrok.set_auth_token(NGROK_AUTHTOKEN)
    print("Ngrok token set.")
else:
    raise RuntimeError(
        "No ngrok token found. "
        "Hãy kiểm tra Kaggle Secret tên NGROK_AUTHTOKEN hoặc dán token vào biến NGROK_AUTHTOKEN."
    )

# ============================================================
# START NGROK
# ============================================================

print("\n===== STARTING NGROK =====")

try:
    public_tunnel = ngrok.connect(PORT, "http")
    public_base_url = public_tunnel.public_url
except TypeError:
    public_tunnel = ngrok.connect(addr=PORT, proto="http")
    public_base_url = public_tunnel.public_url

generate_url = f"{public_base_url}/generate-description"
generate_upload_url = f"{public_base_url}/generate-description-upload"
health_url = f"{public_base_url}/health"

print("\n" + "=" * 60)
print("AI API READY")
print("=" * 60)
print("Base URL:")
print(public_base_url)
print("\nEndpoint JSON/base64/url:")
print(generate_url)
print("\nEndpoint upload ảnh từ máy bằng FormData:")
print(generate_upload_url)
print("\nHealth:")
print(health_url)
print("\nFashion validation:")
print("ENABLED" if ENABLE_FASHION_IMAGE_VALIDATION else "DISABLED")
print("=" * 60)

# ============================================================
# TEST PUBLIC HEALTH
# ============================================================

print("\n===== TESTING PUBLIC HEALTH =====")

try:
    r = requests.get(
        health_url,
        timeout=60,
        headers={
            "ngrok-skip-browser-warning": "true",
        },
    )
    print("Public health status:", r.status_code)
    print(r.text)
except Exception as e:
    print("Public health failed:", repr(e))

# ============================================================
# TEST CORS PREFLIGHT
# ============================================================

print("\n===== TESTING CORS PREFLIGHT =====")

try:
    r = requests.options(
        generate_url,
        timeout=60,
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
            "ngrok-skip-browser-warning": "true",
        },
    )
    print("CORS preflight status:", r.status_code)
    print("Access-Control-Allow-Origin:", r.headers.get("access-control-allow-origin"))
    print("Access-Control-Allow-Methods:", r.headers.get("access-control-allow-methods"))
    print("Access-Control-Allow-Headers:", r.headers.get("access-control-allow-headers"))
except Exception as e:
    print("CORS preflight failed:", repr(e))

print("\n===== TESTING CORS PREFLIGHT FOR UPLOAD ENDPOINT =====")

try:
    r = requests.options(
        generate_upload_url,
        timeout=60,
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
            "ngrok-skip-browser-warning": "true",
        },
    )
    print("Upload CORS preflight status:", r.status_code)
    print("Access-Control-Allow-Origin:", r.headers.get("access-control-allow-origin"))
    print("Access-Control-Allow-Methods:", r.headers.get("access-control-allow-methods"))
    print("Access-Control-Allow-Headers:", r.headers.get("access-control-allow-headers"))
except Exception as e:
    print("Upload CORS preflight failed:", repr(e))

# ============================================================
# TEST API ENDPOINT JSON WITHOUT IMAGE - MUST RETURN 400
# ============================================================

print("\n===== TESTING API ENDPOINT JSON WITHOUT IMAGE - EXPECT 400 =====")

try:
    test_payload = {
        "product_name": "quần jean",
        "category": "Quần",
        "brand": "Nike",
        "price": "80000",
        "old_description": "",
        "max_new_tokens": 180,
    }

    r = requests.post(
        generate_url,
        json=test_payload,
        timeout=120,
        headers={
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
        },
    )

    print("Status:", r.status_code)
    print(r.text)

except Exception as e:
    print("Public API test failed:", repr(e))

# ============================================================
# OPTIONAL TEST UPLOAD ENDPOINT WITH GENERATED IMAGE
# ============================================================

print("\n===== TESTING API UPLOAD ENDPOINT =====")

if RUN_PUBLIC_UPLOAD_TEST:
    try:
        test_img = Image.new("RGB", (384, 384), color=(235, 235, 235))
        img_buffer = BytesIO()
        test_img.save(img_buffer, format="JPEG")
        img_buffer.seek(0)

        files = {
            "image": ("test_product.jpg", img_buffer.getvalue(), "image/jpeg")
        }
        data = {
            "product_name": "áo thun basic",
            "category": "Áo",
            "brand": "UTEShop",
            "price": "199000",
            "old_description": "",
            "max_new_tokens": "180",
        }

        r = requests.post(
            generate_upload_url,
            files=files,
            data=data,
            timeout=180,
            headers={
                "ngrok-skip-browser-warning": "true",
            },
        )

        print("Upload endpoint status:", r.status_code)
        print(r.text)

    except Exception as e:
        print("Public upload API test failed:", repr(e))
else:
    print("Skipped upload endpoint test because RUN_PUBLIC_UPLOAD_TEST=False.")

# ============================================================
# FINAL URL
# ============================================================

print("\n" + "=" * 80)
print("COPY URL NÀY NẾU WEB GỬI JSON/base64/image_url:")
print(generate_url)
print("\nCOPY URL NÀY NẾU WEB UPLOAD ẢNH TỪ MÁY BẰNG FormData:")
print(generate_upload_url)
print("=" * 80)

print("\nAPI is running. Keep this Kaggle notebook session alive.")