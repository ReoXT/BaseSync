/**
 * Resend HTTP API Email Sender
 *
 * Replaces Wasp's default email sender with Resend's HTTP API
 * No SMTP - pure HTTP API (Railway-friendly)
 */
export interface EmailSender {
    send(email: {
        to: string;
        subject: string;
        text: string;
        html: string;
        from?: {
            name?: string;
            email: string;
        };
    }): Promise<void>;
}
declare class ResendEmailSender implements EmailSender {
    send(email: {
        to: string;
        subject: string;
        text: string;
        html: string;
        from?: {
            name?: string;
            email: string;
        };
    }): Promise<void>;
}
export declare const resendEmailSender: ResendEmailSender;
export default resendEmailSender;
//# sourceMappingURL=resendEmailSender.d.ts.map