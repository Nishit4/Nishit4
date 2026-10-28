import type Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { isProStatus } from "@/lib/plans";
import { profileUpdateFor } from "./subscription";

function subscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_new",
    customer: "cus_123",
    status: "active",
    cancel_at_period_end: false,
    metadata: {},
    items: { data: [{ current_period_end: 1_800_000_000 }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("isProStatus", () => {
  it("grants Pro for active, trialing and past_due", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      expect(isProStatus(status)).toBe(true);
    }
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", null]) {
      expect(isProStatus(status)).toBe(false);
    }
  });
});

describe("profileUpdateFor", () => {
  it("maps an active subscription to the Pro plan", () => {
    expect(profileUpdateFor(subscription(), null)).toEqual({
      plan: "pro",
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_new",
      subscription_status: "active",
      current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      cancel_at_period_end: false,
    });
  });

  it("downgrades when the current subscription is canceled", () => {
    const update = profileUpdateFor(subscription({ status: "canceled" }), "sub_new");
    expect(update?.plan).toBe("free");
    expect(update?.subscription_status).toBe("canceled");
  });

  it("ignores late events for a subscription that was replaced", () => {
    expect(profileUpdateFor(subscription({ id: "sub_old", status: "canceled" }), "sub_new")).toBeNull();
  });

  it("lets a new active subscription replace an old one", () => {
    expect(profileUpdateFor(subscription(), "sub_old")?.plan).toBe("pro");
  });

  it("handles expanded customer objects and missing period end", () => {
    const update = profileUpdateFor(
      subscription({
        customer: { id: "cus_obj" } as Stripe.Customer,
        items: { data: [] } as unknown as Stripe.ApiList<Stripe.SubscriptionItem>,
      }),
      null,
    );
    expect(update?.stripe_customer_id).toBe("cus_obj");
    expect(update?.current_period_end).toBeNull();
  });
});
