"use client";

import { useState } from "react";

import { AdBanner } from "@/app/_components/AdBanner";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiRequest, ApiError } from "@/lib/api/client";

const STEP_WEEK_OPTIONS = [
  { value: "mon", label: "Start on Monday" },
  { value: "sun", label: "Start on Sunday" },
];

export default function CreateLeaguePage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [startDay, setStartDay] = useState("mon");
  const [invite, setInvite] = useState<{ code: string; leagueId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInvite(null);
    setSubmitting(true);

    try {
      const result = await apiRequest<{ invite_code: string; league_id: string }>("invite/create", {
        method: "POST",
        body: JSON.stringify({ name, stepweek_start: startDay }),
      });
      setInvite({ code: result.invite_code, leagueId: result.league_id });
      setName("");
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
        <h1 className="text-3xl font-semibold text-slate-50">You need to sign in</h1>
        <p className="text-sm text-slate-400">
          Creating leagues requires an account. Please sign in to continue.
        </p>
        <a
          href="/sign-in"
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Create a league</h1>
        <p className="text-sm text-slate-400">
          Choose a name and set the StepWeek start day. Share the invite code with your crew.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
        <div className="space-y-2">
          <label htmlFor="league-name" className="text-sm font-medium text-slate-200">
            League name
          </label>
          <input
            id="league-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={64}
            required
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 focus:border-sky-500 focus:outline-none"
            placeholder="Weekend Hustlers"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">StepWeek starts on</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {STEP_WEEK_OPTIONS.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                <input
                  type="radio"
                  name="stepweek-start"
                  value={option.value}
                  checked={startDay === option.value}
                  onChange={() => setStartDay(option.value)}
                  className="h-4 w-4 text-sky-500 focus:ring-sky-500"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create league"}
        </button>
      </form>

      {invite && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <p className="text-sm text-slate-400">Invite code</p>
          <p className="mt-2 text-3xl font-semibold tracking-widest text-sky-400">{invite.code}</p>
          <p className="mt-4 text-xs text-slate-500">League ID: {invite.leagueId}</p>
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