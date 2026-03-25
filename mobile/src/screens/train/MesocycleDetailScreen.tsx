import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, ProgressBar, CompactStatCard, SectionEyebrow, VerticalBars } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useMesocycle, useMesocycleAnalytics } from "../../hooks";

type Props = RootStackScreenProps<"MesocycleDetail">;

const DEFAULT_COLOR = "#00d4a8";

export function MesocycleDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { id } = route.params;
  const { data: mesocycle, isLoading } = useMesocycle(id);
  const { data: analytics } = useMesocycleAnalytics(id);

  if (isLoading) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20 }}>
        <BackHeader title="Loading..." onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      </Screen>
    );
  }

  if (!mesocycle) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20 }}>
        <BackHeader title="Mesocycle" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mesocycle not found</Text>
        </View>
      </Screen>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const progress = mesocycle.total_weeks > 0 
    ? (mesocycle.current_week / mesocycle.total_weeks) * 100 
    : 0;

  const volumeData = analytics?.volume_by_week?.map((v, i) => ({
    label: `W${v.week}`,
    value: v.volume / 1000,
    highlight: i === analytics.volume_by_week.length - 1,
  })) || [];

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title={mesocycle.name} onBack={() => navigation.goBack()} />

      <Card style={[styles.headerCard, { borderColor: `${DEFAULT_COLOR}30` }]}>
        <View style={styles.headerTop}>
          <Tag label={mesocycle.status.charAt(0).toUpperCase() + mesocycle.status.slice(1)} color={DEFAULT_COLOR} backgroundColor={`${DEFAULT_COLOR}20`} />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={[styles.progressPercent, { color: DEFAULT_COLOR }]}>{progress.toFixed(0)}%</Text>
          </View>
          <ProgressBar value={progress} color={DEFAULT_COLOR} height={10} />
          <Text style={styles.progressDetail}>Week {mesocycle.current_week} of {mesocycle.total_weeks}</Text>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Feather name="calendar" size={14} color={COLORS.muted} />
            <Text style={styles.dateLabel}>Start</Text>
            <Text style={styles.dateValue}>{formatDate(mesocycle.start_date)}</Text>
          </View>
          <View style={styles.dateArrow}>
            <Feather name="arrow-right" size={14} color="rgba(255,255,255,0.2)" />
          </View>
          <View style={styles.dateItem}>
            <Feather name="flag" size={14} color={COLORS.muted} />
            <Text style={styles.dateLabel}>End</Text>
            <Text style={styles.dateValue}>{formatDate(mesocycle.end_date)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <CompactStatCard label="Sessions" value={`${mesocycle.linked_sessions_count}`} valueColor={DEFAULT_COLOR} />
          <CompactStatCard label="Weeks" value={`${mesocycle.current_week}/${mesocycle.total_weeks}`} valueColor={COLORS.text} />
          <CompactStatCard label="PRs" value={`${analytics?.total_prs || 0}`} valueColor={COLORS.gold} />
        </View>
      </Card>

      {analytics && volumeData.length > 0 && (
        <View style={styles.section}>
          <SectionEyebrow color={COLORS.green}>Volume Progression</SectionEyebrow>
          <Card style={styles.volumeCard}>
            <View style={styles.volumeHeader}>
              <Text style={styles.volumeTitle}>Weekly Volume</Text>
              <Text style={styles.volumeUnit}>tons</Text>
            </View>
            <VerticalBars
              data={volumeData}
              height={100}
              activeColor={DEFAULT_COLOR}
              mutedColor="rgba(255,255,255,0.18)"
            />
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 100 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: COLORS.red, fontSize: 14 },
  headerCard: { marginTop: 16, borderWidth: 1 },
  headerTop: { flexDirection: "row", gap: 8 },
  progressSection: { marginTop: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { color: COLORS.muted, fontSize: 12 },
  progressPercent: { fontSize: 20, fontWeight: "900" },
  progressDetail: { color: COLORS.muted, fontSize: 11, marginTop: 8, textAlign: "center" },
  dateRow: { flexDirection: "row", alignItems: "center", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  dateItem: { flex: 1, alignItems: "center" },
  dateLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  dateValue: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginTop: 2 },
  dateArrow: { paddingHorizontal: 12 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  section: { marginTop: 24 },
  volumeCard: { marginTop: 10 },
  volumeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  volumeTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  volumeUnit: { color: COLORS.muted, fontSize: 12 },
});
