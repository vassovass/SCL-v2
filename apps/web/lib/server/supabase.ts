import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { serverEnv } from "./env";

const adminClient = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

export type AppSupabaseClient = SupabaseClient;

export function getAdminClient(): SupabaseClient {
  return adminClient;
}

export function createRequestClient(authHeader?: string | null): SupabaseClient {
  const headers = authHeader ? { Authorization: authHeader } : {};
  return createClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, {
    global: { headers },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function requireUser(req: Request): Promise<{ supabase: SupabaseClient; user: User; token: string }> {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) {
    throw unauthorized();
  }

  const supabase = createRequestClient(`Bearer ${token}`);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw unauthorized();
  }

  return { supabase, user: data.user, token };
}

export async function getOptionalUser(req: Request): Promise<{ supabase: SupabaseClient; user: User | null; token: string | null }> {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) {
    return { supabase: createRequestClient(), user: null, token: null };
  }

  const supabase = createRequestClient(`Bearer ${token}`);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { supabase, user: null, token: null };
  }

  return { supabase, user: data.user, token };
}

function extractBearer(value: string | null): string | null {
  if (!value) return null;
  const [scheme, token] = value.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
}

function unauthorized(): Error {
  const error: Error & { status?: number } = new Error("Unauthorized");
  error.status = 401;
  return error;
}