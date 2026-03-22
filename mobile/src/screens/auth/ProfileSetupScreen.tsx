import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from "react-native";
import { ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, PrimaryButton, ChipWrap, LabeledInput } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { GENDERS, FITNESS_LEVELS, GOALS, UNITS } from "../../data";

type Props = RootStackScreenProps<"ProfileSetup">;

export function ProfileSetupScreen({ navigation }: Props): React.JSX.Element {
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [loading, setLoading] = useState(false);

  const isFormValid = displayName.length >= 2 && gender && fitnessLevel && goal;

  const handleComplete = () => {
    if (!isFormValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace("MainTabs");
    }, 1500);
  };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Up Profile</Text>
        <Text style={styles.subtitle}>Help us personalize your fitness experience</Text>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Display Name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Jordan"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <TextInput
            value={dob}
            onChangeText={setDob}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="numeric"
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Gender</Text>
          <ChipWrap items={GENDERS} selected={gender} onSelect={setGender} activeColor={COLORS.teal} />
        </View>

        <View style={styles.rowGap}>
          <View style={styles.halfInput}>
            <Text style={styles.fieldLabel}>Height</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder={unit === "metric" ? "cm" : "ft/in"}
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.fieldLabel}>Current Weight</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder={unit === "metric" ? "kg" : "lbs"}
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Unit Preference</Text>
          <View style={styles.unitRow}>
            {UNITS.map((u) => (
              <Pressable
                key={u.value}
                onPress={() => setUnit(u.value as "metric" | "imperial")}
                style={[
                  styles.unitChip,
                  unit === u.value && { backgroundColor: `${COLORS.teal}20`, borderColor: `${COLORS.teal}40` },
                ]}
              >
                <Text style={[styles.unitText, unit === u.value && { color: COLORS.teal }]}>
                  {u.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Fitness Level</Text>
          <ChipWrap items={FITNESS_LEVELS} selected={fitnessLevel} onSelect={setFitnessLevel} activeColor={COLORS.purple} />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Primary Goal</Text>
          <ChipWrap items={GOALS} selected={goal} onSelect={setGoal} activeColor={COLORS.gold} />
        </View>

        <PrimaryButton
          label={loading ? "Setting Up..." : "Complete Setup"}
          onPress={handleComplete}
          disabled={loading || !isFormValid}
          icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="check" size={16} color="#000000" />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingTop: 20, paddingBottom: 28 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  formStack: { gap: 20 },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  input: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#ffffff", paddingHorizontal: 16, fontSize: 14 },
  rowGap: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  unitRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  unitChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  unitText: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", textAlign: "center" },
});
