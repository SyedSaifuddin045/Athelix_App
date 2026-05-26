import { Text, View } from "react-native";

import { styles } from "../../theme/styles";
import { Card } from "./Card";

export function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <View style={styles.rowGapTiny}>
        {icon}
        <Text style={styles.statPillValue}>{value}</Text>
      </View>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

export function DividerVertical() {
  return <View style={styles.verticalDivider} />;
}

export function MetricBlock({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text style={styles.metricBlockValue}>{value}</Text>
      <Text style={styles.metricBlockLabel}>{label}</Text>
    </View>
  );
}

export function CompactStatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Card style={styles.compactStatCard}>
      <Text style={[styles.compactStatValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.compactStatLabel}>{label}</Text>
    </Card>
  );
}

export function DetailStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card style={[styles.compactStatCard, { alignItems: "center" }]}>
      {icon}
      <Text style={styles.compactStatValue}>{value}</Text>
      <Text style={styles.compactStatLabel}>{label}</Text>
    </Card>
  );
}

export function AnalyticsCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={styles.analyticsCard}>
      <Text style={styles.analyticsLabel}>{label}</Text>
      <Text style={[styles.analyticsValue, { color }]}>{value}</Text>
      <Text style={styles.analyticsSub}>{sub}</Text>
    </View>
  );
}

export function MetaInline({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.rowGapTiny}>
      {icon}
      <Text style={styles.listMeta}>{text}</Text>
    </View>
  );
}
