/**
 * Notification Email Sender
 *
 * Utility functions to send BaseSync notification emails.
 * Uses Wasp's emailSender for delivery and integrates with usage tracking.
 */
// Using Resend HTTP API instead of Wasp's SMTP emailSender (Railway blocks SMTP)
import { resendEmailSender as emailSender } from '../email/resendEmailSender';
import { prisma } from 'wasp/server';
import { getApproachingLimitEmailContent, getLimitReachedEmailContent, getTrialEndingSoonEmailContent, getSyncFailedEmailContent, } from './baseSyncEmails';
import { getUserPlanLimits, getTrialStatus } from '../middleware/usageLimits';
import { getTotalRecordsSynced } from '../utils/usageTracker';
import { PaymentPlanId } from '../../payment/plans';
// ============================================================================
// Configuration
// ============================================================================
const APP_URL = process.env.WASP_WEB_CLIENT_URL || 'https://basesync.app';
const PRICING_URL = `${APP_URL}/pricing`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;
// Email tracking to prevent duplicate sends within a time window
const EMAIL_COOLDOWN_HOURS = 24;
// In-memory cache for email tracking (in production, consider using database)
const emailTrackingCache = new Map();
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Generate a cache key for email tracking
 */
function getEmailTrackingKey(userId, emailType) {
    return `${userId}:${emailType}`;
}
/**
 * Check if an email was recently sent to avoid duplicates
 */
function wasEmailRecentlySent(userId, emailType) {
    const key = getEmailTrackingKey(userId, emailType);
    const record = emailTrackingCache.get(key);
    if (!record) {
        return false;
    }
    const hoursSinceSent = (Date.now() - record.sentAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceSent < EMAIL_COOLDOWN_HOURS;
}
/**
 * Mark an email as sent for tracking
 */
function markEmailSent(userId, emailType) {
    const key = getEmailTrackingKey(userId, emailType);
    emailTrackingCache.set(key, {
        userId,
        emailType,
        sentAt: new Date(),
    });
}
/**
 * Get user's display name (falls back to email)
 */
function getUserName(user) {
    // OpenSaaS User model may have different name fields
    // Adjust based on your actual User model
    return user.name || user.username || user.email?.split('@')[0] || 'there';
}
/**
 * Get the upgrade plan based on current plan
 */
function getUpgradePlan(currentPlan) {
    switch (currentPlan) {
        case PaymentPlanId.Starter:
            return { id: PaymentPlanId.Pro, name: 'Pro' };
        case PaymentPlanId.Pro:
            return { id: PaymentPlanId.Business, name: 'Business' };
        case PaymentPlanId.Business:
            return { id: PaymentPlanId.Business, name: 'Business' }; // Already highest
        default:
            return { id: PaymentPlanId.Pro, name: 'Pro' };
    }
}
/**
 * Get user's current plan ID
 */
function getUserPlanId(user) {
    if (!user.subscriptionPlan) {
        return PaymentPlanId.Pro; // Trial users get Pro tier
    }
    const planMap = {
        starter: PaymentPlanId.Starter,
        pro: PaymentPlanId.Pro,
        business: PaymentPlanId.Business,
    };
    return planMap[user.subscriptionPlan.toLowerCase()] || PaymentPlanId.Starter;
}
// ============================================================================
// Public API - Email Sending Functions
// ============================================================================
/**
 * Send "approaching limit" email when user hits 80% of their limit
 *
 * @param user - The user to notify
 * @param limitType - Type of limit being approached ('records' or 'syncs')
 * @param currentUsage - Current usage amount
 */
export async function sendApproachingLimitEmail(user, limitType, currentUsage) {
    const emailType = `approaching_${limitType}_limit`;
    // Check if we recently sent this email
    if (wasEmailRecentlySent(user.id, emailType)) {
        console.log(`Skipping ${emailType} email for user ${user.id} - recently sent`);
        return;
    }
    if (!user.email) {
        console.log(`Cannot send email to user ${user.id} - no email address`);
        return;
    }
    const planId = getUserPlanId(user);
    const limits = getUserPlanLimits(user);
    const upgradePlan = getUpgradePlan(planId);
    const limit = limitType === 'records' ? limits.maxRecordsPerSync : limits.maxSyncConfigs;
    const emailContent = getApproachingLimitEmailContent({
        userName: getUserName(user),
        limitType,
        currentUsage,
        limit,
        planName: limits.name,
        upgradePlanName: upgradePlan.name,
        upgradeUrl: PRICING_URL,
    });
    try {
        await emailSender.send({
            to: user.email,
            ...emailContent,
        });
        markEmailSent(user.id, emailType);
        console.log(`Sent approaching limit email to user ${user.id} for ${limitType}`);
    }
    catch (error) {
        console.error(`Failed to send approaching limit email to user ${user.id}:`, error);
    }
}
/**
 * Send "limit reached" email when user hits 100% of their limit
 *
 * @param user - The user to notify
 * @param limitType - Type of limit reached ('records' or 'syncs')
 * @param currentUsage - Current usage amount
 */
export async function sendLimitReachedEmail(user, limitType, currentUsage) {
    const emailType = `reached_${limitType}_limit`;
    // Check if we recently sent this email
    if (wasEmailRecentlySent(user.id, emailType)) {
        console.log(`Skipping ${emailType} email for user ${user.id} - recently sent`);
        return;
    }
    if (!user.email) {
        console.log(`Cannot send email to user ${user.id} - no email address`);
        return;
    }
    const planId = getUserPlanId(user);
    const limits = getUserPlanLimits(user);
    const upgradePlan = getUpgradePlan(planId);
    const limit = limitType === 'records' ? limits.maxRecordsPerSync : limits.maxSyncConfigs;
    const emailContent = getLimitReachedEmailContent({
        userName: getUserName(user),
        limitType,
        currentUsage,
        limit,
        planName: limits.name,
        upgradePlanName: upgradePlan.name,
        upgradeUrl: PRICING_URL,
    });
    try {
        await emailSender.send({
            to: user.email,
            ...emailContent,
        });
        markEmailSent(user.id, emailType);
        console.log(`Sent limit reached email to user ${user.id} for ${limitType}`);
    }
    catch (error) {
        console.error(`Failed to send limit reached email to user ${user.id}:`, error);
    }
}
/**
 * Send "trial ending soon" email (typically sent 3 days before expiry)
 *
 * @param user - The user to notify
 */
export async function sendTrialEndingSoonEmail(user) {
    const emailType = 'trial_ending_soon';
    // Check if we recently sent this email
    if (wasEmailRecentlySent(user.id, emailType)) {
        console.log(`Skipping ${emailType} email for user ${user.id} - recently sent`);
        return;
    }
    if (!user.email) {
        console.log(`Cannot send email to user ${user.id} - no email address`);
        return;
    }
    const trialStatus = getTrialStatus(user);
    if (!trialStatus.isOnTrial) {
        console.log(`User ${user.id} is not on trial, skipping email`);
        return;
    }
    // Get usage stats for the email
    const recordsSynced = await getTotalRecordsSynced(user.id);
    const syncConfigsCount = await prisma.syncConfig.count({
        where: { userId: user.id },
    });
    const emailContent = getTrialEndingSoonEmailContent({
        userName: getUserName(user),
        daysRemaining: trialStatus.daysRemaining,
        recordsSynced,
        syncConfigsCount,
        pricingUrl: PRICING_URL,
    });
    try {
        await emailSender.send({
            to: user.email,
            ...emailContent,
        });
        markEmailSent(user.id, emailType);
        console.log(`Sent trial ending soon email to user ${user.id} (${trialStatus.daysRemaining} days left)`);
    }
    catch (error) {
        console.error(`Failed to send trial ending soon email to user ${user.id}:`, error);
    }
}
/**
 * Send "sync failed" email notification
 *
 * @param user - The user to notify
 * @param syncName - Name of the sync that failed
 * @param errorMessage - Error message describing the failure
 */
export async function sendSyncFailedEmail(user, syncName, errorMessage) {
    const emailType = `sync_failed_${syncName}`;
    // Check if we recently sent this email for this specific sync
    if (wasEmailRecentlySent(user.id, emailType)) {
        console.log(`Skipping ${emailType} email for user ${user.id} - recently sent`);
        return;
    }
    if (!user.email) {
        console.log(`Cannot send email to user ${user.id} - no email address`);
        return;
    }
    const emailContent = getSyncFailedEmailContent({
        userName: getUserName(user),
        syncName,
        errorMessage,
        dashboardUrl: DASHBOARD_URL,
    });
    try {
        await emailSender.send({
            to: user.email,
            ...emailContent,
        });
        markEmailSent(user.id, emailType);
        console.log(`Sent sync failed email to user ${user.id} for sync "${syncName}"`);
    }
    catch (error) {
        console.error(`Failed to send sync failed email to user ${user.id}:`, error);
    }
}
// ============================================================================
// Batch/Scheduled Email Functions
// ============================================================================
/**
 * Check all trial users and send "trial ending soon" emails
 * This should be called daily via a background job
 */
export async function checkAndSendTrialExpiringEmails() {
    console.log('Checking for trial users needing expiration emails...');
    // Find users who are on trial and haven't subscribed
    const users = await prisma.user.findMany({
        where: {
            subscriptionPlan: null,
            subscriptionStatus: null,
        },
    });
    let emailsSent = 0;
    for (const user of users) {
        const trialStatus = getTrialStatus(user);
        // Send email if trial ends in 3 days or less
        if (trialStatus.isOnTrial && trialStatus.daysRemaining <= 3) {
            await sendTrialEndingSoonEmail(user);
            emailsSent++;
        }
    }
    console.log(`Sent ${emailsSent} trial expiring emails`);
}
/**
 * Check a specific user's usage and send limit emails if needed
 * Called during sync operations
 *
 * @param user - User to check
 * @param recordCount - Number of records being synced
 * @param currentSyncCount - Current number of sync configs
 */
export async function checkAndSendUsageEmails(user, recordCount, currentSyncCount) {
    const limits = getUserPlanLimits(user);
    // Check record limits
    if (recordCount !== undefined && limits.maxRecordsPerSync !== Number.MAX_SAFE_INTEGER) {
        const recordPercentage = (recordCount / limits.maxRecordsPerSync) * 100;
        if (recordPercentage >= 100) {
            await sendLimitReachedEmail(user, 'records', recordCount);
        }
        else if (recordPercentage >= 80) {
            await sendApproachingLimitEmail(user, 'records', recordCount);
        }
    }
    // Check sync config limits
    if (currentSyncCount !== undefined) {
        const syncPercentage = (currentSyncCount / limits.maxSyncConfigs) * 100;
        if (syncPercentage >= 100) {
            await sendLimitReachedEmail(user, 'syncs', currentSyncCount);
        }
        else if (syncPercentage >= 80) {
            await sendApproachingLimitEmail(user, 'syncs', currentSyncCount);
        }
    }
}
//# sourceMappingURL=notificationSender.js.map