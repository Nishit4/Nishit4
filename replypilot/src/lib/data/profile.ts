import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import type { SupabaseServerClient } from "@/lib/supabase/server";

export type Profile = Tables<"profiles">;

export async function getProfile(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
