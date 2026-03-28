import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, PrimaryButton, RoundButton } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useAuthStore } from "../../store";
import { useSafePostHog } from "../../services/analytics/usePostHogSafe";

type Props = RootStackScreenProps<"Login">;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const posthog = useSafePostHog();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    clearError();

    try {
      await login(email, password);
      
      if (posthog) {
        posthog.identify(email, { email });
        posthog.capture("user_logged_in", { method: "email" });
      }
      
      navigation.replace("MainTabs");
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handleDemoLogin = async () => {
    clearError();

    try {
      await login("demo", "demo123");
      
      if (posthog) {
        posthog.identify("demo_user", { username: "demo" });
        posthog.capture("user_logged_in", { method: "demo" });
      }
      
      navigation.replace("MainTabs");
    } catch {
      Alert.alert("Demo Login Failed", "Demo mode is not available. Please create an account or login with your credentials.");
    }
  };

  return (
    <Screen glowColor="rgba(0,180,140,0.22)" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={styles.authTop}>
        <View style={styles.authLogo}>
          <Text style={styles.splashEmoji}>💪</Text>
        </View>
        <Text style={styles.authTitle}>Welcome back</Text>
        <Text style={styles.authSubtitle}>Sign in to continue your journey</Text>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="jordan@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
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
        <View>
          <Text style={styles.linkText}>Forgot password?</Text>
        </View>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={isLoading ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
          disabled={isLoading}
          icon={isLoading ? <ActivityIndicator color="#000000" /> : <Feather name="arrow-right" size={16} color="#000000" />}
        />
      </View>

      <View style={styles.authDividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or continue as</Text>
        <View style={styles.divider} />
      </View>

      <PrimaryButton
        label="Continue as Demo User"
        onPress={handleDemoLogin}
        subtle
        disabled={isLoading}
        icon={<Feather name="user" size={16} color="rgba(255,255,255,0.7)" />}
      />

      <Text style={styles.authBottomText}>
        Don't have an account?{" "}
        <Text style={styles.linkTextInline} onPress={() => navigation.navigate("Register")}>
          Sign Up
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
  inputRightIcon: { position: "absolute", right: 8, top: 8 },
  linkText: { color: COLORS.teal, fontSize: 12, fontWeight: "600" },
  errorBox: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" },
  errorText: { color: COLORS.red, fontSize: 12 },
  authDividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 26 },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerText: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  authBottomText: { color: COLORS.muted, fontSize: 13, textAlign: "center", marginTop: 24 },
  linkTextInline: { color: COLORS.teal, fontWeight: "700" },
});
