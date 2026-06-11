import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAuth, useSignUp, useSSO } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { CLERK_SSO_REDIRECT_URL } from "../auth/clerk";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton, RoundButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";

const OAUTH_PROVIDERS = [
  { strategy: "oauth_google" as const, label: "Google", icon: "chrome" as const },
  { strategy: "oauth_facebook" as const, label: "Facebook", icon: "facebook" as const },
  { strategy: "oauth_apple" as const, label: "Apple", icon: "apple" as const },
] as const;

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Register"> };

export function RegisterScreen({ navigation }: Props) {
  const { signUp, fetchStatus } = useSignUp();
  const { getToken } = useAuth();
  const { startSSOFlow } = useSSO();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const checks = [
    { label: "8+ characters", ok: form.password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label: "Number", ok: /[0-9]/.test(form.password) },
  ];

  const handleOAuth = useCallback(async (strategy: "oauth_google" | "oauth_facebook" | "oauth_apple") => {
    setError("");
    setOauthProvider(strategy);
    try {
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy,
        redirectUrl: CLERK_SSO_REDIRECT_URL,
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        let token = await getToken();
        for (let i = 0; i < 30 && !token; i++) {
          await new Promise((r) => setTimeout(r, 200));
          token = await getToken();
        }
        updateClerkToken(token);
        setOauthProvider(null);
        navigation.replace(signIn ? "MainTabs" : "ProfileSetup");
        return;
      }
      if (signUp && setActive) {
        if (signUp.status === "missing_requirements" || !signUp.createdSessionId) {
          const updates: Record<string, string> = {};
          if (signUp.missingFields?.includes("username")) {
            const emailPrefix = signUp.emailAddress?.split("@")[0] || "";
            const sanitized = emailPrefix.replace(/[^a-zA-Z0-9_-]/g, "").replace(/-+/g, "-").replace(/_+/g, "_");
            updates.username = form.username || sanitized.slice(0, 30) || `user_${Date.now()}`;
          }
          if (signUp.missingFields?.includes("first_name")) updates.firstName = signUp.firstName || "";
          if (signUp.missingFields?.includes("last_name")) updates.lastName = signUp.lastName || "";
          if (Object.keys(updates).length > 0) await signUp.update(updates);
        }
        if (signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
          let token = await getToken();
          for (let i = 0; i < 30 && !token; i++) {
            await new Promise((r) => setTimeout(r, 200));
            token = await getToken();
          }
          updateClerkToken(token);
          setOauthProvider(null);
          navigation.replace("ProfileSetup");
          return;
        }
        const required = signUp.missingFields?.join(", ");
        throw new Error(required ? `Sign-up requires: ${required}` : "Sign-up could not be completed");
      }
      throw new Error("SSO flow did not produce a session");
    } catch (err) {
      setOauthProvider(null);
      setError(getApiErrorMessage(err));
    }
  }, [getToken, navigation, startSSOFlow, form.username]);

  const handleRegister = async () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error: createError } = await signUp.create({
        emailAddress: form.email.trim(),
        password: form.password,
      });
      if (createError) {
        setLoading(false);
        const clerkErr = createError as any;
        if (clerkErr.errors?.length) {
          const messages = clerkErr.errors.map((e: any) => e.longMessage || e.message).join("; ");
          setError(messages);
        } else {
          setError(createError.message || "Registration failed");
        }
        return;
      }
      if (form.username.trim()) await signUp.update({ username: form.username.trim() });
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setLoading(false);
        setError(sendError.message || "Failed to send verification code");
        return;
      }
      setPendingVerification(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        setLoading(false);
        setError(verifyError.message || "Invalid verification code");
        return;
      }
      if (signUp.status === "complete") {
        await signUp.finalize();
        let token = await getToken();
        for (let i = 0; i < 30 && !token; i++) {
          await new Promise((r) => setTimeout(r, 200));
          token = await getToken();
        }
        updateClerkToken(token);
        setLoading(false);
        navigation.replace("ProfileSetup");
      } else {
        setLoading(false);
        setError("Verification could not be completed.");
      }
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
    }
  };

  if (pendingVerification) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: SPACING.xl5, paddingBottom: SPACING.xl7 }}>
        <View style={[styles.headerRow, { paddingTop: SPACING.lg }]}>
          <View style={styles.headerLeft}>
            <RoundButton onPress={() => { setPendingVerification(false); setCode(""); }}>
              <Icon name="arrow-left" size={16} color={COLORS.text} />
            </RoundButton>
            <View>
              <Text style={styles.headerTitle}>Verify Email</Text>
              <Text style={styles.headerSubtitle}>Check your inbox for a code</Text>
            </View>
          </View>
        </View>
        <View style={[styles.formStack, { gap: SPACING.xl2, marginTop: SPACING.xl5 }]}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Verification code"
            placeholderTextColor={COLORS.faint}
            style={[styles.input, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
            keyboardType="number-pad"
          />
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: COLORS.redDark, borderColor: "rgba(239,68,68,0.25)" }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <PrimaryButton
            label={loading ? "Verifying..." : "Verify"}
            onPress={handleVerify}
            disabled={loading || !code}
            icon={loading ? <ActivityIndicator color="#000000" /> : <Icon name="check" size={16} color="#000000" />}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: SPACING.xl5, paddingBottom: SPACING.xl7 }}>
      <View style={[styles.headerRow, { paddingTop: SPACING.lg }]}>
        <View style={styles.headerLeft}>
          <RoundButton onPress={() => navigation.replace("Login")}>
            <Icon name="arrow-left" size={16} color={COLORS.text} />
          </RoundButton>
          <View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Start your fitness journey</Text>
          </View>
        </View>
      </View>

      <View style={[styles.formStack, { gap: SPACING.xl2, marginTop: SPACING.xl4 }]}>
        <View>
          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            value={form.username}
            onChangeText={(v) => setForm((c) => ({ ...c, username: v }))}
            placeholder="jordan_lifts"
            placeholderTextColor={COLORS.faint}
            style={[styles.input, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(v) => setForm((c) => ({ ...c, email: v }))}
            placeholder="jordan@example.com"
            placeholderTextColor={COLORS.faint}
            style={[styles.input, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputWrap, { position: "relative" }]}>
            <TextInput
              value={form.password}
              onChangeText={(v) => setForm((c) => ({ ...c, password: v }))}
              placeholder="Create a strong password"
              placeholderTextColor={COLORS.faint}
              style={[styles.input, styles.inputWithRight, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
              secureTextEntry={!showPassword}
            />
            <Pressable style={[styles.inputRightIcon, { position: "absolute", right: SPACING.xl2, top: SPACING.xl3 }]} onPress={() => setShowPassword((v) => !v)}>
              <Icon name={showPassword ? "eye-off" : "eye"} size={16} color={COLORS.muted} />
            </Pressable>
          </View>
          {form.password.length > 0 ? (
            <View style={[styles.passwordChecks, { flexDirection: "row", flexWrap: "wrap", gap: SPACING.lg, marginTop: SPACING.xl }]}>
              {checks.map((check) => (
                <View key={check.label} style={[styles.passwordCheck, { flexDirection: "row", alignItems: "center", gap: SPACING.sm }]}>
                  <View style={[styles.checkBubble, { width: 14, height: 14, borderRadius: 7, backgroundColor: check.ok ? COLORS.teal : COLORS.cardSoft, alignItems: "center", justifyContent: "center" }]}>
                    {check.ok ? <Icon name="check" size={8} color="#000000" /> : null}
                  </View>
                  <Text style={[styles.passwordCheckText, check.ok ? { color: COLORS.teal } : { color: COLORS.muted }]}>{check.label}</Text>
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
          <View style={[styles.errorBox, { backgroundColor: COLORS.redDark, borderColor: "rgba(239,68,68,0.25)" }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Creating Account..." : "Create Account"}
          onPress={handleRegister}
          disabled={loading || fetchStatus === "fetching"}
          icon={loading ? <ActivityIndicator color="#000000" /> : <Icon name="arrow-right" size={16} color="#000000" />}
        />
        <View style={[styles.authDividerRow, { flexDirection: "row", alignItems: "center", gap: SPACING.lg, marginVertical: SPACING.xl4 }]}>
          <View style={[styles.divider, { flex: 1, height: 1, backgroundColor: COLORS.border }]} />
          <Text style={styles.dividerText}>or</Text>
          <View style={[styles.divider, { flex: 1, height: 1, backgroundColor: COLORS.border }]} />
        </View>
        <View style={{ gap: SPACING.lg }}>
          {OAUTH_PROVIDERS.map((provider) => (
            <Pressable
              key={provider.strategy}
              style={[styles.oauthButton, { minHeight: 52, borderRadius: RADIUS.input, backgroundColor: COLORS.cardSoft, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: SPACING.lg }]}
              onPress={() => handleOAuth(provider.strategy)}
              disabled={oauthProvider !== null}
            >
              {oauthProvider === provider.strategy ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Icon name={provider.icon} size={18} color={COLORS.text} />
              )}
              <Text style={[styles.oauthButtonText, { color: COLORS.text }]}>
                {oauthProvider === provider.strategy ? `Connecting to ${provider.label}...` : `Continue with ${provider.label}`}
              </Text>
            </Pressable>
          ))}
        </View>
        <View nativeID="clerk-captcha" />
      </View>

      <Text style={[styles.authBottomText, { color: COLORS.muted, marginTop: SPACING.xl5 }]}>
        Already have an account?{" "}
        <Text style={[styles.linkTextInline, { fontWeight: "700" }]} onPress={() => navigation.replace("Login")}>
          Sign In
        </Text>
      </Text>
    </Screen>
  );
}
