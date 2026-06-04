#!/usr/bin/env python3
"""
prepare_dataset.py — Pipeline tổng hợp: extract → generate → augment → validate → export.
Chạy: python prepare_dataset.py
"""
import json, os, sys, shutil

SCRIPT_DIR = os.path.dirname(__file__)
DATASET_DIR = os.path.join(SCRIPT_DIR, "..", "dataset")

def run_step(name, module_name):
    print(f"\n{'='*60}")
    print(f"🚀 STEP: {name}")
    print(f"{'='*60}")
    mod = __import__(module_name)
    return mod

def main():
    print("🎯 UTEShop Dataset Preparation Pipeline")
    print("=" * 60)
    
    # Step 1: Extract data from MongoDB
    sys.path.insert(0, SCRIPT_DIR)
    
    print("\n📥 Step 1/4: Extracting data from MongoDB...")
    from extract_data import extract_data
    data = extract_data()
    if not data:
        print("❌ Extract failed!"); return
    
    # Step 2: Generate conversations
    print("\n💬 Step 2/4: Generating conversations...")
    from generate_conversations import generate_all
    convos = generate_all()
    if not convos:
        print("❌ Generate failed!"); return
    
    # Step 3: Augment data
    print("\n🔄 Step 3/4: Augmenting data...")
    from augment_data import augment
    augment()
    
    # Step 4: Validate
    print("\n✅ Step 4/4: Validating dataset...")
    from validate_dataset import validate
    is_valid = validate()
    
    # Export final files
    print("\n" + "=" * 60)
    print("📦 Exporting final files...")
    
    aug_file = os.path.join(DATASET_DIR, "dataset_augmented.jsonl")
    final_file = os.path.join(DATASET_DIR, "dataset_uteshop.jsonl")
    sample_file = os.path.join(DATASET_DIR, "dataset_sample.jsonl")
    stats_file = os.path.join(DATASET_DIR, "dataset_stats.json")
    
    # Copy augmented → final
    if os.path.exists(aug_file):
        shutil.copy2(aug_file, final_file)
    
    # Create sample (50 records)
    records = []
    with open(final_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    
    import random
    sample = random.sample(records, min(50, len(records)))
    with open(sample_file, "w", encoding="utf-8") as f:
        for r in sample:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    
    # Stats
    instructions = {}
    for r in records:
        inst = r.get("instruction", "unknown")
        instructions[inst] = instructions.get(inst, 0) + 1
    
    avg_input = sum(len(r["input"]) for r in records) / len(records) if records else 0
    avg_output = sum(len(r["output"]) for r in records) / len(records) if records else 0
    
    stats = {
        "total_records": len(records),
        "sample_records": len(sample),
        "instructions_distribution": instructions,
        "avg_input_length": round(avg_input, 1),
        "avg_output_length": round(avg_output, 1),
        "validation_passed": is_valid,
    }
    with open(stats_file, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"🎉 HOÀN TẤT!")
    print(f"{'='*60}")
    print(f"📄 dataset_uteshop.jsonl  → {len(records)} records")
    print(f"📄 dataset_sample.jsonl   → {len(sample)} records")
    print(f"📄 dataset_stats.json     → thống kê")
    print(f"✅ Validation: {'PASS' if is_valid else 'FAIL'}")

if __name__ == "__main__":
    main()
