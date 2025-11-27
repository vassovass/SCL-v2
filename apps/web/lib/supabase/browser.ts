import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@/lib/env-client";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    if (!clientEnv.supabaseUrl || !clientEnv.supabaseAnonKey) {
      throw new Error("Supabase environment variables are not configured");
    }
    client = createBrowserClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey);
  }
  return client;
}