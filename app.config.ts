import { ExpoConfig } from "expo/config";
import { withSentry } from "@sentry/react-native/expo";

const config: ExpoConfig = {
  ...({} as ExpoConfig),
  extra: {
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    posthogEnabled: process.env.EXPO_PUBLIC_POSTHOG_ENABLED,
  },
};

export default ({ config: baseConfig }: { config: ExpoConfig }): ExpoConfig =>
  withSentry(
    { ...baseConfig, ...config, extra: { ...baseConfig.extra, ...config.extra } },
    {
      url: "https://sentry.io/",
      project: "athelix",
      organization: "personal-o2o",
    },
  );
