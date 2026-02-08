/**
 * Airtable Webhook Handler (PLACEHOLDER - NOT YET IMPLEMENTED)
 *
 * TODO: Implement real-time sync via Airtable webhooks when moving beyond MVP
 *
 * Current Status: MVP uses 5-minute polling job instead of webhooks
 * Future Enhancement: Real-time sync when Airtable data changes
 *
 * Airtable Webhooks Documentation:
 * https://airtable.com/developers/web/api/webhooks-overview
 *
 * Limitations to be aware of:
 * - Webhooks require specification endpoint (must be publicly accessible)
 * - Webhooks have payload size limits
 * - Need to handle webhook registration and renewal
 * - Require HMAC signature verification for security
 */
import type { Request, Response } from 'express';
/**
 * Airtable webhook payload structure
 * Based on Airtable API documentation
 */
export interface AirtableWebhookPayload {
    base: {
        id: string;
    };
    webhook: {
        id: string;
    };
    timestamp: string;
    /**
     * Contains information about what changed
     * Can include: created records, updated records, deleted records, changed fields
     */
    changedTablesById?: Record<string, {
        createdRecordsById?: Record<string, any>;
        changedRecordsById?: Record<string, any>;
        destroyedRecordIds?: string[];
        changedMetadata?: any;
    }>;
}
/**
 * Webhook registration configuration
 */
export interface WebhookRegistration {
    baseId: string;
    notificationUrl: string;
    specification: {
        options: {
            filters: {
                dataTypes: ('tableData' | 'tableFields' | 'tableMetadata')[];
                recordChangeScope?: string;
            };
        };
    };
}
/**
 * TODO: Main webhook endpoint to receive Airtable webhook POSTs
 *
 * This function should:
 * 1. Verify the webhook request is authentic (HMAC signature)
 * 2. Parse the webhook payload
 * 3. Identify which sync configurations are affected
 * 4. Trigger appropriate sync operations
 * 5. Return 200 OK quickly (process async to avoid timeouts)
 *
 * Express route should be: POST /api/webhooks/airtable
 */
export declare function handleAirtableWebhook(req: Request, res: Response): Promise<void>;
/**
 * TODO: Verify webhook request authenticity using HMAC signature
 *
 * Airtable signs webhook payloads with HMAC SHA256
 * Signature is sent in 'x-airtable-content-mac' header
 */
declare function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
/**
 * TODO: Register a webhook with Airtable for a specific base/table
 *
 * This should be called when user creates a new sync configuration
 * Webhooks need to be renewed periodically (7 days)
 */
declare function registerWebhook(accessToken: string, baseId: string, tableId: string, notificationUrl: string): Promise<string>;
/**
 * TODO: Renew a webhook before it expires (7 day expiration)
 *
 * Should be called by a cron job every 5 days or so
 */
declare function renewWebhook(accessToken: string, baseId: string, webhookId: string): Promise<void>;
/**
 * TODO: Delete a webhook when sync configuration is deleted
 */
declare function deleteWebhook(accessToken: string, baseId: string, webhookId: string): Promise<void>;
/**
 * TODO: Process webhook payload and trigger appropriate sync
 *
 * This is called asynchronously after webhook is received
 */
declare function processWebhookChange(payload: AirtableWebhookPayload): Promise<void>;
export { verifyWebhookSignature, registerWebhook, renewWebhook, deleteWebhook, processWebhookChange, };
//# sourceMappingURL=airtableWebhook.d.ts.map