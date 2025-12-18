import { z } from "zod";

import { badRequest, forbidden, handleRouteError, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

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

const querySchema = z.object({
  league_id: z.string().uuid(),
  period: z.enum(["day", "week", "month", "custom"]),
  dates: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const dates = parseDates(parsed.dates);
    if (dates.length === 0) {
      return badRequest("At least one date must be supplied via the 'dates' query parameter");
    }

    const { supabase, user } = await requireUser(req);

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("league_id", parsed.league_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return forbidden("You are not a member of this league");
    }

    const { data, error } = await supabase.rpc("leaderboard_period", {
      _league_id: parsed.league_id,
      _dates: dates,
      _limit: parsed.limit,
      _offset: parsed.offset,
    });

    if (error) {
      throw error;
    }

    const entries: LeaderboardEntry[] = data ?? [];
    let totalMembers = entries[0]?.member_total ?? null;
    if (totalMembers === null) {
      totalMembers = await membershipCountFallback(supabase, parsed.league_id);
    }

    const teamTotalSteps = entries[0]?.team_total_steps ?? 0;

    const response = json({
      leaderboard: entries.map((entry) => ({
        rank: entry.rank,
        user_id: entry.user_id,
        display_name: entry.display_name,
        total_steps: entry.total_steps,
        total_km: entry.total_km,
        total_calories: entry.total_calories,
        partial_days: entry.partial_days,
        missed_days: entry.missed_days,
        verified_days: entry.verified_days,
        unverified_days: entry.unverified_days,
      })),
      meta: {
        total_members: totalMembers,
        team_total_steps: teamTotalSteps,
        limit: parsed.limit,
        offset: parsed.offset,
      },
    });

    const end = parsed.offset + (entries.length > 0 ? entries.length - 1 : 0);
    response.headers.set("Content-Range", `items ${parsed.offset}-${end}/${totalMembers}`);
    response.headers.set("X-Total-Count", String(totalMembers));

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Invalid query", { issues: error.issues });
    }
    return handleRouteError(error);
  }
}

function parseDates(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d{4}-\d{2}-\d{2}$/.test(part));
}

async function membershipCountFallback(supabase: SupabaseClient, leagueId: string): Promise<number> {
  const { count, error } = await supabase
    .from("memberships")
    .select("user_id", { count: "exact", head: true })
    .eq("league_id", leagueId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}