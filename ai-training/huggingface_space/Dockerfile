FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Cấu hình biến môi trường cho Hugging Face Spaces
ENV TRANSFORMERS_CACHE=/tmp/transformers_cache/
ENV HOME=/app

# Tạo thư mục cache và cấp quyền
RUN mkdir -p /tmp/transformers_cache/ && chmod 777 /tmp/transformers_cache/

COPY . .

# Hugging Face Spaces mặc định mở cổng 7860
EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
