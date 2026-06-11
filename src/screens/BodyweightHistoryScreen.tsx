import { useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useBodyWeightLogsQuery } from "../api/queries";
import { useCreateBodyWeightLog, useDeleteBodyWeightLog } from "../api/mutations";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton, RoundButton, IconButton } from "../components/ui/Button";
import { SectionEyebrow, Tag } from "../components/ui/Indicators";
import { TrendChart } from "../components/ui/Charts";
import { Icon } from "../components/ui/Icon";
import { formatDateLabel, formatKg, formatShortDate } from "../utils/format";
import { getApiErrorMessage } from "../api/client";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "BodyweightHistory"> };

export function BodyweightHistoryScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const logs = useBodyWeightLogsQuery(isAuthenticated);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");

  const entries = useMemo(
    () => (logs.data ?? []).slice().sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()),
    [logs.data],
  );

  const chartData = useMemo(
    () =>
      entries
        .slice()
        .reverse()
        .map((entry) => ({ label: formatShortDate(entry.logged_at), value: entry.weight_kg })),
    [entries],
  );

  const latest = entries[0]?.weight_kg ?? 0;
  const previous = entries[entries.length - 1]?.weight_kg ?? latest;
  const change = latest - previous;

  const createLog = useCreateBodyWeightLog({
    onSuccess: () => {
      setNewWeight("");
      setNewNote("");
      setShowAdd(false);
    },
  });

  const deleteLog = useDeleteBodyWeightLog();

  const addEntry = () => {
    if (!newWeight) return;
    createLog.mutate({
      weight_kg: Number(newWeight),
      logged_at: new Date().toISOString().split("T")[0],
      notes: newNote || null,
    });
  };

  return (
    <Screen>
      <BackHeader
        title="Bodyweight"
        onBack={() => navigation.goBack()}
        right={
          <IconButton icon="plus" onPress={() => setShowAdd(true)} color={COLORS.teal} />
        }
      />

      <View style={{ marginTop: SPACING.xl3 }}>
        <View style={styles.rowGap}>
          <Text style={styles.bigMetric}>{latest ? latest.toFixed(1) : "-"}</Text>
          <Text style={styles.metricSuffix}>kg</Text>
          {entries.length > 1 ? (
            <Text style={[styles.metricChange, { color: change < 0 ? COLORS.green : COLORS.red }]}>
              <Icon name={change < 0 ? "trending-down" : "trending-up"} size={12} color={change < 0 ? COLORS.green : COLORS.red} />
              {" "}{Math.abs(change).toFixed(1)} kg
            </Text>
          ) : null}
        </View>
        <Text style={styles.detailLabel}>
          {entries.length > 1 ? `vs. oldest entry (${previous} kg)` : "Add entries to track change"}
        </Text>
      </View>

      {chartData.length > 0 ? (
        <Card elevated style={{ marginTop: SPACING.xl3 }}>
          <TrendChart
            segments={[chartData]}
            height={128}
            color={COLORS.teal}
          />
        </Card>
      ) : null}

      {logs.isPending ? <LoadingCard label="Loading bodyweight logs..." /> : null}
      {logs.isError ? <ErrorCard error={logs.error} onRetry={() => logs.refetch()} /> : null}

      <View style={{ marginTop: SPACING.xl3 }}>
        <SectionEyebrow>All Entries</SectionEyebrow>
        <View style={{ gap: SPACING.lg, marginTop: SPACING.xl }}>
          {entries.map((entry, index) => (
            <Card key={entry.id} elevated style={[styles.listRowCard, { flexDirection: "row", alignItems: "center", gap: SPACING.lg }]}>
              <View style={[styles.listRowBody, { flex: 1 }]}>
                <View style={styles.rowGap}>
                  <Text style={[styles.cardTitle, index === 0 ? { color: COLORS.teal } : null]}>
                    {formatKg(entry.weight_kg)}
                  </Text>
                  {index === 0 ? <Tag label="Latest" color={COLORS.teal} /> : null}
                  {index > 0 ? (
                    <Text style={[styles.smallStrongText, { color: entry.weight_kg < entries[index - 1].weight_kg ? COLORS.green : COLORS.red }]}>
                      <Icon name={entry.weight_kg < entries[index - 1].weight_kg ? "trending-down" : "trending-up"} size={10} color={entry.weight_kg < entries[index - 1].weight_kg ? COLORS.green : COLORS.red} />
                      {" "}{Math.abs(entry.weight_kg - entries[index - 1].weight_kg).toFixed(1)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.detailLabel}>
                  {formatDateLabel(entry.logged_at)}
                  {entry.notes ? ` - ${entry.notes}` : ""}
                </Text>
              </View>
              <Pressable onPress={() => deleteLog.mutate(entry.id)} style={[styles.deleteWrap, { width: 32, height: 32, borderRadius: RADIUS.stepper, backgroundColor: COLORS.redDark, alignItems: "center", justifyContent: "center" }]}>
                <Icon name="trash-2" size={13} color={COLORS.red} />
              </Pressable>
            </Card>
          ))}
          {!logs.isPending && entries.length === 0 ? (
            <EmptyCard title="No entries yet" text="Log your first bodyweight entry." />
          ) : null}
        </View>
      </View>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={[styles.modalScrim, { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }]}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAdd(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.xl5, paddingTop: SPACING.xl2, paddingBottom: SPACING.xl6 }]}>
            <View style={{ width: 40, height: 4, borderRadius: 4, alignSelf: "center", backgroundColor: COLORS.faint, marginBottom: SPACING.xl3 }} />
            <View style={styles.rowBetween}>
              <Text style={styles.sheetTitle}>Log Bodyweight</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Icon name="x" size={18} color={COLORS.muted} />
              </Pressable>
            </View>
            <View style={{ marginTop: SPACING.xl3 }}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="e.g. 82.5"
                placeholderTextColor={COLORS.faint}
                style={[styles.modalMetricInput, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
                keyboardType="decimal-pad"
                contextMenuHidden
              />
            </View>
            <View style={{ marginTop: SPACING.xl3 }}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="e.g. Morning, fasted"
                placeholderTextColor={COLORS.faint}
                style={[styles.input, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
              />
            </View>
            <PrimaryButton
              label={createLog.isPending ? "Saving..." : "Save Entry"}
              onPress={addEntry}
              disabled={createLog.isPending}
              icon={<Icon name="check" size={16} color="#000000" />}
              style={{ marginTop: SPACING.xl4 }}
            />
            {createLog.isError ? (
              <Text style={[styles.errorText, { marginTop: SPACING.lg }]}>{getApiErrorMessage(createLog.error)}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
