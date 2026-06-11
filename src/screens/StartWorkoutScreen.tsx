import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTemplatesQuery, useMesocyclesQuery } from "../api/queries";
import { useStartSession } from "../api/mutations";
import { usePostHog } from "posthog-react-native";
import { getApiErrorMessage } from "../api/client";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { Radio, SelectableRow } from "../components/ui/Input";
import { SectionEyebrow } from "../components/ui/Indicators";
import { MetaInline } from "../components/ui/Stats";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { toNumberId } from "../utils/helpers";
import { formatShortDate } from "../utils/format";
import { Events } from "../analytics/events";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "StartWorkout">;
  route: RouteProp<RootStackParamList, "StartWorkout">;
};

export function StartWorkoutScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const posthog = usePostHog();
  const id = route?.params?.id;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(id ?? null);
  const [selectedMeso, setSelectedMeso] = useState<string | null>(null);
  const templates = useTemplatesQuery(isAuthenticated);
  const mesocycles = useMesocyclesQuery(isAuthenticated);
  const startSession = useStartSession({
    onSuccess: (session) => {
      const template = selectedTemplate ? templates.data?.find((item) => String(item.id) === selectedTemplate) : undefined;
      const hasTemplate = !!selectedTemplate;
      posthog.capture(Events.WORKOUT_STARTED, {
        source: hasTemplate ? "template" : "empty",
        has_mesocycle: !!selectedMeso,
        ...(hasTemplate && template ? { template_id: selectedTemplate, template_name: template.name } : {}),
      });
      if (hasTemplate && template && selectedTemplate) {
        posthog.capture(Events.TEMPLATE_USED, { template_id: selectedTemplate, template_name: template.name });
      }
      navigation.replace("ActiveWorkout", {
        sessionId: session.id,
        templateId: selectedTemplate ?? undefined,
        mesocycleId: selectedMeso,
      });
    },
  });

  return (
    <Screen>
      <BackHeader title="Start Workout" subtitle="Choose how to begin" onBack={() => navigation.goBack()} />

      <Pressable
        onPress={() =>
          startSession.mutate({ template_id: null, mesocycle_id: toNumberId(selectedMeso), name: "Workout", started_at: new Date().toISOString(), is_completed: false })
        }
        style={{ marginTop: SPACING.xl3 }}
        disabled={startSession.isPending}
      >
        <Card elevated accent="coral">
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={[styles.sectionIconWrapSmall, { backgroundColor: "rgba(255,90,54,0.2)", width: 44, height: 44, borderRadius: RADIUS.iconWrap, alignItems: "center", justifyContent: "center" }]}>
                <Icon name="zap" size={22} color={COLORS.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Empty Workout</Text>
                <Text style={styles.detailLabel}>Start from scratch</Text>
              </View>
            </View>
            <Icon name="play" size={20} color={COLORS.teal} />
          </View>
        </Card>
      </Pressable>

      <View style={{ marginTop: SPACING.xl5 }}>
        <SectionEyebrow>Attach to Mesocycle (optional)</SectionEyebrow>
        <View style={{ gap: SPACING.lg, marginTop: SPACING.xl }}>
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

      <View style={{ marginTop: SPACING.xl5 }}>
        <SectionEyebrow>From Template</SectionEyebrow>
        <View style={{ gap: SPACING.lg, marginTop: SPACING.xl }}>
          {templates.isPending ? <LoadingCard label="Loading templates..." /> : null}
          {(templates.data ?? []).map((template) => (
            <Pressable key={template.id} onPress={() => setSelectedTemplate((c) => (c === String(template.id) ? null : String(template.id)))}>
              <Card
                elevated
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
                      <View style={[styles.rowGapLarge, { marginTop: SPACING.sm }]}>
                        <MetaInline icon="dumbbell" label={template.description ?? "Template"} />
                        <MetaInline icon="calendar" label={formatShortDate(template.updated_at)} />
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
        onPress={() => {
          const template = templates.data?.find((item) => String(item.id) === selectedTemplate);
          startSession.mutate({
            template_id: toNumberId(selectedTemplate),
            mesocycle_id: toNumberId(selectedMeso),
            name: template?.name ?? "Workout",
            started_at: new Date().toISOString(),
            is_completed: false,
          });
        }}
        disabled={startSession.isPending}
        icon={startSession.isPending ? <ActivityIndicator color="#000000" /> : <Icon name="play" size={18} color="#000000" />}
        style={{ marginTop: SPACING.xl5 }}
      />
      {startSession.isError ? (
        <View style={[styles.errorBox, { marginTop: SPACING.xl, backgroundColor: COLORS.redDark }]}>
          <Text style={styles.errorText}>{getApiErrorMessage(startSession.error)}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
