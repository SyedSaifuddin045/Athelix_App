import Constants from "expo-constants";

const extra = (
  typeof Constants.expoConfig?.extra === "object" && Constants.expoConfig?.extra !== null
    ? Constants.expoConfig.extra
    : {}
) as Record<string, string | undefined>;

export const DEFAULT_API_BASE_URL = "http://localhost:8000";

let runtimeApiBaseUrl = extra.apiBaseUrl ?? DEFAULT_API_BASE_URL;

export function getApiBaseUrl() {
  return runtimeApiBaseUrl.replace(/\/+$/, "");
}

export function setApiBaseUrl(nextUrl: string) {
  runtimeApiBaseUrl = nextUrl.replace(/\/+$/, "");
}

export function toApiUrl(input: RequestInfo | URL) {
  if (typeof input !== "string") return input;
  if (/^https?:\/\//i.test(input)) return input;
  const path = input.startsWith("/") ? input : `/${input}`;
  return `${getApiBaseUrl()}${path}`;
}

// Android emulator localhost points at the emulator itself.
// Use EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000 for Android local backend testing.
