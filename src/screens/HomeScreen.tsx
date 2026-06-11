import { useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, TabParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { displayName, initialsFor, exerciseEmoji, workoutTitle } from "../utils/display";
import { formatShortDate, formatTimeLabel, formatVolume } from "../utils/format";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Tag } from "../components/ui/Indicators";
import { PrimaryButton, RoundButton } from "../components/ui/Button";
import { StatPill, DividerVertical, MetricBlock } from "../components/ui/Stats";
import { VerticalBars } from "../components/ui/Charts";

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
      <View style={styles.mainHeader}>
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
        <RoundButton>
          <Ionicons name="notifications-outline" size={16} color="rgba(255,255,255,0.7)" />
          <View style={styles.notificationDot} />
        </RoundButton>
      </View>

      <Pressable
        onPress={() => (activeMeso ? navigation.navigate("MesocycleDetail", { id: String(activeMeso.id) }) : navigation.navigate("MesocycleList"))}
        style={styles.inlineSection}
      >
        <Card style={{ borderColor: "rgba(255,90,54,0.22)", backgroundColor: "rgba(255,90,54,0.1)" }}>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={styles.bannerIcon}>
                <Feather name="trending-up" size={15} color={COLORS.teal} />
              </View>
              <View>
                <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>{activeMeso ? "Active Mesocycle" : "No Active Mesocycle"}</Text>
                <Text style={styles.cardTitle}>
                  {activeMeso ? `${activeMeso.name}${activeMeso.weeks ? ` - ${activeMeso.weeks} weeks` : ""}` : "Plan a training block"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.35)" />
          </View>
        </Card>
      </Pressable>

      <Card style={styles.inlineSection}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionCardTitle}>This Week</Text>
          <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>
            {workoutDaysCount} / {daysCount} days
          </Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <VerticalBars
            data={daysToShow.map((item, index) => ({
              day: item.day,
              value: item.value,
              highlight: index === daysToShow.length - 1 && item.value === 1,
            }))}
          />
        </View>
        <View style={styles.statRowDivider} />
        <View style={styles.threeUp}>
          <StatPill
            icon={<MaterialCommunityIcons name="fire" size={12} color="#f97316" />}
            label="Day Streak"
            value={String(data?.workout_streaks.current_daily_streak ?? 0)}
          />
          <DividerVertical />
          <StatPill
            icon={<MaterialCommunityIcons name="dumbbell" size={12} color={COLORS.teal} />}
            label="Workouts"
            value={String(data?.stats.completed_sessions ?? 0)}
          />
          <DividerVertical />
          <StatPill
            icon={<Feather name="trending-up" size={12} color={COLORS.green} />}
            label="Templates"
            value={String(data?.stats.total_workout_templates ?? 0)}
          />
        </View>
      </Card>

      <Pressable onPress={() => navigation.navigate("BodyweightHistory")} style={styles.inlineSection}>
        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={styles.softIconWrap}>
                <MaterialCommunityIcons name="scale-bathroom" size={16} color={COLORS.teal} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Latest Bodyweight</Text>
                <View style={styles.rowGapSmall}>
                  <Text style={styles.heroMetric}>{latestWeight ? latestWeight.weight_kg.toFixed(1) : "-"}</Text>
                  <Text style={styles.metricSuffix}>kg</Text>
                  {latestWeight ? <Text style={[styles.metricChange, { color: COLORS.green }]}>{formatShortDate(latestWeight.logged_at)}</Text> : null}
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
          </View>
        </Card>
      </Pressable>

      <View style={styles.inlineSection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionCardTitle}>Last Workout</Text>
          <Pressable style={styles.rowGapTiny} onPress={() => navigation.navigate("WorkoutHistory")}>
            <Text style={styles.linkText}>See All</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.teal} />
          </Pressable>
        </View>
        <Pressable onPress={() => latestSession && navigation.navigate("SessionDetail", { id: String(latestSession.id) })}>
          <Card>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.cardTitle}>{latestSession ? workoutTitle(latestSession) : "No completed workouts yet"}</Text>
                <Text style={styles.detailLabel}>
                  {latestSession ? `${formatShortDate(latestSession.started_at)} - ${formatTimeLabel(latestSession.started_at)}` : "Start a workout to build history"}
                </Text>
              </View>
              {latestSession ? <Tag label="Done" color={COLORS.teal} /> : null}
            </View>
            <View style={[styles.rowGapLarge, { marginTop: 14 }]}>
              <MetricBlock value={`${latestSession?.duration_minutes ?? 0} min`} label="Duration" />
              <MetricBlock value={`${latestSession?.total_sets ?? 0} sets`} label="Sets" />
              <MetricBlock value={formatVolume(latestSession?.total_volume)} label="Volume" />
            </View>
          </Card>
        </Pressable>
      </View>

      <View style={styles.inlineSection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionCardTitle}>Recent PRs</Text>
          <Pressable style={styles.rowGapTiny} onPress={() => navigation.navigate("PersonalRecords")}>
            <Text style={styles.linkText}>All PRs</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.teal} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {(data?.recent_personal_records.length ? data.recent_personal_records : []).map((item) => (
            <Pressable key={item.id} onPress={() => navigation.navigate("PersonalRecords")}>
              <Card style={[styles.prCard, { borderColor: `${COLORS.gold}38` }]}>
                <View style={styles.rowGapTiny}>
                  <Feather name="award" size={10} color={COLORS.gold} />
                  <Text style={[styles.prBadge, { color: COLORS.gold }]}>PR</Text>
                </View>
                <Text style={[styles.detailLabel, { marginTop: 10 }]}>{item.exercise_id}</Text>
                <Text style={[styles.prValue, { color: COLORS.gold }]}>{Math.round(item.value)}</Text>
                <Text style={[styles.detailLabel, { marginTop: 6 }]}>{formatShortDate(item.achieved_on)}</Text>
              </Card>
            </Pressable>
          ))}
          {data?.recent_personal_records.length === 0 ? (
            <Card style={styles.prCard}>
              <Text style={styles.detailLabel}>No PRs yet</Text>
            </Card>
          ) : null}
        </ScrollView>
      </View>

      <PrimaryButton
        label="Start Workout"
        onPress={() => navigation.navigate({ name: "StartWorkout", params: {} })}
        icon={<Feather name="plus" size={20} color="#000000" />}
        style={{ marginTop: 20 }}
      />
    </Screen>
  );
}
