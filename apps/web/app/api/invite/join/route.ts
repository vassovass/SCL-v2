import { z } from "zod";

import { handleRouteError, json, jsonError, notFound } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";

const joinSchema = z.object({
  invite_code: z.string().min(6).max(64),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = joinSchema.parse(body);
    const code = input.invite_code.trim().toUpperCase();

    const { supabase, user } = await requireUser(req);

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("id, invite_code")
      .eq("invite_code", code)
      .maybeSingle();

    if (leagueError) {
      throw leagueError;
    }

    if (!league) {
      return notFound("Invite code not found");
    }

    const { error: membershipError } = await supabase
      .from("memberships")
      .upsert(
        {
          league_id: league.id,
          user_id: user.id,
          role: "member",
        },
        { onConflict: "league_id,user_id" },
      );

    if (membershipError) {
      throw membershipError;
    }

    return json({ league_id: league.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(400, "Invalid payload", { issues: error.issues });
    }

    return handleRouteError(error);
  }
}