import Stripe from "stripe";
import { User } from "wasp/entities";
import { config } from "wasp/server";
import { stripeClient } from "./stripeClient";

/**
 * Returns a Stripe customer for the given User email, creating a customer if none exist.
 * Implements email uniqueness logic since Stripe doesn't enforce unique emails.
 */
export async function ensureStripeCustomer(
  userEmail: NonNullable<User["email"]>,
): Promise<Stripe.Customer> {
  const customers = await stripeClient.customers.list({
    email: userEmail,
  });

  if (customers.data.length === 0) {
    return stripeClient.customers.create({
      email: userEmail,
    });
  } else {
    return customers.data[0];
  }
}

interface CreateStripeCheckoutSessionParams {
  priceId: Stripe.Price["id"];
  customerId: Stripe.Customer["id"];
  mode: Stripe.Checkout.Session.Mode;
  returnUrl?: string;
}

export function createStripeCheckoutSession({
  priceId,
  customerId,
  mode,
  returnUrl,
}: CreateStripeCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  // Default return URL if not provided
  const baseReturnUrl = returnUrl || "/pricing";

  return stripeClient.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode,
    success_url: `${config.frontendUrl}${baseReturnUrl}${baseReturnUrl.includes("?") ? "&" : "?"}checkout=success`,
    cancel_url: `${config.frontendUrl}${baseReturnUrl}${baseReturnUrl.includes("?") ? "&" : "?"}checkout=canceled`,
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    customer_update: {
      address: "auto",
    },
    invoice_creation: getInvoiceCreationConfig(mode),
    // Add 14-day free trial for subscription mode
    ...(mode === "subscription" && {
      subscription_data: {
        trial_period_days: 14,
      },
      payment_method_collection: "always", // Require card upfront (won't be charged during trial)
    }),
  });
}

/**
 * Stripe automatically creates invoices for subscriptions.
 * For one-time payments, we must enable them manually.
 * However, enabling invoices for subscriptions will throw an error.
 */
function getInvoiceCreationConfig(
  mode: Stripe.Checkout.Session.Mode,
): Stripe.Checkout.SessionCreateParams["invoice_creation"] {
  return mode === "payment"
    ? {
        enabled: true,
      }
    : undefined;
}
