// ESM - Fixed version with proper error handling
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
        console.log('📧 Mail host:', process.env.MAIL_HOST || 'gmail.com');

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
            subject: 'UTEShop - Test Email',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">UTEShop Email Test</h2>
          <p>This is a test email from UTEShop to verify email configuration.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Timestamp: ${new Date().toLocaleString()}</li>
              <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
              <li>Mail Service: Gmail</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 14px;">If you receive this email, the email configuration is working correctly.</p>
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