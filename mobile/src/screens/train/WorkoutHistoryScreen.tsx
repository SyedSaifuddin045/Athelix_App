import React from "react";
import { View, Text, StyleSheet, SectionList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { WORKOUT_WEEKS, WORKOUT_SESSIONS } from "../../data";

type Props = RootStackScreenProps<"WorkoutHistory">;

type SectionData = {
  title: string;
  data: typeof WORKOUT_SESSIONS;
};

const SECTIONS: SectionData[] = [
  { title: "This Week", data: WORKOUT_SESSIONS.slice(0, 3) },
  { title: "Last Week", data: WORKOUT_SESSIONS.slice(3, 6) },
  { title: "2 Weeks Ago", data: WORKOUT_SESSIONS.slice(6) },
];

export function WorkoutHistoryScreen({ navigation }: Props): React.JSX.Element {
  const totalWorkouts = WORKOUT_SESSIONS.length;
  const totalVolume = WORKOUT_SESSIONS.reduce((sum, s) => sum + parseFloat(s.volume), 0);
  const totalPrs = WORKOUT_SESSIONS.reduce((sum, s) => sum + s.prs, 0);

  const renderSession = ({ item }: { item: typeof WORKOUT_SESSIONS[0] }) => (
    <Pressable onPress={() => navigation.navigate("SessionDetail", { id: item.id })}>
      <Card style={styles.sessionCard}>
        <View style={styles.sessionRow}>
          <View style={styles.sessionLeft}>
            <View style={styles.moodBadge}>
              <Text style={styles.moodText}>{item.mood}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName}>{item.name}</Text>
              <Text style={styles.sessionDate}>{item.date} · {item.time}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
        </View>
        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <Feather name="clock" size={12} color={COLORS.muted} />
            <Text style={styles.sessionStatText}>{item.duration} min</Text>
          </View>
          <View style={styles.sessionStat}>
            <Feather name="layers" size={12} color={COLORS.muted} />
            <Text style={styles.sessionStatText}>{item.sets} sets</Text>
          </View>
          <View style={styles.sessionStat}>
            <Feather name="activity" size={12} color={COLORS.muted} />
            <Text style={styles.sessionStatText}>{item.volume}</Text>
          </View>
          {item.prs > 0 && (
            <Tag label={`${item.prs} PR${item.prs > 1 ? "s" : ""}`} color={COLORS.gold} backgroundColor={`${COLORS.gold}20`} />
          )}
        </View>
      </Card>
    </Pressable>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <SectionEyebrow color={COLORS.purple}>{section.title}</SectionEyebrow>
      <Text style={styles.sectionCount}>{section.data.length} sessions</Text>
    </View>
  );

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
      <BackHeader title="Workout History" subtitle={`${totalWorkouts} total sessions`} onBack={() => navigation.goBack()} />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalWorkouts}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{(totalVolume / 1000).toFixed(1)}k</Text>
          <Text style={styles.summaryLabel}>Total Vol.</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.gold }]}>{totalPrs}</Text>
          <Text style={styles.summaryLabel}>PRs</Text>
        </Card>
      </View>

      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Start your first workout to see history</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  summaryCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
  summaryValue: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  summaryLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 8 },
  sectionCount: { color: COLORS.muted, fontSize: 11 },
  sessionCard: { marginBottom: 10 },
  sessionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sessionLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  moodBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  moodText: { fontSize: 16 },
  sessionInfo: { marginLeft: 12, flex: 1 },
  sessionName: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  sessionDate: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  sessionStats: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  sessionStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionStatText: { color: COLORS.muted, fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
});
