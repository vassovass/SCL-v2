import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, serverError } from "@/lib/api";

const createLeagueSchema = z.object({
  name: z.string().min(1).max(100),
  stepweek_start: z.enum(["monday", "sunday"]).default("monday"),
});

// GET /api/leagues - List user's leagues
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const { data, error } = await supabase
      .from("memberships")
      .select("role, leagues(id, name, stepweek_start, invite_code, created_at)")
      .eq("user_id", user.id);

    if (error) {
      return serverError(error.message);
    }

    const leagues = (data || []).map((m) => ({
      ...(m.leagues as object),
      role: m.role,
    }));

    return json({ leagues });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

// POST /api/leagues - Create a new league
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = createLeagueSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.message);
    }

    const { name, stepweek_start } = parsed.data;

    // Generate invite code
    const invite_code = generateInviteCode();

    // Create league
    const { data: league, error: createError } = await supabase
      .from("leagues")
      .insert({
        name,
        stepweek_start,
        invite_code,
        owner_id: user.id,
      })
      .select()
      .single();

    if (createError) {
      return serverError(createError.message);
    }

    // Add creator as owner
    await supabase.from("memberships").insert({
      league_id: league.id,
      user_id: user.id,
      role: "owner",
    });

    return json({ league }, { status: 201 });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
