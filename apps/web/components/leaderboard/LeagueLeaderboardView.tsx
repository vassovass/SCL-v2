"use client";

import { useEffect, useState } from "react";

import { AdBanner } from "@/app/_components/AdBanner";
import { CustomPeriodBuilder } from "@/components/leaderboard/CustomPeriodBuilder";
import { LeaderboardTable, type LeaderboardEntry } from "@/components/leaderboard/LeaderboardTable";
import { PeriodSelector, type PeriodOption } from "@/components/leaderboard/PeriodSelector";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiRequest, ApiError } from "@/lib/api/client";
import { formatDate, getStepWeekRange, getTodayUtc, type StepWeekStart } from "@/lib/time";

interface LeagueLeaderboardViewProps {
  leagueId: string;
}

interface LeagueResponse {
  league: {
    id: string;
    name: string;
    stepweek_start: StepWeekStart;
    invite_code: string;
    owner_id: string;
  };
  current_window: {
    day: string;
    stepweek: {
      start: string;
      end: string;
    };
  };
}

interface LeaderboardMeta {
  total_members: number;
  team_total_steps: number;
  limit: number;
  offset: number;
}

interface SubmissionsResponse {
  submissions: Array<{
    id: string;
    steps: number;
    partial: boolean;
    verified: boolean;
    for_date: string;
    created_at: string;
  }>;
}

export function LeagueLeaderboardView({ leagueId }: LeagueLeaderboardViewProps) {
  const { user, loading: authLoading } = useAuth();
  const [league, setLeague] = useState<LeagueResponse["league"] | null>(null);
  const [period, setPeriod] = useState<PeriodOption>("week");
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [activity, setActivity] = useState<SubmissionsResponse["submissions"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const leagueData = await apiRequest<LeagueResponse>(`leagues/${leagueId}`);
        setLeague(leagueData.league);

        const initialDates = defaultDates("week", leagueData.league.stepweek_start);
        await fetchLeaderboard(initialDates, "week");
        await fetchActivity();
      } catch (err) {
        setError(parseError(err));
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  useEffect(() => {
    if (!league) return;

    const dates = period === "custom" ? customDates : defaultDates(period, league.stepweek_start);
    if (dates.length === 0) return;

    fetchLeaderboard(dates, period).catch((err) => setError(parseError(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customDates, league]);

  const topPerformer = leaderboard[0] ?? null;

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading leaderboard...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Sign in to view this league</h1>
        <a
          href="/sign-in"
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-rose-300">We couldn&apos;t load this league</h1>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  if (!league) {
    return null;
  }

  const dates = period === "custom" ? customDates : defaultDates(period, league.stepweek_start);

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[3fr_1fr]">
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-50">{league.name}</h1>
          <p className="text-sm text-slate-400">Invite code: {league.invite_code}</p>
        </header>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <PeriodSelector value={period} onChange={setPeriod} />
            {period !== "custom" && (
              <p className="text-xs text-slate-400">
                {dates[0]} {dates.length > 1 ? `→ ${dates[dates.length - 1]}` : ""}
              </p>
            )}
          </div>

          {period === "custom" && (
            <CustomPeriodBuilder dates={customDates} onChange={setCustomDates} />
          )}
        </section>

        <LeaderboardTable entries={leaderboard} />

        {meta && (
          <section className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Team total</p>
              <p className="text-2xl font-semibold text-sky-400">{meta.team_total_steps.toLocaleString()} steps</p>
              <p className="mt-1 text-xs text-slate-500">Across {meta.total_members} members</p>
            </div>
            {topPerformer && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Top performer</p>
                <p className="text-lg font-semibold text-slate-100">{topPerformer.display_name ?? "Anonymous Walker"}</p>
                <p className="text-sm text-slate-400">{topPerformer.total_steps.toLocaleString()} steps</p>
              </div>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">League activity</h2>
          <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60">
            {activity.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-400">No submissions yet for this league.</p>
            )}
            {activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-100">{item.steps.toLocaleString()} steps</p>
                  <p className="text-xs text-slate-500">{item.for_date}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{item.verified ? "Verified" : "Pending"}</p>
                  {item.partial && <p className="text-amber-300">Partial day</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {league && <SubmissionForm leagueId={league.id} onSubmitted={fetchActivity} />}
      </div>

      <aside className="space-y-6">
        <AdBanner />
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
          <p>
            Invite new members with code <span className="font-semibold text-slate-100">{league.invite_code}</span> or share
            this leaderboard for accountability.
          </p>
        </div>
      </aside>
    </div>
  );

  async function fetchLeaderboard(dates: string[], interval: PeriodOption) {
    if (dates.length === 0) return;

    const query = new URLSearchParams({
      league_id: leagueId,
      period: interval,
      dates: dates.join(","),
    });

    const response = await apiRequest<{ leaderboard: LeaderboardEntry[]; meta: LeaderboardMeta }>(`leaderboard?${query.toString()}`);
    setLeaderboard(response.leaderboard ?? []);
    setMeta(response.meta);
  }

  async function fetchActivity() {
    const query = new URLSearchParams({ league_id: leagueId, limit: "20" });
    const response = await apiRequest<SubmissionsResponse>(`submissions?${query.toString()}`);
    setActivity(response.submissions ?? []);
  }
}

function defaultDates(period: PeriodOption, stepweekStart: StepWeekStart): string[] {
  const today = getTodayUtc();

  switch (period) {
    case "day":
      return [formatDate(today)];
    case "week": {
      const range = getStepWeekRange(today, stepweekStart);
      return enumerateDates(range.start, range.end);
    }
    case "month": {
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
      return enumerateDates(start, end);
    }
    case "custom":
      return [];
    default:
      return [];
  }
}

function enumerateDates(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function parseError(error: unknown): string {
  if (error instanceof ApiError) {
    const message = error.payload && typeof error.payload === "object" && "error" in error.payload ? String((error.payload as { error: unknown }).error) : null;
    return message ?? `Request failed with status ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}