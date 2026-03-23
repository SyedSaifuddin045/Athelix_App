import Constants from "expo-constants";

interface EnvConfig {
  posthogApiKey: string;
  posthogHost: string;
  enableAnalyticsInDev: boolean;
  isAnalyticsEnabled: boolean;
}

function getEnvVar(key: string, defaultValue: string = ""): string {
  return Constants.expoConfig?.extra?.[key] ?? process.env[key] ?? defaultValue;
}

function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key, "").toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

export const env: EnvConfig = {
  posthogApiKey: getEnvVar("POSTHOG_API_KEY", ""),
  posthogHost: getEnvVar("POSTHOG_HOST", "https://eu.i.posthog.com"),
  enableAnalyticsInDev: getBooleanEnvVar("ENABLE_ANALYTICS_IN_DEV", false),
  get isAnalyticsEnabled(): boolean {
    const isDev = __DEV__;
    if (isDev) {
      return this.enableAnalyticsInDev && !!this.posthogApiKey;
    }
    return !!this.posthogApiKey;
  },
};