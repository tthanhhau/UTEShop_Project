"""
Fine-tune CLIP for UTEShop image search using image-caption pairs.

Run:
  python download_training_images.py
  python train_clip.py
"""
import json
import os
from pathlib import Path

from PIL import Image
from sentence_transformers import InputExample, SentenceTransformer
from sentence_transformers.sentence_transformer import losses
from torch.utils.data import DataLoader


DATA_PATH = Path(os.getenv("TRAIN_DATA_PATH", "training_data/train.jsonl"))
OUTPUT_DIR = os.getenv("OUTPUT_MODEL_DIR", "models/uteshop-clip")
BASE_MODEL = os.getenv("BASE_CLIP_MODEL", "clip-ViT-B-32")
BATCH_SIZE = int(os.getenv("TRAIN_BATCH_SIZE", "4"))
EPOCHS = int(os.getenv("TRAIN_EPOCHS", "5"))
MAX_TRAIN_RECORDS = int(os.getenv("MAX_TRAIN_RECORDS", "0"))


def load_examples():
    examples = []
    skipped = 0
    total = 0

    with DATA_PATH.open("r", encoding="utf-8") as f:
        for line_index, line in enumerate(f, start=1):
            if MAX_TRAIN_RECORDS and len(examples) >= MAX_TRAIN_RECORDS:
                break

            total += 1
            record = json.loads(line)
            image_path = DATA_PATH.parent / record["image"]
            caption = record["caption"]

            if not image_path.exists():
                skipped += 1
                continue

            try:
                image = Image.open(image_path).convert("RGB")
            except Exception:
                skipped += 1
                continue

            examples.append(InputExample(texts=[image, caption]))
            if line_index == 1 or line_index % 100 == 0:
                print(
                    f"Loaded records: {line_index}, valid examples: {len(examples)}, skipped: {skipped}",
                    flush=True,
                )

    return examples, skipped, total


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing {DATA_PATH}. Run export_train_data.py first.")

    print(f"Using data file: {DATA_PATH.resolve()}", flush=True)
    print("Loading image-caption examples...", flush=True)
    train_examples, skipped, total = load_examples()
    if not train_examples:
        raise RuntimeError("No valid training examples. Run download_training_images.py first.")

    print(f"Base model: {BASE_MODEL}")
    print(f"Read records: {total}")
    print(f"Training examples: {len(train_examples)}")
    print(f"Skipped records: {skipped}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Epochs: {EPOCHS}")
    if MAX_TRAIN_RECORDS:
        print(f"Max train records: {MAX_TRAIN_RECORDS}")
    print("Loading base CLIP model...", flush=True)

    model = SentenceTransformer(BASE_MODEL)
    print("Base model loaded", flush=True)
    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=BATCH_SIZE)
    train_loss = losses.MultipleNegativesRankingLoss(model)
    warmup_steps = max(1, int(len(train_dataloader) * EPOCHS * 0.1))

    print("Starting training...", flush=True)
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=EPOCHS,
        warmup_steps=warmup_steps,
        output_path=OUTPUT_DIR,
        show_progress_bar=True,
    )

    print(f"Saved model to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
