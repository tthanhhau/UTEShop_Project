#!/usr/bin/env python3
"""
augment_data.py — Tạo biến thể dữ liệu: không dấu, teen code, chat tự nhiên, viết tắt.
"""
import json, os, random, re, unicodedata

SCRIPT_DIR = os.path.dirname(__file__)
INPUT_FILE = os.path.join(SCRIPT_DIR, "..", "dataset", "dataset_raw.jsonl")
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "dataset", "dataset_augmented.jsonl")

VIET_MAP = str.maketrans(
    "àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ",
    "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD"
)

# Bảng teen code
TEEN_REPLACEMENTS = {
    "không": ["ko", "k", "hk", "khong"],
    "được": ["dc", "đc", "duoc"],
    "với": ["vs", "voi"],
    "gì": ["j", "gi"],
    "này": ["nay", "ni"],
    "đó": ["do", "đấy"],
    "rồi": ["roi", "r"],
    "ạ": ["a", ""],
    "nhé": ["nhe", "nha", "nhá"],
    "vậy": ["v", "vay"],
    "thế": ["the", "thê"],
    "luôn": ["luon", "ln"],
    "biết": ["bt", "biet"],
    "mình": ["mk", "minh"],
    "bạn": ["bn", "ban"],
    "sản phẩm": ["sp", "san pham"],
    "thời trang": ["tt", "thoi trang"],
    "chất lượng": ["cl", "chat luong"],
    "miễn phí": ["free", "mien phi"],
    "giá": ["gia"],
    "đẹp": ["dep"],
    "tốt": ["tot"],
}

# Cách nói tự nhiên
CASUAL_PREFIXES = [
    "", "ơi ", "ê ", "hey ", "à ", "ủa ", "hmm ", "ui "
]
CASUAL_SUFFIXES = [
    "", " v", " vậy", " thế", " z", " ha", " hả", " ạ", " nhỉ", " ta"
]


def remove_diacritics(text):
    """Xóa dấu tiếng Việt."""
    return text.translate(VIET_MAP)


def apply_teen_code(text):
    """Áp dụng teen code ngẫu nhiên."""
    result = text.lower()
    # Chọn 1-3 từ để thay
    words = list(TEEN_REPLACEMENTS.keys())
    chosen = random.sample([w for w in words if w in result], 
                          min(random.randint(1, 3), len([w for w in words if w in result])))
    for word in chosen:
        replacement = random.choice(TEEN_REPLACEMENTS[word])
        result = result.replace(word, replacement, 1)
    return result


def make_casual(text):
    """Biến thành chat tự nhiên."""
    text = text.lower()
    # Thêm prefix/suffix ngẫu nhiên
    prefix = random.choice(CASUAL_PREFIXES)
    suffix = random.choice(CASUAL_SUFFIXES)
    # Bỏ dấu chấm cuối
    text = text.rstrip(".!?")
    return prefix + text + suffix


def augment():
    """Tạo biến thể cho toàn bộ dataset."""
    if not os.path.exists(INPUT_FILE):
        print(f"❌ Chưa có {INPUT_FILE}. Chạy generate_conversations.py trước!")
        return
    
    # Load original
    originals = []
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                originals.append(json.loads(line))
    
    print(f"📂 Loaded {len(originals)} mẫu gốc")
    
    augmented = list(originals)  # Giữ nguyên bản gốc
    
    for item in originals:
        inp = item["input"]
        
        # 30% → biến thể không dấu
        if random.random() < 0.3:
            augmented.append({
                "instruction": item["instruction"],
                "input": remove_diacritics(inp),
                "output": item["output"]
            })
        
        # 25% → teen code
        if random.random() < 0.25:
            teen = apply_teen_code(inp)
            if teen != inp.lower():
                augmented.append({
                    "instruction": item["instruction"],
                    "input": teen,
                    "output": item["output"]
                })
        
        # 20% → chat tự nhiên
        if random.random() < 0.2:
            casual = make_casual(inp)
            if casual != inp.lower():
                augmented.append({
                    "instruction": item["instruction"],
                    "input": casual,
                    "output": item["output"]
                })
        
        # 15% → không dấu + teen code kết hợp
        if random.random() < 0.15:
            combo = remove_diacritics(apply_teen_code(inp))
            augmented.append({
                "instruction": item["instruction"],
                "input": combo,
                "output": item["output"]
            })
    
    # Deduplicate
    seen = set()
    unique = []
    for item in augmented:
        key = item["input"].strip().lower()
        if key not in seen:
            seen.add(key)
            unique.append(item)
    
    random.shuffle(unique)
    
    # Export
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for item in unique:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    added = len(unique) - len(originals)
    print(f"✅ Augmented: {len(originals)} → {len(unique)} mẫu (+{added})")
    print(f"   → {OUTPUT_FILE}")


if __name__ == "__main__":
    augment()
