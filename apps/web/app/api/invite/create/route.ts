import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getAdminClient, requireUser } from "@/lib/server/supabase";

const createSchema = z.object({
  name: z.string().min(2).max(64),
  stepweek_start: z.enum(["mon", "sun"]),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = createSchema.parse(body);

    const { supabase, user } = await requireUser(req);

    const league = await createLeagueWithRetry(supabase, {
      name: input.name,
      stepweek_start: input.stepweek_start,
      owner_id: user.id,
    });

    const { error: membershipError } = await supabase
      .from("memberships")
      .upsert(
        {
          league_id: league.id,
          user_id: user.id,
          role: "owner",
        },
        { onConflict: "league_id,user_id" },
      );

    if (membershipError) {
      await cleanupLeague(league.id);
      throw membershipError;
    }

    return json({ league_id: league.id, invite_code: league.invite_code });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(400, "Invalid payload", { issues: error.issues });
    }

    return handleRouteError(error);
  }
}

async function createLeagueWithRetry(
  supabase: SupabaseClient,
  payload: { name: string; stepweek_start: "mon" | "sun"; owner_id: string },
) {
  let attempts = 0;
  let lastError: unknown;

  while (attempts < 5) {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from("leagues")
      .insert({ ...payload, invite_code: inviteCode })
      .select("id, invite_code")
      .single();

    if (!error && data) {
      return data;
    }

    if (error?.code !== "23505") {
      lastError = error;
      break;
    }

    attempts += 1;
    lastError = error;
  }

  throw lastError ?? new Error("Unable to create league");
}

async function cleanupLeague(leagueId: string) {
  try {
    await getAdminClient().from("leagues").delete().eq("id", leagueId);
  } catch (error) {
    console.error("Failed to cleanup league after membership error", { leagueId, error });
  }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    const index = Math.floor(Math.random() * chars.length);
    code += chars[index];
  }
  return code;
}