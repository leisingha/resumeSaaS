import type { PaymentPlanEffect } from '../plans';
import type { CreateCheckoutSessionArgs, FetchCustomerPortalUrlArgs, PaymentProcessor } from '../paymentProcessor'
import { fetchStripeCustomer, createStripeCheckoutSession } from './checkoutUtils';
import { requireNodeEnvVar } from '../../server/utils';
import { stripeWebhook, stripeMiddlewareConfigFn } from './webhook';

export type StripeMode = 'subscription' | 'payment';

export const stripePaymentProcessor: PaymentProcessor = {
  id: 'stripe',
  createCheckoutSession: async ({ userId, userEmail, paymentPlan, prismaUserDelegate, metadata, successUrl, cancelUrl }: CreateCheckoutSessionArgs) => {
    const customer = await fetchStripeCustomer(userEmail);
    const stripeSession = await createStripeCheckoutSession({
      priceId: paymentPlan.getPaymentProcessorPlanId(),
      customerId: customer.id,
      mode: paymentPlanEffectToStripeMode(paymentPlan.effect),
      metadata,
      successUrl,
      cancelUrl,
    });
    // Only update user record if we have a real user ID (not a guest request ID)
    try {
      const user = await prismaUserDelegate.findUnique({
        where: { id: userId }
      });

      if (user) {
        // Check if this customer is already associated with another user
        const existingUserWithCustomer = await prismaUserDelegate.findUnique({
          where: { paymentProcessorUserId: customer.id }
        });

        if (!existingUserWithCustomer || existingUserWithCustomer.id === userId) {
          await prismaUserDelegate.update({
            where: {
              id: userId
            },
            data: {
              paymentProcessorUserId: customer.id
            }
          });
        }
      }
      // If user doesn't exist (guest), we skip the update
    } catch (error) {
      console.log('Skipping user update for guest/non-existent user:', userId);
    }
    if (!stripeSession.url) throw new Error('Error creating Stripe Checkout Session');
    const session = {
      url: stripeSession.url,
      id: stripeSession.id,
    };
    return { session };
  },
  fetchCustomerPortalUrl: async (_args: FetchCustomerPortalUrlArgs) =>
    requireNodeEnvVar('STRIPE_CUSTOMER_PORTAL_URL'),
  webhook: stripeWebhook,
  webhookMiddlewareConfigFn: stripeMiddlewareConfigFn,
};

function paymentPlanEffectToStripeMode(planEffect: PaymentPlanEffect): StripeMode {
  const effectToMode: Record<PaymentPlanEffect['kind'], StripeMode> = {
    subscription: 'subscription',
    credits: 'payment',
    service: 'payment',
  };
  return effectToMode[planEffect.kind];
}
