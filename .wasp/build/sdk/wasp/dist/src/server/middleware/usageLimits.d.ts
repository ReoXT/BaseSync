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
import type { User } from 'wasp/entities';
import { PaymentPlanId } from '../../payment/plans';
/** Trial duration in days */
export declare const TRIAL_DURATION_DAYS = 14;
/** Calculate trial end date from start date */
export declare function calculateTrialEndDate(trialStartDate: Date): Date;
export interface PlanLimits {
    maxSyncConfigs: number;
    maxRecordsPerSync: number;
    syncIntervalMinutes: number;
    name: string;
}
export interface UsageLimitError {
    exceeded: true;
    limit: number;
    current: number;
    requiredPlan: PaymentPlanId;
    message: string;
}
export type UsageLimitCheckResult = {
    exceeded: false;
} | UsageLimitError;
/** Trial status for a user */
export type TrialStatus = {
    isOnTrial: true;
    daysRemaining: number;
    trialEndsAt: Date;
} | {
    isOnTrial: false;
    trialExpired: boolean;
};
/** User subscription state */
export type UserSubscriptionState = {
    type: 'trial_active';
    daysRemaining: number;
    trialEndsAt: Date;
} | {
    type: 'trial_expired';
} | {
    type: 'subscribed';
    plan: PaymentPlanId;
    status: string;
} | {
    type: 'subscription_inactive';
    plan: PaymentPlanId;
    status: string;
};
export declare const PLAN_LIMITS: Record<PaymentPlanId, PlanLimits>;
export declare const DEFAULT_LIMITS: PlanLimits;
/**
 * Get the user's trial status
 */
export declare function getTrialStatus(user: User): TrialStatus;
/**
 * Get the complete subscription state for a user
 */
export declare function getUserSubscriptionState(user: User): UserSubscriptionState;
/**
 * Check if user's trial has expired (and they don't have a subscription)
 */
export declare function isTrialExpired(user: User): boolean;
/**
 * Check if user is on active trial
 */
export declare function isOnActiveTrial(user: User): boolean;
/**
 * Get the plan limits for a user based on their subscription
 */
export declare function getUserPlanLimits(user: User): PlanLimits;
/**
 * Check if user can create another sync configuration
 *
 * @param user - The authenticated user
 * @param currentSyncCount - Current number of sync configs user has
 * @returns UsageLimitCheckResult indicating if limit is exceeded
 */
export declare function checkSyncConfigLimit(user: User, currentSyncCount: number): UsageLimitCheckResult;
/**
 * Check if a sync operation is within record limits
 *
 * @param user - The authenticated user
 * @param recordCount - Number of records being synced
 * @returns UsageLimitCheckResult indicating if limit is exceeded
 */
export declare function checkRecordLimit(user: User, recordCount: number): UsageLimitCheckResult;
/**
 * Get the sync frequency (interval in minutes) for the user's plan
 *
 * @param user - The authenticated user
 * @returns Sync interval in minutes
 */
export declare function getSyncFrequency(user: User): number;
/**
 * Check if user is approaching their sync config limit (at 80% or more)
 *
 * @param user - The authenticated user
 * @param currentSyncCount - Current number of sync configs
 * @returns true if at or above 80% of limit
 */
export declare function isApproachingSyncLimit(user: User, currentSyncCount: number): boolean;
/**
 * Check if user is approaching their record limit (at 80% or more)
 *
 * @param user - The authenticated user
 * @param recordCount - Number of records being synced
 * @returns true if at or above 80% of limit
 */
export declare function isApproachingRecordLimit(user: User, recordCount: number): boolean;
/**
 * Get a user-friendly description of their current plan and limits
 *
 * @param user - The authenticated user
 * @returns Human-readable plan summary
 */
export declare function getPlanSummary(user: User): string;
/**
 * Check if syncs should be paused for this user
 * Syncs are paused when:
 * - Trial has expired and no subscription
 * - Subscription is past_due or deleted
 *
 * @param user - The authenticated user
 * @returns true if syncs should be paused
 */
export declare function shouldPauseSyncs(user: User): boolean;
/**
 * Get the reason why syncs are paused (if they are)
 *
 * @param user - The authenticated user
 * @returns Reason string or null if syncs are not paused
 */
export declare function getSyncPauseReason(user: User): string | null;
//# sourceMappingURL=usageLimits.d.ts.map