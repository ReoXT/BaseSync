/**
 * Resend HTTP API Email Sender
 *
 * Replaces Wasp's default email sender with Resend's HTTP API
 * No SMTP - pure HTTP API (Railway-friendly)
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailSender {
  send(email: {
    to: string;
    subject: string;
    text: string;
    html: string;
    from?: { name?: string; email: string };
  }): Promise<void>;
}

class ResendEmailSender implements EmailSender {
  async send(email: {
    to: string;
    subject: string;
    text: string;
    html: string;
    from?: { name?: string; email: string };
  }): Promise<void> {
    const fromEmail = email.from?.email || 'noreply@basesync.app';
    const fromName = email.from?.name || 'BaseSync';
    const from = `${fromName} <${fromEmail}>`;

    try {
      console.log(`[Resend HTTP API] Sending email to ${email.to}: ${email.subject}`);

      const { data, error } = await resend.emails.send({
        from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      if (error) {
        console.error('[Resend HTTP API] Error:', error);
        throw new Error(`Resend API error: ${error.message}`);
      }

      console.log(`[Resend HTTP API] ✓ Email sent successfully:`, data?.id);
    } catch (error: any) {
      console.error('[Resend HTTP API] Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

// Create singleton instance
export const resendEmailSender = new ResendEmailSender();

// Export for Wasp compatibility
export default resendEmailSender;
