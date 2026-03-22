import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";
import { Radio } from "./Radio";

interface SelectableRowProps {
  selected: boolean;
  onPress: () => void;
  label: string;
  sublabel?: string;
  color?: string;
}

export function SelectableRow({ selected, onPress, label, sublabel, color = COLORS.teal }: SelectableRowProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectableRow,
        selected ? { backgroundColor: `${color}12`, borderColor: `${color}44` } : null,
      ]}
    >
      <View style={styles.rowGap}>
        <Radio selected={selected} color={color} />
        <View>
          <Text style={[styles.listRowTitle, selected ? { color: COLORS.text } : { color: "rgba(255,255,255,0.68)" }]}>{label}</Text>
          {sublabel ? <Text style={[styles.listMeta, { color }]}>{sublabel}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selectableRow: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 10 },
  listRowTitle: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  listMeta: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
});
