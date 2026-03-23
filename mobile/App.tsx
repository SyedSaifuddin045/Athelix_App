import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { PostHogProvider } from "./src/services/analytics/PostHogProvider";
import { AppNavigator } from "./src/navigation";
import { COLORS } from "./src/theme/colors";
import { env } from "./src/env";

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
  if (!env.isAnalyticsEnabled) {
    return (
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PostHogProvider>
        <AppContent />
      </PostHogProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.root, maxWidth: 390, width: "100%", alignSelf: "center" },
});