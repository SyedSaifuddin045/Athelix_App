import { Alert, Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useTemplatesQuery } from "../api/queries";
import { useDeleteTemplate } from "../api/mutations";
import type { WorkoutTemplateResponse } from "../api/model";
import { formatShortDate } from "../utils/format";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Screen } from "../components/ui/Layout";
import { Card, LoadingCard, ErrorCard, EmptyCard } from "../components/ui/Card";
import { BackHeader, RoundButton } from "../components/ui/Button";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { MetaInline } from "../components/ui/Stats";
import { AppIcon } from "../design-system/icons/AppIcon";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "TemplateList"> };

export function TemplateListScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const templates = useTemplatesQuery(isAuthenticated);
  const deleteTemplate = useDeleteTemplate();

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface1Color = theme.surface1?.get() ?? "rgba(255,255,255,0.04)";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const blueColor = theme.colorBlue?.get() ?? "#3B82F6";
  const redColor = theme.colorRed?.get() ?? "#EF4444";

  const handleDelete = (template: WorkoutTemplateResponse) => {
    Alert.alert("Delete template?", template.name, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTemplate.mutate(template.id) },
    ]);
  };

  return (
    <Screen>
      <BackHeader
        title="Templates"
        subtitle={`${templates.data?.length ?? 0} saved`}
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.input, backgroundColor: "rgba(255,90,54,0.15)", borderWidth: 1, borderColor: "rgba(255,90,54,0.3)" }}
            onPress={() => navigation.navigate({ name: "TemplateBuilder", params: {} })}
          >
            <AppIcon name="plus" size={15} color={accent} />
            <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>New</Text>
          </Pressable>
        }
      />

      {templates.isPending ? <LoadingCard label="Loading templates..." /> : null}
      {templates.isError ? <ErrorCard error={templates.error} onRetry={() => templates.refetch()} /> : null}

      <View style={{ gap: spacing.xl, marginTop: spacing.xl3 }}>
        {(templates.data ?? []).map((template) => (
          <Card key={template.id} elevated>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
                  <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>{template.name}</Text>
                </View>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16, marginLeft: spacing.xl2, marginTop: spacing.sm }}>
                  {template.description || `Created ${formatShortDate(template.created_at)}`}
                </Text>
              </View>
              <RoundButton onPress={() => navigation.navigate("TemplateBuilder", { id: String(template.id) })}>
                <AppIcon name="chevron-right" size={13} color={mutedColor} />
              </RoundButton>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xl, flexWrap: "wrap" }}>
                <MetaInline icon="calendar" label={formatShortDate(template.updated_at)} />
                {template.is_public ? <Tag label="Public" color={blueColor} /> : <Tag label="Private" color={accent} />}
              </View>
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.tag, backgroundColor: "rgba(255,90,54,0.13)", borderWidth: 1, borderColor: "rgba(255,90,54,0.32)" }}
                onPress={() => navigation.navigate("StartWorkout", { id: String(template.id) })}
              >
                <AppIcon name="play" size={11} color={accent} />
                <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>Start</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => handleDelete(template)} style={{ alignSelf: "flex-start", marginTop: spacing.xl }}>
              <Text style={{ color: redColor, fontSize: 10 }}>Delete</Text>
            </Pressable>
          </Card>
        ))}

        {!templates.isPending && (templates.data?.length ?? 0) === 0 ? (
          <EmptyCard title="No templates yet" text="Create your first reusable workout plan." />
        ) : null}

        <Pressable onPress={() => navigation.navigate({ name: "TemplateBuilder", params: {} })}>
          <View style={{ borderRadius: radii.card, borderWidth: 1, borderStyle: "dashed", borderColor, backgroundColor: surface1Color, padding: spacing.xl3, flexDirection: "row", alignItems: "center", gap: spacing.xl }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surface2Color, alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="plus" size={18} color={faintColor} />
            </View>
            <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>Create new template</Text>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}
