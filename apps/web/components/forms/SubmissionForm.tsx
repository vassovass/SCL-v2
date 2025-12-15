"use client";

import { useEffect, useState } from "react";

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

interface SubmissionResponse {
  submission: {
    id: string;
    verified: boolean | null;
  };
  verification?: {
    verified: boolean;
  };
  verification_error?: {
    error: string;
    retry_after?: number;
  };
}

interface PendingVerification {
  submissionId: string;
  leagueId: string;
  steps: number;
  forDate: string;
  proofPath: string;
  retryAt: number;
  attempts: number;
}

const MAX_RETRY_ATTEMPTS = 10;
const MAX_WAIT_SECONDS = 180; // 3 minutes

export function SubmissionForm({ leagueId, onSubmitted }: SubmissionFormProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [steps, setSteps] = useState<number>(0);
  const [partial, setPartial] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [estimatedWaitSeconds, setEstimatedWaitSeconds] = useState(0);
  const [showWaitConfirm, setShowWaitConfirm] = useState(false);

  // Process pending verification with retry logic
  useEffect(() => {
    if (!pendingVerification) return;

    const processVerification = async () => {
      const now = Date.now();
      const waitMs = pendingVerification.retryAt - now;

      if (waitMs > 0) {
        // Update countdown
        setEstimatedWaitSeconds(Math.ceil(waitMs / 1000));
        const timer = setTimeout(() => {
          setPendingVerification((prev) => prev ? { ...prev } : null); // Trigger re-process
        }, Math.min(waitMs, 1000));
        return () => clearTimeout(timer);
      }

      setEstimatedWaitSeconds(0);
      setStatus("Verifying submission...");

      try {
        const result = await apiRequest<{ verified: boolean }>("submissions/verify", {
          method: "POST",
          body: JSON.stringify({
            submission_id: pendingVerification.submissionId,
            league_id: pendingVerification.leagueId,
            steps: pendingVerification.steps,
            for_date: pendingVerification.forDate,
            proof_path: pendingVerification.proofPath,
          }),
        });

        setPendingVerification(null);
        setStatus(result.verified ? "Verification successful!" : "Verification completed (steps may differ from screenshot).");
        if (onSubmitted) {
          onSubmitted();
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          // Rate limited - schedule retry
          const payload = err.payload as { retry_after?: number };
          const retryAfter = payload?.retry_after ?? 10;
          const newWaitSeconds = retryAfter + (pendingVerification.attempts * 5); // Add buffer for each attempt

          if (pendingVerification.attempts >= MAX_RETRY_ATTEMPTS) {
            setPendingVerification(null);
            setError("Verification timed out after multiple attempts. Your submission was saved but not verified.");
            return;
          }

          // Check if wait exceeds threshold
          if (newWaitSeconds > MAX_WAIT_SECONDS && !showWaitConfirm) {
            setShowWaitConfirm(true);
            setEstimatedWaitSeconds(newWaitSeconds);
            return;
          }

          setStatus(`Rate limited. Retrying in ${retryAfter} seconds... (attempt ${pendingVerification.attempts + 1})`);
          setPendingVerification({
            ...pendingVerification,
            retryAt: Date.now() + retryAfter * 1000,
            attempts: pendingVerification.attempts + 1,
          });
        } else {
          // Other error - stop retrying
          setPendingVerification(null);
          const errorMsg = err instanceof Error ? err.message : "Verification failed";
          setError(errorMsg);
        }
      }
    };

    processVerification();
  }, [pendingVerification, showWaitConfirm, onSubmitted]);

  const handleConfirmWait = () => {
    setShowWaitConfirm(false);
    // Trigger retry
    if (pendingVerification) {
      setPendingVerification({
        ...pendingVerification,
        retryAt: Date.now(),
      });
    }
  };

  const handleCancelWait = () => {
    setShowWaitConfirm(false);
    setPendingVerification(null);
    setStatus("Submission saved but verification cancelled. It may be verified later.");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setShowWaitConfirm(false);
    setPendingVerification(null);

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

      const response = await apiRequest<SubmissionResponse>("submissions", {
        method: "POST",
        body: JSON.stringify({
          league_id: leagueId,
          date,
          steps,
          partial,
          proof_path: signed.path,
        }),
      });

      setFile(null);

      // Check if verification was rate limited
      if (response.verification_error?.error === "rate_limited") {
        const retryAfter = response.verification_error.retry_after ?? 10;

        // If wait > 3 minutes, ask for confirmation
        if (retryAfter > MAX_WAIT_SECONDS) {
          setEstimatedWaitSeconds(retryAfter);
          setShowWaitConfirm(true);
          setPendingVerification({
            submissionId: response.submission.id,
            leagueId,
            steps,
            forDate: date,
            proofPath: signed.path,
            retryAt: Date.now() + retryAfter * 1000,
            attempts: 0,
          });
        } else {
          setStatus(`Submission saved! Verification queued (waiting ${retryAfter}s due to rate limit)...`);
          setPendingVerification({
            submissionId: response.submission.id,
            leagueId,
            steps,
            forDate: date,
            proofPath: signed.path,
            retryAt: Date.now() + retryAfter * 1000,
            attempts: 0,
          });
        }
      } else if (response.verification?.verified !== undefined) {
        setStatus(response.verification.verified
          ? "Submission verified successfully!"
          : "Submission received. Verification completed (steps may differ from screenshot).");
        if (onSubmitted) {
          onSubmitted();
        }
      } else {
        setStatus("Submission saved! Verification in progress...");
        if (onSubmitted) {
          onSubmitted();
        }
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

      {/* Pending verification status */}
      {pendingVerification && !showWaitConfirm && (
        <div className="rounded-md border border-amber-700 bg-amber-900/30 p-3">
          <p className="text-sm text-amber-300">
            Verification in progress...
            {estimatedWaitSeconds > 0 && (
              <span className="ml-1">
                (retrying in {formatWaitTime(estimatedWaitSeconds)})
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-amber-400/70">
            Keep this tab open to complete verification.
          </p>
        </div>
      )}

      {/* Wait confirmation dialog */}
      {showWaitConfirm && (
        <div className="rounded-md border border-amber-700 bg-amber-900/30 p-4">
          <p className="text-sm font-medium text-amber-300">
            High traffic detected
          </p>
          <p className="mt-1 text-sm text-amber-400/80">
            Verification is estimated to take {formatWaitTime(estimatedWaitSeconds)}.
            Would you like to wait? You must keep this tab open.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleConfirmWait}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-amber-500"
            >
              Yes, wait
            </button>
            <button
              type="button"
              onClick={handleCancelWait}
              className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
            >
              Skip verification
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !!pendingVerification}
        className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : pendingVerification ? "Verifying..." : "Submit Steps"}
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

function formatWaitTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}