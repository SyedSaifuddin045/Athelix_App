import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, PrimaryButton, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { START_WORKOUT_TEMPLATES, TEMPLATE_LIST } from "../../data";

type Props = RootStackScreenProps<"StartWorkout">;

export function StartWorkoutScreen({ navigation, route }: Props): React.JSX.Element {
  const templateId = route.params?.id;
  const selectedTemplate = templateId ? START_WORKOUT_TEMPLATES.find((t) => t.id === templateId) : null;

  const quickStartOptions = [
    { id: "empty", name: "Empty Workout", desc: "Start from scratch", emoji: "📋", color: COLORS.muted },
    { id: "quick", name: "Quick Full Body", desc: "~45 min, balanced", emoji: "⚡", color: COLORS.gold },
  ];

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Start Workout</Text>
          <Text style={styles.subtitle}>Choose how to begin</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.teal}>Quick Start</SectionEyebrow>
        <View style={styles.quickStartGrid}>
          {quickStartOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => navigation.replace("ActiveWorkout")}
              style={styles.quickStartCard}
            >
              <Card style={[styles.optionCard, { borderColor: `${option.color}30` }]}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={styles.optionName}>{option.name}</Text>
                <Text style={styles.optionDesc}>{option.desc}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow>Recent Templates</SectionEyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
          {START_WORKOUT_TEMPLATES.slice(0, 4).map((template) => (
            <Pressable
              key={template.id}
              onPress={() => navigation.replace("ActiveWorkout")}
              style={styles.templateCard}
            >
              <Card style={[styles.templateInner, { borderColor: `${template.color}30` }]}>
                <View style={[styles.templateBar, { backgroundColor: template.color }]} />
                <Text style={styles.templateEmoji}>🏋️</Text>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateMeta}>
                  {template.exercises} exercises · {template.duration}
                </Text>
                <Text style={styles.templateLastUsed}>Last: {template.lastUsed}</Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>All Templates</SectionEyebrow>
        {TEMPLATE_LIST.map((template) => (
          <Pressable
            key={template.id}
            onPress={() => navigation.replace("ActiveWorkout")}
          >
            <Card style={[styles.fullTemplateCard, { borderColor: `${template.color}30` }]}>
              <View style={styles.fullTemplateLeft}>
                <View style={[styles.templateColorDot, { backgroundColor: template.color }]} />
                <View>
                  <Text style={styles.fullTemplateName}>{template.name}</Text>
                  <Text style={styles.fullTemplateInfo}>
                    {template.exercises.length} exercises · {template.duration}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => navigation.replace("ActiveWorkout")} style={styles.startTemplateButton}>
                <Feather name="play" size={14} color="#000000" />
              </Pressable>
            </Card>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => navigation.navigate("TemplateBuilder", {})} style={styles.createLink}>
        <Feather name="plus-circle" size={18} color={COLORS.teal} />
        <Text style={styles.createLinkText}>Create New Template</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  headerText: {},
  title: { color: COLORS.text, fontSize: 24, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  section: { marginTop: 28 },
  quickStartGrid: { flexDirection: "row", gap: 12, marginTop: 12 },
  quickStartCard: { flex: 1 },
  optionCard: { alignItems: "center", paddingVertical: 24, borderWidth: 1 },
  optionEmoji: { fontSize: 36 },
  optionName: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 12 },
  optionDesc: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  templateScroll: { marginTop: 12 },
  templateCard: { marginRight: 12 },
  templateInner: { width: 140, paddingVertical: 16, borderWidth: 1 },
  templateBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  templateEmoji: { fontSize: 28, marginTop: 4 },
  templateName: { color: COLORS.text, fontSize: 13, fontWeight: "800", marginTop: 10 },
  templateMeta: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  templateLastUsed: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 6 },
  fullTemplateCard: { flexDirection: "row", alignItems: "center", marginBottom: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  fullTemplateLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  templateColorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  fullTemplateName: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  fullTemplateInfo: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  startTemplateButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center" },
  createLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, paddingVertical: 16 },
  createLinkText: { color: COLORS.teal, fontSize: 14, fontWeight: "700" },
});
