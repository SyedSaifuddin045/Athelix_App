import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BackHeader, Card, Screen, ScreenState, Tag } from "../../components";
import { useWorkoutTemplatesQuery } from "../../features/templates/hooks";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"TemplateList">;

function formatUpdatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently updated";
  }

  return `Updated ${parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function TemplateListScreen({ navigation }: Props): React.JSX.Element {
  const templatesQuery = useWorkoutTemplatesQuery();

  useFocusEffect(
    React.useCallback(() => {
      void templatesQuery.refetch();
    }, [templatesQuery]),
  );

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader
        title="Templates"
        subtitle={`${templatesQuery.data?.length ?? 0} saved workout plans`}
        onBack={() => navigation.goBack()}
      />

      <Pressable onPress={() => navigation.navigate("TemplateBuilder", {})}>
        <Card style={styles.newTemplateCard}>
          <View style={styles.newTemplateContent}>
            <View style={styles.newTemplateIcon}>
              <Feather name="plus" size={18} color={COLORS.teal} />
            </View>
            <View style={styles.newTemplateText}>
              <Text style={styles.newTemplateTitle}>Create New Template</Text>
              <Text style={styles.newTemplateSubtitle}>
                Build a reusable workout plan with real template exercise targets.
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>

      {templatesQuery.isLoading && !templatesQuery.data ? (
        <ScreenState
          title="Loading templates"
          message="Fetching your workout template library."
          loading
        />
      ) : null}

      {templatesQuery.isError ? (
        <ScreenState
          title="Template library unavailable"
          message="The app could not load saved templates."
          actionLabel="Retry"
          onAction={() => {
            void templatesQuery.refetch();
          }}
        />
      ) : null}

      {templatesQuery.data ? (
        <View style={styles.section}>
          <FlatList
            data={templatesQuery.data}
            keyExtractor={(item) => `${item.id}`}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  navigation.navigate("TemplateBuilder", {
                    templateId: item.id,
                  })
                }
              >
                <Card style={styles.templateCard}>
                  <View style={styles.templateHeader}>
                    <View style={styles.templateMarker} />
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{item.name}</Text>
                      <Text style={styles.templateMeta}>{formatUpdatedAt(item.updated_at)}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
                  </View>

                  <Text style={styles.templateDescription}>
                    {item.description ?? "No description yet. Open the template to add exercise targets."}
                  </Text>

                  <View style={styles.templateFooter}>
                    <Tag
                      label={item.is_public ? "Public" : "Private"}
                      color={item.is_public ? COLORS.green : COLORS.teal}
                      backgroundColor={item.is_public ? `${COLORS.green}20` : `${COLORS.teal}20`}
                    />
                    <Text style={styles.templateId}>Template #{item.id}</Text>
                  </View>
                </Card>
              </Pressable>
            )}
            scrollEnabled={false}
            contentContainerStyle={{ marginTop: 24 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No templates yet</Text>
                <Text style={styles.emptySubtext}>
                  Create your first template to save exercise targets and launch sessions faster.
                </Text>
              </View>
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  newTemplateCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: `${COLORS.teal}30`,
    borderStyle: "dashed",
  },
  newTemplateContent: { flexDirection: "row", alignItems: "center" },
  newTemplateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${COLORS.teal}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  newTemplateText: { flex: 1, marginLeft: 12 },
  newTemplateTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  newTemplateSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2, lineHeight: 18 },
  section: { marginTop: 8 },
  templateCard: { marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  templateHeader: { flexDirection: "row", alignItems: "center" },
  templateMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: COLORS.teal,
  },
  templateInfo: { flex: 1 },
  templateName: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  templateMeta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  templateDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 12 },
  templateFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  templateId: { color: COLORS.faint, fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 56 },
  emptyText: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  emptySubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 18 },
});
