export { useAnalytics, useScreenAnalytics, useIdentifyUser, useFeatureFlag } from "./useAnalytics";
export { PostHogProvider } from "./PostHogProvider";
export { getPostHogInstance } from "./analyticsService";
export type { default as PostHog } from "posthog-react-native";

// Re-export standalone functions for non-hook contexts
export { captureEvent, identifyUser, resetUser, setUserProperties, screenView } from "./useAnalytics";