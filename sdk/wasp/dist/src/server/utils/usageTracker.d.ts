/**
 * Usage Tracking Utilities
 *
 * Tracks monthly usage metrics for billing and limit enforcement:
 * - Records synced
 * - Sync configurations created
 */
import type { User } from 'wasp/entities';
/**
 * Track records synced for a user
 *
 * Increments the monthly recordsSynced counter
 *
 * @param userId - User ID
 * @param count - Number of records synced
 */
export declare function trackRecordsSynced(userId: string, count: number): Promise<void>;
/**
 * Track sync configuration creation
 *
 * Increments the monthly syncConfigsCreated counter
 *
 * @param userId - User ID
 */
export declare function trackSyncConfigCreated(userId: string): Promise<void>;
/**
 * Get current month's usage statistics for a user
 *
 * @param userId - User ID
 * @returns Current month's usage stats
 */
export declare function getMonthlyUsage(userId: string): Promise<{
    recordsSynced: number;
    syncConfigsCreated: number;
    month: Date;
}>;
/**
 * Get usage statistics for a specific month
 *
 * @param userId - User ID
 * @param month - Month to query (defaults to current month)
 * @returns Usage stats for the specified month, or null if doesn't exist
 */
export declare function getUsageForMonth(userId: string, month?: Date): Promise<{
    recordsSynced: number;
    syncConfigsCreated: number;
    month: Date;
} | null>;
/**
 * Get usage history for a user (last N months)
 *
 * @param userId - User ID
 * @param months - Number of months to retrieve (default: 6)
 * @returns Array of usage stats, newest first
 */
export declare function getUsageHistory(userId: string, months?: number): Promise<Array<{
    recordsSynced: number;
    syncConfigsCreated: number;
    month: Date;
}>>;
/**
 * Reset monthly usage counters
 *
 * This should be called automatically on the 1st of each month via a cron job.
 * Creates a new usage record for the new month.
 *
 * Note: We don't delete old records - they're kept for historical reporting.
 *
 * @param userId - User ID (optional - if not provided, creates records for all active users)
 */
export declare function resetMonthlyUsage(userId?: string): Promise<void>;
/**
 * Get total records synced across all time for a user
 *
 * @param userId - User ID
 * @returns Total records synced (all time)
 */
export declare function getTotalRecordsSynced(userId: string): Promise<number>;
/**
 * Get total sync configurations created across all time for a user
 *
 * @param userId - User ID
 * @returns Total sync configs created (all time)
 */
export declare function getTotalSyncConfigsCreated(userId: string): Promise<number>;
/**
 * Track records synced and check for limit warnings
 *
 * This extended version also checks if the user is approaching or has reached
 * their limits and triggers appropriate email notifications.
 *
 * @param user - The user entity (with email for notifications)
 * @param count - Number of records synced
 */
export declare function trackRecordsSyncedWithNotifications(user: User, count: number): Promise<void>;
/**
 * Track sync config creation and check for limit warnings
 *
 * This extended version also checks if the user is approaching or has reached
 * their sync config limits and triggers appropriate email notifications.
 *
 * @param user - The user entity (with email for notifications)
 */
export declare function trackSyncConfigCreatedWithNotifications(user: User): Promise<void>;
//# sourceMappingURL=usageTracker.d.ts.map