import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { AppNavigator } from "./src/navigation";
import { COLORS } from "./src/theme/colors";

function AppContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.root} translucent={false} />
      <NavigationContainer
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
    </View>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.root, maxWidth: 390, width: "100%", alignSelf: "center" },
});
