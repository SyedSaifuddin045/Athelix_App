import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import {
  BackHeader,
  Card,
  Screen,
  ScreenState,
  SectionEyebrow,
  Tag,
  TrendChart,
} from "../../components";
import { useAppConfigQuery } from "../../features/meta/hooks";
import { useExerciseProgressQuery } from "../../features/progress/hooks";
import type {
  ExerciseProgressPoint,
  ProgressiveOverload,
} from "../../features/progress/schemas";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"ExerciseProgress">;

const WINDOW_OPTIONS = [
  { label: "6 Sessions", limit: 6 },
  { label: "12 Sessions", limit: 12 },
  { label: "All", limit: null },
] as const;

function formatShortDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return value.toFixed(digits);
}

function formatFormulaLabel(value: string): string {
  if (!value) {
    return "Default";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMetricLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function getLatestComparablePoints(
  points: ExerciseProgressPoint[],
): { latest: ExerciseProgressPoint | null; previous: ExerciseProgressPoint | null } {
  const withValues = points.filter((point) => point.default_e1rm !== null);
  if (withValues.length === 0) {
    return { latest: null, previous: null };
  }

  return {
    latest: withValues[withValues.length - 1] ?? null,
    previous: withValues[withValues.length - 2] ?? null,
  };
}

function getBestSetLabel(points: ExerciseProgressPoint[]): string {
  const bestSet = points.reduce<ExerciseProgressPoint | null>((currentBest, point) => {
    if (point.weight_kg === null) {
      return currentBest;
    }

    if (!currentBest || (currentBest.weight_kg ?? 0) < point.weight_kg) {
      return point;
    }

    if ((currentBest.weight_kg ?? 0) === point.weight_kg && (currentBest.reps ?? 0) < (point.reps ?? 0)) {
      return point;
    }

    return currentBest;
  }, null);

  if (!bestSet || bestSet.weight_kg === null) {
    return "—";
  }

  return `${formatNumber(bestSet.weight_kg, 1)} × ${bestSet.reps ?? "?"}`;
}

function buildOverloadSummary(overload: ProgressiveOverload): string {
  if (overload.improved_metrics.length === 0) {
    return "Higher output than the previous session.";
  }

  return overload.improved_metrics.map(formatMetricLabel).join(", ");
}

export function ExerciseProgressScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const { exerciseId } = route.params;
  const [selectedWindow, setSelectedWindow] =
    useState<(typeof WINDOW_OPTIONS)[number]["label"]>("12 Sessions");
  const [selectedFormula, setSelectedFormula] = useState<string | undefined>(
    undefined,
  );

  const appConfigQuery = useAppConfigQuery();
  const progressQuery = useExerciseProgressQuery(
    exerciseId,
    selectedFormula ? { formula: selectedFormula } : {},
  );

  useFocusEffect(
    React.useCallback(() => {
      void appConfigQuery.refetch();
      void progressQuery.refetch();
    }, [appConfigQuery, progressQuery]),
  );

  const progress = progressQuery.data;
  const formulaOptions = appConfigQuery.data?.supported_values.e1rm_formulas ?? [];
  const activeFormula = selectedFormula ?? progress?.default_formula ?? formulaOptions[0];
  const selectedLimit = WINDOW_OPTIONS.find(
    (option) => option.label === selectedWindow,
  )?.limit;
  const visibleHistory = selectedLimit
    ? (progress?.e1rm_history ?? []).slice(-selectedLimit)
    : (progress?.e1rm_history ?? []);
  const e1rmSeries = useMemo(
    () =>
      visibleHistory
        .filter((point) => point.default_e1rm !== null)
        .map((point) => ({
          label: formatShortDate(point.performed_at),
          value: point.default_e1rm ?? 0,
        })),
    [visibleHistory],
  );
  const weeklyVolumeSeries = useMemo(
    () =>
      (progress?.weekly_volume_history ?? []).slice(-8).map((point) => ({
        label: formatShortDate(point.week_end),
        value: point.volume_load,
      })),
    [progress?.weekly_volume_history],
  );
  const overloads = useMemo(
    () => [...(progress?.progressive_overload ?? [])].reverse().slice(0, 4),
    [progress?.progressive_overload],
  );
  const hasProgressData =
    (progress?.e1rm_history.length ?? 0) > 0 ||
    (progress?.weekly_volume_history.length ?? 0) > 0 ||
    overloads.length > 0;
  const { latest, previous } = getLatestComparablePoints(visibleHistory);
  const e1rmDelta =
    latest?.default_e1rm !== null &&
    latest?.default_e1rm !== undefined &&
    previous?.default_e1rm !== null &&
    previous?.default_e1rm !== undefined
      ? latest.default_e1rm - previous.default_e1rm
      : null;
  const e1rmDeltaPercent =
    e1rmDelta !== null && previous?.default_e1rm
      ? (e1rmDelta / previous.default_e1rm) * 100
      : null;
  const latestWeeklyVolume =
    progress?.weekly_volume_history[progress.weekly_volume_history.length - 1]
      ?.volume_load ?? null;
  const bestSetLabel = useMemo(
    () => getBestSetLabel(progress?.e1rm_history ?? []),
    [progress?.e1rm_history],
  );

  if (progressQuery.isLoading && !progress) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Loading exercise progress"
          message="Fetching trend, volume, and overload history."
          loading
        />
      </Screen>
    );
  }

  if (progressQuery.isError || !progress) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Exercise progress unavailable"
          message="The app could not load this exercise history."
          actionLabel="Retry"
          onAction={() => {
            void progressQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader
        title={progress.exercise_name}
        subtitle="Exercise Progress"
        onBack={() => navigation.goBack()}
      />

      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{progress.exercise_name}</Text>
            <View style={styles.heroTags}>
              <Tag
                label={formatFormulaLabel(activeFormula ?? progress.default_formula)}
                color={COLORS.teal}
                backgroundColor={`${COLORS.teal}18`}
              />
              <Tag
                label={`${progress.e1rm_history.length} sessions`}
                color={COLORS.blue}
                backgroundColor={`${COLORS.blue}18`}
              />
            </View>
          </View>
          <View style={styles.heroMetricWrap}>
            <Text style={styles.heroMetricValue}>
              {formatNumber(latest?.default_e1rm, 1)}
            </Text>
            <Text style={styles.heroMetricLabel}>kg e1RM</Text>
          </View>
        </View>

        {e1rmDelta !== null ? (
          <View style={styles.changeRow}>
            <Feather
              name={e1rmDelta >= 0 ? "trending-up" : "trending-down"}
              size={14}
              color={e1rmDelta >= 0 ? COLORS.green : COLORS.orange}
            />
            <Text
              style={[
                styles.changeText,
                { color: e1rmDelta >= 0 ? COLORS.green : COLORS.orange },
              ]}
            >
              {e1rmDelta >= 0 ? "+" : ""}
              {formatNumber(e1rmDelta, 1)} kg
              {e1rmDeltaPercent !== null
                ? ` (${e1rmDeltaPercent >= 0 ? "+" : ""}${formatNumber(
                    e1rmDeltaPercent,
                    1,
                  )}%)`
                : ""}
            </Text>
            <Text style={styles.changeSubtext}>
              vs {previous ? formatLongDate(previous.performed_at) : "previous session"}
            </Text>
          </View>
        ) : (
          <Text style={styles.changeSubtext}>
            Complete at least two logged sessions to unlock change tracking.
          </Text>
        )}

        {formulaOptions.length > 1 ? (
          <View style={styles.formulaSelector}>
            {formulaOptions.map((formula) => {
              const isActive =
                (selectedFormula ?? progress.default_formula) === formula;

              return (
                <Pressable
                  key={formula}
                  onPress={() => setSelectedFormula(formula)}
                  style={[
                    styles.formulaChip,
                    isActive && styles.formulaChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.formulaChipText,
                      isActive && styles.formulaChipTextActive,
                    ]}
                  >
                    {formatFormulaLabel(formula)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.windowSelector}>
          {WINDOW_OPTIONS.map((option) => {
            const isActive = option.label === selectedWindow;
            return (
              <Pressable
                key={option.label}
                onPress={() => setSelectedWindow(option.label)}
                style={[styles.windowChip, isActive && styles.windowChipActive]}
              >
                <Text
                  style={[styles.windowChipText, isActive && styles.windowChipTextActive]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {!hasProgressData ? (
        <ScreenState
          title="No progress history yet"
          message="This exercise does not have any completed sets in your session history."
        />
      ) : (
        <>
          <View style={styles.section}>
            <SectionEyebrow color={COLORS.teal}>e1RM Trend</SectionEyebrow>
            <Card style={styles.chartCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Estimated 1RM</Text>
                <Text style={styles.sectionSubtitle}>
                  {selectedWindow} using {formatFormulaLabel(activeFormula ?? progress.default_formula)}
                </Text>
              </View>
              {e1rmSeries.length >= 2 ? (
                <TrendChart
                  data={e1rmSeries}
                  color={COLORS.teal}
                  height={150}
                  referenceValue={previous?.default_e1rm ?? undefined}
                />
              ) : (
                <Text style={styles.inlineMessage}>
                  Not enough e1RM points yet for a trend line.
                </Text>
              )}
            </Card>
          </View>

          <View style={styles.section}>
            <SectionEyebrow color={COLORS.blue}>Volume</SectionEyebrow>
            <Card style={styles.chartCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Weekly Volume Load</Text>
                <Text style={styles.sectionSubtitle}>
                  {latestWeeklyVolume !== null
                    ? `${formatNumber(latestWeeklyVolume, 0)} kg latest week`
                    : "No weekly volume yet"}
                </Text>
              </View>
              {weeklyVolumeSeries.length >= 2 ? (
                <TrendChart
                  data={weeklyVolumeSeries}
                  color={COLORS.blue}
                  height={150}
                />
              ) : (
                <Text style={styles.inlineMessage}>
                  Weekly volume will appear after completed training weeks accumulate.
                </Text>
              )}
            </Card>
          </View>

          <View style={styles.section}>
            <SectionEyebrow color={COLORS.orange}>Recent Overloads</SectionEyebrow>
            {overloads.length > 0 ? (
              overloads.map((overload) => (
                <Card key={overload.current_session_id} style={styles.overloadCard}>
                  <View style={styles.overloadHeader}>
                    <View style={styles.overloadHeaderLeft}>
                      <Text style={styles.overloadDate}>
                        {formatLongDate(overload.performed_at)}
                      </Text>
                      <Text style={styles.overloadSummary}>
                        {buildOverloadSummary(overload)}
                      </Text>
                    </View>
                    <View style={styles.overloadHeaderRight}>
                      <Text
                        style={[
                          styles.overloadDelta,
                          {
                            color:
                              overload.default_e1rm_delta !== null &&
                              overload.default_e1rm_delta < 0
                                ? COLORS.orange
                                : COLORS.green,
                          },
                        ]}
                      >
                        {overload.default_e1rm_delta !== null
                          ? `${overload.default_e1rm_delta >= 0 ? "+" : ""}${formatNumber(
                              overload.default_e1rm_delta,
                              1,
                            )} kg`
                          : `${overload.volume_load_delta >= 0 ? "+" : ""}${formatNumber(
                              overload.volume_load_delta,
                              0,
                            )} vol`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.overloadMetrics}>
                    <Text style={styles.overloadMetricText}>
                      Volume delta: {overload.volume_load_delta >= 0 ? "+" : ""}
                      {formatNumber(overload.volume_load_delta, 0)}
                    </Text>
                    <Text style={styles.overloadMetricText}>
                      Best weight: {formatNumber(overload.current_best_weight_kg, 1)} kg
                    </Text>
                  </View>
                </Card>
              ))
            ) : (
              <Card style={styles.emptySectionCard}>
                <Text style={styles.inlineMessage}>
                  Progressive overload is shown once consecutive completed sessions can be compared.
                </Text>
              </Card>
            )}
          </View>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Best Set</Text>
              <Text style={styles.statValue}>{bestSetLabel}</Text>
              <Text style={styles.statSub}>Highest logged weight</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Weekly Streak</Text>
              <Text style={styles.statValue}>
                {progress.workout_streaks.current_weekly_streak}
              </Text>
              <Text style={styles.statSub}>current weeks</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Daily Streak</Text>
              <Text style={styles.statValue}>
                {progress.workout_streaks.current_daily_streak}
              </Text>
              <Text style={styles.statSub}>current days</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Longest Streak</Text>
              <Text style={styles.statValue}>
                {progress.workout_streaks.longest_weekly_streak}
              </Text>
              <Text style={styles.statSub}>best weekly run</Text>
            </Card>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: `${COLORS.teal}24`,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },
  heroTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  heroMetricWrap: {
    alignItems: "flex-end",
  },
  heroMetricValue: {
    color: COLORS.teal,
    fontSize: 34,
    fontWeight: "900",
  },
  heroMetricLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  changeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  changeSubtext: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 10,
  },
  formulaSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  formulaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  formulaChipActive: {
    backgroundColor: `${COLORS.teal}18`,
    borderColor: `${COLORS.teal}32`,
  },
  formulaChipText: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    fontWeight: "700",
  },
  formulaChipTextActive: {
    color: COLORS.teal,
  },
  windowSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  windowChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  windowChipActive: {
    backgroundColor: `${COLORS.blue}24`,
  },
  windowChipText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
  },
  windowChipTextActive: {
    color: COLORS.blue,
  },
  section: {
    marginTop: 24,
  },
  chartCard: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "right",
    flexShrink: 1,
  },
  inlineMessage: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  overloadCard: {
    marginTop: 10,
  },
  overloadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  overloadHeaderLeft: {
    flex: 1,
  },
  overloadHeaderRight: {
    alignItems: "flex-end",
  },
  overloadDate: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  overloadSummary: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    textTransform: "capitalize",
  },
  overloadDelta: {
    fontSize: 15,
    fontWeight: "900",
  },
  overloadMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  overloadMetricText: {
    color: COLORS.muted,
    fontSize: 11,
  },
  emptySectionCard: {
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 24,
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 16,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  statSub: {
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    marginTop: 4,
  },
});
