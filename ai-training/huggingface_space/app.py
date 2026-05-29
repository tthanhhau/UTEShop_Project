from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import requests
import io
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="BLIP Product Description Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đã cập nhật đúng với kho chứa mô hình của bạn
MODEL_REPO = os.environ.get("MODEL_REPO", "hauttttt/blip-fashion-uteshop") 

device = torch.device("cpu") # Trên HF Space bản Free chỉ có CPU
print(f"[*] Đang tải model từ {MODEL_REPO}...")

try:
    processor = BlipProcessor.from_pretrained(MODEL_REPO)
    model = BlipForConditionalGeneration.from_pretrained(MODEL_REPO)
    model.to(device)
    model.eval()
    print("[OK] Model đã sẵn sàng!")
except Exception as e:
    print(f"[LỖI] Không thể tải model: {e}")
    processor = None
    model = None

class GenerateRequest(BaseModel):
    image_url: str
    name: str
    brand: str = ""

@app.post("/api/generate-description")
async def generate_description(req: GenerateRequest):
    if model is None or processor is None:
        raise HTTPException(status_code=500, detail="Model chưa sẵn sàng.")

    try:
        response = requests.get(req.image_url, timeout=10)
        image = Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi tải hình ảnh: {e}")

    prompt = f"Write an engaging product description for a fashion item. Name: {req.name}. Brand: {req.brand}."

    try:
        inputs = processor(images=image, text=prompt, return_tensors="pt").to(device)
        
        with torch.no_grad():
            output_ids = model.generate(
                **inputs, 
                max_length=150, 
                num_beams=5, 
                repetition_penalty=1.5, 
                early_stopping=True
            )
            
        description = processor.decode(output_ids[0], skip_special_tokens=True)
        
        # Xóa câu lệnh mồi (prompt) bằng tiếng Anh bị dính vào kết quả
        # Vì model BLIP hay biến đổi chữ hoa/thường và khoảng trắng, ta sẽ cắt chuỗi sau tên hãng
        brand_lower = str(req.brand).lower()
        if brand_lower in description.lower():
            # Tìm vị trí sau tên hãng và dấu chấm/phẩy nếu có
            idx = description.lower().rfind(brand_lower)
            description = description[idx + len(brand_lower):].strip(" .,:;-")
        elif "brand" in description.lower():
            idx = description.lower().rfind("brand")
            description = description[idx + 5:].strip(" .,:;-")
            
        description = description.strip()
        
        # Nếu câu mô tả quá ngắn hoặc vô nghĩa (do dữ liệu train ít), tạo câu mặc định hay hơn
        if len(description) < 15:
            fallback_brand = req.brand if req.brand else "thương hiệu cao cấp"
            description = f"Sản phẩm {req.name} từ {fallback_brand} mang đến phong cách thời trang hiện đại, trẻ trung. Với thiết kế tinh tế và chất liệu cao cấp, đây chắc chắn là điểm nhấn hoàn hảo cho bộ trang phục của bạn."
            
        return {"success": True, "description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi sinh mô tả: {e}")

@app.get("/")
def read_root():
    return {"message": "API Sinh Mô Tả Sản Phẩm bằng AI đang chạy!"}
