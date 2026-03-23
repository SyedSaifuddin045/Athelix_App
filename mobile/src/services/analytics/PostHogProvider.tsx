import React, { useEffect, useRef } from "react";
import type { NavigationContainerRef } from "@react-navigation/native";
import { PostHogProvider as PosthogReactNativeProvider, usePostHog } from "posthog-react-native";
import { env } from "../../env";
import type { RootStackParamList } from "../../types/navigation";

interface PostHogProviderProps {
  children: React.ReactNode;
  navigationRef?: NavigationContainerRef<RootStackParamList> | null;
}

interface NavigationTrackerProps {
  navigationRef?: NavigationContainerRef<RootStackParamList> | null;
}

function NavigationTracker({ navigationRef }: NavigationTrackerProps): null {
  const posthog = usePostHog();
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const setupListener = () => {
      if (!navigationRef) return;

      const unsubscribe = navigationRef.addListener("state", (event) => {
        const state = event.data?.state;
        if (!state?.routes || state.routes.length === 0) return;
        
        const currentRoute = state.routes[state.index ?? state.routes.length - 1];
        const routeName = currentRoute?.name;
        
        if (routeName && posthog) {
          posthog.screen(routeName);
        }
      });

      listenerRef.current = unsubscribe;
    };

    if (navigationRef?.isReady?.()) {
      setupListener();
    } else {
      const timeout = setTimeout(setupListener, 1000);
      return () => clearTimeout(timeout);
    }

    return () => {
      listenerRef.current?.();
      listenerRef.current = null;
    };
  }, [navigationRef, posthog]);

  return null;
}

export function PostHogProvider({ children, navigationRef }: PostHogProviderProps): React.JSX.Element {
  if (!env.posthogApiKey) {
    return <>{children}</>;
  }

  return (
    <PosthogReactNativeProvider
      apiKey={env.posthogApiKey}
      options={{
        host: env.posthogHost,
        flushAt: 1,
        flushInterval: 5000,
      }}
    >
      {children}
      <NavigationTracker navigationRef={navigationRef} />
    </PosthogReactNativeProvider>
  );
}
