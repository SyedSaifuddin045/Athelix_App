import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useExerciseDetailQuery } from "../api/queries";
import { mapExerciseDetail } from "../utils/mapping";
import { CARDIO_ACTIVITIES } from "../utils/cardio";
import { muscleAccentColor } from "../utils/display";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Screen } from "../components/ui/Layout";
import { Card, ErrorCard } from "../components/ui/Card";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow, Tag } from "../components/ui/Indicators";
import { AppIcon } from "../design-system/icons/AppIcon";
import { Events } from "../analytics/events";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ExerciseDetail">;
  route: RouteProp<RootStackParamList, "ExerciseDetail">;
};

export function ExerciseDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const posthog = usePostHog();
  const { id } = route.params;
  const exerciseQuery = useExerciseDetailQuery(id, isAuthenticated);
  const rawExercise = exerciseQuery.data ? mapExerciseDetail(exerciseQuery.data) : null;
  const exercise = rawExercise?.instructions?.length
    ? rawExercise
    : rawExercise && {
        ...rawExercise,
        instructions: CARDIO_ACTIVITIES.find((a) => a.exerciseId === id)?.instructions ?? [],
      };

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const goldColor = theme.colorGold?.get() ?? "#FBBF24";

  useEffect(() => {
    if (exercise) {
      posthog.capture(Events.EXERCISE_DETAIL_VIEWED, {
        exercise_name: exercise.name,
        exercise_id: id,
        muscle_group: exercise.primaryMuscle,
      });
    }
  }, [id, exercise?.name]);

  return (
    <Screen>
      <BackHeader
        title="Exercise Detail"
        onBack={() => navigation.goBack()}
        right={exercise ? (
          <Pressable onPress={() => navigation.navigate("ExerciseProgress", { id })}>
            <Tag label="View Progress" color={accent} />
          </Pressable>
        ) : undefined}
      />

      {exerciseQuery.isPending ? (
        <View style={{ alignItems: "center", paddingVertical: 60 }}>
          <ActivityIndicator color={accent} size="small" />
        </View>
      ) : exercise ? (
        <>
          <Card elevated accentColor={muscleAccentColor(exercise.primaryMuscle)} style={{ marginTop: spacing.xl3 }}>
            <Text style={{ fontSize: 21, fontWeight: "900", color: textColor }}>{exercise.name}</Text>
          </Card>

          <View style={{ gap: spacing.xl, marginTop: spacing.xl3 }}>
            <Card elevated>
              <SectionEyebrow>Muscles Targeted</SectionEyebrow>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl }}>
                {exercise.primaryMuscle ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.tag, backgroundColor: "rgba(255,90,54,0.15)", borderWidth: 1, borderColor: "rgba(255,90,54,0.3)" }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
                    <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>{exercise.primaryMuscle}</Text>
                  </View>
                ) : null}
                {(exercise.secondaryMuscles ?? []).map((muscle: string) => (
                  <View key={muscle} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.tag, backgroundColor: surface2Color, borderWidth: 1, borderColor }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: mutedColor }} />
                    <Text style={{ color: mutedColor, fontSize: 12 }}>{muscle}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {exercise.equipment ? (
              <Card elevated>
                <SectionEyebrow>Equipment</SectionEyebrow>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.tag, backgroundColor: surface2Color, borderWidth: 1, borderColor }}>
                    <AppIcon name="wrench" size={12} color={mutedColor} />
                    <Text style={{ color: mutedColor, fontSize: 12 }}>{exercise.equipment}</Text>
                  </View>
                </View>
              </Card>
            ) : null}

            {exercise.instructions?.length ? (
              <Card elevated>
                <SectionEyebrow>Instructions</SectionEyebrow>
                <View style={{ gap: spacing.xl2, marginTop: spacing.xl }}>
                  {exercise.instructions.map((step: string, i: number) => (
                    <View key={i} style={{ flexDirection: "row", gap: spacing.xl }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,90,54,0.2)" }}>
                        <Text style={{ color: accent, fontSize: 11, fontWeight: "800" }}>{i + 1}</Text>
                      </View>
                      <Text style={{ flex: 1, color: mutedColor, fontSize: 13, lineHeight: 20 }}>{step}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {exercise.tips?.length ? (
              <Card elevated>
                <SectionEyebrow>Tips</SectionEyebrow>
                <View style={{ gap: spacing.xl, marginTop: spacing.xl }}>
                  {exercise.tips.map((tip: string, i: number) => (
                    <View key={i} style={{ flexDirection: "row", gap: spacing.lg }}>
                      <AppIcon name="lightbulb" size={14} color={goldColor} style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, color: mutedColor, fontSize: 13, lineHeight: 18 }}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}
          </View>
        </>
      ) : (
        <ErrorCard error={new Error("Exercise not found")} />
      )}
    </Screen>
  );
}
