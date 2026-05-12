"""
UTEShop Virtual Try-On - HuggingFace Spaces
============================================
Deploy trên HuggingFace Spaces với ZeroGPU (miễn phí).
Sử dụng CatVTON + Segformer để thử đồ AI.
"""

import os
# pyrefly: ignore [missing-import]
import spaces
import torch
import numpy as np
import cv2
# pyrefly: ignore [missing-import]
import gradio as gr
from PIL import Image
from huggingface_hub import snapshot_download
from diffusers.image_processor import VaeImageProcessor

# pyrefly: ignore [missing-import]
from model.pipeline import CatVTONPipeline
# pyrefly: ignore [missing-import]
from utils import resize_and_crop, resize_and_padding

# ============================================================
# Constants
# ============================================================
WIDTH = 768
HEIGHT = 1024

# ============================================================
# Global model references (lazy loaded inside @spaces.GPU)
# ============================================================
pipeline = None
seg_processor = None
seg_model = None
mask_processor = None


def load_models():
    """Load tất cả model. Chỉ gọi bên trong @spaces.GPU."""
    global pipeline, seg_processor, seg_model, mask_processor

    if pipeline is not None:
        return

    print("[HF Space] Đang tải CatVTON pipeline...")
    repo_path = snapshot_download(repo_id="zhengchong/CatVTON")
    pipeline = CatVTONPipeline(
        base_ckpt="booksforcharlie/stable-diffusion-inpainting",
        attn_ckpt=repo_path,
        attn_ckpt_version="mix",
        weight_dtype=torch.float16,
        device="cuda",
        skip_safety_check=True,
        use_tf32=True,
    )

    print("[HF Space] Đang tải Segformer...")
    from transformers import SegformerImageProcessor, AutoModelForSemanticSegmentation
    seg_processor = SegformerImageProcessor.from_pretrained(
        "mattmdjaga/segformer_b2_clothes"
    )
    seg_model = AutoModelForSemanticSegmentation.from_pretrained(
        "mattmdjaga/segformer_b2_clothes"
    ).to("cuda")

    mask_processor = VaeImageProcessor(
        vae_scale_factor=8,
        do_normalize=False,
        do_binarize=True,
        do_convert_grayscale=True,
    )
    print("[HF Space] Tất cả model đã sẵn sàng!")


# ============================================================
# Segformer Mask (ported from tryon_engine.py)
# ============================================================
def _segformer_predict(image: Image.Image):
    """Chạy Segformer và trả về segmentation map."""
    w, h = image.size
    inputs = seg_processor(images=image, return_tensors="pt").to("cuda")
    with torch.no_grad():
        logits = seg_model(**inputs).logits
    upsampled = torch.nn.functional.interpolate(
        logits, size=(h, w), mode="bilinear", align_corners=False
    )
    return upsampled.argmax(dim=1)[0].cpu().numpy()


def generate_smart_mask(person_image: Image.Image, cloth_type: str) -> Image.Image:
    """Tạo mask vùng quần áo trên ảnh người (Segformer)."""
    w, h = person_image.size
    pred_seg = _segformer_predict(person_image)
    mask = np.zeros((h, w), dtype=np.uint8)

    if cloth_type == "upper":
        mask[np.isin(pred_seg, [4, 14, 15])] = 255
        kernel = np.ones((25, 25), np.uint8)
        mask = cv2.dilate(mask, kernel, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    elif cloth_type == "lower":
        pants_mask = np.zeros((h, w), dtype=np.uint8)
        pants_mask[np.isin(pred_seg, [5, 6])] = 255

        legs_mask = np.zeros((h, w), dtype=np.uint8)
        legs_mask[np.isin(pred_seg, [12, 13])] = 255

        legs_coords = np.where(legs_mask)
        if len(legs_coords[0]) > 0:
            crotch_y = np.min(legs_coords[0])
            waist_top_y = max(0, crotch_y - int(h * 0.15))
            thigh_mask_y = crotch_y + int(h * 0.10)
            thigh_indices = np.where(legs_coords[0] < thigh_mask_y)[0]
            if len(thigh_indices) > 0:
                x_min = np.min(legs_coords[1][thigh_indices])
                x_max = np.max(legs_coords[1][thigh_indices])
            else:
                x_min = np.min(legs_coords[1])
                x_max = np.max(legs_coords[1])
            x_min = max(0, x_min - int(w * 0.02))
            x_max = min(w, x_max + int(w * 0.02))
            waist_x_min = x_min + int((x_max - x_min) * 0.15)
            waist_x_max = x_max - int((x_max - x_min) * 0.15)
            pts = np.array([
                [waist_x_min, waist_top_y], [waist_x_max, waist_top_y],
                [x_max, crotch_y], [x_min, crotch_y]
            ], np.int32)
            cv2.fillPoly(pants_mask, [pts], 255)

        kernel_horiz = np.ones((11, 21), np.uint8)
        legs_fat = cv2.dilate(legs_mask, kernel_horiz, iterations=1)
        kernel_pants = np.ones((25, 31), np.uint8)
        pants_fat = cv2.dilate(pants_mask, kernel_pants, iterations=1)
        mask = cv2.bitwise_or(pants_fat, legs_fat)
        kernel_close = np.ones((25, 25), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_close)

        # Bảo vệ phần trên
        safe_upper = np.zeros((h, w), dtype=bool)
        safe_upper[np.isin(pred_seg, [14, 15, 11, 2])] = True
        upper_cloth = np.zeros((h, w), dtype=bool)
        upper_cloth[np.isin(pred_seg, [4])] = True
        if len(legs_coords[0]) > 0:
            waist_y = max(0, np.min(legs_coords[0]) - int(h * 0.10))
            upper_cloth[waist_y:, :] = False
        mask[safe_upper | upper_cloth] = 0

    else:  # overall
        mask[np.isin(pred_seg, [4, 5, 6, 7, 12, 13, 14, 15])] = 255
        kernel = np.ones((31, 31), np.uint8)
        mask = cv2.dilate(mask, kernel, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    mask = cv2.GaussianBlur(mask, (21, 21), 0)
    _, mask = cv2.threshold(mask, 10, 255, cv2.THRESH_BINARY)
    return Image.fromarray(mask)


def process_condition_image(cloth_image: Image.Image, cloth_type: str) -> Image.Image:
    """Xử lý ảnh sản phẩm: chỉ giữ phần quần áo target."""
    if cloth_type == "overall":
        return cloth_image

    w, h = cloth_image.size
    pred_seg = _segformer_predict(cloth_image)

    target_labels = [4] if cloth_type == "upper" else [5, 6]
    keep_mask = np.isin(pred_seg, target_labels)

    if keep_mask.sum() < (w * h * 0.02):
        return cloth_image

    cloth_np = np.array(cloth_image)
    bg_color = cloth_np[0, 0]
    bg_image = np.full_like(cloth_np, bg_color)
    result = np.where(keep_mask[..., None], cloth_np, bg_image)
    return Image.fromarray(result)


# ============================================================
# Main inference (GPU decorated)
# ============================================================
@spaces.GPU(duration=120)
def try_on(person_image, cloth_image, cloth_type, num_steps, guidance_scale, seed):
    """Hàm inference chính - chạy trên ZeroGPU."""
    if person_image is None or cloth_image is None:
        raise gr.Error("Vui lòng tải lên cả ảnh người và ảnh quần áo!")

    load_models()

    person_pil = Image.fromarray(person_image).convert("RGB")
    cloth_pil = Image.fromarray(cloth_image).convert("RGB")

    # Xử lý ảnh sản phẩm
    cloth_pil = process_condition_image(cloth_pil, cloth_type)

    # Resize
    person_resized = resize_and_crop(person_pil, (WIDTH, HEIGHT))
    cloth_resized = resize_and_padding(cloth_pil, (WIDTH, HEIGHT))

    # Tạo mask
    mask = generate_smart_mask(person_resized, cloth_type)
    mask = mask_processor.blur(mask, blur_factor=9)

    # Inference
    generator = None
    if seed != -1:
        generator = torch.Generator(device="cuda").manual_seed(int(seed))

    result_images = pipeline(
        image=person_resized,
        condition_image=cloth_resized,
        mask=mask,
        num_inference_steps=int(num_steps),
        guidance_scale=guidance_scale,
        generator=generator,
    )
    result = result_images[0]

    # Alpha compositing - giữ nguyên phần không bị mask
    inverted_mask = Image.fromarray(255 - np.array(mask))
    result.paste(person_resized, (0, 0), inverted_mask)

    torch.cuda.empty_cache()
    return result


# ============================================================
# Gradio UI
# ============================================================
with gr.Blocks(
    title="UTEShop Virtual Try-On",
    theme=gr.themes.Soft(primary_hue="purple"),
) as demo:
    gr.Markdown(
        """
        # 👕 UTEShop - Thử Đồ Ảo Bằng AI
        **Powered by CatVTON (ICLR 2025) + Segformer**

        Tải lên ảnh của bạn và ảnh quần áo để xem kết quả thử đồ ảo!
        """
    )

    with gr.Row():
        with gr.Column():
            person_input = gr.Image(label="📸 Ảnh của bạn", type="numpy")
            cloth_input = gr.Image(label="👕 Ảnh quần áo", type="numpy")
            cloth_type = gr.Radio(
                ["upper", "lower", "overall"],
                value="upper",
                label="Loại quần áo",
                info="upper = Áo, lower = Quần, overall = Đồ liền",
            )

        with gr.Column():
            result_output = gr.Image(label="✨ Kết quả", type="pil")

    with gr.Accordion("⚙️ Tùy chỉnh nâng cao", open=False):
        with gr.Row():
            num_steps = gr.Slider(10, 100, value=50, step=5, label="Inference Steps")
            guidance_scale = gr.Slider(
                1.0, 5.0, value=2.5, step=0.5, label="Guidance Scale"
            )
            seed = gr.Slider(-1, 10000, value=42, step=1, label="Seed (-1 = random)")

    btn = gr.Button("🪄 Thử đồ ngay!", variant="primary", size="lg")
    btn.click(
        fn=try_on,
        inputs=[person_input, cloth_input, cloth_type, num_steps, guidance_scale, seed],
        outputs=result_output,
        api_name="try_on",
    )

demo.queue(max_size=5).launch()
