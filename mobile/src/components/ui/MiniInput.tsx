import React from "react";
import { TextInput, StyleSheet } from "react-native";

interface MiniInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  strike?: boolean;
}

export function MiniInput({ value, onChangeText, placeholder, strike }: MiniInputProps): React.JSX.Element {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.25)"
      style={[styles.miniInput, strike ? { textDecorationLine: "line-through" } : null]}
      keyboardType="default"
    />
  );
}

const styles = StyleSheet.create({
  miniInput: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#ffffff",
    textAlign: "center",
    fontSize: 13,
    paddingHorizontal: 4,
  },
});
