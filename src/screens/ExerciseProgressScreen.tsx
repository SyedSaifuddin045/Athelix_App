import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useExerciseProgressQuery, useExercisesQuery } from "../api/queries";
import { EXERCISE_PROGRESS_PERIODS } from "../data";
import { createWorkoutSessionWorkoutSessionsPost, createExerciseSetWorkoutSessionsSessionIdSetsPost } from "../api/endpoints/workout-sessions/workout-sessions";
import type { WorkoutSessionResponse } from "../api/model/workoutSessionResponse";
import { getApiErrorMessage } from "../api/client";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { CompactStatCard } from "../components/ui/Stats";
import { TrendChart, VerticalBars } from "../components/ui/Charts";
import { SectionEyebrow } from "../components/ui/Indicators";
import { AppIcon } from "../design-system/icons/AppIcon";
import { ExercisePicker } from "../components/ExercisePicker";
import { formatShortDate } from "../utils/format";
import { exerciseLookup } from "../utils/mapping";
import { nameForExercise } from "../utils/display";

function ProgressSkeleton() {
  const skeletonColor = "rgba(255,255,255,0.12)";
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const S = ({ h }: { h: number }) => (
    <Animated.View style={{ opacity, height: h, borderRadius: 16, backgroundColor: skeletonColor, flex: 1 }} />
  );

  return (
    <View style={{ marginTop: 24, gap: 24 }}>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <S h={88} />
        <S h={88} />
      </View>
      <S h={160} />
      <S h={140} />
      <View style={{ gap: 12 }}>
        <S h={20} />
        <S h={88} />
        <S h={88} />
      </View>
    </View>
  );
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ExerciseProgress">;
  route: RouteProp<RootStackParamList, "ExerciseProgress">;
};

export function ExerciseProgressScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const routeId = route.params?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(routeId);
  const [pickerOpen, setPickerOpen] = useState(!routeId);
  const [period, setPeriod] = useState<string>("1M");
  const weeks = period === "1M" ? 4 : period === "3M" ? 12 : period === "6M" ? 24 : period === "1Y" ? 52 : undefined;
  const progress = useExerciseProgressQuery(selectedId, weeks ? { weeks } : {}, isAuthenticated);
  const periods = !selectedId ? [] : EXERCISE_PROGRESS_PERIODS;
  const exercisesQuery = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(exercisesQuery.data?.items), [exercisesQuery.data?.items]);
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const goldColor = theme.colorGold?.get() ?? "#FBBF24";
  const surfaceHover = theme.surfaceHover?.get() ?? "rgba(255,255,255,0.06)";
  const compareBlue = "#3B82F6";

  const e1rmChartData = progress.data?.e1rm_history?.map((p) => ({
    value: p.default_e1rm ?? 0,
    label: formatShortDate(p.performed_at),
  }));
  const volumeChartData = progress.data?.weekly_volume_history?.map((w) => ({
    label: formatShortDate(w.week_start),
    value: w.volume_load,
  }));
  const [starting, setStarting] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [compareId, setCompareId] = useState<string | undefined>();
  const [comparePickerOpen, setComparePickerOpen] = useState(false);

  const compareProgress = useExerciseProgressQuery(
    compareId,
    weeks ? { weeks } : {},
    isAuthenticated && compareMode && !!compareId,
  );
  const compareE1rmData = compareProgress.data?.e1rm_history?.map((p) => ({
    value: p.default_e1rm ?? 0,
    label: formatShortDate(p.performed_at),
  }));
  const chartSeries = compareMode && compareE1rmData && compareE1rmData.length > 0 && e1rmChartData && e1rmChartData.length > 0
    ? [
        { data: e1rmChartData, color: accent, label: nameForExercise(selectedId!, lookup) ?? selectedId! },
        { data: compareE1rmData, color: compareBlue, label: nameForExercise(compareId!, lookup) ?? compareId! },
      ]
    : undefined;
  const compareName = compareId ? (nameForExercise(compareId, lookup) ?? compareId) : "";

  async function handleStartWorkout() {
    if (!selectedId) return;
    setStarting(true);
    try {
      const now = new Date();
      const sessionRes = await createWorkoutSessionWorkoutSessionsPost({
        name: "Workout",
        started_at: now.toISOString(),
        is_completed: false,
      });
      const session = sessionRes.data as WorkoutSessionResponse;
      await createExerciseSetWorkoutSessionsSessionIdSetsPost(session.id, {
        exercise_id: selectedId,
        set_number: 1,
        set_type: "normal",
        reps: 8,
        rpe: 7,
      });
      navigation.replace("ActiveWorkout", { sessionId: session.id });
    } catch (err) {
      Alert.alert("Error", getApiErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  return (
    <Screen scroll={!pickerOpen}>
      <BackHeader
        title={!pickerOpen && selectedId ? "Exercise Progress" : "Exercise Progress"}
        onBack={() => {
          if (!pickerOpen) {
            setPickerOpen(true);
            setSelectedId(undefined);
          } else {
            navigation.goBack();
          }
        }}
      />

      {pickerOpen ? (
        <View style={{ flex: 1, marginTop: spacing.xl3 }}>
          <ExercisePicker
            variant="browse"
            title="Select Exercise"
            enabled={isAuthenticated}
            trackedOnly
            onSelect={(exercise) => {
              setSelectedId(exercise.id);
              setPickerOpen(false);
            }}
            onNavigate={(id) => {
              setSelectedId(id);
              setPickerOpen(false);
            }}
          />
        </View>
      ) : null}

      <ExercisePicker
        variant="pick"
        visible={comparePickerOpen}
        title="Compare with"
        enabled={isAuthenticated}
        onSelect={(exercise) => {
          setCompareId(exercise.id);
          setComparePickerOpen(false);
        }}
        onClose={() => setComparePickerOpen(false)}
      />

      {selectedId ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.xl3 }}>
          <View style={{ width: 3, height: 28, borderRadius: 2, backgroundColor: accent }} />
          <Text style={{ color: textColor, fontSize: 20, fontWeight: "900", flex: 1 }} numberOfLines={1}>
            {nameForExercise(selectedId, lookup) ?? selectedId}
          </Text>
          {!compareMode ? (
            <Pressable
              onPress={() => setCompareMode(true)}
              style={{
                height: 32,
                borderRadius: radii.tag,
                borderWidth: 1,
                borderColor: `${compareBlue}4D`,
                backgroundColor: `${compareBlue}1F`,
                paddingHorizontal: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xxs,
              }}
            >
              <AppIcon name="layers" size={14} color={compareBlue} />
              <Text style={{ color: compareBlue, fontSize: 10, fontWeight: "700" }}>Compare</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {compareMode && selectedId ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.lg }}>
          {compareId ? (
            <>
              <View style={{ width: 3, height: 20, borderRadius: 2, backgroundColor: compareBlue }} />
              <Text style={{ color: mutedColor, fontSize: 13, flex: 1 }} numberOfLines={1}>
                Comparing with <Text style={{ color: compareBlue, fontWeight: "700" }}>{compareName}</Text>
              </Text>
              <Pressable
                onPress={() => setCompareId(undefined)}
                style={{
                  height: 28,
                  borderRadius: radii.tag,
                  borderWidth: 1,
                  borderColor,
                  paddingHorizontal: spacing.sm,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: mutedColor, fontSize: 9, fontWeight: "600" }}>Change</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ color: mutedColor, fontSize: 13 }}>Compare with:</Text>
              <Pressable
                onPress={() => setComparePickerOpen(true)}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: radii.card,
                  borderWidth: 1,
                  borderColor,
                  paddingHorizontal: spacing.md,
                  justifyContent: "center",
                  backgroundColor: surfaceHover,
                }}
              >
                <Text style={{ color: mutedColor, fontSize: 13 }}>Select exercise...</Text>
              </Pressable>
            </>
          )}
          <Pressable
            onPress={() => {
              setCompareMode(false);
              setCompareId(undefined);
            }}
            style={{
              height: 28,
              borderRadius: radii.tag,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.3)",
              backgroundColor: "rgba(239,68,68,0.12)",
              paddingHorizontal: spacing.sm,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#EF4444", fontSize: 9, fontWeight: "700" }}>Stop</Text>
          </Pressable>
        </View>
      ) : null}

      {selectedId && periods.length > 0 ? (
        <View style={{ height: 32, marginTop: spacing.xl3 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
            {periods.map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={{
                  height: 32,
                  borderRadius: radii.tag,
                  borderWidth: 1,
                  borderColor: period === p ? "rgba(255,90,54,0.4)" : "transparent",
                  backgroundColor: period === p ? "rgba(255,90,54,0.15)" : surfaceHover,
                  paddingHorizontal: spacing.xl2,
                  justifyContent: "center",
                }}
              >
                <Text style={[period === p ? { color: accent } : { color: mutedColor }, { fontSize: 10, fontWeight: "700" }]}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {selectedId && progress.isPending ? (
        <ProgressSkeleton />
      ) : null}

      {selectedId && progress.isSuccess ? (
        <View style={{ marginTop: spacing.xl3, gap: spacing.xl3 }}>
          {(() => {
            const isEmpty = !progress.data;
            const hasMetrics = !isEmpty && (progress.data!.current_e1rm != null || progress.data!.best_e1rm != null);
            const hasCharts = !isEmpty && ((e1rmChartData?.length ?? 0) > 0 || (volumeChartData?.length ?? 0) > 0);
            const hasOverload = !isEmpty && (progress.data!.progressive_overload?.length ?? 0) > 0;
            const hasNoData = isEmpty || (!hasMetrics && !hasCharts && !hasOverload);

            if (hasNoData) {
              return (
                <Card elevated style={{ marginTop: spacing.xl4 }}>
                  <View style={{ alignItems: "center", gap: spacing.xl3, paddingVertical: spacing.xl6, paddingHorizontal: spacing.xl3 }}>
                    <View style={{ width: 56, height: 56, borderRadius: radii.iconWrap, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }}>
                      <AppIcon name="search" size={28} color={faintColor} />
                    </View>
                    <Text style={{ color: textColor, fontSize: 16, fontWeight: "700", textAlign: "center" }}>
                      No data available for this selected exercise
                    </Text>
                    <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>
                      Start tracking this exercise to see your progress over time.
                    </Text>
                    <View style={{ gap: spacing.md, width: "100%", marginTop: spacing.md }}>
                      <Pressable
                        onPress={handleStartWorkout}
                        disabled={starting}
                        style={{
                          width: "100%",
                          backgroundColor: accent,
                          borderRadius: radii.card,
                          paddingVertical: spacing.lg,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: starting ? 0.6 : 1,
                        }}
                      >
                        {starting ? (
                          <ActivityIndicator color="#111" size="small" />
                        ) : (
                          <Text style={{ color: "#111", fontSize: 14, fontWeight: "700" }}>Start a Workout</Text>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => navigation.navigate("TemplateBuilder", { initialExerciseId: selectedId })}
                        style={{
                          width: "100%",
                          borderRadius: radii.card,
                          borderWidth: 1,
                          borderColor: accent,
                          paddingVertical: spacing.lg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: accent, fontSize: 14, fontWeight: "700" }}>Create a Workout</Text>
                      </Pressable>
                    </View>
                  </View>
                </Card>
              );
            }

            return (
              <>
                <View style={{ flexDirection: "row", gap: spacing.lg }}>
                  <CompactStatCard icon="trending-up" label="Current e1RM" value={progress.data!.current_e1rm != null ? `${Math.round(progress.data!.current_e1rm)} kg` : "-"} color={accent} />
                  <CompactStatCard icon="gauge" label="Best e1RM" value={progress.data!.best_e1rm != null ? `${Math.round(progress.data!.best_e1rm)} kg` : "-"} color={goldColor} />
                </View>

                {(e1rmChartData?.length ?? 0) > 0 ? (
                  <Card elevated>
                    <SectionEyebrow>e1RM History</SectionEyebrow>
                    <View style={{ marginTop: spacing.xl }}>
                      <TrendChart segments={[e1rmChartData!]} height={120} color={accent} series={chartSeries} />
                    </View>
                  </Card>
                ) : null}

                {(volumeChartData?.length ?? 0) > 0 ? (
                  <Card elevated>
                    <SectionEyebrow>Weekly Volume</SectionEyebrow>
                    <View style={{ marginTop: spacing.xl }}>
                      <VerticalBars data={volumeChartData!} barColor={accent} />
                    </View>
                  </Card>
                ) : null}

                {(progress.data!.progressive_overload?.length ?? 0) > 0 ? (
                  <View>
                    <SectionEyebrow>Progressive Overload</SectionEyebrow>
                    <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
                      {progress.data!.progressive_overload.map((entry, i) => (
                        <Card key={i} elevated>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <View>
                              <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>{entry.current_best_weight_kg ?? "-"} kg × {entry.current_best_reps ?? "-"} reps</Text>
                              <Text style={{ color: "rgba(255,255,255,0.34)", fontSize: 10 }}>{formatShortDate(entry.performed_at)}</Text>
                            </View>
                            <AppIcon name="trophy" size={18} color={goldColor} />
                          </View>
                        </Card>
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            );
          })()}
        </View>
      ) : null}

      {progress.isError ? <ErrorCard error={progress.error} onRetry={() => progress.refetch()} /> : null}

      {!selectedId ? (
        <Card elevated style={{ marginTop: spacing.xl3 }}>
          <View style={{ alignItems: "center", gap: spacing.xl, paddingVertical: spacing.xl4 }}>
            <View style={{ width: 48, height: 48, borderRadius: radii.iconWrap, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="search" size={24} color={faintColor} />
            </View>
            <Text style={[{ color: textColor, fontSize: 15, fontWeight: "700" }]}>Select an exercise</Text>
            <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>Choose an exercise above to view its progress.</Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
