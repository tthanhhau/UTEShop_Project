"""
Giai đoạn 6: FastAPI inference service cho chức năng "Tạo bằng AI".

Endpoint:
    POST /generate-description

Request:
{
  "image_url": "...",
  "name": "...",
  "brand": "..."
}

Response:
{
  "generated_description": "..."
}

Lưu ý triển khai:
- Service này nên chạy riêng trên máy/GPU server/Kaggle demo/HuggingFace Space có GPU.
- Không nên chạy trực tiếp trên Render free/low-memory vì Qwen2.5-VL-3B khá nặng.
- Backend UteShop trên Render chỉ gọi HTTP API này khi người dùng bấm nút "Tạo bằng AI".

Chạy local/GPU server:
    pip install fastapi uvicorn transformers accelerate peft bitsandbytes pillow requests
    set ADAPTER_ID=your-username/qwen2.5-vl-uteshop-description-lora
    uvicorn generate_description_api:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Cho phép import script inference khi chạy file từ thư mục api/.
CURRENT_DIR = Path(__file__).resolve().parent
SCRIPT_DIR = CURRENT_DIR.parent / "scripts"
sys.path.append(str(SCRIPT_DIR))

from inference_qwen_vl_lora import generate_product_description, load_model_and_processor  # noqa: E402


BASE_MODEL_ID = os.getenv("BASE_MODEL_ID", "Qwen/Qwen2.5-VL-3B-Instruct")
ADAPTER_ID = os.getenv("ADAPTER_ID")  # ví dụ: username/qwen2.5-vl-uteshop-description-lora
USE_4BIT = os.getenv("USE_4BIT", "true").lower() == "true"

app = FastAPI(title="UteShop Product Description AI Service", version="1.0.0")

# Admin frontend gọi trực tiếp từ browser sang AI service/ngrok khác origin.
# Nếu không bật CORS, browser sẽ chặn request trước khi endpoint được xử lý,
# làm tưởng như chức năng "Tạo bằng AI" không được gọi.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ALLOW_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None
_processor = None


class GenerateDescriptionRequest(BaseModel):
    image_url: str = Field(..., min_length=5)
    name: str = Field(..., min_length=1)
    brand: Optional[str] = "Không rõ"


class GenerateDescriptionResponse(BaseModel):
    generated_description: str


@app.on_event("startup")
def startup_load_model() -> None:
    """Load model một lần khi service khởi động để request nhanh hơn."""
    global _model, _processor
    _model, _processor = load_model_and_processor(
        base_model_id=BASE_MODEL_ID,
        adapter_id=ADAPTER_ID,
        use_4bit=USE_4BIT,
    )


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "base_model_id": BASE_MODEL_ID,
        "adapter_id": ADAPTER_ID,
        "use_4bit": USE_4BIT,
    }


@app.post("/generate-description", response_model=GenerateDescriptionResponse)
def generate_description(payload: GenerateDescriptionRequest) -> GenerateDescriptionResponse:
    print(
        f"[generate-description] received: name={payload.name!r}, brand={payload.brand!r}, image_url={payload.image_url[:80]!r}",
        flush=True,
    )
    try:
        description = generate_product_description(
            image_url=payload.image_url,
            name=payload.name,
            brand=payload.brand or "Không rõ",
            model=_model,
            processor=_processor,
            base_model_id=BASE_MODEL_ID,
            adapter_id=ADAPTER_ID,
            use_4bit=USE_4BIT,
        )
        return GenerateDescriptionResponse(generated_description=description)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Không thể sinh mô tả: {exc}") from exc
