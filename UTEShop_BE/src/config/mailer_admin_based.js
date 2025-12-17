// ESM - Based on working admin configuration with Brevo/Resend fallback
import nodemailer from 'nodemailer';

// Check which email service to use
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const USE_BREVO = !!BREVO_API_KEY;
const USE_RESEND = !!RESEND_API_KEY && !USE_BREVO; // Brevo ưu tiên hơn Resend

export const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER || 'holam24062003@gmail.com',
        pass: process.env.MAIL_PASS || 'kpkl fppt zfok tlay', // App Password từ admin backend
    },
    tls: {
        rejectUnauthorized: false // Cho phép kết nối TLS
    }
});

// Debug configuration
console.log('📧 Mailer Configuration:');
console.log('  - USE_BREVO:', USE_BREVO);
console.log('  - USE_RESEND:', USE_RESEND);
if (USE_BREVO) {
    console.log('  - BREVO_API_KEY:', 'CONFIGURED ✅');
} else if (USE_RESEND) {
    console.log('  - RESEND_API_KEY:', 'CONFIGURED ✅');
} else {
    console.log('  - MAIL_HOST:', process.env.MAIL_HOST || 'smtp.gmail.com');
    console.log('  - MAIL_PORT:', process.env.MAIL_PORT || '587');
    console.log('  - MAIL_USER:', process.env.MAIL_USER || 'holam24062003@gmail.com');
    console.log('  - MAIL_PASS:', process.env.MAIL_PASS ? 'DEFINED' : 'UNDEFINED');
}

// Send email via Brevo (SendinBlue) API - 300 emails/day FREE, no domain verification needed
async function sendViaBrevo({ to, subject, html }) {
    console.log('📧 Sending email via Brevo API to:', to);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: 'UTEShop',
                email: process.env.BREVO_SENDER_EMAIL || 'bachphuc018@gmail.com'
            },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Brevo API error:', data);
        throw new Error(data.message || 'Failed to send email via Brevo');
    }

    console.log('✅ Email sent successfully via Brevo:', data.messageId);
    return { success: true, messageId: data.messageId };
}

// Send email via Resend API
async function sendViaResend({ to, subject, html }) {
    console.log('📧 Sending email via Resend API to:', to);

    // QUAN TRỌNG: Resend free tier chỉ cho phép gửi từ onboarding@resend.dev
    // Không được dùng gmail.com hoặc domain chưa verify
    const fromEmail = 'UTEShop <onboarding@resend.dev>';

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject: subject,
            html: html,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Resend API error:', data);
        throw new Error(data.message || 'Failed to send email via Resend');
    }

    console.log('✅ Email sent successfully via Resend:', data.id);
    return { success: true, messageId: data.id };
}

// Named export: sendMail với error handling chi tiết và Brevo/Resend fallback
export async function sendMail({ to, subject, text, html, from }) {
    // Ưu tiên 1: Brevo (không cần verify domain)
    if (USE_BREVO) {
        try {
            return await sendViaBrevo({ to, subject, html });
        } catch (brevoError) {
            console.error('❌ Brevo failed, trying other methods:', brevoError.message);
        }
    }

    // Ưu tiên 2: Resend (cần verify domain để gửi đến email khác)
    if (USE_RESEND) {
        try {
            return await sendViaResend({ to, subject, html });
        } catch (resendError) {
            console.error('❌ Resend failed, trying Gmail SMTP:', resendError.message);
        }
    }

    // Gmail SMTP
    try {
        console.log('📧 Sending email via Gmail SMTP to:', to);
        console.log('📧 Subject:', subject);
        console.log('📧 From:', from || process.env.MAIL_FROM || process.env.MAIL_USER);

        const result = await transporter.sendMail({
            from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
            to,
            subject,
            text,
            html,
        });

        console.log('✅ Email sent successfully via Gmail:', result.messageId);
        console.log('📧 Email details:', {
            messageId: result.messageId,
            response: result.response,
            envelope: result.envelope
        });

        return result;
    } catch (error) {
        console.error('❌ Gmail SMTP failed:', error);
        console.error('❌ Error details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            message: error.message
        });
        throw new Error(`Failed to send email: ${error.message}`);
    }
}

// Kiểm tra kết nối email service
export async function verifyMailer() {
    // Nếu dùng Brevo hoặc Resend, không cần verify SMTP
    if (USE_BREVO) {
        console.log('✅ Using Brevo API - no SMTP verification needed');
        return true;
    }
    if (USE_RESEND) {
        console.log('✅ Using Resend API - no SMTP verification needed');
        return true;
    }

    try {
        console.log('🔍 Verifying SMTP connection...');
        console.log('📧 Mail user:', process.env.MAIL_USER);
        console.log('📧 Mail host:', process.env.MAIL_HOST);
        console.log('📧 Mail port:', process.env.MAIL_PORT);
        console.log('📧 Mail pass defined:', process.env.MAIL_PASS ? 'YES' : 'NO');

        const result = await transporter.verify();
        console.log('✅ SMTP connection verified:', result);
        return result;
    } catch (error) {
        console.error('❌ SMTP connection error:', error);
        console.error('❌ Error details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            message: error.message
        });
        throw error;
    }
}

// Test email function
export async function testEmail(email) {
    try {
        console.log('🧪 Testing email to:', email);

        const result = await sendMail({
            to: email,
            subject: 'UTEShop - Test Email (Admin-based)',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">UTEShop Email Test (Admin-based Configuration)</h2>
          <p>This is a test email from UTEShop using the admin email configuration.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Timestamp: ${new Date().toLocaleString()}</li>
              <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
              <li>Mail Service: Gmail (Admin-based)</li>
              <li>From: holam24062003@gmail.com</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 14px;">If you receive this email, the admin-based email configuration is working correctly.</p>
        </div>
      `
        });

        console.log('✅ Test email sent successfully');
        return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
        console.error('❌ Test email failed:', error);
        return { success: false, error: error.message };
    }
}

// Kiểm tra kết nối ngay khi khởi động
verifyMailer().catch(error => {
    console.error('❌ Failed to verify mailer on startup:', error.message);
    console.error('⚠️  Email functionality may not work properly');
});