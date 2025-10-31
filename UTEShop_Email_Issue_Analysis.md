# PHÂN TÍCH VẤN ĐỀ GỬI EMAIL OTP TRONG UTESHOP

## VẤN ĐỀ CHÍNH

Người dùng không nhận được email OTP khi đăng ký hoặc quên mật khẩu.

## NGUYÊN NHÂN GỐC RỄ

### 1. CẤU HÌNH EMAIL TRONG .ENV

**File: `UTEShop_BE/.env`**
```env
# Gmail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tthau2004bd77@gmail.com
MAIL_PASS=mkpffybmwtplmlpl   # <-- thay bằng App Password của Gmail
MAIL_FROM="Your Fashion Shop <tthau2004bd77@gmail.com>"
```

**Vấn đề:**
- `MAIL_PASS=mkpffybmwtplmlpl` có thể là App Password đã hết hạn hoặc không hợp lệ
- Gmail yêu cầu sử dụng **App Password** thay vì mật khẩu thông thường
- Có thể tài khoản Gmail chưa bật **Less Secure App Access** hoặc **2-Step Verification**

### 2. CẤU HÌNH MAILER TRANSPORT

**File: `UTEShop_BE/src/config/mailer.js`**
```javascript
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
```

**Vấn đề:**
- Không có error handling chi tiết khi gửi email thất bại
- Không có logging để debug vấn đề
- Không có fallback mechanism khi email gửi thất bại

### 3. XỬ LÝ LỖI TRONG AUTH CONTROLLER

**File: `UTEShop_BE/src/controllers/AuthController.js`**
```javascript
async function createAndSendOtp(email, type, title) {
  // clear OTP cũ cùng type
  await Otp.deleteMany({ email, type });

  const code = generateOtp(); // 6 chữ số
  const codeHash = await hash(code);
  const expiresAt = addMinutes(new Date(), 10); // 10 phút

  await Otp.create({ email, codeHash, type, expiresAt, attempts: 0 });

  await sendMail({
    to: email,
    subject: `${title} – Mã OTP`,
    html: otpHtml({ title, code }),
  });
  // ❌ KHÔNG CÓ ERROR HANDLING CHO sendMail()
}
```

**Vấn đề:**
- Hàm `createAndSendOtp` không có try-catch cho việc gửi email
- Nếu email gửi thất bại, OTP vẫn được lưu vào database nhưng user không nhận được
- Không có thông báo lỗi cho user khi email gửi thất bại

### 4. FLOW XỬ LÝ KHI GỬI EMAIL THẤT BẠI

Khi `sendMail()` thất bại:
1. OTP vẫn được tạo và lưu vào database ✅
2. Email không được gửi ❌
3. Frontend nhận response "OTP đã được gửi" ✅
4. User không nhận được email ❌
5. User không biết có lỗi xảy ra ❌

---

## GIẢI PHÁP CHI TIẾT

### 1. CẬP NHẬT CẤU HÌNH EMAIL

**Bước 1: Tạo App Password cho Gmail**
```bash
1. Vào: https://myaccount.google.com/apppasswords
2. Chọn "Mail" trên "Select app"
3. Chọn "Other (Custom name)" và nhập "UTEShop"
4. Copy password được tạo (16 ký tự)
5. Cập nhật vào .env
```

**Bước 2: Cập nhật .env**
```env
# Gmail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tthau2004bd77@gmail.com
MAIL_PASS=xxxx-xxxx-xxxx-xxxx  # App Password mới tạo
MAIL_FROM="UTEShop <tthau2004bd77@gmail.com>"
```

### 2. CẢI THIỆN MAILER CONFIGURATION

**File: `UTEShop_BE/src/config/mailer.js`**
```javascript
// ESM
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // Thêm các cấu hình quan trọng
  tls: {
    rejectUnauthorized: false // Cho phép kết nối TLS
  },
  debug: process.env.NODE_ENV === 'development', // Debug trong development
  logger: process.env.NODE_ENV === 'development' // Log trong development
});

// Named export: sendMail với error handling
export async function sendMail({ to, subject, text, html, from }) {
  try {
    console.log('📧 Sending email to:', to);
    console.log('📧 Subject:', subject);
    
    const result = await transporter.sendMail({
      from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
      to,
      subject,
      text,
      html,
    });
    
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Kiểm tra kết nối SMTP với chi tiết
export async function verifyMailer() {
  try {
    const result = await transporter.verify();
    console.log('✅ SMTP connection verified:', result);
    return result;
  } catch (error) {
    console.error('❌ SMTP connection error:', error);
    console.error('❌ Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
}

// Kiểm tra kết nối ngay khi khởi động
verifyMailer().catch(console.error);
```

### 3. CẢI THIỆN AUTH CONTROLLER

**File: `UTEShop_BE/src/controllers/AuthController.js`**
```javascript
async function createAndSendOtp(email, type, title) {
  try {
    // clear OTP cũ cùng type
    await Otp.deleteMany({ email, type });

    const code = generateOtp(); // 6 chữ số
    const codeHash = await hash(code);
    const expiresAt = addMinutes(new Date(), 10); // 10 phút

    // Lưu OTP vào database
    await Otp.create({ email, codeHash, type, expiresAt, attempts: 0 });

    console.log(`🔐 Generated OTP for ${email}: ${code}`);

    try {
      // Gửi email
      await sendMail({
        to: email,
        subject: `${title} – Mã OTP`,
        html: otpHtml({ title, code }),
      });
      
      console.log(`✅ OTP email sent successfully to ${email}`);
      return { success: true, message: 'OTP đã được gửi' };
    } catch (emailError) {
      console.error(`❌ Failed to send OTP email to ${email}:`, emailError);
      
      // Xóa OTP đã tạo vì email gửi thất bại
      await Otp.deleteMany({ email, type });
      
      throw new Error(`Không thể gửi email OTP: ${emailError.message}`);
    }
  } catch (error) {
    console.error('❌ Error in createAndSendOtp:', error);
    throw error;
  }
}

// 1) Gửi OTP đăng ký với error handling
export const registerRequestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const exists = await User.findOne({ email }).lean();
  if (exists) return res.status(409).json({ message: 'Email đã tồn tại' });

  try {
    await createAndSendOtp(email, 'register', 'Xác thực đăng ký');
    return res.json({ message: 'OTP đã được gửi đến email của bạn' });
  } catch (error) {
    console.error('❌ Register OTP request failed:', error);
    return res.status(500).json({ 
      message: 'Không thể gửi OTP. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3) Gửi OTP quên mật khẩu với error handling
export const resetRequestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  try {
    await createAndSendOtp(email, 'reset', 'Đặt lại mật khẩu');
    return res.json({ message: 'OTP đã được gửi đến email của bạn' });
  } catch (error) {
    console.error('❌ Reset OTP request failed:', error);
    return res.status(500).json({ 
      message: 'Không thể gửi OTP. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

### 4. THÊM EMAIL TESTING ENDPOINT

**File: `UTEShop_BE/src/routes/authRoutes.js`**
```javascript
// Thêm route test email (chỉ cho development)
if (process.env.NODE_ENV === 'development') {
  router.post("/test-email", async (req, res) => {
    try {
      const { email } = req.body;
      await sendMail({
        to: email,
        subject: 'Test Email from UTEShop',
        html: '<h1>Test Email</h1><p>This is a test email from UTEShop.</p>'
      });
      res.json({ message: 'Test email sent successfully' });
    } catch (error) {
      console.error('Test email failed:', error);
      res.status(500).json({ 
        message: 'Test email failed',
        error: error.message 
      });
    }
  });
}
```

---

## KIỂM TRA VÀ DEBUG

### 1. KIỂM TRA KẾT NỐI SMTP

```bash
# Test kết nối SMTP
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tthau2004bd77@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

### 2. KIỂM TRA LOG SERVER

```bash
# Kiểm tra log khi gửi OTP
tail -f logs/combined.log | grep -E "(OTP|email|mail)"
```

### 3. TEST EMAIL MANUALLY

```javascript
// Test script
import sendMail from './src/config/mailer.js';

sendMail({
  to: 'your-test-email@gmail.com',
  subject: 'Test OTP',
  html: '<h1>Test OTP: 123456</h1>'
}).then(() => {
  console.log('Test email sent successfully');
}).catch(error => {
  console.error('Test email failed:', error);
});
```

---

## GIẢI PHÁP ALTERNATIVE

### 1. SỬ DỤNG EMAIL SERVICE KHÁC

**SendGrid Configuration:**
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendMail({ to, subject, html }) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html,
  };
  
  try {
    await sgMail.send(msg);
    console.log('✅ SendGrid email sent successfully');
  } catch (error) {
    console.error('❌ SendGrid email failed:', error);
    throw error;
  }
}
```

### 2. SỬ DỤNG SMS OTP

**Twilio SMS Integration:**
```javascript
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSmsOtp(phone, code) {
  try {
    await client.messages.create({
      body: `Your UTEShop OTP is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    console.log('✅ SMS OTP sent successfully');
  } catch (error) {
    console.error('❌ SMS OTP failed:', error);
    throw error;
  }
}
```

---

## KẾT LUẬN

Vấn đề chính là:
1. **App Password không hợp lệ hoặc hết hạn**
2. **Thiếu error handling** khi gửi email
3. **Không có logging** để debug vấn đề
4. **User không nhận được thông báo** khi email gửi thất bại

**Các bước cần thực hiện:**
1. Tạo App Password mới cho Gmail
2. Cập nhật cấu hình mailer với error handling chi tiết
3. Cải thiện Auth Controller với proper error handling
4. Thêm logging và testing endpoints
5. Test kỹ trước khi deploy

Sau khi thực hiện các thay đổi này, hệ thống sẽ:
- Gửi email OTP thành công
- Thông báo lỗi rõ ràng cho user khi có vấn đề
- Log chi tiết để admin có thể debug
- Có fallback mechanism khi cần thiết