import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

/**
 * The signed-in user, verified from the session JWT, or null. Deduplicated per
 * request. Server Actions must call this (or requireUser) themselves rather
 * than trusting anything sent by the client.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Only allow same-site relative redirects. Blocks `//evil.com` and `/\evil.com`
 * (browsers treat a backslash like a slash).
 */
export function safeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}
