import { useEffect } from "react";
import { Pressable, Text, View, ActivityIndicator, FlatList } from "react-native";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, TabParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { displayName, initialsFor, workoutTitle } from "../utils/display";
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

export function HomeScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
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
  const daysCount = daysToShow.length;
  const workoutDaysCount = daysToShow.reduce((sum, d) => sum + d.value, 0);

  useEffect(() => {
    if (data && !data.has_profile) navigation.navigate("ProfileSetup");
  }, [data, navigation]);

  if (overview.isPending) {
    return (
      <Screen>
        <LoadingCard label="Loading your dashboard..." />
      </Screen>
    );
  }

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
          <Text style={[{ color: textColor, fontSize: 11, fontWeight: "700" }, { color: accent }]}>
            {workoutDaysCount} / {daysCount} days
          </Text>
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
        <FlatList
          data={CARDIO_ACTIVITIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md }}
          keyExtractor={(item) => item.type}
          renderItem={({ item }: { item: CardioActivity }) => (
            <Pressable
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
                  <Text style={{ fontSize: 20 }}>{iconForActivity(item.type)}</Text>
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
          )}
        />
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

      <PrimaryButton
        label="Start Workout"
        onPress={() => navigation.navigate({ name: "StartWorkout", params: {} })}
        icon={<AppIcon name="plus" size={20} color="#000000" />}
        style={{ marginBottom: spacing.xl4 }}
      />
    </Screen>
  );
}
