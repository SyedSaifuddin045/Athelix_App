import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, CompactStatCard, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useWorkoutSession } from "../../hooks";

type Props = RootStackScreenProps<"SessionDetail">;

export function SessionDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { id } = route.params;
  const { data: session, isLoading, error } = useWorkoutSession(id);

  if (isLoading) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <BackHeader title="Session" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </Screen>
    );
  }

  if (error || !session) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <BackHeader title="Session" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load session</Text>
        </View>
      </Screen>
    );
  }

  const completedAt = session.completed_at 
    ? new Date(session.completed_at).toLocaleDateString() 
    : new Date(session.started_at).toLocaleDateString();

  const duration = session.duration_minutes || 0;

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader 
        title={session.name} 
        subtitle={completedAt} 
        onBack={() => navigation.goBack()} 
      />

      <Card style={[styles.headerCard, { borderColor: `${COLORS.teal}30` }]}>
        <View style={styles.moodRow}>
          <Text style={styles.moodEmoji}>{session.mood || "💪"}</Text>
          <View style={styles.headerStats}>
            <CompactStatCard label="Duration" value={`${duration}m`} valueColor={COLORS.teal} />
            <CompactStatCard label="Volume" value={`${session.total_volume || 0}kg`} valueColor={COLORS.green} />
            <CompactStatCard label="PRs" value={`${session.prs_count}`} valueColor={COLORS.gold} />
          </View>
        </View>
        {session.notes && (
          <View style={styles.notesSection}>
            <Feather name="message-circle" size={14} color={COLORS.muted} />
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        )}
      </Card>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Exercises ({session.exercises?.length || 0})</SectionEyebrow>

        {(session.exercises || []).map((exercise, index) => (
          <Card key={exercise.id || index} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseEmoji}>{exercise.exercise_emoji || "🏋️"}</Text>
              <View style={styles.exerciseInfo}>
                <View style={styles.exerciseNameRow}>
                  <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                </View>
                <Text style={styles.exerciseSets}>{exercise.sets?.length || 0} sets</Text>
              </View>
            </View>

            <View style={styles.setsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 40 }]}>Set</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Reps</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>RPE</Text>
              </View>

              {(exercise.sets || []).map((set, setIndex) => (
                <View key={set.id || setIndex} style={[styles.tableRow, set.is_warmup && styles.warmupRow]}>
                  <View style={[styles.setTypeBadge, set.is_warmup && styles.warmupBadge]}>
                    <Text style={[styles.setTypeText, set.is_warmup && styles.warmupText]}>
                      {set.is_warmup ? "W" : set.set_number}
                    </Text>
                  </View>
                  <Text style={styles.tableCell}>{set.weight}</Text>
                  <Text style={styles.tableCell}>{set.reps}</Text>
                  <Text style={styles.tableCell}>{set.rpe || "-"}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
  },
  headerCard: { marginTop: 16, borderWidth: 1 },
  moodRow: { flexDirection: "row", alignItems: "center" },
  moodEmoji: { fontSize: 48 },
  headerStats: { flex: 1, flexDirection: "row", marginLeft: 16 },
  notesSection: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  notesText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 20 },
  section: { marginTop: 24 },
  exerciseCard: { marginTop: 12 },
  exerciseHeader: { flexDirection: "row", alignItems: "center" },
  exerciseEmoji: { fontSize: 28 },
  exerciseInfo: { flex: 1, marginLeft: 12 },
  exerciseNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseName: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  exerciseSets: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  setsTable: { marginTop: 16 },
  tableHeader: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  tableHeaderText: { color: "rgba(255,255,255,0.3)", fontSize: 10, textAlign: "center" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  warmupRow: { opacity: 0.6 },
  setTypeBadge: { width: 40, alignItems: "center" },
  warmupBadge: {},
  setTypeText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  warmupText: { color: COLORS.orange },
  tableCell: { flex: 1, color: COLORS.text, fontSize: 13, textAlign: "center" },
});
