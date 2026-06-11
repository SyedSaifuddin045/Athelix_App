import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "@clerk/expo";
import { useExerciseDetailQuery } from "../api/queries";
import { mapExerciseDetail } from "../utils/mapping";
import { DIFFICULTY_COLORS, EXERCISE_DETAILS, EXERCISE_FALLBACK } from "../data";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow, Tag } from "../components/ui/Indicators";
import { Icon } from "../components/ui/Icon";
import { Events } from "../analytics/events";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ExerciseDetail">;
  route: RouteProp<RootStackParamList, "ExerciseDetail">;
};

export function ExerciseDetailScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const posthog = usePostHog();
  const { id } = route.params;
  const exerciseQuery = useExerciseDetailQuery(id, isAuthenticated);
  const exercise = exerciseQuery.data ? mapExerciseDetail(exerciseQuery.data) : (EXERCISE_DETAILS[id ?? ""] ?? EXERCISE_FALLBACK);

  useEffect(() => {
    if (exercise) {
      posthog.capture(Events.EXERCISE_DETAIL_VIEWED, {
        exercise_name: exercise.name,
        exercise_id: id,
        muscle_group: exercise.primaryMuscle,
      });
    }
  }, [id, exercise?.name]);

  if (exerciseQuery.isPending) {
    return (
      <Screen>
        <BackHeader title="Exercise Detail" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading exercise..." />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen>
        <BackHeader title="Exercise Detail" onBack={() => navigation.goBack()} />
        <ErrorCard error={new Error("Exercise not found")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader
        title="Exercise Detail"
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={() => navigation.navigate("ExerciseProgress", { id })}>
            <Tag label="View Progress" color={COLORS.teal} />
          </Pressable>
        }
      />

      <Card elevated style={{ marginTop: SPACING.xl3 }}>
        <View style={[styles.heroCard, { flexDirection: "row", alignItems: "center", gap: SPACING.xl3 }]}>
          <View style={[styles.heroEmojiWrap, { width: 72, height: 72, borderRadius: RADIUS.card, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ fontSize: 34 }}>{exercise.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{exercise.name}</Text>
            {exercise.difficulty ? (
              <Tag label={exercise.difficulty} color={DIFFICULTY_COLORS[exercise.difficulty] ?? COLORS.muted} />
            ) : null}
          </View>
        </View>
      </Card>

      <View style={{ gap: SPACING.xl, marginTop: SPACING.xl3 }}>
        <Card elevated>
          <SectionEyebrow>Muscles Targeted</SectionEyebrow>
          <View style={[styles.filterTagRow, { gap: SPACING.md, marginTop: SPACING.xl }]}>
            {exercise.primaryMuscle ? (
              <View style={[styles.primaryMuscleTag, { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.tag, backgroundColor: "rgba(255,90,54,0.15)", borderWidth: 1, borderColor: "rgba(255,90,54,0.3)" }]}>
                <View style={[styles.primaryMuscleDot, { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.teal }]} />
                <Text style={[styles.primaryMuscleText, { color: COLORS.teal }]}>{exercise.primaryMuscle}</Text>
              </View>
            ) : null}
            {(exercise.secondaryMuscles ?? []).map((muscle: string) => (
              <View key={muscle} style={[styles.secondaryMuscleTag, { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.tag, backgroundColor: COLORS.cardSoft, borderWidth: 1, borderColor: COLORS.border }]}>
                <View style={[styles.secondaryMuscleDot, { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.muted }]} />
                <Text style={[styles.secondaryMuscleText, { color: COLORS.muted }]}>{muscle}</Text>
              </View>
            ))}
          </View>
        </Card>

        {exercise.equipment ? (
          <Card elevated>
            <SectionEyebrow>Equipment</SectionEyebrow>
            <View style={[styles.filterTagRow, { gap: SPACING.md, marginTop: SPACING.xl }]}>
              <View style={[styles.secondaryMuscleTag, { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.tag, backgroundColor: COLORS.cardSoft, borderWidth: 1, borderColor: COLORS.border }]}>
                <Icon name="wrench" size={12} color={COLORS.muted} />
                <Text style={[styles.secondaryMuscleText, { color: COLORS.muted }]}>{exercise.equipment}</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {exercise.instructions?.length ? (
          <Card elevated>
            <SectionEyebrow>Instructions</SectionEyebrow>
            <View style={{ gap: SPACING.xl2, marginTop: SPACING.xl }}>
              {exercise.instructions.map((step: string, i: number) => (
                <View key={i} style={[styles.stepRow, { flexDirection: "row", gap: SPACING.xl }]}>
                  <View style={[styles.stepBubble, { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,90,54,0.2)" }]}>
                    <Text style={[styles.stepBubbleText, { color: COLORS.teal }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { flex: 1, color: COLORS.muted }]}>{step}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {exercise.tips?.length ? (
          <Card elevated>
            <SectionEyebrow>Tips</SectionEyebrow>
            <View style={{ gap: SPACING.xl, marginTop: SPACING.xl }}>
              {exercise.tips.map((tip: string, i: number) => (
                <View key={i} style={[styles.tipRow, { flexDirection: "row", gap: SPACING.lg }]}>
                  <Icon name="lightbulb" size={14} color={COLORS.gold} style={{ marginTop: 2 }} />
                  <Text style={[styles.tipText, { flex: 1, color: COLORS.muted }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
