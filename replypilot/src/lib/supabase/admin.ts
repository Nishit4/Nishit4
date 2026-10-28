import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseEnv, supabaseSecretKey } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Service-role client: bypasses RLS. Only for trusted server code that must
 * write billing fields, usage counters or the demo log. Never expose to users.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseEnv().url, supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
