import { useState, useMemo } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, View } from "react-native";
import { usePressOpacity } from "../utils/usePressOpacity";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTemplatesQuery, useMesocyclesQuery } from "../api/queries";
import { useStartSession } from "../api/mutations";
import { usePostHog } from "posthog-react-native";
import { getApiErrorMessage } from "../api/client";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { Radio, SelectableRow } from "../components/ui/Input";
import { SectionEyebrow } from "../components/ui/Indicators";
import { MetaInline } from "../components/ui/Stats";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { AppIcon } from "../design-system/icons/AppIcon";
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
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface1Color = theme.surface1?.get() ?? "rgba(255,255,255,0.04)";
  const redDarkColor = theme.colorRedDark?.get() ?? "#7F1D1D";
  const purpleColor = theme.colorPurple?.get() ?? "#A855F7";
  const id = route?.params?.id;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(id ?? null);
  const [selectedMeso, setSelectedMeso] = useState<string | null>(null);
  const press = usePressOpacity();
  const templates = useTemplatesQuery(isAuthenticated);
  const recentTemplates = useMemo(() => {
    if (!templates.data) return [];
    return [...templates.data].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 3);
  }, [templates.data]);
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

      <Animated.View style={{ opacity: press.opacity }}>
        <Pressable
          onPress={() =>
            startSession.mutate({ template_id: null, mesocycle_id: toNumberId(selectedMeso), name: "Workout", started_at: new Date().toISOString(), is_completed: false })
          }
          style={{ marginTop: spacing.xl3 }}
          disabled={startSession.isPending}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
        >
        <Card elevated accent="coral">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: radii.iconWrap, backgroundColor: "rgba(255,90,54,0.2)", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="zap" size={22} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>Empty Workout</Text>
                <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>Start from scratch</Text>
              </View>
            </View>
            <AppIcon name="play" size={20} color={accent} />
          </View>
        </Card>
      </Pressable>
      </Animated.View>

      {recentTemplates.length > 0 ? (
        <View style={{ marginTop: spacing.xl5 }}>
          <SectionEyebrow>Recent Templates</SectionEyebrow>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xl }} contentContainerStyle={{ gap: spacing.md }}>
            {recentTemplates.map((template) => {
              const isSelected = selectedTemplate === String(template.id);
              return (
                <Animated.View key={template.id} style={{ opacity: press.opacity }}>
                  <Pressable
                    onPress={() => setSelectedTemplate((c) => (c === String(template.id) ? null : String(template.id)))}
                    onPressIn={press.onPressIn}
                    onPressOut={press.onPressOut}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: radii.card,
                      borderWidth: 1,
                      borderColor: isSelected ? "rgba(255,90,54,0.44)" : borderColor,
                      backgroundColor: isSelected ? "rgba(255,90,54,0.12)" : surface1Color,
                      minWidth: 140,
                    }}
                  >
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>{template.name}</Text>
                    <Text style={{ color: mutedColor, fontSize: 10, marginTop: 4 }}>{formatShortDate(template.updated_at)}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl5 }}>
        <SectionEyebrow>Attach to Mesocycle (optional)</SectionEyebrow>
        <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
          <SelectableRow selected={selectedMeso === null} onPress={() => setSelectedMeso(null)} label="No mesocycle" />
          {(mesocycles.data ?? []).map((meso) => (
            <SelectableRow
              key={meso.id}
              selected={selectedMeso === String(meso.id)}
              onPress={() => setSelectedMeso(String(meso.id))}
              label={meso.name}
              sublabel={meso.goal ?? `${meso.weeks ?? "-"} weeks`}
              color={purpleColor}
            />
          ))}
        </View>
      </View>

      <View style={{ marginTop: spacing.xl5 }}>
        <SectionEyebrow>From Template</SectionEyebrow>
        <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
          {!templates.isPending ? (
            <>
              {(templates.data ?? []).map((template) => (
            <Animated.View key={template.id} style={{ opacity: press.opacity }}>
              <Pressable onPress={() => setSelectedTemplate((c) => (c === String(template.id) ? null : String(template.id)))}
                onPressIn={press.onPressIn}
                onPressOut={press.onPressOut}
              >
                <Card
                  elevated
                  style={{
                    borderColor: selectedTemplate === String(template.id) ? "rgba(255,90,54,0.44)" : borderColor,
                    backgroundColor: selectedTemplate === String(template.id) ? "rgba(255,90,54,0.12)" : surface1Color,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, { flex: 1, alignItems: "flex-start" }]}>
                      <Radio selected={selectedTemplate === String(template.id)} color={accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>{template.name}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: spacing.sm }}>
                          <MetaInline icon="dumbbell" label={template.description ?? "Template"} />
                          <MetaInline icon="calendar" label={formatShortDate(template.updated_at)} />
                        </View>
                      </View>
                    </View>
                    <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{template.is_public ? "Public" : "Private"}</Text>
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          ))}
            </>
          ) : null}
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
        icon={startSession.isPending ? <ActivityIndicator color="#000000" /> : <AppIcon name="play" size={18} color="#000000" />}
        style={{ marginTop: spacing.xl5 }}
      />
      {startSession.isError ? (
        <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: redDarkColor, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: spacing.xl }}>
          <Text style={{ color: textColor, fontSize: 12 }}>{getApiErrorMessage(startSession.error)}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
