import { Text, View } from "react-native";

import { COLORS } from "../../theme/colors";
import { SPACING, RADIUS } from "../../theme/spacing";
import { styles } from "../../theme/styles";
import { Icon, type IconName } from "./Icon";
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
  return (
    <View style={[styles.statPill, { gap: SPACING.xxs }]}>
      {icon ? (
        <Icon name={icon} size={16} color={color ?? COLORS.muted} />
      ) : null}
      <Text style={[styles.statPillValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
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
  return (
    <Card elevated style={[styles.compactStatCard, { gap: SPACING.xs }]}>
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.iconWrap,
            backgroundColor: color ? `${color}18` : COLORS.cardSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={14} color={color ?? COLORS.muted} />
        </View>
      ) : null}
      <Text style={[styles.compactStatValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.compactStatLabel}>{label}</Text>
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
  return (
    <View style={{ alignItems: "center", gap: SPACING.xs }}>
      {icon ? (
        <Icon name={icon} size={14} color={color ?? COLORS.muted} />
      ) : null}
      <Text style={[styles.metricBlockValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.metricBlockLabel}>{label}</Text>
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
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.lg }}>
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: RADIUS.iconWrap,
            backgroundColor: COLORS.cardSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={16} color={color ?? COLORS.muted} />
        </View>
      ) : null}
      <View>
        <Text style={[styles.heroMetric, color ? { color } : null]}>{value}</Text>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function AnalyticsCard({
  value,
  label,
  sub,
  color = COLORS.purple,
}: {
  value: string;
  label: string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card
      elevated
      accent="purple"
      style={{
        width: "48%",
        paddingHorizontal: SPACING.xl2,
        paddingVertical: SPACING.xl2,
        gap: SPACING.xxs,
      }}
    >
      <Text style={[styles.analyticsValue, { color }]}>{value}</Text>
      <Text style={styles.analyticsLabel}>{label}</Text>
      {sub ? <Text style={styles.analyticsSub}>{sub}</Text> : null}
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
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
      {icon ? <Icon name={icon} size={12} color={COLORS.faint} /> : null}
      <Text style={styles.listMeta}>{label}</Text>
    </View>
  );
}

export function DividerVertical() {
  return <View style={styles.verticalDivider} />;
}
