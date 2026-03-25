function sanitizeHeaders(
  headers?: Record<string, unknown>,
): Record<string, unknown> {
  if (!headers) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      if (key.toLowerCase() === "authorization") {
        return [key, "<redacted>"];
      }

      return [key, value];
    }),
  );
}

export function logApiRequest(
  method: string | undefined,
  url: string | undefined,
  headers?: Record<string, unknown>,
): void {
  if (!__DEV__) {
    return;
  }

  console.log("[api:request]", {
    method: method?.toUpperCase(),
    url,
    headers: sanitizeHeaders(headers),
  });
}

export function logApiResponse(
  method: string | undefined,
  url: string | undefined,
  status: number | undefined,
  durationMs: number | undefined,
): void {
  if (!__DEV__) {
    return;
  }

  console.log("[api:response]", {
    method: method?.toUpperCase(),
    url,
    status,
    durationMs,
  });
}

export function logApiError(
  method: string | undefined,
  url: string | undefined,
  status: number | undefined,
  message: string,
  durationMs: number | undefined,
): void {
  if (!__DEV__) {
    return;
  }

  console.warn("[api:error]", {
    method: method?.toUpperCase(),
    url,
    status,
    message,
    durationMs,
  });
}
