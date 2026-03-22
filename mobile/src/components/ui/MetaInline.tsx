import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface MetaInlineProps {
  icon: React.ReactNode;
  text: string;
}

export function MetaInline({ icon, text }: MetaInlineProps): React.JSX.Element {
  return (
    <View style={styles.rowGapTiny}>
      {icon}
      <Text style={styles.listMeta}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowGapTiny: { flexDirection: "row", alignItems: "center", gap: 4 },
  listMeta: { color: "rgba(255,255,255,0.34)", fontSize: 10 },
});
