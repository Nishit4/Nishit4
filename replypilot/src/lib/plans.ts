// Single source of truth for plan limits and the prices shown in the UI.
// The amount actually charged comes from the Stripe price STRIPE_PRO_PRICE_ID,
// so keep that price at $39/month to match.

export type PlanId = "free" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  /** Generations per calendar month; null means unlimited. */
  monthlyReplyLimit: number | null;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    monthlyReplyLimit: 5,
    features: [
      "5 reviews answered per month",
      "3 reply styles for every review",
      "Your tone of voice and rules",
      "Reply history",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 39,
    monthlyReplyLimit: null,
    features: [
      "Unlimited reviews answered",
      "3 reply styles for every review",
      "Your tone of voice and rules",
      "Full reply history",
      "Priority support",
    ],
  },
};

/** Subscription statuses that grant Pro access. */
export function isProStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export function planFor(profile: { plan: string } | null | undefined): Plan {
  return profile?.plan === "pro" ? PLANS.pro : PLANS.free;
}
