import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";

interface TemplateCardProps {
  name: string;
  exercises: number;
  duration: string;
  color: string;
  lastUsed: string;
  onPress?: () => void;
}

export function TemplateCard({ name, exercises, duration, color, lastUsed, onPress }: TemplateCardProps): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={[styles.leftBar, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.emoji}>🏋️</Text>
        <View style={styles.textContent}>
          <Text style={[styles.name, { color }]}>{name}</Text>
          <Text style={styles.meta}>
            {exercises} exercises · {duration}
          </Text>
          <Text style={styles.lastUsed}>Last: {lastUsed}</Text>
        </View>
      </View>
      <View style={[styles.playButton, { backgroundColor: color }]}>
        <Feather name="play" size={14} color="#000000" />
      </View>
    </Pressable>
  );
}

interface CompactTemplateCardProps {
  name: string;
  color: string;
  onPress?: () => void;
}

export function CompactTemplateCard({ name, color, onPress }: CompactTemplateCardProps): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.compactContainer, pressed && styles.pressed]}>
      <View style={[styles.leftBar, { backgroundColor: color }]} />
      <View style={styles.compactContent}>
        <Text style={styles.emoji}>🏋️</Text>
        <Text style={[styles.compactName, { color }]}>{name}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  pressed: { opacity: 0.7 },
  leftBar: { width: 4, alignSelf: "stretch" },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  emoji: { fontSize: 28, marginRight: 12 },
  textContent: { flex: 1 },
  name: { fontSize: 15, fontWeight: "800" },
  meta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  lastUsed: { color: COLORS.faint, fontSize: 11, marginTop: 4 },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  compactContainer: {
    width: 140,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  compactContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  compactName: { fontSize: 14, fontWeight: "700", marginTop: 8 },
});
