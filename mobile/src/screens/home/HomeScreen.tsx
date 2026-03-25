import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  CompactStatCard,
  PRCard,
  PrimaryButton,
  Screen,
  ScreenState,
  SectionEyebrow,
  Tag,
} from "../../components";
import { COLORS } from "../../theme/colors";
import { TabScreenProps } from "../../types/navigation";
import { useOverviewQuery } from "../../features/users/hooks";
import { useExerciseLookupQueries } from "../../features/exercises/hooks";
import { useRefetchOnFocus } from "../../lib/hooks/useRefetchOnFocus";

type Props = TabScreenProps<"Home">;

function formatDate(value?: string | null): string {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMinutes(startedAt?: string | null, finishedAt?: string | null): string | null {
  if (!startedAt || !finishedAt) {
    return null;
  }

  const diffMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return null;
  }

  return `${Math.round(diffMs / (1000 * 60))} min`;
}

function formatRecordValue(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function getInitials(label: string): string {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");
}

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const overviewQuery = useOverviewQuery();
  const recordExerciseIds = overviewQuery.data?.recent_personal_records.map((record) => record.exercise_id) ?? [];
  const recordExerciseLookup = useExerciseLookupQueries(recordExerciseIds);

  useRefetchOnFocus([overviewQuery.refetch]);

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <ScreenState title="Loading your dashboard" loading message="Fetching /users/me/overview" />
      </Screen>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <ScreenState
          title="Dashboard unavailable"
          message="The app could not load your synced overview."
          actionLabel="Retry"
          onAction={() => {
            void overviewQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const overview = overviewQuery.data;
  const displayName = overview.profile?.display_name || overview.user.username;
  const latestWeight = overview.latest_body_weight_log;
  const lastWorkout = overview.latest_completed_session;
  const workoutDuration = formatMinutes(lastWorkout?.started_at, lastWorkout?.finished_at);

  return (
    <Screen
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={overviewQuery.isRefetching}
          onRefresh={() => {
            void overviewQuery.refetch();
          }}
          tintColor={COLORS.teal}
        />
      }
    >
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingText}>Welcome back,</Text>
          <Text style={styles.greetingName}>{displayName}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Profile")} style={styles.avatarButton}>
          <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
        </Pressable>
      </View>

      {!overview.has_profile ? (
        <View style={styles.onboardingCard}>
          <SectionEyebrow color={COLORS.gold}>Profile Incomplete</SectionEyebrow>
          <Text style={styles.onboardingTitle}>Finish your profile setup</Text>
          <Text style={styles.onboardingText}>
            Height, weight, unit preference, and fitness level are still missing from your account.
          </Text>
          <PrimaryButton
            label="Complete Profile"
            onPress={() => navigation.navigate("ProfileSetup")}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : null}

      {overview.active_mesocycle ? (
        <View style={styles.mesocycleCard}>
          <View style={styles.mesoTop}>
            <View style={styles.mesoLeft}>
              <Tag label="Active Mesocycle" color={COLORS.teal} backgroundColor={`${COLORS.teal}15`} />
              <Text style={styles.mesoName}>{overview.active_mesocycle.name}</Text>
              <Text style={styles.mesoWeek}>
                Started {formatDate(overview.active_mesocycle.started_on)}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                navigation.navigate("MesocycleDetail", {
                  mesocycleId: overview.active_mesocycle!.id,
                })
              }
            >
              <Feather name="chevron-right" size={20} color={COLORS.teal} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionEyebrow>This Snapshot</SectionEyebrow>
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyStats}>
            <CompactStatCard
              label="Templates"
              value={`${overview.stats.total_workout_templates}`}
              valueColor={COLORS.teal}
            />
            <CompactStatCard
              label="Sessions"
              value={`${overview.stats.completed_sessions}`}
              valueColor={COLORS.green}
            />
            <CompactStatCard
              label="PRs"
              value={`${overview.stats.personal_record_count}`}
              valueColor={COLORS.gold}
            />
          </View>
          <View style={styles.streakRow}>
            <View style={styles.streakPill}>
              <Ionicons name="flame" size={16} color={COLORS.orange} />
              <Text style={styles.streakValue}>
                {overview.workout_streaks.current_daily_streak} day streak
              </Text>
            </View>
            <View style={styles.streakPill}>
              <Feather name="calendar" size={16} color={COLORS.blue} />
              <Text style={styles.streakValue}>
                {overview.workout_streaks.current_weekly_streak} active weeks
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quickCards}>
        <View style={styles.bodyweightCard}>
          <View style={styles.cardHeader}>
            <Feather name="activity" size={16} color={COLORS.purple} />
            <Text style={styles.cardTitle}>Bodyweight</Text>
          </View>
          <Text style={styles.bodyweightValue}>
            {latestWeight ? `${latestWeight.weight_kg.toFixed(1)} kg` : "No logs"}
          </Text>
          <Text style={styles.bodyweightChange}>
            {latestWeight ? formatDate(latestWeight.logged_at) : "Log your first entry in Phase 2"}
          </Text>
        </View>

        <View style={styles.lastWorkoutCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={16} color={COLORS.orange} />
            <Text style={styles.cardTitle}>Last Workout</Text>
          </View>
          <Text style={styles.lastWorkoutName}>
            {lastWorkout?.name || "No completed session yet"}
          </Text>
          <View style={styles.lastWorkoutMeta}>
            <Text style={styles.lastWorkoutDuration}>
              {lastWorkout ? formatDate(lastWorkout.started_at) : "Start your first workout"}
            </Text>
            {workoutDuration ? (
              <Text style={styles.lastWorkoutSets}>{workoutDuration}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.gold}>Recent PRs</SectionEyebrow>
        {overview.recent_personal_records.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prScroll}>
            {overview.recent_personal_records.map((record) => (
              <PRCard
                key={record.id}
                exercise={
                  recordExerciseLookup.map[record.exercise_id]?.name ?? `Exercise ${record.exercise_id}`
                }
                value={formatRecordValue(record.value)}
                date={formatDate(record.achieved_on)}
                color={COLORS.gold}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No personal records yet</Text>
            <Text style={styles.emptySub}>Complete sessions to let the backend calculate them.</Text>
          </View>
        )}
      </View>

      <View style={styles.startButtonWrap}>
        <PrimaryButton
          label="Start Workout"
          onPress={() => navigation.navigate("StartWorkout", {})}
          icon={<Feather name="play" size={16} color="#000000" />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greetingText: { color: COLORS.muted, fontSize: 13 },
  greetingName: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#000000", fontSize: 15, fontWeight: "800" },
  onboardingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${COLORS.gold}20`,
  },
  onboardingTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 10 },
  onboardingText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  mesocycleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.teal,
  },
  mesoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  mesoLeft: { flex: 1 },
  mesoName: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 10 },
  mesoWeek: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  section: { marginTop: 24 },
  weeklyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  weeklyStats: { flexDirection: "row", gap: 8 },
  streakRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  streakPill: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  streakValue: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  quickCards: { flexDirection: "row", gap: 12, marginTop: 24 },
  bodyweightCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  cardTitle: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  bodyweightValue: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  bodyweightChange: { color: COLORS.green, fontSize: 11, marginTop: 4 },
  lastWorkoutCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
  },
  lastWorkoutName: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 10 },
  lastWorkoutMeta: { flexDirection: "row", gap: 10, marginTop: 6, flexWrap: "wrap" },
  lastWorkoutDuration: { color: COLORS.muted, fontSize: 11 },
  lastWorkoutSets: { color: COLORS.muted, fontSize: 11 },
  prScroll: { marginTop: 10 },
  emptyCard: {
    marginTop: 10,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  emptySub: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  startButtonWrap: { marginTop: 28 },
});
