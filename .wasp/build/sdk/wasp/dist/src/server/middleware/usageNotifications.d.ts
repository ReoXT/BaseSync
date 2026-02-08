import type { User } from 'wasp/entities';
import type { UsageLimitCheckResult } from './usageLimits';
/**
 * Check limits and send appropriate email notifications.
 *
 * This combines limit checks with email sending and avoids circular
 * dependencies between usage limits and email sender modules.
 */
export declare function checkLimitsAndNotify(user: User, options?: {
    recordCount?: number;
    currentSyncCount?: number;
}): Promise<{
    recordLimitResult: UsageLimitCheckResult;
    syncLimitResult: UsageLimitCheckResult;
    emailsTriggered: boolean;
}>;
//# sourceMappingURL=usageNotifications.d.ts.map