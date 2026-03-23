import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";

interface PRCardProps {
  exercise: string;
  value: string;
  date: string;
  color: string;
  onPress?: () => void;
}

export function PRCard({ exercise, value, date, color, onPress }: PRCardProps): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.prBadge}>
        <Ionicons name="trophy" size={10} color={color} />
        <Text style={[styles.prBadgeText, { color }]}>PR</Text>
      </View>
      <Text style={styles.exercise}>{exercise}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.date}>{date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 126,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    marginRight: 12,
  },
  pressed: { opacity: 0.7 },
  prBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  prBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  exercise: { color: COLORS.muted, fontSize: 10, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: "900" },
  date: { color: COLORS.faint, fontSize: 9, marginTop: 6 },
});
