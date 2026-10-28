import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getBusiness } from "@/lib/data/business";
import { nextPeriodStart } from "@/lib/data/period";
import { getProfile } from "@/lib/data/profile";
import { listRecentReviews } from "@/lib/data/reviews";
import { getGenerationsThisMonth } from "@/lib/data/usage";
import { planFor, type Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { GeneratorForm } from "./generator-form";
import { ReviewHistory } from "./review-history";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [business, profile, used, reviews] = await Promise.all([
    getBusiness(supabase, user.id),
    getProfile(supabase, user.id),
    getGenerationsThisMonth(supabase, user.id),
    listRecentReviews(supabase, user.id),
  ]);

  if (!business) redirect("/business");

  const plan = planFor(profile);
  const limitReached = plan.monthlyReplyLimit !== null && used >= plan.monthlyReplyLimit;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Answer a review</h1>
            <p className="mt-1 text-sm text-slate-600">
              Paste a Google review for <span className="font-medium">{business.name}</span> and
              get three replies in your voice.
            </p>
          </div>
          <UsageMeter plan={plan} used={used} />
        </div>
        <GeneratorForm limitReached={limitReached} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">History</h2>
        <ReviewHistory reviews={reviews} />
      </section>
    </div>
  );
}

function UsageMeter({ plan, used }: { plan: Plan; used: number }) {
  if (plan.monthlyReplyLimit === null) {
    return (
      <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
        Pro · unlimited replies
      </span>
    );
  }

  const limit = plan.monthlyReplyLimit;
  const resetsOn = nextPeriodStart().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="w-full max-w-xs text-sm sm:w-64">
      <div className="flex justify-between text-slate-600">
        <span>
          {Math.min(used, limit)} of {limit} free replies used
        </span>
        <Link href="/billing" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Upgrade
        </Link>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-indigo-600"
          style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">Resets {resetsOn}</p>
    </div>
  );
}
