import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, TrendChart, ProgressBar, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { EXERCISE_PROGRESS_SERIES, EXERCISE_PROGRESS_VOLUME, EXERCISE_PROGRESS_PERIODS, EXERCISE_OVERLOADS, EXERCISE_NAMES } from "../../data";

type Props = RootStackScreenProps<"ExerciseProgress">;

export function ExerciseProgressScreen({ navigation, route }: Props): React.JSX.Element {
  const { id } = route.params;
  const exerciseName = EXERCISE_NAMES[id] || { name: "Bench Press", emoji: "🏋️" };
  const [selectedPeriod, setSelectedPeriod] = useState("3M");

  const currentE1RM = EXERCISE_PROGRESS_SERIES[EXERCISE_PROGRESS_SERIES.length - 1].value;
  const previousE1RM = EXERCISE_PROGRESS_SERIES[EXERCISE_PROGRESS_SERIES.length - 5].value;
  const improvement = currentE1RM - previousE1RM;
  const improvementPercent = ((improvement / previousE1RM) * 100).toFixed(1);

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title={exerciseName.name} subtitle="Exercise Progress" onBack={() => navigation.goBack()} />

      <Card style={[styles.heroCard, { borderColor: `${COLORS.teal}30` }]}>
        <View style={styles.heroTop}>
          <Text style={styles.heroEmoji}>{exerciseName.emoji}</Text>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{exerciseName.name}</Text>
            <View style={styles.heroBadge}>
              <Tag label="Compound" color={COLORS.teal} />
            </View>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroMainStat}>
            <Text style={styles.e1rmValue}>{currentE1RM}</Text>
            <Text style={styles.e1rmUnit}>kg</Text>
          </View>
          <View style={styles.heroChange}>
            <Feather name="trending-up" size={14} color={COLORS.green} />
            <Text style={styles.changeText}>+{improvement} kg ({improvementPercent}%)</Text>
            <Text style={styles.changePeriod}>vs 8 weeks ago</Text>
          </View>
        </View>

        <View style={styles.periodSelector}>
          {EXERCISE_PROGRESS_PERIODS.map((period) => (
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
      </Card>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.green}>e1RM Progression</SectionEyebrow>
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Estimated 1RM Trend</Text>
            <Text style={styles.chartSubtitle}>Based on working sets</Text>
          </View>
          <TrendChart
            data={EXERCISE_PROGRESS_SERIES}
            color={COLORS.teal}
            height={140}
            referenceValue={100}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.blue}>Volume Per Week</SectionEyebrow>
        <Card style={styles.volumeCard}>
          <View style={styles.volumeHeader}>
            <Text style={styles.volumeTitle}>Weekly Volume</Text>
            <Text style={styles.volumeTotal}>23,200 kg total</Text>
          </View>
          <View style={styles.volumeBars}>
            {EXERCISE_PROGRESS_VOLUME.map((week, index) => (
              <View key={index} style={styles.volumeBar}>
                <View style={styles.volumeBarWrap}>
                  <View
                    style={[
                      styles.volumeBarFill,
                      {
                        height: `${(week.value / 4000) * 100}%`,
                        backgroundColor: week.highlight ? COLORS.teal : `${COLORS.teal}60`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.volumeLabel}>{week.label}</Text>
                {week.highlight && (
                  <View style={styles.volumeHighlight}>
                    <Tag label="Now" color={COLORS.teal} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.orange}>Recent Overloads</SectionEyebrow>
        {EXERCISE_OVERLOADS.map((overload, index) => (
          <Card key={index} style={styles.overloadCard}>
            <View style={styles.overloadRow}>
              <View style={styles.overloadLeft}>
                <Text style={[styles.overloadChange, { color: COLORS.green }]}>{overload.change}</Text>
                <Text style={styles.overloadType}>{overload.type}</Text>
              </View>
              <View style={styles.overloadRight}>
                <Text style={styles.overloadDate}>{overload.date}</Text>
                <Text style={styles.overloadSession}>{overload.session}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Best Set</Text>
          <Text style={styles.statValue}>110 × 3</Text>
          <Text style={styles.statSub}>@ RPE 9</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Sets</Text>
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statSub}>Last 8 weeks</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Avg RPE</Text>
          <Text style={styles.statValue}>7.8</Text>
          <Text style={styles.statSub}>Last 4 weeks</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginTop: 16, borderWidth: 1 },
  heroTop: { flexDirection: "row", alignItems: "center" },
  heroEmoji: { fontSize: 48 },
  heroInfo: { flex: 1, marginLeft: 16 },
  heroName: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  heroBadge: { marginTop: 8 },
  heroStats: { flexDirection: "row", alignItems: "flex-end", marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  heroMainStat: { flexDirection: "row", alignItems: "baseline" },
  e1rmValue: { color: COLORS.teal, fontSize: 36, fontWeight: "900" },
  e1rmUnit: { color: COLORS.muted, fontSize: 16, marginLeft: 4 },
  heroChange: { marginLeft: 16, alignItems: "flex-start" },
  changeText: { color: COLORS.green, fontSize: 14, fontWeight: "700" },
  changePeriod: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  periodSelector: { flexDirection: "row", gap: 8, marginTop: 16 },
  periodChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" },
  periodChipActive: { backgroundColor: COLORS.teal },
  periodText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  periodTextActive: { color: "#000000", fontWeight: "700" },
  section: { marginTop: 24 },
  chartCard: { marginTop: 10 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  chartSubtitle: { color: COLORS.muted, fontSize: 11 },
  volumeCard: { marginTop: 10 },
  volumeHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  volumeTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  volumeTotal: { color: COLORS.muted, fontSize: 11 },
  volumeBars: { flexDirection: "row", justifyContent: "space-between", height: 100 },
  volumeBar: { flex: 1, alignItems: "center" },
  volumeBarWrap: { flex: 1, width: 20, justifyContent: "flex-end" },
  volumeBarFill: { width: "100%", borderRadius: 4 },
  volumeLabel: { color: COLORS.muted, fontSize: 10, marginTop: 8 },
  volumeHighlight: { marginTop: 4 },
  overloadCard: { marginBottom: 8 },
  overloadRow: { flexDirection: "row", justifyContent: "space-between" },
  overloadLeft: {},
  overloadChange: { fontSize: 16, fontWeight: "900" },
  overloadType: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  overloadRight: { alignItems: "flex-end" },
  overloadDate: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  overloadSession: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  statsGrid: { flexDirection: "row", gap: 10, marginTop: 24 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statLabel: { color: COLORS.muted, fontSize: 10 },
  statValue: { color: COLORS.text, fontSize: 16, fontWeight: "900", marginTop: 4 },
  statSub: { color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2 },
});
