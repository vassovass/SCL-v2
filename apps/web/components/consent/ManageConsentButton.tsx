"use client";

import { useConsent } from "@/components/providers/ConsentProvider";

export function ManageConsentButton() {
  const { openManager } = useConsent();

  return (
    <button
      type="button"
      onClick={openManager}
      className="fixed bottom-5 right-5 z-40 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur transition hover:border-sky-500 hover:text-sky-400"
    >
      Manage cookies
    </button>
  );
}