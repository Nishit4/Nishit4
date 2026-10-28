import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { getBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = { title: "Business profile" };

export default async function BusinessPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const business = await getBusiness(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {business ? "Business profile" : "Tell us about your business"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {business
            ? "Every reply is written from this profile. Update it any time."
            : "This takes a minute. Every reply ReplyPilot writes will sound like it came from you."}
        </p>
      </div>
      <BusinessForm business={business} />
    </div>
  );
}
