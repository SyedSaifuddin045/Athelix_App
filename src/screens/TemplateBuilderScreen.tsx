import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, LayoutAnimation, Modal, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Icon } from "../components/ui/Icon";
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
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { MiniInput, PickerColumn } from "../components/ui/Input";
import { PrimaryButton, RoundButton } from "../components/ui/Button";
import { ExercisePicker } from "../components/ExercisePicker";
import { exerciseLookup, templateDraftFromDetail, successData } from "../utils/mapping";
import { nameForExercise, muscleAccentColor } from "../utils/display";
import type { TemplateDraftExercise } from "../utils/mapping";
import { rpeError, numberOrNull, parseRestSeconds } from "../utils/validation";
import { toNumberId, shadow } from "../utils/helpers";
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
  const id = route.params?.id;
  const templateId = toNumberId(id);
  const isEdit = !!templateId;
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<TemplateDraftExercise[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [saveError, setSaveError] = useState("");
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
          target_sets: exercise.setCount,
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
      const totalTargetSets = exercises.reduce((sum, ex) => sum + ex.setCount, 0);
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
      setCount: 1,
      sets: [{ reps: "8", rpe: "7", rest: "2:00" }],
    };
    setExercises((current) => [...current, nextExercise]);
    setExpanded(nextId);
    setShowExercisePicker(false);
  };

  const setSetCount = (exerciseId: string, delta: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, setCount: Math.max(1, ex.setCount + delta) } : ex,
      ),
    );
  };

  const updateSingleConfig = (exerciseId: string, field: "reps" | "rpe" | "rest", value: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: [{ ...ex.sets[0], [field]: value }] } : ex,
      ),
    );
  };

  const updateNote = (exerciseId: string, value: string) => {
    setExercises((current) =>
      current.map((exercise) => (exercise.id === exerciseId ? { ...exercise, notes: value } : exercise)),
    );
  };

  const removeExercise = (exerciseId: string) => {
    setExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));
  };

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
  const [customMinutes, setCustomMinutes] = useState(1);
  const [customSeconds, setCustomSeconds] = useState(30);

  const resetCustomTime = () => {
    setCustomMinutes(1);
    setCustomSeconds(30);
  };

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
    updateSingleConfig(exerciseId, "rest", rest);
    setShowTimerModal(false);
    setTimerExerciseId(null);
  };

  return (
    <Screen contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={styles.builderTopBar}>
        <RoundButton onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={16} color={COLORS.text} />
        </RoundButton>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Template" : "New Template"}</Text>
        <Pressable style={styles.saveChip} onPress={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>
          {saveTemplate.isPending ? <ActivityIndicator color="#000000" size="small" /> : null}
          <Text style={styles.saveChipText}>{saveTemplate.isPending ? "Saving" : "Save"}</Text>
        </Pressable>
      </View>

      {detail.isPending && isEdit ? <LoadingCard label="Loading template..." /> : null}
      {detail.isError ? <ErrorCard error={detail.error} onRetry={() => detail.refetch()} /> : null}
      {saveError ? (
        <View style={[styles.errorBox, { marginTop: 12 }]}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      ) : null}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Template name (e.g. Push Day A)"
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={[styles.input, styles.templateNameInput]}
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
                <Text style={{ color: COLORS.teal, fontSize: 13, fontWeight: "600", fontStyle: "italic" }}>
                  {exercises.find((ex) => ex.id === draggingId)?.name ?? ""}
                </Text>
              </View>
            ) : null}
            <View onLayout={(e) => cardHeightsRef.current.set(exercise.id, e.nativeEvent.layout.height)}>
              <Animated.View style={{
                transform: [{ translateY: getGap(exercise.id) }],
              }}>
                <View style={[styles.card, {
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  zIndex: dragActiveId === exercise.id ? 100 : 1,
                  elevation: dragActiveId === exercise.id ? 10 : 1,
                }, dragActiveId === exercise.id ? {
                  borderColor: COLORS.teal,
                  borderWidth: 1.5,
                  backgroundColor: "rgba(255,90,54,0.06)",
                  ...shadow(COLORS.teal),
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
                      <View style={styles.rowBetween}>
                        <View style={[styles.rowGap, { flex: 1 }]}>
                          <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: muscleAccentColor(lookup.get(exercise.exerciseId)?.target ?? lookup.get(exercise.exerciseId)?.body_part) ?? COLORS.teal }} />
                          <Icon name="grip-vertical" size={18} color={dragActiveId === exercise.id ? COLORS.teal : "rgba(255,255,255,0.3)"} />
                          <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
                        </View>
                      </View>
                    </View>
                  </PanGestureHandler>

                  {expanded === exercise.id ? (
                    <View style={{ marginTop: 14, gap: 14 }}>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>Reps</Text>
                          <MiniInput
                            value={exercise.sets[0]?.reps ?? "8"}
                            onChangeText={(value) => updateSingleConfig(exercise.id, "reps", value)}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>Sets</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Pressable
                              onPress={() => setSetCount(exercise.id, -1)}
                              style={[styles.stepperBtn, { opacity: exercise.setCount <= 1 ? 0.3 : 1 }]}
                              disabled={exercise.setCount <= 1}
                            >
                              <Icon name="minus" size={14} color={COLORS.text} />
                            </Pressable>
                            <Text style={[styles.listRowTitle, { minWidth: 22, textAlign: "center" }]}>
                              {exercise.setCount}
                            </Text>
                            <Pressable onPress={() => setSetCount(exercise.id, 1)} style={styles.stepperBtn}>
                              <Icon name="plus" size={14} color={COLORS.text} />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>RPE</Text>
                          <MiniInput
                            value={exercise.sets[0]?.rpe ?? "7"}
                            onChangeText={(value) => updateSingleConfig(exercise.id, "rpe", value)}
                            error={(() => {
                              const n = Number(exercise.sets[0]?.rpe);
                              return exercise.sets[0]?.rpe !== "" && (isNaN(n) || n < 1 || n > 10);
                            })()}
                            keyboardType="decimal-pad"
                          />
                          {(() => {
                            const n = Number(exercise.sets[0]?.rpe);
                            const invalid = exercise.sets[0]?.rpe !== "" && (isNaN(n) || n < 1 || n > 10);
                            return invalid ? <Text style={{ color: COLORS.red, fontSize: 9, marginTop: 4, textAlign: "center" }}>1–10</Text> : null;
                          })()}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>Rest</Text>
                          <Pressable
                            onPress={() => {
                              const current = exercise.sets[0]?.rest ?? "2:00";
                              const parts = current.includes(":") ? current.split(":") : [current, "0"];
                              setCustomMinutes(Number(parts[0]) || 2);
                              setCustomSeconds(Number(parts[1]) || 0);
                              setTimerExerciseId(exercise.id);
                              setShowTimerModal(true);
                            }}
                            style={styles.restChip}
                          >
                            <Icon name="clock" size={12} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.restChipText}>{exercise.sets[0]?.rest ?? "2:00"}</Text>
                          </Pressable>
                        </View>
                      </View>
                      <TextInput
                        value={exercise.notes}
                        onChangeText={(value) => updateNote(exercise.id, value)}
                        placeholder="Notes (optional)..."
                        placeholderTextColor="rgba(255,255,255,0.28)"
                        style={[styles.input, { marginTop: 4 }]}
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
                  <Icon name="chevron-up" size={15} color="rgba(255,255,255,0.3)" />
                </Pressable>
                <Pressable onPress={() => moveExercise(index, index + 1)} hitSlop={8}>
                  <Icon name="chevron-down" size={15} color="rgba(255,255,255,0.3)" />
                </Pressable>
              </View>
              <View style={{ width: 1, height: 16, marginHorizontal: 8, backgroundColor: "rgba(255,255,255,0.1)" }} />
              <Pressable onPress={() => setExpanded((current) => (current === exercise.id ? null : exercise.id))} hitSlop={8}>
                <Icon name={expanded === exercise.id ? "chevron-up" : "chevron-down"} size={17} color="rgba(255,255,255,0.6)" />
              </Pressable>
              <Pressable onPress={() => removeExercise(exercise.id)} hitSlop={8} style={{ marginLeft: 10 }}>
                <Icon name="trash-2" size={15} color="rgba(239,68,68,0.6)" />
              </Pressable>
            </Animated.View>
          </View>
        ))}

        <Pressable onPress={() => setShowExercisePicker(true)}>
          <View style={styles.dashedAddCard}>
            <View style={[styles.addCircle, { backgroundColor: "rgba(255,90,54,0.12)" }]}>
              <Icon name="plus" size={18} color={COLORS.teal} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Add Exercise</Text>
              <Text style={styles.detailLabel}>Search from exercise library</Text>
            </View>
          </View>
        </Pressable>

        {exercises.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
            <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>No exercises yet</Text>
            <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: "center" }}>Tap "Add Exercise" to build your template</Text>
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
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => { setShowTimerModal(false); resetCustomTime(); }} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Rest Timer</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18, justifyContent: "center" }}>
              {REST_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => timerExerciseId && setRestTime(timerExerciseId, preset)}
                  style={styles.chipButton}
                >
                  <Text style={styles.chipButtonText}>{preset}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>Custom</Text>
              <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", alignItems: "flex-end" }}>
                <PickerColumn values={MINUTES} selected={customMinutes} onSelect={setCustomMinutes} label="Min" />
                <Text style={{ fontSize: 24, fontWeight: "900", color: COLORS.text, paddingBottom: 18 }}>:</Text>
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
    </Screen>
  );
}
