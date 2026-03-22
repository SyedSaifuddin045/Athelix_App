import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface AnalyticsCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export function AnalyticsCard({ label, value, sub, color }: AnalyticsCardProps): React.JSX.Element {
  return (
    <View style={styles.analyticsCard}>
      <Text style={styles.analyticsLabel}>{label}</Text>
      <Text style={[styles.analyticsValue, { color }]}>{value}</Text>
      <Text style={styles.analyticsSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  analyticsCard: {
    width: "48%",
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  analyticsLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 6 },
  analyticsValue: { fontSize: 16, fontWeight: "800" },
  analyticsSub: { color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 4 },
});
