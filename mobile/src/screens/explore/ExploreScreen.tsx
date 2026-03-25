import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, SectionEyebrow } from "../../components";
import { TabScreenProps } from "../../types/navigation";
import { useExercises, useExerciseFilters } from "../../hooks";
import { DIFFICULTY_COLORS } from "../../data";
import type { ExerciseListItem } from "../../api/types";

type Props = TabScreenProps<"Explore">;

const DIFFICULTY_COLOR_MAP: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

export function ExploreScreen({ navigation }: Props): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: filtersData } = useExerciseFilters();
  const { data: exercisesData, isLoading, isFetching } = useExercises({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: debouncedSearch || undefined,
    muscle: selectedMuscle !== "All" ? selectedMuscle : undefined,
    equipment: selectedEquipment !== "All" ? selectedEquipment : undefined,
  });

  const muscles = useMemo(() => {
    return ["All", ...(filtersData?.muscles || [])];
  }, [filtersData?.muscles]);

  const equipment = useMemo(() => {
    return ["All", ...(filtersData?.equipment || [])];
  }, [filtersData?.equipment]);

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

  const handleMuscleSelect = useCallback((muscle: string) => {
    setSelectedMuscle(muscle);
    setPage(0);
  }, []);

  const handleEquipmentSelect = useCallback((equip: string) => {
    setSelectedEquipment(equip);
    setPage(0);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && exercises.length < totalExercises) {
      setPage((p) => p + 1);
    }
  }, [isFetching, exercises.length, totalExercises]);

  const renderExerciseItem = useCallback(({ item }: { item: ExerciseListItem }) => {
    const difficultyColor = DIFFICULTY_COLOR_MAP[item.difficulty] || DIFFICULTY_COLORS.Intermediate;
    
    return (
      <Pressable onPress={() => (navigation as any).navigate("ExerciseDetail", { id: item.id })}>
        <Card style={styles.exerciseCard}>
          <View style={styles.exerciseRow}>
            <View style={styles.exerciseLeft}>
              <Text style={styles.exerciseEmoji}>{item.emoji || "💪"}</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <View style={styles.exerciseMeta}>
                  <Text style={styles.exerciseMuscle}>{item.primary_muscle}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.exerciseEquipment}>{item.equipment}</Text>
                </View>
              </View>
            </View>
            <View style={styles.exerciseRight}>
              <Tag
                label={item.difficulty}
                color={difficultyColor}
                backgroundColor={`${difficultyColor}20`}
              />
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
          <Text style={styles.filterLabel}>Muscle Group</Text>
          <FlatList
            horizontal
            data={muscles}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleMuscleSelect(item)}
                style={[
                  styles.filterChip,
                  selectedMuscle === item && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedMuscle === item && styles.filterChipTextActive,
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
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{exercises.length} of {totalExercises} results</Text>
        {isFetching && <ActivityIndicator size="small" color={COLORS.teal} />}
      </View>

      <FlatList
        data={exercises}
        keyExtractor={keyExtractor}
        renderItem={renderExerciseItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
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
  exerciseCard: { marginBottom: 10 },
  exerciseRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exerciseLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  exerciseEmoji: { fontSize: 28, marginRight: 12 },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  exerciseMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  exerciseMuscle: { color: COLORS.muted, fontSize: 11 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.28)", marginHorizontal: 6 },
  exerciseEquipment: { color: COLORS.muted, fontSize: 11 },
  exerciseRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  loadingFooter: { paddingVertical: 20, alignItems: "center" },
});
