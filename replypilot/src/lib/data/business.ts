import "server-only";

import type { BusinessVoice } from "@/lib/ai/types";
import type { Tables } from "@/lib/supabase/database.types";
import type { SupabaseServerClient } from "@/lib/supabase/server";

export type Business = Tables<"businesses">;

export async function getBusiness(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function toBusinessVoice(business: Business): BusinessVoice {
  return {
    name: business.name,
    businessType: business.business_type,
    tone: business.tone,
    ownerName: business.owner_name,
    contactDetails: business.contact_details,
    doRules: business.do_rules,
    dontRules: business.dont_rules,
  };
}
