import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-24">
      <section className="space-y-6 text-center">
        <span className="rounded-full border border-slate-700 px-4 py-1 text-xs uppercase tracking-widest text-slate-300">
          StepCountLeague MVP
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
          Fair, verified step competitions for every crew.
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-400 sm:text-lg">
          Submit daily screenshots, let AI verify the numbers, and watch the leaderboard update in real time. Built for
          small teams that want trust, momentum, and bragging rights.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/create-league"
            className="rounded-md bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Create a league
          </Link>
          <Link
            href="/join"
            className="rounded-md border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-sky-500 hover:text-sky-400"
          >
            Join with invite code
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-slate-100">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-slate-100">Ready to play fair?</h3>
        <p className="mt-2 text-sm text-slate-400">
          Head to your <Link href="/dashboard" className="text-sky-400 hover:underline">dashboard</Link> to submit steps, or
          jump straight into your league leaderboard to track the action.
        </p>
      </section>
    </div>
  );
}

const FEATURES = [
  {
    title: "Verified submissions",
    description: "Upload screenshots once, let Gemini verify steps, tolerance, and notes with an audit trail.",
  },
  {
    title: "Flexible leaderboards",
    description: "Compare day, StepWeek, month, or build custom date sets for pop-up challenges.",
  },
  {
    title: "Stats that motivate",
    description: "Lifetime totals, partial day tracking, and activity feeds keep every member accountable.",
  },
];