"""
HƯỚNG DẪN CHẠY TRÊN GOOGLE COLAB:

1. Mở Google Colab: https://colab.research.google.com/ và tạo một Notebook mới (New Notebook).
2. Bật GPU: Nhấn vào Runtime (Thời gian chạy) -> Change runtime type (Thay đổi loại thời gian chạy) -> Chọn Hardware accelerator là T4 GPU -> Nhấn Save.
3. Đăng nhập Hugging Face:
   - Vào tài khoản Hugging Face của bạn: https://huggingface.co/settings/tokens
   - Tạo một token mới với quyền Write (hoặc Fine-grained với quyền write_repos).
   - Ở mục Notebook của Colab, nhấn vào biểu tượng chìa khóa (Secrets) bên trái màn hình.
   - Thêm một Secret mới, Name là `HF_TOKEN`, Value là chuỗi token bạn vừa copy. Bật công tắc "Notebook access" bên cạnh lên.
4. Cài đặt các thư viện cần thiết bằng cách tạo 1 cell và chạy lệnh sau:
   !pip install -q transformers datasets accelerate torch torchvision Pillow pandas requests huggingface_hub pymongo
5. Copy toàn bộ đoạn code bên dưới vào 1 cell mới và bấm Run (Chạy).
"""

import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import requests
import io
import os
from tqdm import tqdm
from pymongo import MongoClient

try:
    from google.colab import userdata
    HF_TOKEN = userdata.get('HF_TOKEN')
except ImportError:
    HF_TOKEN = "ĐIỀN_TOKEN_CỦA_BẠN_NẾU_KHÔNG_CHẠY_TRÊN_COLAB"

# ================= CẤU HÌNH =================
# MongoDB connection URI của bạn (Lấy trực tiếp từ dự án)
MONGO_URI = "mongodb+srv://holam24062003_db_user:quangho123@cluster0.bpw0vps.mongodb.net/test"
MODEL_NAME = "Salesforce/blip-image-captioning-base"
EPOCHS = 3
BATCH_SIZE = 2 # Nếu bị Out of Memory thì giảm xuống 1
LEARNING_RATE = 5e-5
OUTPUT_DIR = "blip-fashion-finetuned"

# Cấu hình Hugging Face
HF_REPO_NAME = "thay-bang-ten-tai-khoan-hf-cua-ban/blip-fashion-uteshop" # <-- SỬA DÒNG NÀY (Ví dụ: holam/blip-fashion-uteshop)
# ============================================

def fetch_data_from_mongodb():
    print("📡 Đang kết nối tới cơ sở dữ liệu MongoDB Atlas để lấy dữ liệu tự động...")
    client = MongoClient(MONGO_URI)
    db = client.get_database() # mặc định là 'test' hoặc database trong URI
    
    products_col = db['products']
    brands_col = db['brands']
    
    products = list(products_col.find())
    brands = {str(b['_id']): b['name'] for b in brands_col.find()}
    
    dataset_list = []
    for p in products:
        if 'images' in p and len(p['images']) > 0:
            brand_id = str(p.get('brand', ''))
            brand_name = brands.get(brand_id, 'Unknown')
            dataset_list.append({
                'image_url': p['images'][0],
                'name': p.get('name', ''),
                'brand': brand_name,
                'description': p.get('description', '')
            })
            
    print(f"✅ Đã tải thành công {len(dataset_list)} sản phẩm từ Database!")
    return pd.DataFrame(dataset_list)

class FashionDataset(Dataset):
    def __init__(self, df, processor):
        self.data = df
        self.processor = processor

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        image_url = row["image_url"]
        name = row["name"]
        brand = row["brand"]
        description = row["description"]

        # Tải ảnh từ URL
        try:
            response = requests.get(image_url, timeout=5)
            image = Image.open(io.BytesIO(response.content)).convert("RGB")
        except Exception as e:
            image = Image.new("RGB", (224, 224), (0, 0, 0))

        # Tạo prompt mồi
        prompt = f"Write an engaging product description for a fashion item. Name: {name}. Brand: {brand}."
        text_target = str(description)

        encoding = self.processor(images=image, text=prompt, return_tensors="pt", padding="max_length", max_length=512, truncation=True)
        encoding = {k: v.squeeze(0) for k, v in encoding.items()}

        labels = self.processor(text=text_target, return_tensors="pt", padding="max_length", max_length=512, truncation=True).input_ids
        encoding["labels"] = labels.squeeze(0)

        return encoding

def main():
    if not HF_TOKEN:
        print("❌ LỖI: Bạn chưa cấu hình HF_TOKEN trong mục Secrets của Colab!")
        return

    # Lấy dữ liệu tự động từ DB, không cần file CSV
    df = fetch_data_from_mongodb()
    if len(df) == 0:
        print("❌ LỖI: Không tìm thấy sản phẩm nào trong DB!")
        return

    print("🚀 Bắt đầu quá trình huấn luyện BLIP trên Google Colab...")
    processor = BlipProcessor.from_pretrained(MODEL_NAME)
    model = BlipForConditionalGeneration.from_pretrained(MODEL_NAME)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    print(f"✅ Đang sử dụng thiết bị: {device}")

    dataset = FashionDataset(df, processor)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE)
    
    model.train()
    for epoch in range(EPOCHS):
        print(f"\n--- Epoch {epoch + 1}/{EPOCHS} ---")
        total_loss = 0
        progress_bar = tqdm(dataloader, desc="Training")
        
        for batch in progress_bar:
            input_ids = batch["input_ids"].to(device)
            pixel_values = batch["pixel_values"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)
            
            outputs = model(input_ids=input_ids, pixel_values=pixel_values, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            progress_bar.set_postfix({"loss": f"{loss.item():.4f}"})
            
        avg_loss = total_loss / len(dataloader)
        print(f"🔥 Epoch {epoch + 1} hoàn tất. Loss trung bình: {avg_loss:.4f}")
        
    print("🚀 Đang lưu và đẩy mô hình lên Hugging Face Hub...")
    from huggingface_hub import login
    login(token=HF_TOKEN)
    
    model.push_to_hub(HF_REPO_NAME)
    processor.push_to_hub(HF_REPO_NAME)
    print(f"✅ HOÀN TẤT! Mô hình đã được đẩy lên: https://huggingface.co/{HF_REPO_NAME}")
    print("Tiếp theo, bạn hãy tạo một Hugging Face Space (FastAPI Docker) để chứa API gọi mô hình này nhé!")

if __name__ == "__main__":
    main()
