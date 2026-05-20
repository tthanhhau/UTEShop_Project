"""
Download product images referenced by training_data/train.jsonl.

Run:
  python download_training_images.py
"""
import json
import os
from pathlib import Path

from io import BytesIO

import requests
from PIL import Image


DATA_PATH = Path("training_data/train.jsonl")
IMAGE_DIR = Path("training_data/images")
TIMEOUT = 30


def iter_unique_images():
    seen = set()
    with DATA_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            record = json.loads(line)
            image_path = record["image"]
            image_url = record["image_url"]
            if image_path in seen:
                continue
            seen.add(image_path)
            yield image_path, image_url


def download_image(image_path, image_url):
    output_path = Path("training_data") / image_path
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists() and output_path.stat().st_size > 0:
        try:
            with Image.open(output_path) as image:
                image.verify()
            return "skipped"
        except Exception:
            pass

    response = requests.get(
        image_url,
        timeout=TIMEOUT,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()

    with Image.open(BytesIO(response.content)) as image:
        image = image.convert("RGB")
        image.save(output_path, format="JPEG", quality=95)
    return "downloaded-jpeg"


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing {DATA_PATH}. Run export_train_data.py first.")

    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    downloaded = 0
    skipped = 0
    failed = 0

    images = list(iter_unique_images())
    print(f"Found {len(images)} unique images")

    for index, (image_path, image_url) in enumerate(images, start=1):
        try:
            status = download_image(image_path, image_url)
            if status == "downloaded":
                downloaded += 1
            else:
                skipped += 1
            print(f"[{index}/{len(images)}] {status}: {image_path}")
        except Exception as exc:
            failed += 1
            print(f"[{index}/{len(images)}] failed: {image_path} - {exc}")

    print("Done")
    print(f"Downloaded: {downloaded}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    main()
