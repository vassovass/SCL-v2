interface LifetimeStatsProps {
  totalSteps: number;
  totalKm: number;
  totalCalories: number;
  partialDays: number;
  missedDays: number;
}

export function LifetimeStatsCard({ totalSteps, totalKm, totalCalories, partialDays, missedDays }: LifetimeStatsProps) {
  const items = [
    { label: "All-time Steps", value: totalSteps.toLocaleString() },
    { label: "All-time Km", value: totalKm.toFixed(2) },
    { label: "All-time Calories", value: totalCalories.toLocaleString() },
    { label: "Partial Days", value: partialDays.toString() },
    { label: "Missed Days", value: missedDays.toString() },
  ];

  return (
    <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-xs uppercase tracking-widest text-slate-500">{item.label}</p>
          <p className="mt-1 text-xl font-semibold text-sky-400">{item.value}</p>
        </div>
      ))}
    </div>
  );
}