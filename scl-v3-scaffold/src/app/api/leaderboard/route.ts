import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";

const querySchema = z.object({
  league_id: z.string().uuid(),
  period: z.enum(["day", "week", "month", "custom"]),
  dates: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  total_steps: number;
  total_km: number;
  total_calories: number;
  partial_days: number;
  missed_days: number;
  verified_days: number;
  unverified_days: number;
  member_total?: number;
  team_total_steps?: number;
}

// GET /api/leaderboard
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(rawParams);

    if (!parsed.success) {
      return badRequest("Invalid query parameters");
    }

    const { league_id, dates, limit, offset } = parsed.data;
    const dateList = parseDates(dates);

    if (dateList.length === 0) {
      return badRequest("At least one date is required");
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    // Check membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("league_id", league_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return forbidden("You are not a member of this league");
    }

    // Call RPC function
    const { data, error } = await supabase.rpc("leaderboard_period", {
      _league_id: league_id,
      _dates: dateList,
      _limit: limit,
      _offset: offset,
    });

    if (error) {
      return serverError(error.message);
    }

    const entries: LeaderboardEntry[] = data ?? [];

    return json({
      leaderboard: entries.map((entry) => ({
        rank: entry.rank,
        user_id: entry.user_id,
        display_name: entry.display_name,
        total_steps: entry.total_steps,
        total_km: entry.total_km,
        total_calories: entry.total_calories,
        verified_days: entry.verified_days,
        unverified_days: entry.unverified_days,
      })),
      meta: {
        total_members: entries[0]?.member_total ?? 0,
        team_total_steps: entries[0]?.team_total_steps ?? 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

function parseDates(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d{4}-\d{2}-\d{2}$/.test(part));
}
