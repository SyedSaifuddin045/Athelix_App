import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { PERSONAL_RECORDS, RECORD_TYPES } from "../../data";

type Props = RootStackScreenProps<"PersonalRecords">;

export function PersonalRecordsScreen({ navigation }: Props): React.JSX.Element {
  const [selectedType, setSelectedType] = useState("All");

  const filteredRecords = selectedType === "All"
    ? PERSONAL_RECORDS
    : PERSONAL_RECORDS.filter((pr) =>
        pr.records.some((record) => record.type === selectedType)
      );

  const totalPrs = PERSONAL_RECORDS.reduce((sum, pr) => sum + pr.records.length, 0);

  const renderRecordType = ({ item }: { item: typeof RECORD_TYPES[number] }) => (
    <Pressable
      onPress={() => setSelectedType(item)}
      style={[
        styles.typeChip,
        selectedType === item && styles.typeChipActive,
      ]}
    >
      <Text
        style={[
          styles.typeChipText,
          selectedType === item && styles.typeChipTextActive,
        ]}
      >
        {item}
      </Text>
    </Pressable>
  );

  const renderRecord = ({ item }: { item: typeof PERSONAL_RECORDS[0] }) => (
    <Card style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordEmoji}>{item.emoji}</Text>
        <View style={styles.recordInfo}>
          <Text style={styles.recordExercise}>{item.exercise}</Text>
          <View style={styles.recordStats}>
            <Tag label={`${item.records.length} records`} color={COLORS.gold} backgroundColor={`${COLORS.gold}20`} />
          </View>
        </View>
      </View>

      <View style={styles.recordsList}>
        {item.records.map((record, index) => (
          <View
            key={index}
            style={[
              styles.recordRow,
              record.isNew && styles.recordRowNew,
            ]}
          >
            <View style={styles.recordLeft}>
              <Text style={styles.recordType}>{record.type}</Text>
              <Text style={styles.recordDate}>{record.date}</Text>
            </View>
            <View style={styles.recordRight}>
              <Text style={[styles.recordValue, record.isNew && styles.recordValueNew]}>
                {record.value}
              </Text>
              {record.isNew && <Tag label="NEW" color={COLORS.green} backgroundColor={`${COLORS.green}20`} />}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title="Personal Records" subtitle={`${totalPrs} total records`} onBack={() => navigation.goBack()} />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Feather name="award" size={18} color={COLORS.gold} />
          <Text style={styles.summaryValue}>{totalPrs}</Text>
          <Text style={styles.summaryLabel}>Total PRs</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Feather name="trending-up" size={18} color={COLORS.green} />
          <Text style={styles.summaryValue}>3</Text>
          <Text style={styles.summaryLabel}>This Month</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Feather name="target" size={18} color={COLORS.teal} />
          <Text style={styles.summaryValue}>9</Text>
          <Text style={styles.summaryLabel}>Exercises</Text>
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
        <SectionEyebrow color={COLORS.gold}>Records ({filteredRecords.length})</SectionEyebrow>
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
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
  recordRowNew: { backgroundColor: `${COLORS.green}08`, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 },
  recordLeft: {},
  recordType: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  recordDate: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  recordRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  recordValue: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  recordValueNew: { color: COLORS.green },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
});
