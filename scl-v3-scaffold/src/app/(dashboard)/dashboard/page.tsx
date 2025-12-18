"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface League {
  id: string;
  name: string;
  role: string;
  member_count?: number;
}

export default function DashboardPage() {
  const { user, session, signOut } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchLeagues = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("memberships")
        .select("role, leagues(id, name)")
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error fetching leagues:", error);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map((m) => ({
        id: (m.leagues as { id: string; name: string }).id,
        name: (m.leagues as { id: string; name: string }).name,
        role: m.role,
      }));

      setLeagues(mapped);
      setLoading(false);
    };

    fetchLeagues();
  }, [session, user?.id]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-slate-50">
            Step<span className="text-sky-500">Count</span>League
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-50">Your Leagues</h1>
          <div className="flex gap-3">
            <Link
              href="/join"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
            >
              Join League
            </Link>
            <Link
              href="/league/create"
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400"
            >
              Create League
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-12 text-center text-slate-400">Loading...</div>
        ) : leagues.length === 0 ? (
          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-lg text-slate-400">You haven&apos;t joined any leagues yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Create a new league or join one with an invite code.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/league/${league.id}`}
                className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-sky-400">
                  {league.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500 capitalize">{league.role}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
