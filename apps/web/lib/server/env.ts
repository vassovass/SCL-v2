const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

const functionsOrigin = (() => {
  try {
    const { hostname, protocol } = new URL(supabaseUrl);
    if (!hostname.endsWith(".supabase.co")) {
      return `${protocol}//${hostname}`;
    }
    const fnHost = hostname.replace(".supabase.co", ".functions.supabase.co");
    return `${protocol}//${fnHost}`;
  } catch (error) {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL provided: ${error instanceof Error ? error.message : String(error)}`);
  }
})();

export const serverEnv = {
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseFunctionsUrl: functionsOrigin,
  verifyFunctionName: "verify",
  verifyTimeoutMs: Number.parseInt(process.env["VERIFY_TIMEOUT_MS"] ?? "15000", 10),
};

export function getSupabaseFunctionUrl(name: string): string {
  return `${serverEnv.supabaseFunctionsUrl}/${name}`;
}

export function ensureEnv() {
  for (const name of requiredEnv) {
    readEnv(name);
  }
}