"""
Giai đoạn 2: Chuyển clean_dataset.csv thành train.jsonl/test.jsonl cho Qwen2.5-VL.

Mỗi dòng JSONL có:
    image_url, name, brand, prompt, target_description, messages

Trong đó messages dùng format gần với chat/instruction fine-tuning của Qwen2.5-VL:
[
  {
    "role": "user",
    "content": [
      {"type": "image", "image": "<image_url>"},
      {"type": "text", "text": "<prompt>"}
    ]
  },
  {
    "role": "assistant",
    "content": [{"type": "text", "text": "<target_description>"}]
  }
]

Ảnh vẫn nằm trên Cloudinary. Script train sẽ tải ảnh từ image_url khi cần.
"""

from __future__ import annotations

import argparse
import json
import random
import re
from pathlib import Path
from typing import Any

import pandas as pd


PROMPT_TEMPLATE = """Bạn là trợ lý viết mô tả sản phẩm cho website thương mại điện tử bằng tiếng Việt.

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


def normalize_whitespace(text: Any) -> str:
    if pd.isna(text):
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()


IMAGE_COL_PRIORITY = [
    "local_image_path",
    "image_path",
    "path",
    "image_file",
    "file_path",
    "image_url",
    "image_url_original",
    "main_image",
    "product_image",
    "thumbnail",
    "image",
    "images",
    "img_url",
    "image_urls",
    "url",
]


def pick_image_source(row: pd.Series, image_cols: list[str]) -> tuple[str, str]:
    for col in image_cols:
        value = normalize_whitespace(row.get(col, ""))
        if value:
            return value, col
    return "", ""


def make_record(row: pd.Series, image_cols: list[str]) -> dict:
    name = normalize_whitespace(row["name"])
    brand = normalize_whitespace(row.get("brand", "Không rõ")) or "Không rõ"
    image_source, image_source_col = pick_image_source(row, image_cols)
    target_description = normalize_whitespace(row["target_description"])

    prompt = PROMPT_TEMPLATE.format(name=name, brand=brand)

    return {
        # Giữ image_url để tương thích với script train/eval cũ.
        # Giá trị này có thể là HTTP URL hoặc local image path.
        "image_url": image_source,
        "image_source": image_source,
        "image_source_col": image_source_col,
        "name": name,
        "brand": brand,
        "prompt": prompt,
        "target_description": target_description,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image_source},
                    {"type": "text", "text": prompt},
                ],
            },
            {
                "role": "assistant",
                "content": [
                    {"type": "text", "text": target_description},
                ],
            },
        ],
    }


def write_jsonl(records: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")


def prepare_dataset(
    input_csv: Path,
    train_jsonl: Path,
    test_jsonl: Path,
    test_ratio: float = 0.2,
    seed: int = 42,
) -> None:
    if not input_csv.exists():
        raise FileNotFoundError(f"Không tìm thấy file: {input_csv}")

    df = pd.read_csv(input_csv)

    required = ["name", "target_description"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"clean_dataset.csv thiếu cột bắt buộc: {missing}")

    if "brand" not in df.columns:
        df["brand"] = "Không rõ"

    image_cols = [col for col in IMAGE_COL_PRIORITY if col in df.columns]
    if not image_cols:
        raise ValueError(
            "Không tìm thấy cột ảnh nào. Cần có ít nhất một cột trong: "
            + ", ".join(IMAGE_COL_PRIORITY)
        )

    records = [make_record(row, image_cols) for _, row in df.iterrows()]
    records = [r for r in records if r["image_url"] and r["name"] and r["target_description"]]

    if len(records) < 5:
        raise ValueError("Dataset quá ít dòng sau làm sạch. Cần ít nhất vài mẫu để chia train/test.")

    random.seed(seed)
    random.shuffle(records)

    test_size = max(1, int(round(len(records) * test_ratio)))
    test_records = records[:test_size]
    train_records = records[test_size:]

    write_jsonl(train_records, train_jsonl)
    write_jsonl(test_records, test_jsonl)

    print("===== PREPARE QWEN2.5-VL DATASET SUMMARY =====")
    print(f"Tổng số mẫu: {len(records)}")
    print(f"Train: {len(train_records)} -> {train_jsonl}")
    print(f"Test: {len(test_records)} -> {test_jsonl}")
    print("Image columns used by priority:", image_cols)
    print("Format mỗi dòng gồm image_url/image_source, name, brand, prompt, target_description và messages.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_csv", type=Path, default=Path("ai-training/product_description_qwen_vl/dataset/clean_dataset.csv"))
    parser.add_argument("--train_jsonl", type=Path, default=Path("ai-training/product_description_qwen_vl/dataset/train.jsonl"))
    parser.add_argument("--test_jsonl", type=Path, default=Path("ai-training/product_description_qwen_vl/dataset/test.jsonl"))
    parser.add_argument("--test_ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    prepare_dataset(
        input_csv=args.input_csv,
        train_jsonl=args.train_jsonl,
        test_jsonl=args.test_jsonl,
        test_ratio=args.test_ratio,
        seed=args.seed,
    )
