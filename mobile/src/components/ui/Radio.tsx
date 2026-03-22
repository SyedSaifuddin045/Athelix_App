import React from "react";
import { View, StyleSheet } from "react-native";

interface RadioProps {
  selected: boolean;
  color: string;
}

export function Radio({ selected, color }: RadioProps): React.JSX.Element {
  return (
    <View style={[styles.radioOuter, { borderColor: selected ? color : "rgba(255,255,255,0.3)" }]}>
      {selected ? <View style={[styles.radioInner, { backgroundColor: color }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  radioOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
});
