import type { StripeMode } from "./paymentProcessor";

import Stripe from "stripe";
import { stripe } from "./stripeClient";
import { assertUnreachable } from "../../shared/utils";

// WASP_WEB_CLIENT_URL will be set up by Wasp when deploying to production: https://wasp.sh/docs/deploying
const DOMAIN = process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000";

export async function fetchStripeCustomer(customerEmail: string) {
  let customer: Stripe.Customer;
  try {
    const stripeCustomers = await stripe.customers.list({
      email: customerEmail,
    });
    if (!stripeCustomers.data.length) {
      console.log("creating customer");
      customer = await stripe.customers.create({
        email: customerEmail,
      });
    } else {
      console.log("using existing customer");
      customer = stripeCustomers.data[0];
    }
    return customer;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

interface CreateStripeCheckoutSessionParams {
  priceId: string;
  customerId: string;
  mode: StripeMode;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
}

export async function createStripeCheckoutSession({
  priceId,
  customerId,
  mode,
  metadata,
  successUrl,
  cancelUrl,
  customerEmail,
}: CreateStripeCheckoutSessionParams) {
  try {
    const paymentIntentData = getPaymentIntentData({ mode, priceId, metadata, customerEmail });

    return await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: successUrl || `${DOMAIN}/checkout?success=true`,
      cancel_url: cancelUrl || `${DOMAIN}/checkout?canceled=true`,
      automatic_tax: { enabled: true },
      customer_update: {
        address: "auto",
      },
      customer: customerId,
      // Enable automatic receipt emails from Stripe
      invoice_creation:
        mode === "payment"
          ? {
              enabled: true,
              invoice_data: {
                metadata: metadata || {},
              },
            }
          : undefined,
      // Stripe only allows us to pass payment intent metadata for one-time payments, not subscriptions.
      // We do this so that we can capture priceId in the payment_intent.succeeded webhook
      // and easily confirm the user's payment based on the price id. For subscriptions, we can get the price id
      // in the customer.subscription.updated webhook via the line_items field.
      payment_intent_data: paymentIntentData,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function getPaymentIntentData({
  mode,
  priceId,
  metadata,
  customerEmail,
}: {
  mode: StripeMode;
  priceId: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
}):
  | {
      metadata: Record<string, string>;
      receipt_email?: string;
    }
  | undefined {
  switch (mode) {
    case "subscription":
      return undefined;
    case "payment":
      return {
        metadata: { priceId, ...metadata },
        // Enable automatic receipt emails for one-time payments
        receipt_email: customerEmail
      };
    default:
      assertUnreachable(mode);
  }
}
