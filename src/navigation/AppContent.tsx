import { useRef } from "react";
import { View, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@tamagui/core";
import { NavigationContainer } from "@react-navigation/native";
import type { NavigationContainerRef } from "@react-navigation/native";

import { AppNavigator } from "./AppNavigator";
import { useScreenTracking } from "../analytics/useScreenTracking";
import type { RootStackParamList } from "../types/navigation";
import { useNotificationTapHandler } from "../hooks/useNotificationTapHandler";

const FALLBACK_BACKGROUND = "#050505";

export function AppContent() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { onReady, onStateChange } = useScreenTracking(navigationRef);
  const backgroundColor = theme.background?.get() ?? FALLBACK_BACKGROUND;
  useNotificationTapHandler();

  return (
    <View style={{ flex: 1, backgroundColor, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} translucent={false} />
      <NavigationContainer
        ref={navigationRef}
        onReady={onReady}
        onStateChange={onStateChange}
        theme={{
          dark: true,
          colors: {
            primary: theme.accent?.get() ?? "#FF5A36",
            background: backgroundColor,
            card: theme.backgroundFocus?.get() ?? "#0A0A0A",
            text: theme.color?.get() ?? "#FFFFFF",
            border: theme.borderColor?.get() ?? "rgba(255,255,255,0.08)",
            notification: theme.accent?.get() ?? "#FF5A36",
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
    </View>
  );
}
