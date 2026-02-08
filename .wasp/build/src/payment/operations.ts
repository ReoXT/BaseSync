import { HttpError } from "wasp/server";
import type {
  GenerateCheckoutSession,
  GetCustomerPortalUrl,
} from "wasp/server/operations";
import * as z from "zod";
import { PaymentPlanId, paymentPlans } from "../payment/plans";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import { paymentProcessor } from "./paymentProcessor";

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

const generateCheckoutSessionSchema = z.object({
  paymentPlanId: z.nativeEnum(PaymentPlanId),
  returnUrl: z.string().optional(),
});

type GenerateCheckoutSessionInput = z.infer<
  typeof generateCheckoutSessionSchema
>;

export const generateCheckoutSession: GenerateCheckoutSession<
  GenerateCheckoutSessionInput,
  CheckoutSession
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }

  const { paymentPlanId, returnUrl } = ensureArgsSchemaOrThrowHttpError(
    generateCheckoutSessionSchema,
    args,
  );
  const userId = context.user.id;
  const userEmail = context.user.email;
  if (!userEmail) {
    // If using the usernameAndPassword Auth method, switch to an Auth method that provides an email.
    throw new HttpError(403, "User needs an email to make a payment.");
  }

  const paymentPlan = paymentPlans[paymentPlanId];
  const { session } = await paymentProcessor.createCheckoutSession({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate: context.entities.User,
    returnUrl,
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
};

const getCustomerPortalUrlSchema = z.object({
  returnUrl: z.string().optional(),
}).optional();

type GetCustomerPortalUrlInput = z.infer<typeof getCustomerPortalUrlSchema>;

export const getCustomerPortalUrl: GetCustomerPortalUrl<
  GetCustomerPortalUrlInput,
  string | null
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }

  const validatedArgs = args ? ensureArgsSchemaOrThrowHttpError(
    getCustomerPortalUrlSchema,
    args,
  ) : undefined;

  return paymentProcessor.fetchCustomerPortalUrl({
    userId: context.user.id,
    prismaUserDelegate: context.entities.User,
    returnUrl: validatedArgs?.returnUrl,
  });
};
