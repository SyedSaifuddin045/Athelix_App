import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from "react-native";
import { ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, PrimaryButton, ChipWrap } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useUpdateProfile, useCreateBodyWeightLog } from "../../hooks";
import { useSafePostHog } from "../../services/analytics/usePostHogSafe";

type Props = RootStackScreenProps<"ProfileSetup">;

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const FITNESS_LEVELS = ["beginner", "intermediate", "advanced", "elite"];
const GOALS = [
  { label: "Build muscle", value: "build_muscle" },
  { label: "Lose fat", value: "lose_fat" },
  { label: "Improve strength", value: "improve_strength" },
  { label: "General fitness", value: "general_fitness" },
  { label: "Athletic performance", value: "athletic_performance" },
];
const UNITS = [
  { label: "Metric (kg / cm)", value: "metric" },
  { label: "Imperial (lbs / ft)", value: "imperial" },
];

export function ProfileSetupScreen({ navigation }: Props): React.JSX.Element {
  const posthog = useSafePostHog();
  const updateProfile = useUpdateProfile();
  const createBodyWeightLog = useCreateBodyWeightLog();
  
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");

  const isFormValid = displayName.length >= 2 && !!gender && !!fitnessLevel && !!goal;

  const handleComplete = async () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        date_of_birth: dateOfBirth || undefined,
        gender: gender.toLowerCase(),
        height_cm: heightCm ? parseFloat(heightCm) : undefined,
        fitness_level: fitnessLevel.toLowerCase() as "beginner" | "intermediate" | "advanced" | "elite",
        primary_goal: goal,
        units: unit,
      });

      if (currentWeight) {
        const weightInKg = unit === "imperial" 
          ? parseFloat(currentWeight) * 0.453592 
          : parseFloat(currentWeight);
        
        await createBodyWeightLog.mutateAsync({
          weight: weightInKg,
          note: "Initial weight on profile setup",
        });
      }

      if (posthog) {
        posthog.capture("profile_setup_completed", {
          fitness_level: fitnessLevel,
          goal: goal,
          unit: unit,
        });
      }
      
      navigation.replace("MainTabs");
    } catch (error) {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    }
  };

  const isLoading = updateProfile.isPending || createBodyWeightLog.isPending;

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Up Profile</Text>
        <Text style={styles.subtitle}>Help us personalize your fitness experience</Text>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Display Name *</Text>
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
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="numeric"
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Gender</Text>
          <ChipWrap 
            items={GENDERS} 
            selected={gender} 
            onSelect={setGender} 
            activeColor={COLORS.teal} 
          />
        </View>

        <View style={styles.rowGap}>
          <View style={styles.halfInput}>
            <Text style={styles.fieldLabel}>
              Height {unit === "metric" ? "(cm)" : "(in)"}
            </Text>
            <TextInput
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder={unit === "metric" ? "175" : "69"}
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.fieldLabel}>
              Current Weight {unit === "metric" ? "(kg)" : "(lbs)"}
            </Text>
            <TextInput
              value={currentWeight}
              onChangeText={setCurrentWeight}
              placeholder={unit === "metric" ? "75" : "165"}
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
                  unit === u.value && { 
                    backgroundColor: `${COLORS.teal}20`, 
                    borderColor: `${COLORS.teal}40` 
                  },
                ]}
              >
                <Text 
                  style={[
                    styles.unitText, 
                    unit === u.value && { color: COLORS.teal }
                  ]}
                >
                  {u.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Fitness Level *</Text>
          <ChipWrap 
            items={FITNESS_LEVELS.map(l => l.charAt(0).toUpperCase() + l.slice(1))} 
            selected={fitnessLevel} 
            onSelect={setFitnessLevel} 
            activeColor={COLORS.purple} 
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Primary Goal *</Text>
          <View style={styles.goalsWrap}>
            {GOALS.map((g) => (
              <Pressable
                key={g.value}
                onPress={() => setGoal(g.value)}
                style={[
                  styles.goalChip,
                  goal === g.value && { 
                    backgroundColor: `${COLORS.gold}20`, 
                    borderColor: `${COLORS.gold}40` 
                  },
                ]}
              >
                <Text 
                  style={[
                    styles.goalText,
                    goal === g.value && { color: COLORS.gold }
                  ]}
                >
                  {g.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <PrimaryButton
          label={isLoading ? "Setting Up..." : "Complete Setup"}
          onPress={handleComplete}
          disabled={isLoading || !isFormValid}
          icon={isLoading ? <ActivityIndicator color="#000000" /> : <Feather name="check" size={16} color="#000000" />}
        />

        <Pressable onPress={() => navigation.replace("MainTabs")} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
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
  unitRow: { flexDirection: "row", gap: 10 },
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
  goalsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  goalChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  goalText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  skipButton: { alignItems: "center", paddingVertical: 8 },
  skipText: { color: COLORS.muted, fontSize: 13 },
});
