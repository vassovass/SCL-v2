import { z } from "zod";

import { forbidden, handleRouteError, json, notFound } from "@/lib/server/http";
import { getAdminClient, requireUser } from "@/lib/server/supabase";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const params = paramsSchema.parse(await context.params);
    const { supabase, user } = await requireUser(req);

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("league_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return forbidden("You are not a member of this league");
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("memberships")
      .select("user_id, role, joined_at, users(id, display_name, units, created_at)")
      .eq("league_id", params.id)
      .order("joined_at", { ascending: true });

    if (error) {
      throw error;
    }

    if (!data) {
      return json({ members: [] });
    }

    const members = data.map((row) => ({
      user_id: row.user_id,
      role: row.role,
      joined_at: row.joined_at,
      display_name: row.users?.display_name ?? null,
      units: row.users?.units ?? null,
      user_created_at: row.users?.created_at ?? null,
    }));

    return json({ members });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return notFound("Invalid league id");
    }
    return handleRouteError(error);
  }
}