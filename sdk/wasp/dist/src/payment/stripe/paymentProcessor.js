import { config } from "wasp/server";
import { assertUnreachable } from "../../shared/utils";
import { fetchUserPaymentProcessorUserId, updateUserPaymentProcessorUserId, } from "../user";
import { createStripeCheckoutSession, ensureStripeCustomer, } from "./checkoutUtils";
import { stripeClient } from "./stripeClient";
import { stripeMiddlewareConfigFn, stripeWebhook } from "./webhook";
export const stripePaymentProcessor = {
    id: "stripe",
    createCheckoutSession: async ({ userId, userEmail, paymentPlan, prismaUserDelegate, returnUrl, }) => {
        const customer = await ensureStripeCustomer(userEmail);
        await updateUserPaymentProcessorUserId({ userId, paymentProcessorUserId: customer.id }, prismaUserDelegate);
        const checkoutSession = await createStripeCheckoutSession({
            customerId: customer.id,
            priceId: paymentPlan.getPaymentProcessorPlanId(),
            mode: paymentPlanEffectToStripeCheckoutSessionMode(paymentPlan.effect),
            returnUrl,
        });
        if (!checkoutSession.url) {
            throw new Error("Stripe checkout session URL is missing. Checkout session might not be active.");
        }
        return {
            session: {
                url: checkoutSession.url,
                id: checkoutSession.id,
            },
        };
    },
    fetchCustomerPortalUrl: async ({ prismaUserDelegate, userId, returnUrl, }) => {
        const paymentProcessorUserId = await fetchUserPaymentProcessorUserId(userId, prismaUserDelegate);
        if (!paymentProcessorUserId) {
            return null;
        }
        // Default to pricing page if no return URL provided
        const baseReturnUrl = returnUrl || "/pricing";
        const billingPortalSession = await stripeClient.billingPortal.sessions.create({
            customer: paymentProcessorUserId,
            return_url: `${config.frontendUrl}${baseReturnUrl}`,
        });
        return billingPortalSession.url;
    },
    webhook: stripeWebhook,
    webhookMiddlewareConfigFn: stripeMiddlewareConfigFn,
};
function paymentPlanEffectToStripeCheckoutSessionMode({ kind, }) {
    switch (kind) {
        case "subscription":
            return "subscription";
        case "credits":
            return "payment";
        default:
            assertUnreachable(kind);
    }
}
//# sourceMappingURL=paymentProcessor.js.map