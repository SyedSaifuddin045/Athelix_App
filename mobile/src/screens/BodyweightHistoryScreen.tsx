import { useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { useBodyWeightLogsQuery } from "../api/queries";
import {
  createBodyWeightLogUsersMeBodyWeightLogsPost,
  deleteBodyWeightLogUsersMeBodyWeightLogsLogIdDelete,
} from "../api/endpoints/users/users";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton, RoundButton } from "../components/ui/Button";
import { SectionEyebrow, Tag } from "../components/ui/Indicators";
import { TrendChart } from "../components/ui/Charts";
import { formatDateLabel, formatKg, formatShortDate } from "../utils/format";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";

export function BodyweightHistoryScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const logs = useBodyWeightLogsQuery(auth.isAuthenticated);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");
  const entries = useMemo(
    () => (logs.data ?? []).slice().sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()),
    [logs.data],
  );
  const chartData = entries
    .slice()
    .reverse()
    .map((entry) => ({ label: formatShortDate(entry.logged_at), value: entry.weight_kg }));

  const latest = entries[0]?.weight_kg ?? 0;
  const previous = entries[entries.length - 1]?.weight_kg ?? latest;
  const change = latest - previous;

  const createLog = useMutation({
    mutationFn: async () =>
      createBodyWeightLogUsersMeBodyWeightLogsPost({
        weight_kg: Number(newWeight),
        logged_at: new Date().toISOString().split("T")[0],
        notes: newNote || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      setNewWeight("");
      setNewNote("");
      setShowAdd(false);
    },
  });

  const deleteLog = useMutation({
    mutationFn: async (logId: number) => deleteBodyWeightLogUsersMeBodyWeightLogsLogIdDelete(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });

  const addEntry = () => {
    if (!newWeight) return;
    createLog.mutate();
  };

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader
        title="Bodyweight"
        onBack={() => navigation.goBack()}
        right={
          <RoundButton accent onPress={() => setShowAdd(true)}>
            <Feather name="plus" size={16} color={COLORS.teal} />
          </RoundButton>
        }
      />

      <View style={{ marginTop: 18 }}>
        <View style={styles.rowGap}>
          <Text style={styles.bigMetric}>{latest ? latest.toFixed(1) : "-"}</Text>
          <Text style={styles.metricSuffix}>kg</Text>
          {entries.length > 1 ? (
            <Text style={[styles.metricChange, { color: change < 0 ? COLORS.green : "#ef4444" }]}>
              {change < 0 ? "↓" : "↑"} {Math.abs(change).toFixed(1)} kg
            </Text>
          ) : null}
        </View>
        <Text style={styles.detailLabel}>{entries.length > 1 ? `vs. oldest entry (${previous} kg)` : "Add entries to track change"}</Text>
      </View>

      {chartData.length > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <TrendChart data={chartData} color={COLORS.teal} height={128} referenceValue={latest || undefined} />
        </Card>
      ) : null}

      {logs.isPending ? <LoadingCard label="Loading bodyweight logs..." /> : null}
      {logs.isError ? <ErrorCard error={logs.error} onRetry={() => logs.refetch()} /> : null}

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>All Entries</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {entries.map((entry, index) => (
            <Card key={entry.id} style={styles.listRowCard}>
              <View style={styles.listRowBody}>
                <View style={styles.rowGap}>
                  <Text style={[styles.cardTitle, index === 0 ? { color: COLORS.teal } : null]}>{formatKg(entry.weight_kg)}</Text>
                  {index === 0 ? <Tag label="Latest" color={COLORS.teal} /> : null}
                  {index > 0 ? (
                    <Text style={[styles.smallStrongText, { color: entry.weight_kg < entries[index - 1].weight_kg ? COLORS.green : "#ef4444" }]}>
                      {entry.weight_kg < entries[index - 1].weight_kg ? "↓" : "↑"}
                      {Math.abs(entry.weight_kg - entries[index - 1].weight_kg).toFixed(1)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.detailLabel}>
                  {formatDateLabel(entry.logged_at)}
                  {entry.notes ? ` - ${entry.notes}` : ""}
                </Text>
              </View>
              <Pressable onPress={() => deleteLog.mutate(entry.id)} style={styles.deleteWrap}>
                <Feather name="trash-2" size={13} color="rgba(239,68,68,0.8)" />
              </Pressable>
            </Card>
          ))}
          {!logs.isPending && entries.length === 0 ? <EmptyCard title="No entries yet" text="Log your first bodyweight entry." /> : null}
        </View>
      </View>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAdd(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.sheetTitle}>Log Bodyweight</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Feather name="x" size={18} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>
            <View style={{ marginTop: 18 }}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="e.g. 82.5"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.modalMetricInput}
                keyboardType="decimal-pad"
                contextMenuHidden
              />
            </View>
            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="e.g. Morning, fasted"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.input}
              />
            </View>
            <PrimaryButton
              label={createLog.isPending ? "Saving..." : "Save Entry"}
              onPress={addEntry}
              disabled={createLog.isPending}
              icon={<Feather name="check" size={16} color="#000000" />}
              style={{ marginTop: 20 }}
            />
            {createLog.isError ? (
              <Text style={[styles.errorText, { marginTop: 10 }]}>{getApiErrorMessage(createLog.error)}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
