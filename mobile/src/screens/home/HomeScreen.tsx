import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, PrimaryButton, VerticalBars, CompactStatCard, SectionEyebrow } from "../../components";
import { TabScreenProps } from "../../types/navigation";
import { WEEKLY_BARS, RECENT_PRS, MESOCYCLES, WORKOUT_SESSIONS } from "../../data";
import { shadow } from "../../utils";

type Props = TabScreenProps<"Home">;

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const activeMesocycle = MESOCYCLES.find((m) => m.id === "1");
  const lastWorkout = WORKOUT_SESSIONS[0];
  const todayWorkout = WEEKLY_BARS[WEEKLY_BARS.length - 1];

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingText}>Good Morning,</Text>
          <Text style={styles.greetingName}>Jordan</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Profile")} style={styles.avatarButton}>
          <Text style={styles.avatarText}>JD</Text>
        </Pressable>
      </View>

      {activeMesocycle && (
        <Card style={[styles.mesocycleCard, { borderColor: `${activeMesocycle.color}30` }]}>
          <View style={styles.mesoTop}>
            <View style={styles.mesoLeft}>
              <Tag label="Active Mesocycle" color={activeMesocycle.color} backgroundColor={`${activeMesocycle.color}20`} />
              <Text style={styles.mesoName}>{activeMesocycle.name}</Text>
              <Text style={styles.mesoWeek}>{activeMesocycle.week}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate("MesocycleDetail", { id: activeMesocycle.id })}>
              <Feather name="chevron-right" size={20} color={activeMesocycle.color} />
            </Pressable>
          </View>
          <View style={styles.mesoProgress}>
            <View style={styles.mesoProgressBar}>
              <View style={[styles.mesoProgressFill, { width: "50%", backgroundColor: activeMesocycle.color }]} />
            </View>
            <Text style={styles.mesoProgressText}>3/6 weeks</Text>
          </View>
        </Card>
      )}

      <View style={styles.section}>
        <SectionEyebrow>This Week</SectionEyebrow>
        <Card style={styles.weeklyCard}>
          <View style={styles.weeklyStats}>
            <CompactStatCard label="Workouts" value="5" valueColor={COLORS.teal} />
            <CompactStatCard label="Volume" value="48k" valueColor={COLORS.green} />
            <CompactStatCard label="PRs" value="2" valueColor={COLORS.gold} />
          </View>
          <VerticalBars
            data={WEEKLY_BARS.map((b, i) => ({ day: b.day, value: b.value, highlight: i === WEEKLY_BARS.length - 1 }))}
            height={70}
            activeColor={COLORS.teal}
          />
          <View style={styles.weeklySummary}>
            <Text style={styles.weeklySummaryText}>5 of 6 days completed</Text>
            <Tag label="On track" color={COLORS.green} />
          </View>
        </Card>
      </View>

      <View style={styles.quickCards}>
        <Card style={styles.bodyweightCard}>
          <View style={styles.cardHeader}>
            <Feather name="activity" size={16} color={COLORS.purple} />
            <Text style={styles.cardTitle}>Bodyweight</Text>
          </View>
          <Text style={styles.bodyweightValue}>82.4 kg</Text>
          <Text style={styles.bodyweightChange}>-0.3 kg this week</Text>
        </Card>

        <Card style={styles.lastWorkoutCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={16} color={COLORS.orange} />
            <Text style={styles.cardTitle}>Last Workout</Text>
          </View>
          <Text style={styles.lastWorkoutName}>{lastWorkout.name}</Text>
          <View style={styles.lastWorkoutMeta}>
            <Text style={styles.lastWorkoutDuration}>{lastWorkout.duration} min</Text>
            <Text style={styles.lastWorkoutSets}>{lastWorkout.sets} sets</Text>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.gold}>Recent PRs</SectionEyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prScroll}>
          {RECENT_PRS.map((pr, index) => (
            <Card key={index} style={styles.prCard}>
              <View style={[styles.prIndicator, { backgroundColor: pr.color }]} />
              <Text style={styles.prEmoji}>🏋️</Text>
              <Text style={styles.prExercise}>{pr.exercise}</Text>
              <Text style={[styles.prValue, { color: pr.color }]}>{pr.value}</Text>
              <Text style={styles.prDate}>{pr.date}</Text>
            </Card>
          ))}
        </ScrollView>
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
  greeting: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greetingText: { color: COLORS.muted, fontSize: 13 },
  greetingName: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  avatarButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#000000", fontSize: 15, fontWeight: "800" },
  mesocycleCard: { marginBottom: 20, borderWidth: 1 },
  mesoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  mesoLeft: { flex: 1 },
  mesoName: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 10 },
  mesoWeek: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  mesoProgress: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  mesoProgressBar: { flex: 1, height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  mesoProgressFill: { height: "100%", borderRadius: 999 },
  mesoProgressText: { color: COLORS.muted, fontSize: 11 },
  section: { marginTop: 24 },
  weeklyCard: { marginTop: 10 },
  weeklyStats: { flexDirection: "row", gap: 8, marginBottom: 16 },
  weeklySummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  weeklySummaryText: { color: COLORS.muted, fontSize: 12 },
  quickCards: { flexDirection: "row", gap: 12, marginTop: 24 },
  bodyweightCard: { flex: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  cardTitle: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  bodyweightValue: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  bodyweightChange: { color: COLORS.green, fontSize: 11, marginTop: 4 },
  lastWorkoutCard: { flex: 1 },
  lastWorkoutName: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 10 },
  lastWorkoutMeta: { flexDirection: "row", gap: 10, marginTop: 6 },
  lastWorkoutDuration: { color: COLORS.muted, fontSize: 11 },
  lastWorkoutSets: { color: COLORS.muted, fontSize: 11 },
  prScroll: { marginTop: 10 },
  prCard: { width: 120, marginRight: 12, alignItems: "center", paddingVertical: 16 },
  prIndicator: { position: "absolute", top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  prEmoji: { fontSize: 28, marginTop: 4 },
  prExercise: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginTop: 8, textAlign: "center" },
  prValue: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  prDate: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  startButtonWrap: { marginTop: 28 },
});
