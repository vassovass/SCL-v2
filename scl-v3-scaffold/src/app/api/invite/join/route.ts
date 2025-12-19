import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, serverError, notFound } from "@/lib/api";

const joinSchema = z.object({
  invite_code: z.string().min(4).max(10),
});

// POST /api/invite/join - Join a league via invite code
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = joinSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid invite code");
    }

    const { invite_code } = parsed.data;

    // Find league
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("id, name")
      .eq("invite_code", invite_code.toUpperCase())
      .single();

    if (leagueError || !league) {
      return notFound("Invalid invite code");
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("memberships")
      .select("league_id")
      .eq("league_id", league.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return badRequest("You are already a member of this league");
    }

    // Join league
    const { error: joinError } = await supabase.from("memberships").insert({
      league_id: league.id,
      user_id: user.id,
      role: "member",
    });

    if (joinError) {
      return serverError(joinError.message);
    }

    return json({
      league_id: league.id,
      league_name: league.name,
      message: "Successfully joined league",
    });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}
