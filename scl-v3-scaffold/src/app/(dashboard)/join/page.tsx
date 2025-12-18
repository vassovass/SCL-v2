"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function JoinLeaguePage() {
  const router = useRouter();
  const { session } = useAuth();

  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invite/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ invite_code: inviteCode.toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join league");
        setLoading(false);
        return;
      }

      router.push(`/league/${data.league_id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-200">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-slate-50">Join a League</h1>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-md px-6 py-12">
        <p className="text-center text-slate-400">
          Enter the invite code shared by your league admin.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-slate-300">
              Invite Code
            </label>
            <input
              id="code"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              placeholder="ABC123"
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-center text-2xl font-mono tracking-widest text-slate-50 uppercase placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
              maxLength={10}
            />
          </div>

          <button
            type="submit"
            disabled={loading || inviteCode.length < 4}
            className="w-full rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join League"}
          </button>
        </form>
      </main>
    </div>
  );
}
