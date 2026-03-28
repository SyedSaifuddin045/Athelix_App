import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card } from "../../components";
import { TabScreenProps } from "../../types/navigation";
import { useExercises, useExerciseFilters } from "../../hooks";
import type { ExerciseListItem } from "../../api/types";

type Props = TabScreenProps<"Explore">;

export function ExploreScreen({ navigation }: Props): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedTarget, setSelectedTarget] = useState("All");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: filtersData } = useExerciseFilters();
  const { data: exercisesData, isLoading, isFetching } = useExercises({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    q: debouncedSearch || undefined,
    body_part: selectedBodyPart !== "All" ? selectedBodyPart : undefined,
    equipment: selectedEquipment !== "All" ? selectedEquipment : undefined,
    target: selectedTarget !== "All" ? selectedTarget : undefined,
  });

  const bodyParts = useMemo(() => {
    return ["All", ...(filtersData?.body_parts || [])];
  }, [filtersData?.body_parts]);

  const equipment = useMemo(() => {
    return ["All", ...(filtersData?.equipment || [])];
  }, [filtersData?.equipment]);

  const targets = useMemo(() => {
    return ["All", ...(filtersData?.targets || [])];
  }, [filtersData?.targets]);

  const exercises = exercisesData?.data || [];
  const totalExercises = exercisesData?.total || 0;

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(text);
      setPage(0);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleBodyPartSelect = useCallback((bodyPart: string) => {
    setSelectedBodyPart(bodyPart);
    setPage(0);
  }, []);

  const handleEquipmentSelect = useCallback((equip: string) => {
    setSelectedEquipment(equip);
    setPage(0);
  }, []);

  const handleTargetSelect = useCallback((target: string) => {
    setSelectedTarget(target);
    setPage(0);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && exercises.length < totalExercises) {
      setPage((p) => p + 1);
    }
  }, [isFetching, exercises.length, totalExercises]);

  const renderExerciseItem = useCallback(({ item }: { item: ExerciseListItem }) => {
    return (
      <Pressable onPress={() => (navigation as any).navigate("ExerciseDetail", { id: item.id })}>
        <Card style={styles.exerciseCard}>
          <View style={styles.exerciseRow}>
            <View style={styles.exerciseLeft}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <View style={styles.exerciseMeta}>
                  <Text style={styles.exerciseMuscle}>{item.body_part || "Various"}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.exerciseEquipment}>{item.equipment || "None"}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.exerciseEquipment}>{item.target || "Various"}</Text>
                </View>
              </View>
            </View>
            <View style={styles.exerciseRight}>
              <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }, [navigation]);

  const keyExtractor = useCallback((item: ExerciseListItem) => item.id, []);

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Library</Text>
        <Text style={styles.subtitle}>{totalExercises} exercises available</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color="rgba(255,255,255,0.42)" />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search exercises..."
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => {
            setSearchQuery("");
            setDebouncedSearch("");
          }}>
            <Feather name="x" size={16} color="rgba(255,255,255,0.42)" />
          </Pressable>
        )}
      </View>

      <View style={styles.filters}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Body Part</Text>
          <FlatList
            horizontal
            data={bodyParts}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleBodyPartSelect(item)}
                style={[
                  styles.filterChip,
                  selectedBodyPart === item && styles.filterChipActive,
                ]}
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
            )}
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Equipment</Text>
          <FlatList
            horizontal
            data={equipment}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleEquipmentSelect(item)}
                style={[
                  styles.filterChip,
                  selectedEquipment === item && styles.filterChipActive,
                ]}
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
            )}
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Target Muscle</Text>
          <FlatList
            horizontal
            data={targets}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleTargetSelect(item)}
                style={[
                  styles.filterChip,
                  selectedTarget === item && styles.filterChipActive,
                ]}
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
            )}
          />
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{exercises.length} of {totalExercises} results</Text>
        {isFetching && <ActivityIndicator size="small" color={COLORS.teal} />}
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={exercises}
          keyExtractor={keyExtractor}
          renderItem={renderExerciseItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Feather name="search" size={40} color="rgba(255,255,255,0.15)" />
                <Text style={styles.emptyText}>No exercises found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={COLORS.teal} />
              </View>
            ) : null
          }
        />
      </View>
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
  filterLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
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
  resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 12 },
  resultsCount: { color: COLORS.muted, fontSize: 12 },
  listContainer: { flex: 1, minHeight: 200 },
  exerciseCard: { marginBottom: 10 },
  exerciseRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exerciseLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  exerciseMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" },
  exerciseMuscle: { color: COLORS.muted, fontSize: 11 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.28)", marginHorizontal: 6 },
  exerciseEquipment: { color: COLORS.muted, fontSize: 11 },
  exerciseRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  loadingFooter: { paddingVertical: 20, alignItems: "center" },
});
