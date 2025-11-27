"use client";

import { useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";

export default function SignInPage() {
  const { supabase } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        throw authError;
      }

      setStatus("Check your email for a magic link to continue.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-24">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Sign in to StepCountLeague</h1>
        <p className="text-sm text-slate-400">We will email you a secure sign-in link. No password required.</p>
      </header>

      <form onSubmit={sendMagicLink} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-200">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 focus:border-sky-500 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {status && <p className="text-sm text-sky-400">{status}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </form>
    </div>
  );
}