"use client";

import { useState } from "react";

import { useConsent } from "@/components/providers/ConsentProvider";

export function ConsentBanner() {
  const { bannerVisible, consent, acceptAll, rejectAll, updateConsent } = useConsent();
  const [analyticsOptIn, setAnalyticsOptIn] = useState<boolean>(consent?.analyticsStorage === "granted");
  const [customizing, setCustomizing] = useState(false);

  if (!bannerVisible) {
    return null;
  }

  const savePreferences = () => {
    updateConsent({
      adStorage: analyticsOptIn ? "granted" : "denied",
      analyticsStorage: analyticsOptIn ? "granted" : "denied",
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-50">We value your privacy</h2>
          <p className="text-sm text-slate-400">
            We use cookies to run essential features and, with your permission, analyse usage and show relevant ads. You
            can change your preferences at any time.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {customizing && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={analyticsOptIn}
                onChange={(event) => setAnalyticsOptIn(event.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
              />
              Allow analytics and personalization cookies
            </label>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {!customizing ? (
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-500 hover:text-sky-400"
              >
                Manage choices
              </button>
            ) : (
              <button
                type="button"
                onClick={savePreferences}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-500 hover:text-sky-400"
              >
                Save preferences
              </button>
            )}

            <button
              type="button"
              onClick={rejectAll}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-500 hover:text-sky-400"
            >
              Reject all
            </button>

            <button
              type="button"
              onClick={acceptAll}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}