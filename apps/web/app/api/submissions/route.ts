import { z } from "zod";

import { badRequest, forbidden, handleRouteError, json, jsonError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { callVerificationFunction } from "@/lib/server/verify";
import type { SupabaseClient } from "@supabase/supabase-js";

const createSchema = z.object({
  league_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().int().positive(),
  partial: z.boolean().optional().default(false),
  proof_path: z.string().min(3),
});

const querySchema = z.object({
  league_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const submissionSelect = "id, league_id, user_id, for_date, steps, partial, proof_path, verified, tolerance_used, extracted_km, extracted_calories, verification_notes, created_at";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = createSchema.parse(body);
    const { supabase, user, token } = await requireUser(req);

    const membership = await ensureMembership(supabase, input.league_id, user.id);
    if (!membership) {
      return forbidden("You are not a member of this league");
    }

    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        league_id: input.league_id,
        user_id: user.id,
        for_date: input.date,
        steps: input.steps,
        partial: input.partial ?? false,
        proof_path: input.proof_path,
      })
      .select(submissionSelect)
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError(409, "Submission already exists for this date");
      }
      throw error;
    }

    const verification = await callVerificationFunction({
      steps: input.steps,
      for_date: input.date,
      proof_path: input.proof_path,
      league_id: input.league_id,
      submission_id: submission.id,
      requester_id: user.id,
      token,
    }).catch((err) => ({ status: 500, ok: false, data: { error: "verification_failed", message: String(err) } }));

    const refreshed = await supabase
      .from("submissions")
      .select(submissionSelect)
      .eq("id", submission.id)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      submission: refreshed.data ?? submission,
    };

    if (verification.ok) {
      payload.verification = verification.data;
    } else {
      payload.verification_error = verification.data;
    }

    const status = verification.ok ? 201 : 202;
    return json(payload, { status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Invalid payload", { issues: error.issues });
    }
    return handleRouteError(error);
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const { supabase, user } = await requireUser(req);

    const membership = await ensureMembership(supabase, parsed.league_id, user.id);
    if (!membership) {
      return forbidden("You are not a member of this league");
    }

    const rangeStart = parsed.offset;
    const rangeEnd = parsed.offset + parsed.limit - 1;

    let query = supabase
      .from("submissions")
      .select(submissionSelect, { count: "exact" })
      .eq("league_id", parsed.league_id)
      .order("for_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (parsed.user_id) {
      query = query.eq("user_id", parsed.user_id);
    }
    if (parsed.from) {
      query = query.gte("for_date", parsed.from);
    }
    if (parsed.to) {
      query = query.lte("for_date", parsed.to);
    }

    const { data, error, count } = await query.range(rangeStart, rangeEnd);

    if (error) {
      throw error;
    }

    const total = count ?? 0;
    const end = data ? rangeStart + data.length - 1 : rangeStart;

    const response = json({ submissions: data ?? [], total });
    response.headers.set("Content-Range", `items ${rangeStart}-${end}/${total}`);
    response.headers.set("X-Total-Count", String(total));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Invalid query", { issues: error.issues });
    }
    return handleRouteError(error);
  }
}

async function ensureMembership(supabase: SupabaseClient, leagueId: string, userId: string) {
  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("league_id", leagueId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}