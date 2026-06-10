import { useCallback, useRef } from "react";
import type { NavigationContainerRef } from "@react-navigation/native";
import { usePostHog } from "posthog-react-native";

import type { RootStackParamList } from "../types/navigation";

export function useScreenTracking(
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>,
) {
  const posthog = usePostHog();
  const routeNameRef = useRef<string | undefined>(undefined);

  const onReady = useCallback(() => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
  }, [navigationRef]);

  const onStateChange = useCallback(() => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
    if (currentRouteName && previousRouteName !== currentRouteName) {
      posthog.screen(currentRouteName);
      routeNameRef.current = currentRouteName;
    }
  }, [navigationRef, posthog]);

  return { onReady, onStateChange };
}
