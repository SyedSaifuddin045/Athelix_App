import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { usePostHog } from "posthog-react-native";
import { Screen, PrimaryButton, RoundButton } from "../../components";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";
import { useAuth } from "../../app/providers/AuthProvider";
import { getFieldErrorMessage, isApiError } from "../../lib/api/error";

type Props = RootStackScreenProps<"Login">;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const { signIn } = useAuth();
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogin = async (): Promise<void> => {
    setGeneralError("");
    setEmailError("");
    setPasswordError("");

    if (!email.trim() || !password.trim()) {
      setGeneralError("Enter both email and password.");
      if (!email.trim()) {
        setEmailError("Email is required.");
      }
      if (!password.trim()) {
        setPasswordError("Password is required.");
      }
      return;
    }

    setLoading(true);
    try {
      const destination = await signIn({
        email: email.trim(),
        password,
      });

      if (posthog) {
        posthog.identify(email.trim().toLowerCase(), { email: email.trim().toLowerCase() });
        posthog.capture("user_logged_in", { method: "email" });
      }

      navigation.replace(destination);
    } catch (error) {
      if (isApiError(error)) {
        setGeneralError(error.message);
        setEmailError(getFieldErrorMessage(error, "email") ?? "");
        setPasswordError(getFieldErrorMessage(error, "password") ?? "");
      } else {
        setGeneralError("Unable to sign in right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      glowColor="rgba(0,180,140,0.22)"
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
    >
      <View style={styles.authTop}>
        <View style={styles.authLogo}>
          <Text style={styles.splashEmoji}>🏋️</Text>
        </View>
        <Text style={styles.authTitle}>Welcome back</Text>
        <Text style={styles.authSubtitle}>Sign in to continue your training journey</Text>
      </View>

      <View style={styles.formStack}>
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
              placeholder="••••••••"
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

        {generalError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label={loading ? "Signing In..." : "Sign In"}
          onPress={() => {
            void handleLogin();
          }}
          disabled={loading}
          icon={
            loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Feather name="arrow-right" size={16} color="#000000" />
            )
          }
        />
      </View>

      <Text style={styles.authBottomText}>
        Don&apos;t have an account?{" "}
        <Text
          style={styles.linkTextInline}
          onPress={() => navigation.navigate("Register")}
        >
          Sign Up
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
