import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface GlowProps {
  color: string;
}

export function Glow({ color }: GlowProps): React.JSX.Element {
  return <View style={[styles.glow, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    top: -180,
    alignSelf: "center",
    width: 520,
    height: 260,
    borderRadius: 260,
    opacity: 0.4,
    zIndex: -1,
  },
});
