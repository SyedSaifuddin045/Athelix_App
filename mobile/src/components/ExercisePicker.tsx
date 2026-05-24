import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { useExerciseFiltersQuery, useExercisesQuery } from "../api/queries";
import type { ExerciseResponse } from "../api/model";
import { getApiErrorMessage } from "../api/client";

const COLORS = {
  root: "#040707",
  screen: "#080e0e",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.42)",
  faint: "rgba(255,255,255,0.28)",
  border: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.04)",
  cardSoft: "rgba(255,255,255,0.06)",
  teal: "#00d4a8",
  green: "#22c55e",
  gold: "#fbbf24",
  orange: "#f59e0b",
  red: "#f87171",
  purple: "#8b5cf6",
  blue: "#3b82f6",
};

function exerciseEmoji(exercise?: Pick<ExerciseResponse, "body_part" | "target"> | null) {
  const key = `${exercise?.target ?? ""} ${exercise?.body_part ?? ""}`.toLowerCase();
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring") || key.includes("glute")) return "🦵";
  if (key.includes("chest") || key.includes("shoulder")) return "🏋️";
  if (key.includes("back") || key.includes("lat")) return "💪";
  return "💪";
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: COLORS.green,
  Intermediate: COLORS.orange,
  Advanced: COLORS.red,
};

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
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const filters = useExerciseFiltersQuery(enabled && showFilters);
  const exerciseParams = useMemo(
    () => ({
      q: query.trim() || undefined,
      target: muscle !== "All" ? muscle : undefined,
      equipment: equipment !== "All" ? equipment : undefined,
      limit: 100,
      offset: 0,
      ...(trackedOnly ? { tracked: true } : {}),
    }),
    [equipment, muscle, query, trackedOnly],
  );
  const exercisesQuery = useExercisesQuery(exerciseParams, enabled);

  const muscleOptions = useMemo(
    () => ["All", ...(filters.data?.targets ?? ["Chest", "Back", "Shoulders", "Legs", "Arms", "Core"].filter((item) => item !== "All"))],
    [filters.data?.targets],
  );
  const equipmentOptions = useMemo(
    () => ["All", ...(filters.data?.equipment ?? ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"].filter((item) => item !== "All"))],
    [filters.data?.equipment],
  );
  const activeFilters = useMemo(
    () => [muscle !== "All" ? muscle : null, equipment !== "All" ? equipment : null].filter(Boolean) as string[],
    [equipment, muscle],
  );

  const clearFilters = () => {
    setMuscle("All");
    setEquipment("All");
  };

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
          <Feather name="search" size={15} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises..."
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={14} color="rgba(255,255,255,0.42)" />
            </Pressable>
          ) : null}
        </View>
        {showFilters ? (
          <Pressable
            onPress={() => setShowFilterPanel((value) => !value)}
            style={[styles.filterButton, showFilterPanel ? styles.filterButtonActive : null]}
          >
            <Feather name="sliders" size={15} color={showFilterPanel ? COLORS.teal : "rgba(255,255,255,0.6)"} />
          </Pressable>
        ) : null}
      </View>

      {showFilters && showFilterPanel ? (
        <View style={styles.filterPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Muscle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {muscleOptions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setMuscle(item)}
                  style={[styles.filterChip, muscle === item ? styles.filterChipActive : null]}
                >
                  <Text style={[styles.filterChipText, muscle === item ? styles.filterChipTextActive : null]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={styles.filterSection}>
            <View style={styles.filterLabelRow}>
              <Text style={styles.filterLabel}>Equipment</Text>
              {activeFilters.length > 0 ? (
                <Pressable onPress={clearFilters}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {equipmentOptions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setEquipment(item)}
                  style={[styles.filterChip, equipment === item ? styles.filterChipActive : null]}
                >
                  <Text style={[styles.filterChipText, equipment === item ? styles.filterChipTextActive : null]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          {activeFilters.length > 0 ? (
            <View style={styles.activeFilterRow}>
              {activeFilters.map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => {
                    if (filter === muscle) setMuscle("All");
                    if (filter === equipment) setEquipment("All");
                  }}
                  style={styles.activeFilterTag}
                >
                  <Text style={styles.activeFilterText}>{filter}</Text>
                  <Feather name="x" size={10} color={COLORS.teal} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>{exercisesQuery.data?.total ?? 0} exercises</Text>
        {exercisesQuery.isFetching ? <ActivityIndicator size="small" color={COLORS.teal} /> : null}
      </View>

      {exercisesQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{getApiErrorMessage(exercisesQuery.error)}</Text>
          <Pressable onPress={() => exercisesQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {variant === "browse" ? (
        <FlatList
          data={exercisesQuery.data?.items ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            exercisesQuery.isPending ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={COLORS.teal} />
                <Text style={styles.stateText}>Loading exercises...</Text>
              </View>
            ) : (
              <View style={styles.centerState}>
                <Text style={styles.stateEmoji}>🔍</Text>
                <Text style={styles.stateTitle}>No exercises found</Text>
                <Text style={styles.stateText}>Try different search terms or filters</Text>
              </View>
            )
          }
          renderItem={({ item: exercise }) => (
            <Pressable onPress={() => onNavigate?.(exercise.id)}>
              <View style={styles.exerciseCard}>
                <View style={styles.emojiWrap}>
                  <Text style={styles.emoji}>{exerciseEmoji(exercise)}</Text>
                </View>
                <View style={styles.exerciseBody}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetail}>
                    {exercise.target ?? exercise.body_part ?? "Unknown"} - {exercise.equipment ?? "Unknown"}
                  </Text>
                </View>
                <View style={styles.exerciseMeta}>
                  <View style={[styles.difficultyTag, { backgroundColor: `${DIFFICULTY_COLORS["Intermediate"]}20`, borderColor: `${DIFFICULTY_COLORS["Intermediate"]}40` }]}>
                    <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS["Intermediate"] }]}>
                      {exercise.equipment ? "Equip" : "Body"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.22)" />
                </View>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.pickListWrap}>
          <ScrollView contentContainerStyle={styles.listContent}>
            {exercisesQuery.isPending ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={COLORS.teal} />
                <Text style={styles.stateText}>Loading exercises...</Text>
              </View>
            ) : null}
            {exercisesQuery.isError ? null : null}
            {(exercisesQuery.data?.items ?? []).map((exercise) => (
              <Pressable key={exercise.id} onPress={() => onSelect?.(exercise)}>
                <View style={styles.exerciseCard}>
                  <View style={styles.emojiWrap}>
                    <Text style={styles.emoji}>{exerciseEmoji(exercise)}</Text>
                  </View>
                  <View style={styles.exerciseBody}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {exercise.target ?? exercise.body_part ?? "Unknown"} - {exercise.equipment ?? "Unknown"}
                    </Text>
                  </View>
                  <Feather name="plus" size={16} color={COLORS.teal} />
                </View>
              </Pressable>
            ))}
            {!exercisesQuery.isPending && (exercisesQuery.data?.items ?? []).length === 0 ? (
              <View style={styles.centerState}>
                <Text style={styles.stateEmoji}>🔍</Text>
                <Text style={styles.stateTitle}>No exercises found</Text>
                <Text style={styles.stateText}>Try a different search term</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}
    </View>
  );

  if (variant === "pick") {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={onClose} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Feather name="x" size={18} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>
            {content}
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
  filterButton: {
    width: 48,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  filterButtonActive: {
    backgroundColor: "rgba(0,212,168,0.2)",
    borderColor: "rgba(0,212,168,0.35)",
  },
  filterPanel: {
    marginTop: 14,
    gap: 12,
  },
  filterSection: {
    gap: 8,
  },
  filterLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  clearText: {
    color: COLORS.teal,
    fontSize: 11,
    fontWeight: "600",
  },
  filterChipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: "rgba(0,212,168,0.15)",
    borderColor: "rgba(0,212,168,0.35)",
  },
  filterChipText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: COLORS.teal,
  },
  activeFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeFilterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,212,168,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,212,168,0.3)",
  },
  activeFilterText: {
    color: COLORS.teal,
    fontSize: 11,
    fontWeight: "700",
  },
  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  resultsText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
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
  listContent: {
    gap: 10,
    paddingBottom: 34,
  },
  pickListWrap: {
    maxHeight: 360,
    marginTop: 14,
  },
  centerState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  stateEmoji: {
    fontSize: 32,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  emoji: {
    fontSize: 20,
  },
  exerciseBody: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  exerciseDetail: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  exerciseMeta: {
    alignItems: "flex-end",
    gap: 6,
  },
  difficultyTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
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
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 26,
    maxHeight: "80%",
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
