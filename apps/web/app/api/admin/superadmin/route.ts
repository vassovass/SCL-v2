import { NextRequest } from "next/server";
import { z } from "zod";

import { badRequest, forbidden, json, serverError } from "@/lib/server/http";
import { getServiceClient, requireUser } from "@/lib/server/supabase";

// GET /api/admin/superadmin - List all superadmins
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const supabase = getServiceClient();

    // Check if user is superadmin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_superadmin")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.is_superadmin) {
      return forbidden("Only superadmins can access this");
    }

    // Get all superadmins
    const { data: superadmins, error: listError } = await supabase
      .from("users")
      .select("id, display_name, is_superadmin, created_at")
      .eq("is_superadmin", true);

    if (listError) {
      return serverError(listError.message);
    }

    return json({ superadmins });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

const SetSuperadminSchema = z.object({
  user_id: z.string().uuid(),
  is_superadmin: z.boolean(),
});

// POST /api/admin/superadmin - Promote/demote a user
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const supabase = getServiceClient();

    // Check if user is superadmin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_superadmin")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.is_superadmin) {
      return forbidden("Only superadmins can modify superadmin status");
    }

    // Parse and validate request body
    const body = await req.json();
    const parsed = SetSuperadminSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.message);
    }

    const { user_id, is_superadmin } = parsed.data;

    // Prevent removing yourself as superadmin if you're the last one
    if (!is_superadmin && user_id === user.id) {
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_superadmin", true);

      if (count && count <= 1) {
        return badRequest("Cannot remove the last superadmin");
      }
    }

    // Update superadmin status using RPC
    const { error: updateError } = await supabase.rpc("set_superadmin", {
      target_user_id: user_id,
      make_superadmin: is_superadmin,
    });

    if (updateError) {
      return serverError(updateError.message);
    }

    return json({ success: true, user_id, is_superadmin });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}
