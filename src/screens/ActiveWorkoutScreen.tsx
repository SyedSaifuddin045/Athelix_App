import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "@clerk/expo";

import { useTemplateDetailQuery, useExercisesQuery } from "../api/queries";
import {
  deleteExerciseSetWorkoutSessionsSessionIdSetsSetIdDelete,
  updateExerciseSetWorkoutSessionsSessionIdSetsSetIdPatch,
  createExerciseSetWorkoutSessionsSessionIdSetsPost,
  updateWorkoutSessionWorkoutSessionsSessionIdPatch,
  deleteWorkoutSessionWorkoutSessionsSessionIdDelete,
} from "../api/endpoints/workout-sessions/workout-sessions";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS, SHADOWS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { SectionEyebrow, ProgressBar } from "../components/ui/Indicators";
import { MiniInput } from "../components/ui/Input";
import { PrimaryButton, IconButton } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Modal";
import { Icon } from "../components/ui/Icon";
import { ExercisePicker } from "../components/ExercisePicker";
import {
  exerciseLookup,
  workoutDraftFromTemplate,
  successData,
  WorkoutDraftExercise,
  WorkoutDraftSet,
} from "../utils/mapping";
import { nameForExercise, exerciseEmoji } from "../utils/display";
import { formatTime } from "../utils/format";
import { numberOrNull, rpeError } from "../utils/validation";
import { toNumberId } from "../utils/helpers";
import { Events } from "../analytics/events";

const MOODS = [
  { icon: "sleep" as const, label: "Tired" },
  { icon: "meh" as const, label: "Okay" },
  { icon: "smile" as const, label: "Good" },
  { icon: "zap" as const, label: "Strong" },
  { icon: "flame" as const, label: "Beast" },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ActiveWorkout">;
  route: RouteProp<RootStackParamList, "ActiveWorkout">;
};

export function ActiveWorkoutScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const sessionId = route?.params?.sessionId;
  const templateId = toNumberId(route?.params?.templateId);
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<WorkoutDraftExercise[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showFinish, setShowFinish] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [error, setError] = useState("");
  const template = useTemplateDetailQuery(templateId, isAuthenticated && !!templateId);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!template.data || lookup.size === 0) return;
    if (exercises.length > 0) {
      setExercises((prev) =>
        prev.map((ex) => {
          const resolved = nameForExercise(ex.exerciseId, lookup);
          return { ...ex, name: resolved ?? ex.name, emoji: exerciseEmoji(lookup.get(ex.exerciseId)) };
        }),
      );
      return;
    }
    const draft = workoutDraftFromTemplate(template.data, lookup);
    setExercises(draft);
    setExpanded(draft[0]?.id ?? null);
  }, [lookup, template.data]);

  const completedSets = exercises.flatMap((ex) => ex.sets.filter((s) => s.done && !s.warmup)).length;
  const totalSets = exercises.flatMap((ex) => ex.sets.filter((s) => !s.warmup)).length;

  const persistSet = async (exercise: WorkoutDraftExercise, set: WorkoutDraftSet, shouldComplete: boolean) => {
    if (!sessionId) throw new Error("Session was not created.");
    if (!shouldComplete) {
      if (set.serverId) await deleteExerciseSetWorkoutSessionsSessionIdSetsSetIdDelete(sessionId, set.serverId);
      return undefined;
    }
    const rpeErr = rpeError(set.rpe);
    if (rpeErr) throw new Error(`"${exercise.name}": ${rpeErr}`);
    const setNumber = exercise.sets.filter((item) => !item.warmup).findIndex((item) => item.id === set.id) + 1;
    const payload = {
      exercise_id: exercise.exerciseId,
      set_number: Math.max(1, setNumber),
      set_type: set.warmup ? "warmup" : ("working" as const),
      reps: numberOrNull(set.reps),
      weight_kg: numberOrNull(set.weight),
      rpe: numberOrNull(set.rpe),
      is_pr: false,
      notes: null,
      logged_at: new Date().toISOString(),
    };
    if (set.serverId) {
      const response = await updateExerciseSetWorkoutSessionsSessionIdSetsSetIdPatch(sessionId, set.serverId, payload);
      return successData(response).id;
    }
    const response = await createExerciseSetWorkoutSessionsSessionIdSetsPost(sessionId, payload);
    return successData(response).id;
  };

  const toggleSet = async (exerciseId: string, setId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!exercise || !set) return;
    const shouldComplete = !set.done;
    setError("");
    try {
      const serverId = await persistSet(exercise, set, shouldComplete);
      setExercises((current) =>
        current.map((ce) =>
          ce.id === exerciseId
            ? {
                ...ce,
                sets: ce.sets.map((cs) =>
                  cs.id === setId ? { ...cs, done: shouldComplete, serverId: shouldComplete ? serverId : undefined } : cs,
                ),
              }
            : ce,
        ),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const updateSet = (exerciseId: string, setId: string, field: "weight" | "reps" | "rpe", value: string) => {
    setExercises((current) =>
      current.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)) }
          : ex,
      ),
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((current) =>
      current.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: Date.now().toString(),
                  weight: ex.sets.filter((s) => !s.warmup).at(-1)?.weight ?? "60",
                  reps: ex.sets.filter((s) => !s.warmup).at(-1)?.reps ?? "8",
                  rpe: "",
                  done: false,
                  warmup: false,
                },
              ],
            }
          : ex,
      ),
    );
  };

  const addExercise = (exercise: any) => {
    const nextId = Date.now().toString();
    const nextExercise: WorkoutDraftExercise = {
      id: nextId,
      exerciseId: exercise.id,
      name: exercise.name,
      emoji: exerciseEmoji(exercise),
      notes: "",
      sets: [{ id: `${nextId}-1`, weight: "60", reps: "8", rpe: "", done: false, warmup: false }],
    };
    setExercises((current) => [...current, nextExercise]);
    setExpanded(nextId);
    setShowExercisePicker(false);
    posthog.capture(Events.EXERCISE_ADDED, {
      exercise_name: exercise.name,
      exercise_id: exercise.id,
      exercise_muscle: exercise.muscle_group ?? exercise.primary_muscle ?? undefined,
    });
  };

  const confirmDiscard = async () => {
    if (sessionId) {
      try {
        await deleteWorkoutSessionWorkoutSessionsSessionIdDelete(sessionId);
        queryClient.removeQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      } catch (err) {
        Alert.alert("Error", getApiErrorMessage(err));
        return;
      }
    }
    const loggedSets = exercises.flatMap((ex) => ex.sets.filter((s) => s.done)).length;
    posthog.capture(Events.WORKOUT_DISCARDED, {
      duration_minutes: Math.floor(elapsed / 60),
      sets_logged: loggedSets,
    });
    setShowDiscardConfirm(false);
    navigation.goBack();
  };

  const discardWorkout = () => {
    setShowDiscardConfirm(true);
  };

  const finishWorkout = async () => {
    if (!sessionId) return;
    if (!isAuthenticated) {
      setError("Session expired. Please log in again.");
      return;
    }
    setError("");
    try {
      await updateWorkoutSessionWorkoutSessionsSessionIdPatch(sessionId, {
        finished_at: new Date().toISOString(),
        is_completed: true,
        mood,
        notes: note || null,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      posthog.capture(Events.WORKOUT_COMPLETED, {
        duration_minutes: Math.floor(elapsed / 60),
        total_sets: totalSets,
        work_sets: completedSets,
        total_exercises: exercises.length,
        has_notes: !!note,
        ...(mood ? { mood } : {}),
      });
      setShowFinish(false);
      navigation.replace("SessionDetail", { id: String(sessionId) });
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (msg.includes("fetch") || msg.includes("network")) {
        setError("Network error. Check your connection and try again.");
      } else {
        setError(msg);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <Card style={[styles.stickyCard, { marginTop: 0, paddingVertical: SPACING.xl }]}>
          <View style={styles.rowBetween}>
            <Pressable
              style={[
                styles.dangerPill,
                {
                  backgroundColor: COLORS.redDark,
                  borderColor: "rgba(239,68,68,0.25)",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.sm,
                  paddingHorizontal: SPACING.xl2,
                  paddingVertical: SPACING.md,
                  borderRadius: RADIUS.input,
                },
              ]}
              onPress={discardWorkout}
            >
              <Icon name="x" size={13} color={COLORS.red} />
              <Text style={styles.dangerPillText}>Discard</Text>
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
              <Text style={styles.timerSubtext}>
                {completedSets}/{totalSets} work sets done
              </Text>
            </View>
            <Pressable
              style={[
                styles.finishPill,
                {
                  backgroundColor: COLORS.teal,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.sm,
                  paddingHorizontal: SPACING.xl2,
                  paddingVertical: SPACING.md,
                  borderRadius: RADIUS.input,
                },
              ]}
              onPress={() => setShowFinish(true)}
            >
              <Icon name="check" size={13} color="#000000" />
              <Text style={styles.finishPillText}>Finish</Text>
            </Pressable>
          </View>
          <View style={{ marginTop: SPACING.xl2 }}>
            <ProgressBar value={totalSets ? (completedSets / totalSets) * 100 : 0} color={COLORS.teal} />
          </View>
        </Card>

        {template.isPending && templateId ? <LoadingCard label="Loading template workout..." /> : null}
        {error ? (
          <View style={[styles.errorBox, { marginTop: SPACING.xl }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl }}>
          {exercises.map((exercise) => {
            const done = exercise.sets.filter((s) => s.done && !s.warmup).length;
            const total = exercise.sets.filter((s) => !s.warmup).length;
            return (
              <Card key={exercise.id} elevated style={{ paddingHorizontal: SPACING.xl2, paddingVertical: SPACING.xl2 }}>
                <Pressable
                  onPress={() => setExpanded((current) => (current === exercise.id ? null : exercise.id))}
                  style={styles.rowBetween}
                >
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    <Text style={{ fontSize: 22 }}>{exercise.emoji}</Text>
                    <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
                  </View>
                  <View style={styles.rowGap}>
                    <Text style={styles.listMeta}>
                      {done}/{total}
                    </Text>
                    <Icon
                      name={expanded === exercise.id ? "chevron-up" : "chevron-down"}
                      size={15}
                      color={COLORS.faint}
                    />
                  </View>
                </Pressable>
                {expanded === exercise.id ? (
                  <View style={{ marginTop: SPACING.xl2 }}>
                    <View style={styles.workoutGridHeader}>
                      {["Set", "kg", "Reps", "RPE", ""].map((label) => (
                        <Text
                          key={label}
                          style={[
                            styles.gridHeaderText,
                            label === "" ? { width: 36 } : { flex: 1 },
                          ]}
                        >
                          {label}
                        </Text>
                      ))}
                    </View>
                    <View style={{ gap: SPACING.md }}>
                      {exercise.sets.map((set) => (
                        <View
                          key={set.id}
                          style={[styles.workoutGridRow, set.done ? { opacity: 0.5 } : null]}
                        >
                          <View style={styles.workoutGridIndex}>
                            <Text
                              style={[
                                styles.smallStrongText,
                                {
                                  color: set.warmup
                                    ? COLORS.orange
                                    : "rgba(255,255,255,0.55)",
                                },
                              ]}
                            >
                              {set.warmup
                                ? "W"
                                : exercise.sets.filter((item) => !item.warmup).indexOf(set) + 1}
                            </Text>
                          </View>
                          <MiniInput
                            value={set.weight}
                            onChangeText={(v) => updateSet(exercise.id, set.id, "weight", v)}
                            strike={set.done}
                          />
                          <MiniInput
                            value={set.reps}
                            onChangeText={(v) => updateSet(exercise.id, set.id, "reps", v)}
                            strike={set.done}
                          />
                          <MiniInput
                            value={set.rpe}
                            onChangeText={(v) => updateSet(exercise.id, set.id, "rpe", v)}
                            placeholder="-"
                          />
                          <Pressable
                            onPress={() => void toggleSet(exercise.id, set.id)}
                            style={[
                              styles.doneToggle,
                              {
                                width: 36,
                                height: 36,
                                borderRadius: RADIUS.iconWrap,
                                backgroundColor: set.done ? COLORS.teal : COLORS.cardSoft,
                                borderColor: set.done ? COLORS.teal : COLORS.border,
                                alignItems: "center",
                                justifyContent: "center",
                              },
                            ]}
                          >
                            {set.done ? <Icon name="check" size={15} color="#000000" /> : null}
                          </Pressable>
                        </View>
                      ))}
                    </View>
                    <Pressable
                      style={[
                        styles.dashedButton,
                        {
                          marginTop: SPACING.lg,
                          minHeight: 42,
                          borderRadius: RADIUS.input,
                          borderStyle: "dashed",
                          borderColor: "rgba(255,90,54,0.25)",
                          backgroundColor: "rgba(255,90,54,0.08)",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          gap: SPACING.sm,
                        },
                      ]}
                      onPress={() => addSet(exercise.id)}
                    >
                      <Icon name="plus" size={13} color={COLORS.teal} />
                      <Text style={styles.dashedButtonText}>Add Set</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })}

          <Pressable onPress={() => setShowExercisePicker(true)}>
            <View
              style={[
                styles.dashedAddCard,
                {
                  borderRadius: RADIUS.card,
                  borderStyle: "dashed",
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.card,
                  padding: SPACING.xl3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.xl,
                },
              ]}
            >
              <View
                style={[
                  styles.addCircle,
                  {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,90,54,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Icon name="plus" size={18} color={COLORS.teal} />
              </View>
              <Text style={[styles.cardTitle, { color: COLORS.muted }]}>Add Exercise</Text>
            </View>
          </Pressable>

          <Card elevated>
            <SectionEyebrow>Session Notes</SectionEyebrow>
            <View style={[styles.rowGap, { marginTop: SPACING.xl, flexWrap: "wrap", gap: SPACING.md }]}>
              {MOODS.map((entry) => (
                <Pressable
                  key={entry.label}
                  onPress={() => setMood(entry.label)}
                  style={[
                    styles.moodButton,
                    {
                      width: 44,
                      height: 44,
                      borderRadius: RADIUS.iconWrap,
                      backgroundColor: mood === entry.label ? "rgba(255,90,54,0.2)" : COLORS.cardSoft,
                      borderColor: mood === entry.label ? "rgba(255,90,54,0.4)" : "transparent",
                      borderWidth: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Icon
                    name={entry.icon}
                    size={20}
                    color={mood === entry.label ? COLORS.teal : COLORS.muted}
                  />
                </Pressable>
              ))}
            </View>
            <View style={[styles.rowGap, { alignItems: "flex-start", marginTop: SPACING.xl2 }]}>
              <Icon
                name="file-text"
                size={14}
                color={COLORS.faint}
                style={{ marginTop: SPACING.lg }}
              />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="How did this session feel? Any notes..."
                placeholderTextColor={COLORS.faint}
                style={[
                  styles.notesInput,
                  {
                    flex: 1,
                    minHeight: 64,
                    borderRadius: RADIUS.input,
                    backgroundColor: COLORS.card,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    color: COLORS.text,
                    paddingHorizontal: SPACING.xl2,
                    paddingVertical: SPACING.xl,
                    fontSize: 13,
                    textAlignVertical: "top",
                  },
                ]}
                multiline
              />
            </View>
          </Card>
        </View>

        <Modal visible={showFinish} transparent animationType="slide" onRequestClose={() => setShowFinish(false)}>
          <View style={[styles.modalScrim, { backgroundColor: "rgba(0,0,0,0.72)", flex: 1, justifyContent: "flex-end" }]}>
            <Pressable style={{ flex: 1 }} onPress={() => setShowFinish(false)} />
            <View
              style={[
                styles.bottomSheet,
                {
                  backgroundColor: COLORS.surface,
                  borderTopLeftRadius: RADIUS.sheet,
                  borderTopRightRadius: RADIUS.sheet,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  paddingHorizontal: SPACING.xl5,
                  paddingTop: SPACING.xl2,
                  paddingBottom: SPACING.xl6,
                },
              ]}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 4,
                  alignSelf: "center",
                  backgroundColor: COLORS.faint,
                  marginBottom: SPACING.xl3,
                }}
              />
              <Text style={styles.sheetTitle}>Finish Workout?</Text>
              <Text style={[styles.sheetSubtitle, { color: COLORS.muted, marginTop: SPACING.sm }]}>
                {formatTime(elapsed)} elapsed - {completedSets}/{totalSets} sets completed
              </Text>
              <View
                style={[
                  styles.rowGap,
                  {
                    marginTop: SPACING.xl3,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: SPACING.xl,
                  },
                ]}
              >
                <Icon name="smile" size={16} color={COLORS.teal} />
                {MOODS.map((entry) => (
                  <Pressable
                    key={entry.label}
                    onPress={() => setMood(entry.label)}
                    style={{
                      opacity: mood && mood !== entry.label ? 0.45 : 1,
                      alignItems: "center",
                      gap: SPACING.xxs,
                    }}
                  >
                    <Icon
                      name={entry.icon}
                      size={24}
                      color={mood === entry.label ? COLORS.teal : COLORS.muted}
                    />
                  </Pressable>
                ))}
              </View>
              <PrimaryButton
                label="Finish & Save"
                onPress={() => void finishWorkout()}
                icon={<Icon name="check" size={16} color="#000000" />}
                style={{ marginTop: SPACING.xl3 }}
              />
              <PrimaryButton
                label="Keep going"
                onPress={() => setShowFinish(false)}
                subtle
                style={{ marginTop: SPACING.lg }}
              />
            </View>
          </View>
        </Modal>

        <ExercisePicker
          variant="pick"
          visible={showExercisePicker}
          title="Add Exercise"
          enabled={isAuthenticated}
          onSelect={(exercise) => addExercise(exercise)}
          onClose={() => setShowExercisePicker(false)}
        />

        {showDiscardConfirm && (
          <ConfirmDialog
            title="Discard Workout"
            message="This will delete the session and all logged sets."
            confirmLabel="Discard"
            destructive
            onConfirm={confirmDiscard}
            onCancel={() => setShowDiscardConfirm(false)}
          />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
