import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { BackHeader, Card, PrimaryButton, Screen, ScreenState, SectionEyebrow, Tag } from "../../components";
import { useAppConfigQuery } from "../../features/meta/hooks";
import { useCreateMesocycleMutation, useMesocyclesQuery } from "../../features/mesocycles/hooks";
import type { Mesocycle } from "../../features/mesocycles/schemas";
import { isApiError } from "../../lib/api/error";
import { queryKeys } from "../../lib/api/queryKeys";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"MesocycleList">;

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMesocycleStatus(mesocycle: Mesocycle) {
  const today = getTodayIsoDate();
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

export function MesocycleListScreen({ navigation }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const appConfigQuery = useAppConfigQuery();
  const mesocyclesQuery = useMesocyclesQuery();
  const createMesocycleMutation = useCreateMesocycleMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [startedOn, setStartedOn] = useState(getTodayIsoDate());
  const [endedOn, setEndedOn] = useState("");
  const [weeks, setWeeks] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      void mesocyclesQuery.refetch();
      void appConfigQuery.refetch();
    }, [appConfigQuery, mesocyclesQuery]),
  );

  const activeCount = useMemo(
    () => (mesocyclesQuery.data ?? []).filter((item) => getMesocycleStatus(item).label === "Active").length,
    [mesocyclesQuery.data],
  );
  const completedCount = useMemo(
    () => (mesocyclesQuery.data ?? []).filter((item) => getMesocycleStatus(item).label === "Completed").length,
    [mesocyclesQuery.data],
  );

  async function handleCreateMesocycle(): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Mesocycle name is required.");
      return;
    }

    setError("");

    try {
      const created = await createMesocycleMutation.mutateAsync({
        name: trimmedName,
        goal,
        started_on: startedOn,
        ended_on: endedOn.trim() ? endedOn.trim() : null,
        weeks: weeks.trim() ? Number(weeks) : null,
        notes: notes.trim() ? notes.trim() : null,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles.list });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.overview });
      setShowCreateModal(false);
      setName("");
      setGoal(null);
      setStartedOn(getTodayIsoDate());
      setEndedOn("");
      setWeeks("");
      setNotes("");
      navigation.navigate("MesocycleDetail", { mesocycleId: created.id });
    } catch (createError) {
      setError(isApiError(createError) ? createError.message : "Unable to create mesocycle.");
    }
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader
        title="Mesocycles"
        subtitle="Advanced block planning"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{mesocyclesQuery.data?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Total Blocks</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.teal }]}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.green }]}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </Card>
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Feather name="info" size={16} color={COLORS.purple} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Optional Advanced Planning</Text>
            <Text style={styles.infoText}>
              Mesocycles are optional. Use them when you want structured training blocks and block analytics.
            </Text>
          </View>
        </View>
      </Card>

      {mesocyclesQuery.isLoading && !mesocyclesQuery.data ? (
        <ScreenState title="Loading mesocycles" message="Fetching training blocks." loading />
      ) : null}

      {mesocyclesQuery.isError ? (
        <ScreenState
          title="Mesocycles unavailable"
          message="The app could not load your training blocks."
          actionLabel="Retry"
          onAction={() => {
            void mesocyclesQuery.refetch();
          }}
        />
      ) : null}

      {mesocyclesQuery.data ? (
        <View style={styles.section}>
          <SectionEyebrow color={COLORS.purple}>
            Your Cycles ({mesocyclesQuery.data.length})
          </SectionEyebrow>

          <View style={{ marginTop: 12 }}>
            {mesocyclesQuery.data.map((item) => {
              const status = getMesocycleStatus(item);
              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    navigation.navigate("MesocycleDetail", {
                      mesocycleId: item.id,
                    })
                  }
                >
                  <Card style={styles.mesoCard}>
                    <View style={styles.mesoHeader}>
                      <View style={styles.mesoHeaderLeft}>
                        <Text style={styles.mesoName}>{item.name}</Text>
                        <Text style={styles.mesoGoal}>{item.goal ?? "General training block"}</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
                    </View>

                    <View style={styles.tagRow}>
                      <Tag label={status.label} color={status.color} backgroundColor={status.backgroundColor} />
                      {item.weeks ? (
                        <Tag label={`${item.weeks} week${item.weeks === 1 ? "" : "s"}`} color={COLORS.blue} backgroundColor={`${COLORS.blue}18`} />
                      ) : null}
                    </View>

                    <Text style={styles.dateRange}>
                      {formatDate(item.started_on)} to {formatDate(item.ended_on)}
                    </Text>

                    {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>

          {mesocyclesQuery.data.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No mesocycles yet</Text>
              <Text style={styles.emptySubtext}>
                Create a block when you want to compare structured training phases.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Pressable style={styles.createButton} onPress={() => setShowCreateModal(true)}>
        <Feather name="plus" size={18} color={COLORS.purple} />
        <Text style={styles.createButtonText}>Create New Mesocycle</Text>
      </Pressable>

      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Mesocycle</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Feather name="x" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Strength Block"
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
              value={startedOn}
              onChangeText={setStartedOn}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
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
              placeholder="Optional training block notes"
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
              label={createMesocycleMutation.isPending ? "Creating..." : "Create Mesocycle"}
              onPress={() => {
                void handleCreateMesocycle();
              }}
              disabled={createMesocycleMutation.isPending}
              style={{ marginTop: 20 }}
              icon={createMesocycleMutation.isPending ? <ActivityIndicator color="#000000" /> : undefined}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  summaryCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
  summaryValue: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  summaryLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  infoCard: { marginTop: 16, borderColor: `${COLORS.purple}30`, backgroundColor: `${COLORS.purple}10` },
  infoRow: { flexDirection: "row", gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  infoText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  section: { marginTop: 24 },
  mesoCard: { marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  mesoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  mesoHeaderLeft: { flex: 1, paddingRight: 12 },
  mesoName: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  mesoGoal: { color: COLORS.muted, fontSize: 12, marginTop: 4, textTransform: "capitalize" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  dateRange: { color: COLORS.text, fontSize: 12, fontWeight: "600", marginTop: 14 },
  notes: { color: COLORS.muted, fontSize: 11, lineHeight: 18, marginTop: 8 },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  emptySubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.purple}30`,
    borderStyle: "dashed",
  },
  createButtonText: { color: COLORS.purple, fontSize: 14, fontWeight: "700" },
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
});
