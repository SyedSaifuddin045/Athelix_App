import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AnalyticsCard, ListCard, Screen, ScreenState, SectionEyebrow, Tag } from "../../components";
import { useWorkoutTemplatesQuery } from "../../features/templates/hooks";
import { useOverviewQuery } from "../../features/users/hooks";
import { useRefetchOnFocus } from "../../lib/hooks/useRefetchOnFocus";
import { COLORS } from "../../theme/colors";
import { TabScreenProps } from "../../types/navigation";

type Props = TabScreenProps<"Train">;

const TRAIN_SECTIONS = [
  {
    path: "templateList",
    title: "Templates",
    desc: "Build and organize reusable sessions",
    badge: "Library",
    color: COLORS.teal,
  },
  {
    path: "workoutHistory",
    title: "Workout History",
    desc: "Review completed and in-progress sessions",
    badge: "History",
    color: COLORS.blue,
  },
  {
    path: "mesocycleList",
    title: "Mesocycles",
    desc: "Manage advanced training blocks",
    badge: "Advanced",
    color: COLORS.purple,
  },
] as const;

function formatLastWorkoutDate(value: string | null | undefined): string {
  if (!value) {
    return "No completed sessions yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Latest workout unavailable";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TrainHubScreen({ navigation }: Props): React.JSX.Element {
  const overviewQuery = useOverviewQuery();
  const templatesQuery = useWorkoutTemplatesQuery();

  useRefetchOnFocus([overviewQuery.refetch, templatesQuery.refetch]);

  const heroSubtitle = overviewQuery.data?.latest_completed_session
    ? `Last completed workout on ${formatLastWorkoutDate(overviewQuery.data.latest_completed_session.started_at)}`
    : "Begin a new training session";

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Train</Text>
        <Text style={styles.subtitle}>Your workout hub</Text>
      </View>

      <Pressable onPress={() => navigation.navigate("StartWorkout", {})}>
        <View style={styles.startHero}>
          <View style={styles.heroBackground} />
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.heroTag}>
                <Feather name="zap" size={12} color={COLORS.root} />
                <Text style={styles.heroTagText}>
                  {overviewQuery.data?.active_mesocycle ? "Block active" : "Ready to go"}
                </Text>
              </View>
              <Text style={styles.heroTitle}>Start Workout</Text>
              <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
              {overviewQuery.data?.active_mesocycle ? (
                <View style={styles.heroMeta}>
                  <Tag
                    label={overviewQuery.data.active_mesocycle.name}
                    color={COLORS.root}
                    backgroundColor="rgba(255,255,255,0.88)"
                  />
                </View>
              ) : null}
            </View>
            <View style={styles.heroButton}>
              <Feather name="play" size={24} color={COLORS.root} />
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {overviewQuery.data?.stats.total_workout_templates ?? templatesQuery.data?.length ?? "0"}
              </Text>
              <Text style={styles.heroStatLabel}>Templates</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {overviewQuery.data?.stats.total_sessions ?? "0"}
              </Text>
              <Text style={styles.heroStatLabel}>Sessions</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {overviewQuery.data?.workout_streaks.current_daily_streak ?? "0"}
              </Text>
              <Text style={styles.heroStatLabel}>Day Streak</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {overviewQuery.isError && !overviewQuery.data ? (
        <ScreenState
          title="Train hub unavailable"
          message="The app could not load your latest training summary."
          actionLabel="Retry"
          onAction={() => {
            void overviewQuery.refetch();
          }}
        />
      ) : null}

      <View style={styles.section}>
        <SectionEyebrow>Quick Start Templates</SectionEyebrow>

        {templatesQuery.isLoading && !templatesQuery.data ? (
          <ScreenState title="Loading templates" message="Fetching saved workout templates." loading />
        ) : null}

        {templatesQuery.isError ? (
          <ScreenState
            title="Templates unavailable"
            message="Saved templates could not be loaded."
            actionLabel="Retry"
            onAction={() => {
              void templatesQuery.refetch();
            }}
          />
        ) : null}

        {templatesQuery.data?.length ? (
          <View style={styles.quickTemplates}>
            {templatesQuery.data.slice(0, 5).map((template) => (
              <ListCard
                key={template.id}
                iconEmoji="🏋️"
                name={template.name}
                color={COLORS.teal}
                subtitle={template.description ?? "Saved workout template"}
                onPress={() =>
                  navigation.navigate("StartWorkout", {
                    templateId: template.id,
                  })
                }
                rightElement={<Feather name="play" size={16} color={COLORS.teal} />}
                compact
                showPlayButton={false}
              />
            ))}
          </View>
        ) : null}

        {templatesQuery.data && templatesQuery.data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No templates yet</Text>
            <Text style={styles.emptyText}>
              Build your first reusable template to launch sessions faster.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("TemplateList")}
              style={styles.inlineLink}
            >
              <Text style={styles.inlineLinkText}>Open template library</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Stats Overview</SectionEyebrow>
        <View style={styles.statsGrid}>
          <AnalyticsCard
            label="Completed"
            value={`${overviewQuery.data?.stats.completed_sessions ?? 0}`}
            sub="sessions"
            color={COLORS.teal}
          />
          <AnalyticsCard
            label="Records"
            value={`${overviewQuery.data?.stats.personal_record_count ?? 0}`}
            sub="PRs tracked"
            color={COLORS.gold}
          />
          <AnalyticsCard
            label="Weekly"
            value={`${overviewQuery.data?.workout_streaks.current_weekly_streak ?? 0}`}
            sub="week streak"
            color={COLORS.blue}
          />
          <AnalyticsCard
            label="Profile"
            value={overviewQuery.data?.has_profile ? "Ready" : "Setup"}
            sub="training identity"
            color={overviewQuery.data?.has_profile ? COLORS.green : COLORS.orange}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow>Training Sections</SectionEyebrow>
        {TRAIN_SECTIONS.map((section) => (
          <Pressable
            key={section.path}
            onPress={() => {
              if (section.path === "templateList") {
                navigation.navigate("TemplateList");
              } else if (section.path === "workoutHistory") {
                navigation.navigate("WorkoutHistory");
              } else {
                navigation.navigate("MesocycleList");
              }
            }}
          >
            <View style={[styles.sectionCard, { borderLeftColor: section.color }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${section.color}15` }]}>
                {section.path === "mesocycleList" ? (
                  <Ionicons name="layers-outline" size={18} color={section.color} />
                ) : section.path === "templateList" ? (
                  <MaterialCommunityIcons name="playlist-edit" size={18} color={section.color} />
                ) : (
                  <Ionicons name="time-outline" size={18} color={section.color} />
                )}
              </View>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDesc}>{section.desc}</Text>
              </View>
              <View style={styles.sectionRight}>
                <Tag label={section.badge} color={section.color} backgroundColor={`${section.color}15`} />
                <Feather name="chevron-right" size={16} color={section.color} />
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {(overviewQuery.isFetching || templatesQuery.isFetching) && (overviewQuery.data || templatesQuery.data) ? (
        <View style={styles.refreshHint}>
          <ActivityIndicator size="small" color={COLORS.teal} />
          <Text style={styles.refreshHintText}>Refreshing training data…</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  startHero: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: "hidden",
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,212,168,0.08)",
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  heroTagText: { color: COLORS.root, fontSize: 11, fontWeight: "700" },
  heroTitle: { color: COLORS.text, fontSize: 24, fontWeight: "900", marginTop: 12 },
  heroSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  heroMeta: { marginTop: 10, alignSelf: "flex-start" },
  heroButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  heroStats: {
    flexDirection: "row",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  heroStatLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  section: { marginTop: 28 },
  quickTemplates: { marginTop: 12, gap: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionInfo: { flex: 1, marginLeft: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  sectionDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  emptyState: { marginTop: 16, alignItems: "center", paddingVertical: 18 },
  emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptyText: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 18 },
  inlineLink: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 8 },
  inlineLinkText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  refreshHint: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  refreshHintText: { color: COLORS.muted, fontSize: 11 },
});
