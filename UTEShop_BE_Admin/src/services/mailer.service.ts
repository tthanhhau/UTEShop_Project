import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailerService {
    private transporter: Transporter;
    private envVars: any = {};

    constructor(private configService: ConfigService) {
        this.loadEnvFile();
        this.initializeMailer();
    }

    private loadEnvFile() {
        try {
            const envPath = path.join(__dirname, '../..', '.env');
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envLines = envContent.split('\n');

            envLines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join('=').replace(/^"|"$/g, ''); // Remove quotes
                        this.envVars[key.trim()] = value;
                    }
                }
            });
        } catch (error) {
            console.error('❌ Failed to load .env file:', error);
        }
    }

    private initializeMailer() {
        const mailHost = this.envVars.MAIL_HOST || this.configService.get('MAIL_HOST') || 'smtp.gmail.com';
        const mailPort = this.envVars.MAIL_PORT || this.configService.get('MAIL_PORT') || 587;
        const mailUser = this.envVars.MAIL_USER || this.configService.get('MAIL_USER');
        const mailPass = this.envVars.MAIL_PASS || this.configService.get('MAIL_PASS');
        const mailFrom = this.envVars.MAIL_FROM || this.configService.get('MAIL_FROM');

        this.transporter = createTransport({
            host: mailHost,
            port: Number(mailPort),
            secure: String(mailPort) === '465', // 465 => SSL
            auth: {
                user: mailUser,
                pass: mailPass,
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates
            }
        });
    }

    async sendMail(options: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
        from?: string;
    }) {
        try {
            const mailFrom = this.envVars.MAIL_FROM || this.configService.get('MAIL_FROM') || this.envVars.MAIL_USER || this.configService.get('MAIL_USER');

            const result = await this.transporter.sendMail({
                from: options.from || mailFrom,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });

            console.log('📧 Email sent successfully:', { to: options.to, subject: options.subject });
            return result;
        } catch (error) {
            console.error('❌ Failed to send email:', error);
            throw error;
        }
    }
}