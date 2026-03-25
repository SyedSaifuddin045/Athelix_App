import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BackHeader, Card, CompactStatCard, Screen, ScreenState, SectionEyebrow, Tag } from "../../components";
import { useExerciseLookupQueries } from "../../features/exercises/hooks";
import { useWorkoutSessionQuery } from "../../features/workouts/hooks";
import type { ExerciseSet } from "../../features/workouts/schemas";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"SessionDetail">;

type GroupedSessionExercise = {
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSet[];
};

function calculateDurationMinutes(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) {
    return "In progress";
  }

  const startedAtMs = new Date(startedAt).getTime();
  const finishedAtMs = new Date(finishedAt).getTime();
  if (Number.isNaN(startedAtMs) || Number.isNaN(finishedAtMs) || finishedAtMs < startedAtMs) {
    return "Completed";
  }

  return `${Math.round((finishedAtMs - startedAtMs) / 60000)}m`;
}

function formatHeaderDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function calculateVolumeLoad(sets: ExerciseSet[]): string {
  const total = sets.reduce((sum, set) => {
    if (set.weight_kg === null || set.reps === null) {
      return sum;
    }

    return sum + set.weight_kg * set.reps;
  }, 0);

  return `${Math.round(total)} kg`;
}

function groupSetsByExercise(
  sets: ExerciseSet[],
  exerciseNames: Record<string, string | undefined>,
): GroupedSessionExercise[] {
  const map = new Map<string, ExerciseSet[]>();

  for (const set of sets) {
    map.set(set.exercise_id, [...(map.get(set.exercise_id) ?? []), set]);
  }

  return [...map.entries()].map(([exerciseId, groupedSets]) => ({
    exerciseId,
    exerciseName: exerciseNames[exerciseId] ?? `Exercise ${exerciseId}`,
    sets: groupedSets.sort((left, right) => left.set_number - right.set_number),
  }));
}

function formatSetType(set: ExerciseSet): string {
  if (set.set_type.toLowerCase() === "warmup") {
    return "W";
  }

  return `${set.set_number}`;
}

export function SessionDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { sessionId } = route.params;
  const sessionQuery = useWorkoutSessionQuery(sessionId);

  useFocusEffect(
    React.useCallback(() => {
      void sessionQuery.refetch();
    }, [sessionQuery]),
  );

  const exerciseLookup = useExerciseLookupQueries(
    sessionQuery.data?.sets.map((set) => set.exercise_id) ?? [],
  );
  const exerciseNameMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(exerciseLookup.map).map(([exerciseId, detail]) => [exerciseId, detail?.name]),
      ),
    [exerciseLookup.map],
  );

  const groupedExercises = useMemo(
    () => groupSetsByExercise(sessionQuery.data?.sets ?? [], exerciseNameMap),
    [exerciseNameMap, sessionQuery.data?.sets],
  );

  const personalRecordCount = sessionQuery.data?.sets.filter((set) => set.is_pr).length ?? 0;

  if (sessionQuery.isLoading && !sessionQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState title="Loading session" message="Fetching workout details and sets." loading />
      </Screen>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Session unavailable"
          message="The selected workout session could not be loaded."
          actionLabel="Retry"
          onAction={() => {
            void sessionQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader
        title={sessionQuery.data.name ?? `Workout Session #${sessionId}`}
        subtitle={formatHeaderDate(sessionQuery.data.started_at)}
        onBack={() => navigation.goBack()}
      />

      <Card style={[styles.headerCard, { borderColor: `${COLORS.teal}30` }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTags}>
            <Tag
              label={sessionQuery.data.is_completed ? "Completed" : "In Progress"}
              color={sessionQuery.data.is_completed ? COLORS.green : COLORS.orange}
              backgroundColor={sessionQuery.data.is_completed ? `${COLORS.green}20` : `${COLORS.orange}20`}
            />
            {sessionQuery.data.template_id ? (
              <Tag label={`Template #${sessionQuery.data.template_id}`} color={COLORS.teal} backgroundColor={`${COLORS.teal}20`} />
            ) : null}
            {sessionQuery.data.mesocycle_id ? (
              <Tag label={`Mesocycle #${sessionQuery.data.mesocycle_id}`} color={COLORS.purple} backgroundColor={`${COLORS.purple}20`} />
            ) : null}
          </View>
          {sessionQuery.data.mood ? <Text style={styles.moodText}>{sessionQuery.data.mood}</Text> : null}
        </View>

        <View style={styles.headerStats}>
          <CompactStatCard
            label="Duration"
            value={calculateDurationMinutes(sessionQuery.data.started_at, sessionQuery.data.finished_at)}
            valueColor={COLORS.teal}
          />
          <CompactStatCard
            label="Volume"
            value={calculateVolumeLoad(sessionQuery.data.sets)}
            valueColor={COLORS.green}
          />
          <CompactStatCard
            label="PRs"
            value={`${personalRecordCount}`}
            valueColor={COLORS.gold}
          />
        </View>

        {sessionQuery.data.notes ? (
          <View style={styles.notesSection}>
            <Feather name="message-circle" size={14} color={COLORS.muted} />
            <Text style={styles.notesText}>{sessionQuery.data.notes}</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>
          Exercises ({groupedExercises.length})
        </SectionEyebrow>

        {groupedExercises.map((exercise) => (
          <Card key={exercise.exerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                <Text style={styles.exerciseSets}>{exercise.sets.length} logged sets</Text>
              </View>
              {exercise.sets.some((set) => set.is_pr) ? (
                <Tag label="PR" color={COLORS.gold} backgroundColor={`${COLORS.gold}20`} />
              ) : null}
            </View>

            <View style={styles.setsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 44 }]}>Set</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Reps</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>RPE</Text>
              </View>

              {exercise.sets.map((set) => (
                <View
                  key={set.id}
                  style={[
                    styles.tableRow,
                    set.set_type.toLowerCase() === "warmup" ? styles.warmupRow : null,
                  ]}
                >
                  <View style={styles.setTypeBadge}>
                    <Text
                      style={[
                        styles.setTypeText,
                        set.set_type.toLowerCase() === "warmup" ? styles.warmupText : null,
                      ]}
                    >
                      {formatSetType(set)}
                    </Text>
                  </View>
                  <Text style={styles.tableCell}>
                    {set.weight_kg === null ? "-" : `${set.weight_kg}`}
                  </Text>
                  <Text style={styles.tableCell}>{set.reps === null ? "-" : `${set.reps}`}</Text>
                  <Text style={styles.tableCell}>{set.rpe === null ? "-" : `${set.rpe}`}</Text>
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
  headerCard: { marginTop: 16, borderWidth: 1 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1, paddingRight: 12 },
  moodText: { fontSize: 28 },
  headerStats: { flexDirection: "row", gap: 8, marginTop: 18 },
  notesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  notesText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 20 },
  section: { marginTop: 24 },
  exerciseCard: { marginTop: 12 },
  exerciseHeader: { flexDirection: "row", alignItems: "center" },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  exerciseSets: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  setsTable: { marginTop: 16 },
  tableHeader: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  tableHeaderText: { color: "rgba(255,255,255,0.3)", fontSize: 10, textAlign: "center" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  warmupRow: { opacity: 0.6 },
  setTypeBadge: { width: 44, alignItems: "center" },
  setTypeText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  warmupText: { color: COLORS.orange },
  tableCell: { flex: 1, color: COLORS.text, fontSize: 13, textAlign: "center" },
});
