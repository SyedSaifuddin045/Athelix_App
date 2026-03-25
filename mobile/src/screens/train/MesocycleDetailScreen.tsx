import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  BackHeader,
  Card,
  CompactStatCard,
  PrimaryButton,
  ProgressBar,
  RoundButton,
  Screen,
  ScreenState,
  SectionEyebrow,
  Tag,
  VerticalBars,
} from "../../components";
import { useAppConfigQuery } from "../../features/meta/hooks";
import {
  useDeleteMesocycleMutation,
  useMesocycleAnalyticsQuery,
  useMesocycleDetailQuery,
  useUpdateMesocycleMutation,
} from "../../features/mesocycles/hooks";
import type { Mesocycle } from "../../features/mesocycles/schemas";
import { isApiError } from "../../lib/api/error";
import { queryKeys } from "../../lib/api/queryKeys";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"MesocycleDetail">;

function getMesocycleStatus(mesocycle: Mesocycle) {
  const today = new Date().toISOString().slice(0, 10);
  if (mesocycle.started_on > today) {
    return {
      label: "Planned",
      color: COLORS.purple,
      backgroundColor: `${COLORS.purple}18`,
    };
  }

  if (mesocycle.ended_on && mesocycle.ended_on < today) {
    return {
      label: "Completed",
      color: COLORS.green,
      backgroundColor: `${COLORS.green}18`,
    };
  }

  return {
    label: "Active",
    color: COLORS.teal,
    backgroundColor: `${COLORS.teal}18`,
  };
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Open ended";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateProgressPercent(mesocycle: Mesocycle): number {
  const startedAt = new Date(mesocycle.started_on).getTime();
  const fallbackEndedAt =
    mesocycle.weeks && mesocycle.weeks > 0
      ? startedAt + mesocycle.weeks * 7 * 24 * 60 * 60 * 1000
      : NaN;
  const endedAt = mesocycle.ended_on
    ? new Date(mesocycle.ended_on).getTime()
    : fallbackEndedAt;

  if (Number.isNaN(startedAt) || Number.isNaN(endedAt) || endedAt <= startedAt) {
    return 0;
  }

  const now = Date.now();
  if (now <= startedAt) {
    return 0;
  }

  if (now >= endedAt) {
    return 100;
  }

  return ((now - startedAt) / (endedAt - startedAt)) * 100;
}

function formatVolume(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k kg`;
  }

  return `${Math.round(value)} kg`;
}

export function MesocycleDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { mesocycleId } = route.params;
  const queryClient = useQueryClient();
  const appConfigQuery = useAppConfigQuery();
  const detailQuery = useMesocycleDetailQuery(mesocycleId);
  const analyticsQuery = useMesocycleAnalyticsQuery(mesocycleId);
  const updateMesocycleMutation = useUpdateMesocycleMutation();
  const deleteMesocycleMutation = useDeleteMesocycleMutation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [endedOn, setEndedOn] = useState("");
  const [weeks, setWeeks] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    setName(detailQuery.data.name);
    setGoal(detailQuery.data.goal);
    setEndedOn(detailQuery.data.ended_on ?? "");
    setWeeks(detailQuery.data.weeks === null ? "" : `${detailQuery.data.weeks}`);
    setNotes(detailQuery.data.notes ?? "");
  }, [detailQuery.data]);

  async function invalidateQueries(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles.list });
    await queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles.detail(mesocycleId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles.analytics(mesocycleId, {}) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.overview });
  }

  async function handleSave(): Promise<void> {
    if (!detailQuery.data) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Mesocycle name is required.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await updateMesocycleMutation.mutateAsync({
        mesocycleId,
        payload: {
          name: trimmedName,
          goal,
          ended_on: endedOn.trim() ? endedOn.trim() : null,
          weeks: weeks.trim() ? Number(weeks) : null,
          notes: notes.trim() ? notes.trim() : null,
        },
      });
      await invalidateQueries();
      setShowEditModal(false);
    } catch (saveError) {
      setError(isApiError(saveError) ? saveError.message : "Unable to update mesocycle.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setError("");
    setIsDeleting(true);

    try {
      await deleteMesocycleMutation.mutateAsync(mesocycleId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles.list });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.overview });
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (deleteError) {
      setError(isApiError(deleteError) ? deleteError.message : "Unable to delete mesocycle.");
    } finally {
      setIsDeleting(false);
    }
  }

  const isLoading = (detailQuery.isLoading && !detailQuery.data) || (analyticsQuery.isLoading && !analyticsQuery.data);
  const isError = detailQuery.isError || analyticsQuery.isError || !detailQuery.data || !analyticsQuery.data;

  if (isLoading) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState title="Loading mesocycle" message="Fetching block details and analytics." loading />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Mesocycle unavailable"
          message="The selected training block could not be loaded."
          actionLabel="Retry"
          onAction={() => {
            void detailQuery.refetch();
            void analyticsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const status = getMesocycleStatus(detailQuery.data);
  const progress = calculateProgressPercent(detailQuery.data);
  const effortBars = analyticsQuery.data.deload_suggestion.weekly_average_rpe.map((item, index) => ({
    label: `W${index + 1}`,
    value: item.average_rpe,
    highlight: item.exceeded_threshold,
  }));
  const underTargetMuscles = analyticsQuery.data.muscle_balance.items.filter((item) => !item.meets_minimum);
  const recentSessions = [...detailQuery.data.sessions].sort((left, right) =>
    right.started_at.localeCompare(left.started_at),
  );
  const topExerciseComparisons = analyticsQuery.data.exercise_comparisons.slice(0, 5);

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader
        title={detailQuery.data.name}
        subtitle={formatDate(detailQuery.data.started_on)}
        onBack={() => navigation.goBack()}
        right={
          <RoundButton onPress={() => setShowEditModal(true)}>
            <Feather name="edit-2" size={15} color={COLORS.teal} />
          </RoundButton>
        }
      />

      <Card style={[styles.headerCard, { borderColor: `${status.color}30` }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTags}>
            <Tag label={status.label} color={status.color} backgroundColor={status.backgroundColor} />
            {detailQuery.data.goal ? (
              <Tag
                label={detailQuery.data.goal.replace("_", " ")}
                color={COLORS.blue}
                backgroundColor={`${COLORS.blue}18`}
              />
            ) : null}
          </View>
          <Text style={[styles.progressPercent, { color: status.color }]}>{progress.toFixed(0)}%</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Block Progress</Text>
            <Text style={styles.progressLabel}>
              {detailQuery.data.weeks ? `${detailQuery.data.weeks} week target` : "Flexible duration"}
            </Text>
          </View>
          <ProgressBar value={progress} color={status.color} height={10} />
          <Text style={styles.progressDetail}>
            {formatDate(detailQuery.data.started_on)} to {formatDate(detailQuery.data.ended_on)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <CompactStatCard
            label="Sessions"
            value={`${analyticsQuery.data.current_block_summary.completed_sessions}`}
            valueColor={status.color}
          />
          <CompactStatCard
            label="Sets"
            value={`${analyticsQuery.data.current_block_summary.total_sets}`}
            valueColor={COLORS.text}
          />
          <CompactStatCard
            label="Volume"
            value={formatVolume(analyticsQuery.data.current_block_summary.total_volume_load)}
            valueColor={COLORS.green}
          />
        </View>

        {detailQuery.data.notes ? (
          <View style={styles.notesSection}>
            <Feather name="message-circle" size={14} color={COLORS.muted} />
            <Text style={styles.notesText}>{detailQuery.data.notes}</Text>
          </View>
        ) : null}
      </Card>

      {analyticsQuery.data.comparison_to_previous ? (
        <View style={styles.section}>
          <SectionEyebrow color={COLORS.blue}>Comparison To Previous</SectionEyebrow>
          <Card style={styles.comparisonCard}>
            <View style={styles.comparisonRow}>
              <CompactStatCard
                label="Session Delta"
                value={`${analyticsQuery.data.comparison_to_previous.completed_sessions_delta >= 0 ? "+" : ""}${analyticsQuery.data.comparison_to_previous.completed_sessions_delta}`}
                valueColor={COLORS.teal}
              />
              <CompactStatCard
                label="Set Delta"
                value={`${analyticsQuery.data.comparison_to_previous.total_sets_delta >= 0 ? "+" : ""}${analyticsQuery.data.comparison_to_previous.total_sets_delta}`}
                valueColor={COLORS.blue}
              />
              <CompactStatCard
                label="Volume Delta"
                value={`${analyticsQuery.data.comparison_to_previous.total_volume_load_delta >= 0 ? "+" : ""}${Math.round(analyticsQuery.data.comparison_to_previous.total_volume_load_delta)}`}
                valueColor={COLORS.green}
              />
            </View>
          </Card>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.orange}>Weekly Effort</SectionEyebrow>
        <Card style={styles.volumeCard}>
          <View style={styles.volumeHeader}>
            <Text style={styles.volumeTitle}>Average Session RPE</Text>
            <Text style={styles.volumeUnit}>Threshold {analyticsQuery.data.deload_suggestion.threshold}</Text>
          </View>
          <VerticalBars
            data={effortBars.length > 0 ? effortBars : [{ label: "W1", value: 0, highlight: false }]}
            height={110}
            activeColor={status.color}
            mutedColor="rgba(255,255,255,0.18)"
          />
          <Text style={styles.captionText}>
            {analyticsQuery.data.deload_suggestion.is_recommended
              ? "Deload is recommended based on recent weekly effort."
              : "Current weekly effort stays within the configured threshold."}
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Linked Sessions</SectionEyebrow>
        {recentSessions.length ? (
          recentSessions.map((session) => (
            <Pressable
              key={session.id}
              onPress={() =>
                navigation.navigate("SessionDetail", {
                  sessionId: session.id,
                })
              }
            >
              <Card style={styles.sessionCard}>
                <View style={styles.sessionRow}>
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionName}>{session.name ?? `Workout Session #${session.id}`}</Text>
                    <Text style={styles.sessionMeta}>{formatDate(session.started_at)} · {session.is_completed ? "Completed" : "Active"}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
                </View>
              </Card>
            </Pressable>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No linked sessions yet</Text>
            <Text style={styles.emptyCopy}>Attach workout sessions to this block to unlock comparisons and summaries.</Text>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.green}>Exercise Comparisons</SectionEyebrow>
        {topExerciseComparisons.length ? (
          topExerciseComparisons.map((item) => (
            <Card key={item.exercise_id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{item.exercise_name}</Text>
                <Tag
                  label={`${item.completed_sets_delta >= 0 ? "+" : ""}${item.completed_sets_delta} sets`}
                  color={item.completed_sets_delta >= 0 ? COLORS.green : COLORS.orange}
                  backgroundColor={item.completed_sets_delta >= 0 ? `${COLORS.green}20` : `${COLORS.orange}20`}
                />
              </View>
              <Text style={styles.exerciseMeta}>
                Volume delta {Math.round(item.total_volume_load_delta)} kg · e1RM delta {item.best_e1rm_delta ?? 0}
              </Text>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No completed sets yet</Text>
            <Text style={styles.emptyCopy}>Finish sessions in this block to populate exercise comparisons.</Text>
          </Card>
        )}
      </View>

      {underTargetMuscles.length ? (
        <View style={styles.section}>
          <SectionEyebrow color={COLORS.gold}>Muscle Balance Watchlist</SectionEyebrow>
          <Card style={styles.watchlistCard}>
            {underTargetMuscles.slice(0, 4).map((item) => (
              <View key={item.muscle_group} style={styles.watchlistRow}>
                <Text style={styles.watchlistMuscle}>{item.muscle_group}</Text>
                <Text style={styles.watchlistValue}>
                  {item.average_weekly_sets.toFixed(1)} / {item.minimum_weekly_sets.toFixed(1)} weekly sets
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Mesocycle</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Feather name="x" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Mesocycle name"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Goal</Text>
            <View style={styles.goalRow}>
              {(appConfigQuery.data?.supported_values.mesocycle_goals ?? []).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setGoal(goal === item ? null : item)}
                  style={[styles.goalChip, goal === item ? styles.goalChipActive : null]}
                >
                  <Text style={[styles.goalChipText, goal === item ? styles.goalChipTextActive : null]}>
                    {item.replace("_", " ")}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Start Date</Text>
            <TextInput
              value={detailQuery.data.started_on}
              editable={false}
              style={[styles.input, styles.disabledInput]}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>End Date</Text>
            <TextInput
              value={endedOn}
              onChangeText={setEndedOn}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Weeks</Text>
            <TextInput
              value={weeks}
              onChangeText={setWeeks}
              placeholder="Optional"
              placeholderTextColor="rgba(255,255,255,0.28)"
              keyboardType="number-pad"
              style={styles.input}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional planning notes"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.notesInput}
              multiline
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label={isSaving ? "Saving..." : "Save Changes"}
              onPress={() => {
                void handleSave();
              }}
              disabled={isSaving}
              style={{ marginTop: 20 }}
              icon={isSaving ? <ActivityIndicator color="#000000" /> : undefined}
            />

            <Pressable onPress={() => setShowDeleteModal(true)} style={styles.deleteLink}>
              <Feather name="trash-2" size={14} color={COLORS.red} />
              <Text style={styles.deleteLinkText}>Delete Mesocycle</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.confirmSheet}>
            <Text style={styles.modalTitle}>Delete Mesocycle?</Text>
            <Text style={styles.confirmText}>
              This removes the training block. Linked workout sessions remain, but the block analytics will be lost.
            </Text>
            <PrimaryButton
              label={isDeleting ? "Deleting..." : "Delete Mesocycle"}
              onPress={() => {
                void handleDelete();
              }}
              disabled={isDeleting}
              style={styles.dangerButton}
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
  headerCard: { marginTop: 16, borderWidth: 1 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1, paddingRight: 12 },
  progressPercent: { fontSize: 20, fontWeight: "900" },
  progressSection: { marginTop: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { color: COLORS.muted, fontSize: 12 },
  progressDetail: { color: COLORS.muted, fontSize: 11, marginTop: 8, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  notesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  notesText: { flex: 1, color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  section: { marginTop: 24 },
  comparisonCard: { marginTop: 10 },
  comparisonRow: { flexDirection: "row", gap: 8 },
  volumeCard: { marginTop: 10 },
  volumeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  volumeTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  volumeUnit: { color: COLORS.muted, fontSize: 12 },
  captionText: { color: COLORS.muted, fontSize: 11, lineHeight: 18, marginTop: 10 },
  sessionCard: { marginBottom: 8 },
  sessionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionLeft: { flex: 1, paddingRight: 12 },
  sessionName: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  sessionMeta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  exerciseCard: { marginBottom: 8 },
  exerciseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  exerciseName: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: "800" },
  exerciseMeta: { color: COLORS.muted, fontSize: 11, marginTop: 6, lineHeight: 18 },
  watchlistCard: { marginTop: 10 },
  watchlistRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  watchlistMuscle: { color: COLORS.text, fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
  watchlistValue: { color: COLORS.gold, fontSize: 11 },
  emptyCard: { marginTop: 10, alignItems: "center", paddingVertical: 24 },
  emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptyCopy: { color: COLORS.muted, fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 6 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: {
    backgroundColor: COLORS.screen,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    maxHeight: "88%",
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
  fieldLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  input: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: COLORS.text,
    paddingHorizontal: 14,
    fontSize: 14,
    marginTop: 8,
  },
  disabledInput: { opacity: 0.7 },
  notesInput: {
    minHeight: 92,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 8,
    textAlignVertical: "top",
  },
  goalRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  goalChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  goalChipActive: { backgroundColor: `${COLORS.purple}20`, borderColor: `${COLORS.purple}40` },
  goalChipText: { color: COLORS.faint, fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  goalChipTextActive: { color: COLORS.purple },
  errorBox: {
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  errorText: { color: COLORS.red, fontSize: 12 },
  deleteLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, marginTop: 4 },
  deleteLinkText: { color: COLORS.red, fontSize: 13, fontWeight: "700" },
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
  dangerButton: { marginTop: 20, backgroundColor: COLORS.red },
  cancelButton: { alignItems: "center", paddingVertical: 14, marginTop: 6 },
  cancelButtonText: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
});
