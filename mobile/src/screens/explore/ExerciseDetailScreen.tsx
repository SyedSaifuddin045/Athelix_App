import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useExercise } from "../../hooks";

type Props = RootStackScreenProps<"ExerciseDetail">;

export function ExerciseDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { id } = route.params;
  const { data: exercise, isLoading, error } = useExercise(id);

  if (isLoading) {
    return (
      <Screen contentContainerStyle={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>Loading exercise...</Text>
      </Screen>
    );
  }

  if (error || !exercise) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <BackHeader title="Exercise" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load exercise details</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title={exercise.name} onBack={() => navigation.goBack()} />

      <Card style={[styles.heroCard, { borderColor: `${COLORS.teal}30` }]}>
        <View style={styles.heroContent}>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{exercise.name}</Text>
            <View style={styles.heroMeta}>
              {exercise.body_part && <Tag label={exercise.body_part} color={COLORS.teal} />}
              {exercise.target && <Tag label={exercise.target} color={COLORS.blue} />}
            </View>
          </View>
        </View>
        <View style={styles.heroDetails}>
          <View style={styles.heroDetailItem}>
            <Ionicons name="barbell-outline" size={18} color={COLORS.muted} />
            <Text style={styles.heroDetailLabel}>Equipment</Text>
            <Text style={styles.heroDetailValue}>{exercise.equipment || "None"}</Text>
          </View>
          <View style={styles.heroDetailItem}>
            <Ionicons name="body-outline" size={18} color={COLORS.muted} />
            <Text style={styles.heroDetailLabel}>Body Part</Text>
            <Text style={styles.heroDetailValue}>{exercise.body_part || "Various"}</Text>
          </View>
          <View style={styles.heroDetailItem}>
            <Ionicons name="fitness-outline" size={18} color={COLORS.muted} />
            <Text style={styles.heroDetailLabel}>Target</Text>
            <Text style={styles.heroDetailValue}>{exercise.target || "Various"}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.orange}>Muscles Worked</SectionEyebrow>
        <Card style={styles.musclesCard}>
          <View style={styles.musclePrimary}>
            <View style={[styles.muscleDot, { backgroundColor: COLORS.teal }]} />
            <Text style={styles.muscleLabel}>Primary Target</Text>
            <Text style={styles.muscleValue}>{exercise.target || "Various"}</Text>
          </View>
          {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
            <>
              <View style={styles.muscleDivider} />
              <View style={styles.muscleSecondary}>
                <Text style={styles.muscleLabel}>Secondary</Text>
                <View style={styles.secondaryMuscles}>
                  {exercise.secondary_muscles.map((muscle, index) => (
                    <View key={index} style={styles.secondaryMuscle}>
                      <View style={[styles.muscleDot, { backgroundColor: COLORS.muted, width: 6, height: 6 }]} />
                      <Text style={styles.muscleValue}>{muscle.muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </Card>
      </View>

      {exercise.instructions && exercise.instructions.length > 0 && (
        <View style={styles.section}>
          <SectionEyebrow color={COLORS.blue}>Instructions</SectionEyebrow>
          <Card style={styles.instructionsCard}>
            {exercise.instructions.map((instruction, index) => (
              <View key={instruction.id || index} style={styles.instructionRow}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction.instruction || ""}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {exercise.gif_url && (
        <View style={styles.section}>
          <SectionEyebrow color={COLORS.purple}>Demo</SectionEyebrow>
          <Card style={styles.gifCard}>
            <View style={styles.gifPlaceholder}>
              <Ionicons name="videocam-outline" size={40} color={COLORS.muted} />
              <Text style={styles.gifText}>GIF demonstration</Text>
              <Text style={styles.gifSubtext}>Available in full app</Text>
            </View>
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
  },
  heroCard: { marginTop: 16, borderWidth: 1 },
  heroContent: { flexDirection: "row", alignItems: "center" },
  heroInfo: { flex: 1 },
  heroName: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  heroMeta: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  heroDetails: { flexDirection: "row", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  heroDetailItem: { alignItems: "center", flex: 1 },
  heroDetailLabel: { color: COLORS.muted, fontSize: 10, marginTop: 6 },
  heroDetailValue: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginTop: 2, textAlign: "center" },
  section: { marginTop: 24 },
  musclesCard: { marginTop: 10 },
  musclePrimary: { flexDirection: "row", alignItems: "center" },
  muscleDot: { width: 10, height: 10, borderRadius: 5 },
  muscleLabel: { color: COLORS.muted, fontSize: 11, marginLeft: 8 },
  muscleValue: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginLeft: 8 },
  muscleDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 12 },
  muscleSecondary: {},
  secondaryMuscles: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  secondaryMuscle: { flexDirection: "row", alignItems: "center" },
  instructionsCard: { marginTop: 10, gap: 16 },
  instructionRow: { flexDirection: "row", gap: 12 },
  instructionNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: `${COLORS.teal}20`, alignItems: "center", justifyContent: "center" },
  instructionNumberText: { color: COLORS.teal, fontSize: 12, fontWeight: "800" },
  instructionText: { flex: 1, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 20 },
  gifCard: { marginTop: 10 },
  gifPlaceholder: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  gifText: { color: COLORS.text, fontSize: 14, fontWeight: "600", marginTop: 12 },
  gifSubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
});
