import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface RoundButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  accent?: boolean;
}

export function RoundButton({ children, onPress, accent }: RoundButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.roundButton,
        accent ? { backgroundColor: "rgba(0,212,168,0.16)", borderColor: "rgba(0,212,168,0.32)" } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
});
