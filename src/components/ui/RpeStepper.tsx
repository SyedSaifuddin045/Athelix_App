import { Pressable, Text, View } from "react-native";
import { useTheme } from "@tamagui/core";
import { spacing } from "../../design-system/tokens/spacing";
import { radii } from "../../design-system/tokens/radii";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function RpeStepper({ value, onChange, min = 1, max = 10 }: Props) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: radii.card,
          backgroundColor: theme.surface2?.get(),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: theme.color?.get(), fontSize: 18, fontWeight: "600" }}>−</Text>
      </Pressable>
      <Text style={{ color: theme.color?.get(), fontSize: 24, fontWeight: "700", minWidth: 30, textAlign: "center" }}>
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: radii.card,
          backgroundColor: theme.surface2?.get(),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: theme.color?.get(), fontSize: 18, fontWeight: "600" }}>+</Text>
      </Pressable>
    </View>
  );
}
