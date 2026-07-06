"""
Giai đoạn 7 và 8: Evaluation và so sánh base model với LoRA.

Bản robust xử lý lỗi thường gặp:
- Không đánh giá vision-language nếu toàn bộ ảnh URL chết/link 404.
- Hỗ trợ cả HTTP/HTTPS image URL và local image path trong Kaggle.
- Ưu tiên record["image_source"], fallback record["image_url"].
- Xuất failed_images.csv để biết dòng nào hỏng ảnh.
- Chỉ cho text-only fallback khi bật rõ --allow_text_only_fallback.

Cài thêm:
    pip install evaluate sacrebleu rouge-score bert-score nltk pandas tqdm requests pillow

Ví dụ đánh giá LoRA với yêu cầu ảnh hợp lệ:
    python scripts/evaluate_qwen_vl.py \
      --test_jsonl dataset/test.jsonl \
      --adapter_id username/qwen2.5-vl-uteshop-description-lora \
      --output_dir outputs \
      --run_name qwen_lora \
      --require_valid_images

Ví dụ đánh giá bằng local image path trong JSONL:
    python scripts/evaluate_qwen_vl.py \
      --test_jsonl dataset/test.jsonl \
      --adapter_id /kaggle/input/.../qwen2_5-vl-uteshop-description-lora \
      --output_dir /kaggle/working/qwen_vl_lora_eval_fixed \
      --run_name qwen_lora \
      --require_valid_images

Ví dụ debug pipeline text-only khi ảnh hỏng, KHÔNG dùng để kết luận vision-language:
    python scripts/evaluate_qwen_vl.py \
      --test_jsonl dataset/test.jsonl \
      --adapter_id username/qwen2.5-vl-uteshop-description-lora \
      --allow_text_only_fallback \
      --no_require_valid_images
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from typing import Any, Optional

import evaluate
import nltk
import pandas as pd
import requests
from PIL import Image
from tqdm import tqdm

from inference_qwen_vl_lora import generate_product_description, is_http_url, load_model_and_processor


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
BANNED_PATTERNS = [
    r"\bAI\b",
    r"trí tuệ nhân tạo",
    r"được tạo bởi",
    r"tạo bởi AI",
    r"là một AI",
    r"tôi không thể",
    r"dựa trên ảnh",
    r"as an ai",
    r"i cannot",
]


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records


def safe_str(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def get_image_source(record: dict[str, Any]) -> tuple[str, str]:
    """
    Ưu tiên image_source do prepare_qwen_vl_dataset.py mới tạo.
    Fallback image_url để tương thích dataset cũ.
    """
    candidates = [
        ("image_source", record.get("image_source")),
        ("local_image_path", record.get("local_image_path")),
        ("image_path", record.get("image_path")),
        ("image_url", record.get("image_url")),
        ("image_url_original", record.get("image_url_original")),
    ]

    for col, value in candidates:
        image_source = safe_str(value)
        if image_source:
            return image_source, safe_str(record.get("image_source_col")) or col

    return "", ""


def check_image_source(image_source: str, timeout: int = 15) -> tuple[bool, Any, str, str]:
    """
    Returns:
    - ok
    - status_code: HTTP status hoặc "local"
    - content_type
    - error
    """
    image_source = safe_str(image_source)
    if not image_source:
        return False, None, "", "empty_image_source"

    if is_http_url(image_source):
        try:
            response = requests.get(
                image_source,
                headers={
                    "User-Agent": "Mozilla/5.0 UteShop Qwen-VL Evaluation/1.0",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                },
                timeout=timeout,
                stream=True,
                allow_redirects=True,
            )
            content_type = response.headers.get("content-type", "")
            if response.status_code == 200 and "image" in content_type.lower():
                return True, response.status_code, content_type, ""
            return False, response.status_code, content_type, f"not_valid_image_status={response.status_code}"
        except Exception as exc:
            return False, None, "", repr(exc)

    path = Path(image_source)
    if not path.exists() or not path.is_file():
        return False, None, "", "not_http_url_or_missing_local_file"

    if path.suffix.lower() not in IMAGE_EXTENSIONS:
        return False, "local", "", f"unsupported_local_image_ext={path.suffix}"

    try:
        with Image.open(path) as image:
            image.verify()
        return True, "local", f"image/{path.suffix.lower().lstrip('.')}", ""
    except Exception as exc:
        return False, "local", "", f"invalid_local_image={repr(exc)}"


def build_text_only_prediction(name: str, brand: str) -> str:
    """
    Chỉ dùng khi --allow_text_only_fallback được bật để debug pipeline.
    Không dùng kết quả này làm vision-language evaluation.
    """
    brand_text = brand or "Không rõ"
    return (
        f"{name} từ thương hiệu {brand_text} là sản phẩm thời trang phù hợp cho nhu cầu sử dụng hằng ngày. "
        "Thiết kế hướng đến sự dễ mặc, dễ phối đồ và có thể kết hợp với nhiều phong cách khác nhau. "
        "Sản phẩm phù hợp cho khách hàng muốn hoàn thiện outfit theo hướng gọn gàng, hiện đại và linh hoạt."
    )


def normalize_text_vi(text: str) -> str:
    text = str(text or "").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def word_tokenize_simple(text: str) -> list[str]:
    text = normalize_text_vi(text).lower()
    return re.findall(r"[0-9A-Za-zÀ-ỹ%]+", text)


def banned_hit(text: str) -> bool:
    for pattern in BANNED_PATTERNS:
        if re.search(pattern, str(text or ""), flags=re.IGNORECASE):
            return True
    return False


def compute_metrics(predictions: list[str], references: list[str]) -> dict[str, float]:
    """
    Tính metric tự động.

    Với tiếng Việt:
    - BLEU/ROUGE/METEOR chỉ phản ánh trùng khớp bề mặt.
    - BERTScore dùng xlm-roberta-base để phù hợp đa ngôn ngữ.
    """
    pairs = [(normalize_text_vi(p), normalize_text_vi(r)) for p, r in zip(predictions, references)]
    pairs = [(p, r) for p, r in pairs if p and r]
    if not pairs:
        return {
            "bleu": 0.0,
            "rougeL": 0.0,
            "meteor": 0.0,
            "bertscore_precision": 0.0,
            "bertscore_recall": 0.0,
            "bertscore_f1": 0.0,
        }

    metric_predictions = [p for p, _ in pairs]
    metric_references = [r for _, r in pairs]

    try:
        nltk.download("wordnet", quiet=True)
        nltk.download("omw-1.4", quiet=True)
    except Exception:
        pass

    bleu_metric = evaluate.load("sacrebleu")
    rouge_metric = evaluate.load("rouge")
    meteor_metric = evaluate.load("meteor")
    bertscore_metric = evaluate.load("bertscore")

    bleu = bleu_metric.compute(predictions=metric_predictions, references=[[ref] for ref in metric_references])
    rouge = rouge_metric.compute(predictions=metric_predictions, references=metric_references)
    meteor = meteor_metric.compute(predictions=metric_predictions, references=metric_references)
    bertscore = bertscore_metric.compute(
        predictions=metric_predictions,
        references=metric_references,
        model_type="xlm-roberta-base",
        lang="vi",
        rescale_with_baseline=False,
    )

    return {
        "bleu": float(bleu["score"]),
        "rougeL": float(rouge["rougeL"]),
        "meteor": float(meteor["meteor"]),
        "bertscore_precision": float(sum(bertscore["precision"]) / len(bertscore["precision"])),
        "bertscore_recall": float(sum(bertscore["recall"]) / len(bertscore["recall"])),
        "bertscore_f1": float(sum(bertscore["f1"]) / len(bertscore["f1"])),
    }


def evaluate_model(
    test_jsonl: Path,
    output_dir: Path,
    run_name: str,
    base_model_id: str,
    adapter_id: Optional[str],
    use_4bit: bool,
    limit: Optional[int],
    require_valid_images: bool,
    allow_text_only_fallback: bool,
    image_check_timeout: int,
    max_new_tokens: int,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    records = load_jsonl(test_jsonl)
    if limit:
        records = records[:limit]

    if not records:
        raise ValueError(f"Không có record nào trong test_jsonl: {test_jsonl}")

    checked_records: list[dict[str, Any]] = []
    failed_image_rows: list[dict[str, Any]] = []

    print("===== CHECKING IMAGE SOURCES =====")
    for index, record in enumerate(tqdm(records, desc="Checking images")):
        image_source, image_source_col = get_image_source(record)
        ok, status, content_type, error = check_image_source(image_source, timeout=image_check_timeout)

        checked = {
            **record,
            "_row_index": index,
            "_image_source": image_source,
            "_image_source_col": image_source_col,
            "_image_ok": ok,
            "_image_status_code": status,
            "_image_content_type": content_type,
            "_image_error": error,
        }
        checked_records.append(checked)

        if not ok:
            failed_image_rows.append(
                {
                    "row_index": index,
                    "name": record.get("name", ""),
                    "brand": record.get("brand", ""),
                    "image_source": image_source,
                    "image_source_col": image_source_col,
                    "image_status_code": status,
                    "image_error": error,
                }
            )

    image_ok_count = sum(1 for record in checked_records if record["_image_ok"])
    image_failed_count = len(checked_records) - image_ok_count

    print(f"Image OK: {image_ok_count} / {len(checked_records)}")
    print(f"Image failed: {image_failed_count} / {len(checked_records)}")

    failed_images_path = output_dir / f"{run_name}_failed_images.csv"
    if failed_image_rows:
        pd.DataFrame(failed_image_rows).to_csv(failed_images_path, index=False, encoding="utf-8-sig")
        print(f"Failed images CSV: {failed_images_path}")

    if require_valid_images:
        before = len(checked_records)
        checked_records = [record for record in checked_records if record["_image_ok"]]
        print(f"require_valid_images=True: kept {len(checked_records)} / {before} samples")

        if not checked_records:
            raise ValueError(
                "Không còn mẫu nào có ảnh tải được. Đây là lỗi dataset image_url/local path, không phải lỗi model. "
                "Cách sửa đúng: export lại CSV/JSONL với image_url Cloudinary còn mở được, "
                "hoặc upload ảnh vào Kaggle dataset và dùng local_image_path/image_path hợp lệ. "
                f"Xem file lỗi ảnh tại: {failed_images_path}"
            )

    if image_ok_count == 0 and not allow_text_only_fallback:
        raise ValueError(
            "Tất cả ảnh đều lỗi và allow_text_only_fallback=False. "
            "Dừng evaluation để tránh báo cáo sai vision-language thành text-only."
        )

    model = None
    processor = None
    if image_ok_count > 0:
        model, processor = load_model_and_processor(
            base_model_id=base_model_id,
            adapter_id=adapter_id,
            use_4bit=use_4bit,
        )

    rows: list[dict[str, Any]] = []
    predictions: list[str] = []
    references: list[str] = []

    start_all = time.time()

    for record in tqdm(checked_records, desc=f"Generating predictions ({run_name})"):
        name = safe_str(record.get("name"))
        brand = safe_str(record.get("brand")) or "Không rõ"
        image_source = safe_str(record["_image_source"])
        ref = safe_str(record.get("target_description"))
        used_image = bool(record["_image_ok"] and image_source)
        text_only_fallback_used = False

        t0 = time.time()
        error = ""

        try:
            if used_image:
                pred = generate_product_description(
                    image_url=image_source,
                    name=name,
                    brand=brand,
                    model=model,
                    processor=processor,
                    base_model_id=base_model_id,
                    adapter_id=adapter_id,
                    use_4bit=use_4bit,
                    max_new_tokens=max_new_tokens,
                )
            elif allow_text_only_fallback:
                pred = build_text_only_prediction(name=name, brand=brand)
                text_only_fallback_used = True
            else:
                pred = ""
                error = "image_invalid_and_text_only_fallback_disabled"
        except Exception as exc:
            pred = ""
            error = repr(exc)

        latency = time.time() - t0

        predictions.append(pred)
        references.append(ref)

        rows.append(
            {
                "run_name": run_name,
                "row_index": record["_row_index"],
                "image_source": image_source,
                "image_source_col": record["_image_source_col"],
                "image_ok": record["_image_ok"],
                "image_status_code": record["_image_status_code"],
                "image_content_type": record["_image_content_type"],
                "image_error": record["_image_error"],
                "used_image_for_generation": used_image,
                "text_only_fallback_used": text_only_fallback_used,
                "name": name,
                "brand": brand,
                "target_description": ref,
                "predicted_description": pred,
                "prediction_word_count": len(word_tokenize_simple(pred)),
                "reference_word_count": len(word_tokenize_simple(ref)),
                "has_banned_phrase": banned_hit(pred),
                "latency_sec": latency,
                "error": error,
            }
        )

    total_time = time.time() - start_all

    pred_df = pd.DataFrame(rows)
    predictions_path = output_dir / f"{run_name}_predictions.csv"
    pred_df.to_csv(predictions_path, index=False, encoding="utf-8-sig")

    metrics = compute_metrics(predictions, references)
    summary = {
        "run_name": run_name,
        "base_model_id": base_model_id,
        "adapter_id": adapter_id or "",
        "test_jsonl": str(test_jsonl),
        "num_records_input": len(records),
        "num_records_evaluated": len(checked_records),
        "require_valid_images": require_valid_images,
        "allow_text_only_fallback": allow_text_only_fallback,
        "image_ok_count_before_filter": image_ok_count,
        "image_failed_count_before_filter": image_failed_count,
        "used_image_generation_count": int(pred_df["used_image_for_generation"].sum()) if len(pred_df) else 0,
        "text_only_fallback_count": int(pred_df["text_only_fallback_used"].sum()) if len(pred_df) else 0,
        "error_count": int(pred_df["error"].astype(str).str.len().gt(0).sum()) if len(pred_df) else 0,
        "empty_prediction_count": int(pred_df["predicted_description"].astype(str).str.strip().eq("").sum()) if len(pred_df) else 0,
        "banned_output_count": int(pred_df["has_banned_phrase"].sum()) if len(pred_df) else 0,
        "avg_latency_sec": float(pred_df["latency_sec"].mean()) if len(pred_df) else 0.0,
        "total_generation_time_sec": float(total_time),
        **metrics,
    }

    metrics_df = pd.DataFrame([summary])
    metrics_path = output_dir / f"{run_name}_metrics.csv"
    metrics_df.to_csv(metrics_path, index=False, encoding="utf-8-sig")

    summary_path = output_dir / f"{run_name}_summary.json"
    with summary_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    human_df = pred_df.copy()
    human_df["correctness_score_1_5"] = ""
    human_df["fluency_score_1_5"] = ""
    human_df["completeness_score_1_5"] = ""
    human_df["comment"] = ""
    human_path = output_dir / f"{run_name}_human_eval_sample.csv"
    human_df.to_csv(human_path, index=False, encoding="utf-8-sig")

    print("\n===== EVALUATION DONE =====")
    print(f"Predictions: {predictions_path}")
    print(f"Metrics: {metrics_path}")
    print(f"Summary: {summary_path}")
    print(f"Human evaluation sample: {human_path}")
    if failed_image_rows:
        print(f"Failed images: {failed_images_path}")
    print(metrics_df.to_string(index=False))

    if summary["used_image_generation_count"] == 0:
        print("\nWARNING: used_image_generation_count = 0. Kết quả này KHÔNG phải evaluation vision-language.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test_jsonl", type=Path, required=True)
    parser.add_argument("--output_dir", type=Path, default=Path("ai-training/product_description_qwen_vl/outputs"))
    parser.add_argument("--run_name", type=str, default="qwen_lora")
    parser.add_argument("--base_model_id", type=str, default="Qwen/Qwen2.5-VL-3B-Instruct")
    parser.add_argument("--adapter_id", type=str, default=None)
    parser.add_argument("--no_adapter", action="store_true")
    parser.add_argument("--no_4bit", action="store_true")
    parser.add_argument("--limit", type=int, default=None, help="Giới hạn số mẫu để test nhanh.")
    parser.add_argument("--max_new_tokens", type=int, default=180)
    parser.add_argument("--image_check_timeout", type=int, default=15)
    parser.add_argument(
        "--require_valid_images",
        dest="require_valid_images",
        action="store_true",
        default=True,
        help="Chỉ đánh giá các mẫu có ảnh hợp lệ. Mặc định bật.",
    )
    parser.add_argument(
        "--no_require_valid_images",
        dest="require_valid_images",
        action="store_false",
        help="Không lọc mẫu ảnh lỗi. Chỉ dùng kèm --allow_text_only_fallback để debug.",
    )
    parser.add_argument(
        "--allow_text_only_fallback",
        action="store_true",
        help="Cho phép fallback text-only khi ảnh lỗi. Không dùng kết quả này để kết luận vision-language.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    evaluate_model(
        test_jsonl=args.test_jsonl,
        output_dir=args.output_dir,
        run_name=args.run_name,
        base_model_id=args.base_model_id,
        adapter_id=None if args.no_adapter else args.adapter_id,
        use_4bit=not args.no_4bit,
        limit=args.limit,
        require_valid_images=args.require_valid_images,
        allow_text_only_fallback=args.allow_text_only_fallback,
        image_check_timeout=args.image_check_timeout,
        max_new_tokens=args.max_new_tokens,
    )