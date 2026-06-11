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
import { useExerciseFiltersQuery, useExercisesQuery } from "../api/queries";
import type { ExerciseResponse } from "../api/model";
import { getApiErrorMessage } from "../api/client";

function muscleAccentColor(muscle: string | null | undefined): string | undefined {
  const key = (muscle ?? "").toLowerCase();
  if (key.includes("chest")) return "#FF5A36";
  if (key.includes("back")) return "#22C55E";
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring") || key.includes("glute"))
    return "#8B5CF6";
  if (key.includes("shoulder")) return "#3B82F6";
  if (key.includes("arm") || key.includes("bicep") || key.includes("tricep")) return "#F59E0B";
  return undefined;
}

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Arms", "Shoulders", "Core"];

function groupForExercise(exercise: ExerciseResponse): string {
  const target = (exercise.target ?? "").toLowerCase();
  if (target.includes("chest")) return "Chest";
  if (target.includes("back")) return "Back";
  if (target.includes("leg") || target.includes("quad") || target.includes("hamstring") || target.includes("glute"))
    return "Legs";
  if (target.includes("shoulder")) return "Shoulders";
  if (target.includes("arm") || target.includes("bicep") || target.includes("tricep")) return "Arms";
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

  const gridParams = useMemo(
    () => ({
      q: undefined as string | undefined,
      target: undefined as string | undefined,
      equipment: equipment !== "All" ? equipment : undefined,
      limit: 200,
      offset: 0,
      ...(trackedOnly ? { tracked: true } : {}),
    }),
    [equipment, trackedOnly],
  );

  const listParams = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
      target: selectedGroup ? selectedGroup.toLowerCase() : undefined,
      equipment: equipment !== "All" ? equipment : undefined,
      limit: 100,
      offset: 0,
      ...(trackedOnly ? { tracked: true } : {}),
    }),
    [debouncedQuery, equipment, selectedGroup, trackedOnly],
  );

  const gridQuery = useExercisesQuery(gridParams, enabled && !selectedGroup && !debouncedQuery.trim());
  const listQuery = useExercisesQuery(listParams, enabled && (!!selectedGroup || !!debouncedQuery.trim()));

  const activeQuery = selectedGroup || debouncedQuery.trim() ? listQuery : gridQuery;
  const isPending = activeQuery.isPending;
  const isError = activeQuery.isError;
  const error = activeQuery.error;

  const isSearching = !!debouncedQuery.trim();

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of MUSCLE_GROUPS) counts[group] = 0;
    if (gridQuery.data?.items) {
      for (const exercise of gridQuery.data.items) {
        const g = groupForExercise(exercise);
        if (counts[g] !== undefined) counts[g]++;
      }
    }
    return counts;
  }, [gridQuery.data?.items]);

  const filteredExercises = useMemo(() => {
    const items = activeQuery.data?.items ?? [];
    if (isSearching) return items;
    if (selectedGroup) {
      return items.filter((e) => groupForExercise(e) === selectedGroup);
    }
    return items;
  }, [activeQuery.data?.items, isSearching, selectedGroup]);

  const equipmentOptions = useMemo(
    () =>
      ["All", ...(filters.data?.equipment ?? ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"]).filter((item) => item !== "All")],
    [filters.data?.equipment],
  );

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
    return [];
  }, [isSearching, filteredExercises, selectedGroup]);

  const showGrid = !isSearching && !selectedGroup;

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

      {showFilters ? (
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
      ) : null}

      {showGrid ? (
        <FlatList
          data={MUSCLE_GROUPS}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
        <FlatList
          data={gridExercises}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => renderExerciseItem(item)}
        />
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
            <View style={{ flex: 1, marginTop: 14 }}>{content}</View>
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
  },
  pickContainer: {
    flex: 1,
  },
  headerRow: {
    paddingTop: 8,
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
    gap: 10,
    marginTop: 18,
    marginBottom: 12,
  },
  searchWrap: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  equipChipRow: {
    gap: 8,
    paddingBottom: 14,
  },
  equipChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  equipChipActive: {
    backgroundColor: "rgba(255,90,54,0.15)",
    borderColor: "rgba(255,90,54,0.35)",
  },
  equipChipText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
  },
  equipChipTextActive: {
    color: COLORS.teal,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
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
    gap: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  listHeaderAccent: {
    width: 3,
    height: 20,
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
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
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
    paddingBottom: 34,
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
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 34,
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
