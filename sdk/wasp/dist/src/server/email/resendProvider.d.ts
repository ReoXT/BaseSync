/**
 * Custom Resend Email Provider for Wasp
 *
 * Uses Resend HTTP API instead of SMTP (Railway blocks SMTP ports)
 */
import type { EmailSender } from 'wasp/server/email';
export declare function createResendEmailSender(): EmailSender;
//# sourceMappingURL=resendProvider.d.ts.map