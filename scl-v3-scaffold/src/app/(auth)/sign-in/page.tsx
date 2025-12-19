"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-center text-2xl font-bold text-slate-50">
        Sign in to SCL
      </h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        Welcome back! Enter your credentials.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-sky-400 hover:text-sky-300">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
