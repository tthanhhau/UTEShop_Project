#!/usr/bin/env python3
"""
validate_dataset.py — Kiểm tra chất lượng dataset JSONL.
"""
import json, os, sys

SCRIPT_DIR = os.path.dirname(__file__)
INPUT_FILE = os.path.join(SCRIPT_DIR, "..", "dataset", "dataset_augmented.jsonl")

def validate():
    if not os.path.exists(INPUT_FILE):
        print(f"❌ Chưa có {INPUT_FILE}"); return False
    
    errors, warnings = [], []
    seen_inputs = set()
    total, valid = 0, 0
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            total += 1
            line = line.strip()
            if not line: continue
            
            # Check valid JSON
            try:
                item = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"Line {i}: Invalid JSON - {e}")
                continue
            
            # Check required fields
            for field in ["instruction", "input", "output"]:
                if field not in item or not item[field].strip():
                    errors.append(f"Line {i}: Empty/missing '{field}'")
                    continue
            
            # Check output length
            if len(item.get("output", "")) < 10:
                warnings.append(f"Line {i}: Output quá ngắn ({len(item['output'])} chars)")
            
            # Check duplicates
            inp_key = item.get("input", "").strip().lower()
            if inp_key in seen_inputs:
                warnings.append(f"Line {i}: Duplicate input")
            else:
                seen_inputs.add(inp_key)
            
            valid += 1
    
    # Report
    print(f"\n{'='*50}")
    print(f"📊 VALIDATION REPORT")
    print(f"{'='*50}")
    print(f"Total lines: {total}")
    print(f"Valid: {valid}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    
    if errors:
        print(f"\n❌ ERRORS:")
        for e in errors[:20]: print(f"   {e}")
        if len(errors) > 20: print(f"   ... và {len(errors)-20} lỗi khác")
    
    if warnings:
        print(f"\n⚠️ WARNINGS:")
        for w in warnings[:10]: print(f"   {w}")
        if len(warnings) > 10: print(f"   ... và {len(warnings)-10} cảnh báo khác")
    
    ok = len(errors) == 0
    print(f"\n{'✅ PASS' if ok else '❌ FAIL'}")
    return ok

if __name__ == "__main__":
    sys.exit(0 if validate() else 1)
