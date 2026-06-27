import { Text, View } from "react-native";
import { useTheme } from "@tamagui/core";
import { radii } from "../../design-system/tokens/radii";

type BadgeVariant = "filled" | "outlined" | "subtle";

interface AppBadgeProps {
  label: string;
  color?: string;
  variant?: BadgeVariant;
}

export function AppBadge({ label, color, variant = "subtle" }: AppBadgeProps) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.accent?.toString() ?? "#FF5A36";

  const bgColor =
    variant === "filled"
      ? resolvedColor
      : variant === "outlined"
        ? "transparent"
        : `${resolvedColor}18`;

  const borderColor =
    variant === "outlined"
      ? `${resolvedColor}40`
      : "transparent";

  const textColor =
    variant === "filled" ? "#000000" : resolvedColor;

  return (
    <View
      style={{
        borderRadius: radii.tag,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
        backgroundColor: bgColor,
        borderWidth: variant === "outlined" ? 1 : 0,
        borderColor,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: textColor,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
