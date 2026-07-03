import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, BackHandler, LayoutAnimation, Modal, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usePostHog } from "posthog-react-native";

import { useAuth } from "@clerk/expo";
import { useTemplateDetailQuery, useExercisesQuery } from "../api/queries";
import {
  createWorkoutTemplateWorkoutTemplatesPost,
  updateWorkoutTemplateWorkoutTemplatesTemplateIdPatch,
  createTemplateExerciseWorkoutTemplatesTemplateIdExercisesPost,
  updateTemplateExerciseWorkoutTemplatesTemplateIdExercisesTemplateExerciseIdPatch,
  deleteTemplateExerciseWorkoutTemplatesTemplateIdExercisesTemplateExerciseIdDelete,
} from "../api/endpoints/workout-templates/workout-templates";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import type { ExerciseResponse } from "../api/model";
import { useTheme } from "@tamagui/core";
import { AppIcon } from "../design-system/icons/AppIcon";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { MiniInput, PickerColumn } from "../components/ui/Input";
import { PrimaryButton, RoundButton } from "../components/ui/Button";
import { ExercisePicker } from "../components/ExercisePicker";
import { exerciseLookup, templateDraftFromDetail, successData } from "../utils/mapping";
import { nameForExercise, muscleAccentColor } from "../utils/display";
import type { TemplateDraftExercise } from "../utils/mapping";
import { rpeError, numberOrNull, parseRestSeconds } from "../utils/validation";
import { toNumberId } from "../utils/helpers";
import { shadows } from "../design-system/tokens/shadows";
import { Events } from "../analytics/events";

const MINUTES = [0, 1, 2, 3, 4, 5];
const SECONDS = [0, 10, 15, 20, 30, 45];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TemplateBuilder">;
  route: RouteProp<RootStackParamList, "TemplateBuilder">;
};

export function TemplateBuilderScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const redColor = theme.colorRed?.get() ?? "#EF4444";
  const surface1Color = theme.surface1?.get() ?? "rgba(255,255,255,0.04)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const id = route.params?.id;
  const templateId = toNumberId(id);
  const isEdit = !!templateId;
  const initialExerciseId = route.params?.initialExerciseId;
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<TemplateDraftExercise[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [rpePicker, setRpePicker] = useState<string | null>(null);
  const [rpeSetIndex, setRpeSetIndex] = useState(0);
  const [bulkModal, setBulkModal] = useState<{ exerciseId: string; field: "reps" | "rpe" | "rest" } | null>(null);
  const [deletedExercise, setDeletedExercise] = useState<TemplateDraftExercise | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detail = useTemplateDetailQuery(templateId, isAuthenticated && isEdit);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!detail.data || lookup.size === 0) return;
    if (initialized.current) {
      setExercises((prev) =>
        prev.map((ex) => {
          const resolved = nameForExercise(ex.exerciseId, lookup);
          return {
            ...ex,
            name: resolved ?? ex.name,
          };
        }),
      );
      return;
    }
    initialized.current = true;
    setName(detail.data.name);
    setExercises(templateDraftFromDetail(detail.data, lookup));
    setExpanded(detail.data.exercises[0] ? String(detail.data.exercises[0].id) : null);
  }, [detail.data, lookup]);

  useEffect(() => {
    if (isEdit) return;
    if (initialized.current) return;
    if (!initialExerciseId || lookup.size === 0) return;
    if (exercises.length > 0) return;
    const exercise = lookup.get(initialExerciseId);
    if (!exercise) return;
    addExercise(exercise);
  }, [lookup, initialExerciseId, isEdit]);

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Template name is required.");

      for (const exercise of exercises) {
        const rpe = exercise.sets[0]?.rpe ?? "";
        const err = rpeError(rpe);
        if (err) throw new Error(`"${exercise.name}": ${err}`);
      }
      const template =
        isEdit && templateId
          ? successData(await updateWorkoutTemplateWorkoutTemplatesTemplateIdPatch(templateId, { name: name.trim() }))
          : successData(await createWorkoutTemplateWorkoutTemplatesPost({ name: name.trim(), is_public: false }));

      if (isEdit && detail.data) {
        const kept = new Set(exercises.map((exercise) => exercise.templateExerciseId).filter(Boolean));
        const removed = detail.data.exercises.filter((exercise) => !kept.has(exercise.id));
        await Promise.all(
          removed.map((exercise) =>
            deleteTemplateExerciseWorkoutTemplatesTemplateIdExercisesTemplateExerciseIdDelete(template.id, exercise.id),
          ),
        );
      }

      for (const [index, exercise] of exercises.entries()) {
        const config = exercise.sets[0];
        const payload = {
          exercise_id: exercise.exerciseId,
          exercise_name: exercise.name,
          order_index: index,
          target_sets: exercise.sets.length,
          target_reps: config ? numberOrNull(config.reps) : null,
          target_rpe: config ? numberOrNull(config.rpe) : null,
          rest_seconds: config ? parseRestSeconds(config.rest) : null,
          notes: exercise.notes || null,
        };

        if (exercise.templateExerciseId) {
          await updateTemplateExerciseWorkoutTemplatesTemplateIdExercisesTemplateExerciseIdPatch(
            template.id,
            exercise.templateExerciseId,
            payload,
          );
        } else {
          await createTemplateExerciseWorkoutTemplatesTemplateIdExercisesPost(template.id, payload);
        }
      }

      return template;
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      const totalTargetSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
      if (isEdit) {
        posthog.capture(Events.TEMPLATE_EDITED, {
          template_id: String(template.id),
          template_name: name.trim(),
          exercise_count: exercises.length,
          total_target_sets: totalTargetSets,
        });
      } else {
        posthog.capture(Events.TEMPLATE_CREATED, {
          template_id: String(template.id),
          template_name: name.trim(),
          exercise_count: exercises.length,
          total_target_sets: totalTargetSets,
        });
      }
      navigation.replace("TemplateList");
    },
    onError: (err) => setSaveError(getApiErrorMessage(err)),
  });

  const REST_PRESETS = ["0:30", "1:00", "1:30", "2:00", "2:30", "3:00", "5:00"];

  const addExercise = (exercise: ExerciseResponse) => {
    const nextId = Date.now().toString();
    const nextExercise: TemplateDraftExercise = {
      id: nextId,
      exerciseId: exercise.id,
      name: exercise.name,
      notes: "",
      sets: [
        { reps: "8", rpe: "7", rest: "2:00" },
        { reps: "8", rpe: "7", rest: "2:00" },
        { reps: "8", rpe: "7", rest: "2:00" },
      ],
    };
    setExercises((current) => [...current, nextExercise]);
    setExpanded(nextId);
    setShowExercisePicker(false);
  };

  const updateSetConfig = (exerciseId: string, setIndex: number, field: "reps" | "rpe" | "rest", value: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)) }
          : ex,
      ),
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { reps: "8", rpe: "7", rest: "2:00" }] }
          : ex,
      ),
    );
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) }
          : ex,
      ),
    );
  };

  const updateNote = (exerciseId: string, value: string) => {
    setExercises((current) =>
      current.map((exercise) => (exercise.id === exerciseId ? { ...exercise, notes: value } : exercise)),
    );
  };

  const removeExercise = (exerciseId: string) => {
    const idx = exercises.findIndex((e) => e.id === exerciseId);
    const ex = exercises[idx];
    if (!ex) return;
    setExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));
    setDeletedExercise(ex);
    setShowUndo(true);
    if (undoRef.current) clearTimeout(undoRef.current);
    undoRef.current = setTimeout(() => {
      setShowUndo(false);
      setDeletedExercise(null);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedExercise) return;
    if (undoRef.current) clearTimeout(undoRef.current);
    undoRef.current = null;
    setExercises((current) => [...current, deletedExercise]);
    setShowUndo(false);
    setDeletedExercise(null);
  };

  const isDirty = useMemo(() => {
    return name.trim().length > 0 || exercises.length > 0;
  }, [name, exercises]);

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= exercises.length) return;
    setExercises((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerExerciseId, setTimerExerciseId] = useState<string | null>(null);
  const [restSetIndex, setRestSetIndex] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(1);
  const [customSeconds, setCustomSeconds] = useState(30);

  const resetCustomTime = () => {
    setCustomMinutes(1);
    setCustomSeconds(30);
  };

  useEffect(() => {
    const onBack = () => {
      if (!isDirty) return false;
      Alert.alert("Discard changes?", "You have unsaved changes to this template. Discard them?", [
        { text: "Keep Editing", style: "cancel", onPress: () => {} },
        { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
      ]);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [isDirty, navigation]);

  useEffect(() => {
    return () => {
      if (undoRef.current) clearTimeout(undoRef.current);
    };
  }, []);

  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const gapOffsetsRef = useRef(new Map<string, Animated.Value>());
  const cardHeightsRef = useRef(new Map<string, number>());
  const dragStartIdxRef = useRef(0);
  const dragFinalRef = useRef(0);
  const CARD_H_DEFAULT = 76;

  const draggedHeight = (id: string) => cardHeightsRef.current.get(id) ?? CARD_H_DEFAULT;

  const cumulativeSwaps = (startIdx: number, dy: number): number => {
    let swaps = 0;
    let accH = 0;
    if (dy > 0) {
      for (let i = startIdx + 1; i < exercises.length; i++) {
        const nh = cardHeightsRef.current.get(exercises[i].id) ?? CARD_H_DEFAULT;
        accH += nh;
        if (dy >= accH - nh / 2) {
          swaps = i - startIdx;
        } else {
          break;
        }
      }
    } else if (dy < 0) {
      const absDY = Math.abs(dy);
      for (let i = startIdx - 1; i >= 0; i--) {
        const nh = cardHeightsRef.current.get(exercises[i].id) ?? CARD_H_DEFAULT;
        accH += nh;
        if (absDY >= accH - nh / 2) {
          swaps = i - startIdx;
        } else {
          break;
        }
      }
    }
    return swaps;
  };

  const getGap = (id: string) => {
    let val = gapOffsetsRef.current.get(id);
    if (!val) {
      val = new Animated.Value(0);
      gapOffsetsRef.current.set(id, val);
    }
    return val;
  };

  const activeIds = new Set(exercises.map((ex) => ex.id));
  gapOffsetsRef.current.forEach((_, id) => {
    if (!activeIds.has(id)) gapOffsetsRef.current.delete(id);
  });

  const setAllGaps = (draggedId: string, translationY: number) => {
    const startIdx = dragStartIdxRef.current;
    const h = draggedHeight(draggedId);
    const swaps = cumulativeSwaps(startIdx, translationY);
    const targetIdx = Math.max(0, Math.min(exercises.length - 1, startIdx + swaps));

    exercises.forEach((ex, idx) => {
      const val = getGap(ex.id);
      if (ex.id === draggedId) {
        val.setValue(translationY);
      } else {
        let offset = 0;
        if (targetIdx > startIdx && idx > startIdx && idx <= targetIdx) {
          offset = -h;
        } else if (targetIdx < startIdx && idx >= targetIdx && idx < startIdx) {
          offset = h;
        }
        val.setValue(offset);
      }
    });
  };

  const resetAllGaps = () => {
    exercises.forEach((ex) => {
      const val = gapOffsetsRef.current.get(ex.id);
      if (val) val.setValue(0);
    });
  };

  const handleDragMove = (translationY: number, exerciseId: string) => {
    if (draggedIdRef.current !== exerciseId) return;
    dragFinalRef.current = translationY;
    setAllGaps(exerciseId, translationY);
  };

  const handleDragEnd = (exerciseId: string) => {
    const startIdx = dragStartIdxRef.current;
    const rawDy = dragFinalRef.current;
    const swaps = cumulativeSwaps(startIdx, rawDy);
    const targetIdx = Math.max(0, Math.min(exercises.length - 1, startIdx + swaps));

    if (targetIdx !== startIdx) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExercises((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(startIdx, 1);
        updated.splice(targetIdx, 0, moved);
        return updated;
      });
    }

    draggedIdRef.current = null;
    resetAllGaps();
  };

  const draggingId = dragActiveId;
  const dragStartIdx = dragStartIdxRef.current;
  const rawDy = dragFinalRef.current;
  const dragSwaps = cumulativeSwaps(dragStartIdx, rawDy);
  const dragTargetIdx = draggingId ? Math.max(0, Math.min(exercises.length - 1, dragStartIdx + dragSwaps)) : -1;

  const setRestTime = (exerciseId: string, rest: string) => {
    updateSetConfig(exerciseId, restSetIndex, "rest", rest);
    setShowTimerModal(false);
    setTimerExerciseId(null);
  };

  return (
    <Screen contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
        <RoundButton onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-left" size={16} color={textColor} />
        </RoundButton>
        <Text style={{ color: textColor, fontSize: 17, fontWeight: "700" }}>{isEdit ? "Edit Template" : "New Template"}</Text>
        <Pressable style={{ minHeight: 34, borderRadius: 12, backgroundColor: accent, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }} onPress={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>
          {saveTemplate.isPending ? <ActivityIndicator color="#000000" size="small" /> : null}
          <Text style={{ color: "#000000", fontSize: 12, fontWeight: "800" }}>{saveTemplate.isPending ? "Saving" : "Save"}</Text>
        </Pressable>
      </View>

      {detail.isPending && isEdit ? <LoadingCard label="Loading template..." /> : null}
      {detail.isError ? <ErrorCard error={detail.error} onRetry={() => detail.refetch()} /> : null}
      {saveError ? (
        <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: 12 }}>
          <Text style={{ color: redColor, fontSize: 12 }}>{saveError}</Text>
        </View>
      ) : null}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Template name (e.g. Push Day A)"
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={[{ width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: textColor, paddingHorizontal: 16, fontSize: 14 }, { marginTop: 16, minHeight: 58, borderRadius: 18, fontSize: 16, fontWeight: "700" }]}
      />

      <View style={{ gap: 12, marginTop: 16 }}>
        {exercises.map((exercise, index) => (
          <View key={exercise.id} style={{ position: "relative" }}>
            {draggingId && index === dragTargetIdx && exercise.id !== draggingId ? (
              <View style={{
                backgroundColor: "rgba(255,90,54,0.04)",
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: "rgba(255,90,54,0.3)",
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: 0.55,
              }}>
                <Text style={{ color: accent, fontSize: 13, fontWeight: "600", fontStyle: "italic" }}>
                  {exercises.find((ex) => ex.id === draggingId)?.name ?? ""}
                </Text>
              </View>
            ) : null}
            <View onLayout={(e) => cardHeightsRef.current.set(exercise.id, e.nativeEvent.layout.height)}>
              <Animated.View style={{
                transform: [{ translateY: getGap(exercise.id) }],
              }}>
                <View style={[{ backgroundColor: surface1Color, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 16 }, {
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  zIndex: dragActiveId === exercise.id ? 100 : 1,
                  elevation: dragActiveId === exercise.id ? 10 : 1,
                }, dragActiveId === exercise.id ? {
                  borderColor: accent,
                  borderWidth: 1.5,
                  backgroundColor: "rgba(255,90,54,0.06)",
                  ...shadows.glow(accent),
                } : null]}>
                  <PanGestureHandler
                    onGestureEvent={(e) => handleDragMove(e.nativeEvent.translationY, exercise.id)}
                    onHandlerStateChange={(e) => {
                      if (e.nativeEvent.state === State.ACTIVE) {
                        draggedIdRef.current = exercise.id;
                        dragStartIdxRef.current = exercises.findIndex((ex) => ex.id === exercise.id);
                        dragFinalRef.current = 0;
                        setDragActiveId(exercise.id);
                      } else if (e.nativeEvent.state === State.END || e.nativeEvent.state === State.CANCELLED || e.nativeEvent.state === State.FAILED) {
                        handleDragEnd(exercise.id);
                        setDragActiveId(null);
                      }
                    }}
                    activateAfterLongPress={300}
                    minDist={5}
                  >
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, { flex: 1 }]}>
                          <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: muscleAccentColor(lookup.get(exercise.exerciseId)?.target ?? lookup.get(exercise.exerciseId)?.body_part) ?? accent }} />
                          <AppIcon name="grip-vertical" size={18} color={dragActiveId === exercise.id ? accent : "rgba(255,255,255,0.3)"} />
                          <Text style={[{ color: textColor, fontSize: 13, fontWeight: "700" }, { flex: 1 }]}>{exercise.name}</Text>
                        </View>
                      </View>
                    </View>
                  </PanGestureHandler>

                  {expanded === exercise.id ? (
                    <View style={{ marginTop: 14, gap: 8 }}>
                      <View style={{ flexDirection: "row", paddingHorizontal: 2, marginBottom: 4 }}>
                        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", width: 28, letterSpacing: 0.4, textTransform: "uppercase" }}>#</Text>
                        <Pressable onPress={() => setBulkModal({ exerciseId: exercise.id, field: "reps" })} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>Reps</Text>
                          <AppIcon name="pen" size={10} color="rgba(255,255,255,0.2)" />
                        </Pressable>
                        <Pressable onPress={() => setBulkModal({ exerciseId: exercise.id, field: "rpe" })} style={{ width: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 }}>
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", textAlign: "center", letterSpacing: 0.4, textTransform: "uppercase" }}>RPE</Text>
                          <AppIcon name="pen" size={10} color="rgba(255,255,255,0.2)" />
                        </Pressable>
                        <Pressable onPress={() => setBulkModal({ exerciseId: exercise.id, field: "rest" })} style={{ width: 60, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 }}>
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", textAlign: "center", letterSpacing: 0.4, textTransform: "uppercase" }}>Rest</Text>
                          <AppIcon name="pen" size={10} color="rgba(255,255,255,0.2)" />
                        </Pressable>
                        <View style={{ width: 24 }} />
                      </View>
                      {exercise.sets.map((set, setIdx) => (
                        <View key={setIdx} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", width: 28 }}>
                            {setIdx + 1}
                          </Text>
                          <MiniInput
                            value={set.reps}
                            onChangeText={(v) => updateSetConfig(exercise.id, setIdx, "reps", v)}
                            style={{ flex: 1 }}
                            keyboardType="decimal-pad"
                          />
                          <Pressable
                            onPress={() => {
                              setRpePicker(exercise.id);
                              setRpeSetIndex(setIdx);
                            }}
                            style={{ width: 46, alignItems: "center", paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor }}
                          >
                            <Text style={{ color: textColor, fontSize: 12 }}>{set.rpe}</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              const current = set.rest ?? "2:00";
                              const parts = current.includes(":") ? current.split(":") : [current, "0"];
                              setCustomMinutes(Number(parts[0]) || 2);
                              setCustomSeconds(Number(parts[1]) || 0);
                              setTimerExerciseId(exercise.id);
                              setRestSetIndex(setIdx);
                              setShowTimerModal(true);
                            }}
                            style={{ width: 60, alignItems: "center", paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor }}
                          >
                            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{set.rest}</Text>
                          </Pressable>
                          {setIdx > 0 ? (
                            <Pressable onPress={() => removeSet(exercise.id, setIdx)} hitSlop={6}>
                              <AppIcon name="x" size={14} color="rgba(239,68,68,0.6)" />
                            </Pressable>
                          ) : (
                            <View style={{ width: 24 }} />
                          )}
                        </View>
                      ))}
                      <Pressable
                        onPress={() => addSet(exercise.id)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
                      >
                        <AppIcon name="plus" size={12} color={accent} />
                        <Text style={{ color: accent, fontSize: 11 }}>Add Set</Text>
                      </Pressable>
                      <TextInput
                        value={exercise.notes}
                        onChangeText={(value) => updateNote(exercise.id, value)}
                        placeholder="Notes (optional)..."
                        placeholderTextColor="rgba(255,255,255,0.28)"
                        style={[{ width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: textColor, paddingHorizontal: 16, fontSize: 14 }, { marginTop: 4 }]}
                      />
                    </View>
                  ) : null}
                </View>
              </Animated.View>
            </View>

            <Animated.View style={{
              position: "absolute",
              right: 14,
              top: 14,
              flexDirection: "row",
              alignItems: "center",
              zIndex: 999,
              transform: [{ translateY: getGap(exercise.id) }],
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Pressable onPress={() => moveExercise(index, index - 1)} hitSlop={8}>
                  <AppIcon name="chevron-up" size={15} color="rgba(255,255,255,0.3)" />
                </Pressable>
                <Pressable onPress={() => moveExercise(index, index + 1)} hitSlop={8}>
                  <AppIcon name="chevron-down" size={15} color="rgba(255,255,255,0.3)" />
                </Pressable>
              </View>
              <View style={{ width: 1, height: 16, marginHorizontal: 8, backgroundColor: "rgba(255,255,255,0.1)" }} />
              <Pressable onPress={() => setExpanded((current) => (current === exercise.id ? null : exercise.id))} hitSlop={8}>
                <AppIcon name={expanded === exercise.id ? "chevron-up" : "chevron-down"} size={17} color="rgba(255,255,255,0.6)" />
              </Pressable>
              <Pressable onPress={() => removeExercise(exercise.id)} hitSlop={8} style={{ marginLeft: 10 }}>
                <AppIcon name="trash-2" size={15} color="rgba(239,68,68,0.6)" />
              </Pressable>
            </Animated.View>
          </View>
        ))}

        {showUndo && deletedExercise ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,90,54,0.12)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(255,90,54,0.25)", marginTop: 8 }}>
            <Text style={{ color: textColor, fontSize: 12, flex: 1 }}>Removed {deletedExercise.name}</Text>
            <Pressable onPress={handleUndoDelete} hitSlop={8}>
              <Text style={{ color: accent, fontSize: 12, fontWeight: "800" }}>Undo</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={() => setShowExercisePicker(true)}>
          <View style={{ borderRadius: 24, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.02)", paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" }, { backgroundColor: "rgba(255,90,54,0.12)" }]}>
              <AppIcon name="plus" size={18} color={accent} />
            </View>
            <View>
              <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>Add Exercise</Text>
              <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>Search from exercise library</Text>
            </View>
          </View>
        </Pressable>

        {exercises.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
            <Text style={{ color: textColor, fontSize: 15, fontWeight: "700" }}>No exercises yet</Text>
            <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>Tap "Add Exercise" to build your template</Text>
          </View>
        ) : null}
      </View>

      <ExercisePicker
        variant="pick"
        visible={showExercisePicker}
        title="Add Exercise"
        enabled={isAuthenticated}
        onSelect={(exercise) => addExercise(exercise)}
        onClose={() => setShowExercisePicker(false)}
      />

      <Modal visible={showTimerModal} transparent animationType="slide" onRequestClose={() => setShowTimerModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => { setShowTimerModal(false); resetCustomTime(); }} />
          <View style={{ backgroundColor: "#111d1b", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 24, paddingTop: 14, paddingBottom: 26 }}>
            <View style={{ width: 40, height: 4, borderRadius: 4, alignSelf: "center", backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 18 }} />
            <Text style={{ color: textColor, fontSize: 22, fontWeight: "900", textAlign: "center" }}>Rest Timer</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18, justifyContent: "center" }}>
              {REST_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => timerExerciseId && setRestTime(timerExerciseId, preset)}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" }}
                >
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" }}>{preset}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <Text style={[{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }, { marginBottom: 10 }]}>Custom</Text>
              <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", alignItems: "flex-end" }}>
                <PickerColumn values={MINUTES} selected={customMinutes} onSelect={setCustomMinutes} label="Min" />
                <Text style={{ fontSize: 24, fontWeight: "900", color: textColor, paddingBottom: 18 }}>:</Text>
                <PickerColumn values={SECONDS} selected={customSeconds} onSelect={setCustomSeconds} label="Sec" />
              </View>
              <PrimaryButton
                label={`Set ${String(customMinutes).padStart(2, "0")}:${String(customSeconds).padStart(2, "0")}`}
                onPress={() => timerExerciseId && setRestTime(timerExerciseId, `${customMinutes}:${String(customSeconds).padStart(2, "0")}`)}
                subtle
                style={{ marginTop: 14 }}
              />
            </View>
            <PrimaryButton label="Done" onPress={() => { setShowTimerModal(false); resetCustomTime(); }} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={!!bulkModal} transparent animationType="fade" onRequestClose={() => setBulkModal(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }} onPress={() => setBulkModal(null)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: theme.surface?.get(), borderRadius: radii.card, padding: spacing.xl3, width: 240, borderWidth: 1, borderColor }}>
            <Text style={{ color: textColor, fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: spacing.lg }}>
              Set all {bulkModal?.field === "rpe" ? "RPE" : bulkModal?.field === "rest" ? "Rest" : "Reps"}
            </Text>
            <TextInput
              autoFocus
              keyboardType={bulkModal?.field === "rest" ? "default" : "decimal-pad"}
              placeholder={bulkModal?.field === "rest" ? "mm:ss" : "Value"}
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[{ width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: textColor, paddingHorizontal: 16, fontSize: 16, textAlign: "center", fontWeight: "700" }]}
              onSubmitEditing={(e) => {
                const val = e.nativeEvent.text;
                if (bulkModal && val) {
                  setExercises((prev) =>
                    prev.map((ex) =>
                      ex.id === bulkModal.exerciseId
                        ? { ...ex, sets: ex.sets.map((s) => ({ ...s, [bulkModal.field]: val })) }
                        : ex,
                    ),
                  );
                  setBulkModal(null);
                }
              }}
              returnKeyType="done"
            />
            <Pressable onPress={() => setBulkModal(null)} style={{ marginTop: spacing.lg, alignItems: "center" }}>
              <Text style={{ color: mutedColor, fontSize: 13 }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
              borderColor,
            }}
          >
            <Text style={{ color: textColor, fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: spacing.xl }}>
              Rate of Perceived Exertion
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {[1,2,3,4,5,6,7,8,9,10].map((val) => {
                const current = rpePicker
                  ? exercises.find((e) => e.id === rpePicker)?.sets[rpeSetIndex]?.rpe
                  : "";
                const isSelected = String(val) === current;
                return (
                  <Pressable
                    key={val}
                    onPress={() => {
                      if (rpePicker) {
                        updateSetConfig(rpePicker, rpeSetIndex, "rpe", String(val));
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
    </Screen>
  );
}
