import { useCallback, useEffect, useRef } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafePostHog, useSafeFeatureFlag } from "./usePostHogSafe";

export function useAnalytics() {
  const navigation = useNavigation();
  const route = useRoute();
  const posthog = useSafePostHog();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const state = navigation.getState();
      const currentRoute = state?.routes?.[state.index ?? 0];
      const routeName = currentRoute?.name;
      if (routeName && posthog) {
        posthog.screen(routeName);
      }
    }

    const unsubscribe = navigation.addListener("state", (event) => {
      const state = event.data?.state;
      if (!state?.routes || state.routes.length === 0) return;
      
      const currentRoute = state.routes[state.index ?? state.routes.length - 1];
      const routeName = currentRoute?.name;
      
      if (routeName && posthog) {
        posthog.screen(routeName);
      }
    });

    return unsubscribe;
  }, [navigation, posthog]);

  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (posthog) {
      posthog.capture(eventName, properties as any);
    }
  }, [posthog]);

  const trackButtonPress = useCallback((buttonName: string, screenName?: string) => {
    if (posthog) {
      posthog.capture("button_pressed", {
        button_name: buttonName,
        screen_name: screenName ?? route.name,
      } as any);
    }
  }, [posthog, route.name]);

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
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current && posthog) {
      isFirstRender.current = false;
      posthog.screen(screenName);
    }
  }, [screenName, posthog]);

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

  useEffect(() => {
    if (posthog && userId) {
      posthog.identify(userId, userProperties as any);
    }
  }, [posthog, userId, userProperties]);
}

export function useFeatureFlag(flagKey: string): boolean | undefined {
  return useSafeFeatureFlag(flagKey);
}

export function captureEvent(eventName: string, properties?: Record<string, unknown>): void {
  const posthog = useSafePostHog();
  if (posthog) {
    posthog.capture(eventName, properties as any);
  }
}

export function identifyUser(userId: string, userProperties?: Record<string, unknown>): void {
  const posthog = useSafePostHog();
  if (posthog) {
    posthog.identify(userId, userProperties as any);
  }
}

export function resetUser(): void {
  const posthog = useSafePostHog();
  if (posthog) {
    posthog.reset();
  }
}

export function setUserProperties(properties: Record<string, unknown>): void {
  const posthog = useSafePostHog();
  if (posthog) {
    posthog.setPersonProperties(properties as any);
  }
}

export function screenView(screenName: string, properties?: Record<string, unknown>): void {
  const posthog = useSafePostHog();
  if (posthog) {
    posthog.screen(screenName, properties as any);
  }
}
