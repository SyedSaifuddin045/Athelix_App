import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, PrimaryButton, RoundButton } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useAuthStore } from "../../store";
import { useSafePostHog } from "../../services/analytics/usePostHogSafe";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "../../api/types";

type Props = RootStackScreenProps<"Register">;

interface ValidationCheck {
  label: string;
  valid: boolean;
}

export function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const posthog = useSafePostHog();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validationChecks: ValidationCheck[] = [
    { label: "At least 3 characters", valid: username.length >= 3 },
    { label: "Valid email format", valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) },
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains a number", valid: /\d/.test(password) },
    { label: "Contains uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Passwords match", valid: password.length > 0 && password === confirmPassword },
  ];

  const isFormValid = validationChecks.every((check) => check.valid);

  const handleRegister = async () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please complete all requirements and ensure passwords match.");
      return;
    }

    clearError();

    try {
      await register(username, email, password);
      
      if (posthog) {
        posthog.identify(email, { email, username });
        posthog.capture("user_registered", { method: "email" });
      }
      
      navigation.navigate("ProfileSetup");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.data?.field_errors) {
        const fieldErrors = axiosError.response.data.field_errors;
        const messages = fieldErrors.map((fe) => `${fe.field}: ${fe.message}`).join("\n");
        Alert.alert("Validation Error", messages);
      }
    }
  };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={styles.authTop}>
        <View style={styles.authLogo}>
          <Text style={styles.splashEmoji}>💪</Text>
        </View>
        <Text style={styles.authTitle}>Create Account</Text>
        <Text style={styles.authSubtitle}>Start your fitness journey today</Text>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="jordan_fitness"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="jordan@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[styles.input, styles.inputWithRight]}
              secureTextEntry={!showPassword}
            />
            <View style={styles.inputRightIcon}>
              <RoundButton onPress={() => setShowPassword((value) => !value)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
              </RoundButton>
            </View>
          </View>
        </View>

        <Card style={styles.validationCard}>
          <Text style={styles.validationTitle}>Password Requirements</Text>
          {validationChecks.map((check, index) => (
            <View key={index} style={styles.validationRow}>
              <Feather
                name={check.valid ? "check-circle" : "circle"}
                size={14}
                color={check.valid ? COLORS.green : "rgba(255,255,255,0.28)"}
              />
              <Text style={[styles.validationLabel, check.valid && styles.validationLabelValid]}>
                {check.label}
              </Text>
            </View>
          ))}
        </Card>

        <View>
          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            secureTextEntry={!showPassword}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label={isLoading ? "Creating Account..." : "Create Account"}
          onPress={handleRegister}
          disabled={isLoading || !isFormValid}
          icon={isLoading ? <ActivityIndicator color="#000000" /> : <Feather name="user-plus" size={16} color="#000000" />}
        />
      </View>

      <Text style={styles.authBottomText}>
        Already have an account?{" "}
        <Text style={styles.linkTextInline} onPress={() => navigation.goBack()}>
          Sign In
        </Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  authTop: { alignItems: "center", paddingTop: 20, paddingBottom: 28 },
  authLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center" },
  splashEmoji: { fontSize: 38 },
  authTitle: { color: COLORS.text, fontSize: 28, fontWeight: "900", marginTop: 22 },
  authSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  formStack: { gap: 14 },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  input: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#ffffff", paddingHorizontal: 16, fontSize: 14 },
  inputWrap: { position: "relative" },
  inputWithRight: { paddingRight: 46 },
  inputRightIcon: { position: "absolute", right: 14, top: 18 },
  validationCard: { paddingHorizontal: 14, paddingVertical: 14 },
  validationTitle: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", marginBottom: 10 },
  validationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  validationLabel: { color: "rgba(255,255,255,0.35)", fontSize: 12 },
  validationLabelValid: { color: COLORS.green },
  errorBox: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" },
  errorText: { color: COLORS.red, fontSize: 12 },
  authBottomText: { color: COLORS.muted, fontSize: 13, textAlign: "center", marginTop: 24 },
  linkTextInline: { color: COLORS.teal, fontWeight: "700" },
});
