import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth, useSignUp, useSSO } from "@clerk/expo";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { CLERK_SSO_REDIRECT_URL } from "../auth/clerk";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton, RoundButton } from "../components/ui/Button";

const OAUTH_PROVIDERS = [
  { strategy: "oauth_google" as const, label: "Google", icon: "google" as const, color: "#FFFFFF" },
  { strategy: "oauth_facebook" as const, label: "Facebook", icon: "facebook" as const, color: "#1877F2" },
  { strategy: "oauth_apple" as const, label: "Apple", icon: "apple" as const, color: "#FFFFFF" },
] as const;

function RegisterScreen({ navigation }: { navigation: any }) {
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
      const { createdSessionId, setActive, signIn, signUp, authSessionResult } = await startSSOFlow({
        strategy,
        redirectUrl: CLERK_SSO_REDIRECT_URL,
      });

      console.log("[SSO] result:", {
        createdSessionId,
        hasSetActive: !!setActive,
        hasSignIn: !!signIn,
        hasSignUp: !!signUp,
        authSessionType: authSessionResult?.type,
        signUpStatus: signUp?.status,
        signUpMissingFields: signUp?.missingFields,
        signUpCreatedSessionId: signUp?.createdSessionId,
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

        if (signIn) {
          navigation.replace("MainTabs");
        } else {
          navigation.replace("ProfileSetup");
        }
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
          if (signUp.missingFields?.includes("first_name")) {
            updates.firstName = signUp.firstName || "";
          }
          if (signUp.missingFields?.includes("last_name")) {
            updates.lastName = signUp.lastName || "";
          }
          if (Object.keys(updates).length > 0) {
            await signUp.update(updates);
          }
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
      console.error("[SSO] error:", err);
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
        console.error("Clerk sign-up error:", JSON.stringify(createError, null, 2));
        const clerkErr = createError as any;
        if (clerkErr.errors?.length) {
          const messages = clerkErr.errors.map((e: any) => e.longMessage || e.message).join("; ");
          setError(messages);
        } else {
          setError(createError.message || "Registration failed");
        }
        return;
      }

      if (form.username.trim()) {
        await signUp.update({ username: form.username.trim() });
      }

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
      <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <View style={[styles.headerRow, { paddingTop: 10 }]}>
          <View style={styles.headerLeft}>
            <RoundButton onPress={() => { setPendingVerification(false); setCode(""); }}>
              <Feather name="arrow-left" size={16} color={COLORS.text} />
            </RoundButton>
            <View>
              <Text style={styles.headerTitle}>Verify Email</Text>
              <Text style={styles.headerSubtitle}>Check your inbox for a code</Text>
            </View>
          </View>
        </View>

        <View style={styles.formStack}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Verification code"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="number-pad"
          />
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <PrimaryButton
            label={loading ? "Verifying..." : "Verify"}
            onPress={handleVerify}
            disabled={loading || !code}
            icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="check" size={16} color="#000000" />}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
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
            onChangeText={(value) => setForm((current) => ({ ...current, username: value }))}
            placeholder="jordan_lifts"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
            placeholder="jordan@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={form.password}
              onChangeText={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder="Create a strong password"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[styles.input, styles.inputWithRight]}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
            </Pressable>
          </View>
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
            disabled={loading || fetchStatus === "fetching"}
            icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="arrow-right" size={16} color="#000000" />}
          />
          <View style={styles.authDividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>
          <View style={{ gap: 10 }}>
            {OAUTH_PROVIDERS.map((provider) => (
              <Pressable
                key={provider.strategy}
                style={[styles.oauthButton, { borderColor: "rgba(255,255,255,0.12)" }]}
                onPress={() => handleOAuth(provider.strategy)}
                disabled={oauthProvider !== null}
              >
                {oauthProvider === provider.strategy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name={provider.icon} size={18} color={provider.color} />
                )}
                <Text style={styles.oauthButtonText}>
                  {oauthProvider === provider.strategy ? `Connecting to ${provider.label}...` : `Continue with ${provider.label}`}
                </Text>
              </Pressable>
            ))}
          </View>
          {/* Required for Clerk's bot sign-up protection */}
          <View nativeID="clerk-captcha" />
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
