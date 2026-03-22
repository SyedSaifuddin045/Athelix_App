import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface MetricBlockProps {
  value: string;
  label: string;
}

export function MetricBlock({ value, label }: MetricBlockProps): React.JSX.Element {
  return (
    <View>
      <Text style={styles.metricBlockValue}>{value}</Text>
      <Text style={styles.metricBlockLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metricBlockValue: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  metricBlockLabel: { color: "rgba(255,255,255,0.35)", fontSize: 9, marginTop: 3 },
});
