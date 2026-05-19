// ESM
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env is loaded before reading MAILJET/SMTP settings
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
const MAILJET_SENDER_EMAIL = process.env.MAILJET_SENDER_EMAIL;
const USE_MAILJET = !!(MAILJET_API_KEY && MAILJET_SECRET_KEY);

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: String(process.env.MAIL_PORT) === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendViaMailjet({ to, subject, html, text }) {
  const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString('base64');
  const senderEmail = MAILJET_SENDER_EMAIL || process.env.MAIL_FROM || process.env.MAIL_USER;

  if (!senderEmail) {
    throw new Error('MAILJET_SENDER_EMAIL or MAIL_FROM is required for Mailjet');
  }

  const response = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: senderEmail, Name: 'UTEShop' },
          To: [{ Email: to }],
          Subject: subject,
          HTMLPart: html,
          TextPart: text || '',
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok || (data.Messages && data.Messages[0]?.Status === 'error')) {
    throw new Error(data.Messages?.[0]?.Errors?.[0]?.ErrorMessage || 'Mailjet send failed');
  }

  return { success: true, messageId: data.Messages?.[0]?.To?.[0]?.MessageID };
}

// Named export: sendMail
export async function sendMail({ to, subject, text, html, from }) {
  if (USE_MAILJET) {
    return sendViaMailjet({ to, subject, html, text });
  }

  return transporter.sendMail({
    from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

// Kiểm tra kết nối SMTP (chỉ khi không dùng Mailjet)
export async function verifyMailer() {
  if (USE_MAILJET) {
    console.log('✅ Using Mailjet API - no SMTP verification needed');
    return true;
  }

  try {
    const result = await transporter.verify();
    console.log('✅ SMTP connection verified:', result);
    return result;
  } catch (error) {
    console.error('❌ SMTP connection error:', error);
    throw error;
  }
}

verifyMailer().catch(console.error);
