import Link from "next/link";

import { buttonClass } from "@/components/ui";
import { PLANS } from "@/lib/plans";

export function Pricing() {
  const plans = [
    { plan: PLANS.free, cta: "Start free", note: "No credit card required", featured: false },
    { plan: PLANS.pro, cta: "Start with Pro", note: "Cancel any time", featured: true },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      {plans.map(({ plan, cta, note, featured }) => (
        <div
          key={plan.id}
          className={`flex flex-col rounded-2xl p-8 ${
            featured
              ? "bg-slate-900 text-white shadow-xl ring-1 ring-slate-900"
              : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            {featured && (
              <span className="rounded-full bg-indigo-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                Most popular
              </span>
            )}
          </div>
          <p className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight">${plan.priceMonthly}</span>
            <span className={featured ? "text-slate-400" : "text-slate-500"}>/month</span>
          </p>
          <p className={`mt-2 text-sm ${featured ? "text-slate-300" : "text-slate-600"}`}>
            {plan.monthlyReplyLimit === null
              ? "For businesses that get reviews every week."
              : "For trying it out or a handful of reviews a month."}
          </p>
          <ul className={`mt-6 flex-1 space-y-3 text-sm ${featured ? "text-slate-200" : "text-slate-700"}`}>
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-3">
                <span className={featured ? "text-indigo-400" : "text-indigo-600"} aria-hidden="true">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className={buttonClass(featured ? "primary" : "secondary", "mt-8 w-full")}
          >
            {cta}
          </Link>
          <p className={`mt-3 text-center text-xs ${featured ? "text-slate-400" : "text-slate-500"}`}>{note}</p>
        </div>
      ))}
    </div>
  );
}
