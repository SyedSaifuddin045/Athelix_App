import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Card, PrimaryButton, RoundButton } from "../../components";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";
import { useAuth } from "../../app/providers/AuthProvider";
import { getFieldErrorMessage, isApiError } from "../../lib/api/error";

type Props = RootStackScreenProps<"Register">;

interface ValidationCheck {
  label: string;
  valid: boolean;
}

export function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const { signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validationChecks: ValidationCheck[] = useMemo(
    () => [
      { label: "At least 8 characters", valid: password.length >= 8 },
      { label: "Contains a number", valid: /\d/.test(password) },
      { label: "Contains uppercase letter", valid: /[A-Z]/.test(password) },
      {
        label: "Passwords match",
        valid: password.length > 0 && password === confirmPassword,
      },
    ],
    [confirmPassword, password],
  );

  const isFormValid =
    validationChecks.every((check) => check.valid) &&
    username.trim().length >= 3 &&
    email.trim().length > 0;

  const handleRegister = async (): Promise<void> => {
    setGeneralError("");
    setUsernameError("");
    setEmailError("");
    setPasswordError("");

    if (!isFormValid) {
      setGeneralError("Complete all requirements before creating your account.");
      if (username.trim().length < 3) {
        setUsernameError("Username must be at least 3 characters.");
      }
      if (!email.trim()) {
        setEmailError("Email is required.");
      }
      if (!validationChecks.every((check) => check.valid)) {
        setPasswordError("Password requirements are not met.");
      }
      return;
    }

    setLoading(true);
    try {
      const destination = await signUp({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      navigation.replace(destination);
    } catch (error) {
      if (isApiError(error)) {
        setGeneralError(error.message);
        setUsernameError(getFieldErrorMessage(error, "username") ?? "");
        setEmailError(getFieldErrorMessage(error, "email") ?? "");
        setPasswordError(getFieldErrorMessage(error, "password") ?? "");
      } else {
        setGeneralError("Unable to create your account right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={styles.authTop}>
        <View style={styles.authLogo}>
          <Text style={styles.splashEmoji}>🏋️</Text>
        </View>
        <Text style={styles.authTitle}>Create Account</Text>
        <Text style={styles.authSubtitle}>Start training with a real synced profile</Text>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="athlete_one"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.input, usernameError ? styles.inputError : null]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {usernameError ? <Text style={styles.fieldError}>{usernameError}</Text> : null}
        </View>

        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="athlete@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.input, emailError ? styles.inputError : null]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
        </View>

        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[
                styles.input,
                styles.inputWithRight,
                passwordError ? styles.inputError : null,
              ]}
              secureTextEntry={!showPassword}
            />
            <View style={styles.inputRightIcon}>
              <RoundButton onPress={() => setShowPassword((value) => !value)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color="rgba(255,255,255,0.42)"
                />
              </RoundButton>
            </View>
          </View>
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
        </View>

        <Card style={styles.validationCard}>
          <Text style={styles.validationTitle}>Password Requirements</Text>
          {validationChecks.map((check) => (
            <View key={check.label} style={styles.validationRow}>
              <Feather
                name={check.valid ? "check-circle" : "circle"}
                size={14}
                color={check.valid ? COLORS.green : "rgba(255,255,255,0.28)"}
              />
              <Text
                style={[
                  styles.validationLabel,
                  check.valid ? styles.validationLabelValid : null,
                ]}
              >
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
            style={[styles.input, passwordError ? styles.inputError : null]}
            secureTextEntry={!showPassword}
          />
        </View>

        {generalError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label={loading ? "Creating Account..." : "Create Account"}
          onPress={() => {
            void handleRegister();
          }}
          disabled={loading || !isFormValid}
          icon={
            loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Feather name="user-plus" size={16} color="#000000" />
            )
          }
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
  authLogo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  splashEmoji: { fontSize: 38 },
  authTitle: { color: COLORS.text, fontSize: 28, fontWeight: "900", marginTop: 22 },
  authSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 6, textAlign: "center" },
  formStack: { gap: 14 },
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
  inputWrap: { position: "relative" },
  inputWithRight: { paddingRight: 46 },
  inputRightIcon: { position: "absolute", right: 14, top: 18 },
  inputError: { borderColor: "rgba(248,113,113,0.55)" },
  fieldError: { color: COLORS.red, fontSize: 11, marginTop: 6 },
  validationCard: { paddingHorizontal: 14, paddingVertical: 14 },
  validationTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 10,
  },
  validationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  validationLabel: { color: "rgba(255,255,255,0.35)", fontSize: 12 },
  validationLabelValid: { color: COLORS.green },
  errorBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  errorText: { color: COLORS.red, fontSize: 12 },
  authBottomText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 24,
  },
  linkTextInline: { color: COLORS.teal, fontWeight: "700" },
});
