import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, ProgressBar, CompactStatCard, SectionEyebrow, VerticalBars } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { MESOCYCLE_LIST, MESO_VOLUME_DATA, LINKED_SESSIONS, MESOCYCLE_STATUS } from "../../data";

type Props = RootStackScreenProps<"MesocycleDetail">;

export function MesocycleDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { id } = route.params;
  const mesocycle = MESOCYCLE_LIST.find((m) => m.id === id) || MESOCYCLE_LIST[0];
  const statusInfo = MESOCYCLE_STATUS[mesocycle.status];
  const progress = mesocycle.weeks > 0 ? (mesocycle.currentWeek / mesocycle.weeks) * 100 : 0;

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title={mesocycle.name} onBack={() => navigation.goBack()} />

      <Card style={[styles.headerCard, { borderColor: `${mesocycle.color}30` }]}>
        <View style={styles.headerTop}>
          <Tag label={mesocycle.phase} color={mesocycle.color} backgroundColor={`${mesocycle.color}20`} />
          <Tag label={statusInfo.label} color={statusInfo.color} backgroundColor={statusInfo.bg} />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={[styles.progressPercent, { color: mesocycle.color }]}>{progress.toFixed(0)}%</Text>
          </View>
          <ProgressBar value={progress} color={mesocycle.color} height={10} />
          <Text style={styles.progressDetail}>Week {mesocycle.currentWeek} of {mesocycle.weeks}</Text>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Feather name="calendar" size={14} color={COLORS.muted} />
            <Text style={styles.dateLabel}>Start</Text>
            <Text style={styles.dateValue}>{mesocycle.startDate}</Text>
          </View>
          <View style={styles.dateArrow}>
            <Feather name="arrow-right" size={14} color="rgba(255,255,255,0.2)" />
          </View>
          <View style={styles.dateItem}>
            <Feather name="flag" size={14} color={COLORS.muted} />
            <Text style={styles.dateLabel}>End</Text>
            <Text style={styles.dateValue}>{mesocycle.endDate}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <CompactStatCard label="Sessions" value={`${mesocycle.sessions}`} valueColor={mesocycle.color} />
          <CompactStatCard label="Weeks" value={`${mesocycle.currentWeek}/${mesocycle.weeks}`} valueColor={COLORS.text} />
          <CompactStatCard label="Days Left" value={`${Math.max(0, 28 - mesocycle.currentWeek * 7)}`} valueColor={COLORS.muted} />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.green}>Volume Progression</SectionEyebrow>
        <Card style={styles.volumeCard}>
          <View style={styles.volumeHeader}>
            <Text style={styles.volumeTitle}>Weekly Volume</Text>
            <Text style={styles.volumeUnit}>kg</Text>
          </View>
          <VerticalBars
            data={MESO_VOLUME_DATA.map((d, i) => ({ label: d.label, value: d.value / 1000, highlight: i === 2 }))}
            height={100}
            activeColor={mesocycle.color}
            mutedColor="rgba(255,255,255,0.18)"
          />
          <View style={styles.volumeLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: mesocycle.color }]} />
              <Text style={styles.legendText}>Actual</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "rgba(255,255,255,0.18)" }]} />
              <Text style={styles.legendText}>Remaining</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Linked Sessions</SectionEyebrow>
        {LINKED_SESSIONS.map((session) => (
          <Card key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <View style={styles.sessionLeft}>
                <Text style={styles.sessionName}>{session.name}</Text>
                <Text style={styles.sessionMeta}>{session.date} · {session.sets} sets</Text>
              </View>
              <View style={styles.sessionRight}>
                <Text style={styles.sessionVolume}>{session.volume} kg</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {mesocycle.status === "active" && (
        <View style={styles.footer}>
          <Tag label="Week 4 Preview" color={COLORS.blue} backgroundColor={`${COLORS.blue}20`} />
          <Text style={styles.weekPreviewText}>Lower Body Power · Deload emphasis</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  volumeLegend: { flexDirection: "row", gap: 16, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.muted, fontSize: 11 },
  sessionCard: { marginBottom: 8 },
  sessionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionLeft: {},
  sessionName: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  sessionMeta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  sessionRight: {},
  sessionVolume: { color: COLORS.teal, fontSize: 13, fontWeight: "800" },
  footer: { marginTop: 24, alignItems: "center", gap: 8 },
  weekPreviewText: { color: COLORS.muted, fontSize: 12 },
});
