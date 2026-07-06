"""
Giai đoạn 1: Kiểm tra và làm sạch dataset cho bài toán sinh mô tả sản phẩm UteShop.

Input mặc định:
    ai-training/product_description_qwen_vl/dataset/raw_dataset.csv

Output mặc định:
    ai-training/product_description_qwen_vl/dataset/clean_dataset.csv

CSV đầu vào cần có các cột:
    image_url,name,brand,description

Chức năng:
- Kiểm tra cột bắt buộc.
- Loại dòng thiếu image_url/name/description.
- Kiểm tra URL ảnh Cloudinary còn truy cập được không.
- Chuẩn hóa URL Cloudinary sang f_jpg,q_auto để PIL đọc ổn định hơn.
- Tạo target_description từ description nếu chưa có.
- Cảnh báo mô tả quá ngắn/quá dài.
- Rút gọn target_description về khoảng tối đa 120 từ nếu bật --truncate-long.
"""

from __future__ import annotations

import argparse
import re
import time
from io import BytesIO
from pathlib import Path
from typing import Optional

import pandas as pd
import requests
from PIL import Image

REQUIRED_COLUMNS = ["image_url", "name", "brand", "description"]


def normalize_whitespace(text: str) -> str:
    """Chuẩn hóa khoảng trắng trong text."""
    if pd.isna(text):
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()


def word_count(text: str) -> int:
    """Đếm số từ theo khoảng trắng, đủ dùng cho tiếng Việt đã tách bằng dấu cách."""
    return len(normalize_whitespace(text).split())


def cloudinary_force_jpg_url(url: str) -> str:
    """
    Chèn transformation f_jpg,q_auto vào URL Cloudinary.

    Ví dụ:
    https://res.cloudinary.com/demo/image/upload/v123/a.webp
    -> https://res.cloudinary.com/demo/image/upload/f_jpg,q_auto/v123/a.webp

    Nếu URL không phải Cloudinary hoặc đã có f_jpg thì giữ nguyên.
    """
    url = normalize_whitespace(url)
    if "res.cloudinary.com" not in url or "/upload/" not in url:
        return url
    if "f_jpg" in url:
        return url
    return url.replace("/upload/", "/upload/f_jpg,q_auto/", 1)


def check_image_url(url: str, timeout: int = 15, retries: int = 2) -> tuple[bool, Optional[str], Optional[int], Optional[int]]:
    """
    Tải thử ảnh và mở bằng PIL để xác nhận URL hợp lệ.

    Trả về:
        is_valid, error_message, width, height
    """
    headers = {
        "User-Agent": "Mozilla/5.0 UteShop Dataset Cleaner/1.0",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }

    last_error: Optional[str] = None
    for attempt in range(retries + 1):
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            if response.status_code != 200:
                last_error = f"HTTP {response.status_code}"
                time.sleep(0.5 * (attempt + 1))
                continue

            content_type = response.headers.get("Content-Type", "")
            if "image" not in content_type.lower():
                last_error = f"Content-Type không phải ảnh: {content_type}"
                time.sleep(0.5 * (attempt + 1))
                continue

            image = Image.open(BytesIO(response.content)).convert("RGB")
            width, height = image.size
            return True, None, width, height
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
            time.sleep(0.5 * (attempt + 1))

    return False, last_error, None, None


def truncate_to_max_words(text: str, max_words: int = 120) -> str:
    """
    Rút gọn mô tả theo số từ, ưu tiên cắt ở ranh giới câu gần max_words.
    Đây là bước heuristic đơn giản cho proof-of-concept.
    """
    text = normalize_whitespace(text)
    words = text.split()
    if len(words) <= max_words:
        return text

    rough = " ".join(words[:max_words])
    sentence_end_positions = [rough.rfind("."), rough.rfind("!"), rough.rfind("?")]
    cut_pos = max(sentence_end_positions)
    if cut_pos >= 60:
        return rough[: cut_pos + 1].strip()
    return rough.strip() + "..."


def clean_dataset(
    input_csv: Path,
    output_csv: Path,
    check_images: bool = True,
    truncate_long: bool = False,
    min_words: int = 20,
    max_words: int = 160,
) -> pd.DataFrame:
    """Hàm chính làm sạch dataset."""
    if not input_csv.exists():
        raise FileNotFoundError(f"Không tìm thấy file input: {input_csv}")

    df = pd.read_csv(input_csv)
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise ValueError(f"CSV thiếu cột bắt buộc: {missing_columns}. Cần có: {REQUIRED_COLUMNS}")

    # Chuẩn hóa text.
    for col in REQUIRED_COLUMNS:
        df[col] = df[col].apply(normalize_whitespace)

    before = len(df)

    # Loại dòng thiếu dữ liệu cốt lõi. brand có thể thiếu nhưng nên điền Unknown.
    df["brand"] = df["brand"].replace("", "Không rõ")
    df = df[(df["image_url"] != "") & (df["name"] != "") & (df["description"] != "")].copy()

    # Loại trùng lặp cơ bản.
    df = df.drop_duplicates(subset=["image_url", "name", "brand", "description"]).copy()

    # Tạo target_description nếu chưa có.
    if "target_description" not in df.columns:
        df["target_description"] = df["description"]
    else:
        df["target_description"] = df["target_description"].apply(normalize_whitespace)
        df.loc[df["target_description"] == "", "target_description"] = df.loc[
            df["target_description"] == "", "description"
        ]

    df["image_url_original"] = df["image_url"]
    df["image_url"] = df["image_url"].apply(cloudinary_force_jpg_url)

    # Thống kê độ dài.
    df["description_word_count"] = df["description"].apply(word_count)
    df["target_word_count"] = df["target_description"].apply(word_count)
    df["description_quality_note"] = ""

    df.loc[df["target_word_count"] < min_words, "description_quality_note"] += "too_short;"
    df.loc[df["target_word_count"] > max_words, "description_quality_note"] += "too_long;"

    if truncate_long:
        df["target_description"] = df["target_description"].apply(lambda x: truncate_to_max_words(x, 120))
        df["target_word_count"] = df["target_description"].apply(word_count)

    if check_images:
        valid_flags: list[bool] = []
        errors: list[str] = []
        widths: list[Optional[int]] = []
        heights: list[Optional[int]] = []

        for idx, url in enumerate(df["image_url"].tolist(), start=1):
            print(f"[{idx}/{len(df)}] Checking image: {url}")
            ok, err, width, height = check_image_url(url)
            valid_flags.append(ok)
            errors.append(err or "")
            widths.append(width)
            heights.append(height)

        df["image_valid"] = valid_flags
        df["image_error"] = errors
        df["image_width"] = widths
        df["image_height"] = heights

        invalid_count = int((~df["image_valid"]).sum())
        if invalid_count > 0:
            print(f"Cảnh báo: Có {invalid_count} dòng ảnh không truy cập/mở được. Các dòng này sẽ bị loại.")
            df = df[df["image_valid"]].copy()
    else:
        df["image_valid"] = True
        df["image_error"] = ""
        df["image_width"] = None
        df["image_height"] = None

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False, encoding="utf-8-sig")

    print("\n===== DATASET CLEANING SUMMARY =====")
    print(f"Số dòng ban đầu: {before}")
    print(f"Số dòng sau làm sạch: {len(df)}")
    print(f"Output: {output_csv}")
    print("\nPhân bố ghi chú chất lượng description:")
    print(df["description_quality_note"].value_counts(dropna=False))
    print(
        "\nLưu ý: Dataset khoảng 78 dòng là rất nhỏ, phù hợp proof-of-concept. "
        "Kết quả fine-tune có thể overfit và metric tự động chỉ mang tính tham khảo."
    )

    return df


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_csv", type=Path, default=Path("ai-training/product_description_qwen_vl/dataset/raw_dataset.csv"))
    parser.add_argument("--output_csv", type=Path, default=Path("ai-training/product_description_qwen_vl/dataset/clean_dataset.csv"))
    parser.add_argument("--no_check_images", action="store_true", help="Bỏ qua bước kiểm tra URL ảnh để chạy nhanh.")
    parser.add_argument("--truncate_long", action="store_true", help="Rút gọn target_description quá dài về tối đa khoảng 120 từ.")
    parser.add_argument("--min_words", type=int, default=20)
    parser.add_argument("--max_words", type=int, default=160)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    clean_dataset(
        input_csv=args.input_csv,
        output_csv=args.output_csv,
        check_images=not args.no_check_images,
        truncate_long=args.truncate_long,
        min_words=args.min_words,
        max_words=args.max_words,
    )
