import { type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

interface StackProps {
  children: ReactNode;
  gap?: number;
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  flex?: number;
  style?: ViewStyle;
}

export function HStack({ children, gap = 0, padding, paddingHorizontal, paddingVertical, flex, style }: StackProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap,
          ...(flex !== undefined ? { flex } : {}),
          ...(padding !== undefined ? { padding } : {}),
          ...(paddingHorizontal !== undefined ? { paddingHorizontal } : {}),
          ...(paddingVertical !== undefined ? { paddingVertical } : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function VStack({ children, gap = 0, padding, paddingHorizontal, paddingVertical, flex, style }: StackProps) {
  return (
    <View
      style={[
        {
          flexDirection: "column",
          gap,
          ...(flex !== undefined ? { flex } : {}),
          ...(padding !== undefined ? { padding } : {}),
          ...(paddingHorizontal !== undefined ? { paddingHorizontal } : {}),
          ...(paddingVertical !== undefined ? { paddingVertical } : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
