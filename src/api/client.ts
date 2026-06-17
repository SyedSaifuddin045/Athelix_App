import { getApiBaseUrl, toApiUrl } from "./config";

export type FieldError = {
  field?: string;
  message: string;
  scope?: string;
  type?: string;
};

export class ApiError extends Error {
  status?: number;
  info?: unknown;
  fieldErrors: FieldError[];

  constructor(message: string, status?: number, info?: unknown, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.info = info;
    this.fieldErrors = fieldErrors;
  }
}

type RetryInit = RequestInit & { __didRetry?: boolean };

const globalScope = globalThis as typeof globalThis & { __athelixOriginalFetch?: typeof globalThis.fetch };
const originalFetch = globalScope.__athelixOriginalFetch ?? globalThis.fetch.bind(globalThis);
globalScope.__athelixOriginalFetch = originalFetch;
let installed = false;

let clerkSessionToken: string | null = null;
let tokenResolve: ((token: string | null) => void) | null = null;
let tokenPromise: Promise<string | null> | null = null;

export function updateClerkToken(token: string | null) {
  clerkSessionToken = token;
  if (tokenResolve) {
    tokenResolve(token);
    tokenPromise = null;
    tokenResolve = null;
  }
}

async function ensureToken(): Promise<string | null> {
  if (clerkSessionToken !== null) return clerkSessionToken;
  if (tokenPromise) return tokenPromise;
  tokenPromise = new Promise((resolve) => {
    tokenResolve = resolve;
  });
  setTimeout(() => {
    if (tokenResolve) {
      tokenResolve(null);
      tokenPromise = null;
      tokenResolve = null;
    }
  }, 6000);
  return tokenPromise;
}

export function getTokenWithTimeout(
  getTokenFn: () => Promise<string | null>,
  timeoutMs = 8000,
): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    getTokenFn()
      .then((token) => { clearTimeout(timer); resolve(token); })
      .catch(() => { clearTimeout(timer); resolve(null); });
  });
}

let refreshTokenHandler: (() => Promise<string | null>) | null = null;

export function setRefreshTokenHandler(handler: (() => Promise<string | null>) | null) {
  refreshTokenHandler = handler;
}

function isPublicPath(url: string) {
  const path = url.replace(getApiBaseUrl(), "");
  return (
    path.startsWith("/meta/app-config") ||
    path.startsWith("/health") ||
    path === "/" ||
    path.startsWith("/auth/webhook") ||
    path.startsWith("/db-")
  );
}

async function parseErrorBody(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractFieldErrorMessages(detail: unknown): string[] {
  if (!Array.isArray(detail)) return [];
  return detail
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const loc = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
      const msg = typeof item.msg === "string" ? item.msg : "";
      return loc ? `${loc}: ${msg}` : msg;
    })
    .filter(Boolean);
}

function normalizeError(body: unknown, status: number) {
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const fieldErrors = Array.isArray(payload.field_errors)
    ? payload.field_errors
        .filter((item): item is FieldError => !!item && typeof item === "object" && "message" in item)
        .map((item) => ({
          ...item,
          message: String((item as FieldError).message),
        }))
    : [];
  const validationMessages = fieldErrors.length
    ? fieldErrors.map((item) => (item.field ? `${item.field}: ${item.message}` : item.message))
    : extractFieldErrorMessages(payload.detail);
  const message =
    validationMessages.length > 0
      ? validationMessages.join("; ")
      : typeof payload.message === "string"
        ? payload.message
        : typeof payload.detail === "string"
          ? payload.detail
          : status === 401
            ? "Your session has expired."
            : "Something went wrong.";
  return new ApiError(message, status, body, fieldErrors);
}

function mergeHeaders(input?: HeadersInit) {
  const headers = new Headers(input);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return headers;
}

export async function apiFetch(input: RequestInfo | URL, init?: RetryInit): Promise<Response> {
  const url = toApiUrl(input);
  const urlString = typeof url === "string" ? url : url.toString();
  const headers = mergeHeaders(init?.headers);

  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!isPublicPath(urlString)) {
    const token = clerkSessionToken ?? (await ensureToken());
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await originalFetch(url, { ...init, headers });

  if (response.status === 401 && !init?.__didRetry && !isPublicPath(urlString)) {
    if (refreshTokenHandler) {
      const newToken = await refreshTokenHandler();
      if (newToken) {
        updateClerkToken(newToken);
        return apiFetch(input, { ...init, __didRetry: true });
      }
    }
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw normalizeError(body, response.status);
  }

  return response;
}

export async function apiMutator<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(url, options);
  const body = [204, 205, 304].includes(response.status) ? null : await response.text();
  const data = body ? JSON.parse(body) : undefined;
  return { data, status: response.status, headers: response.headers } as T;
}

export function installApiFetchInterceptor() {
  if (installed) return;
  installed = true;
  globalThis.fetch = apiFetch as typeof globalThis.fetch;
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function getFieldError(error: unknown, field: string) {
  if (!(error instanceof ApiError)) return undefined;
  return error.fieldErrors.find((item) => item.field === field)?.message;
}
