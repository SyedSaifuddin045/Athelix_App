import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, BackHeader, CompactStatCard, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useWorkoutSession, useExercisesByIds } from "../../hooks";

type Props = RootStackScreenProps<"SessionDetail">;

interface GroupedExercise {
  exercise_id: string;
  sets: {
    id: number;
    set_number: number;
    set_type: string;
    reps: number | null;
    weight_kg: number | null;
    rpe: number | null;
  }[];
}

export function SessionDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { id } = route.params;
  const { data: session, isLoading, error } = useWorkoutSession(id);

  console.log("[SessionDetail] session:", JSON.stringify(session, null, 2));
  console.log("[SessionDetail] session.sets:", session?.sets);
  console.log("[SessionDetail] sets count:", session?.sets?.length || 0);

  const uniqueExerciseIds = useMemo(() => {
    if (!session?.sets || session.sets.length === 0) {
      console.log("[SessionDetail] No sets found, returning empty array");
      return [];
    }
    const ids = [...new Set(session.sets.map((set) => set.exercise_id))];
    console.log("[SessionDetail] uniqueExerciseIds:", ids);
    return ids;
  }, [session?.sets]);

  const { data: exerciseDetails, isLoading: isLoadingExercises } = useExercisesByIds(uniqueExerciseIds);
  console.log("[SessionDetail] exerciseDetails:", exerciseDetails?.length || 0);

  const exerciseNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    exerciseDetails?.forEach((ex) => {
      map[ex.id] = ex.name;
    });
    console.log("[SessionDetail] exerciseNameMap:", map);
    return map;
  }, [exerciseDetails]);

  const groupedExercises = useMemo(() => {
    if (!session?.sets || session.sets.length === 0) {
      console.log("[SessionDetail] No sets to group");
      return [];
    }
    
    const grouped: Record<string, GroupedExercise> = {};
    
    session.sets.forEach((set) => {
      if (!grouped[set.exercise_id]) {
        grouped[set.exercise_id] = {
          exercise_id: set.exercise_id,
          sets: [],
        };
      }
      grouped[set.exercise_id].sets.push({
        id: set.id,
        set_number: set.set_number,
        set_type: set.set_type,
        reps: set.reps,
        weight_kg: set.weight_kg,
        rpe: set.rpe,
      });
    });
    
    const result = Object.values(grouped);
    console.log("[SessionDetail] groupedExercises:", result.length);
    return result;
  }, [session?.sets]);

  const totalVolume = useMemo(() => {
    if (!session?.sets) return 0;
    return session.sets.reduce((sum, set) => sum + (set.weight_kg || 0) * (set.reps || 0), 0);
  }, [session?.sets]);

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
          <Pressable onPress={() => (navigation as any).navigate("MainTabs")} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Go to Home</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const completedAt = session.finished_at 
    ? new Date(session.finished_at).toLocaleDateString() 
    : new Date(session.started_at).toLocaleDateString();

  const duration = session.duration_minutes || Math.round((new Date(session.finished_at || session.started_at).getTime() - new Date(session.started_at).getTime()) / 60000);

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <BackHeader 
          title={session.name || "Workout Session"} 
          subtitle={completedAt}
          onBack={() => navigation.goBack()} 
        />
        <Pressable 
          onPress={() => (navigation as any).navigate("MainTabs")}
          style={styles.doneButton}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>

      <Card style={[styles.headerCard, { borderColor: `${COLORS.teal}30` }]}>
        <View style={styles.moodRow}>
          <Text style={styles.moodEmoji}>{session.mood || "💪"}</Text>
          <View style={styles.headerStats}>
            <CompactStatCard label="Duration" value={`${duration}m`} valueColor={COLORS.teal} />
            <CompactStatCard label="Volume" value={`${Math.round(totalVolume)}kg`} valueColor={COLORS.green} />
            <CompactStatCard label="PRs" value={`0`} valueColor={COLORS.gold} />
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
        <SectionEyebrow color={COLORS.purple}>Exercises ({groupedExercises.length})</SectionEyebrow>

        {isLoadingExercises && groupedExercises.length === 0 && (
          <ActivityIndicator size="small" color={COLORS.teal} style={{ marginTop: 20 }} />
        )}

        {groupedExercises.length === 0 && !isLoadingExercises && (
          <Text style={styles.emptyText}>No exercises logged</Text>
        )}

        {groupedExercises.map((exercise, index) => (
          <Card key={exercise.exercise_id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <View style={styles.exerciseNameRow}>
                  <Text style={styles.exerciseName}>{exerciseNameMap[exercise.exercise_id] || exercise.exercise_id}</Text>
                </View>
                <Text style={styles.exerciseSets}>{exercise.sets.length} sets</Text>
              </View>
            </View>

            <View style={styles.setsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 40 }]}>Set</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Reps</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>RPE</Text>
              </View>

              {exercise.sets.map((set, setIndex) => (
                <View key={set.id || setIndex} style={[styles.tableRow, set.set_type === "warmup" && styles.warmupRow]}>
                  <View style={[styles.setTypeBadge, set.set_type === "warmup" && styles.warmupBadge]}>
                    <Text style={[styles.setTypeText, set.set_type === "warmup" && styles.warmupText]}>
                      {set.set_type === "warmup" ? "W" : set.set_number}
                    </Text>
                  </View>
                  <Text style={styles.tableCell}>{set.weight_kg || 0}</Text>
                  <Text style={styles.tableCell}>{set.reps || 0}</Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.teal,
  },
  doneButtonText: {
    color: COLORS.root,
    fontSize: 14,
    fontWeight: "700",
  },
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
    marginBottom: 16,
  },
  headerCard: { marginTop: 16, borderWidth: 1 },
  moodRow: { flexDirection: "row", alignItems: "center" },
  moodEmoji: { fontSize: 48 },
  headerStats: { flex: 1, flexDirection: "row", marginLeft: 16 },
  notesSection: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  notesText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 20 },
  section: { marginTop: 24 },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: "center", marginTop: 20 },
  exerciseCard: { marginTop: 12 },
  exerciseHeader: { flexDirection: "row", alignItems: "center" },
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
