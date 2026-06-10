import { Text, View } from "react-native";

import { COLORS } from "../../theme/colors";
import { styles } from "../../theme/styles";

export function SectionEyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.sectionEyebrow, color ? { color } : null]}>{children}</Text>;
}

export function Tag({
  label,
  color = COLORS.teal,
  backgroundColor,
}: {
  label: string;
  color?: string;
  backgroundColor?: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: backgroundColor ?? `${color}24` }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  color = COLORS.teal,
  backgroundColor = "rgba(255,255,255,0.08)",
  height = 6,
}: {
  value: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.progressTrack, { backgroundColor, height }]}>
      <View style={[styles.progressFill, { width: `${safeValue}%`, backgroundColor: color }]} />
    </View>
  );
}
