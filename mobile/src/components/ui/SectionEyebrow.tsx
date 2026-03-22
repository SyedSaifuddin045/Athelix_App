import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface SectionEyebrowProps {
  children: React.ReactNode;
  color?: string;
}

export function SectionEyebrow({ children, color }: SectionEyebrowProps): React.JSX.Element {
  return <Text style={[styles.sectionEyebrow, color ? { color } : null]}>{children}</Text>;
}

const styles = StyleSheet.create({
  sectionEyebrow: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
