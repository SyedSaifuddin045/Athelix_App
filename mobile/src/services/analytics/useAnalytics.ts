import { useCallback, useEffect, useRef } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NavigationContainerRef } from "@react-navigation/native";
import { captureEvent, identifyUser, resetUser, setUserProperties, screenView } from "./analyticsService";
import type { RootStackParamList } from "../../types/navigation";

type NavigationRef = NavigationContainerRef<RootStackParamList>;

interface AnalyticsOptions {
  trackScreenViews?: boolean;
  userId?: string;
  userProperties?: Record<string, unknown>;
}

export function useAnalytics(options: AnalyticsOptions = {}) {
  const { trackScreenViews = true, userId, userProperties = {} } = options;
  const navigation = useNavigation<NavigationRef>();
  const route = useRoute();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (userId) {
      identifyUser(userId, userProperties);
    }
  }, [userId, userProperties]);

  useEffect(() => {
    if (!trackScreenViews) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      const currentRoute = navigation.getState();
      const routeName = currentRoute.routes[currentRoute.index ?? 0]?.name;
      if (routeName) {
        screenView(routeName);
      }
    }

    const unsubscribe = navigation.addListener("state", (event) => {
      const state = event.data?.state;
      if (!state?.routes || state.routes.length === 0) return;
      
      const currentRoute = state.routes[state.index ?? state.routes.length - 1];
      const routeName = currentRoute?.name;
      
      if (routeName) {
        screenView(routeName);
      }
    });

    return unsubscribe;
  }, [navigation, trackScreenViews]);

  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    captureEvent(eventName, properties);
  }, []);

  const trackButtonPress = useCallback((buttonName: string, screenName?: string) => {
    captureEvent("button_pressed", {
      button_name: buttonName,
      screen_name: screenName ?? route.name,
    });
  }, [route.name]);

  const trackAction = useCallback((action: string, properties?: Record<string, unknown>) => {
    captureEvent(action, properties);
  }, []);

  return {
    track,
    trackButtonPress,
    trackAction,
  };
}

export function useScreenAnalytics(screenName: string) {
  const route = useRoute();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      screenView(screenName);
    }
  }, [screenName]);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    captureEvent(eventName, {
      ...properties,
      screen_name: screenName,
    });
  }, [screenName]);

  const trackInteraction = useCallback((interaction: string, properties?: Record<string, unknown>) => {
    captureEvent("interaction", {
      ...properties,
      interaction_type: interaction,
      screen_name: screenName,
    });
  }, [screenName]);

  return {
    trackEvent,
    trackInteraction,
  };
}

export { captureEvent, identifyUser, resetUser, setUserProperties, screenView } from "./analyticsService";