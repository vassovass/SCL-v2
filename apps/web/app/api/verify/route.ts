import { z } from "zod";

import { badRequest, forbidden, handleRouteError, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { callVerificationFunction } from "@/lib/server/verify";

const requestSchema = z.object({
  steps: z.number().int().positive(),
  for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  proof_path: z.string().min(3),
  league_id: z.string().uuid().optional(),
  submission_id: z.string().uuid().optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = requestSchema.parse(body);

    const { supabase, user, token } = await requireUser(req);

    if (input.league_id) {
      const { data } = await supabase
        .from("memberships")
        .select("role")
        .eq("league_id", input.league_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        return forbidden("You are not a member of this league");
      }
    }

    const result = await callVerificationFunction({
      steps: input.steps,
      for_date: input.for_date,
      proof_path: input.proof_path,
      league_id: input.league_id,
      submission_id: input.submission_id,
      requester_id: user.id,
      token,
    });

    return json(result.data ?? { ok: result.ok }, { status: result.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Invalid payload", { issues: error.issues });
    }
    return handleRouteError(error);
  }
}