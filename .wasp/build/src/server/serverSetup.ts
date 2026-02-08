/**
 * Server Setup - Executed on server startup
 *
 * Overrides Wasp's default email sender with Resend HTTP API
 */

import type { ServerSetupFn } from 'wasp/server';
import { resendEmailSender } from './email/resendEmailSender';

const serverSetup: ServerSetupFn = async () => {
  console.log('[Server Setup] Initializing BaseSync server...');

  // Override Wasp's emailSender module with Resend HTTP API
  try {
    // Dynamic require to get the actual module at runtime
    const emailModule = await import('wasp/server/email');

    if (emailModule && emailModule.emailSender) {
      console.log('[Server Setup] Overriding Wasp emailSender with Resend HTTP API');

      // Replace the send method
      const originalSend = emailModule.emailSender.send;
      emailModule.emailSender.send = async (args: any) => {
        console.log('[Email Override] Intercepted email send, using Resend HTTP API');
        return resendEmailSender.send(args);
      };

      console.log('[Server Setup] ✓ Resend HTTP API activated (no SMTP)');
    } else {
      console.warn('[Server Setup] emailSender not found in wasp/server/email module');
    }
  } catch (error) {
    console.error('[Server Setup] Failed to override email sender:', error);
    // Don't throw - let the app start even if override fails
  }

  console.log('[Server Setup] ✓ Server initialization complete');
};

export default serverSetup;
