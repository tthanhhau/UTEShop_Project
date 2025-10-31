// ESM - Based on working admin configuration
import nodemailer from 'nodemailer';

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
console.log('📧 Mailer Configuration (Admin-based):');
console.log('  - MAIL_HOST:', process.env.MAIL_HOST || 'smtp.gmail.com');
console.log('  - MAIL_PORT:', process.env.MAIL_PORT || '587');
console.log('  - MAIL_USER:', process.env.MAIL_USER || 'holam24062003@gmail.com');
console.log('  - MAIL_PASS:', process.env.MAIL_PASS ? 'DEFINED' : 'UNDEFINED');
console.log('  - MAIL_FROM:', process.env.MAIL_FROM || 'Your Fashion Shop <holam24062003@gmail.com>');

// Named export: sendMail với error handling chi tiết
export async function sendMail({ to, subject, text, html, from }) {
    try {
        console.log('📧 Sending email to:', to);
        console.log('📧 Subject:', subject);
        console.log('📧 From:', from || process.env.MAIL_FROM || process.env.MAIL_USER);

        const result = await transporter.sendMail({
            from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
            to,
            subject,
            text,
            html,
        });

        console.log('✅ Email sent successfully:', result.messageId);
        console.log('📧 Email details:', {
            messageId: result.messageId,
            response: result.response,
            envelope: result.envelope
        });

        return result;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        console.error('❌ Error details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            message: error.message
        });
        throw new Error(`Failed to send email: ${error.message}`);
    }
}

// Kiểm tra kết nối SMTP với chi tiết
export async function verifyMailer() {
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