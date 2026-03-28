import { useCallback } from "react";
import { Platform } from "react-native";
import type { PostHog } from "posthog-react-native";
import { usePostHog as usePostHogContext, useFeatureFlag as usePostHogFeatureFlag } from "posthog-react-native";

const isWeb = Platform.OS === "web";

function useSafePostHog(): PostHog | null {
  if (isWeb) return null;
  return usePostHogContext();
}

function useSafeFeatureFlag(flagKey: string): boolean | undefined {
  if (isWeb) return undefined;
  const result = usePostHogFeatureFlag(flagKey);
  return typeof result === "boolean" ? result : undefined;
}

export function useAnalytics() {
  const posthog = useSafePostHog();

  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (posthog) {
      posthog.capture(eventName, properties as any);
    }
  }, [posthog]);

  const trackButtonPress = useCallback((buttonName: string) => {
    if (posthog) {
      posthog.capture("button_pressed", {
        button_name: buttonName,
      } as any);
    }
  }, [posthog]);

  const trackAction = useCallback((action: string, properties?: Record<string, unknown>) => {
    if (posthog) {
      posthog.capture(action, properties as any);
    }
  }, [posthog]);

  return {
    track,
    trackButtonPress,
    trackAction,
  };
}

export function useScreenAnalytics(screenName: string) {
  const posthog = useSafePostHog();

  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (posthog) {
      posthog.capture(eventName, {
        ...properties,
        screen_name: screenName,
      } as any);
    }
  }, [screenName, posthog]);

  const trackInteraction = useCallback((interaction: string, properties?: Record<string, unknown>) => {
    if (posthog) {
      posthog.capture("interaction", {
        ...properties,
        interaction_type: interaction,
        screen_name: screenName,
      } as any);
    }
  }, [screenName, posthog]);

  return {
    trackEvent,
    trackInteraction,
  };
}

export function useIdentifyUser(userId: string, userProperties?: Record<string, unknown>) {
  const posthog = useSafePostHog();

  if (posthog && userId) {
    posthog.identify(userId, userProperties as any);
  }
}

export { useSafePostHog, useSafeFeatureFlag };
