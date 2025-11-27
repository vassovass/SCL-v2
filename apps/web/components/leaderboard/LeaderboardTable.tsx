export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  total_steps: number;
  total_km: number;
  total_calories: number;
  partial_days: number;
  missed_days: number;
  verified_days: number;
  unverified_days: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-widest text-slate-400">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3 text-right">Steps</th>
            <th className="px-4 py-3 text-right">Km</th>
            <th className="px-4 py-3 text-right">Calories</th>
            <th className="px-4 py-3 text-right">Partial</th>
            <th className="px-4 py-3 text-right">Missed</th>
            <th className="px-4 py-3 text-right">Pending</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-200">
          {entries.map((entry) => (
            <tr key={entry.user_id} className="hover:bg-slate-800/40">
              <td className="px-4 py-3 text-sm font-semibold text-slate-300">{entry.rank}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium">{entry.display_name ?? "Anonymous Walker"}</span>
                  <span className="text-xs text-slate-500">{entry.user_id.slice(0, 8)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-sky-400">{entry.total_steps.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{entry.total_km.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{entry.total_calories.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{entry.partial_days}</td>
              <td className="px-4 py-3 text-right">{entry.missed_days}</td>
              <td className="px-4 py-3 text-right">{entry.unverified_days}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                No activity recorded for this period yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}