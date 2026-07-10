import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { usePressOpacity } from "../utils/usePressOpacity";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, TabParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { listWorkoutSessionsWorkoutSessionsGet } from "../api/endpoints/workout-sessions/workout-sessions";
import { displayName, initialsFor } from "../utils/display";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Screen } from "../components/ui/Layout";
import { Card, ErrorCard } from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/Button";
import { NotificationBell } from "../components/NotificationBell";
import { StatPill, DividerVertical } from "../components/ui/Stats";
import { VerticalBars } from "../components/ui/Charts";
import { AppIcon } from "../design-system/icons/AppIcon";

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

      {/* Start Workout button skeleton */}
      <B w="100%" h={52} r={radii.modal} />
    </View>
  );
}

function formatRelativeTime(ts?: number): string | null {
  if (!ts) return null;
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function HomeScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const overview = useOverviewQuery(isAuthenticated);
  const data = overview.data;
  const name = displayName(data?.user, data?.profile);
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
  const overviewState = queryClient.getQueryState(queryKeys.overview);
  const lastUpdatedLabel = formatRelativeTime(overviewState?.dataUpdatedAt);
  useEffect(() => {
    if (!isAuthenticated) return;
    queryClient.prefetchQuery({
      queryKey: queryKeys.sessions(),
      queryFn: async () => (await listWorkoutSessionsWorkoutSessionsGet()).data,
      staleTime: 30_000,
    });
  }, [isAuthenticated, queryClient]);

  const mesoPress = usePressOpacity();
  const mesoLabel = activeMeso
    ? `Mesocycle status: ${activeMeso.name}, week ${Math.min(
        Math.floor((Date.now() - new Date(activeMeso.started_on).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
        activeMeso.weeks ?? 1,
      )} of ${activeMeso.weeks ?? "?"}`
    : "No active mesocycle";
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [dismissedOverviewError, setDismissedOverviewError] = useState(false);
  const [showMesoInfo, setShowMesoInfo] = useState(false);
  const [showTemplatesInfo, setShowTemplatesInfo] = useState(false);
  const [showVolumeInfo, setShowVolumeInfo] = useState(false);

  // Reset startingWorkout when screen regains focus (covers back-navigation or failed navigation)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setStartingWorkout(false);
    });
    return unsubscribe;
  }, [navigation]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={accent}
    />
  );

  if (overview.isError && !dismissedOverviewError) {
    return (
      <Screen refreshControl={refreshControl}>
        <ErrorCard
          error={overview.error}
          onRetry={() => overview.refetch()}
          onDismiss={() => setDismissedOverviewError(true)}
        />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={refreshControl}>
      <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }, { paddingBottom: spacing.xl }]}>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 12 }} onPress={() => navigation.navigate("Profile")} accessibilityLabel="Profile" accessibilityRole="button">
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.28, shadowRadius: 16,               shadowOffset: { width: 0, height: 0 }, elevation: 8 }}>
            <Text style={{ color: "#000000", fontSize: 14, fontWeight: "800" }}>{initialsFor(name)}</Text>
          </View>
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </Text>
              {lastUpdatedLabel ? (
                <Text style={{ color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)", fontSize: 10, opacity: 0.55 }}>
                  Updated {lastUpdatedLabel}
                </Text>
              ) : null}
            </View>
            <Text style={{ color: textColor, fontSize: 15, fontWeight: "700", marginTop: 2 }}>Hey, {name.split(" ")[0]}</Text>
          </View>
        </Pressable>
        <View accessible accessibilityLabel="Notifications" accessibilityRole="button">
          <NotificationBell onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)} />
        </View>
      </View>

      {overview.isPending ? (
        <HomeScreenSkeleton />
      ) : (
        <>
        {overview.isError ? (
        <ErrorCard
          error={overview.error}
          onRetry={() => overview.refetch()}
          compact
          onDismiss={() => setDismissedOverviewError(true)}
        />
        ) : (
        <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          activeMeso
            ? navigation.navigate("MesocycleDetail", { id: String(activeMeso.id) })
            : navigation.navigate("MesocycleList");
        }}
        onPressIn={mesoPress.onPressIn}
        onPressOut={mesoPress.onPressOut}
        style={{ marginBottom: spacing.xl2 }}
        accessibilityLabel={mesoLabel}
        accessibilityRole="button"
      >
        <Animated.View style={{ opacity: mesoPress.opacity }}>
        <Card
          elevated
          animate
          accent={activeMeso ? "coral" : "none"}
          style={
            !activeMeso
              ? {
                  borderStyle: "dashed",
                  borderColor: theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)",
                  borderWidth: 1.5,
                }
              : undefined
          }
        >
          <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, { gap: spacing.xl }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radii.iconWrap,
                  backgroundColor: activeMeso ? "rgba(255,90,54,0.2)" : "rgba(255,90,54,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name={activeMeso ? "trending-up" : "layers"} size={16} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[{ color: textColor, fontSize: 11, fontWeight: "700" }, { color: accent }]}>
                    {activeMeso ? "Active Mesocycle" : "Ready to start?"}
                  </Text>
                  <Pressable
                    onPress={() => setShowMesoInfo((v) => !v)}
                    hitSlop={6}
                    style={{ padding: 2 }}
                  >
                    <Text style={{ fontSize: 12, color: faintColor }}>ℹ️</Text>
                  </Pressable>
                </View>
                {showMesoInfo && (
                  <>
                    <Pressable
                      style={StyleSheet.absoluteFill}
                      onPress={() => setShowMesoInfo(false)}
                    />
                    <View
                      style={{
                        position: "absolute",
                        top: 20,
                        left: 0,
                        right: 0,
                        backgroundColor: theme.surface1?.get() ?? "rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        padding: 8,
                        marginTop: 2,
                        zIndex: 10,
                      }}
                    >
                      <Text style={{ color: faintColor, fontSize: 11, lineHeight: 16 }}>
                        Your current training phase — a planned block of focused progress.
                      </Text>
                    </View>
                  </>
                )}
                <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>
                  {activeMeso
                    ? `${activeMeso.name}${activeMeso.weeks ? ` - ${activeMeso.weeks} weeks` : ""}`
                    : "Set up your first mesocycle to begin tracking progress"}
                </Text>
              </View>
            </View>
            <AppIcon name="chevron-right" size={16} color={faintColor} />
          </View>
        </Card>
        </Animated.View>
      </Pressable>
      )}

      <PrimaryButton
        label="Start Workout"
        onPress={() => {
          if (startingWorkout) return;
          setStartingWorkout(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate({ name: "StartWorkout", params: {} });
        }}
        loading={startingWorkout}
        icon={<AppIcon name="plus" size={20} color="#000000" />}
        style={{ marginBottom: spacing.xl2 }}
        accessibilityLabel="Start workout"
        accessibilityRole="button"
      />

      <View accessible accessibilityRole="summary" style={{ marginBottom: spacing.xl2 }}>
      <Card elevated animate animationDelay={100}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>This Week</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm }}>
          <Text style={{ color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Volume</Text>
          <Pressable
            onPress={() => setShowVolumeInfo((v) => !v)}
            hitSlop={6}
            style={{ padding: 2 }}
          >
            <Text style={{ fontSize: 10, color: faintColor }}>ℹ️</Text>
          </Pressable>
          {showVolumeInfo && (
            <>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setShowVolumeInfo(false)}
              />
              <View
                style={{
                  position: "absolute",
                  top: 18,
                  left: 0,
                  right: 0,
                  backgroundColor: theme.surface1?.get() ?? "rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  padding: 8,
                  zIndex: 10,
                }}
              >
                <Text style={{ color: faintColor, fontSize: 11, lineHeight: 16 }}>
                  Total sets completed this week.
                </Text>
              </View>
            </>
          )}
        </View>
        <View style={{ marginTop: spacing.xs }}>
          {daysToShow.every((d) => d.value === 0) ? (
            <View style={{ alignItems: "center", paddingVertical: spacing.xl2 }}>
              <Text style={{ color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)", fontSize: 12, textAlign: "center" }}>
                No activity yet — start your first workout
              </Text>
            </View>
          ) : (
            <VerticalBars data={daysToShow} activeIndex={daysToShow.length - 1} goalValue={1000} />
          )}
        </View>
        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: spacing.xl3 }} />
        <View style={{ flexDirection: "row", alignItems: "stretch", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }} accessible accessibilityLabel={`Day streak: ${data?.workout_streaks.current_daily_streak ?? 0}`}>
            <StatPill icon="flame" label="Day Streak" value={String(data?.workout_streaks.current_daily_streak ?? 0)} color={theme.colorOrange?.get()} />
          </View>
          <DividerVertical />
          <View style={{ flex: 1 }} accessible accessibilityLabel={`Workouts: ${data?.stats.completed_sessions ?? 0}`}>
            <StatPill icon="dumbbell" label="Workouts" value={String(data?.stats.completed_sessions ?? 0)} color={accent} />
          </View>
          <DividerVertical />
          <View style={{ flex: 1 }} accessible accessibilityLabel={`Templates: ${data?.stats.total_workout_templates ?? 0}`}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 }}>
              <StatPill icon="trending-up" label="Templates" value={String(data?.stats.total_workout_templates ?? 0)} color={theme.colorGreen?.get()} />
              <Pressable
                onPress={() => setShowTemplatesInfo((v) => !v)}
                hitSlop={6}
                style={{ padding: 2, alignSelf: "flex-start", marginTop: 2 }}
              >
                <Text style={{ fontSize: 10, color: faintColor }}>ℹ️</Text>
              </Pressable>
            </View>
            {showTemplatesInfo && (
              <>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setShowTemplatesInfo(false)}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 40,
                    right: 0,
                    backgroundColor: theme.surface1?.get() ?? "rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    padding: 8,
                    zIndex: 10,
                  }}
                >
                  <Text style={{ color: faintColor, fontSize: 11, lineHeight: 16 }}>
                    Saved workout routines you can repeat.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Card>
      </View>

      </>
      )}
    </Screen>
  );
}
