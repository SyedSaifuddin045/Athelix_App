import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTemplatesQuery } from "../api/queries";
import { useDeleteTemplate } from "../api/mutations";
import type { WorkoutTemplateResponse } from "../api/model";
import { formatShortDate } from "../utils/format";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { Card, LoadingCard, ErrorCard, EmptyCard } from "../components/ui/Card";
import { BackHeader, RoundButton } from "../components/ui/Button";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { MetaInline } from "../components/ui/Stats";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TemplateList">;
};

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
          <Pressable style={styles.smallAccentButton} onPress={() => navigation.navigate({ name: "TemplateBuilder", params: {} })}>
            <Feather name="plus" size={15} color={COLORS.teal} />
            <Text style={styles.smallAccentText}>New</Text>
          </Pressable>
        }
      />

      {templates.isPending ? <LoadingCard label="Loading templates..." /> : null}
      {templates.isError ? <ErrorCard error={templates.error} onRetry={() => templates.refetch()} /> : null}

      <View style={{ gap: 12, marginTop: 18 }}>
        {(templates.data ?? []).map((template) => (
          <Card key={template.id} style={{ borderRadius: 28 }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowGap}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.teal }]} />
                  <Text style={styles.cardTitle}>{template.name}</Text>
                </View>
                <Text style={[styles.detailLabel, { marginLeft: 14, marginTop: 6 }]}>
                  {template.description || `Created ${formatShortDate(template.created_at)}`}
                </Text>
              </View>
              <RoundButton onPress={() => navigation.navigate("TemplateBuilder", { id: String(template.id) })}>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.5)" />
              </RoundButton>
            </View>
            <View style={[styles.rowBetween, { marginTop: 14 }]}>
              <View style={styles.rowGapLarge}>
                <MetaInline icon={<Feather name="calendar" size={11} color="rgba(255,255,255,0.32)" />} text={formatShortDate(template.updated_at)} />
                {template.is_public ? <Tag label="Public" color={COLORS.blue} /> : <Tag label="Private" color={COLORS.teal} />}
              </View>
              <Pressable
                style={[styles.smallActionTag, { backgroundColor: "rgba(255,90,54,0.13)", borderColor: "rgba(255,90,54,0.32)" }]}
                onPress={() => navigation.navigate("StartWorkout", { id: String(template.id) })}
              >
                <Feather name="play" size={11} color={COLORS.teal} />
                <Text style={[styles.smallActionText, { color: COLORS.teal }]}>Start</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => handleDelete(template)} style={{ alignSelf: "flex-start", marginTop: 12 }}>
              <Text style={[styles.listMeta, { color: COLORS.red }]}>Delete</Text>
            </Pressable>
          </Card>
        ))}

        {!templates.isPending && (templates.data?.length ?? 0) === 0 ? (
          <EmptyCard title="No templates yet" text="Create your first reusable workout plan." />
        ) : null}

        <Pressable onPress={() => navigation.navigate({ name: "TemplateBuilder", params: {} })}>
          <View style={styles.dashedAddCard}>
            <View style={styles.addCircle}>
              <Feather name="plus" size={18} color="rgba(255,255,255,0.45)" />
            </View>
            <Text style={styles.emptyStateText}>Create new template</Text>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}


