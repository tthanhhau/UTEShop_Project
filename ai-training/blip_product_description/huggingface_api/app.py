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
        # Vì model BLIP hay biến đổi chữ hoa/thường và thêm khoảng trắng (VD: H&M -> h & m)
        desc_lower = description.lower()
        if "brand" in desc_lower:
            # Lấy toàn bộ phần phía sau chữ "brand"
            parts = desc_lower.split("brand")
            tail = "brand".join(parts[1:])
            
            # Xóa các ký tự thừa (dấu hai chấm, tên hãng bị biến dạng, khoảng trắng)
            # Chúng ta sẽ tìm dấu chấm đầu tiên sau chữ brand (thường là kết thúc của câu lệnh mồi)
            if "." in tail:
                description = description[desc_lower.find(".", desc_lower.find("brand")) + 1:]
            else:
                description = tail[tail.find(":")+1:] if ":" in tail else tail

        description = description.strip(" .,:;-")
        
        # Nếu câu mô tả quá ngắn hoặc vô nghĩa (ngưỡng 40 ký tự), tạo câu mặc định hay hơn
        if len(description) < 40:
            import random
            fallback_brand = req.brand if req.brand else "thương hiệu cao cấp"
            
            # Lấy cảm hứng từ chính dữ liệu các sản phẩm trong Database của bạn
            db_sentences = [
                "Chất vải mềm mại và mịn màng đến bất ngờ, mang đến cảm giác thoải mái cho mọi hoạt động.",
                "Được thiết kế với đường may tinh tế, mang đến sự thoải mái tối ưu khi di chuyển.",
                "Phong cách năng động mà bạn có thể tự tin diện xuống phố.",
                "Chất liệu bền bỉ và thoáng khí, đồng thời tạo điểm nhấn tinh tế cho mọi trang phục.",
                "Lựa chọn lý tưởng cho phong cách thoải mái nhưng vẫn thời thượng.",
                "Sự kết hợp hoàn hảo giữa xu hướng hiện đại và sự tiện dụng.",
                "Linh hoạt và dễ mang, thiết kế sẽ là lựa chọn hoàn hảo cho nhiều phong cách trang phục.",
                "Tôn lên vẻ đẹp tinh tế và khẳng định phong cách cá nhân của bạn.",
                "Mang lại cảm giác êm ái, nhẹ nhàng và luôn nổi bật dù bạn xuất hiện ở bất cứ đâu.",
                "Giúp bạn luôn sảng khoái và tự tin trong mọi hoạt động hàng ngày.",
                "Thiết kế mang đậm phong cách tiện dụng, dễ dàng phối hợp cùng nhiều món đồ khác.",
                "Đây chắc chắn là điểm nhấn hoàn hảo giúp hoàn thiện bộ trang phục của bạn."
            ]
            
            # Chọn ngẫu nhiên 2 câu khác nhau từ danh sách trên để ghép lại
            random_phrases = random.sample(db_sentences, 2)
            
            description = f"Sản phẩm {req.name} chính hãng từ {fallback_brand} mang đến phong cách thời trang hiện đại. {random_phrases[0]} {random_phrases[1]}"
            
        return {"success": True, "description": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi sinh mô tả: {e}")

@app.get("/")
def read_root():
    return {"message": "API Sinh Mô Tả Sản Phẩm bằng AI đang chạy!"}
