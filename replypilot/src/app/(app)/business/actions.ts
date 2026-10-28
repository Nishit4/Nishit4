"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getBusiness } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { businessSchema, fieldErrors, formToObject, type FieldErrors } from "@/lib/validation";

export type BusinessFormState = {
  saved?: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  /** Submitted values, echoed back on error so the form keeps the user's edits. */
  values?: Record<string, string>;
};

export async function saveBusiness(
  _prev: BusinessFormState,
  formData: FormData,
): Promise<BusinessFormState> {
  const user = await requireUser();
  const values = formToObject(formData);
  const parsed = businessSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const existing = await getBusiness(supabase, user.id);
  const { data } = parsed;

  const { error } = await supabase.from("businesses").upsert(
    {
      user_id: user.id,
      name: data.name,
      business_type: data.businessType,
      tone: data.tone,
      owner_name: data.ownerName,
      contact_details: data.contactDetails,
      do_rules: data.doRules,
      dont_rules: data.dontRules,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Failed to save business", error);
    return { error: "We couldn't save your profile. Please try again.", values };
  }

  // First-time setup goes straight to the generator.
  if (!existing) redirect("/dashboard");

  refresh();
  return { saved: true };
}
