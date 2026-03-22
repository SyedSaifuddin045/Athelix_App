import React from "react";
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { COLORS } from "../../theme/colors";
import { Card } from "./Card";

interface DetailStatProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

export function DetailStat({ label, value, icon }: DetailStatProps): React.JSX.Element {
  return (
    <Card style={[styles.compactStatCard, { alignItems: "center" }]}>
      {icon}
      <Text style={styles.compactStatValue}>{value}</Text>
      <Text style={styles.compactStatLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  compactStatCard: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 82 },
  compactStatValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  compactStatLabel: { color: "rgba(255,255,255,0.35)", fontSize: 9, textAlign: "center", marginTop: 6 },
});
