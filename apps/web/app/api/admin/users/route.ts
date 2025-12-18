import { NextRequest } from "next/server";

import { forbidden, json, serverError } from "@/lib/server/http";
import { getServiceClient, requireUser } from "@/lib/server/supabase";

// GET /api/admin/users - List all users (for superadmin to manage)
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
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

    // Get search query if provided
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    // Get all users with optional search
    let query = supabase
      .from("users")
      .select("id, display_name, is_superadmin, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (search) {
      query = query.ilike("display_name", `%${search}%`);
    }

    const { data: users, error: listError } = await query;

    if (listError) {
      return serverError(listError.message);
    }

    return json({ users });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}
