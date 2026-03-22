import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface ProgressBarProps {
  value: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export function ProgressBar({
  value,
  color = COLORS.teal,
  backgroundColor = "rgba(255,255,255,0.08)",
  height = 6,
}: ProgressBarProps): React.JSX.Element {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.progressTrack, { backgroundColor, height }]}>
      <View style={[styles.progressFill, { width: `${safeValue}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: { width: "100%", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
});
