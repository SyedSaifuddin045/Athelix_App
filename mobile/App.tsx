import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { PostHogProvider } from "./src/services/analytics/PostHogProvider";
import { AppNavigator } from "./src/navigation";
import { COLORS } from "./src/theme/colors";
import type { RootStackParamList } from "./src/types/navigation";
import { QueryProvider } from "./src/contexts";

function AppContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.root} translucent={false} />
      <AppNavigator />
    </View>
  );
}

export default function App(): React.JSX.Element {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <NavigationContainer ref={navigationRef}>
          <PostHogProvider navigationRef={navigationRef}>
            <AppContent />
          </PostHogProvider>
        </NavigationContainer>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.root, width: "100%" },
});
