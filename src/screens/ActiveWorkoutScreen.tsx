import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";

import { useTemplateDetailQuery, useExercisesQuery, useSessionDetailQuery } from "../api/queries";
import type { ExerciseResponse } from "../api/model";
import {
  deleteExerciseSetWorkoutSessionsSessionIdSetsSetIdDelete,
  updateExerciseSetWorkoutSessionsSessionIdSetsSetIdPatch,
  createExerciseSetWorkoutSessionsSessionIdSetsPost,
  updateWorkoutSessionWorkoutSessionsSessionIdPatch,
  deleteWorkoutSessionWorkoutSessionsSessionIdDelete,
} from "../api/endpoints/workout-sessions/workout-sessions";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { SectionEyebrow, ProgressBar } from "../components/ui/Indicators";
import { MiniInput } from "../components/ui/Input";
import { PrimaryButton, IconButton } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Modal";
import { AppIcon } from "../design-system/icons/AppIcon";
import type { IconName } from "../components/ui/Icon";
import { ExercisePicker } from "../components/ExercisePicker";
import {
  exerciseLookup,
  workoutDraftFromTemplate,
  successData,
  WorkoutDraftExercise,
  WorkoutDraftSet,
} from "../utils/mapping";
import { nameForExercise, muscleAccentColor } from "../utils/display";
import { formatTime, parseDurationSec, parseDistanceM, formatDurationSec, formatDistanceM } from "../utils/format";
import { numberOrNull, rpeError } from "../utils/validation";
import { toNumberId } from "../utils/helpers";
import { Events } from "../analytics/events";

const GRID_COL_WIDTHS = { index: 32, input: 72, rpe: 44, checkbox: 36 } as const;

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
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface1Color = theme.surface1?.get() ?? "rgba(255,255,255,0.04)";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const surface3Color = theme.surface3?.get() ?? "rgba(255,255,255,0.07)";
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
  const [rpePicker, setRpePicker] = useState<{ exerciseId: string; setId: string } | null>(null);
  const template = useTemplateDetailQuery(templateId, isAuthenticated && !!templateId);
  const sessionDetail = useSessionDetailQuery(templateId ? undefined : sessionId, isAuthenticated && !!sessionId && !templateId);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);

  const isCardio = (exerciseId: string) => lookup.get(exerciseId)?.exercise_category === "cardio";

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
          return { ...ex, name: resolved ?? ex.name };
        }),
      );
      return;
    }
    const draft = workoutDraftFromTemplate(template.data, lookup).map((ex) => ({
      ...ex,
      exerciseCategory: lookup.get(ex.exerciseId)?.exercise_category ?? null,
    }));
    setExercises(draft);
    setExpanded(draft[0]?.id ?? null);
  }, [lookup, template.data]);

  useEffect(() => {
    if (template.data) return;
    if (!sessionDetail.data || lookup.size === 0) return;
    if (exercises.length > 0) return;
    const sets = sessionDetail.data.sets ?? [];
    if (sets.length === 0) return;
    const exerciseMap = new Map<string, typeof sets>();
    for (const set of sets) {
      const arr = exerciseMap.get(set.exercise_id) ?? [];
      arr.push(set);
      exerciseMap.set(set.exercise_id, arr);
    }
    const draft: WorkoutDraftExercise[] = [];
    for (const [exerciseId, exSets] of exerciseMap) {
      exSets.sort((a, b) => a.set_number - b.set_number);
      draft.push({
        id: exerciseId,
        exerciseId,
        name: nameForExercise(exerciseId, lookup) ?? exerciseId,
        notes: "",
        exerciseCategory: lookup.get(exerciseId)?.exercise_category ?? null,
        sets: exSets.map((s) => ({
          id: `${exerciseId}-${s.set_number}`,
          weight: s.weight_kg != null ? String(s.weight_kg) : "",
          reps: s.reps != null ? String(s.reps) : "",
          duration_sec: s.duration_sec != null ? String(s.duration_sec) : "",
          distance_m: s.distance_m != null ? String(s.distance_m) : "",
          rpe: s.rpe != null ? String(s.rpe) : "",
          done: false,
          warmup: false,
          serverId: s.id,
        })),
      });
    }
    setExercises(draft);
    setExpanded(draft[0]?.id ?? null);
  }, [lookup, sessionDetail.data, template.data]);

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
    const cardio = exercise.exerciseCategory === "cardio";
    const payload = {
      exercise_id: exercise.exerciseId,
      set_number: Math.max(1, setNumber),
      set_type: set.warmup ? "warmup" : ("working" as const),
      reps: cardio ? null : numberOrNull(set.reps),
      weight_kg: cardio ? null : numberOrNull(set.weight),
      duration_sec: cardio ? parseDurationSec(set.duration_sec) : null,
      distance_m: cardio ? parseDistanceM(set.distance_m) : null,
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

  const toggleSet = (exerciseId: string, setId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!exercise || !set) return;
    const shouldComplete = !set.done;
    setError("");

    setExercises((current) =>
      current.map((ce) =>
        ce.id === exerciseId
          ? { ...ce, sets: ce.sets.map((cs) => cs.id === setId ? { ...cs, done: shouldComplete } : cs) }
          : ce,
      ),
    );

    persistSet(exercise, { ...set, done: shouldComplete }, shouldComplete)
      .then((serverId) => {
        setExercises((current) =>
          current.map((ce) =>
            ce.id === exerciseId
              ? { ...ce, sets: ce.sets.map((cs) => cs.id === setId ? { ...cs, serverId } : cs) }
              : ce,
          ),
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
      })
      .catch((err) => {
        setExercises((current) =>
          current.map((ce) =>
            ce.id === exerciseId
              ? { ...ce, sets: ce.sets.map((cs) => cs.id === setId ? { ...cs, done: !shouldComplete } : cs) }
              : ce,
          ),
        );
        setError(getApiErrorMessage(err));
      });
  };

  const updateSet = (exerciseId: string, setId: string, field: "weight" | "reps" | "duration_sec" | "distance_m" | "rpe", value: string) => {
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
      current.map((ex) => {
        const last = ex.sets.filter((s) => !s.warmup).at(-1);
        const isCardioEx = isCardio(ex.exerciseId);
        const newSet: WorkoutDraftSet = {
          id: Date.now().toString(),
          weight: isCardioEx ? "" : (last?.weight ?? "60"),
          reps: isCardioEx ? "" : (last?.reps ?? "8"),
          duration_sec: isCardioEx ? (last?.duration_sec ?? "") : "",
          distance_m: isCardioEx ? (last?.distance_m ?? "") : "",
          rpe: "",
          done: false,
          warmup: false,
        };
        return ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex;
      }),
    );
  };

  const addExercise = (exercise: ExerciseResponse) => {
    const nextId = Date.now().toString();
    const isCardioEx = exercise.exercise_category === "cardio";
    const nextExercise: WorkoutDraftExercise = {
      id: nextId,
      exerciseId: exercise.id,
      exerciseCategory: exercise.exercise_category,
      name: exercise.name,
      notes: "",
      sets: [{
        id: `${nextId}-1`,
        weight: isCardioEx ? "" : "60",
        reps: isCardioEx ? "" : "8",
        duration_sec: isCardioEx ? "" : "",
        distance_m: isCardioEx ? "" : "",
        rpe: "",
        done: false,
        warmup: false,
      }],
    };
    setExercises((current) => [...current, nextExercise]);
    setExpanded(nextId);
    setShowExercisePicker(false);
    posthog.capture(Events.EXERCISE_ADDED, {
      exercise_name: exercise.name,
      exercise_id: exercise.id,
      exercise_muscle: exercise.target ?? null,
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
        <Card style={[{ marginTop: 0, paddingVertical: spacing.xl, borderRadius: 0, marginHorizontal: -20, paddingHorizontal: 20, borderLeftWidth: 0, borderRightWidth: 0, borderTopWidth: 0 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable
              style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingHorizontal: spacing.xl2,
                  paddingVertical: spacing.md,
                  borderRadius: radii.input,
                  backgroundColor: theme.colorRedDark?.get(),
                  borderColor: "rgba(239,68,68,0.25)",
                  borderWidth: 1,
                }}
              onPress={discardWorkout}
            >
              <AppIcon name="x" size={13} color={theme.colorRed?.get()} />
              <Text style={{ color: theme.colorRed?.get(), fontSize: 12, fontWeight: "600" }}>Discard</Text>
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: textColor, fontSize: 18, fontWeight: "900" }}>{formatTime(elapsed)}</Text>
              <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2 }}>
                {completedSets}/{totalSets} work sets done
              </Text>
            </View>
            <Pressable
              style={{
                  backgroundColor: accent,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingHorizontal: spacing.xl2,
                  paddingVertical: spacing.md,
                  borderRadius: radii.input,
                }}
              onPress={() => setShowFinish(true)}
            >
              <AppIcon name="check" size={13} color="#000000" />
              <Text style={{ color: "#000000", fontSize: 12, fontWeight: "800" }}>Finish</Text>
            </Pressable>
          </View>
          <View style={{ marginTop: spacing.xl2 }}>
            <ProgressBar value={totalSets ? (completedSets / totalSets) * 100 : 0} color={accent} />
          </View>
        </Card>

        {template.isPending && templateId ? <LoadingCard label="Loading template workout..." /> : null}
        {error ? (
          <View style={{ borderRadius: spacing.xl, paddingHorizontal: spacing.xl2, paddingVertical: spacing.xl, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: spacing.xl }}>
            <Text style={{ color: theme.colorRed?.get(), fontSize: 12 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl3, gap: spacing.xl }}>
          {exercises.map((exercise) => {
            const done = exercise.sets.filter((s) => s.done && !s.warmup).length;
            const total = exercise.sets.filter((s) => !s.warmup).length;
            return (
              <Card key={exercise.id} elevated style={{ paddingHorizontal: spacing.xl2, paddingVertical: spacing.xl2 }}>
                <Pressable
                  onPress={() => setExpanded((current) => (current === exercise.id ? null : exercise.id))}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                >
                  <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, { flex: 1 }]}>
                    <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: muscleAccentColor(lookup.get(exercise.exerciseId)?.target ?? lookup.get(exercise.exerciseId)?.body_part) ?? accent }} />
                    <Text style={[{ color: textColor, fontSize: 13, fontWeight: "700" }, { flex: 1 }]}>{exercise.name}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ color: "rgba(255,255,255,0.34)", fontSize: 10 }}>
                      {done}/{total}
                    </Text>
                    <AppIcon
                      name={expanded === exercise.id ? "chevron-up" : "chevron-down"}
                      size={15}
                      color={faintColor}
                    />
                  </View>
                </Pressable>
                {expanded === exercise.id ? (
                  <View style={{ marginTop: spacing.xl2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, marginBottom: 10 }}>
                      <Text style={[{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }, { width: GRID_COL_WIDTHS.index }]}>Set</Text>
                      <Text style={[{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }, { flex: 1 }]}>
                        {isCardio(exercise.exerciseId) ? "Time" : "kg"}
                      </Text>
                      <Text style={[{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }, { flex: 1 }]}>
                        {isCardio(exercise.exerciseId) ? "km" : "Reps"}
                      </Text>
                      <Text style={[{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }, { width: GRID_COL_WIDTHS.rpe }]}>RPE</Text>
                      <View style={{ width: GRID_COL_WIDTHS.checkbox }} />
                    </View>
                    <View style={{ gap: spacing.md }}>
                      {exercise.sets.map((set) => (
                        <View key={set.id} style={[{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }, set.done ? { opacity: 0.5 } : null]}>
                          <View style={{ width: GRID_COL_WIDTHS.index, alignItems: "center", justifyContent: "center" }}>
                            <Text style={[{ color: textColor, fontSize: 11, fontWeight: "700" }, { color: set.warmup ? theme.colorOrange?.get() : "rgba(255,255,255,0.55)" }]}>
                              {set.warmup ? "W" : exercise.sets.filter((item) => !item.warmup).indexOf(set) + 1}
                            </Text>
                          </View>
                          {isCardio(exercise.exerciseId) ? (
                            <>
                              <MiniInput
                                value={set.duration_sec}
                                onChangeText={(v) => updateSet(exercise.id, set.id, "duration_sec", v)}
                                placeholder="mm:ss"
                                strike={set.done}
                                style={{ width: GRID_COL_WIDTHS.input }}
                              />
                              <MiniInput
                                value={set.distance_m}
                                onChangeText={(v) => updateSet(exercise.id, set.id, "distance_m", v)}
                                placeholder="km"
                                strike={set.done}
                                keyboardType="decimal-pad"
                                style={{ width: GRID_COL_WIDTHS.input }}
                              />
                            </>
                          ) : (
                            <>
                              <MiniInput
                                value={set.weight}
                                onChangeText={(v) => updateSet(exercise.id, set.id, "weight", v)}
                                strike={set.done}
                                style={{ width: GRID_COL_WIDTHS.input }}
                              />
                              <MiniInput
                                value={set.reps}
                                onChangeText={(v) => updateSet(exercise.id, set.id, "reps", v)}
                                strike={set.done}
                                style={{ width: GRID_COL_WIDTHS.input }}
                              />
                            </>
                          )}
                          <Pressable
                            onPress={() => setRpePicker({ exerciseId: exercise.id, setId: set.id })}
                            style={{
                              width: GRID_COL_WIDTHS.rpe,
                              height: 38,
                              borderRadius: radii.stepper,
                              backgroundColor: surface2Color,
                              borderWidth: 1,
                              borderColor: borderColor,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: set.rpe ? textColor : faintColor, fontSize: 13, fontWeight: "600" }}>
                              {set.rpe || "-"}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => toggleSet(exercise.id, set.id)}
                            style={{
                                width: GRID_COL_WIDTHS.checkbox,
                                height: 36,
                                borderRadius: radii.iconWrap,
                                backgroundColor: set.done ? accent : surface2Color,
                                borderColor: set.done ? accent : borderColor,
                                borderWidth: 1,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                          >
                            {set.done ? <AppIcon name="check" size={15} color="#000000" /> : null}
                          </Pressable>
                        </View>
                      ))}
                    </View>
                    <Pressable
                      style={{
                          marginTop: spacing.lg,
                          minHeight: 42,
                          borderRadius: radii.input,
                          borderWidth: 1,
                          borderStyle: "dashed",
                          borderColor: "rgba(255,90,54,0.25)",
                          backgroundColor: "rgba(255,90,54,0.08)",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          gap: spacing.sm,
                        }}
                      onPress={() => addSet(exercise.id)}
                    >
                      <AppIcon name="plus" size={13} color={accent} />
                      <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>Add Set</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })}

          <Pressable onPress={() => setShowExercisePicker(true)}>
            <View
              style={{
                borderRadius: radii.card,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: borderColor,
                backgroundColor: surface1Color,
                padding: spacing.xl3,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xl,
              }}
            >
              <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,90,54,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
              >
                <AppIcon name="plus" size={18} color={accent} />
              </View>
              <Text style={[{ color: textColor, fontSize: 15, fontWeight: "800" }, { color: mutedColor }]}>Add Exercise</Text>
            </View>
          </Pressable>

          <Card elevated>
            <SectionEyebrow>Session Notes</SectionEyebrow>
            <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, { marginTop: spacing.xl, flexWrap: "wrap", gap: spacing.md }]}>
              {MOODS.map((entry) => (
                <Pressable
                  key={entry.label}
                  onPress={() => setMood(entry.label)}
                  style={{
                      width: 44,
                      height: 44,
                      borderRadius: radii.iconWrap,
                      backgroundColor: mood === entry.label ? "rgba(255,90,54,0.2)" : surface2Color,
                      borderColor: mood === entry.label ? "rgba(255,90,54,0.4)" : "transparent",
                      borderWidth: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                >
                  <AppIcon
                    name={entry.icon}
                    size={20}
                    color={mood === entry.label ? accent : mutedColor}
                  />
                </Pressable>
              ))}
            </View>
            <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, { alignItems: "flex-start", marginTop: spacing.xl2 }]}>
              <AppIcon
                name="file-text"
                size={14}
                color={faintColor}
                style={{ marginTop: spacing.lg }}
              />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="How did this session feel? Any notes..."
                placeholderTextColor={faintColor}
                style={{
                    flex: 1,
                    minHeight: 64,
                    borderRadius: radii.input,
                    backgroundColor: surface1Color,
                    borderWidth: 1,
                    borderColor: borderColor,
                    color: textColor,
                    paddingHorizontal: spacing.xl2,
                    paddingVertical: spacing.xl,
                    fontSize: 13,
                    textAlignVertical: "top",
                  }}
                multiline
              />
            </View>
          </Card>
        </View>

        <Modal visible={showFinish} transparent animationType="slide" onRequestClose={() => setShowFinish(false)}>
          <View style={{ backgroundColor: "rgba(0,0,0,0.72)", flex: 1, justifyContent: "flex-end" }}>
            <Pressable style={{ flex: 1 }} onPress={() => setShowFinish(false)} />
            <View
              style={{
                  backgroundColor: theme.surface?.get(),
                  borderTopLeftRadius: radii.sheet,
                  borderTopRightRadius: radii.sheet,
                  borderWidth: 1,
                  borderColor: borderColor,
                  paddingHorizontal: spacing.xl5,
                  paddingTop: spacing.xl2,
                  paddingBottom: spacing.xl6,
                }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 4,
                  alignSelf: "center",
                  backgroundColor: faintColor,
                  marginBottom: spacing.xl3,
                }}
              />
              <Text style={{ color: textColor, fontSize: 22, fontWeight: "900", textAlign: "center" }}>Finish Workout?</Text>
              <Text style={[{ color: mutedColor, fontSize: 13, textAlign: "center", marginTop: 6 }, { color: mutedColor, marginTop: spacing.sm }]}>
                {formatTime(elapsed)} elapsed - {completedSets}/{totalSets} sets completed
              </Text>
              <View
                style={[
                  { flexDirection: "row", alignItems: "center", gap: 10 },
                  {
                    marginTop: spacing.xl3,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: spacing.xl,
                  },
                ]}
              >
                <AppIcon name="smile" size={16} color={accent} />
                {MOODS.map((entry) => (
                  <Pressable
                    key={entry.label}
                    onPress={() => setMood(entry.label)}
                    style={{
                      opacity: mood && mood !== entry.label ? 0.45 : 1,
                      alignItems: "center",
                      gap: spacing.xxs,
                    }}
                  >
                    <AppIcon
                      name={entry.icon}
                      size={24}
                      color={mood === entry.label ? accent : mutedColor}
                    />
                  </Pressable>
                ))}
              </View>
              <PrimaryButton
                label="Finish & Save"
                onPress={() => void finishWorkout()}
                icon={<AppIcon name="check" size={16} color="#000000" />}
                style={{ marginTop: spacing.xl3 }}
              />
              <PrimaryButton
                label="Keep going"
                onPress={() => setShowFinish(false)}
                subtle
                style={{ marginTop: spacing.lg }}
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

        <Modal visible={!!rpePicker} transparent animationType="fade" onRequestClose={() => setRpePicker(null)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }} onPress={() => setRpePicker(null)}>
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: theme.surface?.get(),
                borderRadius: radii.card,
                padding: spacing.xl3,
                width: 260,
                borderWidth: 1,
                borderColor: borderColor,
              }}
            >
              <Text style={{ color: textColor, fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: spacing.xl }}>
                Rate of Perceived Exertion
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {[1,2,3,4,5,6,7,8,9,10].map((val) => {
                  const current = rpePicker
                    ? exercises.find((e) => e.id === rpePicker.exerciseId)
                        ?.sets.find((s) => s.id === rpePicker.setId)?.rpe
                    : "";
                  const isSelected = String(val) === current;
                  return (
                    <Pressable
                      key={val}
                      onPress={() => {
                        if (rpePicker) {
                          updateSet(rpePicker.exerciseId, rpePicker.setId, "rpe", String(val));
                          setRpePicker(null);
                        }
                      }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isSelected ? accent : surface2Color,
                        borderWidth: 1,
                        borderColor: isSelected ? accent : borderColor,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: isSelected ? "#000" : textColor, fontSize: 15, fontWeight: "700" }}>{val}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => setRpePicker(null)} style={{ marginTop: spacing.xl, alignItems: "center" }}>
                <Text style={{ color: mutedColor, fontSize: 13 }}>Clear</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

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
