import axios, { type AxiosError } from "axios";
import { z, type ZodType } from "zod";
import { env } from "../../env";
import { authResponseSchema, type AuthResponse } from "../../features/auth/schemas";
import { authStorage } from "./authStorage";
import { ApiError, type ApiFieldError } from "./error";
import { logApiError, logApiRequest, logApiResponse } from "./logger";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startedAt: number;
    };
    _retry?: boolean;
  }
}

type SessionRefreshListener = (session: AuthResponse) => Promise<void> | void;
type UnauthorizedListener = () => Promise<void> | void;

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse> | null = null;
let onSessionRefresh: SessionRefreshListener | null = null;
let onUnauthorized: UnauthorizedListener | null = null;

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export function setAccessToken(nextAccessToken: string | null): void {
  accessToken = nextAccessToken;
}

export function registerAuthLifecycleHandlers(handlers: {
  onSessionRefresh: SessionRefreshListener;
  onUnauthorized: UnauthorizedListener;
}): void {
  onSessionRefresh = handlers.onSessionRefresh;
  onUnauthorized = handlers.onUnauthorized;
}

export function parseWithSchema<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

function shouldAttemptRefresh(error: AxiosError): boolean {
  const status = error.response?.status;
  const url = error.config?.url ?? "";

  return (
    status === 401 &&
    !error.config?._retry &&
    !url.startsWith("/auth/login") &&
    !url.startsWith("/auth/register") &&
    !url.startsWith("/auth/refresh")
  );
}

function normalizeFieldErrors(fieldErrors: unknown): ApiFieldError[] {
  const schema = z.array(
    z.object({
      scope: z.string(),
      field: z.string(),
      message: z.string(),
      type: z.string(),
    }),
  );

  const parsed = schema.safeParse(fieldErrors);
  return parsed.success ? parsed.data : [];
}

function toApiError(error: AxiosError): ApiError {
  if (!error.response) {
    return new ApiError({
      message: "Network request failed",
      isNetworkError: true,
      detail: error.message,
    });
  }

  const data = error.response.data as Record<string, unknown> | undefined;

  return new ApiError({
    message: typeof data?.message === "string" ? data.message : error.message,
    statusCode: error.response.status,
    path: typeof data?.path === "string" ? data.path : error.config?.url,
    detail: data?.detail,
    fieldErrors: normalizeFieldErrors(data?.field_errors),
  });
}

async function refreshSessionInternal(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) {
        throw new ApiError({
          message: "No refresh token available",
          statusCode: 401,
        });
      }

      const response = await api.post("/auth/refresh", {
        refresh_token: refreshToken,
      });
      const session = authResponseSchema.parse(response.data);
      setAccessToken(session.access_token);
      await authStorage.setRefreshToken(session.refresh_token);
      await onSessionRefresh?.(session);
      return session;
    })();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

api.interceptors.request.use((config) => {
  config.metadata = {
    startedAt: Date.now(),
  };

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  logApiRequest(
    config.method,
    config.url,
    config.headers as Record<string, unknown>,
  );

  return config;
});

api.interceptors.response.use(
  (response) => {
    const durationMs =
      response.config.metadata?.startedAt !== undefined
        ? Date.now() - response.config.metadata.startedAt
        : undefined;

    logApiResponse(
      response.config.method,
      response.config.url,
      response.status,
      durationMs,
    );

    return response;
  },
  async (error: AxiosError) => {
    const durationMs =
      error.config?.metadata?.startedAt !== undefined
        ? Date.now() - error.config.metadata.startedAt
        : undefined;

    if (shouldAttemptRefresh(error) && error.config) {
      try {
        const session = await refreshSessionInternal();
        error.config._retry = true;
        error.config.headers = error.config.headers ?? {};
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return api.request(error.config);
      } catch (refreshError) {
        await onUnauthorized?.();

        const unauthorizedError =
          refreshError instanceof ApiError
            ? refreshError
            : new ApiError({
                message: "Session expired",
                statusCode: 401,
              });

        logApiError(
          error.config.method,
          error.config.url,
          unauthorizedError.statusCode,
          unauthorizedError.message,
          durationMs,
        );

        return Promise.reject(unauthorizedError);
      }
    }

    const apiError = toApiError(error);
    logApiError(
      error.config?.method,
      error.config?.url,
      apiError.statusCode,
      apiError.message,
      durationMs,
    );
    return Promise.reject(apiError);
  },
);
