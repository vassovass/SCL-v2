import { getSupabaseFunctionUrl, serverEnv } from "@/lib/server/env";

export type VerificationPayload = {
  steps: number;
  for_date: string;
  proof_path: string;
  requester_id: string;
  league_id?: string;
  submission_id?: string;
  token?: string | null;
};

export type VerificationResult = {
  status: number;
  ok: boolean;
  data: unknown;
};

export async function callVerificationFunction(payload: VerificationPayload): Promise<VerificationResult> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), serverEnv.verifyTimeoutMs);

  try {
    const response = await fetch(getSupabaseFunctionUrl(serverEnv.verifyFunctionName), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serverEnv.supabaseServiceRoleKey}`,
        ...(payload.token ? { "X-Client-Authorization": `Bearer ${payload.token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });

    const data = await safeJson(response);
    return { status: response.status, ok: response.ok, data };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { status: 504, ok: false, data: { error: "verification_timeout" } };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}