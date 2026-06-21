import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, StatusBar } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { PostHogProvider } from "posthog-react-native";
import { ClerkProvider } from "@clerk/expo";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();
import { tokenCache } from "./src/utils/timedTokenCache";

import { queryClient } from "./src/api/queryClient";
import { AppContent } from "./src/navigation/AppContent";
import { ErrorBoundary } from "./src/components/ui/ErrorBoundary";
import { getPostHogConfig } from "./src/analytics/posthog";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

const { apiKey, options } = getPostHogConfig();
const publishableKey = extra.clerkPublishableKey;

if (!publishableKey) {
  throw new Error("Missing clerkPublishableKey — ensure EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set");
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <PostHogProvider
            apiKey={apiKey}
            options={options}
            autocapture={{
              captureScreens: false,
              captureTouches: true,
            }}
          >
            <ErrorBoundary>
              <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
                <AppContent />
              </ClerkProvider>
            </ErrorBoundary>
          </PostHogProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
