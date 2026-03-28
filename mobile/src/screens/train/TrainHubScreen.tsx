import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Tag, ListCard, AnalyticsCard, SectionEyebrow } from "../../components";
import { TabScreenProps } from "../../types/navigation";
import { useUserOverview, useWorkoutTemplates, useMesocycles } from "../../hooks";

type Props = TabScreenProps<"Train">;

const NAVIGATION_MAP: Record<string, string> = {
  templateList: "TemplateList",
  workoutHistory: "WorkoutHistory",
  mesocycleList: "MesocycleList",
};

interface TrainingSection {
  title: string;
  desc: string;
  path: string;
  color: string;
  badge: string;
  count?: number;
}

export function TrainHubScreen({ navigation }: Props): React.JSX.Element {
  const { data: overview, isLoading: overviewLoading } = useUserOverview();
  const { data: templatesData, isLoading: templatesLoading } = useWorkoutTemplates();
  const { data: mesocyclesData } = useMesocycles();

  console.log("[TrainHub] overview:", JSON.stringify(overview, null, 2));
  console.log("[TrainHub] overviewLoading:", overviewLoading);
  console.log("[TrainHub] templatesData:", JSON.stringify(templatesData, null, 2));
  console.log("[TrainHub] templatesLoading:", templatesLoading);
  console.log("[TrainHub] mesocyclesData:", JSON.stringify(mesocyclesData, null, 2));

  // Compute counts from API data
  const templatesCount = templatesData?.total || overview?.stats?.total_workout_templates || 0;
  const totalSessions = overview?.stats?.total_sessions || 0;
  const currentStreak = overview?.workout_streaks?.current_weekly_streak || 0;
  const mesocyclesCount = mesocyclesData?.total || 0;

  console.log("[TrainHub] computed values:", { templatesCount, totalSessions, currentStreak, mesocyclesCount });

  // Build training sections with dynamic counts
  const trainingSections: TrainingSection[] = [
    {
      title: "Templates",
      desc: "Saved workout plans and routines",
      path: "templateList",
      color: COLORS.teal,
      badge: `${templatesCount} saved`,
      count: templatesCount,
    },
    {
      title: "Workout History",
      desc: "All past sessions and sets",
      path: "workoutHistory",
      color: COLORS.green,
      badge: `${totalSessions} sessions`,
      count: totalSessions,
    },
    {
      title: "Mesocycles",
      desc: "Advanced block planning",
      path: "mesocycleList",
      color: COLORS.purple,
      badge: mesocyclesCount > 0 ? `${mesocyclesCount} plans` : "Advanced",
      count: mesocyclesCount,
    },
  ];

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Train</Text>
        <Text style={styles.subtitle}>Your workout hub</Text>
      </View>

      <Pressable onPress={() => (navigation as any).navigate("StartWorkout", {})}>
        <View style={styles.startHero}>
          <View style={styles.heroBackground} />
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.heroTag}>
                <Feather name="zap" size={12} color={COLORS.root} />
                <Text style={styles.heroTagText}>Ready to go</Text>
              </View>
              <Text style={styles.heroTitle}>Start Workout</Text>
              <Text style={styles.heroSubtitle}>Begin a new training session</Text>
            </View>
            <View style={styles.heroButton}>
              <Feather name="play" size={24} color={COLORS.root} />
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{templatesCount}</Text>
              <Text style={styles.heroStatLabel}>Templates</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totalSessions}</Text>
              <Text style={styles.heroStatLabel}>Sessions</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{currentStreak}</Text>
              <Text style={styles.heroStatLabel}>Day Streak</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.section}>
        <SectionEyebrow>Quick Start Templates</SectionEyebrow>
        {templatesData?.data && templatesData.data.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
            {templatesData.data.slice(0, 5).map((template) => (
              <ListCard
                key={template.id}
                iconEmoji="🏋️"
                name={template.name}
                color={COLORS.teal}
                onPress={() => (navigation as any).navigate("StartWorkout", { id: template.id })}
                showPlayButton={false}
                compact
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyTemplates}>
            <Text style={styles.emptyText}>No templates yet</Text>
            <Pressable onPress={() => (navigation as any).navigate("TemplateBuilder", {})}>
              <Text style={styles.createLink}>Create your first template</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Stats Overview</SectionEyebrow>
        <View style={styles.statsGrid}>
          <AnalyticsCard 
            label="This Week" 
            value={String(overview?.workout_streaks?.current_weekly_streak || 0)} 
            sub="workouts" 
            color={COLORS.teal} 
          />
          <AnalyticsCard 
            label="Volume" 
            value={overview?.stats?.total_volume 
              ? overview.stats.total_volume >= 1000 
                ? `${(overview.stats.total_volume / 1000).toFixed(0)}k` 
                : String(overview.stats.total_volume)
              : "0"} 
            sub="kg lifted" 
            color={COLORS.green} 
          />
          <AnalyticsCard 
            label="Avg Session" 
            value={overview?.stats?.average_duration_minutes 
              ? `${Math.round(overview.stats.average_duration_minutes)}m` 
              : "0m"} 
            sub="per workout" 
            color={COLORS.blue} 
          />
          <AnalyticsCard 
            label="PRs Hit" 
            value={String(overview?.stats?.personal_record_count || overview?.stats?.total_prs || 0)} 
            sub="this month" 
            color={COLORS.gold} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow>Training Sections</SectionEyebrow>
        {trainingSections.map((section) => (
          <Pressable
            key={section.path}
            onPress={() => {
              const screenName = NAVIGATION_MAP[section.path];
              if (screenName) {
                (navigation as any).navigate(screenName);
              }
            }}
          >
            <View style={[styles.sectionCard, { borderLeftColor: section.color }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${section.color}15` }]}>
                <Ionicons name="barbell" size={18} color={section.color} />
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
  heroLeft: {},
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
  heroSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
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
  templateScroll: { marginTop: 12 },
  emptyTemplates: { marginTop: 12, alignItems: "center", paddingVertical: 20 },
  emptyText: { color: COLORS.muted, fontSize: 13 },
  createLink: { color: COLORS.teal, fontSize: 13, fontWeight: "600", marginTop: 8 },
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
  sectionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionInfo: { flex: 1, marginLeft: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  sectionDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
});
