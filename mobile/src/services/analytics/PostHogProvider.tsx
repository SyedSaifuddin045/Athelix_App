import React, { useEffect } from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { PostHogProvider as PosthogReactNativeProvider } from "posthog-react-native";
import { getPostHogInstance, captureEvent } from "./analyticsService";
import { env } from "../../env";
import type { RootStackParamList } from "../../types/navigation";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps): React.JSX.Element {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    const unsubscribe = navigationRef.addListener("state", (event) => {
      const state = event.data?.state;
      if (!state?.routes || state.routes.length === 0) return;
      
      const currentRoute = state.routes[state.index ?? state.routes.length - 1];
      const routeName = currentRoute?.name;
      
      if (routeName) {
        captureEvent("$screen", {
          screen_name: routeName,
          timestamp: Date.now(),
        });
      }
    });

    return unsubscribe;
  }, [navigationRef]);

  return (
    <PosthogReactNativeProvider
      client={getPostHogInstance() ?? undefined}
      options={{
        host: env.posthogHost,
      }}
    >
      <NavigationContainer ref={navigationRef}>
        {children}
      </NavigationContainer>
    </PosthogReactNativeProvider>
  );
}