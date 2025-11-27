"use client";

import { useState } from "react";

import { apiRequest, ApiError } from "@/lib/api/client";

interface SubmissionFormProps {
  leagueId: string;
  onSubmitted?: () => void;
}

interface SignUploadResponse {
  upload_url: string;
  path: string;
  token?: string;
}

export function SubmissionForm({ leagueId, onSubmitted }: SubmissionFormProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [steps, setSteps] = useState<number>(0);
  const [partial, setPartial] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!file) {
      setError("Please attach a screenshot");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Screenshot must be 5 MB or less");
      return;
    }

    setSubmitting(true);

    try {
      const signed = await apiRequest<SignUploadResponse>("proofs/sign-upload", {
        method: "POST",
        body: JSON.stringify({ content_type: file.type }),
      });

      await uploadToSignedUrl(signed.upload_url, file);

      await apiRequest("submissions", {
        method: "POST",
        body: JSON.stringify({
          league_id: leagueId,
          date,
          steps,
          partial,
          proof_path: signed.path,
        }),
      });

      setStatus("Submission received! Verification in progress.");
      setFile(null);
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(parseApiMessage(err.payload) ?? `Request failed (${err.status})`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-slate-300" htmlFor="submission-date">
          Date
        </label>
        <input
          id="submission-date"
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 focus:border-sky-500 focus:outline-none"
          required
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-slate-300" htmlFor="submission-steps">
          Steps
        </label>
        <input
          id="submission-steps"
          type="number"
          min={0}
          value={steps}
          onChange={(e) => setSteps(Number(e.target.value))}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 focus:border-sky-500 focus:outline-none"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="submission-partial"
          type="checkbox"
          checked={partial}
          onChange={(e) => setPartial(e.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
        />
        <label htmlFor="submission-partial" className="text-sm text-slate-300">
          Mark as partial day
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300" htmlFor="submission-proof">
          Screenshot (PNG, JPG, HEIC)
        </label>
        <input
          id="submission-proof"
          type="file"
          accept="image/png,image/jpeg,image/heic"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="text-sm text-slate-300"
          required
        />
        {file && (
          <span className="text-xs text-slate-500">
            {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        )}
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {status && <p className="text-sm text-sky-400">{status}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit Steps"}
      </button>
    </form>
  );
}

async function uploadToSignedUrl(url: string, file: File) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload screenshot");
  }
}

function parseApiMessage(payload: unknown): string | null {
  if (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error: unknown }).error === "string") {
    return (payload as { error: string }).error;
  }
  return null;
}