import "server-only";

import type { CurrentUser } from "@/lib/auth";
import type { Profile } from "@/lib/data/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "./stripe";

/** Returns the user's Stripe customer id, creating the customer on first use. */
export async function ensureStripeCustomer(
  user: CurrentUser,
  profile: Profile | null,
): Promise<string> {
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await getStripe().customers.create(
    { email: user.email ?? undefined, metadata: { user_id: user.id } },
    // A double-click within 24h returns the same customer instead of a duplicate.
    { idempotencyKey: `customer-${user.id}` },
  );

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);
  if (error) throw error;

  return customer.id;
}
