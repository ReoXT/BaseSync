import { requireNodeEnvVar } from "../server/utils";
export var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["PastDue"] = "past_due";
    SubscriptionStatus["CancelAtPeriodEnd"] = "cancel_at_period_end";
    SubscriptionStatus["Active"] = "active";
    SubscriptionStatus["Deleted"] = "deleted";
})(SubscriptionStatus || (SubscriptionStatus = {}));
export var PaymentPlanId;
(function (PaymentPlanId) {
    PaymentPlanId["Starter"] = "starter";
    PaymentPlanId["Pro"] = "pro";
    PaymentPlanId["Business"] = "business";
    PaymentPlanId["StarterAnnual"] = "starter-annual";
    PaymentPlanId["ProAnnual"] = "pro-annual";
    PaymentPlanId["BusinessAnnual"] = "business-annual";
})(PaymentPlanId || (PaymentPlanId = {}));
export const paymentPlans = {
    [PaymentPlanId.Starter]: {
        getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_STARTER_SUBSCRIPTION_PLAN_ID"),
        effect: { kind: "subscription" },
    },
    [PaymentPlanId.Pro]: {
        getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID"),
        effect: { kind: "subscription" },
    },
    [PaymentPlanId.Business]: {
        getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID"),
        effect: { kind: "subscription" },
    },
    [PaymentPlanId.StarterAnnual]: {
        getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_STARTER_ANNUAL_SUBSCRIPTION_PLAN_ID"),
        effect: { kind: "subscription" },
    },
    [PaymentPlanId.ProAnnual]: {
        getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_PRO_ANNUAL_SUBSCRIPTION_PLAN_ID"),
        effect: { kind: "subscription" },
    },
    [PaymentPlanId.BusinessAnnual]: {
        getPaymentProcessorPlanId: () => requireNodeEnvVar("PAYMENTS_BUSINESS_ANNUAL_SUBSCRIPTION_PLAN_ID"),
        effect: { kind: "subscription" },
    },
};
export function prettyPaymentPlanName(planId) {
    const planToName = {
        [PaymentPlanId.Starter]: "Starter",
        [PaymentPlanId.Pro]: "Pro",
        [PaymentPlanId.Business]: "Business",
        [PaymentPlanId.StarterAnnual]: "Starter (Annual)",
        [PaymentPlanId.ProAnnual]: "Pro (Annual)",
        [PaymentPlanId.BusinessAnnual]: "Business (Annual)",
    };
    return planToName[planId];
}
export function parsePaymentPlanId(planId) {
    if (Object.values(PaymentPlanId).includes(planId)) {
        return planId;
    }
    else {
        throw new Error(`Invalid PaymentPlanId: ${planId}`);
    }
}
export function getSubscriptionPaymentPlanIds() {
    return Object.values(PaymentPlanId).filter((planId) => paymentPlans[planId].effect.kind === "subscription");
}
/**
 * Returns Open SaaS `PaymentPlanId` for some payment provider's plan ID.
 *
 * Different payment providers track plan ID in different ways.
 * e.g. Stripe price ID, Polar product ID...
 */
export function getPaymentPlanIdByPaymentProcessorPlanId(paymentProcessorPlanId) {
    for (const [planId, plan] of Object.entries(paymentPlans)) {
        if (plan.getPaymentProcessorPlanId() === paymentProcessorPlanId) {
            return planId;
        }
    }
    throw new Error(`Unknown payment processor plan ID: ${paymentProcessorPlanId}`);
}
//# sourceMappingURL=plans.js.map