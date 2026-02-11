/**
 * Usage Limits Enforcement Middleware
 *
 * Enforces subscription-based limits for BaseSync features:
 * - Starter: 1 sync, 1,000 records, 15-min interval
 * - Pro: 3 syncs, 5,000 records, 5-min interval
 * - Business: 10 syncs, unlimited records, 5-min interval
 *
 * Trial Period:
 * - 14-day free trial on signup (no credit card required)
 * - Trial users get full Pro tier features
 * - After trial expires, syncs pause but data remains
 */
import { PaymentPlanId } from '../../payment/plans';
// ============================================================================
// Trial Configuration
// ============================================================================
/** Trial duration in days */
export const TRIAL_DURATION_DAYS = 14;
/** Calculate trial end date from start date */
export function calculateTrialEndDate(trialStartDate) {
    const endDate = new Date(trialStartDate);
    endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
    return endDate;
}
// ============================================================================
// Plan Limits Configuration
// ============================================================================
export const PLAN_LIMITS = {
    [PaymentPlanId.Starter]: {
        maxSyncConfigs: 1,
        maxRecordsPerSync: 1000,
        syncIntervalMinutes: 15,
        name: 'Starter',
    },
    [PaymentPlanId.Pro]: {
        maxSyncConfigs: 3,
        maxRecordsPerSync: 5000,
        syncIntervalMinutes: 5,
        name: 'Pro',
    },
    [PaymentPlanId.Business]: {
        maxSyncConfigs: 10,
        maxRecordsPerSync: Number.MAX_SAFE_INTEGER, // Unlimited
        syncIntervalMinutes: 5,
        name: 'Business',
    },
    // Annual plans have the same limits as monthly plans
    [PaymentPlanId.StarterAnnual]: {
        maxSyncConfigs: 1,
        maxRecordsPerSync: 1000,
        syncIntervalMinutes: 15,
        name: 'Starter',
    },
    [PaymentPlanId.ProAnnual]: {
        maxSyncConfigs: 3,
        maxRecordsPerSync: 5000,
        syncIntervalMinutes: 5,
        name: 'Pro',
    },
    [PaymentPlanId.BusinessAnnual]: {
        maxSyncConfigs: 10,
        maxRecordsPerSync: Number.MAX_SAFE_INTEGER, // Unlimited
        syncIntervalMinutes: 5,
        name: 'Business',
    },
};
// Default limits for users without a subscription (trial or free tier)
export const DEFAULT_LIMITS = PLAN_LIMITS[PaymentPlanId.Pro]; // Trial gets Pro features
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Get the user's trial status
 */
export function getTrialStatus(user) {
    // If user has a subscription, they're not on trial
    if (user.subscriptionPlan && user.subscriptionStatus) {
        return { isOnTrial: false, trialExpired: false };
    }
    // Calculate trial end date
    const trialStartDate = user.trialStartedAt || user.createdAt;
    const trialEndsAt = user.trialEndsAt || calculateTrialEndDate(trialStartDate);
    const now = new Date();
    if (now < trialEndsAt) {
        const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { isOnTrial: true, daysRemaining, trialEndsAt };
    }
    // Trial has expired
    return { isOnTrial: false, trialExpired: true };
}
/**
 * Get the complete subscription state for a user
 */
export function getUserSubscriptionState(user) {
    // Check if user has an active subscription
    if (user.subscriptionPlan && user.subscriptionStatus) {
        const plan = getUserPlan(user);
        const isActive = user.subscriptionStatus === 'active' ||
            user.subscriptionStatus === 'cancel_at_period_end';
        if (isActive) {
            return { type: 'subscribed', plan, status: user.subscriptionStatus };
        }
        else {
            return { type: 'subscription_inactive', plan, status: user.subscriptionStatus };
        }
    }
    // No subscription - check trial status
    const trialStatus = getTrialStatus(user);
    if (trialStatus.isOnTrial) {
        return {
            type: 'trial_active',
            daysRemaining: trialStatus.daysRemaining,
            trialEndsAt: trialStatus.trialEndsAt,
        };
    }
    return { type: 'trial_expired' };
}
/**
 * Check if user's trial has expired (and they don't have a subscription)
 */
export function isTrialExpired(user) {
    const state = getUserSubscriptionState(user);
    return state.type === 'trial_expired';
}
/**
 * Check if user is on active trial
 */
export function isOnActiveTrial(user) {
    const state = getUserSubscriptionState(user);
    return state.type === 'trial_active';
}
/**
 * Get the user's current subscription plan
 */
function getUserPlan(user) {
    // If user has no subscription plan, they're on trial (gets Pro features)
    if (!user.subscriptionPlan) {
        return PaymentPlanId.Pro; // Trial users get Pro tier
    }
    // Map the subscription plan string to PaymentPlanId
    const planMap = {
        'starter': PaymentPlanId.Starter,
        'pro': PaymentPlanId.Pro,
        'business': PaymentPlanId.Business,
        'starter-annual': PaymentPlanId.StarterAnnual,
        'pro-annual': PaymentPlanId.ProAnnual,
        'business-annual': PaymentPlanId.BusinessAnnual,
    };
    return planMap[user.subscriptionPlan.toLowerCase()] || PaymentPlanId.Starter;
}
/**
 * Check if user's subscription is active (includes active trial)
 */
function isSubscriptionActive(user) {
    const state = getUserSubscriptionState(user);
    switch (state.type) {
        case 'trial_active':
            return true;
        case 'subscribed':
            return true;
        case 'trial_expired':
            return false; // Trial expired, syncs should pause
        case 'subscription_inactive':
            return false;
        default:
            return false;
    }
}
/**
 * Get the next higher plan that would allow the operation
 */
function getRequiredPlan(requiredLimit, limitType) {
    if (limitType === 'syncs') {
        if (requiredLimit <= PLAN_LIMITS[PaymentPlanId.Starter].maxSyncConfigs) {
            return PaymentPlanId.Starter;
        }
        else if (requiredLimit <= PLAN_LIMITS[PaymentPlanId.Pro].maxSyncConfigs) {
            return PaymentPlanId.Pro;
        }
        else {
            return PaymentPlanId.Business;
        }
    }
    else {
        // records
        if (requiredLimit <= PLAN_LIMITS[PaymentPlanId.Starter].maxRecordsPerSync) {
            return PaymentPlanId.Starter;
        }
        else if (requiredLimit <= PLAN_LIMITS[PaymentPlanId.Pro].maxRecordsPerSync) {
            return PaymentPlanId.Pro;
        }
        else {
            return PaymentPlanId.Business;
        }
    }
}
// ============================================================================
// Public API
// ============================================================================
/**
 * Get the plan limits for a user based on their subscription
 */
export function getUserPlanLimits(user) {
    if (!isSubscriptionActive(user)) {
        // Inactive subscription - return most restrictive limits
        return PLAN_LIMITS[PaymentPlanId.Starter];
    }
    const plan = getUserPlan(user);
    return PLAN_LIMITS[plan];
}
/**
 * Check if user can create another sync configuration
 *
 * @param user - The authenticated user
 * @param currentSyncCount - Current number of sync configs user has
 * @returns UsageLimitCheckResult indicating if limit is exceeded
 */
export function checkSyncConfigLimit(user, currentSyncCount) {
    const limits = getUserPlanLimits(user);
    if (currentSyncCount >= limits.maxSyncConfigs) {
        const plan = getUserPlan(user);
        const requiredPlan = getRequiredPlan(currentSyncCount + 1, 'syncs');
        return {
            exceeded: true,
            limit: limits.maxSyncConfigs,
            current: currentSyncCount,
            requiredPlan,
            message: `You've reached your limit of ${limits.maxSyncConfigs} sync configuration${limits.maxSyncConfigs === 1 ? '' : 's'} on the ${limits.name} plan. Upgrade to ${PLAN_LIMITS[requiredPlan].name} to create more syncs.`,
        };
    }
    return { exceeded: false };
}
/**
 * Check if a sync operation is within record limits
 *
 * @param user - The authenticated user
 * @param recordCount - Number of records being synced
 * @returns UsageLimitCheckResult indicating if limit is exceeded
 */
export function checkRecordLimit(user, recordCount) {
    const limits = getUserPlanLimits(user);
    if (recordCount > limits.maxRecordsPerSync) {
        const plan = getUserPlan(user);
        const requiredPlan = getRequiredPlan(recordCount, 'records');
        return {
            exceeded: true,
            limit: limits.maxRecordsPerSync,
            current: recordCount,
            requiredPlan,
            message: `This sync contains ${recordCount.toLocaleString()} records, which exceeds your ${limits.name} plan limit of ${limits.maxRecordsPerSync.toLocaleString()} records. Upgrade to ${PLAN_LIMITS[requiredPlan].name} to sync more records.`,
        };
    }
    return { exceeded: false };
}
/**
 * Get the sync frequency (interval in minutes) for the user's plan
 *
 * @param user - The authenticated user
 * @returns Sync interval in minutes
 */
export function getSyncFrequency(user) {
    const limits = getUserPlanLimits(user);
    return limits.syncIntervalMinutes;
}
/**
 * Check if user is approaching their sync config limit (at 80% or more)
 *
 * @param user - The authenticated user
 * @param currentSyncCount - Current number of sync configs
 * @returns true if at or above 80% of limit
 */
export function isApproachingSyncLimit(user, currentSyncCount) {
    const limits = getUserPlanLimits(user);
    return currentSyncCount >= (limits.maxSyncConfigs * 0.8);
}
/**
 * Check if user is approaching their record limit (at 80% or more)
 *
 * @param user - The authenticated user
 * @param recordCount - Number of records being synced
 * @returns true if at or above 80% of limit
 */
export function isApproachingRecordLimit(user, recordCount) {
    const limits = getUserPlanLimits(user);
    // Business plan has unlimited records
    if (limits.maxRecordsPerSync === Number.MAX_SAFE_INTEGER) {
        return false;
    }
    return recordCount >= (limits.maxRecordsPerSync * 0.8);
}
/**
 * Get a user-friendly description of their current plan and limits
 *
 * @param user - The authenticated user
 * @returns Human-readable plan summary
 */
export function getPlanSummary(user) {
    const state = getUserSubscriptionState(user);
    const limits = getUserPlanLimits(user);
    const recordLimit = limits.maxRecordsPerSync === Number.MAX_SAFE_INTEGER
        ? 'Unlimited'
        : limits.maxRecordsPerSync.toLocaleString();
    const baseInfo = `${limits.maxSyncConfigs} sync${limits.maxSyncConfigs === 1 ? '' : 's'}, ${recordLimit} records per sync, ${limits.syncIntervalMinutes}-minute sync interval`;
    switch (state.type) {
        case 'trial_active':
            return `Free Trial (${state.daysRemaining} days left): ${baseInfo}`;
        case 'trial_expired':
            return `Trial Expired - Syncs Paused. Upgrade to continue syncing.`;
        case 'subscribed':
            return `${limits.name} Plan: ${baseInfo}`;
        case 'subscription_inactive':
            return `${limits.name} Plan (Inactive): ${baseInfo}`;
        default:
            return `${limits.name} Plan: ${baseInfo}`;
    }
}
/**
 * Check if syncs should be paused for this user
 * Syncs are paused when:
 * - Trial has expired and no subscription
 * - Subscription is past_due or deleted
 *
 * @param user - The authenticated user
 * @returns true if syncs should be paused
 */
export function shouldPauseSyncs(user) {
    const state = getUserSubscriptionState(user);
    return state.type === 'trial_expired' || state.type === 'subscription_inactive';
}
/**
 * Get the reason why syncs are paused (if they are)
 *
 * @param user - The authenticated user
 * @returns Reason string or null if syncs are not paused
 */
export function getSyncPauseReason(user) {
    const state = getUserSubscriptionState(user);
    switch (state.type) {
        case 'trial_expired':
            return 'Your 14-day free trial has ended. Upgrade to a paid plan to resume syncing.';
        case 'subscription_inactive':
            if (state.status === 'past_due') {
                return 'Your subscription payment is past due. Please update your payment method to resume syncing.';
            }
            return 'Your subscription has been cancelled. Resubscribe to resume syncing.';
        default:
            return null;
    }
}
//# sourceMappingURL=usageLimits.js.map