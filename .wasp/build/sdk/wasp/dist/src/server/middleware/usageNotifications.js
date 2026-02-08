import { checkRecordLimit, checkSyncConfigLimit } from './usageLimits';
import { checkAndSendUsageEmails } from '../emails/notificationSender';
/**
 * Check limits and send appropriate email notifications.
 *
 * This combines limit checks with email sending and avoids circular
 * dependencies between usage limits and email sender modules.
 */
export async function checkLimitsAndNotify(user, options = {}) {
    const { recordCount, currentSyncCount } = options;
    let recordLimitResult = { exceeded: false };
    let syncLimitResult = { exceeded: false };
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
    }
    catch (error) {
        console.error('Error sending usage notification emails:', error);
    }
    return {
        recordLimitResult,
        syncLimitResult,
        emailsTriggered,
    };
}
//# sourceMappingURL=usageNotifications.js.map