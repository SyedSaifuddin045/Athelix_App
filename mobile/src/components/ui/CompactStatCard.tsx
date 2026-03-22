import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";
import { Card } from "./Card";

interface CompactStatCardProps {
  label: string;
  value: string;
  valueColor?: string;
}

export function CompactStatCard({ label, value, valueColor }: CompactStatCardProps): React.JSX.Element {
  return (
    <Card style={styles.compactStatCard}>
      <Text style={[styles.compactStatValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.compactStatLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  compactStatCard: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 82 },
  compactStatValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  compactStatLabel: { color: "rgba(255,255,255,0.35)", fontSize: 9, textAlign: "center", marginTop: 6 },
});
