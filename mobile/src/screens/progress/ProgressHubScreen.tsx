import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, SectionEyebrow } from "../../components";
import { TabScreenProps } from "../../types/navigation";
import { useUserOverview, useMuscleBalance } from "../../hooks";

type Props = TabScreenProps<"Progress">;

const PROGRESS_SECTIONS = [
  {
    path: "personalRecords",
    color: "#fbbf24",
    title: "Personal Records",
    desc: "All-time best lifts by exercise and record type",
    badge: "View all",
  },
  {
    path: "exerciseProgress",
    color: "#00d4a8",
    title: "Exercise Progress",
    desc: "e1RM history, volume trends and overload signals",
    badge: "Browse exercises",
  },
  {
    path: "muscleBalance",
    color: "#8b5cf6",
    title: "Muscle Balance",
    desc: "Weekly sets by muscle group to spot imbalances",
    badge: "View analysis",
  },
];

export function ProgressHubScreen({ navigation }: Props): React.JSX.Element {
  const { data: overview, isLoading: overviewLoading } = useUserOverview();
  const { data: muscleData } = useMuscleBalance({ weeks: 4 });

  const quickStats = [
    { label: "Total PRs", value: String(overview?.stats?.total_prs || 0), color: COLORS.gold },
    { label: "Best e1RM", value: "---", color: COLORS.teal },
    { label: "This Month", value: "0 PRs", color: COLORS.green },
  ];

  const handleNavigate = (path: string) => {
    switch (path) {
      case "personalRecords":
        (navigation as any).navigate("PersonalRecords");
        break;
      case "exerciseProgress":
        (navigation as any).navigate("ExerciseProgress", { id: "1" });
        break;
      case "muscleBalance":
        (navigation as any).navigate("MuscleBalance");
        break;
    }
  };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>
      </View>

      <View style={styles.quickStatsRow}>
        {quickStats.map((stat, index) => (
          <Card key={index} style={[styles.quickStatCard, { borderColor: `${stat.color}30` }]}>
            <View style={[styles.quickStatDot, { backgroundColor: stat.color }]} />
            <Text style={[styles.quickStatValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.quickStatLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Progress Sections</SectionEyebrow>

        {PROGRESS_SECTIONS.map((section) => (
          <Pressable
            key={section.path}
            onPress={() => handleNavigate(section.path)}
          >
            <Card style={[styles.sectionCard, { borderColor: `${section.color}30` }]}>
              <View style={styles.sectionRow}>
                <View style={[styles.sectionIconWrap, { backgroundColor: `${section.color}20` }]}>
                  <Ionicons name="bar-chart" size={18} color={section.color} />
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionDesc}>{section.desc}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={section.color} />
              </View>
              <View style={styles.sectionFooter}>
                <Tag label={section.badge} color={section.color} backgroundColor={`${section.color}20`} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.teal}>Weekly Snapshot</SectionEyebrow>
        <Card style={styles.snapshotCard}>
          <View style={styles.snapshotHeader}>
            <Text style={styles.snapshotTitle}>This Week's Training</Text>
            <Text style={styles.snapshotSubtitle}>
              {overview?.workout_streaks?.workouts_this_week || 0} of 6 days active
            </Text>
          </View>

          {muscleData?.muscle_groups ? (
            <View style={styles.muscleOverview}>
              {muscleData.muscle_groups.slice(0, 4).map((muscle) => (
                <View key={muscle.muscle} style={styles.muscleRow}>
                  <Text style={styles.muscleName}>{muscle.muscle}</Text>
                  <View style={styles.muscleBarWrap}>
                    <View style={styles.muscleBarBg}>
                      <View
                        style={[
                          styles.muscleBarFill,
                          {
                            width: `${Math.min((muscle.sets / muscle.target_sets) * 100, 100)}%`,
                            backgroundColor: muscle.status === "at_target" ? COLORS.green : muscle.status === "over" ? COLORS.gold : COLORS.red,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.muscleStatus, { 
                    color: muscle.status === "at_target" ? COLORS.green : muscle.status === "over" ? COLORS.gold : COLORS.red 
                  }]}>
                    {muscle.status === "at_target" ? "On Target" : muscle.status === "over" ? "Above" : "Below"}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.muscleOverview}>
              {["Chest", "Back", "Shoulders", "Quadriceps"].map((muscle) => (
                <View key={muscle} style={styles.muscleRow}>
                  <Text style={styles.muscleName}>{muscle}</Text>
                  <View style={styles.muscleBarWrap}>
                    <View style={styles.muscleBarBg}>
                      <View style={[styles.muscleBarFill, { width: "50%", backgroundColor: COLORS.muted }]} />
                    </View>
                  </View>
                  <Text style={styles.muscleStatus}>---</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable
            style={styles.viewAllButton}
            onPress={() => (navigation as any).navigate("MuscleBalance")}
          >
            <Text style={styles.viewAllText}>View Full Analysis</Text>
            <Feather name="arrow-right" size={14} color={COLORS.teal} />
          </Pressable>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.gold}>Bodyweight Tracking</SectionEyebrow>
        <Pressable onPress={() => (navigation as any).navigate("BodyweightHistory")}>
          <Card style={styles.bodyweightCard}>
            <View style={styles.bodyweightMain}>
              <View>
                <Text style={styles.bodyweightLabel}>Current</Text>
                <Text style={styles.bodyweightValue}>
                  {overview?.latest_body_weight_log?.weight 
                    ? `${overview.latest_body_weight_log.weight.toFixed(1)} kg` 
                    : "-- kg"}
                </Text>
              </View>
              <View style={styles.bodyweightChange}>
                <Feather name="trending-down" size={14} color={COLORS.green} />
                <Text style={styles.changeValue}>---</Text>
              </View>
            </View>
            <Text style={styles.bodyweightPeriod}>Track your weight over time</Text>
          </Card>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  quickStatsRow: { flexDirection: "row", gap: 10 },
  quickStatCard: { flex: 1, alignItems: "center", paddingVertical: 16, borderWidth: 1 },
  quickStatDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  quickStatValue: { fontSize: 18, fontWeight: "900" },
  quickStatLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  section: { marginTop: 28 },
  sectionCard: { marginBottom: 10, borderWidth: 1 },
  sectionRow: { flexDirection: "row", alignItems: "center" },
  sectionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionInfo: { flex: 1, marginLeft: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  sectionDesc: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  sectionFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  snapshotCard: { marginTop: 10 },
  snapshotHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  snapshotTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  snapshotSubtitle: { color: COLORS.muted, fontSize: 11 },
  muscleOverview: { marginTop: 16, gap: 10 },
  muscleRow: { flexDirection: "row", alignItems: "center" },
  muscleName: { width: 80, color: COLORS.muted, fontSize: 11 },
  muscleBarWrap: { flex: 1, marginHorizontal: 8 },
  muscleBarBg: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)" },
  muscleBarFill: { height: "100%", borderRadius: 3 },
  muscleStatus: { width: 60, fontSize: 9, fontWeight: "700", textAlign: "right" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)" },
  viewAllText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  bodyweightCard: { marginTop: 10 },
  bodyweightMain: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  bodyweightLabel: { color: COLORS.muted, fontSize: 11 },
  bodyweightValue: { color: COLORS.text, fontSize: 24, fontWeight: "900", marginTop: 4 },
  bodyweightChange: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${COLORS.green}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  changeValue: { color: COLORS.green, fontSize: 13, fontWeight: "700" },
  bodyweightPeriod: { color: COLORS.muted, fontSize: 11, marginTop: 8 },
});
