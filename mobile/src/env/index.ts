import Constants from "expo-constants";

interface EnvConfig {
  apiBaseUrl: string;
  posthogApiKey: string;
  posthogHost: string;
  enableAnalyticsInDev: boolean;
  isAnalyticsEnabled: boolean;
}

function getEnvVar(key: keyof EnvConfig): string {
  // Try Constants.expoConfig first (for production builds)
  const fromExtra = Constants.expoConfig?.extra?.[key] as string | undefined;
  if (fromExtra) return fromExtra;
  
  // Fallback to process.env for development
  const envKey = `EXPO_PUBLIC_${key.toUpperCase()}`;
  return (process.env as Record<string, string | undefined>)[envKey] ?? "";
}

function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key as keyof EnvConfig);
  if (value === "true") return true;
  if (value === "false" || value === "") return defaultValue;
  return defaultValue;
}

export const env: EnvConfig = {
  apiBaseUrl: getEnvVar("apiBaseUrl") || "http://localhost:8000",
  posthogApiKey: getEnvVar("posthogApiKey"),
  posthogHost: getEnvVar("posthogHost") || "https://eu.i.posthog.com",
  enableAnalyticsInDev: getBooleanEnvVar("enableAnalyticsInDev", false),
  get isAnalyticsEnabled(): boolean {
    const isDev = __DEV__;
    if (isDev) {
      return this.enableAnalyticsInDev && !!this.posthogApiKey;
    }
    return !!this.posthogApiKey;
  },
};
