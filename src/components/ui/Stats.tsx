import { Text, View } from "react-native";

import { useTheme } from "@tamagui/core";
import { spacing } from "../../design-system/tokens/spacing";
import { radii } from "../../design-system/tokens/radii";
import { AppIcon, type IconName } from "../../design-system/icons/AppIcon";
import { Card } from "./Card";

export function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon?: IconName;
  value: string;
  label: string;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: spacing.xxs }}>
      {icon ? (
        <AppIcon name={icon} size={16} color={color ?? theme.colorMuted?.get()} />
      ) : null}
      <Text style={[{ color: theme.color?.get(), fontSize: 15, fontWeight: "800" }, color ? { color } : null]}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export function CompactStatCard({
  icon,
  value,
  label,
  color,
}: {
  icon?: IconName;
  value: string;
  label: string;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <Card elevated style={[{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 82 }, { gap: spacing.xs }]}>
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radii.iconWrap,
            backgroundColor: color ? `${color}18` : theme.surface2?.get(),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name={icon} size={14} color={color ?? theme.colorMuted?.get()} />
        </View>
      ) : null}
      <Text style={[{ color: theme.color?.get(), fontSize: 18, fontWeight: "900" }, color ? { color } : null]}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, textAlign: "center", marginTop: spacing.sm }}>{label}</Text>
    </Card>
  );
}

export function MetricBlock({
  icon,
  value,
  label,
  color,
}: {
  icon?: IconName;
  value: string;
  label: string;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: "center", gap: spacing.xs }}>
      {icon ? (
        <AppIcon name={icon} size={14} color={color ?? theme.colorMuted?.get()} />
      ) : null}
      <Text style={[{ color: theme.color?.get(), fontSize: 14, fontWeight: "800" }, color ? { color } : null]}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, marginTop: 3 }}>{label}</Text>
    </View>
  );
}

export function DetailStat({
  icon,
  value,
  label,
  color,
}: {
  icon?: IconName;
  value: string;
  label: string;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.iconWrap,
            backgroundColor: theme.surface2?.get(),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name={icon} size={16} color={color ?? theme.colorMuted?.get()} />
        </View>
      ) : null}
      <View>
        <Text style={[{ color: theme.color?.get(), fontSize: 20, fontWeight: "800" }, color ? { color } : null]}>{value}</Text>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, lineHeight: 16 }}>{label}</Text>
      </View>
    </View>
  );
}

export function AnalyticsCard({
  value,
  label,
  sub,
  color: colorProp,
}: {
  value: string;
  label: string;
  sub?: string;
  color?: string;
}) {
  const theme = useTheme();
  const color = colorProp ?? theme.colorPurple?.get();
  return (
    <Card
      elevated
      accent="purple"
      style={{
        width: "48%",
        paddingHorizontal: spacing.xl2,
        paddingVertical: spacing.xl2,
        gap: spacing.xxs,
      }}
    >
      <Text style={[{ fontSize: 16, fontWeight: "800" }, { color }]}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginBottom: 6 }}>{label}</Text>
      {sub ? <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 4 }}>{sub}</Text> : null}
    </Card>
  );
}

export function MetaInline({
  icon,
  label,
}: {
  icon?: IconName;
  label: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
      {icon ? <AppIcon name={icon} size={12} color={theme.colorFaint?.get()} /> : null}
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export function DividerVertical() {
  return <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.07)", marginHorizontal: 8 }} />;
}
