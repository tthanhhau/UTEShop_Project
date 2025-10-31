# KHẮC PHỤC LỖI "MISSING CREDENTIALS FOR PLAIN"

## VẤN ĐỀ

Lỗi: `Error: Missing credentials for "PLAIN"`
- Nguyên nhân: Environment variables không được đọc đúng
- Mailer không thể truy cập email và password từ .env

## GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. CẬP NHẬT MAILER CONFIGURATION

**File:** `UTEShop_BE/src/config/mailer_admin_based.js`

**Thay đổi:**
```javascript
// Trước (hardcoded)
auth: {
  user: 'holam24062003@gmail.com',
  pass: 'kpkl fppt zfok tlay',
}

// Sau (đọc từ environment)
auth: {
  user: process.env.MAIL_USER || 'holam24062003@gmail.com',
  pass: process.env.MAIL_PASS || 'kpkl fppt zfok tlay',
}
```

### 2. CẬP NHẬT .ENV FILE

**File:** `UTEShop_BE/.env`

**Đảm bảo có:**
```env
# Gmail SMTP Configuration (Admin-based - Working)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=holam24062003@gmail.com
MAIL_PASS=kpkl fppt zfok tlay
MAIL_FROM="UTEShop <holam24062003@gmail.com>"
```

### 3. CẬP NHẬT LOGGING

**Thêm debug logging:**
```javascript
console.log('📧 Mail user:', process.env.MAIL_USER);
console.log('📧 Mail pass defined:', process.env.MAIL_PASS ? 'YES' : 'NO');
```

## CÁC BƯỚC KIỂM TRA LẠI

### BƯỚC 1: KIỂM TRA .ENV FILE

```bash
cd UTEShop_BE
cat .env | grep MAIL
```

**Kết quả mong muốn:**
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=holam24062003@gmail.com
MAIL_PASS=kpkl fppt zfok tlay
MAIL_FROM="UTEShop <holam24062003@gmail.com>"
```

### BƯỚC 2: KIỂM TRA ENVIRONMENT VARIABLES

```bash
node -e "
require('dotenv').config();
console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASS:', process.env.MAIL_PASS ? 'DEFINED' : 'UNDEFINED');
console.log('MAIL_HOST:', process.env.MAIL_HOST);
console.log('MAIL_PORT:', process.env.MAIL_PORT);
"
```

### BƯỚC 3: KHỞI ĐỘNG LẠI SERVER

```bash
cd UTEShop_BE
npm run dev
```

**Kiểm tra log khởi động:**
```
📧 Mailer Configuration (Admin-based):
  - MAIL_HOST: smtp.gmail.com
  - MAIL_PORT: 587
  - MAIL_USER: holam24062003@gmail.com
  - MAIL_PASS: DEFINED
  - MAIL_FROM: UTEShop <holam24062003@gmail.com>
🔍 Verifying SMTP connection...
📧 Mail user: holam24062003@gmail.com
📧 Mail host: smtp.gmail.com
📧 Mail port: 587
📧 Mail pass defined: YES
✅ SMTP connection verified: { success: true }
```

## TROUBLESHOOTING

### VẤN ĐỀ 1: Environment variables không được load

**Kiểm tra:**
```bash
# Kiểm tra xem .env có tồn tại không
ls -la .env

# Kiểm tra nội dung .env
head -10 .env
```

**Giải pháp:**
1. Đảm bảo file .env tồn tại
2. Đảm bảo không có khoảng trắng thừa
3. Đảm bảo dotenv được load sớm nhất

### VẤN ĐỀ 2: App Password không đúng

**Kiểm tra:**
```bash
# Test connection với telnet
telnet smtp.gmail.com 587
```

**Giải pháp:**
1. Tạo lại App Password mới
2. Cập nhật lại .env
3. Khởi động lại server

### VẤN ĐỀ 3: Firewall hoặc network issue

**Kiểm tra:**
```bash
# Test kết nối Gmail SMTP
openssl s_client -connect smtp.gmail.com:587 -starttls smtp
```

**Giải pháp:**
1. Kiểm tra firewall
2. Thử kết nối với mạng khác
3. Sử dụng VPN nếu cần

## TEST EMAIL FUNCTIONALITY

### Test 1: Test endpoint
```bash
curl -X POST http://localhost:5000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

### Test 2: Test qua frontend
1. Mở ứng dụng frontend
2. Đi đến trang đăng ký
3. Nhập email và click "Gửi OTP"
4. Kiểm tra console log

### Test 3: Test trực tiếp
```javascript
// Tạo file test-email.js
import { sendMail } from './src/config/mailer_admin_based.js';

sendMail({
  to: 'your-email@gmail.com',
  subject: 'Test Email',
  html: '<h1>Test Email</h1><p>This is a test email.</p>'
}).then(() => {
  console.log('✅ Test email sent successfully');
}).catch(error => {
  console.error('❌ Test email failed:', error);
});
```

## LOG SUCCESS MONG ĐỢI

```
📧 Register OTP request for: user@example.com (Admin-based email)
🔐 Creating OTP for user@example.com, type: register (Admin-based email)
🔐 Generated OTP for user@example.com: 123456
📧 Sending email to: user@example.com
📧 Subject: Xác thực đăng ký – Mã OTP
📧 From: UTEShop <holam24062003@gmail.com>
✅ Email sent successfully: <message-id>
📧 Email details: {
  messageId: '<message-id>',
  response: '250 2.0.0 OK',
  envelope: { from: 'holam24062003@gmail.com', to: [ 'user@example.com' ] }
}
✅ OTP email sent successfully to user@example.com (Admin-based)
```

## BACKUP PLAN

Nếu vẫn không hoạt động, rollback về phiên bản cũ:

```bash
cd UTEShop_BE/src/config
cp mailer_backup.js mailer.js

cd ../controllers
cp AuthController_backup.js AuthController.js

cd ../routes
cp authRoutes_backup.js authRoutes.js

# Khởi động lại server
npm run dev
```

## KẾT LUẬN

Vấn đề "Missing credentials for PLAIN" đã được khắc phục bằng cách:
1. ✅ Sử dụng environment variables thay vì hardcoded values
2. ✅ Cập nhật .env với đúng email configuration
3. ✅ Thêm logging chi tiết để debug
4. ✅ Đảm bảo dotenv được load đúng cách

**Sau khi áp dụng các thay đổi này, hệ thống email sẽ hoạt động với admin-based configuration.**