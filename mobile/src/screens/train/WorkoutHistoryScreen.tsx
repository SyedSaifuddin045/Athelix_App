import React, { useMemo } from "react";
import { View, Text, StyleSheet, SectionList, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useWorkoutSessions } from "../../hooks";
import type { WorkoutSession } from "../../api/types";

type Props = RootStackScreenProps<"WorkoutHistory">;

type SectionData = {
  title: string;
  data: WorkoutSession[];
};

export function WorkoutHistoryScreen({ navigation }: Props): React.JSX.Element {
  const { data: sessionsData, isLoading, error } = useWorkoutSessions();

  const sessions = sessionsData?.data || [];
  const totalSessions = sessionsData?.total || 0;

  const sections = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay() + 1);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const twoWeeksAgoStart = new Date(lastWeekStart);
    twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 7);

    const thisWeek = sessions.filter(s => new Date(s.started_at) >= thisWeekStart);
    const lastWeek = sessions.filter(s => {
      const date = new Date(s.started_at);
      return date >= lastWeekStart && date < thisWeekStart;
    });
    const twoWeeksAgo = sessions.filter(s => {
      const date = new Date(s.started_at);
      return date >= twoWeeksAgoStart && date < lastWeekStart;
    });

    const result: SectionData[] = [];
    if (thisWeek.length > 0) result.push({ title: "This Week", data: thisWeek });
    if (lastWeek.length > 0) result.push({ title: "Last Week", data: lastWeek });
    if (twoWeeksAgo.length > 0) result.push({ title: "2 Weeks Ago", data: twoWeeksAgo });

    return result;
  }, [sessions]);

  const totalVolume = useMemo(() => 
    sessions.reduce((sum, s) => sum + (s.total_volume || 0), 0),
    [sessions]
  );

  const totalPrs = useMemo(() => 
    sessions.reduce((sum, s) => sum + (s.prs_count || 0), 0),
    [sessions]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const renderSession = ({ item }: { item: WorkoutSession }) => (
    <Pressable onPress={() => (navigation as any).navigate("SessionDetail", { id: item.id })}>
      <Card style={styles.sessionCard}>
        <View style={styles.sessionRow}>
          <View style={styles.sessionLeft}>
            <View style={styles.moodBadge}>
              <Text style={styles.moodText}>{item.mood || "💪"}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName}>{item.name}</Text>
              <Text style={styles.sessionDate}>
                {formatDate(item.started_at)} · {formatTime(item.started_at)}
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
        </View>
        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <Feather name="clock" size={12} color={COLORS.muted} />
            <Text style={styles.sessionStatText}>{item.duration_minutes || 0} min</Text>
          </View>
          <View style={styles.sessionStat}>
            <Feather name="layers" size={12} color={COLORS.muted} />
            <Text style={styles.sessionStatText}>{item.total_sets || 0} sets</Text>
          </View>
          <View style={styles.sessionStat}>
            <Feather name="activity" size={12} color={COLORS.muted} />
            <Text style={styles.sessionStatText}>
              {item.total_volume 
                ? item.total_volume >= 1000 
                  ? `${(item.total_volume / 1000).toFixed(1)}k` 
                  : String(item.total_volume)
                : "0"}
            </Text>
          </View>
          {item.prs_count != null && item.prs_count > 0 && (
            <Tag 
              label={`${item.prs_count} PR${item.prs_count > 1 ? "s" : ""}`} 
              color={COLORS.gold} 
              backgroundColor={`${COLORS.gold}20`} 
            />
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
      <BackHeader 
        title="Workout History" 
        subtitle={`${totalSessions} total sessions`} 
        onBack={() => navigation.goBack()} 
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalSessions}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
          </Text>
          <Text style={styles.summaryLabel}>Total Vol.</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.gold }]}>{totalPrs}</Text>
          <Text style={styles.summaryLabel}>PRs</Text>
        </Card>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.teal} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Failed to load workout history</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
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
      )}
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
  loader: { marginTop: 40 },
  errorState: { alignItems: "center", paddingVertical: 60 },
  errorText: { color: COLORS.red, fontSize: 13 },
});
