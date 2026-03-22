import React from "react";
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { COLORS } from "../../theme/colors";
import { shadow } from "../../utils";

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  subtle?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
  subtle,
}: PrimaryButtonProps): React.JSX.Element {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.primaryButton,
        subtle
          ? { backgroundColor: COLORS.cardSoft, borderWidth: 1, borderColor: COLORS.border, shadowOpacity: 0 }
          : shadow(COLORS.teal),
        disabled ? { opacity: 0.6 } : null,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.primaryButtonText, subtle ? { color: "rgba(255,255,255,0.7)" } : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryButtonText: { color: "#000000", fontSize: 15, fontWeight: "800" },
});
