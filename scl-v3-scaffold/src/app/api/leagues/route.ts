import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, serverError } from "@/lib/api";
import type { Insertable } from "@/types/database";

const createLeagueSchema = z.object({
  name: z.string().min(1).max(100),
  stepweek_start: z.enum(["monday", "sunday"]).default("monday"),
});

// Type for membership with joined league data
type MembershipWithLeague = {
  role: string;
  leagues: {
    id: string;
    name: string;
    stepweek_start: string;
    invite_code: string;
    created_at: string;
  } | null;
};

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

    const rows = (data || []) as MembershipWithLeague[];
    const leagues = rows
      .filter((m) => m.leagues !== null)
      .map((m) => ({
        ...m.leagues!,
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
    const ownerMembership: Insertable<"memberships"> = {
      league_id: league.id,
      user_id: user.id,
      role: "owner",
    };
    // @ts-expect-error - Supabase types mismatch with custom Database type
    await supabase.from("memberships").insert(ownerMembership);

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
