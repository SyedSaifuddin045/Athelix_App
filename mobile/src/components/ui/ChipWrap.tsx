import React from "react";
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";

interface ChipWrapProps {
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  activeColor: string;
  columns?: number;
  style?: StyleProp<ViewStyle>;
}

export function ChipWrap({ items, selected, onSelect, activeColor, columns, style }: ChipWrapProps): React.JSX.Element {
  return (
    <View style={[styles.chipWrap, columns === 2 ? { flexDirection: "row", flexWrap: "wrap" } : null, style]}>
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onSelect(item)}
          style={[
            styles.optionChip,
            columns === 2 ? { width: "48%" } : null,
            selected === item ? { backgroundColor: `${activeColor}20`, borderColor: `${activeColor}40` } : null,
          ]}
        >
          <Text style={[styles.optionChipText, selected === item ? { color: activeColor } : null]}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  optionChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionChipText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", textAlign: "center" },
});
