import type { User } from 'wasp/entities';
import type { UsageLimitCheckResult } from './usageLimits';
import { checkRecordLimit, checkSyncConfigLimit } from './usageLimits';
import { checkAndSendUsageEmails } from '../emails/notificationSender';

/**
 * Check limits and send appropriate email notifications.
 *
 * This combines limit checks with email sending and avoids circular
 * dependencies between usage limits and email sender modules.
 */
export async function checkLimitsAndNotify(
  user: User,
  options: {
    recordCount?: number;
    currentSyncCount?: number;
  } = {}
): Promise<{
  recordLimitResult: UsageLimitCheckResult;
  syncLimitResult: UsageLimitCheckResult;
  emailsTriggered: boolean;
}> {
  const { recordCount, currentSyncCount } = options;

  let recordLimitResult: UsageLimitCheckResult = { exceeded: false };
  let syncLimitResult: UsageLimitCheckResult = { exceeded: false };
  let emailsTriggered = false;

  // Check record limits
  if (recordCount !== undefined) {
    recordLimitResult = checkRecordLimit(user, recordCount);
  }

  // Check sync config limits
  if (currentSyncCount !== undefined) {
    syncLimitResult = checkSyncConfigLimit(user, currentSyncCount);
  }

  // Send email notifications (non-blocking)
  try {
    await checkAndSendUsageEmails(user, recordCount, currentSyncCount);
    emailsTriggered = true;
  } catch (error) {
    console.error('Error sending usage notification emails:', error);
  }

  return {
    recordLimitResult,
    syncLimitResult,
    emailsTriggered,
  };
}
