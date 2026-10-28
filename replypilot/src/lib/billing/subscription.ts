import type Stripe from "stripe";

import { isProStatus } from "@/lib/plans";

export type ProfileBillingUpdate = {
  plan: "free" | "pro";
  stripe_customer_id: string;
  stripe_subscription_id: string;
  subscription_status: Stripe.Subscription.Status;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export function customerIdOf(subscription: Stripe.Subscription): string {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

/**
 * Decides how a Stripe subscription maps onto the user's profile. Returns null
 * when the event is about an older subscription that has since been replaced,
 * so a late "canceled" event can't downgrade a user who re-subscribed.
 */
export function profileUpdateFor(
  subscription: Stripe.Subscription,
  currentSubscriptionId: string | null,
): ProfileBillingUpdate | null {
  const grantsPro = isProStatus(subscription.status);

  if (!grantsPro && currentSubscriptionId && currentSubscriptionId !== subscription.id) {
    return null;
  }

  // Since API version 2025-03-31 the billing period lives on subscription items.
  const periodEnd = subscription.items.data[0]?.current_period_end;

  return {
    plan: grantsPro ? "pro" : "free",
    stripe_customer_id: customerIdOf(subscription),
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
  };
}
