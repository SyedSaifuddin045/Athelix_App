import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { TEMPLATE_LIST } from "../../data";

type Props = RootStackScreenProps<"TemplateList">;

export function TemplateListScreen({ navigation }: Props): React.JSX.Element {
  const renderTemplate = ({ item }: { item: typeof TEMPLATE_LIST[0] }) => (
    <Pressable onPress={() => navigation.navigate("TemplateBuilder", { id: item.id })}>
      <Card style={[styles.templateCard, { borderColor: `${item.color}30` }]}>
        <View style={styles.templateHeader}>
          <View style={[styles.templateColorDot, { backgroundColor: item.color }]} />
          <Text style={styles.templateName}>{item.name}</Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
        </View>
        <View style={styles.templateExercises}>
          {item.exercises.slice(0, 3).map((exercise, index) => (
            <Text key={index} style={styles.exerciseItem}>
              {exercise}
            </Text>
          ))}
          {item.exercises.length > 3 && (
            <Text style={styles.moreExercises}>+{item.exercises.length - 3} more</Text>
          )}
        </View>
        <View style={styles.templateFooter}>
          <View style={styles.templateStat}>
            <Feather name="clock" size={12} color={COLORS.muted} />
            <Text style={styles.templateStatText}>{item.duration}</Text>
          </View>
          <View style={styles.templateStat}>
            <Feather name="layers" size={12} color={COLORS.muted} />
            <Text style={styles.templateStatText}>{item.sets} sets</Text>
          </View>
          <Tag label={`Used ${item.lastUsed}`} color={item.color} backgroundColor={`${item.color}20`} />
        </View>
      </Card>
    </Pressable>
  );

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title="Templates" subtitle="Saved workout plans" onBack={() => navigation.goBack()} />

      <Pressable onPress={() => navigation.navigate("TemplateBuilder", {})}>
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
        <SectionEyebrow>Your Templates ({TEMPLATE_LIST.length})</SectionEyebrow>
        <FlatList
          data={TEMPLATE_LIST}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplate}
          scrollEnabled={false}
          contentContainerStyle={{ marginTop: 12 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No templates yet</Text>
              <Text style={styles.emptySubtext}>Create your first workout template</Text>
            </View>
          }
        />
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
  templateCard: { marginBottom: 12, borderWidth: 1 },
  templateHeader: { flexDirection: "row", alignItems: "center" },
  templateColorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  templateName: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: "800" },
  templateExercises: { marginTop: 12, marginLeft: 20 },
  exerciseItem: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  moreExercises: { color: "rgba(255,255,255,0.35)", fontSize: 11, fontStyle: "italic" },
  templateFooter: { flexDirection: "row", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  templateStat: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 16 },
  templateStatText: { color: COLORS.muted, fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptySubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
});
