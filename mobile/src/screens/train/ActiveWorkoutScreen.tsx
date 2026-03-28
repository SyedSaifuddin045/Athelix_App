import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, PrimaryButton, MiniInput, ProgressBar } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { formatTime } from "../../utils";
import { useSafePostHog } from "../../services/analytics/usePostHogSafe";
import { useWorkoutSession, useWorkoutTemplate, useExercisesByIds, useUpdateSession } from "../../hooks";
import { setService } from "../../api/services";

type Props = RootStackScreenProps<"ActiveWorkout">;

interface LocalSet {
  id: string;
  reps: string;
  weight: string;
  done: boolean;
  warmup: boolean;
  setNumber: number;
}

interface LocalExercise {
  id: string;
  exercise_id: string;
  name: string;
  sets: LocalSet[];
}

export function ActiveWorkoutScreen({ navigation, route }: Props): React.JSX.Element {
  const { sessionId, templateId } = route.params || {};
  const posthog = useSafePostHog();
  
  const { data: session, isLoading: isLoadingSession } = useWorkoutSession(sessionId || "");
  const { data: template } = useWorkoutTemplate(templateId || "");
  const updateSession = useUpdateSession();
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutName, setWorkoutName] = useState("New Workout");
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [notes, setNotes] = useState("");

  const uniqueExerciseIds = useMemo(() => {
    return [...new Set(exercises.map((ex) => ex.exercise_id))];
  }, [exercises]);

  const { data: exerciseDetails } = useExercisesByIds(uniqueExerciseIds);

  const exerciseNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    exerciseDetails?.forEach((ex) => {
      map[ex.id] = ex.name;
    });
    return map;
  }, [exerciseDetails]);

  useEffect(() => {
    if (posthog) {
      posthog.capture("workout_started", { workout_name: workoutName });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (session) {
      setWorkoutName(session.name || "New Workout");
      
      if (session.sets && session.sets.length > 0) {
        const groupedSets = groupSetsByExercise(session.sets);
        setExercises(groupedSets);
      } else if (session.template_id && template) {
        const templateExercises = loadTemplateExercises(template.exercises);
        setExercises(templateExercises);
      } else {
        setExercises([]);
      }
    } else if (template && !sessionId) {
      setWorkoutName(template.name);
      const templateExercises = loadTemplateExercises(template.exercises);
      setExercises(templateExercises);
    }
  }, [session, template]);

  const loadTemplateExercises = (templateExercises: { exercise_id: string; target_sets: number | null; target_reps: number | null }[]) => {
    return templateExercises.map((ex, index) => ({
      id: `template-${index}`,
      exercise_id: ex.exercise_id,
      name: ex.exercise_id,
      sets: Array.from({ length: ex.target_sets || 3 }, (_, setIdx) => ({
        id: `new-${ex.exercise_id}-${setIdx}`,
        reps: String(ex.target_reps || 8),
        weight: "0",
        done: false,
        warmup: false,
        setNumber: setIdx + 1,
      })),
    }));
  };

  const groupSetsByExercise = (sets: { id: number; exercise_id: string; reps: number | null; weight_kg: number | null; set_type: string; set_number: number }[]) => {
    const grouped: Record<string, LocalExercise> = {};
    
    sets.forEach((set) => {
      if (!grouped[set.exercise_id]) {
        grouped[set.exercise_id] = {
          id: String(set.id),
          exercise_id: set.exercise_id,
          name: set.exercise_id,
          sets: [],
        };
      }
      grouped[set.exercise_id].sets.push({
        id: String(set.id),
        reps: String(set.reps || 0),
        weight: String(set.weight_kg || 0),
        done: false,
        warmup: set.set_type === "warmup",
        setNumber: set.set_number,
      });
    });
    
    return Object.values(grouped);
  };

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    const wasDone = updated[exerciseIndex].sets[setIndex].done;
    updated[exerciseIndex].sets[setIndex].done = !wasDone;
    setExercises(updated);
    
    if (!wasDone && posthog) {
      posthog.capture("set_completed", {
        exercise_name: exercises[exerciseIndex].name,
        set_number: setIndex + 1,
        workout_name: workoutName,
      });
    }
  };

  const updateSetWeight = (exerciseIndex: number, setIndex: number, weight: string) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex].weight = weight;
    setExercises(updated);
  };

  const updateSetReps = (exerciseIndex: number, setIndex: number, reps: string) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex].reps = reps;
    setExercises(updated);
  };

  const completedSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.done && !s.warmup).length,
    0
  );
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => !s.warmup).length, 0);
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const finishWorkout = () => {
    setShowFinishModal(true);
  };

  const saveAllSets = async () => {
    if (!sessionId) return;
    
    const setsToSave: Array<{
      exercise_id: string;
      set_number: number;
      set_type: string;
      reps: number;
      weight_kg: number;
    }> = [];

    exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        if (set.done || set.warmup) {
          setsToSave.push({
            exercise_id: exercise.exercise_id,
            set_number: set.setNumber,
            set_type: set.warmup ? "warmup" : "working",
            reps: parseInt(set.reps, 10) || 0,
            weight_kg: parseFloat(set.weight) || 0,
          });
        }
      });
    });

    for (const setData of setsToSave) {
      try {
        await setService.createSet(sessionId, setData);
      } catch (error) {
        console.error("Failed to save set:", error);
      }
    }
  };

  const confirmFinish = async () => {
    setShowFinishModal(false);
    
    if (sessionId) {
      await saveAllSets();
      
      await updateSession.mutateAsync({
        sessionId,
        data: { is_completed: true },
      });
      
      (navigation as any).navigate("SessionDetail", { id: sessionId });
    }
    
    if (posthog) {
      posthog.capture("workout_completed", {
        workout_name: workoutName,
        duration_seconds: elapsedSeconds,
        exercises_count: exercises.length,
        sets_completed: completedSets,
        total_sets: totalSets,
      });
    }
    
    if (!sessionId) {
      (navigation as any).navigate("MainTabs");
    }
  };

  if (isLoadingSession && sessionId) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Feather name="x" size={20} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{workoutName}</Text>
          <Text style={styles.headerTimer}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <Pressable onPress={finishWorkout} style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </Pressable>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{completedSets}/{totalSets} sets</Text>
        </View>
        <ProgressBar value={progress} color={COLORS.teal} height={8} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.exerciseList}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No exercises in this workout</Text>
            <Text style={styles.emptySubtext}>Tap "Add Exercise" to get started</Text>
          </View>
        ) : (
          exercises.map((exercise, exerciseIndex) => (
            <Card key={`${exercise.id}-${exerciseIndex}`} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exerciseNameMap[exercise.exercise_id] || exercise.exercise_id}</Text>
                  <Text style={styles.exerciseSets}>
                    {exercise.sets.filter((s) => s.done && !s.warmup).length}/{exercise.sets.filter((s) => !s.warmup).length} sets
                  </Text>
                </View>
              </View>

              <View style={styles.setsHeader}>
                <Text style={[styles.setHeaderText, { width: 28 }]}>Type</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                <Text style={[styles.setHeaderText, { width: 44 }]}>Done</Text>
              </View>

              {exercise.sets.map((set, setIndex) => (
                <View
                  key={set.id}
                  style={[styles.setRow, set.done && styles.setRowDone]}
                >
                  <View style={[styles.setTypeBadge, set.warmup && styles.warmupBadge]}>
                    <Text style={[styles.setTypeText, set.warmup && styles.warmupText]}>
                      {set.warmup ? "W" : set.setNumber}
                    </Text>
                  </View>
                  <View style={styles.weightInputWrap}>
                    <MiniInput
                      value={set.weight}
                      onChangeText={(v) => updateSetWeight(exerciseIndex, setIndex, v)}
                      placeholder="0"
                      strike={set.done}
                    />
                    <Text style={styles.unitText}>kg</Text>
                  </View>
                  <MiniInput
                    value={set.reps}
                    onChangeText={(v) => updateSetReps(exerciseIndex, setIndex, v)}
                    placeholder="0"
                    strike={set.done}
                  />
                  <Pressable
                    onPress={() => toggleSet(exerciseIndex, setIndex)}
                    style={[styles.checkButton, set.done && styles.checkButtonDone]}
                  >
                    {set.done && <Feather name="check" size={16} color="#000000" />}
                  </Pressable>
                </View>
              ))}
            </Card>
          ))
        )}

        <Pressable style={styles.addExerciseButton}>
          <Feather name="plus" size={18} color={COLORS.teal} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton 
          label="Finish Workout" 
          onPress={finishWorkout} 
          icon={<Feather name="check" size={16} color="#000000" />} 
        />
      </View>

      <Modal visible={showFinishModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Finish Workout?</Text>
            <Text style={styles.modalSubtitle}>
              You've completed {completedSets} of {totalSets} working sets
            </Text>

            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Ionicons name="time-outline" size={18} color={COLORS.teal} />
                <Text style={styles.modalStatValue}>{formatTime(elapsedSeconds)}</Text>
                <Text style={styles.modalStatLabel}>Duration</Text>
              </View>
              <View style={styles.modalStat}>
                <Ionicons name="layers-outline" size={18} color={COLORS.green} />
                <Text style={styles.modalStatValue}>{completedSets}</Text>
                <Text style={styles.modalStatLabel}>Sets Done</Text>
              </View>
              <View style={styles.modalStat}>
                <Feather name="trending-up" size={18} color={COLORS.gold} />
                <Text style={styles.modalStatValue}>0</Text>
                <Text style={styles.modalStatLabel}>PRs</Text>
              </View>
            </View>

            <View style={styles.modalNotes}>
              <Text style={styles.notesLabel}>Workout Notes (optional)</Text>
              <MiniInput
                value={notes}
                onChangeText={setNotes}
                placeholder="How did this session feel?"
              />
            </View>

            <View style={styles.modalActions}>
              <PrimaryButton 
                label="Save Workout" 
                onPress={confirmFinish} 
              />
              <Pressable onPress={() => setShowFinishModal(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Keep Training</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  closeButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  headerTimer: { color: COLORS.teal, fontSize: 14, fontWeight: "700", marginTop: 2 },
  finishButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: `${COLORS.teal}20` },
  finishButtonText: { color: COLORS.teal, fontSize: 13, fontWeight: "700" },
  progressSection: { marginBottom: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { color: COLORS.muted, fontSize: 12 },
  progressValue: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  exerciseList: { flex: 1 },
  exerciseCard: { marginBottom: 16 },
  exerciseHeader: { flexDirection: "row", alignItems: "center" },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  exerciseSets: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  setsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  setHeaderText: { color: "rgba(255,255,255,0.3)", fontSize: 10, textAlign: "center" },
  setRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  setRowDone: { opacity: 0.7 },
  setTypeBadge: { width: 28, height: 38, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  warmupBadge: { backgroundColor: `${COLORS.orange}20` },
  setTypeText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  warmupText: { color: COLORS.orange },
  weightInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  unitText: { color: COLORS.muted, fontSize: 11 },
  checkButton: { width: 44, height: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  checkButtonDone: { backgroundColor: COLORS.teal },
  addExerciseButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: `${COLORS.teal}30`, borderStyle: "dashed", marginBottom: 100 },
  addExerciseText: { color: COLORS.teal, fontSize: 14, fontWeight: "700" },
  footer: { marginTop: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: COLORS.muted, fontSize: 14, marginTop: 12 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  emptySubtext: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { backgroundColor: COLORS.screen, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center", marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: "900", textAlign: "center" },
  modalSubtitle: { color: COLORS.muted, fontSize: 13, textAlign: "center", marginTop: 8 },
  modalStats: { flexDirection: "row", marginTop: 24, gap: 12 },
  modalStat: { flex: 1, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16 },
  modalStatValue: { color: COLORS.text, fontSize: 18, fontWeight: "900", marginTop: 8 },
  modalStatLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  modalNotes: { marginTop: 20 },
  notesLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8 },
  modalActions: { marginTop: 24, gap: 12 },
  cancelButton: { alignItems: "center", paddingVertical: 16 },
  cancelButtonText: { color: COLORS.muted, fontSize: 14, fontWeight: "600" },
});
