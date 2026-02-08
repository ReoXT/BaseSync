/**
 * Notification Email Sender
 *
 * Utility functions to send BaseSync notification emails.
 * Uses Wasp's emailSender for delivery and integrates with usage tracking.
 */
import type { User } from 'wasp/entities';
/**
 * Send "approaching limit" email when user hits 80% of their limit
 *
 * @param user - The user to notify
 * @param limitType - Type of limit being approached ('records' or 'syncs')
 * @param currentUsage - Current usage amount
 */
export declare function sendApproachingLimitEmail(user: User, limitType: 'records' | 'syncs', currentUsage: number): Promise<void>;
/**
 * Send "limit reached" email when user hits 100% of their limit
 *
 * @param user - The user to notify
 * @param limitType - Type of limit reached ('records' or 'syncs')
 * @param currentUsage - Current usage amount
 */
export declare function sendLimitReachedEmail(user: User, limitType: 'records' | 'syncs', currentUsage: number): Promise<void>;
/**
 * Send "trial ending soon" email (typically sent 3 days before expiry)
 *
 * @param user - The user to notify
 */
export declare function sendTrialEndingSoonEmail(user: User): Promise<void>;
/**
 * Send "sync failed" email notification
 *
 * @param user - The user to notify
 * @param syncName - Name of the sync that failed
 * @param errorMessage - Error message describing the failure
 */
export declare function sendSyncFailedEmail(user: User, syncName: string, errorMessage: string): Promise<void>;
/**
 * Check all trial users and send "trial ending soon" emails
 * This should be called daily via a background job
 */
export declare function checkAndSendTrialExpiringEmails(): Promise<void>;
/**
 * Check a specific user's usage and send limit emails if needed
 * Called during sync operations
 *
 * @param user - User to check
 * @param recordCount - Number of records being synced
 * @param currentSyncCount - Current number of sync configs
 */
export declare function checkAndSendUsageEmails(user: User, recordCount?: number, currentSyncCount?: number): Promise<void>;
//# sourceMappingURL=notificationSender.d.ts.map