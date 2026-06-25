import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { COLORS } from "../theme/colors";
import { Icon } from "../components/ui/Icon";
import { Card } from "../components/ui/Card";
import { useAllExercisesQuery, useExerciseFiltersQuery, useExercisesQuery } from "../api/queries";
import type { ExerciseResponse } from "../api/model";
import { getApiErrorMessage } from "../api/client";

const CATEGORIES = [
  { key: null, label: "All" },
  { key: "strength", label: "Strength" },
  { key: "cardio", label: "Cardio" },
  { key: "flexibility", label: "Flexibility" },
] as const;

function muscleAccentColor(muscle: string | null | undefined): string | undefined {
  const key = (muscle ?? "").toLowerCase();
  if (key.includes("chest")) return "#FF5A36";
  if (key.includes("back")) return "#22C55E";
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring") || key.includes("glute"))
    return "#8B5CF6";
  if (key.includes("shoulder")) return "#3B82F6";
  if (key.includes("arm") || key.includes("bicep") || key.includes("tricep")) return "#F59E0B";
  if (key.includes("core") || key.includes("ab") || key.includes("waist")) return "#EC4899";
  return undefined;
}

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Arms", "Shoulders", "Core"];

function groupForExercise(exercise: ExerciseResponse): string {
  const key = `${exercise.target ?? ""} ${exercise.body_part ?? ""}`.toLowerCase();
  if (key.includes("chest")) return "Chest";
  if (key.includes("back") || key.includes("lat")) return "Back";
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring") || key.includes("glute"))
    return "Legs";
  if (key.includes("shoulder")) return "Shoulders";
  if (key.includes("arm") || key.includes("bicep") || key.includes("tricep")) return "Arms";
  return "Core";
}

type ExercisePickerVariant = "browse" | "pick";

export type ExercisePickerProps = {
  variant: ExercisePickerVariant;
  visible?: boolean;
  onClose?: () => void;
  onSelect?: (exercise: ExerciseResponse) => void;
  onNavigate?: (exerciseId: string) => void;
  showFilters?: boolean;
  title?: string;
  subtitle?: string;
  enabled?: boolean;
  trackedOnly?: boolean;
};

export function ExercisePicker({
  variant,
  visible = true,
  onClose,
  onSelect,
  onNavigate,
  showFilters = true,
  title = "Exercise Library",
  subtitle,
  enabled = true,
  trackedOnly,
}: ExercisePickerProps) {
  const screenHeight = useWindowDimensions().height;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [equipment, setEquipment] = useState("All");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filters = useExerciseFiltersQuery(enabled && showFilters);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 300);
  };

  const queryParams = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
      equipment: equipment !== "All" ? equipment : undefined,
      category: selectedCategory ?? undefined,
      limit: 100,
      offset: 0,
      ...(trackedOnly ? { tracked: true } : {}),
    }),
    [debouncedQuery, equipment, selectedCategory, trackedOnly],
  );

  const exercisesQuery = useExercisesQuery(queryParams, enabled);
  const allExercisesQuery = useAllExercisesQuery(
    enabled,
    equipment !== "All" ? equipment : undefined,
    trackedOnly,
    selectedCategory ?? undefined,
  );

  const activeQuery = exercisesQuery;
  const isPending = activeQuery.isPending;
  const isError = activeQuery.isError;
  const error = activeQuery.error;

  const isSearching = !!debouncedQuery.trim();

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of MUSCLE_GROUPS) counts[group] = 0;
    if (allExercisesQuery.data) {
      for (const exercise of allExercisesQuery.data) {
        const g = groupForExercise(exercise);
        if (counts[g] !== undefined) counts[g]++;
      }
    }
    return counts;
  }, [allExercisesQuery.data]);

  const filteredExercises = useMemo(() => {
    if (isSearching) {
      return activeQuery.data?.items ?? [];
    }
    if (selectedGroup && allExercisesQuery.data) {
      return allExercisesQuery.data.filter((e) => groupForExercise(e) === selectedGroup);
    }
    return allExercisesQuery.data ?? [];
  }, [isSearching, selectedGroup, allExercisesQuery.data, activeQuery.data?.items]);

  const equipmentOptions = useMemo(
    () =>
      ["All", ...(filters.data?.equipment ?? ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"]).filter((item) => item !== "All")],
    [filters.data?.equipment],
  );

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedGroup(null);
  };

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
  };

  const handleBack = () => {
    setSelectedGroup(null);
  };

  const renderExerciseItem = (exercise: ExerciseResponse) => (
    <Pressable
      key={exercise.id}
      onPress={() => {
        if (variant === "browse") {
          onNavigate?.(exercise.id);
        } else {
          onSelect?.(exercise);
        }
      }}
    >
      <Card elevated accentColor={muscleAccentColor(exercise.target)} style={styles.exerciseCard}>
        <View style={styles.exerciseBody}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.exerciseDetail} numberOfLines={1}>
            {exercise.target ?? exercise.body_part ?? "Unknown"} · {exercise.equipment ?? "Unknown"}
          </Text>
        </View>
        <Icon
          name={variant === "browse" ? "chevron-right" : "plus"}
          size={14}
          color="rgba(255,255,255,0.22)"
        />
      </Card>
    </Pressable>
  );

  const renderGridItem = ({ item }: { item: string }) => {
    const count = groupCounts[item] ?? 0;
    const accent = muscleAccentColor(item) ?? "rgba(255,255,255,0.2)";
    return (
      <Pressable
        onPress={() => handleGroupSelect(item)}
        style={{ flex: 1, maxWidth: "50%" }}
      >
        <Card elevated accentColor={accent} style={styles.gridCard}>
          <Text style={styles.gridCardName} numberOfLines={1}>
            {item}
          </Text>
          <Text style={styles.gridCardCount}>{count}</Text>
        </Card>
      </Pressable>
    );
  };

  const renderListHeader = () => {
    if (isSearching) return null;
    if (selectedGroup) {
      const accent = muscleAccentColor(selectedGroup) ?? "rgba(255,255,255,0.2)";
      return (
        <View style={styles.listHeader}>
          <Pressable onPress={handleBack} hitSlop={8} style={styles.backButton}>
            <Icon name="arrow-left" size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
          <View style={[styles.listHeaderAccent, { backgroundColor: accent }]} />
          <Text style={styles.listHeaderTitle}>{selectedGroup}</Text>
          <Text style={styles.listHeaderCount}>{groupCounts[selectedGroup] ?? 0}</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isPending) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={COLORS.teal} />
          <Text style={styles.stateText}>Loading exercises...</Text>
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
          <Pressable onPress={() => activeQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateText}>No exercises match your search</Text>
      </View>
    );
  };

  const gridExercises = useMemo(() => {
    if (isSearching) return filteredExercises;
    if (selectedGroup) return filteredExercises;
    if (selectedCategory) return filteredExercises;
    return [];
  }, [isSearching, filteredExercises, selectedGroup, selectedCategory]);

  const showCategoryGrid = (selectedCategory === null || selectedCategory === "strength") && !isSearching && !selectedGroup;

  const content = (
    <View style={variant === "browse" ? styles.browseContainer : styles.pickContainer}>
      {variant === "browse" && title ? (
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Icon name="search" size={15} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search exercises..."
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable
              onPress={() => {
                setQuery("");
                setDebouncedQuery("");
                if (debounceRef.current) clearTimeout(debounceRef.current);
              }}
              hitSlop={8}
            >
              <Icon name="x" size={14} color="rgba(255,255,255,0.42)" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabRow}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.label}
            onPress={() => handleCategorySelect(cat.key)}
            style={[
              styles.categoryTab,
              selectedCategory === cat.key ? styles.categoryTabActive : null,
            ]}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === cat.key ? styles.categoryTabTextActive : null,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {showFilters ? (
        <View style={styles.equipChipBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.equipChipRow}
          >
            {equipmentOptions.map((item) => (
              <Pressable
                key={item}
                onPress={() => setEquipment(item)}
                style={[styles.equipChip, equipment === item ? styles.equipChipActive : null]}
              >
                <Text style={[styles.equipChipText, equipment === item ? styles.equipChipTextActive : null]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showCategoryGrid ? (
        <FlatList
          key="grid"
          data={MUSCLE_GROUPS}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          style={styles.flatList}
          ListFooterComponent={
            isError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
                <Pressable onPress={() => activeQuery.refetch()}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={renderGridItem}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {!isSearching && selectedGroup ? (
            <View style={styles.listHeader}>
              <Pressable onPress={handleBack} hitSlop={8} style={styles.backButton}>
                <Icon name="arrow-left" size={16} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <View style={[styles.listHeaderAccent, { backgroundColor: muscleAccentColor(selectedGroup) ?? "rgba(255,255,255,0.2)" }]} />
              <Text style={styles.listHeaderTitle}>{selectedGroup}</Text>
              <Text style={styles.listHeaderCount}>{groupCounts[selectedGroup] ?? 0}</Text>
            </View>
          ) : null}
          <FlatList
            key="list"
            data={gridExercises}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            style={styles.flatList}
            ListEmptyComponent={renderEmpty}
            renderItem={({ item }) => renderExerciseItem(item)}
          />
        </View>
      )}
    </View>
  );

  if (variant === "pick") {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={onClose} />
          <View style={[styles.bottomSheet, { height: screenHeight * 0.78 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Icon name="x" size={18} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>
            <View style={{ flex: 1, marginTop: 10 }}>{content}</View>
          </View>
        </View>
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  browseContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pickContainer: {
    flex: 1,
  },
  headerRow: {
    paddingTop: 12,
    paddingBottom: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  searchWrap: {
    flex: 1,
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    paddingVertical: 0,
  },
  equipChipBar: {
    marginBottom: 10,
  },
  equipChipRow: {
    gap: 12,
    paddingHorizontal: 2,
    alignItems: "center",
  },
  equipChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  equipChipActive: {},
  equipChipText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontWeight: "500",
  },
  equipChipTextActive: {
    color: COLORS.teal,
    fontWeight: "700",
  },
  categoryTabRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 2,
    marginBottom: 14,
  },
  categoryTab: {
    paddingVertical: 2,
  },
  categoryTabActive: {},
  categoryTabText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryTabTextActive: {
    color: COLORS.teal,
    fontWeight: "800",
  },
  gridRow: {
    gap: 8,
    marginBottom: 8,
  },
  gridCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  gridCardName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  gridCardCount: {
    color: COLORS.muted,
    fontSize: 12,
    marginLeft: 8,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  listHeaderAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  listHeaderTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  listHeaderCount: {
    color: COLORS.muted,
    fontSize: 12,
  },
  flatList: {
    flex: 1,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  exerciseBody: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  exerciseDetail: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 60,
    paddingTop: 4,
  },
  centerState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
  },
  errorBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    flex: 1,
  },
  retryText: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 12,
  },
  modalScrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  modalBackdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: "#111d1b",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },
});
