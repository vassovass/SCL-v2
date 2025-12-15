"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";

export function NavHeader() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="border-b border-slate-800 bg-slate-900/50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-slate-50 transition hover:text-sky-400">
            StepCountLeague
          </Link>

          {user && (
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition ${
                  isActive("/dashboard") ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/create-league"
                className={`text-sm font-medium transition ${
                  isActive("/create-league") ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create League
              </Link>
              <Link
                href="/join"
                className={`text-sm font-medium transition ${
                  isActive("/join") ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Join League
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <button
              onClick={() => signOut()}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-slate-100"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
