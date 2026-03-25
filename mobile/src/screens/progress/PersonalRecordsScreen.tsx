import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BackHeader, Card, Screen, ScreenState, SectionEyebrow, Tag } from "../../components";
import { useExerciseLookupQueries } from "../../features/exercises/hooks";
import { useAppConfigQuery } from "../../features/meta/hooks";
import { usePersonalRecordsQuery } from "../../features/progress/hooks";
import type { PersonalRecord } from "../../features/progress/schemas";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"PersonalRecords">;

type RecordGroup = {
  exerciseId: string;
  records: PersonalRecord[];
};

function formatRecordDate(value: string): string {
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

function formatRecordType(value: string): string {
  return value.replace(/_/g, " ");
}

function groupRecords(records: PersonalRecord[]): RecordGroup[] {
  const map = new Map<string, PersonalRecord[]>();

  for (const record of records) {
    map.set(record.exercise_id, [...(map.get(record.exercise_id) ?? []), record]);
  }

  return [...map.entries()].map(([exerciseId, groupedRecords]) => ({
    exerciseId,
    records: groupedRecords,
  }));
}

export function PersonalRecordsScreen({ navigation }: Props): React.JSX.Element {
  const appConfigQuery = useAppConfigQuery();
  const [selectedType, setSelectedType] = useState("All");
  const recordTypeFilter = selectedType === "All" ? undefined : selectedType;
  const recordsQuery = usePersonalRecordsQuery({
    record_type: recordTypeFilter,
  });

  useFocusEffect(
    React.useCallback(() => {
      void recordsQuery.refetch();
      void appConfigQuery.refetch();
    }, [appConfigQuery, recordsQuery]),
  );

  const groupedRecords = useMemo(
    () => groupRecords(recordsQuery.data ?? []),
    [recordsQuery.data],
  );
  const exerciseLookup = useExerciseLookupQueries(groupedRecords.map((group) => group.exerciseId));
  const totalPrs = recordsQuery.data?.length ?? 0;
  const recentPrs = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return (recordsQuery.data ?? []).filter((record) => new Date(record.achieved_on) >= thirtyDaysAgo).length;
  }, [recordsQuery.data]);

  const supportedTypes = appConfigQuery.data?.supported_values.personal_record_types ?? [];

  if (recordsQuery.isLoading && !recordsQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState title="Loading records" message="Fetching personal record history." loading />
      </Screen>
    );
  }

  if (recordsQuery.isError) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Records unavailable"
          message="The app could not load derived personal records."
          actionLabel="Retry"
          onAction={() => {
            void recordsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

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
          <Text style={styles.summaryValue}>{recentPrs}</Text>
          <Text style={styles.summaryLabel}>Last 30 Days</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Feather name="target" size={18} color={COLORS.teal} />
          <Text style={styles.summaryValue}>{groupedRecords.length}</Text>
          <Text style={styles.summaryLabel}>Exercises</Text>
        </Card>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {["All", ...supportedTypes].map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
              >
                <Text style={[styles.typeChipText, selectedType === type && styles.typeChipTextActive]}>
                  {formatRecordType(type)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.gold}>Records ({groupedRecords.length})</SectionEyebrow>
        <FlatList
          data={groupedRecords}
          keyExtractor={(item) => item.exerciseId}
          renderItem={({ item }) => {
            const detail = exerciseLookup.map[item.exerciseId];

            return (
              <Pressable
                onPress={() =>
                  navigation.navigate("ExerciseProgress", {
                    exerciseId: item.exerciseId,
                  })
                }
              >
                <Card style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordExercise}>
                        {detail?.name ?? `Exercise ${item.exerciseId}`}
                      </Text>
                      <View style={styles.recordStats}>
                        <Tag
                          label={`${item.records.length} record${item.records.length === 1 ? "" : "s"}`}
                          color={COLORS.gold}
                          backgroundColor={`${COLORS.gold}20`}
                        />
                      </View>
                    </View>
                    <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
                  </View>

                  <View style={styles.recordsList}>
                    {item.records.map((record) => (
                      <View key={record.id} style={styles.recordRow}>
                        <View style={styles.recordLeft}>
                          <Text style={styles.recordType}>{formatRecordType(record.record_type)}</Text>
                          <Text style={styles.recordDate}>{formatRecordDate(record.achieved_on)}</Text>
                        </View>
                        <View style={styles.recordRight}>
                          <Text style={styles.recordValue}>{record.value}</Text>
                          {record.session_id ? (
                            <Tag label="Session" color={COLORS.teal} backgroundColor={`${COLORS.teal}18`} />
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              </Pressable>
            );
          }}
          scrollEnabled={false}
          contentContainerStyle={{ marginTop: 12 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="award" size={40} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>
                {selectedType === "All" ? "No records yet" : `No ${formatRecordType(selectedType)} records`}
              </Text>
              <Text style={styles.emptySubtext}>Complete workouts to generate new PRs automatically.</Text>
            </View>
          }
        />
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
  typeChipText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  typeChipTextActive: { color: COLORS.gold },
  section: { marginTop: 24 },
  recordCard: { marginBottom: 12 },
  recordHeader: { flexDirection: "row", alignItems: "center" },
  recordInfo: { flex: 1 },
  recordExercise: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  recordStats: { flexDirection: "row", marginTop: 6 },
  recordsList: { marginTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 12 },
  recordRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  recordLeft: { flex: 1, paddingRight: 12 },
  recordType: { color: COLORS.text, fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
  recordDate: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  recordRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  recordValue: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4, textAlign: "center" },
});
