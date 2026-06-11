import { useRef } from "react";
import { View, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import type { NavigationContainerRef } from "@react-navigation/native";

import { AppNavigator } from "./AppNavigator";
import { COLORS } from "../theme/colors";
import { useScreenTracking } from "../analytics/useScreenTracking";
import type { RootStackParamList } from "../types/navigation";

export function AppContent() {
  const insets = useSafeAreaInsets();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { onReady, onStateChange } = useScreenTracking(navigationRef);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.root, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.root} translucent={false} />
      <NavigationContainer
        ref={navigationRef}
        onReady={onReady}
        onStateChange={onStateChange}
        theme={{
          dark: true,
          colors: {
            primary: COLORS.accent,
            background: COLORS.root,
            card: COLORS.screen,
            text: COLORS.text,
            border: COLORS.border,
            notification: COLORS.accent,
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
