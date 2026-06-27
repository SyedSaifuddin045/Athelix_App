import { useRef } from "react";
import { View, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@tamagui/core";
import { NavigationContainer } from "@react-navigation/native";
import type { NavigationContainerRef } from "@react-navigation/native";

import { AppNavigator } from "./AppNavigator";
import { useScreenTracking } from "../analytics/useScreenTracking";
import type { RootStackParamList } from "../types/navigation";

export function AppContent() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { onReady, onStateChange } = useScreenTracking(navigationRef);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background?.toString(), paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background?.toString()} translucent={false} />
      <NavigationContainer
        ref={navigationRef}
        onReady={onReady}
        onStateChange={onStateChange}
        theme={{
          dark: true,
          colors: {
            primary: theme.accent?.toString() ?? "#FF5A36",
            background: theme.background?.toString() ?? "#050505",
            card: theme.backgroundFocus?.toString() ?? "#0A0A0A",
            text: theme.color?.toString() ?? "#FFFFFF",
            border: theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)",
            notification: theme.accent?.toString() ?? "#FF5A36",
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
