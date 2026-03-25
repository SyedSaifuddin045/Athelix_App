import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, TrendChart, ProgressBar, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useExerciseProgress } from "../../hooks";

type Props = RootStackScreenProps<"ExerciseProgress">;

const PERIODS = ["1W", "2W", "3M", "6M", "1Y"];

export function ExerciseProgressScreen({ navigation, route }: Props): React.JSX.Element {
  const { id } = route.params;
  const { data: progress, isLoading, error } = useExerciseProgress(id);
  const [selectedPeriod, setSelectedPeriod] = useState("3M");

  if (isLoading) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <BackHeader title="Exercise Progress" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </Screen>
    );
  }

  if (error || !progress) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <BackHeader title="Exercise Progress" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load progress data</Text>
        </View>
      </Screen>
    );
  }

  const currentE1RM = progress.progressive_overload?.current_e1rm || 0;
  const previousE1RM = progress.progressive_overload?.previous_e1rm || currentE1RM;
  const improvement = currentE1RM - previousE1RM;
  const improvementPercent = previousE1RM > 0 ? ((improvement / previousE1RM) * 100).toFixed(1) : "0";

  const chartData = (progress.e1rm_history || []).map((item) => ({
    label: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: item.value,
  }));

  const weeklyVolume = progress.weekly_volume || { current_week: { volume: 0, sets: 0 }, last_week: { volume: 0, sets: 0 }, change_percentage: 0 };
  const overload = progress.progressive_overload || { is_overloading: false, current_e1rm: 0, previous_e1rm: 0, change: 0, change_percentage: 0 };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title={progress.exercise_name} subtitle="Exercise Progress" onBack={() => navigation.goBack()} />

      <Card style={[styles.heroCard, { borderColor: `${COLORS.teal}30` }]}>
        <View style={styles.heroTop}>
          <Text style={styles.heroEmoji}>{progress.exercise_emoji || "🏋️"}</Text>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{progress.exercise_name}</Text>
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
            <Text style={styles.changeText}>
              {improvement >= 0 ? "+" : ""}{improvement} kg ({improvementPercent}%)
            </Text>
            <Text style={styles.changePeriod}>vs previous period</Text>
          </View>
        </View>

        <View style={styles.periodSelector}>
          {PERIODS.map((period) => (
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
            data={chartData}
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
            <Text style={styles.volumeTotal}>{weeklyVolume.current_week.volume.toLocaleString()} kg total</Text>
          </View>
          <View style={styles.volumeBars}>
            <View style={styles.volumeBar}>
              <View style={styles.volumeBarWrap}>
                <View
                  style={[
                    styles.volumeBarFill,
                    {
                      height: "50%",
                      backgroundColor: COLORS.teal,
                    },
                  ]}
                />
              </View>
              <Text style={styles.volumeLabel}>Last</Text>
            </View>
            <View style={styles.volumeBar}>
              <View style={styles.volumeBarWrap}>
                <View
                  style={[
                    styles.volumeBarFill,
                    {
                      height: "80%",
                      backgroundColor: COLORS.teal,
                    },
                  ]}
                />
              </View>
              <Text style={styles.volumeLabel}>Now</Text>
              <View style={styles.volumeHighlight}>
                <Tag label="Now" color={COLORS.teal} />
              </View>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.orange}>Recent Overloads</SectionEyebrow>
        {overload.is_overloading && (
          <Card style={styles.overloadCard}>
            <View style={styles.overloadRow}>
              <View style={styles.overloadLeft}>
                <Text style={[styles.overloadChange, { color: COLORS.green }]}>
                  +{overload.change.toFixed(1)} kg
                </Text>
                <Text style={styles.overloadType}>e1RM Increase</Text>
              </View>
              <View style={styles.overloadRight}>
                <Text style={styles.overloadDate}>Current</Text>
                <Text style={styles.overloadSession}>Progressive Overload</Text>
              </View>
            </View>
          </Card>
        )}
        {!overload.is_overloading && (
          <Card style={styles.overloadCard}>
            <View style={styles.overloadRow}>
              <View style={styles.overloadLeft}>
                <Text style={[styles.overloadChange, { color: COLORS.muted }]}>
                  Maintain
                </Text>
                <Text style={styles.overloadType}>No overload detected</Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Best Set</Text>
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statSub}>@ RPE -</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Sets</Text>
          <Text style={styles.statValue}>{weeklyVolume.current_week.sets + weeklyVolume.last_week.sets}</Text>
          <Text style={styles.statSub}>Last 2 weeks</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Volume Change</Text>
          <Text style={[styles.statValue, { color: weeklyVolume.change_percentage >= 0 ? COLORS.green : COLORS.red }]}>
            {weeklyVolume.change_percentage >= 0 ? "+" : ""}{weeklyVolume.change_percentage.toFixed(0)}%
          </Text>
          <Text style={styles.statSub}>vs last week</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
