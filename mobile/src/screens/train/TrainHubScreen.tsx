import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, PrimaryButton, CompactStatCard, AnalyticsCard, SectionEyebrow } from "../../components";
import { TabScreenProps } from "../../types/navigation";
import { TRAIN_SECTIONS, START_WORKOUT_TEMPLATES } from "../../data";
import { shadow } from "../../utils";

type Props = TabScreenProps<"Train">;

export function TrainHubScreen({ navigation }: Props): React.JSX.Element {
  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Train</Text>
        <Text style={styles.subtitle}>Your workout hub</Text>
      </View>

      <Pressable onPress={() => navigation.navigate("StartWorkout", {})}>
        <Card style={[styles.startHero, shadow(COLORS.teal)]}>
          <View style={styles.startHeroContent}>
            <View>
              <Tag label="Ready to go" color={COLORS.teal} />
              <Text style={styles.startTitle}>Start Workout</Text>
              <Text style={styles.startSubtitle}>Begin a new training session</Text>
            </View>
            <View style={styles.startIconWrap}>
              <Feather name="play" size={28} color="#000000" />
            </View>
          </View>
          <View style={styles.startQuickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>5</Text>
              <Text style={styles.quickStatLabel}>Templates</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>248</Text>
              <Text style={styles.quickStatLabel}>Sessions</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>12</Text>
              <Text style={styles.quickStatLabel}>Day Streak</Text>
            </View>
          </View>
        </Card>
      </Pressable>

      <View style={styles.section}>
        <SectionEyebrow>Quick Start Templates</SectionEyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
          {START_WORKOUT_TEMPLATES.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => navigation.navigate("StartWorkout", { id: template.id })}
            >
              <Card style={[styles.templateCard, { borderColor: `${template.color}30` }]}>
                <View style={[styles.templateColorBar, { backgroundColor: template.color }]} />
                <Text style={styles.templateEmoji}>🏋️</Text>
                <Text style={styles.templateName}>{template.name}</Text>
                <View style={styles.templateMeta}>
                  <Text style={styles.templateExercises}>{template.exercises} exercises</Text>
                  <Text style={styles.templateDot}>·</Text>
                  <Text style={styles.templateDuration}>{template.duration}</Text>
                </View>
                <Text style={styles.templateLastUsed}>Last used: {template.lastUsed}</Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Stats Overview</SectionEyebrow>
        <View style={styles.statsGrid}>
          <AnalyticsCard label="This Week" value="5" sub="workouts" color={COLORS.teal} />
          <AnalyticsCard label="Volume" value="48k" sub="kg lifted" color={COLORS.green} />
          <AnalyticsCard label="Avg Session" value="54m" sub="per workout" color={COLORS.blue} />
          <AnalyticsCard label="PRs Hit" value="2" sub="this month" color={COLORS.gold} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow>Training Sections</SectionEyebrow>
        {TRAIN_SECTIONS.map((section) => (
          <Pressable
            key={section.path}
            onPress={() => {
              if (section.path === "templateList") navigation.navigate("TemplateList");
              else if (section.path === "workoutHistory") navigation.navigate("WorkoutHistory");
              else if (section.path === "mesocycleList") navigation.navigate("MesocycleList");
            }}
          >
            <Card style={[styles.sectionCard, { borderColor: `${section.color}30` }]}>
              <View style={styles.sectionRow}>
                <View style={[styles.sectionIconWrap, { backgroundColor: `${section.color}20` }]}>
                  <Ionicons name="barbell" size={18} color={section.color} />
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionDesc}>{section.desc}</Text>
                </View>
                <View style={styles.sectionRight}>
                  <Tag label={section.badge} color={section.color} backgroundColor={`${section.color}20`} />
                  <Feather name="chevron-right" size={16} color={section.color} />
                </View>
              </View>
            </Card>
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
  startHero: { borderWidth: 1, borderColor: `${COLORS.teal}40` },
  startHeroContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  startTitle: { color: COLORS.text, fontSize: 22, fontWeight: "900", marginTop: 10 },
  startSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  startIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center" },
  startQuickStats: { flexDirection: "row", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  quickStatItem: { flex: 1, alignItems: "center" },
  quickStatValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  quickStatLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  quickStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  section: { marginTop: 28 },
  templateScroll: { marginTop: 10 },
  templateCard: { width: 150, marginRight: 12, borderWidth: 1 },
  templateColorBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  templateEmoji: { fontSize: 32, marginTop: 8 },
  templateName: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 10 },
  templateMeta: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  templateExercises: { color: COLORS.muted, fontSize: 11 },
  templateDot: { color: COLORS.muted, fontSize: 11, marginHorizontal: 4 },
  templateDuration: { color: COLORS.muted, fontSize: 11 },
  templateLastUsed: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  sectionCard: { marginBottom: 10, borderWidth: 1 },
  sectionRow: { flexDirection: "row", alignItems: "center" },
  sectionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionInfo: { flex: 1, marginLeft: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  sectionDesc: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
});
