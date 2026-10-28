"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { ensureStripeCustomer } from "@/lib/billing/customer";
import { getStripe } from "@/lib/billing/stripe";
import { getProfile } from "@/lib/data/profile";
import { siteUrl, stripeProPriceId } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type BillingActionState = { error?: string };

export async function startCheckout(): Promise<BillingActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);

  if (profile?.plan === "pro") redirect("/billing");

  let checkoutUrl: string | null;
  try {
    const customerId = await ensureStripeCustomer(user, profile);
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: stripeProPriceId(), quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${siteUrl()}/billing?checkout=success`,
      cancel_url: `${siteUrl()}/billing?checkout=canceled`,
    });
    checkoutUrl = session.url;
  } catch (error) {
    console.error("Failed to start Stripe checkout", error);
    checkoutUrl = null;
  }

  if (!checkoutUrl) {
    return { error: "We couldn't open checkout. Please try again in a moment." };
  }
  redirect(checkoutUrl);
}

export async function openBillingPortal(): Promise<BillingActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);

  if (!profile?.stripe_customer_id) {
    return { error: "No billing account found yet. Upgrade to Pro first." };
  }

  let portalUrl: string | null;
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl()}/billing`,
    });
    portalUrl = session.url;
  } catch (error) {
    console.error("Failed to open Stripe billing portal", error);
    portalUrl = null;
  }

  if (!portalUrl) {
    return { error: "We couldn't open the billing portal. Please try again in a moment." };
  }
  redirect(portalUrl);
}
