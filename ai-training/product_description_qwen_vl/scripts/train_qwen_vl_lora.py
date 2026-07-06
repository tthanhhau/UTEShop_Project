"""
Giai đoạn 3: Fine-tune Qwen/Qwen2.5-VL-3B-Instruct bằng QLoRA/LoRA.

Khuyến nghị chạy trên Kaggle Notebook GPU:
- GPU T4/P100: dùng 4-bit QLoRA, batch size 1, gradient accumulation.
- Nếu thiếu VRAM: giảm max_length, max_pixels, tăng gradient_accumulation_steps, bật gradient_checkpointing.

Cài thư viện trên Kaggle:
    !pip install -U "transformers>=4.49.0" accelerate peft bitsandbytes datasets pillow requests qwen-vl-utils safetensors

Chạy:
    !python /kaggle/working/product_description_qwen_vl/scripts/train_qwen_vl_lora.py \
      --train_jsonl /kaggle/input/uteshop-qwen-dataset/train.jsonl \
      --test_jsonl /kaggle/input/uteshop-qwen-dataset/test.jsonl \
      --output_dir /kaggle/working/qwen2.5-vl-uteshop-description-lora \
      --use_4bit

Output adapter:
    adapter_model.safetensors
    adapter_config.json
"""

from __future__ import annotations

import argparse
import gc
import json
import re
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

import requests
import torch
from PIL import Image
from torch.utils.data import Dataset
from transformers import (
    AutoProcessor,
    BitsAndBytesConfig,
    Qwen2_5_VLForConditionalGeneration,
    Trainer,
    TrainingArguments,
)
from peft import LoraConfig, TaskType, get_peft_model, prepare_model_for_kbit_training


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def cloudinary_force_jpg_url(url: str) -> str:
    """Đảm bảo Cloudinary trả ảnh JPG thay vì AVIF/WEBP khó đọc trong một số môi trường."""
    url = normalize_whitespace(url)
    if "res.cloudinary.com" in url and "/upload/" in url and "f_jpg" not in url:
        return url.replace("/upload/", "/upload/f_jpg,q_auto/", 1)
    return url


def load_image_from_url(url: str, timeout: int = 20) -> Image.Image:
    url = cloudinary_force_jpg_url(url)
    headers = {"User-Agent": "Mozilla/5.0 UteShop Qwen-VL Trainer/1.0"}
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    return Image.open(BytesIO(response.content)).convert("RGB")


def build_prompt(name: str, brand: str) -> str:
    return f"""Bạn là trợ lý viết mô tả sản phẩm cho website thương mại điện tử bằng tiếng Việt.

Dựa trên ảnh sản phẩm và thông tin sau:
- Tên sản phẩm: {name}
- Thương hiệu: {brand}

Hãy viết một đoạn mô tả sản phẩm bằng tiếng Việt khoảng 50–120 từ.

Yêu cầu:
- Văn phong tự nhiên, chuyên nghiệp.
- Phù hợp với website bán hàng thời trang.
- Tập trung vào kiểu dáng, phong cách, mục đích sử dụng và khả năng phối đồ.
- Không bịa thông tin kỹ thuật, chất liệu hoặc công nghệ nếu không thể suy ra từ ảnh hoặc dữ liệu đầu vào.
- Không nhắc rằng mô tả được tạo bởi AI."""


class ProductDescriptionDataset(Dataset):
    """Dataset đọc JSONL và tải ảnh Cloudinary lúc train."""

    def __init__(self, jsonl_path: Path):
        self.records = load_jsonl(jsonl_path)

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> dict[str, Any]:
        record = self.records[idx]
        image_url = record["image_url"]
        name = record["name"]
        brand = record.get("brand", "Không rõ") or "Không rõ"
        prompt = record.get("prompt") or build_prompt(name, brand)
        target = record["target_description"]

        image = load_image_from_url(image_url)

        # messages dùng cho apply_chat_template.
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt},
                ],
            },
            {
                "role": "assistant",
                "content": [
                    {"type": "text", "text": target},
                ],
            },
        ]

        return {
            "messages": messages,
            "image": image,
            "prompt": prompt,
            "target_description": target,
        }


@dataclass
class QwenVLDataCollator:
    """
    Data collator cho supervised fine-tuning.

    Ý tưởng:
    - Tạo full_text = chat template gồm user + assistant target.
    - Tạo prompt_text = chat template chỉ gồm user + generation prompt.
    - Tokenize full_text + image.
    - labels = input_ids, nhưng mask phần prompt bằng -100 để loss chỉ tính trên phần assistant.
    """

    processor: Any
    max_length: int = 768
    max_pixels: int = 512 * 512

    def __call__(self, examples: list[dict[str, Any]]) -> dict[str, torch.Tensor]:
        images = [ex["image"] for ex in examples]

        full_texts: list[str] = []
        prompt_texts: list[str] = []

        for ex in examples:
            messages = ex["messages"]
            user_messages = [messages[0]]

            full_text = self.processor.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=False,
            )
            prompt_text = self.processor.apply_chat_template(
                user_messages,
                tokenize=False,
                add_generation_prompt=True,
            )

            full_texts.append(full_text)
            prompt_texts.append(prompt_text)

        model_inputs = self.processor(
            text=full_texts,
            images=images,
            padding=True,
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )

        labels = model_inputs["input_ids"].clone()

        # Mask padding.
        labels[model_inputs["attention_mask"] == 0] = -100

        # Mask phần prompt để model học sinh assistant answer.
        # Với multimodal token, độ dài prompt token có thể xấp xỉ; đây là cách thực tế thường dùng cho SFT.
        prompt_inputs = self.processor(
            text=prompt_texts,
            images=images,
            padding=True,
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )
        for i in range(labels.shape[0]):
            prompt_len = int(prompt_inputs["attention_mask"][i].sum().item())
            labels[i, :prompt_len] = -100

        model_inputs["labels"] = labels
        return model_inputs


def print_trainable_parameters(model: torch.nn.Module) -> None:
    trainable = 0
    total = 0
    for _, param in model.named_parameters():
        total += param.numel()
        if param.requires_grad:
            trainable += param.numel()
    print(f"Trainable params: {trainable:,} / {total:,} ({100 * trainable / total:.4f}%)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_id", type=str, default="Qwen/Qwen2.5-VL-3B-Instruct")
    parser.add_argument("--train_jsonl", type=Path, required=True)
    parser.add_argument("--test_jsonl", type=Path, required=True)
    parser.add_argument("--output_dir", type=Path, default=Path("./qwen2.5-vl-uteshop-description-lora"))
    parser.add_argument("--use_4bit", action="store_true", help="Bật QLoRA 4-bit để giảm VRAM.")
    parser.add_argument("--max_length", type=int, default=768)
    parser.add_argument("--max_pixels", type=int, default=512 * 512)
    parser.add_argument("--epochs", type=float, default=8.0)
    parser.add_argument("--learning_rate", type=float, default=1e-4)
    parser.add_argument("--batch_size", type=int, default=1)
    parser.add_argument("--gradient_accumulation_steps", type=int, default=8)
    parser.add_argument("--lora_r", type=int, default=16)
    parser.add_argument("--lora_alpha", type=int, default=32)
    parser.add_argument("--lora_dropout", type=float, default=0.05)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    torch.manual_seed(args.seed)

    processor = AutoProcessor.from_pretrained(
        args.model_id,
        trust_remote_code=True,
        min_pixels=224 * 224,
        max_pixels=args.max_pixels,
    )

    quantization_config = None
    torch_dtype = torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16

    if args.use_4bit:
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch_dtype,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
        )

    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        args.model_id,
        torch_dtype=torch_dtype,
        quantization_config=quantization_config,
        device_map="auto",
        trust_remote_code=True,
    )

    model.config.use_cache = False
    model.gradient_checkpointing_enable()

    if args.use_4bit:
        model = prepare_model_for_kbit_training(model)

    # Target modules phổ biến trong Qwen2.5-VL attention/MLP.
    # Nếu gặp lỗi tên module, in model.named_modules() rồi điều chỉnh danh sách này.
    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type=TaskType.CAUSAL_LM,
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
    )

    model = get_peft_model(model, lora_config)
    print_trainable_parameters(model)

    train_dataset = ProductDescriptionDataset(args.train_jsonl)
    eval_dataset = ProductDescriptionDataset(args.test_jsonl)
    collator = QwenVLDataCollator(processor=processor, max_length=args.max_length, max_pixels=args.max_pixels)

    training_args = TrainingArguments(
        output_dir=str(args.output_dir),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        lr_scheduler_type="cosine",
        warmup_ratio=0.05,
        weight_decay=0.01,
        logging_steps=1,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        fp16=(torch_dtype == torch.float16),
        bf16=(torch_dtype == torch.bfloat16),
        gradient_checkpointing=True,
        optim="paged_adamw_8bit" if args.use_4bit else "adamw_torch",
        report_to="none",
        remove_unused_columns=False,
        dataloader_num_workers=0,  # requests/PIL ổn định hơn trên Kaggle khi để 0
        seed=args.seed,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        data_collator=collator,
    )

    trainer.train()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    trainer.model.save_pretrained(args.output_dir)
    processor.save_pretrained(args.output_dir)

    gc.collect()
    torch.cuda.empty_cache()

    print("\n===== TRAINING DONE =====")
    print(f"LoRA adapter saved to: {args.output_dir}")
    print("Cần thấy các file: adapter_model.safetensors, adapter_config.json")
    print("Đây là bước fine-tuning thật sự: chỉ cập nhật trọng số LoRA, không full fine-tune toàn bộ base model.")


if __name__ == "__main__":
    main()
