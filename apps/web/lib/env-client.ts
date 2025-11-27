export const clientEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

if (!clientEnv.supabaseUrl || !clientEnv.supabaseAnonKey) {
  console.warn("Supabase client environment variables are missing.");
}