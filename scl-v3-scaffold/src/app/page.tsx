import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-50 sm:text-6xl">
          Step<span className="text-sky-500">Count</span>League
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-400">
          Compete with friends and colleagues in step counting challenges.
          Submit your daily steps, get AI-verified, and climb the leaderboard.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-4">
          <Link
            href="/sign-up"
            className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-slate-50"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto mt-24 max-w-4xl">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 text-3xl">📱</div>
            <h3 className="text-lg font-semibold text-slate-100">Screenshot Proof</h3>
            <p className="mt-2 text-sm text-slate-400">
              Upload a screenshot from your fitness app. Our AI verifies your step count.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 text-3xl">🏆</div>
            <h3 className="text-lg font-semibold text-slate-100">Leaderboards</h3>
            <p className="mt-2 text-sm text-slate-400">
              See how you rank against your league. Daily and weekly standings.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 text-3xl">👥</div>
            <h3 className="text-lg font-semibold text-slate-100">Private Leagues</h3>
            <p className="mt-2 text-sm text-slate-400">
              Create a league and invite friends with a simple code.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
