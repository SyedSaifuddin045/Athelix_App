import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthProvider";
import { getApiErrorMessage, getFieldError } from "../api/client";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton, RoundButton } from "../components/ui/Button";

function RegisterScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const checks = [
    { label: "8+ characters", ok: form.password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label: "Number", ok: /[0-9]/.test(form.password) },
  ];

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await auth.register({ username: form.username.trim(), email: form.email.trim(), password: form.password });
      setLoading(false);
      navigation.replace("ProfileSetup");
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
      const extracted: Record<string, string> = {};
      ["username", "email", "password"].forEach((field) => {
        const msg = getFieldError(err, field);
        if (msg) extracted[field] = msg;
      });
      if (Object.keys(extracted).length) setFieldErrors(extracted);
    }
  };

  return (
    <Screen glowColor="rgba(0,180,140,0.18)" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={[styles.headerRow, { paddingTop: 10 }]}>
        <View style={styles.headerLeft}>
          <RoundButton onPress={() => navigation.replace("Login")}>
            <Feather name="arrow-left" size={16} color={COLORS.text} />
          </RoundButton>
          <View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Start your fitness journey</Text>
          </View>
        </View>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            value={form.username}
            onChangeText={(value) => {
              setForm((current) => ({ ...current, username: value }));
              clearFieldError("username");
            }}
            placeholder="jordan_lifts"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.input, fieldErrors.username ? { borderColor: COLORS.red } : null]}
          />
          {fieldErrors.username ? <Text style={styles.fieldError}>{fieldErrors.username}</Text> : null}
        </View>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => {
              setForm((current) => ({ ...current, email: value }));
              clearFieldError("email");
            }}
            placeholder="jordan@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.input, fieldErrors.email ? { borderColor: COLORS.red } : null]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={form.password}
              onChangeText={(value) => {
                setForm((current) => ({ ...current, password: value }));
                clearFieldError("password");
              }}
              placeholder="Create a strong password"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[styles.input, styles.inputWithRight, fieldErrors.password ? { borderColor: COLORS.red } : null]}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
            </Pressable>
          </View>
          {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}
          {form.password.length > 0 ? (
            <View style={styles.passwordChecks}>
              {checks.map((check) => (
                <View key={check.label} style={styles.passwordCheck}>
                  <View style={[styles.checkBubble, check.ok ? { backgroundColor: COLORS.teal } : null]}>
                    {check.ok ? <Feather name="check" size={8} color="#000000" /> : null}
                  </View>
                  <Text style={[styles.passwordCheckText, check.ok ? { color: COLORS.teal } : null]}>{check.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <Text style={styles.legalText}>
          By creating an account, you agree to our <Text style={styles.linkTextInline}>Terms of Service</Text> and{" "}
          <Text style={styles.linkTextInline}>Privacy Policy</Text>.
        </Text>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Creating Account..." : "Create Account"}
          onPress={handleRegister}
          disabled={loading}
          icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="arrow-right" size={16} color="#000000" />}
        />
      </View>

      <Text style={styles.authBottomText}>
        Already have an account?{" "}
        <Text style={styles.linkTextInline} onPress={() => navigation.replace("Login")}>
          Sign In
        </Text>
      </Text>
    </Screen>
  );
}

export default RegisterScreen;
