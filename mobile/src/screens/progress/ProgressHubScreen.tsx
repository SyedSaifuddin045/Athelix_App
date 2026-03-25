import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { AnalyticsCard, Card, Screen, ScreenState, SectionEyebrow, Tag } from "../../components";
import { useMuscleBalanceQuery } from "../../features/analytics/hooks";
import { useOverviewQuery, useBodyWeightLogsQuery } from "../../features/users/hooks";
import { usePersonalRecordsQuery } from "../../features/progress/hooks";
import { useRefetchOnFocus } from "../../lib/hooks/useRefetchOnFocus";
import { COLORS } from "../../theme/colors";
import { TabScreenProps } from "../../types/navigation";
import { getMuscleStatus } from "../../utils";

type Props = TabScreenProps<"Progress">;

const PROGRESS_SECTIONS = [
  {
    path: "personalRecords",
    title: "Personal Records",
    desc: "Browse derived PR history from completed sessions.",
    badge: "Derived",
    color: COLORS.gold,
  },
  {
    path: "exerciseProgress",
    title: "Exercise Progress",
    desc: "Inspect e1RM, volume, and overload history by exercise.",
    badge: "Trend",
    color: COLORS.teal,
  },
  {
    path: "muscleBalance",
    title: "Muscle Balance",
    desc: "Compare weekly training volume against minimum targets.",
    badge: "Analytics",
    color: COLORS.purple,
  },
] as const;

export function ProgressHubScreen({ navigation }: Props): React.JSX.Element {
  const overviewQuery = useOverviewQuery();
  const recordsQuery = usePersonalRecordsQuery();
  const muscleBalanceQuery = useMuscleBalanceQuery({ weeks: 4 });
  const bodyWeightLogsQuery = useBodyWeightLogsQuery();

  useRefetchOnFocus([
    overviewQuery.refetch,
    recordsQuery.refetch,
    muscleBalanceQuery.refetch,
    bodyWeightLogsQuery.refetch,
  ]);

  const recentExerciseId = overviewQuery.data?.recent_personal_records[0]?.exercise_id ?? recordsQuery.data?.[0]?.exercise_id;
  const latestWeight = bodyWeightLogsQuery.data?.[0]?.weight_kg ?? overviewQuery.data?.latest_body_weight_log?.weight_kg ?? null;
  const oldestWeight = bodyWeightLogsQuery.data?.[bodyWeightLogsQuery.data.length - 1]?.weight_kg ?? null;
  const weightDelta = latestWeight !== null && oldestWeight !== null ? latestWeight - oldestWeight : null;

  const bodyweightBars = useMemo(() => {
    return [...(bodyWeightLogsQuery.data ?? [])]
      .slice(0, 10)
      .reverse()
      .map((item) => item.weight_kg);
  }, [bodyWeightLogsQuery.data]);

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <ScreenState title="Loading progress" message="Fetching overview and analytics." loading />
      </Screen>
    );
  }

  if (overviewQuery.isError && !overviewQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <ScreenState
          title="Progress unavailable"
          message="The app could not load your progress overview."
          actionLabel="Retry"
          onAction={() => {
            void overviewQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>
      </View>

      <View style={styles.quickStatsRow}>
        <AnalyticsCard
          label="Sessions"
          value={`${overviewQuery.data?.stats.completed_sessions ?? 0}`}
          sub="completed"
          color={COLORS.teal}
        />
        <AnalyticsCard
          label="Records"
          value={`${overviewQuery.data?.stats.personal_record_count ?? recordsQuery.data?.length ?? 0}`}
          sub="derived PRs"
          color={COLORS.gold}
        />
        <AnalyticsCard
          label="Daily Streak"
          value={`${overviewQuery.data?.workout_streaks.current_daily_streak ?? 0}`}
          sub="days active"
          color={COLORS.green}
        />
        <AnalyticsCard
          label="Templates"
          value={`${overviewQuery.data?.stats.total_workout_templates ?? 0}`}
          sub="reusable plans"
          color={COLORS.blue}
        />
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Progress Sections</SectionEyebrow>

        {PROGRESS_SECTIONS.map((section) => {
          const isDisabled = section.path === "exerciseProgress" && !recentExerciseId;

          return (
            <Pressable
              key={section.path}
              disabled={isDisabled}
              onPress={() => {
                if (section.path === "personalRecords") {
                  navigation.navigate("PersonalRecords");
                } else if (section.path === "exerciseProgress" && recentExerciseId) {
                  navigation.navigate("ExerciseProgress", { exerciseId: recentExerciseId });
                } else if (section.path === "muscleBalance") {
                  navigation.navigate("MuscleBalance");
                }
              }}
            >
              <Card style={[styles.sectionCard, { borderColor: `${section.color}30`, opacity: isDisabled ? 0.6 : 1 }]}>
                <View style={styles.sectionRow}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: `${section.color}20` }]}>
                    <Ionicons name="bar-chart" size={18} color={section.color} />
                  </View>
                  <View style={styles.sectionInfo}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionDesc}>
                      {isDisabled ? "Complete a session that creates a personal record first." : section.desc}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={section.color} />
                </View>
                <View style={styles.sectionFooter}>
                  <Tag label={section.badge} color={section.color} backgroundColor={`${section.color}20`} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.teal}>Weekly Snapshot</SectionEyebrow>
        <Card style={styles.snapshotCard}>
          <View style={styles.snapshotHeader}>
            <Text style={styles.snapshotTitle}>Muscle Group Coverage</Text>
            <Text style={styles.snapshotSubtitle}>
              {muscleBalanceQuery.data ? `${muscleBalanceQuery.data.weeks_in_scope} week scope` : "Loading"}
            </Text>
          </View>

          {muscleBalanceQuery.data ? (
            <View style={styles.muscleOverview}>
              {muscleBalanceQuery.data.items.slice(0, 4).map((muscle) => {
                const status = getMuscleStatus(
                  muscle.average_weekly_sets,
                  muscle.minimum_weekly_sets,
                );
                return (
                  <View key={muscle.muscle_group} style={styles.muscleRow}>
                    <Text style={styles.muscleName}>{muscle.muscle_group}</Text>
                    <View style={styles.muscleBarWrap}>
                      <View style={styles.muscleBarBg}>
                        <View
                          style={[
                            styles.muscleBarFill,
                            {
                              width: `${Math.min(100, (muscle.average_weekly_sets / muscle.minimum_weekly_sets) * 100)}%`,
                              backgroundColor: status.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.muscleStatus, { color: status.color }]}>{status.label}</Text>
                  </View>
                );
              })}
            </View>
          ) : muscleBalanceQuery.isError ? (
            <Text style={styles.inlineError}>Muscle balance analytics are unavailable right now.</Text>
          ) : (
            <Text style={styles.inlineLoading}>Loading muscle balance analytics…</Text>
          )}

          <Pressable
            style={styles.viewAllButton}
            onPress={() => navigation.navigate("MuscleBalance")}
          >
            <Text style={styles.viewAllText}>View Full Analysis</Text>
            <Feather name="arrow-right" size={14} color={COLORS.teal} />
          </Pressable>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.gold}>Bodyweight Tracking</SectionEyebrow>
        <Pressable onPress={() => navigation.navigate("BodyweightHistory")}>
          <Card style={styles.bodyweightCard}>
            <View style={styles.bodyweightMain}>
              <View>
                <Text style={styles.bodyweightLabel}>Current</Text>
                <Text style={styles.bodyweightValue}>
                  {latestWeight !== null ? `${latestWeight} kg` : "No logs"}
                </Text>
              </View>
              {weightDelta !== null ? (
                <View style={styles.bodyweightChange}>
                  <Feather
                    name={weightDelta <= 0 ? "trending-down" : "trending-up"}
                    size={14}
                    color={weightDelta <= 0 ? COLORS.green : COLORS.orange}
                  />
                  <Text style={[styles.changeValue, { color: weightDelta <= 0 ? COLORS.green : COLORS.orange }]}>
                    {weightDelta > 0 ? "+" : ""}
                    {weightDelta.toFixed(1)} kg
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.bodyweightPeriod}>
              {bodyWeightLogsQuery.data?.length ? `${bodyWeightLogsQuery.data.length} logged entries` : "No bodyweight history yet"}
            </Text>
            <View style={styles.bodyweightMiniBars}>
              {(bodyweightBars.length ? bodyweightBars : [0, 0, 0, 0, 0]).map((value, index) => {
                const baseline = bodyweightBars.length ? Math.max(...bodyweightBars, 1) : 1;
                const min = bodyweightBars.length ? Math.min(...bodyweightBars) : 0;
                const height = bodyweightBars.length
                  ? 8 + (((value - min) / Math.max(1, baseline - min)) * 22)
                  : 8;

                return (
                  <View
                    key={`${value}-${index}`}
                    style={[
                      styles.miniBar,
                      {
                        height,
                        backgroundColor: index === bodyweightBars.length - 1 ? COLORS.teal : "rgba(255,255,255,0.15)",
                      },
                    ]}
                  />
                );
              })}
            </View>
          </Card>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  quickStatsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  section: { marginTop: 28 },
  sectionCard: { marginBottom: 10, borderWidth: 1 },
  sectionRow: { flexDirection: "row", alignItems: "center" },
  sectionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionInfo: { flex: 1, marginLeft: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  sectionDesc: { color: COLORS.muted, fontSize: 11, marginTop: 2, lineHeight: 18 },
  sectionFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  snapshotCard: { marginTop: 10 },
  snapshotHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  snapshotTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  snapshotSubtitle: { color: COLORS.muted, fontSize: 11 },
  muscleOverview: { marginTop: 16, gap: 10 },
  muscleRow: { flexDirection: "row", alignItems: "center" },
  muscleName: { width: 92, color: COLORS.muted, fontSize: 11, textTransform: "capitalize" },
  muscleBarWrap: { flex: 1, marginHorizontal: 8 },
  muscleBarBg: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)" },
  muscleBarFill: { height: "100%", borderRadius: 3 },
  muscleStatus: { width: 60, fontSize: 9, fontWeight: "700", textAlign: "right" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)" },
  viewAllText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  bodyweightCard: { marginTop: 10 },
  bodyweightMain: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  bodyweightLabel: { color: COLORS.muted, fontSize: 11 },
  bodyweightValue: { color: COLORS.text, fontSize: 24, fontWeight: "900", marginTop: 4 },
  bodyweightChange: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  changeValue: { fontSize: 13, fontWeight: "700" },
  bodyweightPeriod: { color: COLORS.muted, fontSize: 11, marginTop: 8 },
  bodyweightMiniBars: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: 16, height: 34 },
  miniBar: { flex: 1, borderRadius: 3 },
  inlineError: { color: COLORS.orange, fontSize: 12, marginTop: 16 },
  inlineLoading: { color: COLORS.muted, fontSize: 12, marginTop: 16 },
});
