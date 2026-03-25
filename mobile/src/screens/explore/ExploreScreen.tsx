import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Card, Tag, ScreenState } from "../../components";
import { COLORS } from "../../theme/colors";
import { TabScreenProps } from "../../types/navigation";
import { useExerciseFiltersQuery, useExercisesQuery } from "../../features/exercises/hooks";
import type { ExerciseSummary } from "../../features/exercises/schemas";

type Props = TabScreenProps<"Explore">;

export function ExploreScreen({ navigation }: Props): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedTarget, setSelectedTarget] = useState("All");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const filtersQuery = useExerciseFiltersQuery();
  const exercisesQuery = useExercisesQuery({
    q: debouncedQuery || undefined,
    body_part: selectedBodyPart === "All" ? undefined : selectedBodyPart,
    equipment: selectedEquipment === "All" ? undefined : selectedEquipment,
    target: selectedTarget === "All" ? undefined : selectedTarget,
  });

  const exerciseItems = useMemo(
    () => exercisesQuery.data?.items ?? [],
    [exercisesQuery.data],
  );

  const total = exercisesQuery.data?.total ?? 0;
  const bodyPartFilters = ["All", ...(filtersQuery.data?.body_parts ?? [])];
  const equipmentFilters = ["All", ...(filtersQuery.data?.equipment ?? [])];
  const targetFilters = ["All", ...(filtersQuery.data?.targets ?? [])];

  const renderExerciseItem = ({ item }: { item: ExerciseSummary }) => (
    <Pressable
      onPress={() =>
        navigation.navigate("ExerciseDetail", { exerciseId: item.id })
      }
    >
      <Card style={styles.exerciseCard}>
        <View style={styles.exerciseRow}>
          <View style={styles.exerciseLeft}>
            <View style={styles.exerciseGlyph}>
              <Feather name="activity" size={18} color={COLORS.teal} />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <View style={styles.exerciseMeta}>
                {item.target ? <Text style={styles.exerciseMuscle}>{item.target}</Text> : null}
                {item.body_part ? (
                  <>
                    <View style={styles.dot} />
                    <Text style={styles.exerciseEquipment}>{item.body_part}</Text>
                  </>
                ) : null}
                {item.equipment ? (
                  <>
                    <View style={styles.dot} />
                    <Text style={styles.exerciseEquipment}>{item.equipment}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
        </View>
      </Card>
    </Pressable>
  );

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Library</Text>
        <Text style={styles.subtitle}>
          {total > 0 ? `${total} exercises available` : "Search the authenticated exercise catalog"}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color="rgba(255,255,255,0.42)" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search exercises..."
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x" size={16} color="rgba(255,255,255,0.42)" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filters}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Body Part</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {bodyPartFilters.map((item) => (
              <Pressable
                key={item}
                onPress={() => setSelectedBodyPart(item)}
                style={[styles.filterChip, selectedBodyPart === item && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedBodyPart === item && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Equipment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {equipmentFilters.map((item) => (
              <Pressable
                key={item}
                onPress={() => setSelectedEquipment(item)}
                style={[styles.filterChip, selectedEquipment === item && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedEquipment === item && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Target</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {targetFilters.map((item) => (
              <Pressable
                key={item}
                onPress={() => setSelectedTarget(item)}
                style={[styles.filterChip, selectedTarget === item && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedTarget === item && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{exerciseItems.length} loaded</Text>
        {filtersQuery.isFetching || exercisesQuery.isFetching ? (
          <Tag label="Syncing" color={COLORS.teal} backgroundColor={`${COLORS.teal}20`} />
        ) : null}
      </View>

      {exercisesQuery.isLoading && exerciseItems.length === 0 ? (
        <ScreenState
          title="Loading exercise catalog"
          message="Fetching `/exercises`."
          loading
        />
      ) : exercisesQuery.isError && exerciseItems.length === 0 ? (
        <ScreenState
          title="Exercise catalog unavailable"
          message="The app could not load `/exercises`."
          actionLabel="Retry"
          onAction={() => {
            void exercisesQuery.refetch();
          }}
        />
      ) : (
        <>
          {exerciseItems.map((item) => (
            <View key={item.id}>{renderExerciseItem({ item })}</View>
          ))}

          {exerciseItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={40} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>No exercises found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, marginBottom: 16 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchInput: { flex: 1, color: "#ffffff", fontSize: 14 },
  filters: { marginTop: 16 },
  filterSection: { marginBottom: 12 },
  filterRow: { flexDirection: "row" },
  filterLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  filterChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: `${COLORS.teal}20`, borderColor: `${COLORS.teal}40` },
  filterChipText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { color: COLORS.teal },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  resultsCount: { color: COLORS.muted, fontSize: 12 },
  exerciseCard: { marginBottom: 10 },
  exerciseRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exerciseLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  exerciseGlyph: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: `${COLORS.teal}14`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  exerciseMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" },
  exerciseMuscle: { color: COLORS.muted, fontSize: 11 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginHorizontal: 6,
  },
  exerciseEquipment: { color: COLORS.muted, fontSize: 11 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
});
