# Sử dụng Node.js bản stable
FROM node:20

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Mở cổng 7860 (Đây là cổng mặc định của Hugging Face Spaces)
EXPOSE 7860

# Thiết lập biến môi trường để chạy trên cổng 7860
ENV PORT=7860

# Lệnh khởi chạy
CMD ["npm", "run", "start"]
