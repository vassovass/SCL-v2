export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>): Response {
  return json({ error: message, ...extra }, { status });
}

export function notFound(message = "Not Found"): Response {
  return jsonError(404, message);
}

export function unauthorized(message = "Unauthorized"): Response {
  return jsonError(401, message);
}

export function forbidden(message = "Forbidden"): Response {
  return jsonError(403, message);
}

export function badRequest(message = "Bad Request", details?: Record<string, unknown>): Response {
  return jsonError(400, message, details);
}

export function serverError(message = "Internal Server Error"): Response {
  return jsonError(500, message);
}

export function handleRouteError(cause: unknown): Response {
  if (cause instanceof Response) {
    return cause;
  }

  if (cause instanceof Error && typeof (cause as { status?: number }).status === "number") {
    const status = (cause as { status: number }).status;
    return jsonError(status, cause.message);
  }

  console.error("Unhandled route error", cause);
  return errorResponse();
}

function errorResponse(): Response {
  return jsonError(500, "Internal Server Error");
}