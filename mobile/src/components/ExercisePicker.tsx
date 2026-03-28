import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, ActivityIndicator, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useExercises, useExerciseFilters } from "../hooks";
import type { ExerciseListItem } from "../api/types";

interface ExercisePickerProps {
  visible?: boolean;
  onClose?: () => void;
  onSelect?: (exercise: ExerciseListItem) => void;
  title?: string;
  showModal?: boolean;
}

export function ExercisePicker({
  visible = true,
  onClose,
  onSelect,
  title = "Select Exercise",
  showModal = true,
}: ExercisePickerProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedTarget, setSelectedTarget] = useState("All");

  const { data: filtersData, isLoading: isLoadingFilters } = useExerciseFilters();
  const { data: exercisesData, isLoading: isLoadingExercises } = useExercises({
    q: debouncedSearch || undefined,
    body_part: selectedBodyPart !== "All" ? selectedBodyPart : undefined,
    equipment: selectedEquipment !== "All" ? selectedEquipment : undefined,
    target: selectedTarget !== "All" ? selectedTarget : undefined,
    limit: 100,
  });

  const bodyParts = useMemo(() => ["All", ...(filtersData?.body_parts || [])], [filtersData?.body_parts]);
  const equipmentOptions = useMemo(() => ["All", ...(filtersData?.equipment || [])], [filtersData?.equipment]);
  const targetOptions = useMemo(() => ["All", ...(filtersData?.targets || [])], [filtersData?.targets]);
  const exercises = exercisesData?.data || [];

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    const timeoutId = setTimeout(() => setDebouncedSearch(text), 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSelect = useCallback((exercise: ExerciseListItem) => {
    onSelect?.(exercise);
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedBodyPart("All");
    setSelectedEquipment("All");
    setSelectedTarget("All");
  }, [onSelect]);

  const handleClose = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedBodyPart("All");
    setSelectedEquipment("All");
    setSelectedTarget("All");
    onClose?.();
  }, [onClose]);

  const renderFilterChips = (options: string[], selected: string, onSelect: (value: string) => void) => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.filterChipsScroll}
      contentContainerStyle={styles.filterChipsContent}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onSelect(option)}
          style={[styles.filterChip, selected === option && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, selected === option && styles.filterChipTextActive]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={COLORS.text} />
        </Pressable>
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
          autoFocus
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

      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Body Part</Text>
          {renderFilterChips(bodyParts, selectedBodyPart, setSelectedBodyPart)}
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Equipment</Text>
          {renderFilterChips(equipmentOptions, selectedEquipment, setSelectedEquipment)}
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Target Muscle</Text>
          {renderFilterChips(targetOptions, selectedTarget, setSelectedTarget)}
        </View>
      </View>

      {isLoadingFilters || isLoadingExercises ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleSelect(item)} style={styles.exerciseItem}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.body_part || "Various"} · {item.equipment || "None"} · {item.target || "Various"}
                </Text>
              </View>
              <Feather name="plus-circle" size={24} color={COLORS.teal} />
            </Pressable>
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="search" size={40} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>No exercises found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}
    </View>
  );

  if (showModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>{content}</View>
        </View>
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.screen,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.screen,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 16,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  filterChipsScroll: {
    flexGrow: 0,
    overflow: "hidden",
  },
  filterChipsContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexShrink: 0,
  },
  filterChipActive: {
    backgroundColor: `${COLORS.teal}20`,
    borderColor: `${COLORS.teal}40`,
  },
  filterChipText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: COLORS.teal,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  exerciseMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtext: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },
});
