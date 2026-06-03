import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usePostHog } from "posthog-react-native";

import { useAuth } from "../auth/AuthProvider";
import { useTemplatesQuery, useMesocyclesQuery } from "../api/queries";
import { createWorkoutSessionWorkoutSessionsPost } from "../api/endpoints/workout-sessions/workout-sessions";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { Radio, SelectableRow } from "../components/ui/Input";
import { SectionEyebrow } from "../components/ui/Indicators";
import { MetaInline } from "../components/ui/Stats";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { toNumberId } from "../utils/helpers";
import { successData } from "../utils/mapping";
import { formatShortDate } from "../utils/format";
import { Events } from "../analytics/events";

export function StartWorkoutScreen({ navigation, route }: { navigation: any; route?: { params?: { id?: string } } }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const id = route?.params?.id;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(id ?? null);
  const [selectedMeso, setSelectedMeso] = useState<string | null>(null);
  const templates = useTemplatesQuery(auth.isAuthenticated);
  const mesocycles = useMesocyclesQuery(auth.isAuthenticated);
  const startSession = useMutation({
    mutationFn: async ({ templateId }: { templateId?: string | null }) => {
      const template = templates.data?.find((item) => String(item.id) === templateId);
      const response = await createWorkoutSessionWorkoutSessionsPost({
        template_id: toNumberId(templateId),
        mesocycle_id: toNumberId(selectedMeso),
        name: template?.name ?? "Workout",
        started_at: new Date().toISOString(),
        is_completed: false,
      });
      return successData(response);
    },
    onSuccess: (session, variables) => {
      const template = templates.data?.find((item) => String(item.id) === variables.templateId);
      const hasTemplate = !!variables.templateId;
      posthog.capture(Events.WORKOUT_STARTED, {
        source: hasTemplate ? "template" : "empty",
        has_mesocycle: !!selectedMeso,
        ...(hasTemplate && template
          ? { template_id: variables.templateId, template_name: template.name }
          : {}),
      });
      if (hasTemplate && template && variables.templateId) {
        posthog.capture(Events.TEMPLATE_USED, {
          template_id: variables.templateId,
          template_name: template.name,
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      navigation.replace("ActiveWorkout", {
        sessionId: session.id,
        templateId: variables.templateId ?? undefined,
        mesocycleId: selectedMeso,
      });
    },
  });

  return (
    <Screen>
      <BackHeader title="Start Workout" subtitle="Choose how to begin" onBack={() => navigation.goBack()} />

      <Pressable onPress={() => startSession.mutate({ templateId: null })} style={{ marginTop: 18 }} disabled={startSession.isPending}>
        <Card style={{ borderColor: "rgba(255,90,54,0.3)", backgroundColor: "rgba(255,90,54,0.12)" }}>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={[styles.sectionIconWrapSmall, { backgroundColor: "rgba(255,90,54,0.2)" }]}>
                <Feather name="zap" size={22} color={COLORS.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Empty Workout</Text>
                <Text style={styles.detailLabel}>Start from scratch</Text>
              </View>
            </View>
            <Feather name="play" size={20} color={COLORS.teal} />
          </View>
        </Card>
      </Pressable>

      <View style={{ marginTop: 20 }}>
        <SectionEyebrow>Attach to Mesocycle (optional)</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          <SelectableRow selected={selectedMeso === null} onPress={() => setSelectedMeso(null)} label="No mesocycle" />
          {(mesocycles.data ?? []).map((meso) => (
            <SelectableRow
              key={meso.id}
              selected={selectedMeso === String(meso.id)}
              onPress={() => setSelectedMeso(String(meso.id))}
              label={meso.name}
              sublabel={meso.goal ?? `${meso.weeks ?? "-"} weeks`}
              color={COLORS.purple}
            />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionEyebrow>From Template</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {templates.isPending ? <LoadingCard label="Loading templates..." /> : null}
          {(templates.data ?? []).map((template) => (
            <Pressable key={template.id} onPress={() => setSelectedTemplate((current) => (current === String(template.id) ? null : String(template.id)))}>
              <Card
                style={{
                  borderColor: selectedTemplate === String(template.id) ? "rgba(255,90,54,0.44)" : COLORS.border,
                  backgroundColor: selectedTemplate === String(template.id) ? "rgba(255,90,54,0.12)" : COLORS.card,
                }}
              >
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flex: 1, alignItems: "flex-start" }]}>
                    <Radio selected={selectedTemplate === String(template.id)} color={COLORS.teal} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{template.name}</Text>
                      <View style={[styles.rowGapLarge, { marginTop: 6 }]}>
                        <MetaInline
                          icon={<MaterialCommunityIcons name="dumbbell" size={10} color="rgba(255,255,255,0.32)" />}
                          text={template.description ?? "Template"}
                        />
                        <MetaInline icon={<Feather name="calendar" size={10} color="rgba(255,255,255,0.32)" />} text={formatShortDate(template.updated_at)} />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.listMeta}>{template.is_public ? "Public" : "Private"}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      <PrimaryButton
        label={
          selectedTemplate
            ? `Start with ${templates.data?.find((item) => String(item.id) === selectedTemplate)?.name ?? "template"}`
            : "Start Workout"
        }
        onPress={() => startSession.mutate({ templateId: selectedTemplate })}
        disabled={startSession.isPending}
        icon={startSession.isPending ? <ActivityIndicator color="#000000" /> : <Feather name="play" size={18} color="#000000" />}
        style={{ marginTop: 22 }}
      />
      {startSession.isError ? (
        <View style={[styles.errorBox, { marginTop: 12 }]}>
          <Text style={styles.errorText}>{getApiErrorMessage(startSession.error)}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
