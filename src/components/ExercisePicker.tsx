import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useTheme } from "@tamagui/core";
import { AppIcon } from "../design-system/icons/AppIcon";
import { Card } from "../components/ui/Card";
import { useAllExercisesQuery, useExerciseFiltersQuery, useExercisesQuery } from "../api/queries";
import type { ExerciseResponse } from "../api/model";
import { getApiErrorMessage } from "../api/client";
import { CARDIO_ACTIVITIES } from "../utils/cardio";

const QUICK_CARDIO_IDS = new Set(CARDIO_ACTIVITIES.map((a) => a.exerciseId));

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
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring") || key.includes("glute")) return "#8B5CF6";
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
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring") || key.includes("glute")) return "Legs";
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
  const theme = useTheme();
  const accent = theme.accent?.toString() ?? "#FF5A36";
  const textColor = theme.color?.toString() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.toString() ?? "rgba(255,255,255,0.45)";
  const borderColor = theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)";
  const redColor = theme.colorRed?.toString() ?? "#EF4444";
  const greenColor = theme.colorGreen?.toString() ?? "#22C55E";
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

  const apiCategory = selectedCategory === "quick_cardio" ? undefined : (selectedCategory ?? undefined);

  const queryParams = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
      equipment: equipment !== "All" ? equipment : undefined,
      category: apiCategory,
      limit: 100,
      offset: 0,
      ...(trackedOnly ? { tracked: true } : {}),
    }),
    [debouncedQuery, equipment, apiCategory, trackedOnly],
  );

  const exercisesQuery = useExercisesQuery(queryParams, enabled);
  const allExercisesQuery = useAllExercisesQuery(
    enabled,
    equipment !== "All" ? equipment : undefined,
    trackedOnly,
    apiCategory,
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
    () => [
      "All",
      ...(filters.data?.equipment ?? ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"]).filter((item) => item !== "All"),
    ],
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

  const renderExerciseItem = (exercise: ExerciseResponse) => {
    const isQuickStart = QUICK_CARDIO_IDS.has(exercise.id);
    return (
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
      <Card elevated accentColor={muscleAccentColor(exercise.target)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: textColor, fontSize: 14, fontWeight: "700" }} numberOfLines={1}>
              {exercise.name}
            </Text>
            {isQuickStart ? (
              <View style={{ backgroundColor: accent + "20", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ color: accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>QS</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: mutedColor, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
            {exercise.target ?? exercise.body_part ?? "Unknown"} · {exercise.equipment ?? "Unknown"}
          </Text>
        </View>
        <AppIcon name={variant === "browse" ? "chevron-right" : "plus"} size={14} color="rgba(255,255,255,0.22)" />
      </Card>
    </Pressable>
    );
  };

  const renderGridItem = ({ item }: { item: string }) => {
    const count = groupCounts[item] ?? 0;
    const accent = muscleAccentColor(item) ?? "rgba(255,255,255,0.2)";
    return (
      <Pressable onPress={() => handleGroupSelect(item)} style={{ flex: 1, maxWidth: "50%" }}>
        <Card elevated accentColor={accent} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={{ color: textColor, fontSize: 14, fontWeight: "700", flex: 1 }} numberOfLines={1}>
            {item}
          </Text>
          <Text style={{ color: mutedColor, fontSize: 12, marginLeft: 8 }}>{count}</Text>
        </Card>
      </Pressable>
    );
  };

  const renderListHeader = () => {
    if (isSearching) return null;
    if (selectedGroup) {
      const accent = muscleAccentColor(selectedGroup) ?? "rgba(255,255,255,0.2)";
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 10 }}>
          <Pressable onPress={handleBack} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" }}>
            <AppIcon name="arrow-left" size={18} color="rgba(255,255,255,0.5)" />
          </Pressable>
          <View style={[{ width: 3, height: 18, borderRadius: 2 }, { backgroundColor: accent }]} />
          <Text style={{ color: textColor, fontSize: 18, fontWeight: "700" }}>{selectedGroup}</Text>
          <Text style={{ color: mutedColor, fontSize: 12 }}>{groupCounts[selectedGroup] ?? 0}</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isPending) {
      return (
        <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={{ color: mutedColor, fontSize: 14, textAlign: "center" }}>Loading exercises...</Text>
        </View>
      );
    }
    if (isError) {
      return (
        <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
          <Text style={{ color: redColor, fontSize: 12, flex: 1 }}>{getApiErrorMessage(error)}</Text>
          <Pressable onPress={() => activeQuery.refetch()}>
            <Text style={{ color: accent, fontSize: 12, fontWeight: "700", marginLeft: 12 }}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
        <Text style={{ color: mutedColor, fontSize: 14, textAlign: "center" }}>No exercises match your search</Text>
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
    <View style={variant === "browse" ? { flex: 1, paddingHorizontal: 20 } : { flex: 1 }}>
      {variant === "browse" && title ? (
        <View style={{ paddingTop: 12, paddingBottom: 2 }}>
          <Text style={{ color: textColor, fontSize: 28, fontWeight: "900" }}>{title}</Text>
          {subtitle ? <Text style={{ color: mutedColor, fontSize: 12, marginTop: 4 }}>{subtitle}</Text> : null}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 14 }}>
        <View style={{ flex: 1, minHeight: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <AppIcon name="search" size={15} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search exercises..."
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={{ flex: 1, color: textColor, fontSize: 12, paddingVertical: 0 }}
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
              <AppIcon name="x" size={14} color="rgba(255,255,255,0.42)" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, marginBottom: 14 }}
        contentContainerStyle={{ flexDirection: "row", gap: 20, paddingHorizontal: 2 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.label}
            onPress={() => handleCategorySelect(cat.key)}
            style={[{ paddingVertical: 2 }]}
          >
            <Text style={[{ color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "600" }, selectedCategory === cat.key ? { color: accent, fontWeight: "800" } : null]}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {showFilters ? (
        <View style={{ marginBottom: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 2, alignItems: "center" }}
          >
            {equipmentOptions.map((item) => (
              <Pressable
                key={item}
                onPress={() => setEquipment(item)}
                style={[{ alignItems: "center", justifyContent: "center", paddingVertical: 8 }]}
              >
                <Text style={[{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: "500" }, equipment === item ? { color: accent, fontWeight: "700" } : null]}>{item}</Text>
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
          columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60, paddingTop: 4 }}
          style={{ flex: 1 }}
          ListFooterComponent={
            isError ? (
              <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: redColor, fontSize: 12, flex: 1 }}>{getApiErrorMessage(error)}</Text>
                <Pressable onPress={() => activeQuery.refetch()}>
                  <Text style={{ color: accent, fontSize: 12, fontWeight: "700", marginLeft: 12 }}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={renderGridItem}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {!isSearching && selectedGroup ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 10 }}>
              <Pressable onPress={handleBack} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" }}>
                <AppIcon name="arrow-left" size={16} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <View style={[{ width: 3, height: 18, borderRadius: 2 }, { backgroundColor: muscleAccentColor(selectedGroup) ?? "rgba(255,255,255,0.2)" }]} />
              <Text style={{ color: textColor, fontSize: 18, fontWeight: "700" }}>{selectedGroup}</Text>
              <Text style={{ color: mutedColor, fontSize: 12 }}>{groupCounts[selectedGroup] ?? 0}</Text>
            </View>
          ) : null}
          <FlatList
            key="list"
            data={gridExercises}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60, paddingTop: 4 }}
            style={{ flex: 1 }}
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
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View style={[{ backgroundColor: "#111d1b", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }, { height: screenHeight * 0.78 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: textColor, fontSize: 22, fontWeight: "900" }}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <AppIcon name="x" size={18} color="rgba(255,255,255,0.5)" />
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
