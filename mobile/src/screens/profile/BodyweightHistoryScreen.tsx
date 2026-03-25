import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  BackHeader,
  Card,
  PrimaryButton,
  RoundButton,
  Screen,
  ScreenState,
  SectionEyebrow,
  Tag,
  TrendChart,
} from "../../components";
import {
  useBodyWeightLogsQuery,
  useCreateBodyWeightLogMutation,
  useDeleteBodyWeightLogMutation,
  useUpdateBodyWeightLogMutation,
} from "../../features/users/hooks";
import type { BodyWeightLog } from "../../features/users/schemas";
import { isApiError } from "../../lib/api/error";
import { queryKeys } from "../../lib/api/queryKeys";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"BodyweightHistory">;

function formatEntryDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatChartLabel(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function BodyweightHistoryScreen({
  navigation,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const logsQuery = useBodyWeightLogsQuery();
  const createLogMutation = useCreateBodyWeightLogMutation();
  const updateLogMutation = useUpdateBodyWeightLogMutation();
  const deleteLogMutation = useDeleteBodyWeightLogMutation();

  const [showEditor, setShowEditor] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [loggedAtInput, setLoggedAtInput] = useState(getTodayIsoDate());
  const [notesInput, setNotesInput] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      void logsQuery.refetch();
    }, [logsQuery]),
  );

  const logs = logsQuery.data ?? [];
  const latestLog = logs[0] ?? null;
  const oldestLog = logs[logs.length - 1] ?? null;
  const weightDelta =
    latestLog && oldestLog ? latestLog.weight_kg - oldestLog.weight_kg : null;
  const chartData = useMemo(
    () =>
      [...logs]
        .slice(0, 12)
        .reverse()
        .map((entry) => ({
          label: formatChartLabel(entry.logged_at),
          value: entry.weight_kg,
        })),
    [logs],
  );

  async function invalidateBodyweightQueries(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.bodyWeightLogs });
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.overview });
  }

  function resetEditor(): void {
    setEditingLogId(null);
    setWeightInput("");
    setLoggedAtInput(getTodayIsoDate());
    setNotesInput("");
    setFormError("");
  }

  function openCreateEditor(): void {
    resetEditor();
    setShowEditor(true);
  }

  function openEditEditor(entry: BodyWeightLog): void {
    setEditingLogId(entry.id);
    setWeightInput(`${entry.weight_kg}`);
    setLoggedAtInput(entry.logged_at);
    setNotesInput(entry.notes ?? "");
    setFormError("");
    setShowEditor(true);
  }

  function closeEditor(): void {
    setShowEditor(false);
    resetEditor();
  }

  async function handleSave(): Promise<void> {
    const parsedWeight = parsePositiveNumber(weightInput);
    if (!parsedWeight) {
      setFormError("Enter a valid positive bodyweight value.");
      return;
    }

    if (!isValidIsoDate(loggedAtInput.trim())) {
      setFormError("Use a valid YYYY-MM-DD date.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const payload = {
        weight_kg: parsedWeight,
        logged_at: loggedAtInput.trim(),
        notes: notesInput.trim() ? notesInput.trim() : null,
      };

      if (editingLogId !== null) {
        await updateLogMutation.mutateAsync({
          logId: editingLogId,
          payload,
        });
      } else {
        await createLogMutation.mutateAsync(payload);
      }

      await invalidateBodyweightQueries();
      closeEditor();
    } catch (error) {
      setFormError(
        isApiError(error)
          ? error.message
          : "Unable to save this bodyweight log right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(logId: number): void {
    Alert.alert(
      "Delete entry",
      "This bodyweight entry will be removed permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDelete(logId);
          },
        },
      ],
    );
  }

  async function handleDelete(logId: number): Promise<void> {
    setDeletingLogId(logId);

    try {
      await deleteLogMutation.mutateAsync(logId);
      await invalidateBodyweightQueries();
    } catch (error) {
      Alert.alert(
        "Delete failed",
        isApiError(error)
          ? error.message
          : "Unable to remove this bodyweight log right now.",
      );
    } finally {
      setDeletingLogId(null);
    }
  }

  if (logsQuery.isLoading && !logsQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Loading bodyweight history"
          message="Fetching your logged weight entries."
          loading
        />
      </Screen>
    );
  }

  if (logsQuery.isError && !logsQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Bodyweight history unavailable"
          message="The app could not load your bodyweight logs."
          actionLabel="Retry"
          onAction={() => {
            void logsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      glowColor="rgba(0,180,140,0.12)"
      refreshControl={
        <RefreshControl
          tintColor={COLORS.teal}
          refreshing={logsQuery.isRefetching}
          onRefresh={() => {
            void logsQuery.refetch();
          }}
        />
      }
    >
      <BackHeader
        title="Bodyweight"
        subtitle={`${logs.length} logged entr${logs.length === 1 ? "y" : "ies"}`}
        onBack={() => navigation.goBack()}
        right={
          <RoundButton accent onPress={openCreateEditor}>
            <Feather name="plus" size={16} color={COLORS.teal} />
          </RoundButton>
        }
      />

      <View style={styles.heroSection}>
        <View style={styles.metricRow}>
          <Text style={styles.bigMetric}>
            {latestLog ? latestLog.weight_kg.toFixed(1) : "—"}
          </Text>
          <Text style={styles.metricSuffix}>kg</Text>
          {weightDelta !== null ? (
            <Text
              style={[
                styles.metricChange,
                { color: weightDelta <= 0 ? COLORS.green : COLORS.orange },
              ]}
            >
              {weightDelta <= 0 ? "↓" : "↑"} {Math.abs(weightDelta).toFixed(1)} kg
            </Text>
          ) : null}
        </View>
        <Text style={styles.detailLabel}>
          {latestLog && oldestLog
            ? `From ${formatEntryDate(oldestLog.logged_at)} to ${formatEntryDate(latestLog.logged_at)}`
            : "Track changes over time with consistent weight logs."}
        </Text>
      </View>

      <Card style={{ marginTop: 16 }}>
        {chartData.length >= 2 ? (
          <TrendChart
            data={chartData}
            color={COLORS.teal}
            height={128}
            referenceValue={latestLog?.weight_kg}
          />
        ) : (
          <Text style={styles.chartFallback}>
            Add at least two entries to unlock a bodyweight trend chart.
          </Text>
        )}
      </Card>

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>All Entries</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {logs.length > 0 ? (
            logs.map((entry, index) => {
              const previousEntry = logs[index + 1];
              const delta =
                previousEntry !== undefined
                  ? entry.weight_kg - previousEntry.weight_kg
                  : null;

              return (
                <Card key={entry.id} style={styles.listRowCard}>
                  <Pressable
                    onPress={() => openEditEditor(entry)}
                    style={styles.listRowBody}
                  >
                    <View style={styles.entryHeader}>
                      <View style={styles.metricRow}>
                        <Text
                          style={[
                            styles.cardTitle,
                            index === 0 ? { color: COLORS.teal } : null,
                          ]}
                        >
                          {entry.weight_kg.toFixed(1)} kg
                        </Text>
                        {index === 0 ? (
                          <Tag label="Latest" color={COLORS.teal} />
                        ) : null}
                        {delta !== null ? (
                          <Text
                            style={[
                              styles.smallStrongText,
                              { color: delta <= 0 ? COLORS.green : COLORS.orange },
                            ]}
                          >
                            {delta <= 0 ? "↓" : "↑"}
                            {Math.abs(delta).toFixed(1)}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.detailLabel}>
                        {formatEntryDate(entry.logged_at)}
                        {entry.notes ? ` - ${entry.notes}` : ""}
                      </Text>
                    </View>

                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => openEditEditor(entry)}
                        style={styles.actionButton}
                      >
                        <Feather name="edit-2" size={14} color={COLORS.teal} />
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(entry.id)}
                        style={[styles.actionButton, styles.deleteWrap]}
                        disabled={deletingLogId === entry.id}
                      >
                        {deletingLogId === entry.id ? (
                          <ActivityIndicator color={COLORS.red} size="small" />
                        ) : (
                          <Feather name="trash-2" size={13} color={COLORS.red} />
                        )}
                      </Pressable>
                    </View>
                  </Pressable>
                </Card>
              );
            })
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No bodyweight logs yet</Text>
              <Text style={styles.emptyText}>
                Add your first weight entry to start charting changes and weekly trends.
              </Text>
              <PrimaryButton
                label="Add Entry"
                onPress={openCreateEditor}
                style={{ marginTop: 16 }}
              />
            </Card>
          )}
        </View>
      </View>

      <Modal
        visible={showEditor}
        transparent
        animationType="slide"
        onRequestClose={closeEditor}
      >
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={closeEditor} />
          <View style={styles.bottomSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.sheetTitle}>
                {editingLogId !== null ? "Edit Bodyweight" : "Log Bodyweight"}
              </Text>
              <Pressable onPress={closeEditor}>
                <Feather name="x" size={18} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            <View style={{ marginTop: 18 }}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="e.g. 82.5"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.modalMetricInput}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                value={loggedAtInput}
                onChangeText={setLoggedAtInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                value={notesInput}
                onChangeText={setNotesInput}
                placeholder="e.g. Morning, fasted"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.input}
              />
            </View>

            {formError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label={
                isSubmitting
                  ? editingLogId !== null
                    ? "Saving..."
                    : "Logging..."
                  : editingLogId !== null
                    ? "Save Changes"
                    : "Save Entry"
              }
              onPress={() => {
                void handleSave();
              }}
              icon={
                isSubmitting ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Feather name="check" size={16} color="#000000" />
                )
              }
              disabled={isSubmitting}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    marginTop: 18,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  bigMetric: {
    color: COLORS.text,
    fontSize: 40,
    fontWeight: "900",
  },
  metricSuffix: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  metricChange: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  chartFallback: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  listRowCard: {
    padding: 0,
  },
  listRowBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  entryHeader: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  smallStrongText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  deleteWrap: {
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  emptyCard: {
    marginTop: 2,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  modalScrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  modalBackdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: "#111d1b",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 26,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  modalMetricInput: {
    width: "100%",
    minHeight: 70,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  input: {
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
  errorBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
  },
});
