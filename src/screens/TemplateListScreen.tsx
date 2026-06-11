import { Alert, Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTemplatesQuery } from "../api/queries";
import { useDeleteTemplate } from "../api/mutations";
import type { WorkoutTemplateResponse } from "../api/model";
import { formatShortDate } from "../utils/format";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { Card, LoadingCard, ErrorCard, EmptyCard } from "../components/ui/Card";
import { BackHeader, RoundButton } from "../components/ui/Button";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { MetaInline } from "../components/ui/Stats";
import { Icon } from "../components/ui/Icon";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "TemplateList"> };

export function TemplateListScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const templates = useTemplatesQuery(isAuthenticated);
  const deleteTemplate = useDeleteTemplate();

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
            style={[styles.smallAccentButton, { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.input, backgroundColor: "rgba(255,90,54,0.15)", borderWidth: 1, borderColor: "rgba(255,90,54,0.3)" }]}
            onPress={() => navigation.navigate({ name: "TemplateBuilder", params: {} })}
          >
            <Icon name="plus" size={15} color={COLORS.teal} />
            <Text style={styles.smallAccentText}>New</Text>
          </Pressable>
        }
      />

      {templates.isPending ? <LoadingCard label="Loading templates..." /> : null}
      {templates.isError ? <ErrorCard error={templates.error} onRetry={() => templates.refetch()} /> : null}

      <View style={{ gap: SPACING.xl, marginTop: SPACING.xl3 }}>
        {(templates.data ?? []).map((template) => (
          <Card key={template.id} elevated>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowGap}>
                  <View style={[styles.statusDot, { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal }]} />
                  <Text style={styles.cardTitle}>{template.name}</Text>
                </View>
                <Text style={[styles.detailLabel, { marginLeft: SPACING.xl2, marginTop: SPACING.sm }]}>
                  {template.description || `Created ${formatShortDate(template.created_at)}`}
                </Text>
              </View>
              <RoundButton onPress={() => navigation.navigate("TemplateBuilder", { id: String(template.id) })}>
                <Icon name="chevron-right" size={13} color={COLORS.muted} />
              </RoundButton>
            </View>
            <View style={[styles.rowBetween, { marginTop: SPACING.xl2 }]}>
              <View style={[styles.rowGapLarge, { gap: SPACING.xl }]}>
                <MetaInline icon="calendar" label={formatShortDate(template.updated_at)} />
                {template.is_public ? <Tag label="Public" color={COLORS.blue} /> : <Tag label="Private" color={COLORS.teal} />}
              </View>
              <Pressable
                style={[styles.smallActionTag, { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.tag, backgroundColor: "rgba(255,90,54,0.13)", borderWidth: 1, borderColor: "rgba(255,90,54,0.32)" }]}
                onPress={() => navigation.navigate("StartWorkout", { id: String(template.id) })}
              >
                <Icon name="play" size={11} color={COLORS.teal} />
                <Text style={[styles.smallActionText, { color: COLORS.teal }]}>Start</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => handleDelete(template)} style={{ alignSelf: "flex-start", marginTop: SPACING.xl }}>
              <Text style={[styles.listMeta, { color: COLORS.red }]}>Delete</Text>
            </Pressable>
          </Card>
        ))}

        {!templates.isPending && (templates.data?.length ?? 0) === 0 ? (
          <EmptyCard title="No templates yet" text="Create your first reusable workout plan." />
        ) : null}

        <Pressable onPress={() => navigation.navigate({ name: "TemplateBuilder", params: {} })}>
          <View style={[styles.dashedAddCard, { borderRadius: RADIUS.card, borderStyle: "dashed", borderColor: COLORS.border, backgroundColor: COLORS.card, padding: SPACING.xl3, flexDirection: "row", alignItems: "center", gap: SPACING.xl }]}>
            <View style={[styles.addCircle, { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }]}>
              <Icon name="plus" size={18} color={COLORS.faint} />
            </View>
            <Text style={styles.emptyStateText}>Create new template</Text>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}
