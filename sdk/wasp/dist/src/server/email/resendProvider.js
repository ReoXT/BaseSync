/**
 * Custom Resend Email Provider for Wasp
 *
 * Uses Resend HTTP API instead of SMTP (Railway blocks SMTP ports)
 */
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
export function createResendEmailSender() {
    return {
        async send(email) {
            const fromEmail = email.from?.email || 'noreply@basesync.app';
            const fromName = email.from?.name || 'BaseSync';
            const from = `${fromName} <${fromEmail}>`;
            try {
                console.log(`Sending email to ${email.to} via Resend HTTP API`);
                const { data, error } = await resend.emails.send({
                    from,
                    to: email.to,
                    subject: email.subject,
                    text: email.text,
                    html: email.html,
                });
                if (error) {
                    console.error('Resend API error:', error);
                    throw new Error(`Failed to send email: ${error.message}`);
                }
                console.log(`Email sent successfully to ${email.to}`, data);
            }
            catch (error) {
                console.error('Failed to send email:', error);
                throw error;
            }
        },
    };
}
//# sourceMappingURL=resendProvider.js.map