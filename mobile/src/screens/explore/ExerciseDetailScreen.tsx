import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BackHeader, Card, Screen, ScreenState, SectionEyebrow, Tag } from "../../components";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";
import { useExerciseDetailQuery } from "../../features/exercises/hooks";

type Props = RootStackScreenProps<"ExerciseDetail">;

export function ExerciseDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const exerciseId = route.params.exerciseId;
  const detailQuery = useExerciseDetailQuery(exerciseId);

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader
        title={detailQuery.data?.name ?? "Exercise Detail"}
        onBack={() => navigation.goBack()}
      />

      {detailQuery.isLoading && !detailQuery.data ? (
        <ScreenState title="Loading exercise" loading message={`Fetching /exercises/${exerciseId}`} />
      ) : null}

      {detailQuery.isError ? (
        <ScreenState
          title="Exercise unavailable"
          message="The app could not load this exercise detail."
          actionLabel="Retry"
          onAction={() => {
            void detailQuery.refetch();
          }}
        />
      ) : null}

      {detailQuery.data ? (
        <>
          <Card style={[styles.heroCard, { borderColor: `${COLORS.teal}30` }]}>
            <View style={styles.heroContent}>
              <View style={styles.heroMedia}>
                {detailQuery.data.gif_url ? (
                  <Image source={{ uri: detailQuery.data.gif_url }} style={styles.heroImage} resizeMode="cover" />
                ) : (
                  <View style={styles.heroFallback}>
                    <Ionicons name="barbell-outline" size={34} color={COLORS.teal} />
                  </View>
                )}
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{detailQuery.data.name}</Text>
                <View style={styles.heroMeta}>
                  {detailQuery.data.target ? <Tag label={detailQuery.data.target} color={COLORS.teal} /> : null}
                  {detailQuery.data.body_part ? <Tag label={detailQuery.data.body_part} color={COLORS.blue} /> : null}
                </View>
              </View>
            </View>
            <View style={styles.heroDetails}>
              <View style={styles.heroDetailItem}>
                <Ionicons name="barbell-outline" size={18} color={COLORS.muted} />
                <Text style={styles.heroDetailLabel}>Equipment</Text>
                <Text style={styles.heroDetailValue}>{detailQuery.data.equipment ?? "Not specified"}</Text>
              </View>
            </View>
          </Card>

          {detailQuery.data.secondary_muscles.length > 0 ? (
            <View style={styles.section}>
              <SectionEyebrow color={COLORS.orange}>Muscles Worked</SectionEyebrow>
              <Card style={styles.musclesCard}>
                <View style={styles.musclePrimary}>
                  <View style={[styles.muscleDot, { backgroundColor: COLORS.teal }]} />
                  <Text style={styles.muscleLabel}>Primary</Text>
                  <Text style={styles.muscleValue}>{detailQuery.data.target ?? detailQuery.data.body_part ?? "Unknown"}</Text>
                </View>
                <View style={styles.muscleDivider} />
                <View>
                  <Text style={styles.muscleLabel}>Secondary</Text>
                  <View style={styles.secondaryMuscles}>
                    {detailQuery.data.secondary_muscles.map((muscle) => (
                      <View key={muscle.id} style={styles.secondaryMuscle}>
                        <View style={[styles.muscleDot, { backgroundColor: COLORS.muted, width: 6, height: 6 }]} />
                        <Text style={styles.muscleValue}>{muscle.muscle}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionEyebrow color={COLORS.blue}>Instructions</SectionEyebrow>
            <Card style={styles.instructionsCard}>
              {detailQuery.data.instructions.length > 0 ? (
                detailQuery.data.instructions.map((instruction, index) => (
                  <View key={instruction.id} style={styles.instructionRow}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>
                        {instruction.step_number ?? index + 1}
                      </Text>
                    </View>
                    <Text style={styles.instructionText}>
                      {instruction.instruction || "No instruction text supplied."}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyInstructionText}>
                  This exercise does not currently include detailed instructions from the API.
                </Text>
              )}
            </Card>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginTop: 16, borderWidth: 1 },
  heroContent: { flexDirection: "row", alignItems: "center" },
  heroMedia: { width: 90, height: 90, borderRadius: 18, overflow: "hidden" },
  heroImage: { width: "100%", height: "100%" },
  heroFallback: {
    flex: 1,
    backgroundColor: `${COLORS.teal}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: { flex: 1, marginLeft: 16 },
  heroName: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  heroMeta: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  heroDetails: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
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
  secondaryMuscles: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  secondaryMuscle: { flexDirection: "row", alignItems: "center" },
  instructionsCard: { marginTop: 10, gap: 16 },
  instructionRow: { flexDirection: "row", gap: 12 },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.teal}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionNumberText: { color: COLORS.teal, fontSize: 12, fontWeight: "800" },
  instructionText: { flex: 1, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 20 },
  emptyInstructionText: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
});
