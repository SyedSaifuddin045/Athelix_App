import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import {
  BackHeader,
  Card,
  ProgressBar,
  Screen,
  ScreenState,
  SectionEyebrow,
  Tag,
} from "../../components";
import { useMuscleBalanceQuery } from "../../features/analytics/hooks";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";
import { getMuscleStatus } from "../../utils";

type Props = RootStackScreenProps<"MuscleBalance">;

const PERIOD_OPTIONS = [
  { label: "4W", weeks: 4 },
  { label: "8W", weeks: 8 },
  { label: "12W", weeks: 12 },
] as const;

function formatMuscleLabel(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function MuscleBalanceScreen({
  navigation,
}: Props): React.JSX.Element {
  const [selectedWeeks, setSelectedWeeks] = useState(4);
  const muscleBalanceQuery = useMuscleBalanceQuery({ weeks: selectedWeeks });

  useFocusEffect(
    React.useCallback(() => {
      void muscleBalanceQuery.refetch();
    }, [muscleBalanceQuery]),
  );

  const report = muscleBalanceQuery.data;
  const items = report?.items ?? [];
  const totalSets = items.reduce((sum, item) => sum + item.completed_sets, 0);
  const balancedMuscles = items.filter((item) => {
    const status = getMuscleStatus(
      item.average_weekly_sets,
      Math.max(1, item.minimum_weekly_sets),
    );
    return status.label === "On track" || status.label === "Over";
  }).length;
  const needsWork = useMemo(
    () =>
      items
        .filter((item) => {
          const status = getMuscleStatus(
            item.average_weekly_sets,
            Math.max(1, item.minimum_weekly_sets),
          );
          return status.label === "Under" || status.label === "Low";
        })
        .sort((left, right) => left.difference_vs_minimum - right.difference_vs_minimum),
    [items],
  );
  const balanceScore = items.length
    ? Math.round(
        (items.reduce((sum, item) => {
          const ratio = item.average_weekly_sets / Math.max(1, item.minimum_weekly_sets);
          return sum + Math.min(1, ratio);
        }, 0) /
          items.length) *
          100,
      )
    : 0;

  if (muscleBalanceQuery.isLoading && !report) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Loading muscle balance"
          message="Fetching weekly volume analysis by muscle group."
          loading
        />
      </Screen>
    );
  }

  if (muscleBalanceQuery.isError || !report) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Muscle balance unavailable"
          message="The app could not load this analytics report."
          actionLabel="Retry"
          onAction={() => {
            void muscleBalanceQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader
        title="Muscle Balance"
        subtitle={`${report.weeks_in_scope} week analysis`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.periodSelector}>
        {PERIOD_OPTIONS.map((option) => {
          const isActive = option.weeks === selectedWeeks;
          return (
            <Pressable
              key={option.weeks}
              onPress={() => setSelectedWeeks(option.weeks)}
              style={[styles.periodChip, isActive && styles.periodChipActive]}
            >
              <Text style={[styles.periodText, isActive && styles.periodTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {items.length === 0 ? (
        <ScreenState
          title="No completed training volume"
          message="Muscle balance appears after you complete workout sessions with logged sets."
        />
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{totalSets}</Text>
              <Text style={styles.summaryLabel}>Completed Sets</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: COLORS.green }]}>
                {balancedMuscles}
              </Text>
              <Text style={styles.summaryLabel}>On Track</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: COLORS.orange }]}>
                {needsWork.length}
              </Text>
              <Text style={styles.summaryLabel}>Needs Work</Text>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionEyebrow color={COLORS.purple}>Muscle Groups</SectionEyebrow>
            {items.map((item) => {
              const target = Math.max(1, item.minimum_weekly_sets);
              const status = getMuscleStatus(item.average_weekly_sets, target);
              const percent = (item.average_weekly_sets / target) * 100;

              return (
                <Card key={item.muscle_group} style={styles.muscleCard}>
                  <View style={styles.muscleHeader}>
                    <View style={styles.muscleHeaderLeft}>
                      <Text style={styles.muscleName}>
                        {formatMuscleLabel(item.muscle_group)}
                      </Text>
                      <Text style={styles.muscleMeta}>
                        {item.completed_sets} total sets across {report.weeks_in_scope} weeks
                      </Text>
                    </View>
                    <Tag
                      label={status.label}
                      color={status.color}
                      backgroundColor={`${status.color}18`}
                    />
                  </View>

                  <View style={styles.progressRow}>
                    <ProgressBar value={Math.min(percent, 100)} color={status.color} />
                    <Text style={[styles.progressValue, { color: status.color }]}>
                      {formatNumber(item.average_weekly_sets)} / {formatNumber(target)} wk
                    </Text>
                  </View>

                  <View style={styles.muscleFooter}>
                    <Text style={styles.footerText}>
                      Minimum target: {formatNumber(target)} sets per week
                    </Text>
                    <Text
                      style={[
                        styles.footerText,
                        {
                          color:
                            item.difference_vs_minimum >= 0
                              ? COLORS.green
                              : COLORS.orange,
                        },
                      ]}
                    >
                      {item.difference_vs_minimum >= 0 ? "+" : ""}
                      {formatNumber(item.difference_vs_minimum)} vs target
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>

          <View style={styles.section}>
            <SectionEyebrow color={COLORS.teal}>Balance Score</SectionEyebrow>
            <Card style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View>
                  <Text style={styles.scoreValue}>{balanceScore}</Text>
                  <Text style={styles.scoreLabel}>out of 100</Text>
                </View>
                <Feather name="activity" size={26} color={COLORS.teal} />
              </View>
              <ProgressBar value={balanceScore} color={COLORS.teal} height={8} />
              <Text style={styles.scoreDesc}>
                {needsWork.length === 0
                  ? "All tracked muscle groups are meeting or exceeding the minimum weekly volume target."
                  : `Focus next on ${needsWork
                      .slice(0, 2)
                      .map((item) => formatMuscleLabel(item.muscle_group))
                      .join(" and ")}.`}
              </Text>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionEyebrow color={COLORS.orange}>Recommendations</SectionEyebrow>
            <Card style={styles.recommendationsCard}>
              {needsWork.length > 0 ? (
                needsWork.map((item) => (
                  <View key={item.muscle_group} style={styles.recommendationRow}>
                    <View style={styles.recommendationInfo}>
                      <Text style={styles.recommendationMuscle}>
                        {formatMuscleLabel(item.muscle_group)}
                      </Text>
                      <Text style={styles.recommendationMeta}>
                        Average {formatNumber(item.average_weekly_sets)} sets per week
                      </Text>
                    </View>
                    <Text style={styles.recommendationDelta}>
                      {Math.abs(item.difference_vs_minimum).toFixed(1)} short
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyRecommendationText}>
                  Nothing is under target in this window. Keep distributing volume consistently.
                </Text>
              )}
            </Card>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  periodSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  periodChipActive: {
    backgroundColor: `${COLORS.purple}22`,
  },
  periodText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
  },
  periodTextActive: {
    color: COLORS.purple,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    marginTop: 24,
  },
  muscleCard: {
    marginTop: 10,
  },
  muscleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  muscleHeaderLeft: {
    flex: 1,
  },
  muscleName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  muscleMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  progressValue: {
    width: 76,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  muscleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  footerText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
  },
  scoreCard: {
    marginTop: 10,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreValue: {
    color: COLORS.teal,
    fontSize: 42,
    fontWeight: "900",
  },
  scoreLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  scoreDesc: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
  recommendationsCard: {
    marginTop: 10,
    borderColor: `${COLORS.orange}24`,
  },
  recommendationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationMuscle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  recommendationMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  recommendationDelta: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyRecommendationText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
