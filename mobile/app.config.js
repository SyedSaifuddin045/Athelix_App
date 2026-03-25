export default ({ config }) => ({
  ...config,
  name: "Athelix",
  slug: "athelix",

  android: {
    ...config.android,
    package: "com.saif.athelix",
  },

  extra: {
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8000",
    posthogApiKey: process.env.POSTHOG_API_KEY || "",
    posthogHost: process.env.POSTHOG_HOST || "https://eu.i.posthog.com",
    enableAnalyticsInDev: process.env.ENABLE_ANALYTICS_IN_DEV === "true",
  },
});
