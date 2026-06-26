import { useEffect } from "react";
import { Pressable, Text, View, ActivityIndicator, FlatList } from "react-native";
import { useAuth } from "@clerk/expo";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, TabParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { displayName, initialsFor, workoutTitle } from "../utils/display";
import { formatShortDate, formatTimeLabel, formatVolume } from "../utils/format";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS, SHADOWS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Tag } from "../components/ui/Indicators";
import { PrimaryButton, RoundButton, IconButton } from "../components/ui/Button";
import { StatPill, DividerVertical, MetricBlock } from "../components/ui/Stats";
import { VerticalBars } from "../components/ui/Charts";
import { Icon } from "../components/ui/Icon";
import { CARDIO_ACTIVITIES, iconForActivity, type CardioActivity } from "../utils/cardio";

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, "Home">,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

export function HomeScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
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
  const daysToShow = weeklyData.slice(startIndex, todayDataIndex + 1);
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
      <View style={[styles.mainHeader, { paddingBottom: SPACING.xl }]}>
        <Pressable style={styles.homeIdentity} onPress={() => navigation.navigate("Profile")}>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarInitials}>{initialsFor(name)}</Text>
          </View>
          <View>
            <Text style={styles.kickerText}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
            <Text style={styles.greetingText}>Hey, {name.split(" ")[0]}</Text>
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
        style={{ marginBottom: SPACING.xl2 }}
      >
        <Card elevated accent="coral">
          <View style={[styles.rowBetween, { gap: SPACING.xl }]}>
            <View style={styles.rowGap}>
              <View
                style={[
                  styles.bannerIcon,
                  { backgroundColor: "rgba(255,90,54,0.2)", width: 36, height: 36, borderRadius: RADIUS.iconWrap },
                ]}
              >
                <Icon name="trending-up" size={16} color={COLORS.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>
                  {activeMeso ? "Active Mesocycle" : "No Active Mesocycle"}
                </Text>
                <Text style={styles.cardTitle}>
                  {activeMeso
                    ? `${activeMeso.name}${activeMeso.weeks ? ` - ${activeMeso.weeks} weeks` : ""}`
                    : "Plan a training block"}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={16} color={COLORS.faint} />
          </View>
        </Card>
      </Pressable>

      <Card elevated style={{ marginBottom: SPACING.xl2 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionCardTitle}>This Week</Text>
          <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>
            {workoutDaysCount} / {daysCount} days
          </Text>
        </View>
        <View style={{ marginTop: SPACING.xl3 }}>
          <VerticalBars data={daysToShow} />
        </View>
        <View style={[styles.statRowDivider, { marginVertical: SPACING.xl3 }]} />
        <View style={styles.threeUp}>
          <StatPill icon="flame" label="Day Streak" value={String(data?.workout_streaks.current_daily_streak ?? 0)} color={COLORS.orange} />
          <DividerVertical />
          <StatPill icon="dumbbell" label="Workouts" value={String(data?.stats.completed_sessions ?? 0)} color={COLORS.teal} />
          <DividerVertical />
          <StatPill icon="trending-up" label="Templates" value={String(data?.stats.total_workout_templates ?? 0)} color={COLORS.green} />
        </View>
      </Card>

      <Pressable onPress={() => navigation.navigate("BodyweightHistory")} style={{ marginBottom: SPACING.xl2 }}>
        <Card elevated>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={[styles.softIconWrap, { backgroundColor: COLORS.cardSoft }]}>
                <Icon name="weight" size={16} color={COLORS.teal} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Latest Bodyweight</Text>
                <View style={styles.rowGapSmall}>
                  <Text style={styles.heroMetric}>
                    {latestWeight ? latestWeight.weight_kg.toFixed(1) : "-"}
                  </Text>
                  <Text style={styles.metricSuffix}>kg</Text>
                  {latestWeight ? (
                    <Text style={[styles.metricChange, { color: COLORS.green }]}>
                      {formatShortDate(latestWeight.logged_at)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
            <Icon name="chevron-right" size={16} color={COLORS.faint} />
          </View>
        </Card>
      </Pressable>

      <View style={{ marginBottom: SPACING.xl2 }}>
        <View style={[styles.sectionHeadingRow, { marginBottom: SPACING.lg }]}>
          <Text style={styles.sectionCardTitle}>Quick Cardio</Text>
        </View>
        <FlatList
          data={CARDIO_ACTIVITIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: SPACING.md }}
          keyExtractor={(item) => item.type}
          renderItem={({ item }: { item: CardioActivity }) => (
            <Pressable
              onPress={() => navigation.navigate("QuickCardio", { activityType: item.type })}
            >
              <View
                style={{
                  width: 80,
                  height: 100,
                  backgroundColor: COLORS.cardElevated,
                  borderRadius: RADIUS.card,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: SPACING.sm,
                  borderWidth: 1,
                  borderColor: COLORS.border,
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
                    color: COLORS.text,
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

      <View style={{ marginBottom: SPACING.xl2 }}>
        <View style={[styles.sectionHeadingRow, { marginBottom: SPACING.lg }]}>
          <Text style={styles.sectionCardTitle}>Last Workout</Text>
          <Pressable
            style={styles.rowGapTiny}
            onPress={() => navigation.navigate("WorkoutHistory")}
          >
            <Text style={styles.linkText}>See All</Text>
            <Icon name="chevron-right" size={12} color={COLORS.teal} />
          </Pressable>
        </View>
        <Pressable
          onPress={() =>
            latestSession &&
            navigation.navigate("SessionDetail", { id: String(latestSession.id) })
          }
        >
          <Card elevated>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {latestSession
                    ? workoutTitle(latestSession)
                    : "No completed workouts yet"}
                </Text>
                <Text style={styles.detailLabel}>
                  {latestSession
                    ? `${formatShortDate(latestSession.started_at)} - ${formatTimeLabel(latestSession.started_at)}`
                    : "Start a workout to build history"}
                </Text>
              </View>
              {latestSession ? <Tag label="Done" color={COLORS.teal} /> : null}
            </View>
            {latestSession ? (
              <View style={[styles.rowGapLarge, { marginTop: SPACING.xl2 }]}>
                {latestSession.duration_minutes ? (
                  <MetricBlock
                    icon="clock"
                    value={`${latestSession.duration_minutes} min`}
                    label="Duration"
                    color={COLORS.muted}
                  />
                ) : null}
                {latestSession.total_sets ? (
                  <MetricBlock
                    icon="list-checks"
                    value={`${latestSession.total_sets} sets`}
                    label="Sets"
                    color={COLORS.muted}
                  />
                ) : null}
                {latestSession.total_volume ? (
                  <MetricBlock
                    icon="gauge"
                    value={formatVolume(latestSession.total_volume)}
                    label="Volume"
                    color={COLORS.muted}
                  />
                ) : null}
                {!latestSession.duration_minutes && !latestSession.total_sets && !latestSession.total_volume ? (
                  <Text style={styles.detailLabel}>
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
        icon={<Icon name="plus" size={20} color="#000000" />}
        style={{ marginBottom: SPACING.xl4 }}
      />
    </Screen>
  );
}
