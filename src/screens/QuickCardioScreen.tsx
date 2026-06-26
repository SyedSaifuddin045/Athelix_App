import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "../types/navigation";
import { getCardioActivity } from "../utils/cardio";
import { iconForActivity } from "../utils/cardio";
import { createWorkoutSessionWorkoutSessionsPost } from "../api/endpoints/workout-sessions/workout-sessions";
import { createExerciseSetWorkoutSessionsSessionIdSetsPost } from "../api/endpoints/workout-sessions/workout-sessions";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { RpeStepper } from "../components/ui/RpeStepper";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../api/client";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "QuickCardio">;
  route: RouteProp<RootStackParamList, "QuickCardio">;
};

type Phase = "idle" | "running" | "paused" | "finish";

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function QuickCardioScreen({ navigation, route }: Props) {
  const activity = getCardioActivity(route.params.activityType);
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [distanceKm, setDistanceKm] = useState("");
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startTimer() {
    startTimeRef.current = new Date();
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
  }

  function pauseTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPhase("paused");
  }

  function resumeTimer() {
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
  }

  function finishTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPhase("finish");
  }

  async function handleSave() {
    if (!distanceKm || parseFloat(distanceKm) <= 0 || rpe < 1 || rpe > 10) return;
    setSaving(true);
    try {
      const now = new Date();
      const startedAt = startTimeRef.current ?? now;
      const finishedAt = now;

      const sessionRes = await createWorkoutSessionWorkoutSessionsPost({
        name: activity.label,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        is_completed: false,
      });
      const session = sessionRes.data as import("../api/model/workoutSessionResponse").WorkoutSessionResponse;

      await createExerciseSetWorkoutSessionsSessionIdSetsPost(session.id, {
        exercise_id: activity.exerciseId,
        set_number: 1,
        set_type: "normal",
        duration_sec: elapsedSec,
        distance_m: parseFloat(distanceKm) * 1000,
        rpe,
        notes: notes || undefined,
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });

      navigation.replace("SessionDetail", { id: String(session.id) });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (phase === "finish") {
    const distNum = parseFloat(distanceKm) || 0;
    const estimatedCalories = distNum > 0 && elapsedSec > 0
      ? Math.round(parseFloat(activity.exerciseId.includes("walk") ? "0.5" : "1.036") * 80 * distNum)
      : null;

    return (
      <Screen>
        <BackHeader title="Finish" onBack={() => setPhase("paused")} />
        <View style={{ flex: 1, paddingTop: SPACING.xl3, gap: SPACING.xl2 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, color: COLORS.text, fontWeight: "700" }}>{activity.label}</Text>
            <Text style={{ fontSize: 14, color: COLORS.muted, marginTop: SPACING.xs }}>Duration: {formatTimer(elapsedSec)}</Text>
          </View>

          <View>
            <Text style={[styles.detailLabel, { marginBottom: SPACING.sm }]}>Distance (km)</Text>
            <TextInput
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={COLORS.faint}
              style={{
                backgroundColor: COLORS.cardSoft,
                color: COLORS.text,
                fontSize: 20,
                fontWeight: "600",
                padding: SPACING.md,
                borderRadius: RADIUS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
          </View>

          <View>
            <Text style={[styles.detailLabel, { marginBottom: SPACING.sm }]}>RPE (1-10)</Text>
            <RpeStepper value={rpe} onChange={setRpe} />
          </View>

          <View>
            <Text style={[styles.detailLabel, { marginBottom: SPACING.sm }]}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it feel?"
              placeholderTextColor={COLORS.faint}
              style={{
                backgroundColor: COLORS.cardSoft,
                color: COLORS.text,
                fontSize: 16,
                padding: SPACING.md,
                borderRadius: RADIUS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
                minHeight: 60,
                textAlignVertical: "top",
              }}
              multiline
            />
          </View>

          {estimatedCalories ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
              <Text style={{ fontSize: 16 }}>🔥</Text>
              <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: "600" }}>
                ~{estimatedCalories} kcal estimated
              </Text>
            </View>
          ) : null}

          {error ? (
            <View
              style={{
                backgroundColor: "rgba(239,68,68,0.12)",
                borderRadius: RADIUS.card,
                padding: SPACING.md,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.25)",
              }}
            >
              <Text style={{ color: COLORS.red, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={saving ? "Saving..." : "Save Workout"}
            onPress={handleSave}
            disabled={saving || !distanceKm || parseFloat(distanceKm) <= 0}
          />
        </View>
      </Screen>
    );
  }

  const isRunning = phase === "running";
  const canFinish = phase === "running" || phase === "paused";

  return (
    <Screen>
      <BackHeader title={activity.label} onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.xl4 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: activity.color + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 36 }}>{iconForActivity(route.params.activityType)}</Text>
        </View>
        <Text style={{ fontSize: 22, color: COLORS.text, fontWeight: "700" }}>{activity.label}</Text>
        <Text style={{ fontSize: 48, color: COLORS.text, fontWeight: "200", fontVariant: ["tabular-nums"] }}>
          {formatTimer(elapsedSec)}
        </Text>
        {isRunning ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red }} />
            <Text style={{ color: COLORS.red, fontSize: 12, fontWeight: "600" }}>REC</Text>
          </View>
        ) : (
          <View style={{ height: 20 }} />
        )}
        <View style={{ flexDirection: "row", gap: SPACING.xl2 }}>
          {phase === "idle" ? (
            <PrimaryButton label="Start" onPress={startTimer} />
          ) : (
            <>
              <PrimaryButton
                label={isRunning ? "Pause" : "Resume"}
                onPress={isRunning ? pauseTimer : resumeTimer}
              />
              <PrimaryButton label="Finish" onPress={finishTimer} disabled={!canFinish} />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
