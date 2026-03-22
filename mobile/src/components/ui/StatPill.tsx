import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function StatPill({ icon, label, value }: StatPillProps): React.JSX.Element {
  return (
    <View style={styles.statPill}>
      <View style={styles.rowGapTiny}>
        {icon}
        <Text style={styles.statPillValue}>{value}</Text>
      </View>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statPill: { flex: 1, alignItems: "center", gap: 4 },
  statPillValue: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  statPillLabel: { color: "rgba(255,255,255,0.38)", fontSize: 10 },
  rowGapTiny: { flexDirection: "row", alignItems: "center", gap: 4 },
});
