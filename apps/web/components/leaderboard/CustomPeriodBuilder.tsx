"use client";

import { useState } from "react";

interface CustomPeriodBuilderProps {
  dates: string[];
  onChange: (dates: string[]) => void;
  disabled?: boolean;
}

export function CustomPeriodBuilder({ dates, onChange, disabled }: CustomPeriodBuilderProps) {
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const addDate = () => {
    if (!inputDate) return;
    if (dates.includes(inputDate)) return;
    const next = [...dates, inputDate].sort((a, b) => (a > b ? 1 : -1));
    onChange(next);
  };

  const removeDate = (target: string) => {
    onChange(dates.filter((date) => date !== target));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="date"
          value={inputDate}
          onChange={(event) => setInputDate(event.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={addDate}
          disabled={disabled}
          className="rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Date
        </button>
      </div>

      <ul className="flex flex-wrap gap-2">
        {dates.map((date) => (
          <li key={date} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">
            <span>{date}</span>
            <button
              type="button"
              onClick={() => removeDate(date)}
              disabled={disabled}
              className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </li>
        ))}
        {dates.length === 0 && <li className="text-xs text-slate-500">No dates selected</li>}
      </ul>
    </div>
  );
}