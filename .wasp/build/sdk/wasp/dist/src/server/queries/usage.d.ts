/**
 * Usage queries for fetching user usage statistics
 */
/** Subscription/trial state for frontend display */
type SubscriptionState = {
    type: 'trial_active';
    daysRemaining: number;
    trialEndsAt: Date;
} | {
    type: 'trial_expired';
} | {
    type: 'subscribed';
    plan: string;
    status: string;
} | {
    type: 'subscription_inactive';
    plan: string;
    status: string;
};
type GetUserUsageOutput = {
    /** Current sync config count */
    syncConfigCount: number;
    /** Maximum allowed sync configs for plan */
    maxSyncConfigs: number;
    /** Records synced this month */
    recordsSyncedThisMonth: number;
    /** Maximum records per sync for plan */
    maxRecordsPerSync: number;
    /** Sync frequency in minutes for plan */
    syncIntervalMinutes: number;
    /** Current plan name */
    planName: string;
    /** Month being tracked */
    month: Date;
    /** User's subscription/trial state */
    subscriptionState: SubscriptionState;
    /** Whether syncs are paused */
    syncsPaused: boolean;
    /** Reason syncs are paused (if applicable) */
    syncPauseReason: string | null;
    /** Trial duration in days (for displaying to user) */
    trialDurationDays: number;
};
/**
 * Fetches current usage statistics and plan limits for the authenticated user
 */
export declare const getUserUsage: (_args: void, context: any) => Promise<GetUserUsageOutput>;
export {};
//# sourceMappingURL=usage.d.ts.map