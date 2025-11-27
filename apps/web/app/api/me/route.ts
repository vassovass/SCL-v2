import { z } from "zod";

import { badRequest, handleRouteError, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";

const updateSchema = z.object({
  display_name: z.string().min(2).max(64).optional(),
  units: z.enum(["metric", "imperial"]).optional(),
});

const selectFields = "id, display_name, units, created_at";

export async function GET(req: Request): Promise<Response> {
  try {
    const { supabase, user } = await requireUser(req);

    const { data, error } = await supabase
      .from("users")
      .select(selectFields)
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return json({
      user: {
        id: user.id,
        email: user.email,
        ...data,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = updateSchema.parse(body);

    const { supabase, user } = await requireUser(req);

    if (!input.display_name && !input.units) {
      return badRequest("No fields provided for update");
    }

    const { data, error } = await supabase
      .from("users")
      .update(input)
      .eq("id", user.id)
      .select(selectFields)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return json({ user: { id: user.id, email: user.email, ...data } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Invalid payload", { issues: error.issues });
    }
    return handleRouteError(error);
  }
}