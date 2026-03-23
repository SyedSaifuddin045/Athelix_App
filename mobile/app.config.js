export default ({ config }) => ({
  ...config,
  name: "Athelix",
  slug: "athelix",

  android: {
    ...config.android,
    package: "com.saif.athelix",
  },

  extra: {
    posthogApiKey: process.env.POSTHOG_API_KEY || "",
    posthogHost: process.env.POSTHOG_HOST || "https://eu.i.posthog.com",
    enableAnalyticsInDev: process.env.ENABLE_ANALYTICS_IN_DEV === "true",
  },
});