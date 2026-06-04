import os, sys, subprocess

# 1. Cai them nhung gi Colab chua co (KHONG ep version)
print("📦 Dang cai them thu vien can thiet...")
subprocess.run([sys.executable, "-m", "pip", "install", "-q",
    "diffusers", "accelerate", "gradio==4.36.1", "pillow-heif"], check=False)

# 2. Tai ma nguon CatVTON
if not os.path.exists('/content/CatVTON'):
    print("📂 Dang tai ma nguon CatVTON...")
    subprocess.run(['git', 'clone', 'https://github.com/Zheng-Chong/CatVTON.git',
                    '/content/CatVTON'])

# 3. Patch imports trong CatVTON
import glob
repo_path = '/content/CatVTON'
model_path = os.path.join(repo_path, 'model')

for py_file in glob.glob(os.path.join(model_path, "*.py")):
    with open(py_file, 'r') as f:
        content = f.read()
    new_content = content.replace("from model.", "from .").replace("import model.", "import .")
    if "pipeline.py" in py_file:
        new_content = new_content.replace("from utils import", "from ..utils import")
    if new_content != content:
        with open(py_file, 'w') as f:
            f.write(new_content)

for d in [repo_path, model_path]:
    init = os.path.join(d, "__init__.py")
    if not os.path.exists(init):
        with open(init, 'w') as f:
            f.write("")

# Them parent dir vao path de import CatVTON as package
parent = os.path.dirname(repo_path)
if parent not in sys.path:
    sys.path.insert(0, parent)

# 4. Import
import torch
import numpy as np
import cv2
import gc
# pyrefly: ignore [missing-import]
from pillow_heif import register_heif_opener, register_avif_opener
register_heif_opener()
register_avif_opener()
from PIL import Image
from huggingface_hub import snapshot_download
from diffusers.image_processor import VaeImageProcessor
from transformers import SegformerImageProcessor, AutoModelForSemanticSegmentation

# pyrefly: ignore [missing-import]
from CatVTON.model.pipeline import CatVTONPipeline
# pyrefly: ignore [missing-import]
from CatVTON.utils import resize_and_crop, resize_and_padding

print(f"torch={torch.__version__} | numpy={np.__version__} | GPU={torch.cuda.get_device_name(0)}")

# 5. Tai model
print("📦 Dang tai model weights...")
catvton_weights = snapshot_download(repo_id="zhengchong/CatVTON")
seg_processor = SegformerImageProcessor.from_pretrained("mattmdjaga/segformer_b2_clothes")
seg_model = AutoModelForSemanticSegmentation.from_pretrained(
    "mattmdjaga/segformer_b2_clothes").to("cuda").eval()

pipeline = CatVTONPipeline(
    base_ckpt="runwayml/stable-diffusion-inpainting",
    attn_ckpt=catvton_weights,
    attn_ckpt_version="mix",
    weight_dtype=torch.float16,
    device="cuda",
    skip_safety_check=True,
)
mask_processor = VaeImageProcessor(
    vae_scale_factor=8,
    do_normalize=False,
    do_binarize=True,
    do_convert_grayscale=True,
)
print("Model san sang!")


# 6. Ham xu ly
def generate_mask(person_image, cloth_type):
    w, h = person_image.size
    inputs = seg_processor(images=person_image, return_tensors="pt").to("cuda")
    with torch.no_grad():
        outputs = seg_model(**inputs)
    upsampled = torch.nn.functional.interpolate(
        outputs.logits, size=(h, w), mode="bilinear", align_corners=False)
    pred_seg = upsampled.argmax(dim=1)[0].cpu().numpy()
    mask = np.zeros((h, w), dtype=np.uint8)
    if cloth_type == "upper":
        labels = [4, 14, 15]
    elif cloth_type == "lower":
        labels = [5, 6, 7, 12, 13]
    else:
        labels = [4, 5, 6, 7, 12, 13, 14, 15]
    mask[np.isin(pred_seg, labels)] = 255
    mask = cv2.dilate(mask, np.ones((21, 21), np.uint8), iterations=1)
    mask = cv2.GaussianBlur(mask, (21, 21), 0)
    _, mask = cv2.threshold(mask, 10, 255, cv2.THRESH_BINARY)
    return Image.fromarray(mask)


def extract_garment(cloth_image, cloth_type):
    """Tu dong tach quan ao ra khoi anh nguoi mau."""
    w, h = cloth_image.size
    inputs = seg_processor(images=cloth_image, return_tensors="pt").to("cuda")
    with torch.no_grad():
        outputs = seg_model(**inputs)
    upsampled = torch.nn.functional.interpolate(
        outputs.logits, size=(h, w), mode="bilinear", align_corners=False)
    pred_seg = upsampled.argmax(dim=1)[0].cpu().numpy()

    if cloth_type == "upper":
        labels = [4, 14, 15]
    elif cloth_type == "lower":
        labels = [5, 6, 7, 12, 13]
    else:
        labels = [4, 5, 6, 7, 12, 13, 14, 15]

    garment_mask = np.isin(pred_seg, labels).astype(np.uint8) * 255
    garment_ratio = garment_mask.sum() / (255 * h * w)

    if garment_ratio < 0.01:
        print(f"  Khong detect duoc quan ao (ratio={garment_ratio:.3f}), dung anh goc")
        return cloth_image

    coords = np.where(garment_mask > 0)
    y_min, y_max = coords[0].min(), coords[0].max()
    x_min, x_max = coords[1].min(), coords[1].max()

    pad_x = int((x_max - x_min) * 0.1)
    pad_y = int((y_max - y_min) * 0.1)
    y_min = max(0, y_min - pad_y)
    y_max = min(h, y_max + pad_y)
    x_min = max(0, x_min - pad_x)
    x_max = min(w, x_max + pad_x)

    garment_crop = cloth_image.crop((x_min, y_min, x_max, y_max))
    mask_crop = garment_mask[y_min:y_max, x_min:x_max]

    white_bg = Image.new("RGB", garment_crop.size, (255, 255, 255))
    mask_np = cv2.dilate(mask_crop, np.ones((5, 5), np.uint8), iterations=1)
    mask_np = cv2.GaussianBlur(mask_np, (5, 5), 0)
    mask_pil = Image.fromarray(mask_np)
    white_bg.paste(garment_crop, (0, 0), mask_pil)

    print(f"  Da tach quan ao: {garment_crop.size}, ratio={garment_ratio:.3f}")
    return white_bg


@torch.no_grad()
def run_tryon(p_img, c_img, c_type):
    print(f"Bat dau xu ly: cloth_type={c_type}")
    p_res = resize_and_crop(p_img.convert("RGB"), (768, 1024))

    c_extracted = extract_garment(c_img.convert("RGB"), c_type)
    c_res = resize_and_padding(c_extracted, (768, 1024))

    mask = generate_mask(p_res, c_type)
    print("  Mask generated, running inference...")
    result = pipeline(
        image=p_res,
        condition_image=c_res,
        mask=mask_processor.blur(mask, 9),
        num_inference_steps=20,
        guidance_scale=2.5,
        generator=torch.Generator("cuda").manual_seed(42),
    )[0]
    result.paste(p_res, (0, 0), Image.fromarray(255 - np.array(mask.convert("L"))))
    torch.cuda.empty_cache()
    gc.collect()
    print("  Hoan tat!")
    return result


# 7. Patch loi gradio_client
import gradio_client.utils as _gcu

_orig_inner = _gcu._json_schema_to_python_type
def _safe_inner(schema, defs=None):
    if not isinstance(schema, dict):
        return "Any"
    return _orig_inner(schema, defs)
_gcu._json_schema_to_python_type = _safe_inner

_orig_outer = _gcu.json_schema_to_python_type
def _safe_outer(schema):
    if not isinstance(schema, dict):
        return "Any"
    return _orig_outer(schema)
_gcu.json_schema_to_python_type = _safe_outer

print("Da patch gradio_client OK")

# 7b. Patch HfFolder bi xoa trong huggingface_hub moi
import huggingface_hub as _hfh
if not hasattr(_hfh, 'HfFolder'):
    class _HfFolder:
        """Compatibility shim for removed HfFolder class."""
        @staticmethod
        def save_token(token):
            _hfh.login(token=token)
        @staticmethod
        def get_token():
            return _hfh.get_token()
        @staticmethod
        def delete_token():
            _hfh.logout()
    _hfh.HfFolder = _HfFolder
    print("Da patch HfFolder compatibility")

# 8. Gradio API
# pyrefly: ignore [missing-import]
import gradio as gr
from io import BytesIO
import base64


# 9. Ham API nhan base64 (dung Gradio native API - hoat dong qua share tunnel)
def _decode_b64_image(b64_str, label="image"):
    """Decode base64 string thanh PIL Image, xu ly data URI va padding."""
    if "," in b64_str[:100]:
        b64_str = b64_str.split(",", 1)[1]
    missing_padding = len(b64_str) % 4
    if missing_padding:
        b64_str += "=" * (4 - missing_padding)
    raw = base64.b64decode(b64_str)
    print(f"  [{label}] {len(raw)} bytes, magic={raw[:8].hex()}")
    img = Image.open(BytesIO(raw)).convert("RGB")
    print(f"  [{label}] OK: {img.size} {img.format}")
    return img


def api_tryon_b64(person_b64, cloth_b64, cloth_type):
    """Gradio API function nhan base64, tra base64."""
    try:
        print(f"API: person_b64={len(person_b64)} chars, cloth_b64={len(cloth_b64)} chars, type={cloth_type}")
        p_img = _decode_b64_image(person_b64, "person")
        c_img = _decode_b64_image(cloth_b64, "cloth")
        result = run_tryon(p_img, c_img, cloth_type or "upper")
        # Tránh dùng PIL save() vì lỗi thư viện C (TypeError: 16 arguments)
        np_img = cv2.cvtColor(np.array(result), cv2.COLOR_RGB2BGR)
        _, buffer = cv2.imencode('.jpg', np_img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        return base64.b64encode(buffer).decode("utf-8")
    except Exception as e:
        print(f"API error: {e}")
        import traceback
        traceback.print_exc()
        return f"ERROR: {str(e)}"


with gr.Blocks() as demo:
    gr.Markdown("# UTEShop AI Virtual Try-On")
    with gr.Row():
        with gr.Column():
            p = gr.Image(label="Anh nguoi", type="pil")
            t = gr.Radio(["upper", "lower", "overall"], value="upper", label="Vi tri")
        with gr.Column():
            c = gr.Image(label="Anh quan ao", type="pil")
            b = gr.Button("Thu do ngay", variant="primary")
        with gr.Column():
            res = gr.Image(label="Ket qua")
    b.click(fn=run_tryon, inputs=[p, c, t], outputs=res, api_name="tryon")

    # Hidden API-only endpoint (base64 in, base64 out)
    with gr.Row(visible=False):
        api_p = gr.Textbox()
        api_c = gr.Textbox()
        api_t = gr.Textbox()
        api_out = gr.Textbox()
    api_btn = gr.Button(visible=False)
    api_btn.click(
        fn=api_tryon_b64,
        inputs=[api_p, api_c, api_t],
        outputs=api_out,
        api_name="tryon_b64",
    )

# ==========================================
# KHỞI TẠO NGROK STATIC DOMAIN (CHO TRY-ON)
# ==========================================
import subprocess
import sys

print("☁️ Đang cài đặt Ngrok...")
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pyngrok"])

# pyrefly: ignore [missing-import]
from pyngrok import ngrok, conf

# ⚠️ LƯU Ý QUAN TRỌNG: 
# Vì tài khoản Ngrok số 1 của bạn đã dùng cho Chatbot.
# Bạn hãy dùng 1 Gmail khác tạo tài khoản Ngrok thứ 2 để lấy Token và Domain mới dán vào đây nhé!
NGROK_TOKEN = "3E5Nam2fwPY4jT9k6J2cLCpdfpd_7Xj3APUq6ArcqGQmfc12M"
NGROK_DOMAIN = "usage-static-outmatch.ngrok-free.dev"

# Cấu hình ngrok
conf.get_default().auth_token = NGROK_TOKEN
conf.get_default().region = "ap"

try:
    ngrok.kill()
    public_url = ngrok.connect(7860, domain=NGROK_DOMAIN).public_url
    
    print("\n" + "="*60)
    print("🚀 LINK CỐ ĐỊNH (COPY DÁN VÀO RENDER .ENV: COLAB_TRYON_URL):")
    print(f"👉 {public_url}")
    print("="*60 + "\n")
except Exception as e:
    print(f"❌ Lỗi khởi tạo Ngrok: {e}")
    print("Lưu ý: Nhớ điền đúng Token và Domain tĩnh của tài khoản số 2!")

# Khởi chạy Gradio ở port 7860
print("=" * 50)
print("HỆ THỐNG SẴN SÀNG! Đang khởi động Gradio Server...")
print("=" * 50)

# Chạy server không dùng share=True nữa vì đã có Ngrok domain tĩnh
demo.queue(max_size=10)
demo.launch(server_port=7860, share=False, debug=True)
