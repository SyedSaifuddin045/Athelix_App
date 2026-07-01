import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import type { MuscleGroupExerciseItemResponse } from "../api/model";
import type { MuscleGroupBalanceItemResponse } from "../api/model";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useMuscleBalanceQuery } from "../api/queries";
import { MUSCLE_PERIODS } from "../data";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { Tag } from "../components/ui/Indicators";
import { muscleAccentColor } from "../utils/display";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "MuscleBalance">;
  route: RouteProp<RootStackParamList, "MuscleBalance">;
};

function VolumeBar({
  current,
  average,
  color,
  score,
}: {
  current: number;
  average: number;
  color: string;
  score: number;
}) {
  const fillPercent = Math.min(Math.max(score / 100, 0), 1);
  const maxVal = Math.max(current, average, 1);
  const refPercent = average > 0 ? average / maxVal : 0;
  const shouldShowRef = average > 0 && current > 0 && refPercent < 0.95;

  return (
    <View style={{ marginTop: spacing.lg }}>
      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.08)",
          position: "relative",
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        <View
          style={{
            height: "100%",
            borderRadius: 999,
            flex: fillPercent,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            flex: 1 - fillPercent,
          }}
        />
        {shouldShowRef ? (
          <View
            style={{
              position: "absolute",
              top: -2,
              left: `${refPercent * 100}%`,
              width: 2,
              height: 12,
              borderRadius: 1,
              backgroundColor: "rgba(255,255,255,0.25)",
              marginLeft: -1,
            }}
          />
        ) : null}
      </View>
      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16, marginTop: spacing.xs }}>
        {current} set{current !== 1 ? "s" : ""} this period · {average} avg
      </Text>
    </View>
  );
}

function ExerciseRow({
  exercise,
  color,
}: {
  exercise: MuscleGroupExerciseItemResponse;
  color: string;
}) {
  const maxVal = Math.max(exercise.completed_sets, exercise.average_weekly_sets, 1);
  const fillPercent = exercise.completed_sets / maxVal;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: spacing.xl }}>
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <Text style={{ color: "rgba(255,255,255,0.34)", fontSize: 10, flex: 1 }} numberOfLines={1}>
        {exercise.exercise_name}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
            flexDirection: "row",
          }}
        >
          <View
            style={{
              height: "100%",
              borderRadius: 2,
              flex: fillPercent,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              flex: 1 - fillPercent,
            }}
          />
        </View>
        <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>
          {exercise.completed_sets} · {exercise.average_weekly_sets}
        </Text>
      </View>
    </View>
  );
}

export function MuscleBalanceScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const [period, setPeriod] = useState("1W");
  const [expanded, setExpanded] = useState<string | null>(null);
  const weeks = period === "1W" ? 1 : period === "2W" ? 2 : period === "4W" ? 4 : 8;
  const mesocycleId = route?.params?.mesocycleId ?? undefined;
  const report = useMuscleBalanceQuery({ weeks, mesocycle_id: mesocycleId }, isAuthenticated);
  const items = report.data?.items ?? [];

  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const surface1Color = theme.surface1?.get() ?? "rgba(255,255,255,0.04)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const borderLight = "rgba(255,255,255,0.12)";
  const greenColor = theme.colorGreen?.get() ?? "#22C55E";
  const blueColor = theme.colorBlue?.get() ?? "#3B82F6";
  const redColor = theme.colorRed?.get() ?? "#EF4444";

  const STATUS_COLORS: Record<string, string> = {
    Strong: greenColor,
    Balanced: blueColor,
    "Needs Attention": redColor,
  };

  return (
    <Screen>
      <BackHeader title="Muscle Balance" subtitle="Training volume distribution" onBack={() => navigation.goBack()} />

      <View
        style={{
          flexDirection: "row",
          backgroundColor: surface2Color,
          borderRadius: radii.input,
          padding: spacing.xs,
          marginTop: spacing.xl3,
        }}
      >
        {MUSCLE_PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: radii.input - 4,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: period === p ? borderLight : "transparent",
              backgroundColor: period === p ? surface1Color : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: period === p ? textColor : mutedColor,
              }}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      {report.isPending ? <LoadingCard label="Analyzing muscle balance..." /> : null}
      {report.isError ? <ErrorCard error={report.error} onRetry={() => report.refetch()} /> : null}

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl }}>
        {items.map((item: MuscleGroupBalanceItemResponse) => {
          const isExpanded = expanded === item.muscle_group;
          const accent = muscleAccentColor(item.muscle_group) ?? "rgba(255,255,255,0.2)";
          const exercises = item.exercises ?? [];
          return (
            <Card key={item.muscle_group} elevated accentColor={accent}>
              <Pressable onPress={() => setExpanded(isExpanded ? null : item.muscle_group)}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: accent,
                      }}
                    />
                    <Text style={{ color: textColor, fontSize: 15, fontWeight: "800", flex: 1 }} numberOfLines={1}>
                      {item.muscle_group}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>
                      {item.score}%
                    </Text>
                    <Tag label={item.status} color={STATUS_COLORS[item.status] ?? mutedColor} />
                  </View>
                </View>

                <VolumeBar
                  current={item.weekly_sets}
                  average={item.average_weekly_sets}
                  color={accent}
                  score={item.score}
                />
              </Pressable>

              {isExpanded && exercises.length > 0 ? (
                <View style={{ marginTop: spacing.xl2, gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                  {exercises.map((ex: MuscleGroupExerciseItemResponse) => (
                    <ExerciseRow key={ex.exercise_name} exercise={ex} color={accent} />
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}
        {!report.isPending && items.length === 0 ? (
          <EmptyCard title="No data yet" text="Complete sessions to see muscle balance." />
        ) : null}
      </View>
    </Screen>
  );
}
