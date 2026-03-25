import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, PrimaryButton, ChipWrap } from "../../components";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";
import { useAuth } from "../../app/providers/AuthProvider";
import { isApiError } from "../../lib/api/error";

type Props = RootStackScreenProps<"ProfileSetup">;

const GENDERS = ["male", "female", "non_binary", "prefer_not_to_say"] as const;
const FITNESS_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const UNITS = [
  { label: "Metric", value: "metric" },
  { label: "Imperial", value: "imperial" },
] as const;

function parseNullableNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ProfileSetupScreen({ navigation }: Props): React.JSX.Element {
  const { completeProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormValid =
    displayName.trim().length >= 2 &&
    gender.length > 0 &&
    fitnessLevel.length > 0;

  const handleComplete = async (): Promise<void> => {
    if (!isFormValid) {
      setError("Display name, gender, and fitness level are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await completeProfile({
        display_name: displayName.trim() || null,
        date_of_birth: dob.trim() || null,
        gender: gender || null,
        height_cm: parseNullableNumber(height),
        weight_kg: parseNullableNumber(weight),
        fitness_level: fitnessLevel || null,
        preferred_unit: unit,
      });

      navigation.replace("MainTabs");
    } catch (submissionError) {
      if (isApiError(submissionError)) {
        setError(submissionError.message);
      } else {
        setError("Unable to save your profile right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Up Profile</Text>
        <Text style={styles.subtitle}>We only ask for the fields the backend actually stores.</Text>
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
            placeholder="YYYY-MM-DD"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Gender</Text>
          <ChipWrap
            items={[...GENDERS]}
            selected={gender}
            onSelect={setGender}
            activeColor={COLORS.teal}
          />
        </View>

        <View style={styles.rowGap}>
          <View style={styles.halfInput}>
            <Text style={styles.fieldLabel}>Height ({unit === "metric" ? "cm" : "cm"})</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder="175"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.fieldLabel}>Current Weight ({unit === "metric" ? "kg" : "kg"})</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="82.5"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.input}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Unit Preference</Text>
          <View style={styles.unitRow}>
            {UNITS.map((unitOption) => (
              <Pressable
                key={unitOption.value}
                onPress={() => setUnit(unitOption.value)}
                style={[
                  styles.unitChip,
                  unit === unitOption.value
                    ? {
                        backgroundColor: `${COLORS.teal}20`,
                        borderColor: `${COLORS.teal}40`,
                      }
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.unitText,
                    unit === unitOption.value ? { color: COLORS.teal } : null,
                  ]}
                >
                  {unitOption.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Fitness Level</Text>
          <ChipWrap
            items={[...FITNESS_LEVELS]}
            selected={fitnessLevel}
            onSelect={setFitnessLevel}
            activeColor={COLORS.purple}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label={loading ? "Saving Profile..." : "Complete Setup"}
          onPress={() => {
            void handleComplete();
          }}
          disabled={loading || !isFormValid}
          icon={
            loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Feather name="check" size={16} color="#000000" />
            )
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingTop: 20, paddingBottom: 28 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 6, textAlign: "center" },
  formStack: { gap: 20 },
  fieldLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#ffffff",
    paddingHorizontal: 16,
    fontSize: 14,
  },
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
  unitText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  errorBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  errorText: { color: COLORS.red, fontSize: 12 },
});
