"""
Chuyển dataset sản phẩm đã extract cho chatbot sang raw_dataset.csv cho fine-tune Qwen2.5-VL.

Input:
    ai-training/chatbot_llm_assistant/dataset/extracted_products.json

Output:
    ai-training/product_description_qwen_vl/dataset/raw_dataset.csv

Mapping:
    image_url   <- product.images[0]
    name        <- product.name
    brand       <- product.brand
    description <- product.description
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pandas as pd


def normalize_whitespace(text: object) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def cloudinary_force_jpg_url(url: str) -> str:
    url = normalize_whitespace(url)
    if "res.cloudinary.com" in url and "/upload/" in url and "f_jpg" not in url:
        return url.replace("/upload/", "/upload/f_jpg,q_auto/", 1)
    return url


def convert(input_json: Path, output_csv: Path) -> pd.DataFrame:
    if not input_json.exists():
        raise FileNotFoundError(f"Không tìm thấy file input: {input_json}")

    data = json.loads(input_json.read_text(encoding="utf-8"))
    products = data.get("products", [])

    rows: list[dict[str, str]] = []
    skipped = 0

    for product in products:
        images = product.get("images") or []
        image_url = normalize_whitespace(images[0] if images else "")
        name = normalize_whitespace(product.get("name"))
        brand = normalize_whitespace(product.get("brand")) or "Không rõ"
        description = normalize_whitespace(product.get("description"))

        if not image_url or not name or not description:
            skipped += 1
            continue

        rows.append(
            {
                "image_url": cloudinary_force_jpg_url(image_url),
                "name": name,
                "brand": brand,
                "description": description,
            }
        )

    df = pd.DataFrame(rows, columns=["image_url", "name", "brand", "description"])
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False, encoding="utf-8-sig")

    print("===== CONVERT CHATBOT PRODUCTS SUMMARY =====")
    print(f"Input products: {len(products)}")
    print(f"Written rows: {len(df)}")
    print(f"Skipped rows: {skipped}")
    print(f"Output: {output_csv}")

    return df


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input_json",
        type=Path,
        default=Path("ai-training/chatbot_llm_assistant/dataset/extracted_products.json"),
    )
    parser.add_argument(
        "--output_csv",
        type=Path,
        default=Path("ai-training/product_description_qwen_vl/dataset/raw_dataset.csv"),
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    convert(args.input_json, args.output_csv)