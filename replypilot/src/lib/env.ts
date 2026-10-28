// Typed, lazily-validated access to environment variables. Read inside
// functions (not at module load) so a missing value fails the request that
// needs it with a clear message instead of breaking the whole build.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`);
  }
  return value;
}

export function supabaseEnv() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey: required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}

export function supabaseSecretKey() {
  return required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
}

export function stripeEnv() {
  return {
    secretKey: required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY),
    proPriceId: required("STRIPE_PRO_PRICE_ID", process.env.STRIPE_PRO_PRICE_ID),
  };
}

export function stripeWebhookSecret() {
  return required("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
}

export function demoEnv() {
  return {
    ipSalt: required("DEMO_IP_SALT", process.env.DEMO_IP_SALT),
    dailyLimit: Number(process.env.DEMO_DAILY_LIMIT) || 200,
  };
}

/** Absolute base URL used in emails and Stripe redirects. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
