// ESM
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Named export: sendMail
export async function sendMail({ to, subject, text, html, from }) {
  return transporter.sendMail({
    from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

// Kiểm tra kết nối SMTP
export async function verifyMailer() {
  try {
    const result = await transporter.verify();
    console.log('✅ SMTP connection verified:', result);
    return result;
  } catch (error) {
    console.error('❌ SMTP connection error:', error);
    throw error;
  }
}

// Kiểm tra kết nối ngay khi khởi động
verifyMailer().catch(console.error);
