import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, PrimaryButton, BackHeader, Tag, MiniInput } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { DEFAULT_TEMPLATE_EXERCISES, ALL_EXERCISES, TemplateExercise } from "../../data";

type Props = RootStackScreenProps<"TemplateBuilder">;

export function TemplateBuilderScreen({ navigation, route }: Props): React.JSX.Element {
  const templateId = route.params?.id;
  const isEditing = !!templateId;

  const [templateName, setTemplateName] = useState(isEditing ? "Upper Body Push" : "");
  const [exercises, setExercises] = useState<TemplateExercise[]>(DEFAULT_TEMPLATE_EXERCISES);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const addExercise = (exercise: typeof ALL_EXERCISES[0]) => {
    const newExercise: TemplateExercise = {
      id: exercise.id,
      name: exercise.name,
      emoji: exercise.emoji,
      sets: [{ reps: "8", rpe: "7", rest: "2:00" }],
      notes: "",
    };
    setExercises([...exercises, newExercise]);
    setShowExercisePicker(false);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: "reps" | "rpe" | "rest", value: string) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
    updated[exerciseIndex].sets.push({ ...lastSet });
    setExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    if (updated[exerciseIndex].sets.length > 1) {
      updated[exerciseIndex].sets.splice(setIndex, 1);
      setExercises(updated);
    }
  };

  const removeExercise = (exerciseIndex: number) => {
    const updated = [...exercises];
    updated.splice(exerciseIndex, 1);
    setExercises(updated);
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
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
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>~50 min</Text>
          <Text style={styles.statLabel}>Est. Duration</Text>
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
              <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Pressable onPress={() => removeExercise(exerciseIndex)}>
                <Feather name="trash-2" size={16} color={COLORS.red} />
              </Pressable>
            </View>

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

      {showExercisePicker && (
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setShowExercisePicker(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Add Exercise</Text>
              <Pressable onPress={() => setShowExercisePicker(false)}>
                <Feather name="x" size={20} color={COLORS.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerList}>
              {ALL_EXERCISES.map((exercise) => (
                <Pressable key={exercise.id} onPress={() => addExercise(exercise)} style={styles.pickerItem}>
                  <Text style={styles.pickerEmoji}>{exercise.emoji}</Text>
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerName}>{exercise.name}</Text>
                    <Text style={styles.pickerMuscle}>{exercise.primaryMuscle}</Text>
                  </View>
                  <Feather name="plus" size={16} color={COLORS.teal} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <PrimaryButton
          label={isEditing ? "Save Changes" : "Create Template"}
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nameSection: { marginTop: 16 },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  nameInput: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#ffffff", paddingHorizontal: 16, fontSize: 14 },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginTop: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  exercisesSection: { marginTop: 24 },
  exercisesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  addButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: `${COLORS.teal}20` },
  addButtonText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  exerciseCard: { marginTop: 12 },
  exerciseHeader: { flexDirection: "row", alignItems: "center" },
  exerciseEmoji: { fontSize: 24 },
  exerciseName: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: "800", marginLeft: 10 },
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
  pickerOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  pickerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  pickerSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: COLORS.screen, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%" },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  pickerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  pickerList: { padding: 16 },
  pickerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  pickerEmoji: { fontSize: 24 },
  pickerInfo: { flex: 1, marginLeft: 12 },
  pickerName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  pickerMuscle: { color: COLORS.muted, fontSize: 11 },
  footer: { marginTop: 24 },
});
