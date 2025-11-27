"use client";

import { useState } from "react";

import { AdBanner } from "@/app/_components/AdBanner";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiRequest, ApiError } from "@/lib/api/client";

const BUTTON_CLASS = "w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60";

export default function JoinLeaguePage() {
  const { user, loading } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [result, setResult] = useState<{ leagueId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);

    try {
      const response = await apiRequest<{ league_id: string }>("invite/join", {
        method: "POST",
        body: JSON.stringify({ invite_code: inviteCode.trim().toUpperCase() }),
      });
      setResult({ leagueId: response.league_id });
      setInviteCode("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(parseApiError(err.payload) ?? `Request failed (${err.status})`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Sign in to join a league</h1>
        <p className="text-sm text-slate-400">You need to sign in before you can join a league.</p>
        <a href="/sign-in" className={BUTTON_CLASS}>
          Go to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Join a league</h1>
        <p className="text-sm text-slate-400">Enter the invite code shared by a league owner or admin.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
        <div className="space-y-2">
          <label htmlFor="invite-code" className="text-sm font-medium text-slate-200">
            Invite code
          </label>
          <input
            id="invite-code"
            type="text"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 uppercase tracking-widest focus:border-sky-500 focus:outline-none"
            minLength={6}
            maxLength={32}
            required
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button type="submit" disabled={submitting} className={BUTTON_CLASS}>
          {submitting ? "Joining..." : "Join league"}
        </button>
      </form>

      {result && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <p className="text-sm text-slate-400">Success! You&apos;re in.</p>
          <p className="mt-3 text-xs text-slate-500">League ID: {result.leagueId}</p>
          <a
            href={`/league/${result.leagueId}/leaderboard`}
            className="mt-4 inline-flex rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            View leaderboard
          </a>
        </div>
      )}

      <AdBanner />
    </div>
  );
}

function parseApiError(payload: unknown): string | null {
  if (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error: unknown }).error === "string") {
    return (payload as { error: string }).error;
  }
  return null;
}