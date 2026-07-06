"""
Giai đoạn 5: Inference với Qwen2.5-VL-3B-Instruct + LoRA adapter.

Ví dụ:
    python scripts/inference_qwen_vl_lora.py \
      --adapter_id your-username/qwen2.5-vl-uteshop-description-lora \
      --image_url "https://res.cloudinary.com/..." \
      --name "Áo thun nam basic" \
      --brand "UteShop"

Nếu muốn chạy base model chưa fine-tune để so sánh:
    python scripts/inference_qwen_vl_lora.py --no_adapter ...
"""

from __future__ import annotations

import argparse
import re
from io import BytesIO
from pathlib import Path
from typing import Optional

import requests
import torch
from PIL import Image
from peft import PeftModel
from transformers import AutoProcessor, BitsAndBytesConfig, Qwen2_5_VLForConditionalGeneration


def cloudinary_force_jpg_url(url: str) -> str:
    url = re.sub(r"\s+", " ", str(url or "")).strip()
    if "res.cloudinary.com" in url and "/upload/" in url and "f_jpg" not in url:
        return url.replace("/upload/", "/upload/f_jpg,q_auto/", 1)
    return url


def is_http_url(value: str) -> bool:
    value = str(value or "").strip().lower()
    return value.startswith("http://") or value.startswith("https://")


def load_image(image_source: str, timeout: int = 20) -> Image.Image:
    """
    Load ảnh cho Qwen-VL từ:
    - HTTP/HTTPS URL, ví dụ Cloudinary.
    - Local file path, ví dụ /kaggle/input/.../image.jpg.

    Hàm này thay cho load_image_from_url để evaluation không bị khóa vào URL.
    """
    image_source = re.sub(r"\s+", " ", str(image_source or "")).strip()
    if not image_source:
        raise ValueError("image_source rỗng. Cần truyền image_url hoặc local image path hợp lệ.")

    if is_http_url(image_source):
        url = cloudinary_force_jpg_url(image_source)
        response = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 UteShop Qwen-VL Inference/1.0"},
            timeout=timeout,
        )
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGB")

    path = Path(image_source)
    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"Không tìm thấy ảnh local: {image_source}")

    return Image.open(path).convert("RGB")


def load_image_from_url(url: str, timeout: int = 20) -> Image.Image:
    """Backward compatible wrapper. Có thể nhận cả URL và local path."""
    return load_image(url, timeout=timeout)


def build_prompt(name: str, brand: str) -> str:
    return f"""Bạn là trợ lý viết mô tả sản phẩm cho website thương mại điện tử bằng tiếng Việt.

Dựa trên ảnh sản phẩm và thông tin sau:
- Tên sản phẩm: {name}
- Thương hiệu: {brand or "Không rõ"}

Hãy viết một đoạn mô tả sản phẩm bằng tiếng Việt khoảng 50–120 từ.

Yêu cầu:
- Văn phong tự nhiên, chuyên nghiệp.
- Phù hợp với website bán hàng thời trang.
- Tập trung vào kiểu dáng, phong cách, mục đích sử dụng và khả năng phối đồ.
- Không bịa thông tin kỹ thuật, chất liệu hoặc công nghệ nếu không thể suy ra từ ảnh hoặc dữ liệu đầu vào.
- Không nhắc rằng mô tả được tạo bởi AI.

Chỉ trả về đoạn mô tả, không thêm tiêu đề."""


def clean_generated_text(text: str) -> str:
    """Hậu xử lý để output sạch hơn cho website."""
    text = re.sub(r"\s+", " ", text or "").strip()

    # Loại một số prefix hay gặp.
    prefixes = [
        "Mô tả sản phẩm:",
        "Mô tả:",
        "Generated description:",
        "Đoạn mô tả:",
    ]
    for prefix in prefixes:
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix):].strip()

    # Không để model tự nhắc AI.
    banned_patterns = [
        r"(?i)\bAI\b",
        r"(?i)trí tuệ nhân tạo",
        r"(?i)được tạo bởi",
        r"(?i)tôi không thể",
        r"(?i)dựa trên ảnh",
    ]
    for pat in banned_patterns:
        text = re.sub(pat, "", text).strip()

    # Cắt nếu model sinh nhiều đoạn/metadata.
    text = text.split("</s>")[0].strip()
    return text


def load_model_and_processor(
    base_model_id: str = "Qwen/Qwen2.5-VL-3B-Instruct",
    adapter_id: Optional[str] = None,
    use_4bit: bool = True,
    max_pixels: int = 512 * 512,
):
    torch_dtype = torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16

    processor = AutoProcessor.from_pretrained(
        adapter_id or base_model_id,
        trust_remote_code=True,
        min_pixels=224 * 224,
        max_pixels=max_pixels,
    )

    quantization_config = None
    if use_4bit:
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch_dtype,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
        )

    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        base_model_id,
        torch_dtype=torch_dtype,
        quantization_config=quantization_config,
        device_map="auto",
        trust_remote_code=True,
    )

    if adapter_id:
        model = PeftModel.from_pretrained(model, adapter_id)
        print(f"Loaded LoRA adapter: {adapter_id}")
    else:
        print("Running base model without LoRA adapter.")

    model.eval()
    return model, processor


@torch.inference_mode()
def generate_product_description(
    image_url: str,
    name: str,
    brand: str,
    model=None,
    processor=None,
    base_model_id: str = "Qwen/Qwen2.5-VL-3B-Instruct",
    adapter_id: Optional[str] = None,
    use_4bit: bool = True,
    max_new_tokens: int = 180,
    temperature: float = 0.3,
    top_p: float = 0.9,
) -> str:
    """
    Hàm inference chính dùng lại trong API.

    Input:
        image_url, name, brand
    Output:
        generated_description tiếng Việt đã hậu xử lý.
    """
    if model is None or processor is None:
        model, processor = load_model_and_processor(
            base_model_id=base_model_id,
            adapter_id=adapter_id,
            use_4bit=use_4bit,
        )

    image = load_image(image_url)
    prompt = build_prompt(name, brand)

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": prompt},
            ],
        }
    ]

    text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = processor(text=[text], images=[image], return_tensors="pt").to(model.device)

    generated_ids = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        do_sample=True,
        temperature=temperature,
        top_p=top_p,
        repetition_penalty=1.12,
        no_repeat_ngram_size=4,
    )

    # Chỉ decode phần token mới.
    input_len = inputs["input_ids"].shape[1]
    new_tokens = generated_ids[:, input_len:]
    output_text = processor.batch_decode(new_tokens, skip_special_tokens=True, clean_up_tokenization_spaces=True)[0]

    return clean_generated_text(output_text)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base_model_id", type=str, default="Qwen/Qwen2.5-VL-3B-Instruct")
    parser.add_argument("--adapter_id", type=str, default=None, help="HF repo/path chứa LoRA adapter.")
    parser.add_argument("--no_adapter", action="store_true", help="Chạy base model chưa fine-tune.")
    parser.add_argument("--image_url", type=str, required=True, help="URL ảnh hoặc local image path.")
    parser.add_argument("--name", type=str, required=True)
    parser.add_argument("--brand", type=str, default="Không rõ")
    parser.add_argument("--no_4bit", action="store_true")
    parser.add_argument("--max_new_tokens", type=int, default=180)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    adapter = None if args.no_adapter else args.adapter_id
    model, processor = load_model_and_processor(
        base_model_id=args.base_model_id,
        adapter_id=adapter,
        use_4bit=not args.no_4bit,
    )
    result = generate_product_description(
        image_url=args.image_url,
        name=args.name,
        brand=args.brand,
        model=model,
        processor=processor,
        adapter_id=adapter,
        use_4bit=not args.no_4bit,
        max_new_tokens=args.max_new_tokens,
    )
    print(result)
