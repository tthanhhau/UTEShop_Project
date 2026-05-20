FROM python:3.9-slim

# Cài đặt công cụ build cho llama-cpp-python
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập user không có quyền root theo chuẩn Hugging Face Spaces
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

WORKDIR $HOME/app

# Copy và cài đặt requirements
COPY --chown=user requirements.txt $HOME/app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu

# Copy mã nguồn
COPY --chown=user . $HOME/app/

# Mở cổng 7860
EXPOSE 7860

# Chạy server FastAPI
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
