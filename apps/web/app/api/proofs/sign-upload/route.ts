import { z } from "zod";

import { badRequest, handleRouteError, json } from "@/lib/server/http";
import { getAdminClient, requireUser } from "@/lib/server/supabase";

const payloadSchema = z.object({
  content_type: z.string(),
});

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/heic": "heic",
};

const PROOFS_BUCKET = "proofs";

export async function POST(req: Request): Promise<Response> {
  try {
    const { user } = await requireUser(req);
    const body = await req.json();
    const input = payloadSchema.parse(body);

    const extension = ALLOWED_TYPES[input.content_type.toLowerCase()];
    if (!extension) {
      return badRequest("Unsupported content type", { supported: Object.keys(ALLOWED_TYPES) });
    }

    const fileKey = buildFileKey(user.id, extension);

    const { data, error } = await getAdminClient()
      .storage
      .from(PROOFS_BUCKET)
      .createSignedUploadUrl(fileKey, 60);

    if (error || !data) {
      throw error ?? new Error("Failed to create signed upload URL");
    }

    return json({
      upload_url: data.signedUrl,
      path: fileKey,
      token: data.token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Invalid payload", { issues: error.issues });
    }
    return handleRouteError(error);
  }
}

function buildFileKey(userId: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${userId}/${timestamp}-${random}.${extension}`;
}