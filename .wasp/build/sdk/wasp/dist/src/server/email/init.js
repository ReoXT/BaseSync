/**
 * Email Sender Initialization
 *
 * Overrides Wasp's default SMTP email sender with Resend HTTP API
 * Import this in server setup to activate the override
 */
import { resendEmailSender } from './resendEmailSender';
// Monkey-patch Wasp's emailSender module
// This is loaded before Wasp's email auth routes initialize
let emailSenderModule;
try {
    // Try to require the wasp email sender module
    emailSenderModule = require('wasp/server/email');
    // Override the send method
    if (emailSenderModule && emailSenderModule.emailSender) {
        console.log('[Email Init] Overriding Wasp email sender with Resend HTTP API');
        emailSenderModule.emailSender.send = resendEmailSender.send.bind(resendEmailSender);
        console.log('[Email Init] ✓ Resend HTTP API activated (no SMTP)');
    }
}
catch (error) {
    console.error('[Email Init] Failed to override email sender:', error);
}
export { resendEmailSender };
//# sourceMappingURL=init.js.map