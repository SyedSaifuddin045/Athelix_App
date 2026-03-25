import React, { useMemo } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BackHeader, Card, Screen, ScreenState, SectionEyebrow, Tag } from "../../components";
import { useWorkoutSessionsQuery } from "../../features/workouts/hooks";
import type { WorkoutSession } from "../../features/workouts/schemas";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"WorkoutHistory">;

type SessionSection = {
  title: string;
  data: WorkoutSession[];
};

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - diff);
  return result;
}

function groupSessions(sessions: WorkoutSession[]): SessionSection[] {
  const now = new Date();
  const currentWeekStart = startOfWeek(now).getTime();
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const groups = new Map<string, WorkoutSession[]>();

  for (const session of sessions) {
    const startedAt = new Date(session.started_at);
    const startedTime = startedAt.getTime();
    let title = "Earlier";

    if (startedTime >= currentWeekStart) {
      title = "This Week";
    } else if (startedTime >= lastWeekStart.getTime()) {
      title = "Last Week";
    } else {
      title = startedAt.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }

    groups.set(title, [...(groups.get(title) ?? []), session]);
  }

  return [...groups.entries()].map(([title, data]) => ({
    title,
    data,
  }));
}

function formatSessionDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDurationMinutes(session: WorkoutSession): string {
  if (!session.finished_at) {
    return "In progress";
  }

  const startedAt = new Date(session.started_at).getTime();
  const finishedAt = new Date(session.finished_at).getTime();
  if (Number.isNaN(startedAt) || Number.isNaN(finishedAt) || finishedAt < startedAt) {
    return "Completed";
  }

  return `${Math.round((finishedAt - startedAt) / 60000)} min`;
}

export function WorkoutHistoryScreen({ navigation }: Props): React.JSX.Element {
  const sessionsQuery = useWorkoutSessionsQuery();

  useFocusEffect(
    React.useCallback(() => {
      void sessionsQuery.refetch();
    }, [sessionsQuery]),
  );

  const sections = useMemo(
    () => groupSessions(sessionsQuery.data ?? []),
    [sessionsQuery.data],
  );

  const completedSessions = sessionsQuery.data?.filter((session) => session.is_completed) ?? [];
  const activeSessions = sessionsQuery.data?.filter((session) => !session.is_completed) ?? [];

  if (sessionsQuery.isLoading && !sessionsQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState title="Loading history" message="Fetching workout sessions." loading />
      </Screen>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="History unavailable"
          message="The app could not load workout sessions."
          actionLabel="Retry"
          onAction={() => {
            void sessionsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
      <BackHeader
        title="Workout History"
        subtitle={`${sessionsQuery.data?.length ?? 0} total sessions`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{sessionsQuery.data?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.teal }]}>{completedSessions.length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.orange }]}>{activeSessions.length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </Card>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("SessionDetail", {
                sessionId: item.id,
              })
            }
          >
            <Card style={styles.sessionCard}>
              <View style={styles.sessionRow}>
                <View style={styles.sessionLeft}>
                  <View style={styles.moodBadge}>
                    {item.mood ? (
                      <Text style={styles.moodText}>{item.mood}</Text>
                    ) : (
                      <Feather name={item.is_completed ? "check-circle" : "clock"} size={16} color={item.is_completed ? COLORS.teal : COLORS.orange} />
                    )}
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{item.name ?? `Workout Session #${item.id}`}</Text>
                    <Text style={styles.sessionDate}>{formatSessionDate(item.started_at)}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
              </View>

              <View style={styles.sessionStats}>
                <View style={styles.sessionStat}>
                  <Feather name="clock" size={12} color={COLORS.muted} />
                  <Text style={styles.sessionStatText}>{getDurationMinutes(item)}</Text>
                </View>
                {item.template_id ? (
                  <Tag label={`Template #${item.template_id}`} color={COLORS.teal} backgroundColor={`${COLORS.teal}18`} />
                ) : null}
                {item.mesocycle_id ? (
                  <Tag label={`Mesocycle #${item.mesocycle_id}`} color={COLORS.purple} backgroundColor={`${COLORS.purple}18`} />
                ) : null}
                <Tag
                  label={item.is_completed ? "Completed" : "Active"}
                  color={item.is_completed ? COLORS.green : COLORS.orange}
                  backgroundColor={item.is_completed ? `${COLORS.green}20` : `${COLORS.orange}20`}
                />
              </View>

              {item.notes ? <Text style={styles.sessionNotes}>{item.notes}</Text> : null}
            </Card>
          </Pressable>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <SectionEyebrow color={COLORS.purple}>{section.title}</SectionEyebrow>
            <Text style={styles.sectionCount}>{section.data.length} sessions</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Start your first workout to build session history.</Text>
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
  moodBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  moodText: { fontSize: 16 },
  sessionInfo: { marginLeft: 12, flex: 1 },
  sessionName: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  sessionDate: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  sessionStats: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 12 },
  sessionStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionStatText: { color: COLORS.muted, fontSize: 11 },
  sessionNotes: { color: COLORS.faint, fontSize: 11, lineHeight: 18, marginTop: 12 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4, textAlign: "center" },
});
