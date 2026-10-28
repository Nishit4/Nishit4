import "server-only";

import Stripe from "stripe";

import { stripeSecretKey } from "@/lib/env";

let stripe: Stripe | undefined;

/** Lazily created so builds don't need the secret key. */
export function getStripe(): Stripe {
  stripe ??= new Stripe(stripeSecretKey());
  return stripe;
}
