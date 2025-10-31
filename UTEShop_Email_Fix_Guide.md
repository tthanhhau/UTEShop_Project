# HƯỚNG DẪN KHẮC PHỤC VẤN ĐỀ GỬI EMAIL OTP

## TÓM TẮT VẤN ĐỀ

Người dùng không nhận được email OTP khi đăng ký hoặc quên mật khẩu do:
1. App Password của Gmail không hợp lệ hoặc hết hạn
2. Thiếu error handling khi gửi email
3. Không có logging để debug vấn đề

## CÁC BƯỚC KHẮC PHỤC

### BƯỚC 1: TẠO APP PASSWORD MỚI CHO GMAIL

1. **Truy cập Google Account Settings**
   ```
   https://myaccount.google.com/
   ```

2. **Bật 2-Step Verification** (nếu chưa bật)
   - Vào "Security" → "2-Step Verification"
   - Bật và làm theo hướng dẫn

3. **Tạo App Password**
   ```
   https://myaccount.google.com/apppasswords
   ```
   - Chọn "Mail" trên "Select app"
   - Chọn "Other (Custom name)" và nhập "UTEShop"
   - Click "Generate"
   - Copy password 16 ký tự (ví dụ: xxxx-xxxx-xxxx-xxxx)

### BƯỚC 2: CẬP NHẬT FILE .ENV

**Mở file:** `UTEShop_BE/.env`

**Thay thế dòng:**
```env
MAIL_PASS=mkpffybmwtplmlpl
```

**Thành:**
```env
MAIL_PASS=xxxx-xxxx-xxxx-xxxx  # App Password mới tạo
```

### BƯỚC 3: ÁP DỤNG CODE ĐÃ SỬA LỖI

#### 3.1 Backup file hiện tại
```bash
cd UTEShop_BE/src/config
cp mailer.js mailer_backup.js
```

#### 3.2 Thay thế mailer.js
```bash
cp mailer_fixed.js mailer.js
```

#### 3.3 Backup và thay thế AuthController
```bash
cd UTEShop_BE/src/controllers
cp AuthController.js AuthController_backup.js
cp AuthController_fixed.js AuthController.js
```

#### 3.4 Backup và thay thế authRoutes
```bash
cd UTEShop_BE/src/routes
cp authRoutes.js authRoutes_backup.js
cp authRoutes_fixed.js authRoutes.js
```

### BƯỚC 4: KHỞI ĐỘNG LẠI SERVER

```bash
cd UTEShop_BE
npm run dev
```

**Kiểm tra log khi khởi động:**
```
✅ SMTP connection verified: { success: true }
📧 Mail user: tthau2004bd77@gmail.com
📧 Mail host: gmail.com
```

### BƯỚC 5: KIỂM TRA EMAIL

#### 5.1 Test với API endpoint
```bash
curl -X POST http://localhost:5000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

#### 5.2 Test qua frontend
1. Mở ứng dụng frontend
2. Đi đến trang đăng ký
3. Nhập email và click "Gửi OTP"
4. Kiểm tra console log:
   ```
   📧 Sending email to: your-email@gmail.com
   ✅ Email sent successfully: <message-id>
   ```

### BƯỚC 6: KIỂM TRA LOG CHI TIẾT

Nếu vẫn không hoạt động, kiểm tra log server:

```bash
# Xem log khi gửi OTP
tail -f logs/combined.log | grep -E "(OTP|email|mail|SMTP)"

# Hoặc xem console output của server
```

**Log thành công:**
```
🔐 Creating OTP for user@example.com, type: register
🔐 Generated OTP for user@example.com: 123456
📧 Sending email to: user@example.com
📧 Subject: Xác thực đăng ký – Mã OTP
✅ Email sent successfully: <message-id>
✅ OTP email sent successfully to user@example.com
```

**Log thất bại:**
```
❌ Email sending failed: Error: Invalid login: 535-5.7.8 Username and Password not accepted
❌ Error details: { code: 'EAUTH', command: 'AUTH PLAIN' }
❌ Failed to send OTP email to user@example.com: Error: Failed to send email: Invalid login
```

## TROUBLESHOOTING

### VẤN ĐỀ 1: "Invalid login: 535-5.7.8"

**Nguyên nhân:** App Password không đúng

**Giải pháp:**
1. Tạo lại App Password mới
2. Cập nhật lại file .env
3. Khởi động lại server

### VẤN ĐỀ 2: "Host is unreachable"

**Nguyên nhân:** Kết nối mạng bị chặn

**Giải pháp:**
1. Kiểm tra firewall
2. Thử kết nối với mạng khác
3. Kiểm tra proxy settings

### VẤN ĐỀ 3: "Timeout"

**Nguyên nhân:** Server Gmail phản hồi chậm

**Giải pháp:**
1. Thêm timeout vào mailer config:
```javascript
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,    // 60 seconds
});
```

### VẤN ĐỀ 4: Email đi vào spam

**Giải pháp:**
1. Kiểm tra SPF, DKIM records
2. Sử dụng domain email thay vì Gmail
3. Thêm unsubscribe link

## ALTERNATIVE SOLUTIONS

### 1. SỬ DỤNG SENDGRID

**Cài đặt:**
```bash
npm install @sendgrid/mail
```

**Cấu hình:**
```javascript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendMail({ to, subject, html }) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html,
  };
  
  await sgMail.send(msg);
}
```

**Environment variables:**
```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@uteshop.com
```

### 2. SỬ DỤNG SMS OTP

**Cài đặt Twilio:**
```bash
npm install twilio
```

**Cấu hình:**
```javascript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSmsOtp(phone, code) {
  await client.messages.create({
    body: `Your UTEShop OTP is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}
```

## KIỂM TRA HOÀN TẤT

Sau khi áp dụng sửa lỗi, kiểm tra:

1. ✅ Server khởi động thành công với SMTP connection verified
2. ✅ Test email endpoint hoạt động
3. ✅ Đăng ký với OTP gửi email thành công
4. ✅ Quên mật khẩu với OTP gửi email thành công
5. ✅ User nhận được email với OTP đúng
6. ✅ OTP xác thực thành công
7. ✅ Error handling hoạt động khi email gửi thất bại

## BACKUP PLAN

Luôn giữ lại file backup:
- `mailer_backup.js`
- `AuthController_backup.js`
- `authRoutes_backup.js`

Nếu có vấn đề, có thể rollback:
```bash
cd UTEShop_BE/src/config
cp mailer_backup.js mailer.js

cd ../controllers
cp AuthController_backup.js AuthController.js

cd ../routes
cp authRoutes_backup.js authRoutes.js
```

## LIÊN HỆ HỖ TRỢ

Nếu vẫn không giải quyết được:
1. Kiểm tra log chi tiết trong console
2. Xác nhận App Password được tạo đúng cách
3. Kiểm tra firewall và network settings
4. Consider using alternative email service

---

**Sau khi hoàn thành các bước trên, hệ thống email OTP sẽ hoạt động bình thường với proper error handling và logging.**