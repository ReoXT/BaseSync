/**
 * Usage queries for fetching user usage statistics
 */
import { getMonthlyUsage } from '../utils/usageTracker';
import { getUserPlanLimits, getUserSubscriptionState, shouldPauseSyncs, getSyncPauseReason, TRIAL_DURATION_DAYS, } from '../middleware/usageLimits';
// ============================================================================
// Query: Get User Usage Stats
// ============================================================================
/**
 * Fetches current usage statistics and plan limits for the authenticated user
 */
export const getUserUsage = async (_args, context) => {
    if (!context.user) {
        throw new Error('User must be authenticated');
    }
    try {
        // Get plan limits
        const limits = getUserPlanLimits(context.user);
        // Get subscription state
        const subscriptionState = getUserSubscriptionState(context.user);
        // Check if syncs should be paused
        const syncsPaused = shouldPauseSyncs(context.user);
        const syncPauseReason = getSyncPauseReason(context.user);
        // Get current sync config count
        const syncConfigCount = await context.entities.SyncConfig.count({
            where: {
                userId: context.user.id,
            },
        });
        // Get monthly usage
        const monthlyUsage = await getMonthlyUsage(context.user.id);
        // Convert subscription state for frontend (serialize plan enum to string)
        let frontendState;
        switch (subscriptionState.type) {
            case 'trial_active':
                frontendState = {
                    type: 'trial_active',
                    daysRemaining: subscriptionState.daysRemaining,
                    trialEndsAt: subscriptionState.trialEndsAt,
                };
                break;
            case 'trial_expired':
                frontendState = { type: 'trial_expired' };
                break;
            case 'subscribed':
                frontendState = {
                    type: 'subscribed',
                    plan: limits.name,
                    status: subscriptionState.status,
                };
                break;
            case 'subscription_inactive':
                frontendState = {
                    type: 'subscription_inactive',
                    plan: limits.name,
                    status: subscriptionState.status,
                };
                break;
            default:
                frontendState = { type: 'trial_expired' };
        }
        return {
            syncConfigCount,
            maxSyncConfigs: limits.maxSyncConfigs,
            recordsSyncedThisMonth: monthlyUsage.recordsSynced,
            maxRecordsPerSync: limits.maxRecordsPerSync,
            syncIntervalMinutes: limits.syncIntervalMinutes,
            planName: limits.name,
            month: monthlyUsage.month,
            subscriptionState: frontendState,
            syncsPaused,
            syncPauseReason,
            trialDurationDays: TRIAL_DURATION_DAYS,
        };
    }
    catch (error) {
        console.error('Failed to fetch user usage:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch usage statistics: ${error.message}`);
        }
        throw new Error('Failed to fetch usage statistics. Please try again.');
    }
};
//# sourceMappingURL=usage.js.map