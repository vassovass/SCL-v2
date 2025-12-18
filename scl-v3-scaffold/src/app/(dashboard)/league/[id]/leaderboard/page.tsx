"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  total_steps: number;
}

export default function LeaderboardPage() {
  const params = useParams();
  const leagueId = params.id as string;
  const { session } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchLeaderboard = async () => {
      try {
        // Get today's date
        const today = new Date().toISOString().split("T")[0];

        const res = await fetch(
          `/api/leaderboard?league_id=${leagueId}&period=day&dates=${today}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setEntries(data.leaderboard || []);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [session, leagueId]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link href={`/league/${leagueId}`} className="text-slate-400 hover:text-slate-200">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-slate-50">Leaderboard</h1>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">No submissions yet today.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                    Steps
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {entries.map((entry) => (
                  <tr key={entry.user_id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          entry.rank === 1
                            ? "bg-yellow-500/20 text-yellow-400"
                            : entry.rank === 2
                            ? "bg-slate-400/20 text-slate-300"
                            : entry.rank === 3
                            ? "bg-amber-600/20 text-amber-500"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-100">
                      {entry.display_name || "Anonymous"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">
                      {entry.total_steps.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
