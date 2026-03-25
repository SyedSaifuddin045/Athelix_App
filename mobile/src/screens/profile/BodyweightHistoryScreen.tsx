import React, { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal, FlatList, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, RoundButton, SectionEyebrow, PrimaryButton, TrendChart } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useBodyWeightLogs, useCreateBodyWeightLog, useDeleteBodyWeightLog } from "../../hooks";
import type { BodyWeightLog } from "../../api/types";

type Props = RootStackScreenProps<"BodyweightHistory">;

export function BodyweightHistoryScreen({ navigation }: Props): React.JSX.Element {
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");

  const { data: logsData, isLoading } = useBodyWeightLogs({ limit: 30 });
  const createLog = useCreateBodyWeightLog();
  const deleteLog = useDeleteBodyWeightLog();

  const entries: BodyWeightLog[] = logsData?.data || [];

  const chartData = useMemo(() => {
    return [...entries].reverse().slice(0, 10).map((entry) => ({
      label: new Date(entry.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: entry.weight,
    }));
  }, [entries]);

  const latest = entries[0]?.weight;
  const earliest = entries[entries.length - 1]?.weight;
  const change = latest && earliest ? latest - earliest : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddEntry = async () => {
    if (!newWeight) {
      Alert.alert("Error", "Please enter a weight value.");
      return;
    }

    try {
      await createLog.mutateAsync({
        weight: parseFloat(newWeight),
        note: newNote || undefined,
      });
      setNewWeight("");
      setNewNote("");
      setShowAdd(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save entry. Please try again.");
    }
  };

  const handleDeleteEntry = (logId: string) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteLog.mutate(logId),
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: BodyWeightLog; index: number }) => {
    const prevWeight = entries[index + 1]?.weight;
    const weightChange = prevWeight ? item.weight - prevWeight : 0;
    const isPositiveChange = weightChange > 0;

    return (
      <Card style={styles.listRowCard}>
        <Pressable style={styles.listRowBody}>
          <View style={styles.rowGap}>
            <Text style={[styles.cardTitle, index === 0 && { color: COLORS.teal }]}>
              {item.weight.toFixed(1)} kg
            </Text>
            {index === 0 && <Tag label="Latest" color={COLORS.teal} />}
            {prevWeight && (
              <Text style={[styles.smallStrongText, { color: isPositiveChange ? COLORS.red : COLORS.green }]}>
                {isPositiveChange ? "↑" : "↓"}
                {Math.abs(weightChange).toFixed(1)}
              </Text>
            )}
          </View>
          <Text style={styles.detailLabel}>
            {formatDate(item.logged_at)}
            {item.note ? ` - ${item.note}` : ""}
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => handleDeleteEntry(item.id)} 
          style={styles.deleteWrap}
        >
          <Feather name="trash-2" size={13} color="rgba(239,68,68,0.8)" />
        </Pressable>
      </Card>
    );
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

      {latest && (
        <View style={{ marginTop: 18 }}>
          <View style={styles.rowGap}>
            <Text style={styles.bigMetric}>{latest.toFixed(1)}</Text>
            <Text style={styles.metricSuffix}>kg</Text>
            {change !== 0 && (
              <Text style={[styles.metricChange, { color: change < 0 ? COLORS.green : COLORS.red }]}>
                {change < 0 ? "↓" : "↑"} {Math.abs(change).toFixed(1)} kg
              </Text>
            )}
          </View>
          {earliest && (
            <Text style={styles.detailLabel}>
              vs. first entry ({earliest.toFixed(1)} kg)
            </Text>
          )}
        </View>
      )}

      {chartData.length > 1 && (
        <Card style={{ marginTop: 16 }}>
          <TrendChart 
            data={chartData} 
            color={COLORS.teal} 
            height={128} 
            referenceValue={latest} 
          />
        </Card>
      )}

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>All Entries ({entries.length})</SectionEyebrow>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading entries...</Text>
          </View>
        ) : entries.length > 0 ? (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
            contentContainerStyle={{ marginTop: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>Tap + to log your first entry</Text>
          </View>
        )}
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
              label={createLog.isPending ? "Saving..." : "Save Entry"}
              onPress={handleAddEntry}
              disabled={createLog.isPending || !newWeight}
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
  loadingContainer: { marginTop: 40, alignItems: "center" },
  loadingText: { color: COLORS.muted, fontSize: 13 },
  emptyContainer: { marginTop: 40, alignItems: "center" },
  emptyText: { color: COLORS.text, fontSize: 14 },
  emptySubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  modalScrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" },
  modalBackdrop: { flex: 1 },
  bottomSheet: { backgroundColor: "#111d1b", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 24, paddingTop: 14, paddingBottom: 26 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { color: COLORS.text, fontSize: 22, fontWeight: "900", textAlign: "center" },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  modalMetricInput: { width: "100%", minHeight: 70, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", color: "#ffffff", fontSize: 28, fontWeight: "900", textAlign: "center" },
  input: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#ffffff", paddingHorizontal: 16, fontSize: 14 },
});
