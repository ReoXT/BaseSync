export declare enum SubscriptionStatus {
    PastDue = "past_due",
    CancelAtPeriodEnd = "cancel_at_period_end",
    Active = "active",
    Deleted = "deleted"
}
export declare enum PaymentPlanId {
    Starter = "starter",
    Pro = "pro",
    Business = "business",
    StarterAnnual = "starter-annual",
    ProAnnual = "pro-annual",
    BusinessAnnual = "business-annual"
}
export interface PaymentPlan {
    /**
     * Returns the id under which this payment plan is identified on your payment processor.
     *
     * E.g. price id on Stripe, or variant id on LemonSqueezy.
     */
    getPaymentProcessorPlanId: () => string;
    effect: PaymentPlanEffect;
}
export type PaymentPlanEffect = {
    kind: "subscription";
} | {
    kind: "credits";
    amount: number;
};
export declare const paymentPlans: {
    readonly starter: {
        readonly getPaymentProcessorPlanId: () => string;
        readonly effect: {
            readonly kind: "subscription";
        };
    };
    readonly pro: {
        readonly getPaymentProcessorPlanId: () => string;
        readonly effect: {
            readonly kind: "subscription";
        };
    };
    readonly business: {
        readonly getPaymentProcessorPlanId: () => string;
        readonly effect: {
            readonly kind: "subscription";
        };
    };
    readonly "starter-annual": {
        readonly getPaymentProcessorPlanId: () => string;
        readonly effect: {
            readonly kind: "subscription";
        };
    };
    readonly "pro-annual": {
        readonly getPaymentProcessorPlanId: () => string;
        readonly effect: {
            readonly kind: "subscription";
        };
    };
    readonly "business-annual": {
        readonly getPaymentProcessorPlanId: () => string;
        readonly effect: {
            readonly kind: "subscription";
        };
    };
};
export declare function prettyPaymentPlanName(planId: PaymentPlanId): string;
export declare function parsePaymentPlanId(planId: string): PaymentPlanId;
export declare function getSubscriptionPaymentPlanIds(): PaymentPlanId[];
/**
 * Returns Open SaaS `PaymentPlanId` for some payment provider's plan ID.
 *
 * Different payment providers track plan ID in different ways.
 * e.g. Stripe price ID, Polar product ID...
 */
export declare function getPaymentPlanIdByPaymentProcessorPlanId(paymentProcessorPlanId: string): PaymentPlanId;
//# sourceMappingURL=plans.d.ts.map