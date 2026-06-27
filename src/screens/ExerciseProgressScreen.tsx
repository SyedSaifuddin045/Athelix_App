import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useExerciseProgressQuery } from "../api/queries";
import { EXERCISE_PROGRESS_PERIODS } from "../data";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { CompactStatCard } from "../components/ui/Stats";
import { TrendChart, VerticalBars } from "../components/ui/Charts";
import { SectionEyebrow } from "../components/ui/Indicators";
import { AppIcon } from "../design-system/icons/AppIcon";
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
  const theme = useTheme();
  const accent = theme.accent?.toString() ?? "#FF5A36";
  const textColor = theme.color?.toString() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.toString() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.toString() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)";
  const goldColor = theme.colorGold?.toString() ?? "#FBBF24";
  const surfaceHover = theme.surfaceHover?.toString() ?? "rgba(255,255,255,0.06)";

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
        <View style={{ marginTop: spacing.xl3 }}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, marginTop: spacing.xl3 }}>
          {periods.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                borderRadius: radii.tag,
                borderWidth: 1,
                borderColor: period === p ? "rgba(255,90,54,0.4)" : "transparent",
                backgroundColor: period === p ? "rgba(255,90,54,0.15)" : surfaceHover,
                paddingHorizontal: spacing.xl2,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={[period === p ? { color: accent } : { color: mutedColor }, { fontSize: 10, fontWeight: "700" }]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {progress.isPending ? <LoadingCard label="Loading progress..." /> : null}
      {progress.isError ? <ErrorCard error={progress.error} onRetry={() => progress.refetch()} /> : null}

      {progress.data ? (
        <View style={{ marginTop: spacing.xl3, gap: spacing.xl3 }}>
          <View style={{ flexDirection: "row", gap: spacing.lg }}>
            <CompactStatCard icon="trending-up" label="Current e1RM" value={progress.data.current_e1rm != null ? `${Math.round(progress.data.current_e1rm)} kg` : "-"} color={accent} />
            <CompactStatCard icon="gauge" label="Best e1RM" value={progress.data.best_e1rm != null ? `${Math.round(progress.data.best_e1rm)} kg` : "-"} color={goldColor} />
          </View>

          {(e1rmChartData?.length ?? 0) > 0 ? (
            <Card elevated>
              <SectionEyebrow>e1RM History</SectionEyebrow>
              <View style={{ marginTop: spacing.xl }}>
                <TrendChart segments={[e1rmChartData!]} height={120} color={accent} />
              </View>
            </Card>
          ) : null}

          {(volumeChartData?.length ?? 0) > 0 ? (
            <Card elevated>
              <SectionEyebrow>Weekly Volume</SectionEyebrow>
              <View style={{ marginTop: spacing.xl }}>
                <VerticalBars data={volumeChartData!} barColor={accent} />
              </View>
            </Card>
          ) : null}

          {(progress.data.progressive_overload?.length ?? 0) > 0 ? (
            <View>
              <SectionEyebrow>Progressive Overload</SectionEyebrow>
              <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
                {progress.data.progressive_overload.map((entry, i) => (
                  <Card key={i} elevated>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View>
                        <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>{entry.current_best_weight_kg ?? "-"} kg × {entry.current_best_reps ?? "-"} reps</Text>
                        <Text style={{ color: "rgba(255,255,255,0.34)", fontSize: 10 }}>{formatShortDate(entry.performed_at)}</Text>
                      </View>
                      <AppIcon name="trophy" size={18} color={goldColor} />
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {!selectedId ? (
        <Card elevated style={{ marginTop: spacing.xl3 }}>
          <View style={{ alignItems: "center", gap: spacing.xl, paddingVertical: spacing.xl4 }}>
            <View style={{ width: 48, height: 48, borderRadius: radii.iconWrap, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="search" size={24} color={faintColor} />
            </View>
            <Text style={[{ color: textColor, fontSize: 15, fontWeight: "700" }]}>Select an exercise</Text>
            <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>Choose an exercise above to view its progress.</Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
