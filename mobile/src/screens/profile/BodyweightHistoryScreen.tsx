import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, RoundButton, SectionEyebrow, PrimaryButton, TrendChart, DividerVertical } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { BODYWEIGHT_CHART, BODYWEIGHT_ENTRIES } from "../../data";

type Props = RootStackScreenProps<"BodyweightHistory">;

interface BodyweightEntry {
  id: string;
  date: string;
  weight: number;
  note?: string;
}

export function BodyweightHistoryScreen({ navigation }: Props): React.JSX.Element {
  const [entries, setEntries] = useState<BodyweightEntry[]>(BODYWEIGHT_ENTRIES);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");

  const latest = entries[0]?.weight ?? 82.4;
  const previous = entries[entries.length - 1]?.weight ?? 84.3;
  const change = latest - previous;

  const addEntry = () => {
    if (!newWeight) return;
    const next: BodyweightEntry = {
      id: Date.now().toString(),
      date: "Mar 18, 2026",
      weight: Number(newWeight),
      note: newNote,
    };
    setEntries((current) => [next, ...current]);
    setNewWeight("");
    setNewNote("");
    setShowAdd(false);
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
          <Text style={styles.bigMetric}>{latest}</Text>
          <Text style={styles.metricSuffix}>kg</Text>
          <Text style={[styles.metricChange, { color: change < 0 ? COLORS.green : "#ef4444" }]}>
            {change < 0 ? "↓" : "↑"} {Math.abs(change).toFixed(1)} kg
          </Text>
        </View>
        <Text style={styles.detailLabel}>vs. 30 days ago ({previous} kg)</Text>
      </View>

      <Card style={{ marginTop: 16 }}>
        <TrendChart data={BODYWEIGHT_CHART} color={COLORS.teal} height={128} referenceValue={82.4} />
      </Card>

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>All Entries</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {entries.map((entry, index) => (
            <Card key={entry.id} style={styles.listRowCard}>
              <View style={styles.listRowBody}>
                <View style={styles.rowGap}>
                  <Text style={[styles.cardTitle, index === 0 ? { color: COLORS.teal } : null]}>{entry.weight} kg</Text>
                  {index === 0 ? <Tag label="Latest" color={COLORS.teal} /> : null}
                  {index > 0 ? (
                    <Text style={[styles.smallStrongText, { color: entry.weight < entries[index - 1].weight ? COLORS.green : "#ef4444" }]}>
                      {entry.weight < entries[index - 1].weight ? "↓" : "↑"}
                      {Math.abs(entry.weight - entries[index - 1].weight).toFixed(1)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.detailLabel}>
                  {entry.date}
                  {entry.note ? ` - ${entry.note}` : ""}
                </Text>
              </View>
              <Pressable onPress={() => setEntries((current) => current.filter((item) => item.id !== entry.id))} style={styles.deleteWrap}>
                <Feather name="trash-2" size={13} color="rgba(239,68,68,0.8)" />
              </Pressable>
            </Card>
          ))}
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
              label="Save Entry"
              onPress={addEntry}
              icon={<Feather name="check" size={16} color="#000000" />}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowGap: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  bigMetric: { color: COLORS.text, fontSize: 40, fontWeight: "900" },
  metricSuffix: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  metricChange: { fontSize: 11, fontWeight: "700" },
  detailLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16 },
  listRowCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  listRowBody: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  smallStrongText: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  deleteWrap: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.1)" },
  modalScrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" },
  modalBackdrop: { flex: 1 },
  bottomSheet: { backgroundColor: "#111d1b", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 24, paddingTop: 14, paddingBottom: 26 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { color: COLORS.text, fontSize: 22, fontWeight: "900", textAlign: "center" },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  modalMetricInput: { width: "100%", minHeight: 70, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", color: "#ffffff", fontSize: 28, fontWeight: "900", textAlign: "center" },
  input: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#ffffff", paddingHorizontal: 16, fontSize: 14 },
});
