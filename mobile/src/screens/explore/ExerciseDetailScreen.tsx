import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { EXERCISE_DETAILS, EXERCISE_FALLBACK, DIFFICULTY_COLORS } from "../../data";

type Props = RootStackScreenProps<"ExerciseDetail">;

export function ExerciseDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const { id } = route.params;
  const exercise = EXERCISE_DETAILS[id] || { ...EXERCISE_FALLBACK, name: `Exercise ${id}` };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title={exercise.name} onBack={() => navigation.goBack()} />

      <Card style={[styles.heroCard, { borderColor: `${COLORS.teal}30` }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroEmoji}>{exercise.emoji}</Text>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{exercise.name}</Text>
            <View style={styles.heroMeta}>
              <Tag label={exercise.category} color={COLORS.teal} />
              <Tag label={exercise.difficulty} color={DIFFICULTY_COLORS[exercise.difficulty]} />
            </View>
          </View>
        </View>
        <View style={styles.heroDetails}>
          <View style={styles.heroDetailItem}>
            <Ionicons name="barbell-outline" size={18} color={COLORS.muted} />
            <Text style={styles.heroDetailLabel}>Equipment</Text>
            <Text style={styles.heroDetailValue}>{exercise.equipment}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.orange}>Muscles Worked</SectionEyebrow>
        <Card style={styles.musclesCard}>
          <View style={styles.musclePrimary}>
            <View style={[styles.muscleDot, { backgroundColor: COLORS.teal }]} />
            <Text style={styles.muscleLabel}>Primary</Text>
            <Text style={styles.muscleValue}>{exercise.primaryMuscle}</Text>
          </View>
          <View style={styles.muscleDivider} />
          <View style={styles.muscleSecondary}>
            <Text style={styles.muscleLabel}>Secondary</Text>
            <View style={styles.secondaryMuscles}>
              {exercise.secondaryMuscles.map((muscle, index) => (
                <View key={index} style={styles.secondaryMuscle}>
                  <View style={[styles.muscleDot, { backgroundColor: COLORS.muted, width: 6, height: 6 }]} />
                  <Text style={styles.muscleValue}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.blue}>Instructions</SectionEyebrow>
        <Card style={styles.instructionsCard}>
          {exercise.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.gold}>Pro Tips</SectionEyebrow>
        <Card style={styles.tipsCard}>
          {exercise.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Feather name="zap" size={14} color={COLORS.gold} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginTop: 16, borderWidth: 1 },
  heroContent: { flexDirection: "row", alignItems: "center" },
  heroEmoji: { fontSize: 56 },
  heroInfo: { flex: 1, marginLeft: 16 },
  heroName: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  heroMeta: { flexDirection: "row", gap: 8, marginTop: 10 },
  heroDetails: { flexDirection: "row", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  heroDetailItem: { alignItems: "center", flex: 1 },
  heroDetailLabel: { color: COLORS.muted, fontSize: 10, marginTop: 6 },
  heroDetailValue: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginTop: 2 },
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
  tipsCard: { marginTop: 10, gap: 12 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipText: { flex: 1, color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 20 },
});
