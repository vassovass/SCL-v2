import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = assertEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = assertEnv("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = assertEnv("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = assertEnv("GEMINI_API_KEY");
const PROOFS_BUCKET = Deno.env.get("PROOFS_BUCKET") ?? "proofs";

// Default values (will be overridden by DB settings)
const DEFAULT_MODEL_NAME = Deno.env.get("GEMINI_MODEL") ?? "models/gemini-2.5-flash";
const DEFAULT_VERIFY_PER_MINUTE = parsePositiveInt(Deno.env.get("VERIFY_LIMIT_PER_MINUTE"), 6);
const DEFAULT_VERIFY_PER_HOUR = parsePositiveInt(Deno.env.get("VERIFY_LIMIT_PER_HOUR"), 60);
const DEFAULT_VERIFY_GLOBAL_PER_MINUTE = parsePositiveInt(Deno.env.get("VERIFY_LIMIT_PER_MINUTE_GLOBAL"), 30);
const DEFAULT_VERIFY_GLOBAL_PER_HOUR = parsePositiveInt(Deno.env.get("VERIFY_LIMIT_PER_HOUR_GLOBAL"), 240);

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const rateStore = new Map<string, RateState>();

// Cache for site settings (refreshed every 60 seconds)
let settingsCache: Record<string, string> = {};
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 60_000; // 60 seconds

async function getSettings(): Promise<{
  modelName: string;
  verifyPerMinute: number;
  verifyPerHour: number;
  verifyGlobalPerMinute: number;
  verifyGlobalPerHour: number;
}> {
  const now = Date.now();

  // Refresh cache if expired
  if (now - settingsCacheTime > SETTINGS_CACHE_TTL) {
    try {
      const { data, error } = await serviceClient
        .from("site_settings")
        .select("key, value");

      if (!error && data) {
        settingsCache = {};
        for (const row of data) {
          settingsCache[row.key] = row.value;
        }
        settingsCacheTime = now;
      }
    } catch (e) {
      console.error("Failed to fetch settings from DB:", e);
      // Continue with cached/default values
    }
  }

  return {
    modelName: settingsCache["gemini_model"] ?? DEFAULT_MODEL_NAME,
    verifyPerMinute: parsePositiveInt(settingsCache["verify_per_minute"], DEFAULT_VERIFY_PER_MINUTE),
    verifyPerHour: parsePositiveInt(settingsCache["verify_per_hour"], DEFAULT_VERIFY_PER_HOUR),
    verifyGlobalPerMinute: parsePositiveInt(settingsCache["verify_global_per_minute"], DEFAULT_VERIFY_GLOBAL_PER_MINUTE),
    verifyGlobalPerHour: parsePositiveInt(settingsCache["verify_global_per_hour"], DEFAULT_VERIFY_GLOBAL_PER_HOUR),
  };
}

interface VerifyPayload {
  steps: number;
  for_date: string;
  proof_path: string;
  league_id?: string;
  submission_id?: string;
  requester_id?: string;
}

interface GeminiExtraction {
  steps?: number;
  km?: number;
  calories?: number;
  date?: string;
}

type GeminiResult = GeminiExtraction & { rawText: string };

interface RateState {
  minute: WindowCounter;
  hour: WindowCounter;
}

interface WindowCounter {
  count: number;
  resetAt: number;
}

class RateLimitError extends Error {
  constructor(message: string, readonly retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const requestId = crypto.randomUUID();
  const start = performance.now();

  try {
    // Fetch dynamic settings from DB (with caching)
    const settings = await getSettings();

    const payload = await parsePayload(req);
    const authContext = await getAuthContext(req);
    const actorId = payload.requester_id ?? authContext?.userId ?? "system";

    enforceRateLimit(actorId, settings.verifyPerMinute, settings.verifyPerHour);
    enforceRateLimit("__global__", settings.verifyGlobalPerMinute, settings.verifyGlobalPerHour);

    const proof = await fetchProof(payload.proof_path);

    const extraction = await callGemini({
      stepsClaimed: payload.steps,
      forDate: payload.for_date,
      base64: proof.base64,
      mimeType: proof.contentType,
      requestId,
      modelName: settings.modelName,
    });

    const evaluation = evaluateVerdict({
      claimedSteps: payload.steps,
      claimedDate: payload.for_date,
      extraction,
    });

    let persistence: PersistenceResult | null = null;

    if (payload.submission_id) {
      persistence = await persistVerification({
        submissionId: payload.submission_id,
        leagueId: payload.league_id,
        evaluation,
        extraction,
      });
    }

    await logAudit({
      actorId,
      leagueId: payload.league_id ?? persistence?.leagueId ?? null,
      submissionId: payload.submission_id ?? persistence?.submissionId ?? null,
      evaluation,
      extraction,
      requestId,
    });

    const elapsed = Math.round(performance.now() - start);

    console.log(
      JSON.stringify({
        severity: "INFO",
        event: "verification.complete",
        requestId,
        actorId,
        submissionId: payload.submission_id ?? null,
        leagueId: payload.league_id ?? null,
        elapsedMs: elapsed,
        verified: evaluation.verified,
        toleranceUsed: evaluation.tolerance,
        difference: evaluation.difference,
        source: "gemini",
      }),
    );

    return jsonResponse(
      {
        request_id: requestId,
        verified: evaluation.verified,
        tolerance_used: evaluation.tolerance,
        difference: evaluation.difference,
        extracted_steps: extraction.steps ?? null,
        extracted_km: evaluation.extractedKm,
        extracted_calories: evaluation.extractedCalories,
        extracted_date: extraction.date ?? null,
        notes: evaluation.notes,
        persisted: persistence?.updated ?? false,
      },
      200,
    );
  } catch (error) {
    const elapsed = Math.round(performance.now() - start);
    const status = error instanceof RateLimitError ? 429 : error.status ?? 500;

    console.error(
      JSON.stringify({
        severity: "ERROR",
        event: "verification.failed",
        requestId,
        message: error.message ?? "unknown error",
        stack: error.stack,
        elapsedMs: elapsed,
        status,
      }),
    );

    const body =
      status === 429
        ? { error: "rate_limited", retry_after: error.retryAfter }
        : { error: "verification_failed", message: error.message ?? "Unexpected error" };

    return jsonResponse(body, status);
  }
});

async function parsePayload(req: Request): Promise<VerifyPayload> {
  let json: Record<string, unknown>;
  try {
    json = await req.json();
  } catch (error) {
    throw new Error("Invalid JSON payload", { cause: error });
  }

  const steps = parseNumber(json["steps"]);
  const forDate = parseDateString(json["for_date"]);
  const proofPath = parseString(json["proof_path"]);

  const payload: VerifyPayload = {
    steps,
    for_date: forDate,
    proof_path: proofPath,
  };

  if (typeof json["submission_id"] === "string" && json["submission_id"].length > 0) {
    payload.submission_id = json["submission_id"];
  }

  if (typeof json["league_id"] === "string" && json["league_id"].length > 0) {
    payload.league_id = json["league_id"];
  }

  if (typeof json["requester_id"] === "string" && json["requester_id"].length > 0) {
    payload.requester_id = json["requester_id"];
  }

  return payload;
}

async function getAuthContext(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return { userId: data.user.id };
}

function enforceRateLimit(key: string, perMinute: number, perHour: number) {
  const now = Date.now();
  const state = rateStore.get(key) ?? {
    minute: { count: 0, resetAt: now + 60_000 },
    hour: { count: 0, resetAt: now + 3_600_000 },
  };

  const minute = bumpWindow(state.minute, now, perMinute, 60_000);
  const hour = bumpWindow(state.hour, now, perHour, 3_600_000);

  rateStore.set(key, state);

  if (!minute.allowed) {
    throw new RateLimitError("Per-minute verification budget exceeded", Math.ceil((state.minute.resetAt - now) / 1000));
  }

  if (!hour.allowed) {
    throw new RateLimitError("Hourly verification budget exceeded", Math.ceil((state.hour.resetAt - now) / 1000));
  }
}

function bumpWindow(window: WindowCounter, now: number, limit: number, interval: number): { allowed: boolean } {
  if (limit <= 0) {
    return { allowed: true };
  }

  if (now >= window.resetAt) {
    window.count = 0;
    window.resetAt = now + interval;
  }

  window.count += 1;

  return { allowed: window.count <= limit };
}

async function fetchProof(path: string): Promise<{ base64: string; contentType: string }> {
  const { data, error } = await serviceClient.storage.from(PROOFS_BUCKET).download(path);
  if (error || !data) {
    throw new Error(`Unable to download proof for path ${path}`);
  }

  const base64 = await blobToBase64(data);
  const contentType = data.type || guessMimeType(path);

  return { base64, contentType };
}

async function callGemini({ stepsClaimed, forDate, base64, mimeType, requestId, modelName }:{ stepsClaimed: number; forDate: string; base64: string; mimeType: string; requestId: string; modelName: string; }): Promise<GeminiResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `The user states they walked ${stepsClaimed} steps on ${forDate}. From the attached screenshot, extract the actual steps, distance in kilometers, calories, and the date displayed. Respond strictly as JSON with keys steps, km, calories, date.`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64,
              mimeType,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${text}`);
  }

  const result = await response.json();
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const extraction = parseGeminiText(rawText);

  console.log(
    JSON.stringify({
      severity: "DEBUG",
      event: "verification.gemini_response",
      requestId,
      rawText,
      extraction,
    }),
  );

  return { rawText, ...extraction };
}

function parseGeminiText(rawText: string): GeminiExtraction {
  if (!rawText) {
    return {} as GeminiExtraction;
  }

  const trimmed = rawText.trim();
  const jsonText = extractJson(trimmed);

  try {
    const parsed = JSON.parse(jsonText);
    return {
      steps: typeof parsed.steps === "number" ? parsed.steps : undefined,
      km: typeof parsed.km === "number" ? parsed.km : undefined,
      calories: typeof parsed.calories === "number" ? parsed.calories : undefined,
      date: typeof parsed.date === "string" ? parsed.date : undefined,
    };
  } catch (_error) {
    return {} as GeminiExtraction;
  }
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

interface EvaluationContext {
  claimedSteps: number;
  claimedDate: string;
  extraction: GeminiExtraction;
}

interface EvaluationResult {
  verified: boolean;
  tolerance: number;
  difference: number | null;
  notes: string;
  extractedKm: number | null;
  extractedCalories: number | null;
}

function evaluateVerdict({ claimedSteps, claimedDate, extraction }: EvaluationContext): EvaluationResult {
  const tolerance = Math.max(Math.round(claimedSteps * 0.03), 300);
  const extractedSteps = extraction.steps ?? null;
  const difference = extractedSteps != null ? Math.abs(extractedSteps - claimedSteps) : null;
  const verified = extractedSteps != null && difference !== null && difference <= tolerance;

  const notes: string[] = [];
  if (extractedSteps == null) {
    notes.push("Gemini did not return a step count.");
  }
  if (extraction.date && extraction.date !== claimedDate) {
    notes.push(`Screenshot date ${extraction.date} differs from claimed date ${claimedDate}.`);
  }
  if (!verified && extractedSteps != null && difference !== null) {
    notes.push(`Difference of ${difference} steps exceeds tolerance of ${tolerance}.`);
  }

  return {
    verified,
    tolerance,
    difference,
    notes: notes.length > 0 ? notes.join(" ") : (verified ? "Verification succeeded." : "Verification failed without details."),
    extractedKm: extraction.km ?? null,
    extractedCalories: extraction.calories ?? null,
  };
}

interface PersistenceResult {
  updated: boolean;
  submissionId: string;
  leagueId: string | null;
}

async function persistVerification({ submissionId, leagueId, evaluation, extraction }: { submissionId: string; leagueId?: string; evaluation: EvaluationResult; extraction: GeminiExtraction; }): Promise<PersistenceResult> {
  const { data: submission, error } = await serviceClient
    .from("submissions")
    .select("id, league_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load submission ${submissionId}: ${error.message}`);
  }

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  const targetLeague = leagueId ?? submission.league_id ?? null;

  const { error: updateError } = await serviceClient
    .from("submissions")
    .update({
      verified: evaluation.verified,
      tolerance_used: evaluation.tolerance,
      extracted_km: evaluation.extractedKm,
      extracted_calories: evaluation.extractedCalories,
      verification_notes: buildVerificationNotes(evaluation, extraction),
    })
    .eq("id", submissionId);

  if (updateError) {
    throw new Error(`Failed to persist verification outcome: ${updateError.message}`);
  }

  return {
    updated: true,
    submissionId,
    leagueId: targetLeague,
  };
}

async function logAudit({ actorId, leagueId, submissionId, evaluation, extraction, requestId }: { actorId: string; leagueId: string | null; submissionId: string | null; evaluation: EvaluationResult; extraction: GeminiExtraction; requestId: string; }) {
  const details = {
    request_id: requestId,
    league_id: leagueId,
    submission_id: submissionId,
    verified: evaluation.verified,
    tolerance_used: evaluation.tolerance,
    difference: evaluation.difference,
    notes: evaluation.notes,
    extracted: {
      steps: extraction.steps ?? null,
      km: extraction.km ?? null,
      calories: extraction.calories ?? null,
      date: extraction.date ?? null,
    },
  };

  const { error } = await serviceClient.from("audit_log").insert({
    actor_id: actorId,
    action: "verification.auto",
    target_id: submissionId,
    details,
  });

  if (error) {
    console.error(
      JSON.stringify({
        severity: "ERROR",
        event: "audit.insert_failed",
        requestId,
        message: error.message,
      }),
    );
  }
}

function buildVerificationNotes(evaluation: EvaluationResult, extraction: GeminiExtraction): string {
  const parts = [evaluation.notes];
  if (extraction.steps != null) {
    parts.push(`Model steps: ${extraction.steps}`);
  }
  if (extraction.date) {
    parts.push(`Model date: ${extraction.date}`);
  }
  return parts.join(" ");
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function guessMimeType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".heic")) return "image/heic";
  return "application/octet-stream";
}

function parseNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error("`steps` must be a positive number");
  }
  return Math.floor(value);
}

function parseDateString(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("`for_date` must be a YYYY-MM-DD string");
  }
  return value;
}

function parseString(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("`proof_path` must be a non-empty string");
  }
  return value;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num) || num < 0) return fallback;
  return num;
}

function assertEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}