import type { Metadata } from "next";

import { Alert, Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { nextPeriodStart } from "@/lib/data/period";
import { getProfile } from "@/lib/data/profile";
import { getGenerationsThisMonth } from "@/lib/data/usage";
import { PLANS, planFor } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { BillingButton } from "./billing-button";

export const metadata: Metadata = { title: "Billing" };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function BillingPage({ searchParams }: PageProps<"/billing">) {
  const user = await requireUser();
  const supabase = await createClient();
  const [profile, used, { checkout }] = await Promise.all([
    getProfile(supabase, user.id),
    getGenerationsThisMonth(supabase, user.id),
    searchParams,
  ]);

  const plan = planFor(profile);
  const isPro = plan.id === "pro";
  const periodEnd = profile?.current_period_end ? new Date(profile.current_period_end) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-600">Your plan, usage and subscription.</p>
      </div>

      {checkout === "success" && (
        <Alert tone="success">
          Thanks for upgrading! {isPro
            ? "Pro is active: you have unlimited replies."
            : "Your payment went through. Pro will switch on within a few seconds; refresh this page if it hasn't yet."}
        </Alert>
      )}
      {checkout === "canceled" && <Alert tone="info">Checkout canceled. You haven&apos;t been charged.</Alert>}
      {profile?.subscription_status === "past_due" && (
        <Alert tone="error">
          Your last payment failed. Update your card in the billing portal to keep Pro.
        </Alert>
      )}

      <Card className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Current plan</p>
            <p className="text-2xl font-semibold text-slate-900">
              {plan.name}
              {isPro && <span className="ml-2 text-base font-normal text-slate-500">${plan.priceMonthly}/month</span>}
            </p>
            <p className="text-sm text-slate-600">
              {isPro
                ? periodEnd &&
                  (profile?.cancel_at_period_end
                    ? `Cancels on ${dateFormat.format(periodEnd)}. You keep Pro until then.`
                    : `Renews on ${dateFormat.format(periodEnd)}.`)
                : `${Math.min(used, plan.monthlyReplyLimit ?? 0)} of ${plan.monthlyReplyLimit} free replies used this month. Resets ${dateFormat.format(nextPeriodStart())}.`}
            </p>
            {isPro && <p className="text-sm text-slate-600">{used} replies generated this month.</p>}
          </div>
          {profile?.stripe_customer_id && (
            <BillingButton kind="portal" variant="secondary" label={isPro ? "Manage subscription" : "Billing history"} />
          )}
        </div>
      </Card>

      {!isPro && (
        <Card className="border-indigo-200 p-6 ring-1 ring-indigo-100">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">ReplyPilot Pro</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">
                ${PLANS.pro.priceMonthly}
                <span className="text-base font-normal text-slate-500">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {PLANS.pro.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-indigo-600" aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 sm:text-right">
              <BillingButton kind="checkout" />
              <p className="text-xs text-slate-500">Cancel any time. Secure checkout by Stripe.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
