---
title: UTEShop Virtual Try-On
emoji: 👕
colorFrom: purple
colorTo: indigo
sdk: gradio
sdk_version: 4.44.1
app_file: app.py
pinned: false
license: cc-by-nc-sa-4.0
---

# 👕 UTEShop - Virtual Try-On AI

Thử đồ ảo bằng AI sử dụng **CatVTON (ICLR 2025)** kết hợp **Segformer** để tạo mask quần áo tự động.

## Cách sử dụng

1. Upload ảnh chân dung toàn thân của bạn
2. Upload ảnh quần áo muốn thử
3. Chọn loại quần áo (Áo / Quần / Đồ liền)
4. Nhấn **"Thử đồ ngay!"**

## Credits

- [CatVTON](https://github.com/Zheng-Chong/CatVTON) - Concatenation Is All You Need for Virtual Try-On
- [Segformer](https://huggingface.co/mattmdjaga/segformer_b2_clothes) - Clothing Segmentation
