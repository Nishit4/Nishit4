import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/billing/sync", () => ({ syncSubscription: vi.fn() }));

import { syncSubscription } from "@/lib/billing/sync";
import { POST } from "./route";

const secret = "whsec_test_secret";
const stripe = new Stripe("sk_test_dummy");

function signedRequest(event: object, signingSecret = secret) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: signingSecret });
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  });
}

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  vi.mocked(syncSubscription).mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/stripe/webhook", () => {
  it("rejects requests without a valid signature", async () => {
    const unsigned = new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}" });
    expect((await POST(unsigned)).status).toBe(400);

    const badSignature = signedRequest({ id: "evt_1", type: "customer.subscription.updated" }, "whsec_wrong");
    expect((await POST(badSignature)).status).toBe(400);
    expect(syncSubscription).not.toHaveBeenCalled();
  });

  it("syncs the subscription after checkout, passing the user id", async () => {
    const response = await POST(
      signedRequest({
        id: "evt_2",
        object: "event",
        type: "checkout.session.completed",
        data: {
          object: { object: "checkout.session", mode: "subscription", subscription: "sub_123", client_reference_id: "user-1" },
        },
      }),
    );
    expect(response.status).toBe(200);
    expect(syncSubscription).toHaveBeenCalledWith("sub_123", "user-1");
  });

  it("syncs subscription lifecycle events", async () => {
    for (const type of ["customer.subscription.updated", "customer.subscription.deleted"]) {
      await POST(
        signedRequest({ id: "evt_3", object: "event", type, data: { object: { id: "sub_456", object: "subscription" } } }),
      );
    }
    expect(syncSubscription).toHaveBeenCalledTimes(2);
    expect(syncSubscription).toHaveBeenCalledWith("sub_456");
  });

  it("acknowledges unrelated events without syncing", async () => {
    const response = await POST(
      signedRequest({ id: "evt_4", object: "event", type: "invoice.paid", data: { object: {} } }),
    );
    expect(response.status).toBe(200);
    expect(syncSubscription).not.toHaveBeenCalled();
  });

  it("returns 500 so Stripe retries when syncing fails", async () => {
    vi.mocked(syncSubscription).mockRejectedValueOnce(new Error("db down"));
    const response = await POST(
      signedRequest({ id: "evt_5", object: "event", type: "customer.subscription.updated", data: { object: { id: "sub_789" } } }),
    );
    expect(response.status).toBe(500);
  });
});
