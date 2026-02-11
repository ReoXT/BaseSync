import { HttpError } from "wasp/server";
import { emailSender } from "wasp/server/email";
import { getApproachingLimitEmailContent, getLimitReachedEmailContent, getTrialEndingSoonEmailContent, getSyncFailedEmailContent, } from "./baseSyncEmails";
import { getPasswordResetEmailContent, getVerificationEmailContent, } from "../../auth/email-and-pass/emails";
export const sendTestEmails = async (args, context) => {
    if (!context.user) {
        throw new HttpError(401, "User must be authenticated");
    }
    if (!context.user.isAdmin) {
        throw new HttpError(403, "Admin access required");
    }
    if (!args?.to) {
        throw new HttpError(400, "Missing destination email");
    }
    const appUrl = process.env.WASP_WEB_CLIENT_URL || "https://basesync.app";
    const emails = [
        getVerificationEmailContent({
            verificationLink: `${appUrl}/email-verification?token=test-token`,
        }),
        getPasswordResetEmailContent({
            passwordResetLink: `${appUrl}/password-reset?token=test-token`,
        }),
        getApproachingLimitEmailContent({
            userName: "Test User",
            limitType: "records",
            currentUsage: 800,
            limit: 1000,
            planName: "Starter",
            upgradePlanName: "Pro",
            upgradeUrl: `${appUrl}/pricing`,
        }),
        getLimitReachedEmailContent({
            userName: "Test User",
            limitType: "syncs",
            currentUsage: 3,
            limit: 3,
            planName: "Pro",
            upgradePlanName: "Business",
            upgradeUrl: `${appUrl}/pricing`,
        }),
        getTrialEndingSoonEmailContent({
            userName: "Test User",
            daysRemaining: 3,
            recordsSynced: 12450,
            syncConfigsCount: 2,
            pricingUrl: `${appUrl}/pricing`,
        }),
        getSyncFailedEmailContent({
            userName: "Test User",
            syncName: "Customer Sync",
            errorMessage: "Airtable token expired (simulated)",
            dashboardUrl: `${appUrl}/dashboard`,
        }),
    ];
    for (const content of emails) {
        await emailSender.send({
            to: args.to,
            ...content,
        });
    }
    return { sent: emails.length };
};
//# sourceMappingURL=testSender.js.map