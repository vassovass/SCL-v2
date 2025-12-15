import { NextRequest } from "next/server";
import { z } from "zod";

import { badRequest, forbidden, json, serverError } from "@/lib/server/http";
import { getServiceClient, requireUser } from "@/lib/server/supabase";

// GET /api/admin/settings - Get all site settings
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
      return forbidden("Only superadmins can access settings");
    }

    // Get all settings
    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("key, value, description, updated_at, updated_by");

    if (settingsError) {
      return serverError(settingsError.message);
    }

    return json({ settings });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

const UpdateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

// PATCH /api/admin/settings - Update a site setting
export async function PATCH(req: NextRequest) {
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
      return forbidden("Only superadmins can modify settings");
    }

    // Parse and validate request body
    const body = await req.json();
    const parsed = UpdateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.message);
    }

    const { key, value } = parsed.data;

    // Update the setting using RPC function
    const { error: updateError } = await supabase.rpc("update_site_setting", {
      setting_key: key,
      setting_value: value,
    });

    if (updateError) {
      return serverError(updateError.message);
    }

    return json({ success: true, key, value });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}
