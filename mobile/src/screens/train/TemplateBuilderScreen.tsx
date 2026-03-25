import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  BackHeader,
  Card,
  MiniInput,
  PrimaryButton,
  RoundButton,
  Screen,
  ScreenState,
  Tag,
} from "../../components";
import { useExerciseLookupQueries, useExercisesInfiniteQuery } from "../../features/exercises/hooks";
import type { ExerciseSummary } from "../../features/exercises/schemas";
import {
  useCreateWorkoutTemplateExerciseMutation,
  useCreateWorkoutTemplateMutation,
  useDeleteWorkoutTemplateExerciseMutation,
  useDeleteWorkoutTemplateMutation,
  useUpdateWorkoutTemplateExerciseMutation,
  useUpdateWorkoutTemplateMutation,
  useWorkoutTemplateDetailQuery,
} from "../../features/templates/hooks";
import type { WorkoutTemplateExercise } from "../../features/templates/schemas";
import { isApiError } from "../../lib/api/error";
import { queryKeys } from "../../lib/api/queryKeys";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"TemplateBuilder">;

interface EditableTemplateExercise {
  clientId: string;
  templateExerciseId?: number;
  exerciseId: string;
  targetSets: string;
  targetReps: string;
  targetRpe: string;
  restSeconds: string;
  notes: string;
}

function parseNullableInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableFloat(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function createLocalExerciseId(): string {
  return `template-exercise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapTemplateExerciseToEditorState(
  exercise: WorkoutTemplateExercise,
): EditableTemplateExercise {
  return {
    clientId: `server-${exercise.id}`,
    templateExerciseId: exercise.id,
    exerciseId: exercise.exercise_id,
    targetSets: exercise.target_sets === null ? "" : `${exercise.target_sets}`,
    targetReps: exercise.target_reps === null ? "" : `${exercise.target_reps}`,
    targetRpe: exercise.target_rpe === null ? "" : `${exercise.target_rpe}`,
    restSeconds: exercise.rest_seconds === null ? "" : `${exercise.rest_seconds}`,
    notes: exercise.notes ?? "",
  };
}

function buildExercisePayload(
  item: EditableTemplateExercise,
  orderIndex: number,
) {
  return {
    exercise_id: item.exerciseId,
    order_index: orderIndex,
    target_sets: parseNullableInteger(item.targetSets),
    target_reps: parseNullableInteger(item.targetReps),
    target_rpe: parseNullableFloat(item.targetRpe),
    rest_seconds: parseNullableInteger(item.restSeconds),
    notes: item.notes.trim() ? item.notes.trim() : null,
  };
}

function formatCreatedAt(value: string | undefined): string {
  if (!value) {
    return "Draft";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Draft";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TemplateBuilderScreen({ navigation, route }: Props): React.JSX.Element {
  const templateId = route.params?.templateId;
  const isEditing = templateId !== undefined;
  const queryClient = useQueryClient();
  const templateQuery = useWorkoutTemplateDetailQuery(templateId);
  const createTemplateMutation = useCreateWorkoutTemplateMutation();
  const updateTemplateMutation = useUpdateWorkoutTemplateMutation();
  const deleteTemplateMutation = useDeleteWorkoutTemplateMutation();
  const createTemplateExerciseMutation = useCreateWorkoutTemplateExerciseMutation();
  const updateTemplateExerciseMutation = useUpdateWorkoutTemplateExerciseMutation();
  const deleteTemplateExerciseMutation = useDeleteWorkoutTemplateExerciseMutation();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [exercises, setExercises] = useState<EditableTemplateExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const appliedSignatureRef = useRef("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText]);

  const pickerQuery = useExercisesInfiniteQuery({
    q: debouncedSearchText || undefined,
  });

  const sourceExercises = useMemo(
    () => (templateQuery.data?.exercises ?? []).map(mapTemplateExerciseToEditorState),
    [templateQuery.data?.exercises],
  );
  const sourceSignature = useMemo(
    () =>
      JSON.stringify({
        name: templateQuery.data?.name ?? "",
        description: templateQuery.data?.description ?? "",
        isPublic: templateQuery.data?.is_public ?? false,
        exercises: sourceExercises,
      }),
    [sourceExercises, templateQuery.data?.description, templateQuery.data?.is_public, templateQuery.data?.name],
  );

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    if (!templateQuery.data) {
      return;
    }

    if (sourceSignature !== appliedSignatureRef.current) {
      setTemplateName(templateQuery.data.name);
      setTemplateDescription(templateQuery.data.description ?? "");
      setIsPublic(templateQuery.data.is_public);
      setExercises(sourceExercises);
      appliedSignatureRef.current = sourceSignature;
    }
  }, [isEditing, sourceExercises, sourceSignature, templateQuery.data]);

  const exerciseLookup = useExerciseLookupQueries(exercises.map((item) => item.exerciseId));

  const pickerItems = useMemo(() => {
    const existingIds = new Set(exercises.map((item) => item.exerciseId));
    return (pickerQuery.data?.pages.flatMap((page) => page.items) ?? []).filter(
      (item) => !existingIds.has(item.id),
    );
  }, [exercises, pickerQuery.data]);

  const totalTargetSets = exercises.reduce(
    (sum, item) => sum + (parseNullableInteger(item.targetSets) ?? 0),
    0,
  );

  function updateExercise(
    clientId: string,
    updater: (current: EditableTemplateExercise) => EditableTemplateExercise,
  ): void {
    setExercises((current) =>
      current.map((item) => (item.clientId === clientId ? updater(item) : item)),
    );
  }

  function removeExercise(clientId: string): void {
    setExercises((current) => current.filter((item) => item.clientId !== clientId));
  }

  function addExercise(summary: ExerciseSummary): void {
    if (exercises.some((item) => item.exerciseId === summary.id)) {
      setError("That exercise is already in the template.");
      setShowExercisePicker(false);
      return;
    }

    setExercises((current) => [
      ...current,
      {
        clientId: createLocalExerciseId(),
        exerciseId: summary.id,
        targetSets: "",
        targetReps: "",
        targetRpe: "",
        restSeconds: "",
        notes: "",
      },
    ]);
    setError("");
    setSearchText("");
    setShowExercisePicker(false);
  }

  async function invalidateTemplateQueries(nextTemplateId?: number): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: queryKeys.templates.list });
    if (nextTemplateId !== undefined) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(nextTemplateId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.exercises(nextTemplateId) });
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.overview });
  }

  async function handleSave(): Promise<void> {
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      setError("Template name is required.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      let activeTemplateId = templateId;
      let remoteExercises = templateQuery.data?.exercises ?? [];

      if (!activeTemplateId) {
        const createdTemplate = await createTemplateMutation.mutateAsync({
          name: trimmedName,
          description: templateDescription.trim() ? templateDescription.trim() : null,
          is_public: isPublic,
        });
        activeTemplateId = createdTemplate.id;
      } else if (
        trimmedName !== templateQuery.data?.name ||
        (templateDescription.trim() ? templateDescription.trim() : "") !== (templateQuery.data?.description ?? "") ||
        isPublic !== templateQuery.data?.is_public
      ) {
        await updateTemplateMutation.mutateAsync({
          templateId: activeTemplateId,
          payload: {
            name: trimmedName,
            description: templateDescription.trim() ? templateDescription.trim() : null,
            is_public: isPublic,
          },
        });
      }

      if (!activeTemplateId) {
        throw new Error("Template id missing after save.");
      }

      const remoteIdsInEditor = new Set(
        exercises
          .map((item) => item.templateExerciseId)
          .filter((value): value is number => value !== undefined),
      );

      for (const remoteExercise of remoteExercises) {
        if (!remoteIdsInEditor.has(remoteExercise.id)) {
          await deleteTemplateExerciseMutation.mutateAsync({
            templateId: activeTemplateId,
            templateExerciseId: remoteExercise.id,
          });
        }
      }

      const remoteById = new Map(remoteExercises.map((item) => [item.id, item]));

      for (const [index, exercise] of exercises.entries()) {
        const payload = buildExercisePayload(exercise, index);

        if (!exercise.templateExerciseId) {
          await createTemplateExerciseMutation.mutateAsync({
            templateId: activeTemplateId,
            payload,
          });
          continue;
        }

        const existing = remoteById.get(exercise.templateExerciseId);
        if (!existing) {
          continue;
        }

        const hasChanges =
          existing.exercise_id !== payload.exercise_id ||
          existing.order_index !== payload.order_index ||
          existing.target_sets !== payload.target_sets ||
          existing.target_reps !== payload.target_reps ||
          existing.target_rpe !== payload.target_rpe ||
          existing.rest_seconds !== payload.rest_seconds ||
          (existing.notes ?? null) !== payload.notes;

        if (hasChanges) {
          await updateTemplateExerciseMutation.mutateAsync({
            templateId: activeTemplateId,
            templateExerciseId: exercise.templateExerciseId,
            payload,
          });
        }
      }

      await invalidateTemplateQueries(activeTemplateId);
      navigation.goBack();
    } catch (saveError) {
      setError(isApiError(saveError) ? saveError.message : "Unable to save this template.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTemplate(): Promise<void> {
    if (!templateId) {
      navigation.goBack();
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteTemplateMutation.mutateAsync(templateId);
      await invalidateTemplateQueries();
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (deleteError) {
      setError(isApiError(deleteError) ? deleteError.message : "Unable to delete this template.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isEditing && templateQuery.isLoading && !templateQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState title="Loading template" message="Fetching template details and exercises." loading />
      </Screen>
    );
  }

  if (isEditing && (templateQuery.isError || !templateQuery.data)) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Template unavailable"
          message="The selected workout template could not be loaded."
          actionLabel="Retry"
          onAction={() => {
            void templateQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <BackHeader
        title={isEditing ? "Edit Template" : "New Template"}
        subtitle={isEditing ? `Created ${formatCreatedAt(templateQuery.data?.created_at)}` : "Create a reusable workout plan"}
        onBack={() => navigation.goBack()}
        right={
          isEditing ? (
            <RoundButton onPress={() => setShowDeleteModal(true)}>
              <Feather name="trash-2" size={15} color={COLORS.red} />
            </RoundButton>
          ) : undefined
        }
      />

      <View style={styles.nameSection}>
        <Text style={styles.fieldLabel}>Template Name</Text>
        <TextInput
          value={templateName}
          onChangeText={setTemplateName}
          placeholder="e.g. Upper Body Push"
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.nameInput}
        />
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          value={templateDescription}
          onChangeText={setTemplateDescription}
          placeholder="Optional notes about intent, split, or progression."
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.descriptionInput}
          multiline
        />
      </View>

      <Card style={styles.visibilityCard}>
        <View style={styles.visibilityInfo}>
          <Text style={styles.visibilityTitle}>Template Visibility</Text>
          <Text style={styles.visibilitySubtitle}>
            Private templates stay scoped to your account.
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: "rgba(255,255,255,0.15)", true: `${COLORS.teal}40` }}
          thumbColor={isPublic ? COLORS.teal : "rgba(255,255,255,0.35)"}
        />
      </Card>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{exercises.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTargetSets}</Text>
          <Text style={styles.statLabel}>Target Sets</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{isPublic ? "Public" : "Private"}</Text>
          <Text style={styles.statLabel}>Access</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.exercisesSection}>
        <View style={styles.exercisesHeader}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <Pressable onPress={() => setShowExercisePicker(true)} style={styles.addButton}>
            <Feather name="plus" size={14} color={COLORS.teal} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {exercises.map((exercise, index) => {
          const detail = exerciseLookup.map[exercise.exerciseId];

          return (
            <Card key={exercise.clientId} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseHeaderInfo}>
                  <Text style={styles.exerciseName}>{detail?.name ?? `Exercise ${exercise.exerciseId}`}</Text>
                  <View style={styles.exerciseMeta}>
                    {detail?.target ? (
                      <Tag label={detail.target} color={COLORS.teal} backgroundColor={`${COLORS.teal}18`} />
                    ) : null}
                    {detail?.equipment ? (
                      <Tag label={detail.equipment} color={COLORS.blue} backgroundColor={`${COLORS.blue}18`} />
                    ) : null}
                    <Tag label={`#${index + 1}`} color={COLORS.faint} backgroundColor="rgba(255,255,255,0.08)" />
                  </View>
                </View>
                <Pressable onPress={() => removeExercise(exercise.clientId)}>
                  <Feather name="trash-2" size={16} color={COLORS.red} />
                </Pressable>
              </View>

              <View style={styles.fieldGrid}>
                <View style={styles.fieldCell}>
                  <Text style={styles.smallLabel}>Sets</Text>
                  <MiniInput
                    value={exercise.targetSets}
                    onChangeText={(value) =>
                      updateExercise(exercise.clientId, (current) => ({ ...current, targetSets: value }))
                    }
                    placeholder="3"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldCell}>
                  <Text style={styles.smallLabel}>Reps</Text>
                  <MiniInput
                    value={exercise.targetReps}
                    onChangeText={(value) =>
                      updateExercise(exercise.clientId, (current) => ({ ...current, targetReps: value }))
                    }
                    placeholder="8"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldCell}>
                  <Text style={styles.smallLabel}>Target RPE</Text>
                  <MiniInput
                    value={exercise.targetRpe}
                    onChangeText={(value) =>
                      updateExercise(exercise.clientId, (current) => ({ ...current, targetRpe: value }))
                    }
                    placeholder="7.5"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.fieldCell}>
                  <Text style={styles.smallLabel}>Rest (sec)</Text>
                  <MiniInput
                    value={exercise.restSeconds}
                    onChangeText={(value) =>
                      updateExercise(exercise.clientId, (current) => ({ ...current, restSeconds: value }))
                    }
                    placeholder="120"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <Text style={styles.smallLabel}>Exercise Notes</Text>
                <TextInput
                  value={exercise.notes}
                  onChangeText={(value) =>
                    updateExercise(exercise.clientId, (current) => ({ ...current, notes: value }))
                  }
                  placeholder="Optional cue, tempo, or progression note"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={styles.notesInput}
                  multiline
                />
              </View>
            </Card>
          );
        })}

        {exercises.length === 0 ? (
          <Pressable onPress={() => setShowExercisePicker(true)}>
            <Card style={styles.emptyCard}>
              <Feather name="plus-circle" size={32} color={COLORS.teal} />
              <Text style={styles.emptyText}>Add your first exercise</Text>
              <Text style={styles.emptySubtext}>
                Search the exercise catalog and attach target sets, reps, RPE, and rest.
              </Text>
            </Card>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Template"}
          onPress={() => {
            void handleSave();
          }}
          disabled={isSaving}
          icon={isSaving ? <ActivityIndicator color="#000000" /> : <Feather name="check" size={16} color="#000000" />}
        />
      </View>

      <Modal visible={showExercisePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Pressable onPress={() => setShowExercisePicker(false)}>
                <Feather name="x" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search the exercise catalog"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.searchInput}
            />

            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {pickerQuery.isLoading && !pickerQuery.data ? (
                <ScreenState title="Loading exercises" message="Fetching the exercise catalog." loading />
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

              {pickerItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => addExercise(item)}
                  style={styles.pickerItem}
                >
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerName}>{item.name}</Text>
                    <Text style={styles.pickerMuscle}>
                      {item.target ?? item.body_part ?? "Uncategorized"}
                      {item.equipment ? ` · ${item.equipment}` : ""}
                    </Text>
                  </View>
                  <Feather name="plus" size={16} color={COLORS.teal} />
                </Pressable>
              ))}

              {!pickerQuery.isLoading && !pickerQuery.isError && pickerItems.length === 0 ? (
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerTitle}>No exercises found</Text>
                  <Text style={styles.emptyPickerText}>
                    Try a broader search term or clear the current filter.
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

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.confirmSheet}>
            <Text style={styles.modalTitle}>Delete Template?</Text>
            <Text style={styles.confirmText}>
              This removes the template and all linked template exercise targets.
            </Text>
            <PrimaryButton
              label={isDeleting ? "Deleting..." : "Delete Template"}
              onPress={() => {
                void handleDeleteTemplate();
              }}
              disabled={isDeleting}
              style={styles.deleteButton}
              icon={isDeleting ? <ActivityIndicator color="#000000" /> : <Feather name="trash-2" size={16} color="#000000" />}
            />
            <Pressable onPress={() => setShowDeleteModal(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nameSection: { marginTop: 16 },
  fieldLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  nameInput: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#ffffff",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  descriptionInput: {
    width: "100%",
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  visibilityCard: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  visibilityInfo: { flex: 1, paddingRight: 16 },
  visibilityTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  visibilitySubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 3, lineHeight: 18 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  errorBox: {
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  errorText: { color: COLORS.red, fontSize: 12, lineHeight: 18 },
  exercisesSection: { marginTop: 24 },
  exercisesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${COLORS.teal}20`,
  },
  addButtonText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  exerciseCard: { marginTop: 12 },
  exerciseHeader: { flexDirection: "row", alignItems: "flex-start" },
  exerciseHeaderInfo: { flex: 1, paddingRight: 16 },
  exerciseName: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  exerciseMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  fieldCell: { width: "47%" },
  smallLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "700", marginBottom: 6 },
  notesInput: {
    minHeight: 82,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: "top",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderStyle: "dashed",
    marginTop: 12,
  },
  emptyText: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginTop: 12 },
  emptySubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 18 },
  footer: { marginTop: 28 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: {
    backgroundColor: COLORS.screen,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    maxHeight: "82%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 18,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
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
    marginBottom: 12,
  },
  pickerList: { flexGrow: 0 },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  pickerInfo: { flex: 1, paddingRight: 12 },
  pickerName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  pickerMuscle: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  emptyPicker: { alignItems: "center", paddingVertical: 32 },
  emptyPickerTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptyPickerText: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
  loadMoreButton: { marginTop: 12 },
  confirmSheet: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    backgroundColor: COLORS.screen,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  confirmText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  deleteButton: { marginTop: 20, backgroundColor: COLORS.red },
  cancelButton: { alignItems: "center", paddingVertical: 14, marginTop: 6 },
  cancelButtonText: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
});
