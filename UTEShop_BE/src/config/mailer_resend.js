/**
 * Email service using Resend API
 * Free tier: 100 emails/day, 3000 emails/month
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'UTEShop <onboarding@resend.dev>';

export async function sendMail({ to, subject, html }) {
    if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not configured');
        throw new Error('Email service not configured');
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: MAIL_FROM,
                to: [to],
                subject: subject,
                html: html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Resend API error:', data);
            throw new Error(data.message || 'Failed to send email');
        }

        console.log('✅ Email sent successfully via Resend:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Email send error:', error);
        throw error;
    }
}

export default { sendMail };
