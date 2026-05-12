"""
Export product image-caption pairs for CLIP fine-tuning.

Output:
  training_data/train.json
  training_data/train.jsonl
"""
import json
import os
import re
from datetime import UTC, datetime

from bson import ObjectId
from pymongo import MongoClient

try:
    from dotenv import load_dotenv

    load_dotenv()
    load_dotenv(os.path.join("..", ".env"))
except ImportError:
    pass


OUTPUT_DIR = "training_data"
TRAIN_JSON = os.path.join(OUTPUT_DIR, "train.json")
TRAIN_JSONL = os.path.join(OUTPUT_DIR, "train.jsonl")
TRAIN_META = os.path.join(OUTPUT_DIR, "train_meta.json")


def get_database_name(uri):
    uri_without_query = uri.split("?")[0]
    db_name = uri_without_query.rsplit("/", 1)[-1]
    return db_name or "uteshop"


def clean_text(value):
    if value is None:
        return ""
    text = str(value)
    text = repair_mojibake(text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def mojibake_score(text):
    markers = ("Ã", "Â", "Ä", "Æ", "á»", "áº", "â€", "ðŸ")
    return sum(text.count(marker) for marker in markers)


def repair_mojibake(text):
    if mojibake_score(text) == 0:
        return text

    best_text = text
    best_score = mojibake_score(text)

    for encoding in ("latin1", "cp1252"):
        try:
            candidate = text.encode(encoding).decode("utf-8")
        except UnicodeError:
            continue

        score = mojibake_score(candidate)
        if score < best_score:
            best_text = candidate
            best_score = score

    return best_text


def slugify(value):
    value = clean_text(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value or "product"


def short_description(description, max_words=28):
    words = clean_text(description).split()
    return " ".join(words[:max_words])


def lookup_name(collection, value):
    if not value:
        return ""

    if isinstance(value, dict):
        return clean_text(value.get("name", ""))

    try:
        doc = collection.find_one({"_id": ObjectId(value)})
    except Exception:
        doc = collection.find_one({"_id": value})

    return clean_text(doc.get("name", "")) if doc else ""


def build_captions(product, category_name, brand_name):
    name = clean_text(product.get("name"))
    description = short_description(product.get("description"))
    size_values = [
        clean_text(size.get("size"))
        for size in product.get("sizes", [])
        if isinstance(size, dict) and size.get("size")
    ]
    sizes = ", ".join(size_values[:5])

    parts = [name]
    if category_name:
        parts.append(f"danh mục {category_name}")
    if brand_name:
        parts.append(f"thương hiệu {brand_name}")
    if description:
        parts.append(description)
    if sizes:
        parts.append(f"kích thước {sizes}")

    full_caption = ", ".join(parts)

    captions = [
        full_caption,
        f"{name}, {category_name}".strip(", "),
    ]

    if brand_name:
        captions.append(f"{name}, thương hiệu {brand_name}")

    if description:
        captions.append(f"{name}, {description}")

    unique = []
    seen = set()
    for caption in captions:
        caption = clean_text(caption)
        key = caption.lower()
        if caption and key not in seen:
            unique.append(caption)
            seen.add(key)

    return unique


def main():
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        raise RuntimeError("Missing MONGODB_URI environment variable")

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
    client.admin.command("ping")

    db = client[get_database_name(mongo_uri)]
    products_collection = db.products
    categories_collection = db.categories
    brands_collection = db.brands

    products = list(
        products_collection.find(
            {
                "isActive": True,
                "images": {"$exists": True, "$ne": []},
            }
        )
    )

    records = []
    for product in products:
        product_id = str(product["_id"])
        product_name = clean_text(product.get("name"))
        category_name = lookup_name(categories_collection, product.get("category"))
        brand_name = lookup_name(brands_collection, product.get("brand"))
        captions = build_captions(product, category_name, brand_name)

        for image_index, image_url in enumerate(product.get("images", []), start=1):
            image_url = clean_text(image_url)
            if not image_url:
                continue

            image_name = f"{slugify(product_name)}-{product_id[-6:]}-{image_index}.jpg"
            for caption in captions:
                records.append(
                    {
                        "product_id": product_id,
                        "product_name": product_name,
                        "category": category_name,
                        "brand": brand_name,
                        "image_url": image_url,
                        "image": f"images/{image_name}",
                        "caption": caption,
                    }
                )

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    metadata = {
        "created_at": datetime.now(UTC).isoformat(),
        "database": db.name,
        "product_count": len(products),
        "record_count": len(records),
    }

    with open(TRAIN_JSON, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    with open(TRAIN_JSONL, "w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    with open(TRAIN_META, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"Exported {len(records)} image-caption pairs from {len(products)} products")
    print(f"JSON: {TRAIN_JSON}")
    print(f"JSONL: {TRAIN_JSONL}")
    print(f"Metadata: {TRAIN_META}")


if __name__ == "__main__":
    main()
