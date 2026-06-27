import { Text, View } from "react-native";
import { useTheme } from "@tamagui/core";

import { radii } from "../../design-system/tokens/radii";

export function SectionEyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        color: color ?? (theme.colorFaint?.toString() ?? "rgba(255,255,255,0.35)"),
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.4,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

export function Tag({
  label,
  color,
  backgroundColor,
}: {
  label: string;
  color?: string;
  backgroundColor?: string;
}) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.accent?.toString() ?? "#FF5A36";

  return (
    <View
      style={{
        borderRadius: radii.tag,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
        backgroundColor: backgroundColor ?? `${resolvedColor}24`,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: resolvedColor,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function ProgressBar({
  value,
  color,
  backgroundColor,
  height = 6,
}: {
  value: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
}) {
  const theme = useTheme();
  const safeValue = Math.max(0, Math.min(100, value));
  const resolvedColor = color ?? theme.accent?.toString() ?? "#FF5A36";
  const trackBg = backgroundColor ?? "rgba(255,255,255,0.08)";

  return (
    <View style={{ width: "100%", borderRadius: 999, overflow: "hidden", backgroundColor: trackBg, height }}>
      <View style={{ width: `${safeValue}%`, backgroundColor: resolvedColor, borderRadius: 999, height: "100%" }} />
    </View>
  );
}
