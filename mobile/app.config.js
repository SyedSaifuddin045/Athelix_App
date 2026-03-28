const isWeb = process.env.EXPO_PUBLIC_PLATFORM === "web";

export default ({ config }) => ({
  ...config,
  name: "Athelix",
  slug: "athelix",

  android: {
    ...config.android,
    package: "com.saif.athelix",
  },

  extra: {
    apiBaseUrl: process.env.API_BASE_URL || 
      (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "http://10.200.66.146:8000"),
    posthogApiKey: process.env.POSTHOG_API_KEY || "",
    posthogHost: process.env.POSTHOG_HOST || "https://eu.i.posthog.com",
    enableAnalyticsInDev: process.env.ENABLE_ANALYTICS_IN_DEV === "true",
  },
});
