import { Pressable, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthProvider";
import { useExerciseDetailQuery } from "../api/queries";
import { mapExerciseDetail } from "../utils/mapping";
import { DIFFICULTY_COLORS, EXERCISE_DETAILS, EXERCISE_FALLBACK } from "../data";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow, Tag } from "../components/ui/Indicators";

function ExerciseDetailScreen({ navigation, route }: { navigation: any; route: { params: { id: string } } }) {
  const auth = useAuth();
  const { id } = route.params;
  const exerciseQuery = useExerciseDetailQuery(id, auth.isAuthenticated);
  const exercise = exerciseQuery.data ? mapExerciseDetail(exerciseQuery.data) : (EXERCISE_DETAILS[id ?? ""] ?? EXERCISE_FALLBACK);

  if (exerciseQuery.isPending) {
    return (
      <Screen glowColor="rgba(0,180,140,0.16)">
        <BackHeader title="Exercise Detail" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading exercise..." />
      </Screen>
    );
  }

  if (exerciseQuery.isError) {
    return (
      <Screen glowColor="rgba(0,180,140,0.16)">
        <BackHeader title="Exercise Detail" onBack={() => navigation.goBack()} />
        <ErrorCard error={exerciseQuery.error} onRetry={() => exerciseQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen glowColor="rgba(0,180,140,0.16)">
      <BackHeader
        title="Exercise Detail"
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={styles.smallAccentButton} onPress={() => navigation.navigate("TemplateBuilder")}>
            <Feather name="plus" size={13} color={COLORS.teal} />
            <Text style={styles.smallAccentText}>Add</Text>
          </Pressable>
        }
      />

      <Card style={[styles.heroCard, { marginTop: 18 }]}>
        <View style={styles.heroEmojiWrap}>
          <Text style={{ fontSize: 38 }}>{exercise.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{exercise.name}</Text>
          <View style={[styles.rowGap, { marginTop: 8 }]}>
            <Tag label={exercise.difficulty} color={DIFFICULTY_COLORS[exercise.difficulty]} />
            <Text style={styles.detailLabel}>{exercise.category}</Text>
          </View>
          <View style={[styles.rowGap, { marginTop: 10 }]}>
            <Text style={styles.detailLabel}>{exercise.equipment}</Text>
            <Text style={styles.detailLabel}>{exercise.primaryMuscle}</Text>
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionEyebrow>Muscles Worked</SectionEyebrow>
        <View style={[styles.filterTagRow, { marginTop: 12 }]}>
          <View style={styles.primaryMuscleTag}>
            <View style={styles.primaryMuscleDot} />
            <Text style={styles.primaryMuscleText}>Primary: {exercise.primaryMuscle}</Text>
          </View>
          {exercise.secondaryMuscles.map((muscle) => (
            <View key={muscle} style={styles.secondaryMuscleTag}>
              <View style={styles.secondaryMuscleDot} />
              <Text style={styles.secondaryMuscleText}>{muscle}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionEyebrow>How To</SectionEyebrow>
        <View style={{ marginTop: 12, gap: 12 }}>
          {exercise.instructions.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepBubble}>
                <Text style={styles.stepBubbleText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </Card>

      {exercise.tips.length > 0 ? (
        <Card style={{ marginTop: 14, backgroundColor: "rgba(0,212,168,0.06)", borderColor: "rgba(0,212,168,0.18)" }}>
          <SectionEyebrow color={COLORS.teal}>Pro Tips</SectionEyebrow>
          <View style={{ marginTop: 12, gap: 10 }}>
            {exercise.tips.map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <Text style={{ color: COLORS.teal }}>→</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Pressable onPress={() => navigation.navigate("ExerciseProgress", { id: id ?? "0025" })} style={{ marginTop: 14 }}>
        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <Feather name="trending-up" size={18} color={COLORS.teal} />
              <View>
                <Text style={styles.listRowTitle}>Your Progress</Text>
                <Text style={styles.detailLabel}>View e1RM history</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
          </View>
        </Card>
      </Pressable>
    </Screen>
  );
}

export default ExerciseDetailScreen;
