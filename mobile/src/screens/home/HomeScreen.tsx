import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Tag, PrimaryButton, VerticalBars, CompactStatCard, SectionEyebrow, PRCard } from "../../components";
import { TabScreenProps } from "../../types/navigation";
import { useUserOverview } from "../../hooks";
import { useAuthStore } from "../../store";

type Props = TabScreenProps<"Home">;

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const { data: overview, isLoading, error } = useUserOverview();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const displayName = overview?.profile?.display_name || overview?.profile?.first_name || user?.username || "Athlete";

  const weeklyWorkoutData = useMemo(() => {
    const streaks = overview?.workout_streaks;
    const workouts_this_week = streaks?.workouts_this_week ?? streaks?.current_weekly_streak ?? 0;
    const workouts_last_week = streaks?.workouts_last_week ?? 0;
    const today = new Date().getDay();
    const mondayIndex = today === 0 ? 6 : today - 1;
    
    return WEEKDAYS.map((day, index) => ({
      day,
      value: index < mondayIndex ? (index < workouts_this_week ? 1 : 0) : 0,
      highlight: index === mondayIndex - 1 && workouts_this_week > 0,
    }));
  }, [overview?.workout_streaks]);

  const bodyweightChange = useMemo(() => {
    if (!overview?.latest_body_weight_log) return null;
    return overview.latest_body_weight_log.weight;
  }, [overview?.latest_body_weight_log]);

  if (isLoading) {
    return (
      <Screen contentContainerStyle={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.greetingName}>{displayName}</Text>
        </View>
        <Pressable onPress={() => (navigation as any).navigate("Profile")} style={styles.avatarButton}>
          <Text style={styles.avatarText}>
            {displayName.slice(0, 2).toUpperCase()}
          </Text>
        </Pressable>
      </View>

      {overview?.active_mesocycle && (
        <View 
          style={[
            styles.mesocycleCard, 
            { borderLeftColor: COLORS.teal }
          ]}
        >
          <View style={styles.mesoTop}>
            <View style={styles.mesoLeft}>
              <Tag label="Active Mesocycle" color={COLORS.teal} backgroundColor={`${COLORS.teal}15`} />
              <Text style={styles.mesoName}>{overview.active_mesocycle.name}</Text>
              <Text style={styles.mesoWeek}>
                Week {overview.active_mesocycle.current_week}/{overview.active_mesocycle.total_weeks}
              </Text>
            </View>
            <Pressable 
              onPress={() => {
                if (overview.active_mesocycle) {
                  (navigation as any).navigate("MesocycleDetail", { id: overview.active_mesocycle.id });
                }
              }}
            >
              <Feather name="chevron-right" size={20} color={COLORS.teal} />
            </Pressable>
          </View>
          <View style={styles.mesoProgress}>
            <View style={styles.mesoProgressBar}>
              <View 
                style={[
                  styles.mesoProgressFill, 
                  { 
                    width: `${(overview.active_mesocycle.current_week / overview.active_mesocycle.total_weeks) * 100}%`, 
                    backgroundColor: COLORS.teal 
                  }
                ]} 
              />
            </View>
            <Text style={styles.mesoProgressText}>
              {overview.active_mesocycle.current_week}/{overview.active_mesocycle.total_weeks} weeks
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <SectionEyebrow>This Week</SectionEyebrow>
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyStats}>
            <CompactStatCard 
              label="Workouts" 
              value={String(overview?.workout_streaks?.workouts_this_week || overview?.workout_streaks?.current_weekly_streak || 0)} 
              valueColor={COLORS.teal} 
            />
            <CompactStatCard 
              label="Volume" 
              value={overview?.stats?.total_volume 
                ? overview.stats.total_volume >= 1000 
                  ? `${(overview.stats.total_volume / 1000).toFixed(0)}k` 
                  : String(overview.stats.total_volume)
                : "0"} 
              valueColor={COLORS.green} 
            />
            <CompactStatCard 
              label="PRs" 
              value={String(overview?.stats?.personal_record_count || overview?.stats?.total_prs || 0)} 
              valueColor={COLORS.gold} 
            />
          </View>
          <VerticalBars
            data={weeklyWorkoutData}
            height={70}
            activeColor={COLORS.teal}
          />
          <View style={styles.weeklySummary}>
            <Text style={styles.weeklySummaryText}>
              {overview?.workout_streaks?.workouts_this_week || overview?.workout_streaks?.current_weekly_streak || 0} of 6 days completed
            </Text>
            <Tag 
              label={(overview?.workout_streaks?.workouts_this_week || overview?.workout_streaks?.current_weekly_streak || 0) >= 4 ? "On track" : "Keep going"} 
              color={(overview?.workout_streaks?.workouts_this_week || overview?.workout_streaks?.current_weekly_streak || 0) >= 4 ? COLORS.green : COLORS.orange} 
            />
          </View>
        </View>
      </View>

      <View style={styles.quickCards}>
        <View style={styles.bodyweightCard}>
          <View style={styles.cardHeader}>
            <Feather name="activity" size={16} color={COLORS.purple} />
            <Text style={styles.cardTitle}>Bodyweight</Text>
          </View>
          {bodyweightChange ? (
            <>
              <Text style={styles.bodyweightValue}>
                {bodyweightChange.toFixed(1)} kg
              </Text>
              <Text style={styles.bodyweightChange}>Latest entry</Text>
            </>
          ) : (
            <>
              <Text style={styles.bodyweightValue}>-- kg</Text>
              <Text style={styles.bodyweightChange}>No data yet</Text>
            </>
          )}
        </View>

        <View style={styles.lastWorkoutCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={16} color={COLORS.orange} />
            <Text style={styles.cardTitle}>Last Workout</Text>
          </View>
          {overview?.latest_completed_session ? (
            <>
              <Text style={styles.lastWorkoutName} numberOfLines={1}>
                {overview.latest_completed_session.name}
              </Text>
              <View style={styles.lastWorkoutMeta}>
                <Text style={styles.lastWorkoutDuration}>
                  {overview.latest_completed_session.duration_minutes} min
                </Text>
                <Text style={styles.lastWorkoutSets}>
                  {overview.latest_completed_session.total_sets} sets
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.lastWorkoutName}>No workouts yet</Text>
              <Text style={styles.lastWorkoutDuration}>Start your first workout!</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.gold}>Recent PRs</SectionEyebrow>
        {overview?.recent_personal_records && overview.recent_personal_records.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prScroll}>
            {overview.recent_personal_records.map((pr, index) => (
              <PRCard
                key={pr.id || index}
                exercise={pr.exercise_name}
                value={`${pr.value} ${pr.unit}`}
                date={new Date(pr.achieved_at).toLocaleDateString()}
                color={COLORS.gold}
                onPress={() => (navigation as any).navigate("ExerciseProgress", { id: pr.exercise_id })}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No PRs yet. Keep training!</Text>
          </View>
        )}
      </View>

      <View style={styles.startButtonWrap}>
        <PrimaryButton
          label="Start Workout"
          onPress={() => (navigation as any).navigate("StartWorkout", {})}
          icon={<Feather name="play" size={16} color="#000000" />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 16,
  },
  greeting: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greetingText: { color: COLORS.muted, fontSize: 13 },
  greetingName: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  avatarButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#000000", fontSize: 15, fontWeight: "800" },
  mesocycleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  mesoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  mesoLeft: { flex: 1 },
  mesoName: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 10 },
  mesoWeek: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  mesoProgress: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  mesoProgressBar: { flex: 1, height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  mesoProgressFill: { height: "100%", borderRadius: 999 },
  mesoProgressText: { color: COLORS.muted, fontSize: 11 },
  section: { marginTop: 24 },
  weeklyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  weeklyStats: { flexDirection: "row", gap: 8, marginBottom: 16 },
  weeklySummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  weeklySummaryText: { color: COLORS.muted, fontSize: 12 },
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
  lastWorkoutMeta: { flexDirection: "row", gap: 10, marginTop: 6 },
  lastWorkoutDuration: { color: COLORS.muted, fontSize: 11 },
  lastWorkoutSets: { color: COLORS.muted, fontSize: 11 },
  prScroll: { marginTop: 10 },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    marginTop: 10,
    alignItems: "center",
  },
  emptyStateText: { color: COLORS.muted, fontSize: 13 },
  startButtonWrap: { marginTop: 28 },
});
