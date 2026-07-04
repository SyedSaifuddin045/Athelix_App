import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/expo";
import { Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "../types/navigation";
import { getCardioActivity, iconForActivity } from "../utils/cardio";
import { createWorkoutSessionWorkoutSessionsPost, createExerciseSetWorkoutSessionsSessionIdSetsPost } from "../api/endpoints/workout-sessions/workout-sessions";
import type { ExerciseSetCreate } from "../api/model/exerciseSetCreate";
import type { WorkoutSessionResponse } from "../api/model/workoutSessionResponse";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { AppIcon } from "../design-system/icons/AppIcon";
import { queryKeys } from "../api/queryKeys";
import { useProfileQuery } from "../api/queries";
import { getApiErrorMessage } from "../api/client";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ControlVariant = "start" | "pause" | "resume" | "outline";

function ControlButton({
  label,
  iconName,
  onPress,
  variant,
  disabled,
}: {
  label: string;
  iconName: string;
  onPress?: () => void;
  variant: ControlVariant;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const borderCol = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface2 = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";

  const isSolid = variant === "start" || variant === "resume";
  const isPause = variant === "pause";
  const isOutline = variant === "outline";

  const bgColor = isSolid
    ? accent
    : isPause
      ? surface2
      : "transparent";
  const txtColor = isSolid ? "#000000" : mutedColor;
  const iconColor = isSolid ? "#000000" : mutedColor;
  const border = isOutline ? borderCol : "transparent";
  const borderW = isOutline ? 1 : 0;

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 24,
          height: 52,
          borderRadius: radii.button,
          backgroundColor: bgColor,
          borderWidth: borderW,
          borderColor: border,
          opacity: disabled ? 0.4 : 1,
        },
        isSolid && {
          shadowColor: accent,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
        animatedStyle,
      ]}
    >
      <AppIcon name={iconName} size={18} color={iconColor} />
      <Text
        style={{
          color: txtColor,
          fontSize: 15,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

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
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const { data: profile } = useProfileQuery(isAuthenticated);
  const bodyWeightKg = profile?.weight_kg ?? 80;
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const redColor = theme.colorRed?.get() ?? "#EF4444";
  const surfaceHover = theme.surfaceHover?.get() ?? "rgba(255,255,255,0.06)";
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
      const distKm = parseFloat(distanceKm) || 0;

      const sessionRes = await createWorkoutSessionWorkoutSessionsPost({
        name: activity.label,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        is_completed: true,
      });
      const session = sessionRes.data as WorkoutSessionResponse;

      const estimatedCalories = distKm > 0 && elapsedSec > 0
        ? Math.round(parseFloat(activity.exerciseId.includes("walk") ? "0.5" : "1.036") * bodyWeightKg * distKm)
        : 0;

      const setPayload: ExerciseSetCreate = {
        exercise_id: activity.exerciseId,
        set_number: 1,
        set_type: "normal",
        duration_sec: elapsedSec,
        distance_m: distKm * 1000,
        calories_burned: estimatedCalories,
        rpe,
        notes: notes || undefined,
      };
      await createExerciseSetWorkoutSessionsSessionIdSetsPost(session.id, setPayload);

      queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
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
      ? Math.round(parseFloat(activity.exerciseId.includes("walk") ? "0.5" : "1.036") * bodyWeightKg * distNum)
      : null;

    return (
      <Screen>
        <BackHeader title="Finish" onBack={() => setPhase("paused")} />
        <View style={{ flex: 1, paddingTop: spacing.xl3, gap: spacing.xl2 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, color: textColor, fontWeight: "700" }}>{activity.label}</Text>
            <Text style={{ fontSize: 14, color: mutedColor, marginTop: spacing.xs }}>Duration: {formatTimer(elapsedSec)}</Text>
          </View>

          <View>
            <Text style={[{ color: mutedColor, fontSize: 11, lineHeight: 16 }, { marginBottom: spacing.sm }]}>Distance (km)</Text>
            <TextInput
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={faintColor}
              style={{
                backgroundColor: surfaceHover,
                color: textColor,
                fontSize: 20,
                fontWeight: "600",
                padding: spacing.md,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: borderColor,
              }}
            />
          </View>

          <View>
            <Text style={[{ color: mutedColor, fontSize: 11, lineHeight: 16 }, { marginBottom: spacing.sm }]}>RPE (1-10)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {[1,2,3,4,5,6,7,8,9,10].map((val) => {
                const isSelected = val === rpe;
                return (
                  <Pressable
                    key={val}
                    onPress={() => setRpe(val)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isSelected ? accent : surfaceHover,
                      borderWidth: 1,
                      borderColor: isSelected ? accent : borderColor,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: isSelected ? "#000" : textColor, fontSize: 15, fontWeight: "700" }}>{val}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={[{ color: mutedColor, fontSize: 11, lineHeight: 16 }, { marginBottom: spacing.sm }]}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it feel?"
              placeholderTextColor={faintColor}
              style={{
                backgroundColor: surfaceHover,
                color: textColor,
                fontSize: 16,
                padding: spacing.md,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: borderColor,
                minHeight: 60,
                textAlignVertical: "top",
              }}
              multiline
            />
          </View>

          {estimatedCalories ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ fontSize: 16 }}>🔥</Text>
              <Text style={{ fontSize: 16, color: textColor, fontWeight: "600" }}>
                ~{estimatedCalories} kcal estimated
              </Text>
            </View>
          ) : null}

          {error ? (
            <View
              style={{
                backgroundColor: "rgba(239,68,68,0.12)",
                borderRadius: radii.card,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.25)",
              }}
            >
              <Text style={{ color: redColor, fontSize: 13 }}>{error}</Text>
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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xl4 }}>
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
          <AppIcon name={iconForActivity(route.params.activityType)} size={36} color={accent} />
        </View>
        <Text style={{ fontSize: 22, color: textColor, fontWeight: "700" }}>{activity.label}</Text>

        {phase === "idle" && activity.instructions?.length ? (
          <View style={{ width: "100%", paddingHorizontal: spacing.xl5, gap: spacing.sm, marginBottom: spacing.xs }}>
            <Pressable onPress={() => setExpanded((e) => !e)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <AppIcon name={expanded ? "chevron-down" : "chevron-right"} size={14} color={mutedColor} />
              <Text style={{ color: mutedColor, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Instructions
              </Text>
            </Pressable>
            {expanded ? (
              <View style={{ gap: spacing.xs, paddingLeft: spacing.lg }}>
                {activity.instructions.map((step: string, i: number) => (
                  <View key={i} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
                    <Text style={{ color: accent, fontSize: 12, fontWeight: "700", width: 16 }}>{i + 1}.</Text>
                    <Text style={{ flex: 1, color: mutedColor, fontSize: 13, lineHeight: 18 }}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={{ fontSize: 48, color: textColor, fontWeight: "200", fontVariant: ["tabular-nums"] }}>
          {formatTimer(elapsedSec)}
        </Text>
        {isRunning ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: redColor }} />
            <Text style={{ color: redColor, fontSize: 12, fontWeight: "600" }}>REC</Text>
          </View>
        ) : (
          <View style={{ height: 20 }} />
        )}
        {phase === "idle" ? (
          <ControlButton label="Start" iconName="play" onPress={startTimer} variant="start" />
        ) : (
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <ControlButton
              label={isRunning ? "Pause" : "Resume"}
              iconName={isRunning ? "pause" : "play"}
              onPress={isRunning ? pauseTimer : resumeTimer}
              variant={isRunning ? "pause" : "resume"}
            />
            <ControlButton
              label="Finish"
              iconName="check"
              onPress={finishTimer}
              disabled={!canFinish}
              variant="outline"
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
