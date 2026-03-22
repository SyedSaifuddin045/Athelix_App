import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface TagProps {
  label: string;
  color?: string;
  backgroundColor?: string;
}

export function Tag({ label, color = COLORS.teal, backgroundColor }: TagProps): React.JSX.Element {
  return (
    <View style={[styles.tag, { backgroundColor: backgroundColor ?? `${color}24` }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  tagText: { fontSize: 10, fontWeight: "700" },
});
