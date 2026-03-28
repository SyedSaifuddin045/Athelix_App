import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useWorkoutTemplates } from "../../hooks";
import type { WorkoutTemplate } from "../../api/types";

type Props = RootStackScreenProps<"TemplateList">;

export function TemplateListScreen({ navigation }: Props): React.JSX.Element {
  const { data: templatesData, isLoading, error } = useWorkoutTemplates();

  const renderTemplate = ({ item }: { item: WorkoutTemplate }) => (
    <Pressable onPress={() => (navigation as any).navigate("TemplateBuilder", { id: item.id })}>
      <Card style={[styles.templateCard, { borderColor: `${COLORS.teal}30` }]}>
        <View style={styles.templateHeader}>
          <View style={[styles.templateColorDot, { backgroundColor: COLORS.teal }]} />
          <Text style={styles.templateName}>{item.name}</Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
        </View>
        {item.description && (
          <Text style={styles.templateDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.templateFooter}>
          <View style={styles.templateStat}>
            <Feather name="layers" size={12} color={COLORS.muted} />
            <Text style={styles.templateStatText}>{item.exercises_count} exercises</Text>
          </View>
          <View style={styles.templateStat}>
            <Feather name="layers" size={12} color={COLORS.muted} />
            <Text style={styles.templateStatText}>{item.total_sets} sets</Text>
          </View>
          {item.estimated_duration_minutes && (
            <View style={styles.templateStat}>
              <Feather name="clock" size={12} color={COLORS.muted} />
              <Text style={styles.templateStatText}>~{item.estimated_duration_minutes} min</Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader 
        title="Templates" 
        subtitle={`${templatesData?.total || 0} saved workout plans`} 
        onBack={() => navigation.goBack()} 
      />

      <Pressable onPress={() => (navigation as any).navigate("TemplateBuilder", {})}>
        <Card style={styles.newTemplateCard}>
          <View style={styles.newTemplateContent}>
            <View style={styles.newTemplateIcon}>
              <Feather name="plus" size={18} color={COLORS.teal} />
            </View>
            <View>
              <Text style={styles.newTemplateTitle}>Create New Template</Text>
              <Text style={styles.newTemplateSubtitle}>Build a custom workout plan</Text>
            </View>
          </View>
        </Card>
      </Pressable>

      <View style={styles.section}>
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.teal} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>Failed to load templates</Text>
          </View>
        ) : templatesData?.data && templatesData.data.length > 0 ? (
          <>
            <SectionEyebrow>Your Templates ({templatesData.total})</SectionEyebrow>
            <FlatList
              data={templatesData.data}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderTemplate}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: 12 }}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubtext}>Create your first workout template</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  newTemplateCard: { marginTop: 16, borderWidth: 1, borderColor: `${COLORS.teal}30`, borderStyle: "dashed" },
  newTemplateContent: { flexDirection: "row", alignItems: "center" },
  newTemplateIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.teal}20`, alignItems: "center", justifyContent: "center" },
  newTemplateTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginLeft: 12 },
  newTemplateSubtitle: { color: COLORS.muted, fontSize: 11, marginLeft: 12, marginTop: 2 },
  section: { marginTop: 24 },
  loader: { marginTop: 20 },
  templateCard: { marginBottom: 12, borderWidth: 1 },
  templateHeader: { flexDirection: "row", alignItems: "center" },
  templateColorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  templateName: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: "800" },
  templateDesc: { color: COLORS.muted, fontSize: 12, marginTop: 8, marginLeft: 20 },
  templateFooter: { flexDirection: "row", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  templateStat: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 16 },
  templateStatText: { color: COLORS.muted, fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptySubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  errorState: { alignItems: "center", paddingVertical: 40 },
  errorText: { color: COLORS.red, fontSize: 13 },
});
