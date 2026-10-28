import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { currentPeriodStart } from "./period";

/** Generations used this month (read with the user's own client). */
export async function getGenerationsThisMonth(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("usage_counters")
    .select("generations")
    .eq("user_id", userId)
    .eq("period_start", currentPeriodStart())
    .maybeSingle();

  if (error) throw error;
  return data?.generations ?? 0;
}

/**
 * Atomically counts one generation. Returns false when the monthly limit is
 * already reached. `limit` null means unlimited.
 */
export async function consumeReplyCredit(
  userId: string,
  limit: number | null,
): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("consume_reply_credit", {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) throw error;
  return data !== null;
}

/** Returns a credit after a failed generation. Never throws. */
export async function refundReplyCredit(userId: string): Promise<void> {
  const { error } = await createAdminClient().rpc("refund_reply_credit", {
    p_user_id: userId,
  });
  if (error) console.error("Failed to refund reply credit", error);
}
