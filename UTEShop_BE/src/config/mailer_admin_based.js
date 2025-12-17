// ESM - Based on working admin configuration with Resend fallback
import nodemailer from 'nodemailer';

// Check if Resend API is configured (preferred for production/Render)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const USE_RESEND = !!RESEND_API_KEY;

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
console.log('  - USE_RESEND:', USE_RESEND);
if (USE_RESEND) {
    console.log('  - RESEND_API_KEY:', 'CONFIGURED ✅');
} else {
    console.log('  - MAIL_HOST:', process.env.MAIL_HOST || 'smtp.gmail.com');
    console.log('  - MAIL_PORT:', process.env.MAIL_PORT || '587');
    console.log('  - MAIL_USER:', process.env.MAIL_USER || 'holam24062003@gmail.com');
    console.log('  - MAIL_PASS:', process.env.MAIL_PASS ? 'DEFINED' : 'UNDEFINED');
}
console.log('  - MAIL_FROM:', process.env.MAIL_FROM || 'UTEShop <onboarding@resend.dev>');

// Send email via Resend API
async function sendViaResend({ to, subject, html }) {
    console.log('📧 Sending email via Resend API to:', to);

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: process.env.MAIL_FROM || 'UTEShop <onboarding@resend.dev>',
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

// Named export: sendMail với error handling chi tiết và Resend fallback
export async function sendMail({ to, subject, text, html, from }) {
    // Nếu có Resend API key, ưu tiên dùng Resend
    if (USE_RESEND) {
        try {
            return await sendViaResend({ to, subject, html });
        } catch (resendError) {
            console.error('❌ Resend failed, trying Gmail SMTP:', resendError.message);
            // Fallback to Gmail if Resend fails
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
    // Nếu dùng Resend, không cần verify SMTP
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