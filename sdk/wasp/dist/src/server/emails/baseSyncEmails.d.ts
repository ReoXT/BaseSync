/**
 * BaseSync Notification Email Templates
 *
 * Email templates for usage limits, trial expiration, and other notifications.
 * These templates are used with the Wasp emailSender to notify users.
 */
export interface EmailContent {
    subject: string;
    text: string;
    html: string;
}
/**
 * Email sent when user reaches 80% of their usage limit
 */
export declare function getApproachingLimitEmailContent({ userName, limitType, currentUsage, limit, planName, upgradePlanName, upgradeUrl, }: {
    userName: string;
    limitType: 'records' | 'syncs';
    currentUsage: number;
    limit: number;
    planName: string;
    upgradePlanName: string;
    upgradeUrl: string;
}): EmailContent;
/**
 * Email sent when user reaches 100% of their usage limit
 */
export declare function getLimitReachedEmailContent({ userName, limitType, currentUsage, limit, planName, upgradePlanName, upgradeUrl, }: {
    userName: string;
    limitType: 'records' | 'syncs';
    currentUsage: number;
    limit: number;
    planName: string;
    upgradePlanName: string;
    upgradeUrl: string;
}): EmailContent;
/**
 * Email sent 3 days before trial expires
 */
export declare function getTrialEndingSoonEmailContent({ userName, daysRemaining, recordsSynced, syncConfigsCount, pricingUrl, }: {
    userName: string;
    daysRemaining: number;
    recordsSynced: number;
    syncConfigsCount: number;
    pricingUrl: string;
}): EmailContent;
/**
 * Email sent when a sync fails
 */
export declare function getSyncFailedEmailContent({ userName, syncName, errorMessage, dashboardUrl, }: {
    userName: string;
    syncName: string;
    errorMessage: string;
    dashboardUrl: string;
}): EmailContent;
//# sourceMappingURL=baseSyncEmails.d.ts.map