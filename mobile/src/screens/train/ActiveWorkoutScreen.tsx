import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Card, MiniInput, PrimaryButton, Screen, ScreenState, Tag } from "../../components";
import { useExerciseLookupQueries, useExercisesInfiniteQuery } from "../../features/exercises/hooks";
import type { ExerciseSummary } from "../../features/exercises/schemas";
import { useWorkoutTemplateDetailQuery } from "../../features/templates/hooks";
import { buildDraftWorkoutExercises, type DraftWorkoutExercise, type DraftWorkoutSet } from "../../features/workouts/draft";
import { createExerciseSet, deleteExerciseSet, updateExerciseSet, updateWorkoutSession } from "../../features/workouts/api";
import { useQueuedWorkoutSessionActionsQuery, useWorkoutSessionQuery } from "../../features/workouts/hooks";
import {
  enqueueWorkoutAction,
  removeQueuedWorkoutActionByTempKey,
  replaceQueuedCreateSetAction,
} from "../../features/workouts/queue";
import type { CreateExerciseSetPayload, ExerciseSet, UpdateExerciseSetPayload } from "../../features/workouts/schemas";
import { isApiError } from "../../lib/api/error";
import { queryKeys } from "../../lib/api/queryKeys";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";
import { formatTime } from "../../utils";

type Props = RootStackScreenProps<"ActiveWorkout">;

function parseNumericInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildCreateSetPayload(
  exerciseId: string,
  draftSet: DraftWorkoutSet,
): CreateExerciseSetPayload {
  return {
    exercise_id: exerciseId,
    set_number: draftSet.setNumber,
    set_type: draftSet.setType,
    reps: parseNumericInput(draftSet.reps),
    weight_kg: parseNumericInput(draftSet.weightKg),
    rpe: parseNumericInput(draftSet.rpe),
    logged_at: new Date().toISOString(),
  };
}

function buildUpdateSetPayload(draftSet: DraftWorkoutSet): UpdateExerciseSetPayload {
  return {
    set_number: draftSet.setNumber,
    set_type: draftSet.setType,
    reps: parseNumericInput(draftSet.reps),
    weight_kg: parseNumericInput(draftSet.weightKg),
    rpe: parseNumericInput(draftSet.rpe),
  };
}

function createDraftKey(exerciseId: string): string {
  return `draft-${exerciseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlankDraftSet(
  exerciseId: string,
  setNumber: number,
): DraftWorkoutSet {
  return {
    key: createDraftKey(exerciseId),
    setNumber,
    setType: "working",
    reps: "",
    weightKg: "",
    rpe: "",
    done: false,
    pending: false,
  };
}

function normalizeDraftExercises(exercises: DraftWorkoutExercise[]): DraftWorkoutExercise[] {
  return exercises.map((exercise) => ({
    ...exercise,
    sets: [...exercise.sets]
      .sort((left, right) => left.setNumber - right.setNumber)
      .map((set, index) => ({
        ...set,
        setNumber: index + 1,
      })),
  }));
}

function hydrateDraftSetFromResponse(savedSet: ExerciseSet): DraftWorkoutSet {
  return {
    key: `server-${savedSet.id}`,
    serverId: savedSet.id,
    setNumber: savedSet.set_number,
    setType: savedSet.set_type,
    reps: savedSet.reps === null ? "" : `${savedSet.reps}`,
    weightKg: savedSet.weight_kg === null ? "" : `${savedSet.weight_kg}`,
    rpe: savedSet.rpe === null ? "" : `${savedSet.rpe}`,
    done: true,
    pending: false,
  };
}

function resolveElapsedSeconds(startedAt?: string | null): number {
  if (!startedAt) {
    return 0;
  }

  const startedAtMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedAtMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
}

export function ActiveWorkoutScreen({ navigation, route }: Props): React.JSX.Element {
  const sessionId = route.params.sessionId;
  const queryClient = useQueryClient();
  const sessionQuery = useWorkoutSessionQuery(sessionId);
  const queuedActionsQuery = useQueuedWorkoutSessionActionsQuery(sessionId);
  const templateQuery = useWorkoutTemplateDetailQuery(sessionQuery.data?.template_id ?? undefined);

  const [draftExercises, setDraftExercises] = useState<DraftWorkoutExercise[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [debouncedExerciseSearch, setDebouncedExerciseSearch] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [activeSetKey, setActiveSetKey] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const appliedSignatureRef = useRef("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedExerciseSearch(exerciseSearch.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [exerciseSearch]);

  const pickerQuery = useExercisesInfiniteQuery({
    q: debouncedExerciseSearch || undefined,
  });

  const exerciseIds = useMemo(() => {
    const ids = new Set<string>();

    sessionQuery.data?.sets.forEach((set) => ids.add(set.exercise_id));
    templateQuery.data?.exercises.forEach((exercise) => ids.add(exercise.exercise_id));
    queuedActionsQuery.data?.forEach((action) => {
      if (action.type === "createSet") {
        ids.add(action.payload.exercise_id);
      }
    });

    return [...ids];
  }, [queuedActionsQuery.data, sessionQuery.data, templateQuery.data]);

  const exerciseLookup = useExerciseLookupQueries(exerciseIds);

  const sourceExercises = useMemo(() => {
    if (!sessionQuery.data) {
      return [];
    }

    return normalizeDraftExercises(
      buildDraftWorkoutExercises(
        sessionQuery.data,
        exerciseLookup.map,
        templateQuery.data,
        queuedActionsQuery.data ?? [],
      ),
    );
  }, [exerciseLookup.map, queuedActionsQuery.data, sessionQuery.data, templateQuery.data]);

  const sourceSignature = useMemo(
    () => JSON.stringify(sourceExercises),
    [sourceExercises],
  );

  useEffect(() => {
    if (!sessionQuery.data) {
      return;
    }

    if (sourceSignature !== appliedSignatureRef.current) {
      setDraftExercises(sourceExercises);
      appliedSignatureRef.current = sourceSignature;
    }
  }, [sessionQuery.data, sourceExercises, sourceSignature]);

  useEffect(() => {
    setNotes(sessionQuery.data?.notes ?? "");
  }, [sessionQuery.data?.id, sessionQuery.data?.notes]);

  useEffect(() => {
    const tick = () => setElapsedSeconds(resolveElapsedSeconds(sessionQuery.data?.started_at));
    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [sessionQuery.data?.started_at]);

  const pickerExercises = useMemo(() => {
    const items = pickerQuery.data?.pages.flatMap((page) => page.items) ?? [];
    const existingIds = new Set(draftExercises.map((exercise) => exercise.exerciseId));
    return items.filter((exercise) => !existingIds.has(exercise.id));
  }, [draftExercises, pickerQuery.data]);

  const pendingActionCount = queuedActionsQuery.data?.length ?? 0;
  const workoutName =
    sessionQuery.data?.name ??
    templateQuery.data?.name ??
    "Workout Session";
  const completedSets = draftExercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
    0,
  );
  const totalSets = draftExercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  async function invalidateWorkoutQueries(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.detail(sessionId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.queued(sessionId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.overview });
  }

  async function refreshScreen(): Promise<void> {
    const tasks: Array<Promise<unknown>> = [
      sessionQuery.refetch(),
      queuedActionsQuery.refetch(),
    ];

    if (sessionQuery.data?.template_id !== null && sessionQuery.data?.template_id !== undefined) {
      tasks.push(templateQuery.refetch());
    }

    await Promise.all(tasks);
  }

  function replaceSetLocally(
    exerciseId: string,
    setKey: string,
    nextSet: DraftWorkoutSet,
  ): void {
    setDraftExercises((current) =>
      normalizeDraftExercises(
        current.map((exercise) => {
          if (exercise.exerciseId !== exerciseId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.map((set) => (set.key === setKey ? nextSet : set)),
          };
        }),
      ),
    );
  }

  function patchSetLocally(
    exerciseId: string,
    setKey: string,
    updater: (draftSet: DraftWorkoutSet) => DraftWorkoutSet,
  ): void {
    setDraftExercises((current) =>
      normalizeDraftExercises(
        current.map((exercise) => {
          if (exercise.exerciseId !== exerciseId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: exercise.sets.map((set) => (set.key === setKey ? updater(set) : set)),
          };
        }),
      ),
    );
  }

  function removeSetLocally(exerciseId: string, setKey: string): void {
    setDraftExercises((current) =>
      normalizeDraftExercises(
        current.map((exercise) => {
          if (exercise.exerciseId !== exerciseId) {
            return exercise;
          }

          const remainingSets = exercise.sets.filter((set) => set.key !== setKey);
          return {
            ...exercise,
            sets:
              remainingSets.length > 0
                ? remainingSets
                : [createBlankDraftSet(exerciseId, 1)],
          };
        }),
      ),
    );
  }

  function removeExerciseLocally(exerciseId: string): void {
    setDraftExercises((current) =>
      current.filter((exercise) => exercise.exerciseId !== exerciseId),
    );
  }

  function findDraftSet(
    exerciseId: string,
    setKey: string,
  ): { exercise: DraftWorkoutExercise; draftSet: DraftWorkoutSet } | null {
    const exercise = draftExercises.find((item) => item.exerciseId === exerciseId);
    const draftSet = exercise?.sets.find((item) => item.key === setKey);

    if (!exercise || !draftSet) {
      return null;
    }

    return { exercise, draftSet };
  }

  async function persistDraftSet(
    exerciseId: string,
    setKey: string,
  ): Promise<void> {
    const match = findDraftSet(exerciseId, setKey);
    if (!match) {
      return;
    }

    const { draftSet } = match;
    setSubmissionError("");
    setActiveSetKey(setKey);

    try {
      if (draftSet.pending && !draftSet.serverId) {
        const replacedAction = await replaceQueuedCreateSetAction(
          sessionId,
          draftSet.key,
          buildCreateSetPayload(exerciseId, draftSet),
        );

        if (replacedAction) {
          patchSetLocally(exerciseId, setKey, (currentSet) => ({
            ...currentSet,
            done: true,
            pending: true,
            queueActionId: replacedAction.id,
          }));
          await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.queued(sessionId) });
          return;
        }
      }

      if (!draftSet.serverId) {
        const savedSet = await createExerciseSet(
          sessionId,
          buildCreateSetPayload(exerciseId, draftSet),
        );

        replaceSetLocally(exerciseId, setKey, hydrateDraftSetFromResponse(savedSet));
        await invalidateWorkoutQueries();
        return;
      }

      const savedSet = await updateExerciseSet(
        sessionId,
        draftSet.serverId,
        buildUpdateSetPayload(draftSet),
      );

      replaceSetLocally(exerciseId, setKey, hydrateDraftSetFromResponse(savedSet));
      await invalidateWorkoutQueries();
    } catch (error) {
      if (isApiError(error) && error.isNetworkError) {
        if (!draftSet.serverId) {
          const queuedAction = await enqueueWorkoutAction({
            type: "createSet",
            sessionId,
            tempKey: draftSet.key,
            payload: buildCreateSetPayload(exerciseId, draftSet),
          });

          patchSetLocally(exerciseId, setKey, (currentSet) => ({
            ...currentSet,
            done: true,
            pending: true,
            queueActionId: queuedAction.id,
          }));
        } else {
          const queuedAction = await enqueueWorkoutAction({
            type: "updateSet",
            sessionId,
            setId: draftSet.serverId,
            payload: buildUpdateSetPayload(draftSet),
          });

          patchSetLocally(exerciseId, setKey, (currentSet) => ({
            ...currentSet,
            done: true,
            pending: true,
            queueActionId: queuedAction.id,
          }));
        }

        await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.queued(sessionId) });
        return;
      }

      if (!draftSet.serverId) {
        patchSetLocally(exerciseId, setKey, (currentSet) => ({
          ...currentSet,
          done: false,
          pending: false,
          queueActionId: undefined,
        }));
      }

      setSubmissionError(
        isApiError(error) ? error.message : "Unable to save this set right now.",
      );
    } finally {
      setActiveSetKey(null);
    }
  }

  async function handleToggleSet(
    exerciseId: string,
    setKey: string,
  ): Promise<void> {
    const match = findDraftSet(exerciseId, setKey);
    if (!match) {
      return;
    }

    if (match.draftSet.done && match.draftSet.pending && !match.draftSet.serverId) {
      await removeQueuedWorkoutActionByTempKey(sessionId, match.draftSet.key);
      patchSetLocally(exerciseId, setKey, (currentSet) => ({
        ...currentSet,
        done: false,
        pending: false,
        queueActionId: undefined,
      }));
      await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.queued(sessionId) });
      return;
    }

    if (match.draftSet.done) {
      return;
    }

    patchSetLocally(exerciseId, setKey, (currentSet) => ({
      ...currentSet,
      done: true,
      pending: false,
    }));

    await persistDraftSet(exerciseId, setKey);
  }

  async function handleDeleteSet(
    exerciseId: string,
    setKey: string,
  ): Promise<void> {
    const match = findDraftSet(exerciseId, setKey);
    if (!match) {
      return;
    }

    const { draftSet } = match;
    setSubmissionError("");
    setActiveSetKey(setKey);

    try {
      if (draftSet.pending && !draftSet.serverId) {
        await removeQueuedWorkoutActionByTempKey(sessionId, draftSet.key);
        removeSetLocally(exerciseId, setKey);
        await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.queued(sessionId) });
        return;
      }

      if (!draftSet.serverId) {
        removeSetLocally(exerciseId, setKey);
        return;
      }

      await deleteExerciseSet(sessionId, draftSet.serverId);
      removeSetLocally(exerciseId, setKey);
      await invalidateWorkoutQueries();
    } catch (error) {
      if (isApiError(error) && error.isNetworkError && draftSet.serverId) {
        await enqueueWorkoutAction({
          type: "deleteSet",
          sessionId,
          setId: draftSet.serverId,
        });
        removeSetLocally(exerciseId, setKey);
        await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.queued(sessionId) });
      } else {
        setSubmissionError(
          isApiError(error) ? error.message : "Unable to remove this set right now.",
        );
      }
    } finally {
      setActiveSetKey(null);
    }
  }

  async function handleFinishWorkout(): Promise<void> {
    setSubmissionError("");
    setIsFinishing(true);

    try {
      await updateWorkoutSession(sessionId, {
        finished_at: new Date().toISOString(),
        notes: notes.trim() ? notes.trim() : null,
        is_completed: true,
      });
      await invalidateWorkoutQueries();
      setShowFinishModal(false);
      navigation.replace("MainTabs");
    } catch (error) {
      if (isApiError(error) && error.isNetworkError) {
        await enqueueWorkoutAction({
          type: "finishSession",
          sessionId,
          payload: {
            finished_at: new Date().toISOString(),
            notes: notes.trim() ? notes.trim() : null,
            is_completed: true,
          },
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.workouts.queued(sessionId) });
        setShowFinishModal(false);
        navigation.replace("MainTabs");
      } else {
        setSubmissionError(
          isApiError(error) ? error.message : "Unable to finish this workout right now.",
        );
      }
    } finally {
      setIsFinishing(false);
    }
  }

  function updateSetField(
    exerciseId: string,
    setKey: string,
    field: "weightKg" | "reps" | "rpe",
    value: string,
  ): void {
    patchSetLocally(exerciseId, setKey, (draftSet) => ({
      ...draftSet,
      [field]: value,
    }));
  }

  function addExercise(summary: ExerciseSummary): void {
    setDraftExercises((current) => {
      const existing = current.find((exercise) => exercise.exerciseId === summary.id);
      if (existing) {
        return normalizeDraftExercises(
          current.map((exercise) => {
            if (exercise.exerciseId !== summary.id) {
              return exercise;
            }

            return {
              ...exercise,
              sets: [
                ...exercise.sets,
                createBlankDraftSet(summary.id, exercise.sets.length + 1),
              ],
            };
          }),
        );
      }

      return [
        ...current,
        {
          exerciseId: summary.id,
          exerciseName: summary.name,
          equipment: summary.equipment,
          target: summary.target ?? summary.body_part,
          sets: [createBlankDraftSet(summary.id, 1)],
        },
      ];
    });
    setPickerVisible(false);
    setExerciseSearch("");
  }

  function addSet(exerciseId: string): void {
    setDraftExercises((current) =>
      normalizeDraftExercises(
        current.map((exercise) => {
          if (exercise.exerciseId !== exerciseId) {
            return exercise;
          }

          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              createBlankDraftSet(exerciseId, exercise.sets.length + 1),
            ],
          };
        }),
      ),
    );
  }

  if (sessionQuery.isLoading && !sessionQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Loading workout"
          message="Fetching the active workout session from the backend."
          loading
        />
      </Screen>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Workout unavailable"
          message="The app could not load this workout session."
          actionLabel="Retry"
          onAction={() => {
            void refreshScreen();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Feather name="x" size={20} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{workoutName}</Text>
          <Text style={styles.headerTimer}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <Pressable
          onPress={() => setShowFinishModal(true)}
          style={styles.finishButton}
          disabled={isFinishing}
        >
          <Text style={styles.finishButtonText}>Finish</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={sessionQuery.isRefetching || queuedActionsQuery.isRefetching}
            onRefresh={() => {
              void refreshScreen();
            }}
            tintColor={COLORS.teal}
          />
        }
      >
        {pendingActionCount > 0 ? (
          <View style={styles.pendingBanner}>
            <Feather name="wifi-off" size={16} color={COLORS.orange} />
            <Text style={styles.pendingBannerText}>
              {pendingActionCount} workout change{pendingActionCount > 1 ? "s" : ""} waiting to sync.
            </Text>
          </View>
        ) : null}

        {submissionError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{submissionError}</Text>
          </View>
        ) : null}

        {templateQuery.isError && sessionQuery.data.template_id ? (
          <View style={styles.inlineNotice}>
            <Text style={styles.inlineNoticeText}>
              The base template could not be loaded, so only saved session data is shown.
            </Text>
          </View>
        ) : null}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>
              {completedSets}/{totalSets} sets saved
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {draftExercises.map((exercise) => {
          const canRemoveExercise = exercise.sets.every(
            (set) => !set.done && !set.pending && !set.serverId,
          );

          return (
            <Card key={exercise.exerciseId} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <View style={styles.exerciseMeta}>
                    {exercise.target ? (
                      <Tag
                        label={exercise.target}
                        color={COLORS.teal}
                        backgroundColor={`${COLORS.teal}16`}
                      />
                    ) : null}
                    {exercise.equipment ? (
                      <Tag
                        label={exercise.equipment}
                        color={COLORS.blue}
                        backgroundColor={`${COLORS.blue}18`}
                      />
                    ) : null}
                  </View>
                </View>

                {canRemoveExercise ? (
                  <Pressable
                    onPress={() => removeExerciseLocally(exercise.exerciseId)}
                    style={styles.removeExerciseButton}
                  >
                    <Feather name="trash-2" size={15} color={COLORS.red} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.setsHeader}>
                <Text style={[styles.setHeaderText, { width: 28 }]}>Set</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>RPE</Text>
                <Text style={[styles.setHeaderText, { width: 42 }]}>Done</Text>
                <Text style={[styles.setHeaderText, { width: 34 }]}>Del</Text>
              </View>

              {exercise.sets.map((set) => (
                <View
                  key={set.key}
                  style={[styles.setRow, set.done ? styles.setRowDone : null]}
                >
                  <View style={[styles.setTypeBadge, set.pending ? styles.pendingBadge : null]}>
                    <Text
                      style={[
                        styles.setTypeText,
                        set.pending ? styles.pendingBadgeText : null,
                      ]}
                    >
                      {set.setNumber}
                    </Text>
                  </View>

                  <MiniInput
                    value={set.weightKg}
                    onChangeText={(value) => updateSetField(exercise.exerciseId, set.key, "weightKg", value)}
                    placeholder="0"
                    strike={set.done}
                    keyboardType="decimal-pad"
                    onBlur={() => {
                      if (set.done && activeSetKey !== set.key) {
                        void persistDraftSet(exercise.exerciseId, set.key);
                      }
                    }}
                  />

                  <MiniInput
                    value={set.reps}
                    onChangeText={(value) => updateSetField(exercise.exerciseId, set.key, "reps", value)}
                    placeholder="0"
                    strike={set.done}
                    keyboardType="number-pad"
                    onBlur={() => {
                      if (set.done && activeSetKey !== set.key) {
                        void persistDraftSet(exercise.exerciseId, set.key);
                      }
                    }}
                  />

                  <MiniInput
                    value={set.rpe}
                    onChangeText={(value) => updateSetField(exercise.exerciseId, set.key, "rpe", value)}
                    placeholder="-"
                    strike={set.done}
                    keyboardType="decimal-pad"
                    onBlur={() => {
                      if (set.done && activeSetKey !== set.key) {
                        void persistDraftSet(exercise.exerciseId, set.key);
                      }
                    }}
                  />

                  <Pressable
                    onPress={() => {
                      void handleToggleSet(exercise.exerciseId, set.key);
                    }}
                    style={[
                      styles.checkButton,
                      set.done ? styles.checkButtonDone : null,
                    ]}
                    disabled={activeSetKey === set.key}
                  >
                    {activeSetKey === set.key ? (
                      <ActivityIndicator size="small" color={set.done ? "#000000" : COLORS.teal} />
                    ) : set.done ? (
                      <Feather name="check" size={16} color="#000000" />
                    ) : null}
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      void handleDeleteSet(exercise.exerciseId, set.key);
                    }}
                    style={styles.deleteButton}
                    disabled={activeSetKey === set.key}
                  >
                    <Feather name="trash-2" size={14} color={COLORS.red} />
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={() => addSet(exercise.exerciseId)}
                style={styles.addSetButton}
              >
                <Feather name="plus" size={14} color={COLORS.teal} />
                <Text style={styles.addSetText}>Add Set</Text>
              </Pressable>
            </Card>
          );
        })}

        <Pressable
          style={styles.addExerciseButton}
          onPress={() => setPickerVisible(true)}
        >
          <Feather name="plus" size={18} color={COLORS.teal} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={isFinishing ? "Saving..." : "Finish Workout"}
          onPress={() => setShowFinishModal(true)}
          disabled={isFinishing}
          icon={
            isFinishing ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Feather name="check" size={16} color="#000000" />
            )
          }
        />
      </View>

      <Modal visible={showFinishModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Finish Workout?</Text>
            <Text style={styles.modalSubtitle}>
              Save {completedSets} completed set{completedSets === 1 ? "" : "s"} and close the active session.
            </Text>

            <View style={styles.finishStats}>
              <View style={styles.finishStat}>
                <Text style={styles.finishStatValue}>{formatTime(elapsedSeconds)}</Text>
                <Text style={styles.finishStatLabel}>Duration</Text>
              </View>
              <View style={styles.finishStat}>
                <Text style={styles.finishStatValue}>{completedSets}</Text>
                <Text style={styles.finishStatLabel}>Sets</Text>
              </View>
              <View style={styles.finishStat}>
                <Text style={styles.finishStatValue}>{draftExercises.length}</Text>
                <Text style={styles.finishStatLabel}>Exercises</Text>
              </View>
            </View>

            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Workout Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="How did this session feel?"
                placeholderTextColor="rgba(255,255,255,0.28)"
                multiline
                style={styles.notesInput}
              />
            </View>

            <PrimaryButton
              label={isFinishing ? "Saving..." : "Save Workout"}
              onPress={() => {
                void handleFinishWorkout();
              }}
              disabled={isFinishing}
              icon={isFinishing ? <ActivityIndicator color="#000000" /> : undefined}
            />

            <Pressable
              onPress={() => setShowFinishModal(false)}
              style={styles.cancelButton}
              disabled={isFinishing}
            >
              <Text style={styles.cancelButtonText}>Keep Training</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.pickerHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <Feather name="x" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            <TextInput
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              placeholder="Search exercise catalog"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.searchInput}
            />

            <ScrollView
              style={styles.pickerList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {pickerQuery.isLoading && !pickerQuery.data ? (
                <ScreenState
                  title="Loading exercises"
                  message="Fetching the exercise catalog."
                  loading
                />
              ) : null}

              {pickerQuery.isError ? (
                <ScreenState
                  title="Catalog unavailable"
                  message="The exercise catalog could not be loaded."
                  actionLabel="Retry"
                  onAction={() => {
                    void pickerQuery.refetch();
                  }}
                />
              ) : null}

              {pickerExercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => addExercise(exercise)}
                  style={styles.pickerItem}
                >
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerName}>{exercise.name}</Text>
                    <Text style={styles.pickerMeta}>
                      {exercise.target ?? exercise.body_part ?? "Uncategorized"}
                      {exercise.equipment ? ` · ${exercise.equipment}` : ""}
                    </Text>
                  </View>
                  <Feather name="plus" size={16} color={COLORS.teal} />
                </Pressable>
              ))}

              {!pickerQuery.isLoading && !pickerQuery.isError && pickerExercises.length === 0 ? (
                <View style={styles.emptyPickerState}>
                  <Text style={styles.emptyPickerTitle}>No exercises found</Text>
                  <Text style={styles.emptyPickerText}>
                    Try a broader search term or clear the filter.
                  </Text>
                </View>
              ) : null}

              {pickerQuery.hasNextPage ? (
                <PrimaryButton
                  label={pickerQuery.isFetchingNextPage ? "Loading..." : "Load More"}
                  onPress={() => {
                    void pickerQuery.fetchNextPage();
                  }}
                  disabled={pickerQuery.isFetchingNextPage}
                  subtle
                  style={styles.loadMoreButton}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 16 },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800", textAlign: "center" },
  headerTimer: { color: COLORS.teal, fontSize: 14, fontWeight: "700", marginTop: 2 },
  finishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: `${COLORS.teal}20`,
  },
  finishButtonText: { color: COLORS.teal, fontSize: 13, fontWeight: "700" },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: `${COLORS.orange}16`,
    borderWidth: 1,
    borderColor: `${COLORS.orange}2f`,
    marginBottom: 16,
  },
  pendingBannerText: { flex: 1, color: COLORS.orange, fontSize: 12, lineHeight: 18 },
  errorBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    marginBottom: 16,
  },
  errorText: { color: COLORS.red, fontSize: 12, lineHeight: 18 },
  inlineNotice: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  inlineNoticeText: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  progressSection: { marginBottom: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { color: COLORS.muted, fontSize: 12 },
  progressValue: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.teal,
  },
  exerciseCard: { marginBottom: 16 },
  exerciseHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  exerciseMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  removeExerciseButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(248,113,113,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  setHeaderText: { color: "rgba(255,255,255,0.3)", fontSize: 10, textAlign: "center" },
  setRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  setRowDone: { opacity: 0.82 },
  setTypeBadge: {
    width: 28,
    height: 38,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  setTypeText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  pendingBadge: { backgroundColor: `${COLORS.orange}22` },
  pendingBadgeText: { color: COLORS.orange },
  checkButton: {
    width: 42,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonDone: { backgroundColor: COLORS.teal },
  deleteButton: {
    width: 34,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(248,113,113,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.teal}28`,
    paddingVertical: 12,
  },
  addSetText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: `${COLORS.teal}28`,
    paddingVertical: 16,
    marginBottom: 100,
  },
  addExerciseText: { color: COLORS.teal, fontSize: 14, fontWeight: "700" },
  footer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    backgroundColor: COLORS.screen,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    maxHeight: "85%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 18,
  },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  modalSubtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  finishStats: { flexDirection: "row", gap: 10, marginTop: 20, marginBottom: 20 },
  finishStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
  },
  finishStatValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  finishStatLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  notesSection: { marginBottom: 18 },
  notesLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  notesInput: {
    minHeight: 110,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelButtonText: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  searchInput: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: COLORS.text,
    paddingHorizontal: 14,
    fontSize: 14,
    marginTop: 16,
    marginBottom: 16,
  },
  pickerList: { flexGrow: 0 },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    marginBottom: 10,
  },
  pickerInfo: { flex: 1, paddingRight: 12 },
  pickerName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  pickerMeta: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  emptyPickerState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyPickerTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptyPickerText: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
  loadMoreButton: { marginTop: 8, marginBottom: 8 },
});
