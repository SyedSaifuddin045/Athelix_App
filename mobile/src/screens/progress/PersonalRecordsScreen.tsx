import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { ActivityIndicator } from "react-native";
import { RootStackScreenProps } from "../../types/navigation";
import { usePersonalRecords } from "../../hooks";
import type { PersonalRecord } from "../../api/types";

type Props = RootStackScreenProps<"PersonalRecords">;

const RECORD_TYPES = ["All", "1RM", "3RM", "5RM", "e1RM"];

interface GroupedRecord {
  exerciseId: string;
  exerciseName: string;
  exerciseEmoji: string;
  records: PersonalRecord[];
}

export function PersonalRecordsScreen({ navigation }: Props): React.JSX.Element {
  const [selectedType, setSelectedType] = useState("All");
  const { data: recordsData, isLoading, error } = usePersonalRecords();

  const records = recordsData?.data || [];

  const groupedRecords = useMemo(() => {
    const grouped: Record<string, GroupedRecord> = {};
    
    records.forEach((record) => {
      const key = record.exercise_id;
      if (!grouped[key]) {
        grouped[key] = {
          exerciseId: record.exercise_id,
          exerciseName: record.exercise_name,
          exerciseEmoji: record.exercise_emoji || "💪",
          records: [],
        };
      }
      grouped[key].records.push(record);
    });

    return Object.values(grouped);
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (selectedType === "All") return groupedRecords;
    return groupedRecords.map((group) => ({
      ...group,
      records: group.records.filter((r) => r.record_type === selectedType),
    })).filter((group) => group.records.length > 0);
  }, [groupedRecords, selectedType]);

  const totalPrs = records.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderRecord = ({ item }: { item: GroupedRecord }) => (
    <Card style={styles.recordCard}>
      <Pressable onPress={() => (navigation as any).navigate("ExerciseProgress", { id: item.exerciseId })}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordEmoji}>{item.exerciseEmoji}</Text>
          <View style={styles.recordInfo}>
            <Text style={styles.recordExercise}>{item.exerciseName}</Text>
            <View style={styles.recordStats}>
              <Tag label={`${item.records.length} records`} color={COLORS.gold} backgroundColor={`${COLORS.gold}20`} />
            </View>
          </View>
        </View>

        <View style={styles.recordsList}>
          {item.records.map((record, index) => (
            <View
              key={record.id || index}
              style={styles.recordRow}
            >
              <View style={styles.recordLeft}>
                <Text style={styles.recordType}>{record.record_type}</Text>
                <Text style={styles.recordDate}>{formatDate(record.achieved_at)}</Text>
              </View>
              <View style={styles.recordRight}>
                <Text style={styles.recordValue}>
                  {record.value} {record.weight ? `@${record.weight}kg x${record.reps}` : ""}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Pressable>
    </Card>
  );

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader 
        title="Personal Records" 
        subtitle={`${totalPrs} total records`} 
        onBack={() => navigation.goBack()} 
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Feather name="award" size={18} color={COLORS.gold} />
          <Text style={styles.summaryValue}>{totalPrs}</Text>
          <Text style={styles.summaryLabel}>Total PRs</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Feather name="trending-up" size={18} color={COLORS.green} />
          <Text style={styles.summaryValue}>{groupedRecords.length}</Text>
          <Text style={styles.summaryLabel}>Exercises</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Feather name="target" size={18} color={COLORS.teal} />
          <Text style={styles.summaryValue}>{recordsData?.total || 0}</Text>
          <Text style={styles.summaryLabel}>All Records</Text>
        </Card>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {RECORD_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={[
                  styles.typeChip,
                  selectedType === type && styles.typeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    selectedType === type && styles.typeChipTextActive,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.teal} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>Failed to load records</Text>
          </View>
        ) : (
          <>
            <SectionEyebrow color={COLORS.gold}>Records ({filteredRecords.length})</SectionEyebrow>
            <FlatList
              data={filteredRecords}
              keyExtractor={(item) => item.exerciseId}
              renderItem={renderRecord}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: 12 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Feather name="award" size={40} color="rgba(255,255,255,0.15)" />
                  <Text style={styles.emptyText}>No {selectedType} records</Text>
                  <Text style={styles.emptySubtext}>Keep training to set new PRs!</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  summaryCard: { flex: 1, alignItems: "center", paddingVertical: 14 },
  summaryValue: { color: COLORS.text, fontSize: 18, fontWeight: "900", marginTop: 8 },
  summaryLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  filterSection: { marginTop: 20 },
  filterLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 10, letterSpacing: 0.4, textTransform: "uppercase" },
  filterRow: { flexDirection: "row", gap: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.06)" },
  typeChipActive: { backgroundColor: `${COLORS.gold}20`, borderColor: `${COLORS.gold}40` },
  typeChipText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  typeChipTextActive: { color: COLORS.gold },
  section: { marginTop: 24 },
  recordCard: { marginBottom: 12 },
  recordHeader: { flexDirection: "row", alignItems: "center" },
  recordEmoji: { fontSize: 32 },
  recordInfo: { flex: 1, marginLeft: 12 },
  recordExercise: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  recordStats: { flexDirection: "row", marginTop: 6 },
  recordsList: { marginTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 12 },
  recordRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  recordLeft: {},
  recordType: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  recordDate: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  recordRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  recordValue: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  loader: { marginTop: 40 },
  errorState: { alignItems: "center", paddingVertical: 60 },
  errorText: { color: COLORS.red, fontSize: 13 },
});
