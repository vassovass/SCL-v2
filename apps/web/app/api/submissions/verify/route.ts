import { z } from "zod";

import { badRequest, forbidden, handleRouteError, json, jsonError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { callVerificationFunction } from "@/lib/server/verify";

const verifySchema = z.object({
  submission_id: z.string().uuid(),
  league_id: z.string().uuid(),
  steps: z.number().int().positive(),
  for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  proof_path: z.string().min(3),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = verifySchema.parse(body);
    const { supabase, user, token } = await requireUser(req);

    // Verify user is a member of the league
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("league_id", input.league_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return forbidden("You are not a member of this league");
    }

    // Verify the submission belongs to this user
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, user_id, verified")
      .eq("id", input.submission_id)
      .eq("league_id", input.league_id)
      .maybeSingle();

    if (submissionError) {
      throw submissionError;
    }

    if (!submission) {
      return jsonError(404, "Submission not found");
    }

    if (submission.user_id !== user.id) {
      return forbidden("You can only verify your own submissions");
    }

    // Call verification function
    const verification = await callVerificationFunction({
      steps: input.steps,
      for_date: input.for_date,
      proof_path: input.proof_path,
      league_id: input.league_id,
      submission_id: input.submission_id,
      requester_id: user.id,
      token,
    });

    // If rate limited, return 429 with retry_after
    if (verification.status === 429) {
      const data = verification.data as { retry_after?: number };
      return json(
        { error: "rate_limited", retry_after: data?.retry_after ?? 10 },
        { status: 429 }
      );
    }

    if (!verification.ok) {
      return json(
        { error: "verification_failed", details: verification.data },
        { status: verification.status }
      );
    }

    // Fetch updated submission
    const { data: updatedSubmission } = await supabase
      .from("submissions")
      .select("id, verified, tolerance_used, extracted_km, extracted_calories, verification_notes")
      .eq("id", input.submission_id)
      .single();

    return json({
      verified: updatedSubmission?.verified ?? false,
      submission: updatedSubmission,
      verification: verification.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Invalid payload", { issues: error.issues });
    }
    return handleRouteError(error);
  }
}
