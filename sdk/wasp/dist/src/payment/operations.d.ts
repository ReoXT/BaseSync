import type { GenerateCheckoutSession, GetCustomerPortalUrl } from "wasp/server/operations";
import * as z from "zod";
import { PaymentPlanId } from "../payment/plans";
export type CheckoutSession = {
    sessionUrl: string | null;
    sessionId: string;
};
declare const generateCheckoutSessionSchema: z.ZodObject<{
    paymentPlanId: z.ZodNativeEnum<typeof PaymentPlanId>;
    returnUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    paymentPlanId: PaymentPlanId;
    returnUrl?: string | undefined;
}, {
    paymentPlanId: PaymentPlanId;
    returnUrl?: string | undefined;
}>;
type GenerateCheckoutSessionInput = z.infer<typeof generateCheckoutSessionSchema>;
export declare const generateCheckoutSession: GenerateCheckoutSession<GenerateCheckoutSessionInput, CheckoutSession>;
declare const getCustomerPortalUrlSchema: z.ZodOptional<z.ZodObject<{
    returnUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    returnUrl?: string | undefined;
}, {
    returnUrl?: string | undefined;
}>>;
type GetCustomerPortalUrlInput = z.infer<typeof getCustomerPortalUrlSchema>;
export declare const getCustomerPortalUrl: GetCustomerPortalUrl<GetCustomerPortalUrlInput, string | null>;
export {};
//# sourceMappingURL=operations.d.ts.map