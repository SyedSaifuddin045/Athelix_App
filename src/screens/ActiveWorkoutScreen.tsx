import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { usePressOpacity } from "../utils/usePressOpacity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
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

const GRID_COL_WIDTHS = { index: 32, input: 72, rpe: 60, checkbox: 36 } as const;
function SwipeableSetRow({ onToggle, children }: { onToggle: () => void; children: React.ReactNode }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.max(-100, Math.min(0, g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) {
          Animated.timing(translateX, { toValue: -80, duration: 150, useNativeDriver: true }).start(() => {
            onToggle();
            Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <View style={{ overflow: "hidden" }}>
      <View style={{ position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>SWIPE</Text>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const RPE_REFERENCE: { rpe: string; description: string }[] = [

  { rpe: "10", description: "Max effort — cannot complete another rep" },
  { rpe: "9", description: "1 rep left in tank" },
  { rpe: "8", description: "2 reps left in tank" },
  { rpe: "7", description: "3 reps left in tank — moderate speed" },
  { rpe: "6", description: "4 reps left — light speed" },
  { rpe: "5", description: "Warm-up pace — very light" },
  { rpe: "4", description: "Barely feels like work" },
  { rpe: "3", description: "Light effort" },
  { rpe: "2", description: "Very light" },
  { rpe: "1", description: "Minimal effort" },
];

const BARBELL_WEIGHT_KG = 20;
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

function calculatePlates(targetKg: number): { plate: number; perSide: number }[] {
  const remaining = targetKg - BARBELL_WEIGHT_KG;
  if (remaining <= 0) return [];
  let perSide = remaining / 2;
  const result: { plate: number; perSide: number }[] = [];
  for (const plate of PLATES_KG) {
    if (perSide < plate) continue;
    const count = Math.floor(perSide / plate);
    if (count > 0) {
      result.push({ plate, perSide: count });
      perSide -= count * plate;
    }
  }
  return result;
}

const MOODS = [
  { icon: "sleep" as const, label: "Tired" },
  { icon: "meh" as const, label: "Okay" },
  { icon: "smile" as const, label: "Good" },
  { icon: "zap" as const, label: "Strong" },
  { icon: "flame" as const, label: "Beast" },
];

interface WorkoutDraft {
  sessionId: number;
  exercises: WorkoutDraftExercise[];
  elapsed: number;
  mood: string | null;
  note: string;
  savedAt: string;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ActiveWorkout">;
  route: RouteProp<RootStackParamList, "ActiveWorkout">;
};

export function ActiveWorkoutScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)";
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
  const [rpeChartModal, setRpeChartModal] = useState(false);
  const [plateCalc, setPlateCalc] = useState<{ exerciseId: string; setId: string; weight: string } | null>(null);
  const [restTimer, setRestTimer] = useState<{ exerciseId: string; remaining: number; total: number } | null>(null);
  const draftRef = useRef({ exercises, elapsed, mood, note });
  const template = useTemplateDetailQuery(templateId, isAuthenticated && !!templateId);
  const sessionDetail = useSessionDetailQuery(templateId ? undefined : sessionId, isAuthenticated && !!sessionId && !templateId);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);

  const press = usePressOpacity();

  const isCardio = (exerciseId: string) => lookup.get(exerciseId)?.exercise_category === "cardio";

  useEffect(() => {
    const interval = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    draftRef.current = { exercises, elapsed, mood, note };
  });

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      const { exercises, elapsed, mood, note } = draftRef.current;
      const draft: WorkoutDraft = {
        sessionId,
        exercises,
        elapsed,
        mood,
        note,
        savedAt: new Date().toISOString(),
      };
      try {
        await AsyncStorage.setItem(`workout_draft_${sessionId}`, JSON.stringify(draft));
      } catch (e) {
        posthog.capture(Events.DRAFT_SAVE_FAILED, { error: String(e), sessionId });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    AsyncStorage.getItem(`workout_draft_${sessionId}`).then((saved) => {
      if (!saved) return;
      try {
        const draft = JSON.parse(saved) as WorkoutDraft;
        if (!draft.exercises?.length) return;
        Alert.alert(
          "Unsaved workout found",
          "Restore your previous workout data?",
          [
            { text: "Discard", style: "destructive" as const, onPress: () => { AsyncStorage.removeItem(`workout_draft_${sessionId}`); } },
            {
              text: "Restore",
              onPress: () => {
                setExercises(draft.exercises);
                setElapsed(draft.elapsed);
                if (draft.mood) setMood(draft.mood);
                setNote(draft.note);
              },
            },
          ],
        );
      } catch (e) {
        posthog.capture(Events.DRAFT_RESTORE_FAILED, { error: String(e), sessionId });
      }
    }).catch((e) => {
      posthog.capture(Events.DRAFT_RESTORE_FAILED, { error: String(e), sessionId });
    });
  }, [sessionId]);

  useEffect(() => {
    if (!restTimer || restTimer.remaining <= 0) {
      if (restTimer && restTimer.remaining <= 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setRestTimer(null);
      return;
    }
    const id = setTimeout(() => {
      setRestTimer((prev) => prev ? { ...prev, remaining: prev.remaining - 1 } : null);
    }, 1000);
    return () => clearTimeout(id);
  }, [restTimer]);

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

  const restSecsMap = useMemo(() => {
    const map = new Map<string, number>();
    if (template.data?.exercises) {
      for (const ex of template.data.exercises) {
        map.set(ex.exercise_id, ex.rest_seconds ?? 90);
      }
    }
    return map;
  }, [template.data]);

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

  const clearDraft = useCallback(async () => {
    if (!sessionId) return;
    try {
      await AsyncStorage.removeItem(`workout_draft_${sessionId}`);
    } catch (e) {
      posthog.capture(Events.DRAFT_CLEAR_FAILED, { error: String(e), sessionId });
    }
  }, [sessionId]);

  const toggleSet = (exerciseId: string, setId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!exercise || !set) return;
    const shouldComplete = !set.done;
    if (shouldComplete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setError("");

    setExercises((current) =>
      current.map((ce) =>
        ce.id === exerciseId
          ? { ...ce, sets: ce.sets.map((cs) => cs.id === setId ? { ...cs, done: shouldComplete } : cs) }
          : ce,
      ),
    );

    if (shouldComplete) {
      const restSecs = restSecsMap.get(exercise.exerciseId) ?? 90;
      if (restSecs > 0) setRestTimer({ exerciseId: exercise.exerciseId, remaining: restSecs, total: restSecs });
    }

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

  const toggleWarmup = (exerciseId: string, setId: string) => {
    setExercises((current) =>
      current.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, warmup: !s.warmup } : s)) }
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
    await clearDraft();
    if (sessionId) {
      try {
        await deleteWorkoutSessionWorkoutSessionsSessionIdDelete(sessionId);
        queryClient.removeQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
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
    await clearDraft();
    setError("");
    try {
      await updateWorkoutSessionWorkoutSessionsSessionIdPatch(sessionId, {
        finished_at: new Date().toISOString(),
        is_completed: true,
        mood,
        notes: note || null,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
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
            <Animated.View style={{ opacity: press.opacity }}>
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
                onPressIn={press.onPressIn}
                onPressOut={press.onPressOut}
              >
                <AppIcon name="x" size={13} color={theme.colorRed?.get()} />
                <Text style={{ color: theme.colorRed?.get(), fontSize: 12, fontWeight: "600" }}>Discard</Text>
              </Pressable>
            </Animated.View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: textColor, fontSize: 18, fontWeight: "900" }}>{formatTime(elapsed)}</Text>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 2 }}>
                {completedSets}/{totalSets} work sets done
              </Text>
            </View>
            <Animated.View style={{ opacity: press.opacity }}>
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
                onPressIn={press.onPressIn}
                onPressOut={press.onPressOut}
              >
                <AppIcon name="check" size={13} color="#000000" />
                <Text style={{ color: "#000000", fontSize: 12, fontWeight: "800" }}>Finish</Text>
              </Pressable>
            </Animated.View>
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
                    <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>
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
                      <Text style={[{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }, { width: GRID_COL_WIDTHS.index }]}>Set</Text>
                      <Text style={[{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }, { flex: 1 }]}>
                        {isCardio(exercise.exerciseId) ? "Time" : "kg"}
                      </Text>
                      <Text style={[{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }, { flex: 1 }]}>
                        {isCardio(exercise.exerciseId) ? "km" : "Reps"}
                      </Text>
                      <Pressable onPress={() => setRpeChartModal(true)} style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 }, { width: GRID_COL_WIDTHS.rpe }]}>
                        <Text style={[{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }]}>RPE</Text>
                        <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: "700" }}>?</Text>
                      </Pressable>
                      <View style={{ width: GRID_COL_WIDTHS.checkbox }} />
                    </View>
                    <View style={{ gap: spacing.md }}>
                      {exercise.sets.map((set) => (
                        <SwipeableSetRow key={set.id} onToggle={() => toggleSet(exercise.id, set.id)}>
                        <View style={[{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }, set.done ? { opacity: 0.5 } : null]}>
                          <Pressable
                            onPress={() => toggleWarmup(exercise.id, set.id)}
                            onPressIn={press.onPressIn}
                            onPressOut={press.onPressOut}
                            hitSlop={6}
                            style={{ width: GRID_COL_WIDTHS.index, alignItems: "center", justifyContent: "center", opacity: press.opacity }}
                          >
                            <Text style={[{ color: textColor, fontSize: 11, fontWeight: "700" }, { color: set.warmup ? theme.colorOrange?.get() : "rgba(255,255,255,0.55)" }]}>
                              {set.warmup ? "W" : exercise.sets.filter((item) => !item.warmup).indexOf(set) + 1}
                            </Text>
                          </Pressable>
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
                              <Pressable
                                onPress={() => setPlateCalc({ exerciseId: exercise.id, setId: set.id, weight: set.weight })}
                                onPressIn={press.onPressIn}
                                onPressOut={press.onPressOut}
                                hitSlop={12}
                                style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", opacity: press.opacity }}
                              >
                                <AppIcon name="scale" size={13} color="rgba(255,255,255,0.25)" />
                              </Pressable>
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
                            onPressIn={press.onPressIn}
                            onPressOut={press.onPressOut}
                            style={{
                              width: GRID_COL_WIDTHS.rpe,
                              height: 44,
                              borderRadius: radii.stepper,
                              backgroundColor: surface2Color,
                              borderWidth: 1,
                              borderColor: borderColor,
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: press.opacity,
                            }}
                          >
                            <Text style={{ color: set.rpe ? textColor : faintColor, fontSize: 13, fontWeight: "600" }}>
                              {set.rpe || "-"}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => toggleSet(exercise.id, set.id)}
                            onPressIn={press.onPressIn}
                            onPressOut={press.onPressOut}
                            style={{
                                width: GRID_COL_WIDTHS.checkbox,
                                height: 44,
                                borderRadius: radii.iconWrap,
                                backgroundColor: set.done ? accent : surface2Color,
                                borderColor: set.done ? accent : borderColor,
                                borderWidth: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: press.opacity,
                              }}
                          >
                            {set.done ? <AppIcon name="check" size={15} color="#000000" /> : null}
                          </Pressable>
                        </View>
                        </SwipeableSetRow>
                      ))}
                    </View>
                    <Animated.View style={{ opacity: press.opacity }}>
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
                        onPressIn={press.onPressIn}
                        onPressOut={press.onPressOut}
                      >
                        <AppIcon name="plus" size={13} color={accent} />
                        <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>Add Set</Text>
                      </Pressable>
                    </Animated.View>
                  </View>
                ) : null}
              </Card>
            );
          })}

          <Animated.View style={{ opacity: press.opacity }}>
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
          </Animated.View>

          <Card elevated>
            <SectionEyebrow>Session Notes</SectionEyebrow>
            <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, { marginTop: spacing.xl, flexWrap: "wrap", gap: spacing.md }]}>
              {MOODS.map((entry) => (
                <Animated.View key={entry.label} style={{ opacity: press.opacity }}>
                  <Pressable
                    onPress={() => setMood(entry.label)}
                    onPressIn={press.onPressIn}
                    onPressOut={press.onPressOut}
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
                </Animated.View>
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
                  <Animated.View key={entry.label} style={{ opacity: press.opacity }}>
                    <Pressable
                      onPress={() => setMood(entry.label)}
                      onPressIn={press.onPressIn}
                      onPressOut={press.onPressOut}
                      style={{
                        opacity: mood && mood !== entry.label ? 0.45 : 1,
                        alignItems: "center",
                        gap: spacing.xxs,
                        width: 44,
                        height: 44,
                        justifyContent: "center",
                      }}
                    >
                      <AppIcon
                        name={entry.icon}
                        size={24}
                        color={mood === entry.label ? accent : mutedColor}
                      />
                    </Pressable>
                  </Animated.View>
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
                    <Animated.View key={val} style={{ opacity: press.opacity }}>
                      <Pressable
                        onPress={() => {
                          if (rpePicker) {
                            updateSet(rpePicker.exerciseId, rpePicker.setId, "rpe", String(val));
                            setRpePicker(null);
                          }
                        }}
                        onPressIn={press.onPressIn}
                        onPressOut={press.onPressOut}
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
                    </Animated.View>
                  );
                })}
              </View>
              <Animated.View style={{ opacity: press.opacity }}>
                <Pressable onPress={() => setRpePicker(null)} style={{ marginTop: spacing.xl, alignItems: "center" }}
                  onPressIn={press.onPressIn}
                  onPressOut={press.onPressOut}
                >
                  <Text style={{ color: mutedColor, fontSize: 13 }}>Clear</Text>
                </Pressable>
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={rpeChartModal} transparent animationType="fade" onRequestClose={() => setRpeChartModal(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }} onPress={() => setRpeChartModal(false)}>
            <Pressable onPress={() => {}} style={{ backgroundColor: theme.surface?.get(), borderRadius: radii.card, padding: spacing.xl3, width: 280, borderWidth: 1, borderColor: borderColor }}>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: spacing.xl }}>
                RPE Reference Chart
              </Text>
              <View style={{ gap: spacing.lg }}>
                {RPE_REFERENCE.map((entry) => (
                  <View key={entry.rpe} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: surface2Color,
                        borderWidth: 1,
                        borderColor: borderColor,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: textColor, fontSize: 12, fontWeight: "700" }}>{entry.rpe}</Text>
                    </View>
                    <Text style={{ color: mutedColor, fontSize: 12, lineHeight: 18, flex: 1, marginTop: 6 }}>{entry.description}</Text>
                  </View>
                ))}
              </View>
              <Animated.View style={{ opacity: press.opacity }}>
                <Pressable onPress={() => setRpeChartModal(false)} style={{ marginTop: spacing.xl, alignItems: "center" }}
                  onPressIn={press.onPressIn}
                  onPressOut={press.onPressOut}
                >
                  <Text style={{ color: mutedColor, fontSize: 13 }}>Close</Text>
                </Pressable>
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={!!plateCalc} transparent animationType="fade" onRequestClose={() => setPlateCalc(null)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }} onPress={() => setPlateCalc(null)}>
            <Pressable onPress={() => {}} style={{ backgroundColor: theme.surface?.get(), borderRadius: radii.card, padding: spacing.xl3, width: 260, borderWidth: 1, borderColor: borderColor }}>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: spacing.md }}>
                Plate Calculator
              </Text>
              <Text style={{ color: mutedColor, fontSize: 12, textAlign: "center", marginBottom: spacing.lg }}>
                Target: {plateCalc?.weight ?? "0"} kg → Barbell + Plates
              </Text>
              <View style={{ gap: spacing.sm }}>
                {(() => {
                  const weight = parseFloat(plateCalc?.weight ?? "0");
                  if (!weight || weight <= BARBELL_WEIGHT_KG) {
                    return <Text style={{ color: mutedColor, fontSize: 12, textAlign: "center" }}>No plates needed (≤ barbell weight)</Text>;
                  }
                  const plates = calculatePlates(weight);
                  return (
                    <>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                        <Text style={{ color: textColor, fontSize: 13, fontWeight: "600" }}>Bar (20 kg)</Text>
                        <Text style={{ color: mutedColor, fontSize: 13 }}>x1</Text>
                      </View>
                      {plates.map((p, i) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: i < plates.length - 1 ? 1 : 0, borderBottomColor: borderColor }}>
                          <Text style={{ color: textColor, fontSize: 13 }}>{p.plate} kg</Text>
                          <Text style={{ color: mutedColor, fontSize: 13 }}>x{p.perSide} per side</Text>
                        </View>
                      ))}
                      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: spacing.sm }}>
                        <Text style={{ color: accent, fontSize: 13, fontWeight: "700" }}>Total</Text>
                        <Text style={{ color: accent, fontSize: 13, fontWeight: "700" }}>{BARBELL_WEIGHT_KG + plates.reduce((s, p) => s + p.plate * p.perSide * 2, 0)} kg</Text>
                      </View>
                    </>
                  );
                })()}
              </View>
              <Animated.View style={{ opacity: press.opacity }}>
                <Pressable onPress={() => setPlateCalc(null)} style={{ marginTop: spacing.xl, alignItems: "center" }}
                  onPressIn={press.onPressIn}
                  onPressOut={press.onPressOut}
                >
                  <Text style={{ color: mutedColor, fontSize: 13 }}>Close</Text>
                </Pressable>
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>

        {restTimer && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setRestTimer(null)}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" }} onPress={() => setRestTimer(null)}>
              <Pressable onPress={() => {}} style={{
                backgroundColor: surface1Color,
                borderRadius: radii.card,
                padding: spacing.xl5,
                alignItems: "center",
                width: 280,
                borderWidth: 1,
                borderColor: borderColor,
              }}>
                <Text style={{ color: mutedColor, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xl }}>
                  REST
                </Text>
                <View style={{ width: 130, height: 130, borderRadius: 65, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl3 }}>
                  <View style={{ position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 6, borderColor: borderColor }} />
                  {(() => {
                    const p = restTimer.total > 0 ? 1 - restTimer.remaining / restTimer.total : 0;
                    const h = 130 / 2;
                    const a = Math.min(p * 360, 360);
                    return (
                      <>
                        <View style={{ position: "absolute", top: 0, left: h, width: h, height: 130, overflow: "hidden" }}>
                          <View style={{
                            position: "absolute", top: 0, left: -h, width: 130, height: 130, borderRadius: 65,
                            borderWidth: 6, borderColor: "transparent", borderTopColor: accent, borderRightColor: accent,
                            transform: [{ rotate: `${-90 + Math.min(a, 180)}deg` }],
                          }} />
                        </View>
                        {a > 180 && (
                          <View style={{ position: "absolute", top: 0, left: 0, width: h, height: 130, overflow: "hidden" }}>
                            <View style={{
                              position: "absolute", top: 0, left: 0, width: 130, height: 130, borderRadius: 65,
                              borderWidth: 6, borderColor: "transparent", borderTopColor: accent, borderLeftColor: accent,
                              transform: [{ rotate: `${-90 + a}deg` }],
                            }} />
                          </View>
                        )}
                      </>
                    );
                  })()}
                  <Text style={{ color: textColor, fontSize: 38, fontWeight: "900" }}>
                    {formatTime(restTimer.remaining)}
                  </Text>
                </View>
                <Animated.View style={{ opacity: press.opacity }}>
                  <Pressable onPress={() => setRestTimer(null)} style={{
                    paddingHorizontal: spacing.xl4,
                    paddingVertical: spacing.md,
                    borderRadius: radii.input,
                    backgroundColor: surface2Color,
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}
                    onPressIn={press.onPressIn}
                    onPressOut={press.onPressOut}
                  >
                    <Text style={{ color: mutedColor, fontSize: 14, fontWeight: "700" }}>Skip</Text>
                  </Pressable>
                </Animated.View>
              </Pressable>
            </Pressable>
          </Modal>
        )}

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
