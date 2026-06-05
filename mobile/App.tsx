import { useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, StatusBar } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import type { NavigationContainerRef } from "@react-navigation/native";
import { PostHogProvider } from "posthog-react-native";

import { queryClient } from "./src/api/queryClient";
import { AuthProvider } from "./src/auth/AuthProvider";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ErrorBoundary } from "./src/components/ui/ErrorBoundary";
import { COLORS } from "./src/theme/colors";
import { getPostHogConfig } from "./src/analytics/posthog";
import { useScreenTracking } from "./src/analytics/useScreenTracking";
import type { RootStackParamList } from "./src/types/navigation";

const { apiKey, options } = getPostHogConfig();

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
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </PostHogProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { onReady, onStateChange } = useScreenTracking(navigationRef);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.root, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.root} translucent={false} />
      <ErrorBoundary>
        <NavigationContainer
          ref={navigationRef}
          onReady={onReady}
          onStateChange={onStateChange}
          theme={{
            dark: true,
            colors: {
              primary: COLORS.teal,
              background: COLORS.root,
              card: COLORS.screen,
              text: COLORS.text,
              border: COLORS.border,
              notification: COLORS.teal,
            },
            fonts: {
              regular: { fontFamily: "System", fontWeight: "400" as const },
              medium: { fontFamily: "System", fontWeight: "500" as const },
              bold: { fontFamily: "System", fontWeight: "700" as const },
              heavy: { fontFamily: "System", fontWeight: "800" as const },
            },
          }}
        >
          <AppNavigator />
        </NavigationContainer>
      </ErrorBoundary>
    </View>
  );
}
