import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useExerciseProgressQuery } from "../api/queries";
import { EXERCISE_PROGRESS_PERIODS } from "../data";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { CompactStatCard } from "../components/ui/Stats";
import { TrendChart, VerticalBars } from "../components/ui/Charts";
import { SectionEyebrow } from "../components/ui/Indicators";
import { Icon } from "../components/ui/Icon";
import { ExercisePicker } from "../components/ExercisePicker";
import { formatShortDate, formatVolume } from "../utils/format";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ExerciseProgress">;
  route: RouteProp<RootStackParamList, "ExerciseProgress">;
};

export function ExerciseProgressScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const routeId = route.params?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(routeId);
  const fromPicker = !routeId;
  const [period, setPeriod] = useState<string>("1M");
  const weeks = period === "1M" ? 4 : period === "3M" ? 12 : period === "6M" ? 24 : period === "1Y" ? 52 : undefined;
  const progress = useExerciseProgressQuery(selectedId, weeks ? { weeks } : {}, isAuthenticated);
  const periods = !selectedId ? [] : EXERCISE_PROGRESS_PERIODS;

  const e1rmChartData = progress.data?.e1rm_history?.map((p) => ({
    value: p.default_e1rm ?? 0,
    label: formatShortDate(p.performed_at),
  }));
  const volumeChartData = progress.data?.weekly_volume_history?.map((w) => ({
    label: formatShortDate(w.week_start),
    value: w.volume_load,
  }));

  return (
    <Screen>
      <BackHeader title="Exercise Progress" onBack={() => navigation.goBack()} />

      {fromPicker ? (
        <View style={{ marginTop: SPACING.xl3 }}>
          <ExercisePicker
            variant="browse"
            title="Select Exercise"
            enabled={isAuthenticated}
            onSelect={(exercise) => {
              setSelectedId(exercise.id);
            }}
            onNavigate={(id) => {
              setSelectedId(id);
            }}
          />
        </View>
      ) : null}

      {selectedId && periods.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, marginTop: SPACING.xl3 }}>
          {periods.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodChip,
                {
                  borderRadius: RADIUS.tag,
                  borderWidth: 1,
                  borderColor: period === p ? "rgba(255,90,54,0.4)" : "transparent",
                  backgroundColor: period === p ? "rgba(255,90,54,0.15)" : COLORS.cardSoft,
                  paddingHorizontal: SPACING.xl2,
                  paddingVertical: SPACING.sm,
                },
              ]}
            >
              <Text style={[styles.periodChipText, period === p ? { color: COLORS.teal } : { color: COLORS.muted }]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {progress.isPending ? <LoadingCard label="Loading progress..." /> : null}
      {progress.isError ? <ErrorCard error={progress.error} onRetry={() => progress.refetch()} /> : null}

      {progress.data ? (
        <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl3 }}>
          <View style={{ flexDirection: "row", gap: SPACING.lg }}>
            <CompactStatCard icon="trending-up" label="Current e1RM" value={progress.data.current_e1rm != null ? `${Math.round(progress.data.current_e1rm)} kg` : "-"} color={COLORS.teal} />
            <CompactStatCard icon="gauge" label="Best e1RM" value={progress.data.best_e1rm != null ? `${Math.round(progress.data.best_e1rm)} kg` : "-"} color={COLORS.gold} />
          </View>

          {(e1rmChartData?.length ?? 0) > 0 ? (
            <Card elevated>
              <SectionEyebrow>e1RM History</SectionEyebrow>
              <View style={{ marginTop: SPACING.xl }}>
                <TrendChart segments={[e1rmChartData!]} height={120} color={COLORS.teal} />
              </View>
            </Card>
          ) : null}

          {(volumeChartData?.length ?? 0) > 0 ? (
            <Card elevated>
              <SectionEyebrow>Weekly Volume</SectionEyebrow>
              <View style={{ marginTop: SPACING.xl }}>
                <VerticalBars data={volumeChartData!} barColor={COLORS.teal} />
              </View>
            </Card>
          ) : null}

          {(progress.data.progressive_overload?.length ?? 0) > 0 ? (
            <View>
              <SectionEyebrow>Progressive Overload</SectionEyebrow>
              <View style={{ gap: SPACING.lg, marginTop: SPACING.xl }}>
                {progress.data.progressive_overload.map((entry, i) => (
                  <Card key={i} elevated>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.cardTitle}>{entry.current_best_weight_kg ?? "-"} kg × {entry.current_best_reps ?? "-"} reps</Text>
                        <Text style={styles.listMeta}>{formatShortDate(entry.performed_at)}</Text>
                      </View>
                      <Icon name="trophy" size={18} color={COLORS.gold} />
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {!selectedId ? (
        <Card elevated style={{ marginTop: SPACING.xl3 }}>
          <View style={{ alignItems: "center", gap: SPACING.xl, paddingVertical: SPACING.xl4 }}>
            <View style={{ width: 48, height: 48, borderRadius: RADIUS.iconWrap, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }}>
              <Icon name="search" size={24} color={COLORS.faint} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: COLORS.text }]}>Select an exercise</Text>
            <Text style={styles.emptyStateText}>Choose an exercise above to view its progress.</Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
