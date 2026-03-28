import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, FlatList, Alert, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, PrimaryButton, BackHeader, MiniInput } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useWorkoutTemplate, useCreateTemplate, useUpdateTemplate, useAddTemplateExercise, useExercises, useExerciseFilters } from "../../hooks";
import type { ExerciseListItem } from "../../api/types";

type Props = RootStackScreenProps<"TemplateBuilder">;

interface LocalExercise {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target: string | null;
  sets: { reps: string; rpe: string; rest: string }[];
  notes: string;
}

export function TemplateBuilderScreen({ navigation, route }: Props): React.JSX.Element {
  const templateId = route.params?.id;
  const isEditing = !!templateId;

  const { data: template, isLoading: isLoadingTemplate } = useWorkoutTemplate(templateId || "");
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const addTemplateExercise = useAddTemplateExercise();
  
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [isSaving, setIsSaving] = useState(false);

  const { data: filtersData, isLoading: isLoadingFilters } = useExerciseFilters();
  const { data: exercisesData, isLoading: isLoadingExercises } = useExercises({
    q: debouncedSearch || undefined,
    body_part: selectedBodyPart !== "All" ? selectedBodyPart : undefined,
    equipment: selectedEquipment !== "All" ? selectedEquipment : undefined,
    limit: 100,
  });

  const bodyParts = useMemo(() => ["All", ...(filtersData?.body_parts || [])], [filtersData?.body_parts]);
  const equipmentOptions = useMemo(() => ["All", ...(filtersData?.equipment || [])], [filtersData?.equipment]);
  const availableExercises = exercisesData?.data || [];

  useEffect(() => {
    if (isEditing && template) {
      setTemplateName(template.name);
      setDescription(template.description || "");
      setExercises(
        template.exercises.map((ex, index) => ({
          id: String(ex.id),
          name: ex.exercise_id,
          body_part: null,
          equipment: null,
          target: null,
          sets: [{ reps: ex.target_reps ? String(ex.target_reps) : "8", rpe: ex.target_rpe ? String(ex.target_rpe) : "7", rest: ex.rest_seconds ? `${Math.floor(ex.rest_seconds / 60)}:${String(ex.rest_seconds % 60).padStart(2, "0")}` : "2:00" }],
          notes: ex.notes || "",
        }))
      );
    }
  }, [template, isEditing]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    const timeoutId = setTimeout(() => setDebouncedSearch(text), 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const addExercise = useCallback((exercise: ExerciseListItem) => {
    const newExercise: LocalExercise = {
      id: exercise.id,
      name: exercise.name,
      body_part: exercise.body_part,
      equipment: exercise.equipment,
      target: exercise.target,
      sets: [{ reps: "8", rpe: "7", rest: "2:00" }],
      notes: "",
    };
    setExercises(prev => [...prev, newExercise]);
    setShowExercisePicker(false);
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedBodyPart("All");
    setSelectedEquipment("All");
  }, []);

  const updateSet = useCallback((exerciseIndex: number, setIndex: number, field: "reps" | "rpe" | "rest", value: string) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex][field] = value;
      return updated;
    });
  }, []);

  const addSet = useCallback((exerciseIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
      updated[exerciseIndex].sets.push({ ...lastSet });
      return updated;
    });
  }, []);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      if (updated[exerciseIndex].sets.length > 1) {
        updated[exerciseIndex].sets.splice(setIndex, 1);
      }
      return updated;
    });
  }, []);

  const removeExercise = useCallback((exerciseIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      updated.splice(exerciseIndex, 1);
      return updated;
    });
  }, []);

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const handleSave = async () => {
    if (!templateName.trim()) {
      Alert.alert("Error", "Please enter a template name");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && templateId) {
        await updateTemplate.mutateAsync({
          templateId,
          data: { name: templateName, description },
        });
        
        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];
          const restSeconds = ex.sets[0].rest.includes(":") 
            ? parseInt(ex.sets[0].rest.split(":")[0]) * 60 + parseInt(ex.sets[0].rest.split(":")[1])
            : parseInt(ex.sets[0].rest) || 120;
          
          await addTemplateExercise.mutateAsync({
            templateId,
            data: {
              exercise_id: ex.id,
              order_index: i,
              target_sets: ex.sets.length,
              target_reps: parseInt(ex.sets[0].reps) || 8,
              target_rpe: parseFloat(ex.sets[0].rpe) || 7,
              rest_seconds: restSeconds,
              notes: ex.notes || undefined,
            },
          });
        }
      } else {
        const newTemplate = await createTemplate.mutateAsync({
          name: templateName,
          description: description || undefined,
        });
        
        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];
          const restSeconds = ex.sets[0].rest.includes(":") 
            ? parseInt(ex.sets[0].rest.split(":")[0]) * 60 + parseInt(ex.sets[0].rest.split(":")[1])
            : parseInt(ex.sets[0].rest) || 120;
          
          await addTemplateExercise.mutateAsync({
            templateId: String(newTemplate.id),
            data: {
              exercise_id: ex.id,
              order_index: i,
              target_sets: ex.sets.length,
              target_reps: parseInt(ex.sets[0].reps) || 8,
              target_rpe: parseFloat(ex.sets[0].rpe) || 7,
              rest_seconds: restSeconds,
              notes: ex.notes || undefined,
            },
          });
        }
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeExercisePicker = useCallback(() => {
    setShowExercisePicker(false);
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedBodyPart("All");
    setSelectedEquipment("All");
  }, []);

  if (isLoadingTemplate && isEditing) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <BackHeader title={isEditing ? "Edit Template" : "New Template"} onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading template...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <BackHeader title={isEditing ? "Edit Template" : "New Template"} onBack={() => navigation.goBack()} />

        <View style={styles.nameSection}>
          <Text style={styles.fieldLabel}>Template Name</Text>
          <TextInput
            value={templateName}
            onChangeText={setTemplateName}
            placeholder="e.g., Upper Body Push"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.nameInput}
          />
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.fieldLabel}>Description (Optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a description..."
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.nameInput, { minHeight: 80, textAlignVertical: "top" }]}
            multiline
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>
        </View>

        <View style={styles.exercisesSection}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <Pressable onPress={() => setShowExercisePicker(true)} style={styles.addButton}>
              <Feather name="plus" size={14} color={COLORS.teal} />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {exercises.map((exercise, exerciseIndex) => (
            <Card key={`${exercise.id}-${exerciseIndex}`} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Pressable onPress={() => removeExercise(exerciseIndex)}>
                  <Feather name="trash-2" size={16} color={COLORS.red} />
                </Pressable>
              </View>
              <Text style={styles.exerciseMeta}>{exercise.body_part || "Various"} · {exercise.equipment || "None"}</Text>

              <View style={styles.setsHeader}>
                <Text style={styles.setHeaderText}>Set</Text>
                <Text style={styles.setHeaderText}>Reps</Text>
                <Text style={styles.setHeaderText}>RPE</Text>
                <Text style={styles.setHeaderText}>Rest</Text>
                <View style={{ width: 24 }} />
              </View>

              {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <View style={styles.setNumber}>
                    <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                  </View>
                  <MiniInput
                    value={set.reps}
                    onChangeText={(v) => updateSet(exerciseIndex, setIndex, "reps", v)}
                    placeholder="8"
                  />
                  <MiniInput
                    value={set.rpe}
                    onChangeText={(v) => updateSet(exerciseIndex, setIndex, "rpe", v)}
                    placeholder="7"
                  />
                  <MiniInput
                    value={set.rest}
                    onChangeText={(v) => updateSet(exerciseIndex, setIndex, "rest", v)}
                    placeholder="2:00"
                  />
                  <Pressable onPress={() => removeSet(exerciseIndex, setIndex)} style={styles.removeSetButton}>
                    <Feather name="x" size={14} color="rgba(255,255,255,0.28)" />
                  </Pressable>
                </View>
              ))}

              <Pressable onPress={() => addSet(exerciseIndex)} style={styles.addSetButton}>
                <Feather name="plus" size={12} color={COLORS.teal} />
                <Text style={styles.addSetText}>Add Set</Text>
              </Pressable>
            </Card>
          ))}

          {exercises.length === 0 && (
            <Pressable onPress={() => setShowExercisePicker(true)}>
              <Card style={styles.emptyCard}>
                <Feather name="plus-circle" size={32} color={COLORS.teal} />
                <Text style={styles.emptyText}>Add your first exercise</Text>
              </Card>
            </Pressable>
          )}
        </View>
      </Screen>

      <View style={styles.footerContainer}>
        <PrimaryButton
          label={isSaving ? "Saving..." : (isEditing ? "Save Changes" : "Create Template")}
          onPress={handleSave}
          disabled={isSaving}
          icon={isSaving ? <ActivityIndicator color="#000000" /> : <Feather name="check" size={16} color="#000000" />}
        />
      </View>

      <Modal
        visible={showExercisePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={closeExercisePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Add Exercise</Text>
              <Pressable onPress={closeExercisePicker}>
                <Feather name="x" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            <View style={styles.pickerSearchWrap}>
              <Feather name="search" size={16} color="rgba(255,255,255,0.42)" />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search exercises..."
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.pickerSearchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.pickerFilters}>
              <Text style={styles.filterLabel}>Body Part</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {bodyParts.map((bp) => (
                    <Pressable
                      key={bp}
                      onPress={() => setSelectedBodyPart(bp)}
                      style={[styles.filterChip, selectedBodyPart === bp && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, selectedBodyPart === bp && styles.filterChipTextActive]}>
                        {bp}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.pickerFilters}>
              <Text style={styles.filterLabel}>Equipment</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {equipmentOptions.map((eq) => (
                    <Pressable
                      key={eq}
                      onPress={() => setSelectedEquipment(eq)}
                      style={[styles.filterChip, selectedEquipment === eq && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, selectedEquipment === eq && styles.filterChipTextActive]}>
                        {eq}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {isLoadingFilters || isLoadingExercises ? (
              <View style={styles.loadingPicker}>
                <ActivityIndicator size="small" color={COLORS.teal} />
              </View>
            ) : (
              <FlatList
                data={availableExercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable onPress={() => addExercise(item)} style={styles.pickerItem}>
                    <View style={styles.pickerInfo}>
                      <Text style={styles.pickerName}>{item.name}</Text>
                      <Text style={styles.pickerMuscle}>{item.body_part || "Various"} · {item.equipment || "None"}</Text>
                    </View>
                    <Feather name="plus-circle" size={24} color={COLORS.teal} />
                  </Pressable>
                )}
                style={styles.pickerList}
                ListEmptyComponent={
                  <View style={styles.emptyPickerState}>
                    <Text style={styles.emptyPickerText}>No exercises found</Text>
                    <Text style={styles.emptyPickerSubtext}>Try adjusting your filters</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screen,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 12,
    fontSize: 14,
  },
  nameSection: { marginTop: 16 },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  nameInput: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#ffffff", paddingHorizontal: 16, fontSize: 14 },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginTop: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  exercisesSection: { marginTop: 24, marginBottom: 100 },
  exercisesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  addButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: `${COLORS.teal}20` },
  addButtonText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  exerciseCard: { marginTop: 12 },
  exerciseHeader: { flexDirection: "row", alignItems: "center" },
  exerciseName: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: "800" },
  exerciseMeta: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  setsHeader: { flexDirection: "row", gap: 6, marginTop: 12, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  setHeaderText: { flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 10, textAlign: "center" },
  setRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  setNumber: { width: 24, height: 38, alignItems: "center", justifyContent: "center" },
  setNumberText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  removeSetButton: { width: 24, height: 38, alignItems: "center", justifyContent: "center" },
  addSetButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.04)" },
  addSetText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  emptyCard: { alignItems: "center", justifyContent: "center", paddingVertical: 40, borderStyle: "dashed" },
  emptyText: { color: COLORS.muted, fontSize: 13, marginTop: 12 },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.screen,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
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
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  pickerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  pickerSearchWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 14, marginHorizontal: 16, marginTop: 16, minHeight: 44 },
  pickerSearchInput: { flex: 1, color: "#ffffff", fontSize: 14 },
  pickerFilters: { paddingHorizontal: 16, marginBottom: 8 },
  filterLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  filterRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.06)" },
  filterChipActive: { backgroundColor: `${COLORS.teal}20`, borderColor: `${COLORS.teal}40` },
  filterChipText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { color: COLORS.teal },
  pickerList: { paddingHorizontal: 16, flex: 1, marginBottom: 120 },
  pickerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  pickerInfo: { flex: 1 },
  pickerName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  pickerMuscle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  loadingPicker: { padding: 40, alignItems: "center" },
  emptyPickerState: { padding: 40, alignItems: "center" },
  emptyPickerText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  emptyPickerSubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
});
