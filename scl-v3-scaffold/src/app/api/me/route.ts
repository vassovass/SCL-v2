import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, serverError } from "@/lib/api";

const updateSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  units: z.enum(["metric", "imperial"]).optional(),
});

// GET /api/me - Get current user profile
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("id, display_name, units, is_superadmin, created_at")
      .eq("id", user.id)
      .single();

    if (error) {
      return serverError(error.message);
    }

    return json({
      user: {
        ...profile,
        email: user.email,
      },
    });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

// PATCH /api/me - Update current user profile
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.message);
    }

    const updates: Record<string, string> = {};
    if (parsed.data.display_name) updates.display_name = parsed.data.display_name;
    if (parsed.data.units) updates.units = parsed.data.units;

    if (Object.keys(updates).length === 0) {
      return badRequest("No fields to update");
    }

    const { data: profile, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return serverError(error.message);
    }

    return json({ user: profile });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}
