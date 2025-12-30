import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
    private transporter: Transporter;
    private useMailjet: boolean = false;
    private mailjetApiKey: string = '';
    private mailjetSecretKey: string = '';
    private mailjetSenderEmail: string = '';

    constructor(private configService: ConfigService) {
        this.initializeMailer();
    }

    private initializeMailer() {
        // Check for Mailjet credentials first (priority)
        this.mailjetApiKey = this.configService.get('MAILJET_API_KEY') || process.env.MAILJET_API_KEY || '';
        this.mailjetSecretKey = this.configService.get('MAILJET_SECRET_KEY') || process.env.MAILJET_SECRET_KEY || '';
        this.mailjetSenderEmail = this.configService.get('MAILJET_SENDER_EMAIL') || process.env.MAILJET_SENDER_EMAIL || 'bachphuc018@gmail.com';

        this.useMailjet = !!(this.mailjetApiKey && this.mailjetSecretKey);

        console.log('📧 Admin Mailer Configuration:');
        console.log('  - USE_MAILJET:', this.useMailjet);

        if (this.useMailjet) {
            console.log('  - MAILJET: CONFIGURED ✅');
            // No need to initialize nodemailer transporter for Mailjet
        } else {
            // Fallback to SMTP (Gmail)
            const mailHost = this.configService.get('MAIL_HOST') || process.env.MAIL_HOST || 'smtp.gmail.com';
            const mailPort = this.configService.get('MAIL_PORT') || process.env.MAIL_PORT || 587;
            const mailUser = this.configService.get('MAIL_USER') || process.env.MAIL_USER;
            const mailPass = this.configService.get('MAIL_PASS') || process.env.MAIL_PASS;

            console.log('  - SMTP Host:', mailHost);
            console.log('  - SMTP User:', mailUser ? 'CONFIGURED ✅' : 'NOT SET ❌');

            this.transporter = createTransport({
                host: mailHost,
                port: Number(mailPort),
                secure: String(mailPort) === '465',
                auth: {
                    user: mailUser,
                    pass: mailPass,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        }
    }

    // Send email via Mailjet API
    private async sendViaMailjet(options: { to: string; subject: string; html?: string; text?: string }) {
        console.log('📧 Sending email via Mailjet API to:', options.to);

        const auth = Buffer.from(`${this.mailjetApiKey}:${this.mailjetSecretKey}`).toString('base64');

        const response = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Messages: [{
                    From: {
                        Email: this.mailjetSenderEmail,
                        Name: 'UTEShop Admin'
                    },
                    To: [{
                        Email: options.to
                    }],
                    Subject: options.subject,
                    HTMLPart: options.html || options.text,
                    TextPart: options.text || ''
                }]
            })
        });

        const data = await response.json();

        if (!response.ok || (data.Messages && data.Messages[0]?.Status === 'error')) {
            console.error('❌ Mailjet API error:', data);
            throw new Error(data.Messages?.[0]?.Errors?.[0]?.ErrorMessage || 'Failed to send email via Mailjet');
        }

        console.log('✅ Email sent successfully via Mailjet');
        return { success: true, messageId: data.Messages?.[0]?.To?.[0]?.MessageID };
    }

    async sendMail(options: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
        from?: string;
    }) {
        // Priority 1: Mailjet (instant activation, 200 emails/day free)
        if (this.useMailjet) {
            try {
                return await this.sendViaMailjet({
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                    text: options.text
                });
            } catch (mailjetError) {
                console.error('❌ Mailjet failed:', mailjetError.message);
                // If Mailjet fails and we have SMTP configured, try that
                if (this.transporter) {
                    console.log('🔄 Falling back to SMTP...');
                } else {
                    throw mailjetError;
                }
            }
        }

        // Fallback: SMTP (Gmail)
        try {
            const mailFrom = this.configService.get('MAIL_FROM') || this.configService.get('MAIL_USER') || process.env.MAIL_USER;

            const result = await this.transporter.sendMail({
                from: options.from || mailFrom,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });

            console.log('📧 Email sent successfully via SMTP:', { to: options.to, subject: options.subject });
            return result;
        } catch (error) {
            console.error('❌ Failed to send email via SMTP:', error);
            throw error;
        }
    }
}
