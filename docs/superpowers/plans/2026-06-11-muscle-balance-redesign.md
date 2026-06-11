# Muscle Balance Screen Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Muscle Balance screen to show muscle group color identity, volume comparison bars, and proper API data mapping.

**Architecture:** Single screen rewrite in `MuscleBalanceScreen.tsx` with a new card layout using existing UI primitives (Card, Tag, ProgressBar). Add `core` to `MUSCLE_COLORS` in `display.ts`. Fix API data fields (`score` → percentage, `completed_sets`/`average_weekly_sets` instead of non-existent fields, proper types).

**Tech Stack:** React Native, TypeScript, React Query

**Files:**
- Modify: `src/screens/MuscleBalanceScreen.tsx` — full rewrite of card layout
- Modify: `src/utils/display.ts` — add `core`/`ab`/`waist` to MUSCLE_COLORS

---

### Task 1: Add Core color to MUSCLE_COLORS

**Files:**
- Modify: `src/utils/display.ts:25-36`

- [ ] **Add `core` and `ab` to MUSCLE_COLORS**

```typescript
const MUSCLE_COLORS: Record<string, string> = {
  chest: "#FF5A36",
  back: "#22C55E",
  leg: "#8B5CF6",
  quad: "#8B5CF6",
  hamstring: "#8B5CF6",
  glute: "#8B5CF6",
  shoulder: "#3B82F6",
  arm: "#F59E0B",
  bicep: "#F59E0B",
  tricep: "#F59E0B",
  core: "#EC4899",
  ab: "#EC4899",
  waist: "#EC4899",
};
```

- [ ] **Run type check**

Run: `npx tsc --noEmit 2>&1 | grep -i "display"`
Expected: no errors

---

### Task 2: Rewrite MuscleBalanceScreen

**Files:**
- Modify: `src/screens/MuscleBalanceScreen.tsx` (full content)

- [ ] **Replace the entire screen file**

```typescript
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
import { Tag, ProgressBar } from "../components/ui/Indicators";
import { Icon } from "../components/ui/Icon";
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
```

- [ ] **Run type check**

Run: `npx tsc --noEmit 2>&1 | grep -i "MuscleBalance"`
Expected: no errors

- [ ] **Run full type check**

Run: `npx tsc --noEmit 2>&1`
Expected: same pre-existing errors as before (ExerciseProgressScreen, HomeScreen, MuscleBalanceScreen should no longer have errors since we fixed `any` and removed `percentage` references)

- [ ] **Run tests**

Run: `npx jest --no-cache 2>&1 | tail -20`
Expected: all tests pass
