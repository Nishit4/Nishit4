import type Stripe from "stripe";

import { getStripe } from "@/lib/billing/stripe";
import { syncSubscription } from "@/lib/billing/sync";
import { stripeWebhookSecret } from "@/lib/env";

const SUBSCRIPTION_EVENTS = new Set<Stripe.Event["type"]>([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // The signature covers the exact raw body, so read it as text.
    event = await getStripe().webhooks.constructEventAsync(
      await request.text(),
      signature,
      stripeWebhookSecret(),
    );
  } catch (error) {
    console.warn("Rejected Stripe webhook with invalid signature", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await syncSubscription(subscriptionId, session.client_reference_id);
      }
    } else if (SUBSCRIPTION_EVENTS.has(event.type)) {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription.id);
    }
  } catch (error) {
    // A non-2xx response makes Stripe retry the event with backoff.
    console.error(`Failed to handle Stripe event ${event.id} (${event.type})`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
