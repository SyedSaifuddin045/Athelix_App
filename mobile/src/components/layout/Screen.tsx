import React from "react";
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Glow } from "./Glow";
import { COLORS } from "../../theme/colors";

interface ScreenProps {
  children: React.ReactNode;
  glowColor?: string;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, glowColor = "rgba(0,180,140,0.18)", scroll = true, contentContainerStyle }: ScreenProps): React.JSX.Element {
  if (!scroll) {
    return (
      <View style={styles.screen}>
        <Glow color={glowColor} />
        <View style={[styles.flexFill, contentContainerStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Glow color={glowColor} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.screen },
  flexFill: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
});
