import { z } from "zod";

import { handleRouteError, json, notFound } from "@/lib/server/http";
import { requireUser } from "@/lib/server/supabase";
import { formatDate, getStepWeekRange, getTodayUtc, type StepWeekStart } from "@/lib/time";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const params = paramsSchema.parse(await context.params);
    const { supabase } = await requireUser(req);

    const { data, error } = await supabase
      .from("leagues")
      .select("id, name, stepweek_start, invite_code, owner_id, created_at")
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return notFound("League not found");
    }

    const today = getTodayUtc();
    const stepRange = getStepWeekRange(today, data.stepweek_start as StepWeekStart);

    return json({
      league: {
        id: data.id,
        name: data.name,
        stepweek_start: data.stepweek_start,
        invite_code: data.invite_code,
        owner_id: data.owner_id,
        created_at: data.created_at,
      },
      current_window: {
        day: formatDate(today),
        stepweek: {
          start: formatDate(stepRange.start),
          end: formatDate(stepRange.end),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return notFound("Invalid league id");
    }
    return handleRouteError(error);
  }
}