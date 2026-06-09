import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useExerciseProgressQuery } from "../api/queries";
import { EXERCISE_PROGRESS_PERIODS } from "../data";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { CompactStatCard } from "../components/ui/Stats";
import { TrendChart, VerticalBars } from "../components/ui/Charts";
import { SectionEyebrow } from "../components/ui/Indicators";
import { ExercisePicker } from "../components/ExercisePicker";
import { formatShortDate, formatVolume } from "../utils/format";

export function ExerciseProgressScreen({ navigation, route }: { navigation: any; route: { params: { id?: string } } }) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const routeId = route.params?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(routeId);
  const fromPicker = !routeId;
  const [period, setPeriod] = useState("3M");
  const progress = useExerciseProgressQuery(selectedId, undefined, isAuthenticated && !!selectedId);

  const now = new Date();
  const periodDays: Record<string, number | null> = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365, All: null };
  const cutoffDays = periodDays[period] ?? null;
  const cutoffDate = cutoffDays ? new Date(now.getTime() - cutoffDays * 86400000) : null;

  const rawE1rmData =
    progress.data?.e1rm_history.map((item) => ({
      label: formatShortDate(item.performed_at),
      value: item.default_e1rm ?? item.weight_kg ?? 0,
      performed_at: item.performed_at,
    })) ?? [];
  const rawVolumeData =
    progress.data?.weekly_volume_history.map((item, index, array) => ({
      label: formatShortDate(item.week_start),
      value: item.volume_load,
      highlight: index === array.length - 1,
      week_start: item.week_start,
    })) ?? [];

  const e1rmData = cutoffDate
    ? rawE1rmData.filter((item) => new Date(item.performed_at) >= cutoffDate)
    : rawE1rmData;
  const volumeData = cutoffDate
    ? rawVolumeData.filter((item) => new Date(item.week_start) >= cutoffDate)
    : rawVolumeData;

  const current = e1rmData.at(-1)?.value ?? 0;
  const gain = current - (e1rmData[0]?.value ?? current);

  const allTimestamps = [
    ...(progress.data?.e1rm_history ?? []).map((i) => new Date(i.performed_at).getTime()),
    ...(progress.data?.weekly_volume_history ?? []).map((i) => new Date(i.week_start).getTime()),
  ];
  const earliestDataDate = allTimestamps.length ? new Date(Math.min(...allTimestamps)) : now;
  const availablePeriods = EXERCISE_PROGRESS_PERIODS.filter((p) => {
    const days = periodDays[p];
    if (days === null) return true;
    return earliestDataDate <= new Date(now.getTime() - days * 86400000);
  });

  if (!selectedId) {
    return (
      <Screen scroll={false} contentContainerStyle={styles.scrollContent}>
        <BackHeader title="Exercise Progress" onBack={() => navigation.goBack()} />
        <View style={{ marginTop: 18, flex: 1 }}>
          <Text style={[styles.sectionCardTitle, { marginBottom: 14 }]}>Your Tracked Exercises</Text>
          <ExercisePicker
            variant="browse"
            onNavigate={(exerciseId) => setSelectedId(exerciseId)}
            enabled={isAuthenticated}
            trackedOnly
            subtitle="Exercises you've logged in workouts"
          />
        </View>
      </Screen>
    );
  }

  if (progress.isPending) {
    return (
      <Screen>
        <BackHeader title="Exercise Progress" onBack={fromPicker ? () => setSelectedId(undefined) : () => navigation.goBack()} />
        <LoadingCard label="Loading progress..." />
      </Screen>
    );
  }

  if (progress.isError) {
    return (
      <Screen>
        <BackHeader title="Exercise Progress" onBack={fromPicker ? () => setSelectedId(undefined) : () => navigation.goBack()} />
        <ErrorCard error={progress.error} onRetry={() => progress.refetch()} />
      </Screen>
    );
  }

  const exerciseName = progress.data?.exercise_name ?? "Exercise";

  return (
    <Screen>
      <BackHeader title={exerciseName} subtitle="Exercise Progress" onBack={fromPicker ? () => setSelectedId(undefined) : () => navigation.goBack()} />

      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard label="Current e1RM" value={`${current} kg`} valueColor={COLORS.teal} />
        <CompactStatCard label="Gain" value={`${gain >= 0 ? "+" : ""}${Math.round(gain)} kg`} valueColor={gain >= 0 ? COLORS.green : COLORS.red} />
        <CompactStatCard label="All-time PR" value={`${current} kg`} valueColor={COLORS.gold} />
      </View>

      {e1rmData.length > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionCardTitle}>e1RM History</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {availablePeriods.map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setPeriod(entry)}
                  style={[
                    styles.periodChip,
                    period === entry ? { backgroundColor: "rgba(255,90,54,0.2)", borderColor: "rgba(255,90,54,0.35)" } : null,
                  ]}
                >
                  <Text style={[styles.periodChipText, period === entry ? { color: COLORS.teal } : null]}>{entry}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={{ marginTop: 14 }}>
            <TrendChart data={e1rmData} color={COLORS.teal} height={128} />
          </View>
        </Card>
      ) : null}

      {volumeData.length > 0 ? (
        <Card style={{ marginTop: 14 }}>
          <Text style={styles.sectionCardTitle}>Weekly Volume</Text>
          <View style={{ marginTop: 12 }}>
            <VerticalBars data={volumeData} height={90} />
          </View>
        </Card>
      ) : null}

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>Recent Overloads</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {(progress.data?.progressive_overload ?? []).map((entry) => (
            <Card key={`${entry.current_session_id}-${entry.performed_at}`} style={styles.listRowCard}>
              <View style={[styles.softIconWrap, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
                <Feather name="award" size={13} color={COLORS.green} />
              </View>
              <View style={styles.listRowBody}>
                <View style={styles.rowGapTiny}>
                  <Text style={[styles.smallStrongText, { color: COLORS.green }]}>+{formatVolume(entry.volume_load_delta)}</Text>
                  <Text style={styles.detailLabel}>- volume</Text>
                </View>
                <Text style={styles.listMeta}>
                  {formatShortDate(entry.performed_at)} - session {entry.current_session_id}
                </Text>
              </View>
            </Card>
          ))}
          {progress.data?.progressive_overload.length === 0 ? (
            <Text style={styles.detailLabel}>No overload comparisons yet.</Text>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
