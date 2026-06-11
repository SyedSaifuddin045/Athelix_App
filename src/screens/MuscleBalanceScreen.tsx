import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import type { MuscleGroupExerciseItemResponse } from "../api/model";
import type { MuscleGroupBalanceItemResponse } from "../api/model";
import { useAuth } from "@clerk/expo";
import { useMuscleBalanceQuery } from "../api/queries";
import { MUSCLE_PERIODS } from "../data";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { Tag } from "../components/ui/Indicators";
import { muscleAccentColor } from "../utils/display";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "MuscleBalance">;
  route: RouteProp<RootStackParamList, "MuscleBalance">;
};

const STATUS_COLORS: Record<string, string> = {
  Strong: COLORS.green,
  Balanced: COLORS.blue,
  "Needs Attention": COLORS.red,
};

function VolumeBar({
  current,
  average,
  color,
}: {
  current: number;
  average: number;
  color: string;
}) {
  const maxVal = Math.max(current, average, 1);
  const fillPercent = (current / maxVal) * 100;
  const refPercent = (average / maxVal) * 100;

  return (
    <View style={{ marginTop: SPACING.lg }}>
      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.08)",
          position: "relative",
          overflow: "visible",
        }}
      >
        <View
          style={{
            height: "100%",
            borderRadius: 999,
            width: `${fillPercent}%`,
            backgroundColor: color,
          }}
        />
        {average > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -2,
              left: `${refPercent}%`,
              width: 2,
              height: 12,
              borderRadius: 1,
              backgroundColor: "rgba(255,255,255,0.25)",
              marginLeft: -1,
            }}
          />
        ) : null}
      </View>
      <Text style={[styles.detailLabel, { marginTop: SPACING.xs }]}>
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
  const fillPercent = (exercise.completed_sets / maxVal) * 100;

  return (
    <View style={[styles.rowGap, { paddingLeft: SPACING.xl }]}>
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <Text style={[styles.listMeta, { flex: 1 }]} numberOfLines={1}>
        {exercise.exercise_name}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
        <View
          style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              borderRadius: 2,
              width: `${fillPercent}%`,
              backgroundColor: color,
            }}
          />
        </View>
        <Text style={styles.smallStrongText}>
          {exercise.completed_sets} · {exercise.average_weekly_sets}
        </Text>
      </View>
    </View>
  );
}

export function MuscleBalanceScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const [period, setPeriod] = useState("1W");
  const [expanded, setExpanded] = useState<string | null>(null);
  const weeks = period === "1W" ? 1 : period === "2W" ? 2 : period === "4W" ? 4 : 8;
  const mesocycleId = route?.params?.mesocycleId ?? undefined;
  const report = useMuscleBalanceQuery({ weeks, mesocycle_id: mesocycleId }, isAuthenticated);
  const items = report.data?.items ?? [];

  return (
    <Screen>
      <BackHeader title="Muscle Balance" subtitle="Training volume distribution" onBack={() => navigation.goBack()} />

      <View
        style={[
          styles.segmentedWrap,
          {
            flexDirection: "row",
            backgroundColor: COLORS.cardSoft,
            borderRadius: RADIUS.input,
            padding: SPACING.xs,
            marginTop: SPACING.xl3,
          },
        ]}
      >
        {MUSCLE_PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.segmentedOption,
              {
                flex: 1,
                minHeight: 38,
                borderRadius: RADIUS.input - 4,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: period === p ? COLORS.borderLight : "transparent",
                backgroundColor: period === p ? COLORS.card : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.segmentedText,
                period === p ? { color: COLORS.text } : { color: COLORS.muted },
              ]}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      {report.isPending ? <LoadingCard label="Analyzing muscle balance..." /> : null}
      {report.isError ? <ErrorCard error={report.error} onRetry={() => report.refetch()} /> : null}

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl }}>
        {items.map((item: MuscleGroupBalanceItemResponse) => {
          const isExpanded = expanded === item.muscle_group;
          const accent = muscleAccentColor(item.muscle_group) ?? "rgba(255,255,255,0.2)";
          return (
            <Card key={item.muscle_group} elevated accentColor={accent}>
              <Pressable onPress={() => setExpanded(isExpanded ? null : item.muscle_group)}>
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: accent,
                      }}
                    />
                    <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
                      {item.muscle_group}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
                    <Text style={[styles.cardTitle, { color: COLORS.text }]}>
                      {item.score}%
                    </Text>
                    <Tag label={item.status} color={STATUS_COLORS[item.status] ?? COLORS.muted} />
                  </View>
                </View>

                <VolumeBar
                  current={item.weekly_sets}
                  average={item.average_weekly_sets}
                  color={accent}
                />
              </Pressable>

              {isExpanded && item.exercises.length > 0 ? (
                <View style={{ marginTop: SPACING.xl2, gap: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                  {item.exercises.map((ex: MuscleGroupExerciseItemResponse) => (
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
