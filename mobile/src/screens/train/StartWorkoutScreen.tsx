import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ListCard, PrimaryButton, Screen, ScreenState, SectionEyebrow } from "../../components";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";
import { useWorkoutTemplatesQuery } from "../../features/templates/hooks";
import { useCreateWorkoutSessionMutation } from "../../features/workouts/hooks";
import { isApiError } from "../../lib/api/error";

type Props = RootStackScreenProps<"StartWorkout">;

export function StartWorkoutScreen({ navigation, route }: Props): React.JSX.Element {
  const templatesQuery = useWorkoutTemplatesQuery();
  const createSessionMutation = useCreateWorkoutSessionMutation();
  const [error, setError] = useState("");
  const autostartedRef = useRef(false);
  const requestedTemplateId = route.params?.templateId;

  const handleStartEmptyWorkout = async (): Promise<void> => {
    setError("");

    try {
      const session = await createSessionMutation.mutateAsync({
        name: "Workout Session",
      });
      navigation.replace("ActiveWorkout", { sessionId: session.id });
    } catch (submissionError) {
      setError(isApiError(submissionError) ? submissionError.message : "Unable to create a workout session.");
    }
  };

  const handleStartTemplate = async (
    templateId: number,
    templateName: string,
  ): Promise<void> => {
    setError("");

    try {
      const session = await createSessionMutation.mutateAsync({
        template_id: templateId,
        name: templateName,
      });
      navigation.replace("ActiveWorkout", { sessionId: session.id });
    } catch (submissionError) {
      setError(isApiError(submissionError) ? submissionError.message : "Unable to create a workout session.");
    }
  };

  useEffect(() => {
    if (!requestedTemplateId || autostartedRef.current || !templatesQuery.data) {
      return;
    }

    const matchedTemplate = templatesQuery.data.find((template) => template.id === requestedTemplateId);
    if (!matchedTemplate) {
      return;
    }

    autostartedRef.current = true;
    void handleStartTemplate(matchedTemplate.id, matchedTemplate.name);
  }, [requestedTemplateId, templatesQuery.data]);

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Start Workout</Text>
          <Text style={styles.subtitle}>Create a real backend workout session</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.teal}>Quick Start</SectionEyebrow>
        <View style={styles.quickStartCard}>
          <Text style={styles.quickStartEmoji}>⚡</Text>
          <Text style={styles.quickStartName}>Empty Workout</Text>
          <Text style={styles.quickStartDesc}>
            Start with a blank session and add exercises as you go.
          </Text>
          <PrimaryButton
            label={createSessionMutation.isPending ? "Creating Session..." : "Start Empty Workout"}
            onPress={() => {
              void handleStartEmptyWorkout();
            }}
            disabled={createSessionMutation.isPending}
            icon={
              createSessionMutation.isPending ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Feather name="play" size={16} color="#000000" />
              )
            }
            style={{ marginTop: 18 }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Templates</SectionEyebrow>
        {templatesQuery.isLoading && !templatesQuery.data ? (
          <ScreenState title="Loading templates" loading message="Fetching /workout-templates" />
        ) : null}

        {templatesQuery.isError ? (
          <ScreenState
            title="Templates unavailable"
            message="The app could not load your saved workout templates."
            actionLabel="Retry"
            onAction={() => {
              void templatesQuery.refetch();
            }}
          />
        ) : null}

        {templatesQuery.data?.length ? (
          <View style={{ marginTop: 12 }}>
            {templatesQuery.data.map((template) => (
              <ListCard
                key={template.id}
                iconEmoji="🏋️"
                name={template.name}
                color={COLORS.teal}
                subtitle={template.description ?? "Saved workout template"}
                onPress={() => {
                  void handleStartTemplate(template.id, template.name);
                }}
                rightElement={
                  createSessionMutation.isPending ? (
                    <ActivityIndicator color={COLORS.teal} />
                  ) : undefined
                }
                showPlayButton={!createSessionMutation.isPending}
              />
            ))}
          </View>
        ) : null}

        {templatesQuery.data && templatesQuery.data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubtext}>
              Template creation is part of the next implementation slice.
            </Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {},
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  section: { marginTop: 28 },
  quickStartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },
  quickStartEmoji: { fontSize: 34 },
  quickStartName: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginTop: 10 },
  quickStartDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptySubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
  errorBox: {
    marginTop: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  errorText: { color: COLORS.red, fontSize: 12 },
});
