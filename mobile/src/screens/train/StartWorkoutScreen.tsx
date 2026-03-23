import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Tag, SectionEyebrow, ListCard } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { START_WORKOUT_TEMPLATES, TEMPLATE_LIST } from "../../data";

type Props = RootStackScreenProps<"StartWorkout">;

export function StartWorkoutScreen({ navigation, route }: Props): React.JSX.Element {
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
              style={({ pressed }) => [styles.quickStartCard, pressed && styles.pressed]}
            >
              <Text style={styles.quickStartEmoji}>{option.emoji}</Text>
              <Text style={styles.quickStartName}>{option.name}</Text>
              <Text style={styles.quickStartDesc}>{option.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow>Recent Templates</SectionEyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
          {START_WORKOUT_TEMPLATES.slice(0, 4).map((template) => (
            <ListCard
              key={template.id}
              iconEmoji="🏋️"
              name={template.name}
              color={template.color}
              subtitle={`${template.exercises} exercises · ${template.duration}`}
              onPress={() => navigation.replace("ActiveWorkout")}
              compact
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>All Templates</SectionEyebrow>
        {TEMPLATE_LIST.map((template) => (
          <ListCard
            key={template.id}
            iconEmoji="🏋️"
            name={template.name}
            color={template.color}
            subtitle={`${template.exercises.length} exercises · ${template.duration}`}
            onPress={() => navigation.replace("ActiveWorkout")}
          />
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
  quickStartCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  pressed: { opacity: 0.7 },
  quickStartEmoji: { fontSize: 32 },
  quickStartName: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 10 },
  quickStartDesc: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  templateScroll: { marginTop: 12 },
  createLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, paddingVertical: 16 },
  createLinkText: { color: COLORS.teal, fontSize: 14, fontWeight: "700" },
});
