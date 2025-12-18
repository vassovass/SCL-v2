// API response helpers for route handlers

export function json<T>(data: T, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

export function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>
): Response {
  return json({ error: message, ...extra }, { status });
}

export function badRequest(message = "Bad Request"): Response {
  return jsonError(400, message);
}

export function unauthorized(message = "Unauthorized"): Response {
  return jsonError(401, message);
}

export function forbidden(message = "Forbidden"): Response {
  return jsonError(403, message);
}

export function notFound(message = "Not Found"): Response {
  return jsonError(404, message);
}

export function serverError(message = "Internal Server Error"): Response {
  return jsonError(500, message);
}
