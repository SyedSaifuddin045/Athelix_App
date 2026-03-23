import Constants from "expo-constants";

interface EnvConfig {
  posthogApiKey: string;
  posthogHost: string;
  enableAnalyticsInDev: boolean;
  isAnalyticsEnabled: boolean;
}

function getEnvVar(key: keyof EnvConfig): string {
  return Constants.expoConfig?.extra?.[key] as string ?? "";
}

function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key as keyof EnvConfig);
  if (value === "true") return true;
  if (value === "false" || value === "") return defaultValue;
  return defaultValue;
}

export const env: EnvConfig = {
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
