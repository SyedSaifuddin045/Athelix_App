import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, Text, View, ScrollView } from "react-native";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, TabParamList } from "../types/navigation";
import { useOverviewQuery, useExercisesQuery } from "../api/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { listWorkoutSessionsWorkoutSessionsGet } from "../api/endpoints/workout-sessions/workout-sessions";
import { displayName, initialsFor, workoutTitle, nameForExercise } from "../utils/display";
import { exerciseLookup } from "../utils/mapping";
import { formatShortDate, formatTimeLabel, formatVolume } from "../utils/format";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Screen } from "../components/ui/Layout";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Tag } from "../components/ui/Indicators";
import { PrimaryButton, RoundButton, IconButton } from "../components/ui/Button";
import { StatPill, DividerVertical, MetricBlock } from "../components/ui/Stats";
import { VerticalBars } from "../components/ui/Charts";
import { AppIcon } from "../design-system/icons/AppIcon";
import type { IconName } from "../components/ui/Icon";
import { CARDIO_ACTIVITIES, iconForActivity, type CardioActivity } from "../utils/cardio";

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, "Home">,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

const SKELETON_COLOR = "rgba(255,255,255,0.1)";

function HomeScreenSkeleton() {
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

  const B = ({ w, h, r = 8 }: { w?: number | string; h: number; r?: number }) => (
    <Animated.View style={{ opacity, width: w as any, height: h, borderRadius: r, backgroundColor: SKELETON_COLOR }} />
  );

  return (
    <View style={{ gap: spacing.xl2 }}>
      {/* Header skeleton */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <B w={40} h={40} r={20} />
          <View style={{ gap: 4 }}>
            <B w={90} h={9} />
            <B w={120} h={14} />
          </View>
        </View>
        <B w={40} h={40} r={20} />
      </View>

      {/* Mesocycle card skeleton */}
      <View style={{ backgroundColor: SKELETON_COLOR, borderRadius: radii.modal, padding: spacing.xl3, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <B w={36} h={36} r={10} />
          <View style={{ gap: 6, flex: 1 }}>
            <B w={100} h={10} />
            <B w={160} h={14} />
          </View>
        </View>
      </View>

      {/* This Week card skeleton */}
      <View style={{ backgroundColor: SKELETON_COLOR, borderRadius: radii.modal, padding: spacing.xl3, gap: spacing.xl3 }}>
        <B w={80} h={13} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.xs }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <B w={20} h={14} />
              <B w={22} h={40} r={6} />
              <B w={24} h={8} />
            </View>
          ))}
        </View>
        <B h={1} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ alignItems: "center", gap: 4, flex: 1 }}>
            <B w={14} h={14} r={7} />
            <B w={28} h={10} />
            <B w={50} h={9} />
          </View>
          <B w={1} h={32} />
          <View style={{ alignItems: "center", gap: 4, flex: 1 }}>
            <B w={14} h={14} r={7} />
            <B w={28} h={10} />
            <B w={50} h={9} />
          </View>
          <B w={1} h={32} />
          <View style={{ alignItems: "center", gap: 4, flex: 1 }}>
            <B w={14} h={14} r={7} />
            <B w={28} h={10} />
            <B w={50} h={9} />
          </View>
        </View>
      </View>

      {/* Bodyweight card skeleton */}
      <View style={{ backgroundColor: SKELETON_COLOR, borderRadius: radii.modal, padding: spacing.xl3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <B w={34} h={34} r={10} />
          <View style={{ gap: 4, flex: 1 }}>
            <B w={100} h={9} />
            <B w={60} h={18} />
          </View>
        </View>
      </View>

      {/* Quick Cardio skeleton */}
      <View style={{ gap: spacing.lg }}>
        <B w={80} h={13} />
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ width: 80, height: 100, backgroundColor: SKELETON_COLOR, borderRadius: radii.card, alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
              <B w={40} h={40} r={20} />
              <B w={50} h={10} />
            </View>
          ))}
        </View>
      </View>

      {/* Last Workout card skeleton */}
      <View style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <B w={90} h={13} />
          <B w={50} h={12} />
        </View>
        <View style={{ backgroundColor: SKELETON_COLOR, borderRadius: radii.modal, padding: spacing.xl3, gap: spacing.md }}>
          <B w="60%" h={15} />
          <B w="40%" h={10} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <B w={60} h={12} />
            <B w={50} h={12} />
            <B w={55} h={12} />
          </View>
        </View>
      </View>

      {/* Start Workout button skeleton */}
      <B w="100%" h={52} r={radii.modal} />
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const exercisesQuery = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(exercisesQuery.data?.items), [exercisesQuery.data?.items]);
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface1Color = theme.surface1?.get() ?? "rgba(255,255,255,0.04)";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const surface3Color = theme.surface3?.get() ?? "rgba(255,255,255,0.07)";
  const overview = useOverviewQuery(isAuthenticated);
  const data = overview.data;
  const name = displayName(data?.user, data?.profile);
  const latestSession = data?.latest_completed_session;
  const latestWeight = data?.latest_body_weight_log;
  const activeMeso = data?.active_mesocycle;
  const weeklyData = data?.weekly_activity ?? [];
  const todayGetDay = new Date().getDay();
  const todayDataIndex = todayGetDay === 0 ? 6 : todayGetDay - 1;
  const startIndex = Math.max(0, todayDataIndex - 4);
  const daysToShow = weeklyData.slice(startIndex, todayDataIndex + 1).map((day) => ({
    label: day.day.slice(0, 3),
    value: day.value,
  }));

  useEffect(() => {
    if (data && !data.has_profile) navigation.navigate("ProfileSetup");
  }, [data, navigation]);

  // Pre-fetch workout sessions for faster WorkoutHistory navigation
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isAuthenticated) return;
    queryClient.prefetchQuery({
      queryKey: queryKeys.sessions(),
      queryFn: async () => (await listWorkoutSessionsWorkoutSessionsGet()).data,
      staleTime: 30_000,
    });
  }, [isAuthenticated, queryClient]);

  if (overview.isError) {
    return (
      <Screen>
        <ErrorCard error={overview.error} onRetry={() => overview.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }, { paddingBottom: spacing.xl }]}>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 12 }} onPress={() => navigation.navigate("Profile")}>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.28, shadowRadius: 16,               shadowOffset: { width: 0, height: 0 }, elevation: 8 }}>
            <Text style={{ color: "#000000", fontSize: 14, fontWeight: "800" }}>{initialsFor(name)}</Text>
          </View>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
            <Text style={{ color: textColor, fontSize: 15, fontWeight: "700", marginTop: 2 }}>Hey, {name.split(" ")[0]}</Text>
          </View>
        </Pressable>
        <IconButton icon="bell" size={40} />
      </View>

      {overview.isPending ? (
        <HomeScreenSkeleton />
      ) : (
        <>
        <Pressable
        onPress={() =>
          activeMeso
            ? navigation.navigate("MesocycleDetail", { id: String(activeMeso.id) })
            : navigation.navigate("MesocycleList")
        }
        style={{ marginBottom: spacing.xl2 }}
      >
        <Card elevated accent="coral" animate>
          <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, { gap: spacing.xl }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radii.iconWrap,
                  backgroundColor: "rgba(255,90,54,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name="trending-up" size={16} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ color: textColor, fontSize: 11, fontWeight: "700" }, { color: accent }]}>
                  {activeMeso ? "Active Mesocycle" : "No Active Mesocycle"}
                </Text>
                <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>
                  {activeMeso
                    ? `${activeMeso.name}${activeMeso.weeks ? ` - ${activeMeso.weeks} weeks` : ""}`
                    : "Plan a training block"}
                </Text>
              </View>
            </View>
            <AppIcon name="chevron-right" size={16} color={faintColor} />
          </View>
        </Card>
      </Pressable>

      <Card elevated style={{ marginBottom: spacing.xl2 }} animate animationDelay={100}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>This Week</Text>
        </View>
        <View style={{ marginTop: spacing.xl3 }}>
          <VerticalBars data={daysToShow} />
        </View>
        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: spacing.xl3 }} />
        <View style={{ flexDirection: "row", alignItems: "stretch", justifyContent: "space-between" }}>
          <StatPill icon="flame" label="Day Streak" value={String(data?.workout_streaks.current_daily_streak ?? 0)} color={theme.colorOrange?.get()} />
          <DividerVertical />
          <StatPill icon="dumbbell" label="Workouts" value={String(data?.stats.completed_sessions ?? 0)} color={accent} />
          <DividerVertical />
          <StatPill icon="trending-up" label="Templates" value={String(data?.stats.total_workout_templates ?? 0)} color={theme.colorGreen?.get()} />
        </View>
      </Card>

      <Pressable onPress={() => navigation.navigate("BodyweightHistory")} style={{ marginBottom: spacing.xl2 }}>
        <Card elevated animate animationDelay={300}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: radii.iconWrap, alignItems: "center", justifyContent: "center", backgroundColor: surface2Color }}>
                <AppIcon name="weight" size={16} color={accent} />
              </View>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16 }}>Latest Bodyweight</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                  <Text style={{ color: textColor, fontSize: 20, fontWeight: "800" }}>
                    {latestWeight ? latestWeight.weight_kg.toFixed(1) : "-"}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>kg</Text>
                  {latestWeight ? (
                    <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colorGreen?.get() }}>
                      {formatShortDate(latestWeight.logged_at)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
            <AppIcon name="chevron-right" size={16} color={faintColor} />
          </View>
        </Card>
      </Pressable>

      <View style={{ marginBottom: spacing.xl2 }}>
        <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, { marginBottom: spacing.lg }]}>
          <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>Quick Cardio</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md }}
        >
          {CARDIO_ACTIVITIES.map((item: CardioActivity) => (
            <Pressable
              key={item.type}
              onPress={() => navigation.navigate("QuickCardio", { activityType: item.type })}
            >
              <View
                style={{
                  width: 80,
                  height: 100,
                  backgroundColor: surface3Color,
                  borderRadius: radii.card,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  borderWidth: 1,
                  borderColor: borderColor,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: item.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon name={iconForActivity(item.type)} size={20} color={textColor} />
                </View>
                <Text
                  style={{
                    color: textColor,
                    fontSize: 12,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginBottom: spacing.xl2 }}>
        <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, { marginBottom: spacing.lg }]}>
          <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>Last Workout</Text>
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            onPress={() => navigation.navigate("WorkoutHistory")}
          >
            <Text style={{ color: accent, fontSize: 12, fontWeight: "600" }}>See All</Text>
            <AppIcon name="chevron-right" size={12} color={accent} />
          </Pressable>
        </View>
        <Pressable
          onPress={() =>
            latestSession &&
            navigation.navigate("SessionDetail", { id: String(latestSession.id) })
          }
        >
          <Card elevated animate animationDelay={200}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>
                  {latestSession
                    ? workoutTitle(latestSession)
                    : "No completed workouts yet"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16 }}>
                  {latestSession
                    ? `${formatShortDate(latestSession.started_at)} - ${formatTimeLabel(latestSession.started_at)}`
                    : "Start a workout to build history"}
                </Text>
              </View>
              {latestSession ? <Tag label="Done" color={accent} /> : null}
            </View>
            {latestSession ? (
              <View style={[{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }, { marginTop: spacing.xl2 }]}>
                {latestSession.duration_minutes ? (
                  <MetricBlock
                    icon="clock"
                    value={`${latestSession.duration_minutes} min`}
                    label="Duration"
                    color={mutedColor}
                  />
                ) : null}
                {latestSession.total_sets ? (
                  <MetricBlock
                    icon="list-checks"
                    value={`${latestSession.total_sets} sets`}
                    label="Sets"
                    color={mutedColor}
                  />
                ) : null}
                {latestSession.total_volume ? (
                  <MetricBlock
                    icon="gauge"
                    value={formatVolume(latestSession.total_volume)}
                    label="Volume"
                    color={mutedColor}
                  />
                ) : null}
                {!latestSession.duration_minutes && !latestSession.total_sets && !latestSession.total_volume ? (
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16 }}>
                    Tap to view full workout details
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card>
        </Pressable>
      </View>

      {data?.recent_personal_records && data.recent_personal_records.length > 0 ? (
        <View style={{ marginBottom: spacing.xl2 }}>
          <Text style={{ color: textColor, fontSize: 13, fontWeight: "700", marginBottom: spacing.lg }}>
            Recent PRs
          </Text>
          {data.recent_personal_records.map((pr) => (
            <View key={pr.id} style={{ marginBottom: spacing.md }}>
              <Card elevated>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: textColor, fontSize: 14, fontWeight: "700" }} numberOfLines={1}>{nameForExercise(pr.exercise_id, lookup) ?? pr.exercise_id}</Text>
                  </View>
                  <Text style={{ flexShrink: 0, color: accent, fontSize: 12, fontWeight: "700", marginLeft: 8 }}>
                    {pr.record_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} +{pr.value}
                  </Text>
                </View>
              </Card>
            </View>
          ))}
        </View>
      ) : null}

      <PrimaryButton
        label="Start Workout"
        onPress={() => navigation.navigate({ name: "StartWorkout", params: {} })}
        icon={<AppIcon name="plus" size={20} color="#000000" />}
        style={{ marginBottom: spacing.xl4 }}
      />
      </>
      )}
    </Screen>
  );
}
