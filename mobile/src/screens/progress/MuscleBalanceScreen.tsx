import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, ProgressBar, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { MUSCLE_DATA, MUSCLE_PERIODS } from "../../data";
import { getMuscleStatus } from "../../utils";

type Props = RootStackScreenProps<"MuscleBalance">;

export function MuscleBalanceScreen({ navigation }: Props): React.JSX.Element {
  const [selectedPeriod, setSelectedPeriod] = useState("4W");

  const totalSets = MUSCLE_DATA.reduce((sum, m) => sum + m.sets, 0);
  const balancedMuscles = MUSCLE_DATA.filter((m) => {
    const status = getMuscleStatus(m.sets, m.target);
    return status.label === "On track" || status.label === "Over";
  }).length;
  const needsWork = MUSCLE_DATA.filter((m) => {
    const status = getMuscleStatus(m.sets, m.target);
    return status.label === "Under" || status.label === "Low";
  });

  const getStatusColor = (label: string) => {
    switch (label) {
      case "Over": return COLORS.green;
      case "On track": return COLORS.teal;
      case "Under": return COLORS.orange;
      case "Low": return COLORS.red;
      default: return COLORS.muted;
    }
  };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title="Muscle Balance" subtitle="Weekly analysis" onBack={() => navigation.goBack()} />

      <View style={styles.periodSelector}>
        {MUSCLE_PERIODS.map((period) => (
          <Pressable
            key={period}
            onPress={() => setSelectedPeriod(period)}
            style={[styles.periodChip, selectedPeriod === period && styles.periodChipActive]}
          >
            <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
              {period}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { borderColor: `${COLORS.teal}30` }]}>
          <Text style={styles.summaryValue}>{totalSets}</Text>
          <Text style={styles.summaryLabel}>Total Sets</Text>
        </Card>
        <Card style={[styles.summaryCard, { borderColor: `${COLORS.green}30` }]}>
          <Text style={[styles.summaryValue, { color: COLORS.green }]}>{balancedMuscles}</Text>
          <Text style={styles.summaryLabel}>Balanced</Text>
        </Card>
        <Card style={[styles.summaryCard, { borderColor: `${COLORS.orange}30` }]}>
          <Text style={[styles.summaryValue, { color: COLORS.orange }]}>{needsWork.length}</Text>
          <Text style={styles.summaryLabel}>Needs Work</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Muscle Groups</SectionEyebrow>

        {MUSCLE_DATA.map((muscle) => {
          const status = getMuscleStatus(muscle.sets, muscle.target);
          const percent = (muscle.sets / muscle.target) * 100;

          return (
            <Card key={muscle.muscle} style={styles.muscleCard}>
              <View style={styles.muscleHeader}>
                <View style={styles.muscleLeft}>
                  <View style={[styles.muscleDot, { backgroundColor: muscle.color }]} />
                  <Text style={styles.muscleName}>{muscle.muscle}</Text>
                </View>
                <View style={styles.muscleRight}>
                  <Text style={styles.muscleSets}>{muscle.sets}/{muscle.target}</Text>
                  <Tag
                    label={status.label}
                    color={status.color}
                    backgroundColor={`${status.color}20`}
                  />
                </View>
              </View>

              <View style={styles.muscleProgress}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, percent)}%`,
                        backgroundColor: status.color,
                      },
                    ]}
                  />
                  {percent > 100 && (
                    <View style={[styles.excessIndicator, { left: `${Math.min(100, (muscle.target / muscle.sets) * 100)}%` }]}>
                      <View style={[styles.excessLine, { backgroundColor: COLORS.text }]} />
                    </View>
                  )}
                </View>
                <Text style={styles.musclePercent}>{percent.toFixed(0)}%</Text>
              </View>
            </Card>
          );
        })}
      </View>

      {needsWork.length > 0 && (
        <View style={styles.section}>
          <SectionEyebrow color={COLORS.orange}>Recommendations</SectionEyebrow>
          <Card style={styles.recommendationsCard}>
            <View style={styles.recommendationsHeader}>
              <Feather name="alert-circle" size={16} color={COLORS.orange} />
              <Text style={styles.recommendationsTitle}>Focus Areas</Text>
            </View>
            <Text style={styles.recommendationsText}>
              Based on your training history, consider adding more volume to:
            </Text>
            <View style={styles.focusAreas}>
              {needsWork.map((muscle) => (
                <View key={muscle.muscle} style={styles.focusArea}>
                  <View style={[styles.focusDot, { backgroundColor: muscle.color }]} />
                  <Text style={styles.focusMuscle}>{muscle.muscle}</Text>
                  <Text style={styles.focusSets}>
                    {muscle.target - muscle.sets} more sets needed
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.teal}>Balance Score</SectionEyebrow>
        <Card style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>82</Text>
            <Text style={styles.scoreLabel}>out of 100</Text>
          </View>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: "82%", backgroundColor: COLORS.teal }]} />
          </View>
          <Text style={styles.scoreDesc}>
            Good overall balance! Focus on hamstrings and calves for optimal development.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  periodSelector: { flexDirection: "row", gap: 8, marginTop: 16 },
  periodChip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" },
  periodChipActive: { backgroundColor: COLORS.purple },
  periodText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  periodTextActive: { color: COLORS.text, fontWeight: "700" },
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  summaryCard: { flex: 1, alignItems: "center", paddingVertical: 16, borderWidth: 1 },
  summaryValue: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  summaryLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  section: { marginTop: 24 },
  muscleCard: { marginBottom: 8 },
  muscleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muscleLeft: { flexDirection: "row", alignItems: "center" },
  muscleDot: { width: 10, height: 10, borderRadius: 5 },
  muscleName: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginLeft: 10 },
  muscleRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  muscleSets: { color: COLORS.muted, fontSize: 12 },
  muscleProgress: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  progressBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  excessIndicator: { position: "absolute", top: -4 },
  excessLine: { width: 2, height: 16, borderRadius: 1 },
  musclePercent: { width: 40, color: COLORS.muted, fontSize: 11, textAlign: "right" },
  recommendationsCard: { marginTop: 10, borderColor: `${COLORS.orange}30`, backgroundColor: `${COLORS.orange}10` },
  recommendationsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  recommendationsTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  recommendationsText: { color: COLORS.muted, fontSize: 12, marginTop: 8, lineHeight: 18 },
  focusAreas: { marginTop: 12, gap: 10 },
  focusArea: { flexDirection: "row", alignItems: "center" },
  focusDot: { width: 8, height: 8, borderRadius: 4 },
  focusMuscle: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: "600", marginLeft: 10 },
  focusSets: { color: COLORS.orange, fontSize: 11, fontWeight: "600" },
  scoreCard: { marginTop: 10 },
  scoreCircle: { alignItems: "center", paddingVertical: 20 },
  scoreValue: { color: COLORS.teal, fontSize: 48, fontWeight: "900" },
  scoreLabel: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  scoreBar: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  scoreDesc: { color: COLORS.muted, fontSize: 12, textAlign: "center", marginTop: 12, lineHeight: 18 },
});
