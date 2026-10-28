import "server-only";

import { createHash } from "node:crypto";

import type { BusinessVoice } from "@/lib/ai/types";
import { demoEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const DEMO_COOKIE = "rp_demo_used";

export type DemoSlot = "ok" | "already_used" | "daily_limit";

/** Client IP as reported by Vercel's edge (falls back to a shared bucket). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** IPs are never stored in plain text. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${demoEnv().ipSalt}:${ip}`).digest("hex");
}

export async function claimDemoSlot(ipHash: string): Promise<DemoSlot> {
  const { data, error } = await createAdminClient().rpc("claim_demo_slot", {
    p_ip_hash: ipHash,
    p_daily_limit: demoEnv().dailyLimit,
  });
  if (error) throw error;
  return data as DemoSlot;
}

export async function releaseDemoSlot(ipHash: string): Promise<void> {
  const { error } = await createAdminClient().rpc("release_demo_slot", { p_ip_hash: ipHash });
  if (error) console.error("Failed to release demo slot", error);
}

/** A generic profile for visitors who haven't set one up. */
export function demoBusinessVoice(input: {
  businessName: string | null;
  businessType: string | null;
}): BusinessVoice {
  return {
    name: input.businessName ?? "Not provided",
    businessType: input.businessType ?? "Local business",
    tone: "Warm, genuine and professional",
    doRules: input.businessName
      ? null
      : 'The business name wasn\'t provided: refer to the business as "we" and "us", never by a placeholder name.',
  };
}
