import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "./stripe";
import { customerIdOf, profileUpdateFor } from "./subscription";

/**
 * Re-fetches a subscription from Stripe and writes its current state to the
 * owner's profile. Re-fetching (instead of trusting the event payload) makes
 * webhook handling idempotent and immune to out-of-order delivery.
 */
export async function syncSubscription(subscriptionId: string, userIdHint?: string | null) {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.user_id || userIdHint || null;
  const customerId = customerIdOf(subscription);
  const admin = createAdminClient();

  const lookup = admin.from("profiles").select("id, stripe_subscription_id");
  const { data: profile, error: lookupError } = await (userId
    ? lookup.eq("id", userId)
    : lookup.eq("stripe_customer_id", customerId)
  ).maybeSingle();

  if (lookupError) throw lookupError;
  if (!profile) {
    // Not one of ours (e.g. created manually in the Stripe dashboard).
    console.warn(`No profile for subscription ${subscription.id} / customer ${customerId}`);
    return;
  }

  const update = profileUpdateFor(subscription, profile.stripe_subscription_id);
  if (!update) return;

  const { error } = await admin.from("profiles").update(update).eq("id", profile.id);
  if (error) throw error;
}
