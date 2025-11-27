"use client";

import { useEffect, useMemo, useState } from "react";

import { AdBanner } from "@/app/_components/AdBanner";
import { LifetimeStatsCard } from "@/components/dashboard/LifetimeStatsCard";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { useAuth } from "@/components/providers/AuthProvider";
import type { SupabaseClient } from "@supabase/supabase-js";

interface MembershipRow {
  league_id: string;
  role: string;
  leagues: {
    name: string | null;
  } | null;
}

interface SubmissionRow {
  league_id: string;
  steps: number;
  partial: boolean;
  verified: boolean;
  extracted_km: number | null;
  extracted_calories: number | null;
  for_date: string;
  created_at: string;
}

export default function DashboardPage() {
  const { supabase, user, loading } = useAuth();
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoadingData(true);

      const [{ data: membershipData, error: membershipError }, { data: submissionsData, error: submissionsError }] = await Promise.all([
        supabase
          .from("memberships")
          .select("league_id, role, leagues(name)")
          .eq("user_id", user.id),
        supabase
          .from("submissions")
          .select("league_id, steps, partial, verified, extracted_km, extracted_calories, for_date, created_at")
          .eq("user_id", user.id)
          .order("for_date", { ascending: false }),
      ]);

      if (membershipError) {
        console.error(membershipError);
      } else if (membershipData) {
        setMemberships(membershipData);
        setSelectedLeague((current) => current ?? membershipData[0]?.league_id ?? null);
      }

      if (submissionsError) {
        console.error(submissionsError);
      } else if (submissionsData) {
        setSubmissions(submissionsData);
      }

      setIsLoadingData(false);
    };

    loadData();
  }, [supabase, user]);

  const stats = useMemo(() => computeStats(submissions), [submissions]);
  const recentActivity = useMemo(() => submissions.slice(0, 10), [submissions]);

  if (loading || isLoadingData) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Welcome back</h1>
        <p className="text-sm text-slate-400">Sign in to see your stats and compete with your league.</p>
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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Dashboard</h1>
        <p className="text-sm text-slate-400">Track your progress and keep your streak alive.</p>
      </header>

      <LifetimeStatsCard
        totalSteps={stats.totalSteps}
        totalKm={stats.totalKm}
        totalCalories={stats.totalCalories}
        partialDays={stats.partialDays}
        missedDays={stats.missedDays}
      />

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Submit activity</h2>
          {memberships.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
              You are not part of any leagues yet. Create or join a league to start submitting steps.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="league-select" className="text-sm font-medium text-slate-200">
                  Choose league
                </label>
                <select
                  id="league-select"
                  value={selectedLeague ?? ""}
                  onChange={(event) => setSelectedLeague(event.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none"
                >
                  {memberships.map((membership) => (
                    <option key={membership.league_id} value={membership.league_id}>
                      {membership.leagues?.name ?? membership.league_id} • {membership.role}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLeague && <SubmissionForm leagueId={selectedLeague} onSubmitted={() => refreshSubmissions(supabase, user.id, setSubmissions)} />}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Recent activity</h2>
          <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60">
            {recentActivity.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-400">
                No submissions yet. Log your first steps to start your streak!
              </p>
            )}
            {recentActivity.map((item) => (
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
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Your leagues</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {memberships.map((membership) => (
            <a
              key={membership.league_id}
              href={`/league/${membership.league_id}/leaderboard`}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-sky-500 hover:bg-slate-900/80"
            >
              <p className="text-sm font-semibold text-slate-100">{membership.leagues?.name ?? membership.league_id}</p>
              <p className="text-xs text-slate-400">Role: {membership.role}</p>
            </a>
          ))}
          {memberships.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
              Create or join a league to appear here.
            </div>
          )}
        </div>
      </section>

      <AdBanner />
    </div>
  );
}

async function refreshSubmissions(supabase: SupabaseClient, userId: string, setSubmissions: (rows: SubmissionRow[]) => void) {
  const { data, error } = await supabase
    .from("submissions")
    .select("league_id, steps, partial, verified, extracted_km, extracted_calories, for_date, created_at")
    .eq("user_id", userId)
    .order("for_date", { ascending: false });

  if (!error && data) {
    setSubmissions(data);
  }
}

function computeStats(rows: SubmissionRow[]) {
  const verifiedRows = rows.filter((row) => row.verified);
  const totalSteps = verifiedRows.reduce((sum, row) => sum + row.steps, 0);
  const totalKm = verifiedRows.reduce((sum, row) => sum + (row.extracted_km ?? 0), 0);
  const totalCalories = verifiedRows.reduce((sum, row) => sum + (row.extracted_calories ?? 0), 0);
  const partialDays = verifiedRows.filter((row) => row.partial).length;

  const missedDays = computeMissedDays(verifiedRows);

  return { totalSteps, totalKm, totalCalories, partialDays, missedDays };
}

function computeMissedDays(rows: SubmissionRow[]) {
  if (rows.length === 0) return 0;
  const sorted = [...rows].sort((a, b) => (a.for_date > b.for_date ? 1 : -1));
  const first = new Date(sorted[0].for_date);
  const last = new Date();
  const totalDays = Math.floor((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const verifiedDays = new Set(sorted.map((row) => row.for_date)).size;
  return Math.max(0, totalDays - verifiedDays);
}