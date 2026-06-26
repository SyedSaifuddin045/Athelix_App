import { Pressable, Text, View } from "react-native";
import { COLORS } from "../../theme/colors";
import { SPACING, RADIUS } from "../../theme/spacing";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function RpeStepper({ value, onChange, min = 1, max = 10 }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS.card,
          backgroundColor: COLORS.cardSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "600" }}>−</Text>
      </Pressable>
      <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "700", minWidth: 30, textAlign: "center" }}>
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS.card,
          backgroundColor: COLORS.cardSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "600" }}>+</Text>
      </Pressable>
    </View>
  );
}
