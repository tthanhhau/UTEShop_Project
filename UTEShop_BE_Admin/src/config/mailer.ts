import { Transporter, createTransport } from 'nodemailer';
import { ConfigService } from '@nestjs/config';

let transporter: Transporter;

export const createMailerTransporter = (configService: ConfigService) => {
    // Debug environment variables
    console.log('📧 Mailer Configuration:');
    console.log('  - MAIL_HOST:', configService.get('MAIL_HOST'));
    console.log('  - MAIL_PORT:', configService.get('MAIL_PORT'));
    console.log('  - MAIL_USER:', configService.get('MAIL_USER') ? configService.get('MAIL_USER').substring(0, 5) + '***' : 'UNDEFINED');
    console.log('  - MAIL_PASS:', configService.get('MAIL_PASS') ? 'DEFINED' : 'UNDEFINED');
    console.log('  - MAIL_FROM:', configService.get('MAIL_FROM'));

    transporter = createTransport({
        host: configService.get('MAIL_HOST') || 'smtp.gmail.com',
        port: Number(configService.get('MAIL_PORT') || 587),
        secure: String(configService.get('MAIL_PORT')) === '465', // 465 => SSL
        auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
        },
    });

    return transporter;
};

export { transporter };

// Named export: sendMail
export async function sendMail({ to, subject, text, html, from }: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}) {
    return transporter.sendMail({
        from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
        to,
        subject,
        text,
        html,
    });
}

// (tuỳ chọn) kiểm tra cấu hình SMTP
export async function verifyMailer() {
    return transporter.verify();
}