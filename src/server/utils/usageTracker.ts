/**
 * Usage Tracking Utilities
 *
 * Tracks monthly usage metrics for billing and limit enforcement:
 * - Records synced
 * - Sync configurations created
 */

import type { User, UsageStats, SyncConfig } from 'wasp/entities';
import { prisma } from 'wasp/server';
import { checkAndSendUsageEmails } from '../emails/notificationSender';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the first day of the current month (for usage tracking consistency)
 */
function getMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Get or create usage stats record for the current month
 */
async function getOrCreateMonthlyUsage(userId: string): Promise<UsageStats> {
  const monthStart = getMonthStart();

  // Try to find existing usage record for this month
  let usage = await prisma.usageStats.findUnique({
    where: {
      userId_month: {
        userId,
        month: monthStart,
      },
    },
  });

  // Create if doesn't exist
  if (!usage) {
    usage = await prisma.usageStats.create({
      data: {
        userId,
        month: monthStart,
        recordsSynced: 0,
        syncConfigsCreated: 0,
      },
    });
  }

  return usage;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Track records synced for a user
 *
 * Increments the monthly recordsSynced counter
 *
 * @param userId - User ID
 * @param count - Number of records synced
 */
export async function trackRecordsSynced(
  userId: string,
  count: number
): Promise<void> {
  if (count <= 0) return;

  const monthStart = getMonthStart();

  await prisma.usageStats.upsert({
    where: {
      userId_month: {
        userId,
        month: monthStart,
      },
    },
    update: {
      recordsSynced: {
        increment: count,
      },
      lastUpdatedAt: new Date(),
    },
    create: {
      userId,
      month: monthStart,
      recordsSynced: count,
      syncConfigsCreated: 0,
    },
  });
}

/**
 * Track sync configuration creation
 *
 * Increments the monthly syncConfigsCreated counter
 *
 * @param userId - User ID
 */
export async function trackSyncConfigCreated(userId: string): Promise<void> {
  const monthStart = getMonthStart();

  await prisma.usageStats.upsert({
    where: {
      userId_month: {
        userId,
        month: monthStart,
      },
    },
    update: {
      syncConfigsCreated: {
        increment: 1,
      },
      lastUpdatedAt: new Date(),
    },
    create: {
      userId,
      month: monthStart,
      recordsSynced: 0,
      syncConfigsCreated: 1,
    },
  });
}

/**
 * Get current month's usage statistics for a user
 *
 * @param userId - User ID
 * @returns Current month's usage stats
 */
export async function getMonthlyUsage(userId: string): Promise<{
  recordsSynced: number;
  syncConfigsCreated: number;
  month: Date;
}> {
  const usage = await getOrCreateMonthlyUsage(userId);

  return {
    recordsSynced: usage.recordsSynced,
    syncConfigsCreated: usage.syncConfigsCreated,
    month: usage.month,
  };
}

/**
 * Get usage statistics for a specific month
 *
 * @param userId - User ID
 * @param month - Month to query (defaults to current month)
 * @returns Usage stats for the specified month, or null if doesn't exist
 */
export async function getUsageForMonth(
  userId: string,
  month: Date = new Date()
): Promise<{
  recordsSynced: number;
  syncConfigsCreated: number;
  month: Date;
} | null> {
  const monthStart = getMonthStart(month);

  const usage = await prisma.usageStats.findUnique({
    where: {
      userId_month: {
        userId,
        month: monthStart,
      },
    },
  });

  if (!usage) {
    return null;
  }

  return {
    recordsSynced: usage.recordsSynced,
    syncConfigsCreated: usage.syncConfigsCreated,
    month: usage.month,
  };
}

/**
 * Get usage history for a user (last N months)
 *
 * @param userId - User ID
 * @param months - Number of months to retrieve (default: 6)
 * @returns Array of usage stats, newest first
 */
export async function getUsageHistory(
  userId: string,
  months: number = 6
): Promise<Array<{
  recordsSynced: number;
  syncConfigsCreated: number;
  month: Date;
}>> {
  const usageRecords = await prisma.usageStats.findMany({
    where: {
      userId,
    },
    orderBy: {
      month: 'desc',
    },
    take: months,
  });

  return usageRecords.map((record) => ({
    recordsSynced: record.recordsSynced,
    syncConfigsCreated: record.syncConfigsCreated,
    month: record.month,
  }));
}

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
export async function resetMonthlyUsage(userId?: string): Promise<void> {
  // This function is primarily for documentation purposes.
  // In practice, the upsert pattern in trackRecordsSynced and trackSyncConfigCreated
  // automatically creates new monthly records when the month changes.

  // If a specific userId is provided, ensure they have a record for the current month
  if (userId) {
    await getOrCreateMonthlyUsage(userId);
  } else {
    // For all users, the next time they sync, a new monthly record will be created automatically
    // We don't need to proactively create records for all users
    console.log('Monthly usage will be tracked automatically when users perform actions');
  }
}

/**
 * Get total records synced across all time for a user
 *
 * @param userId - User ID
 * @returns Total records synced (all time)
 */
export async function getTotalRecordsSynced(userId: string): Promise<number> {
  const result = await prisma.usageStats.aggregate({
    where: {
      userId,
    },
    _sum: {
      recordsSynced: true,
    },
  });

  return result._sum.recordsSynced || 0;
}

/**
 * Get total sync configurations created across all time for a user
 *
 * @param userId - User ID
 * @returns Total sync configs created (all time)
 */
export async function getTotalSyncConfigsCreated(userId: string): Promise<number> {
  const result = await prisma.usageStats.aggregate({
    where: {
      userId,
    },
    _sum: {
      syncConfigsCreated: true,
    },
  });

  return result._sum.syncConfigsCreated || 0;
}

// ============================================================================
// Usage Tracking with Email Notifications
// ============================================================================

/**
 * Track records synced and check for limit warnings
 *
 * This extended version also checks if the user is approaching or has reached
 * their limits and triggers appropriate email notifications.
 *
 * @param user - The user entity (with email for notifications)
 * @param count - Number of records synced
 */
export async function trackRecordsSyncedWithNotifications(
  user: User,
  count: number
): Promise<void> {
  if (count <= 0) return;

  // Track the usage
  await trackRecordsSynced(user.id, count);

  // Check limits and send notifications if needed
  try {
    await checkAndSendUsageEmails(user, count);
  } catch (error) {
    console.error('Error checking usage notifications:', error);
  }
}

/**
 * Track sync config creation and check for limit warnings
 *
 * This extended version also checks if the user is approaching or has reached
 * their sync config limits and triggers appropriate email notifications.
 *
 * @param user - The user entity (with email for notifications)
 */
export async function trackSyncConfigCreatedWithNotifications(
  user: User
): Promise<void> {
  // Track the usage
  await trackSyncConfigCreated(user.id);

  // Get current sync config count
  const syncConfigCount = await prisma.syncConfig.count({
    where: { userId: user.id },
  });

  // Check limits and send notifications if needed
  try {
    await checkAndSendUsageEmails(user, undefined, syncConfigCount);
  } catch (error) {
    console.error('Error checking usage notifications:', error);
  }
}
