import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAuth, useSignUp, useSSO } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { CLERK_SSO_REDIRECT_URL } from "../auth/clerk";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton, RoundButton } from "../components/ui/Button";
import { AppIcon } from "../design-system/icons/AppIcon";

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
  const theme = useTheme();
  const accent = theme.accent?.toString() ?? "#FF5A36";
  const textColor = theme.color?.toString() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.toString() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.toString() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)";
  const redColor = theme.colorRed?.toString() ?? "#EF4444";
  const redDarkColor = theme.colorRedDark?.toString() ?? "rgba(239,68,68,0.12)";
  const surfaceHover = theme.surfaceHover?.toString() ?? "rgba(255,255,255,0.06)";
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
      <Screen contentContainerStyle={{ paddingHorizontal: spacing.xl5, paddingBottom: spacing.xl7 }}>
        <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, { paddingTop: spacing.lg }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <RoundButton onPress={() => { setPendingVerification(false); setCode(""); }}>
              <AppIcon name="arrow-left" size={16} color={textColor} />
            </RoundButton>
            <View>
              <Text style={{ color: textColor, fontSize: 17, fontWeight: "700" }}>Verify Email</Text>
              <Text style={{ color: mutedColor, fontSize: 11, marginTop: 2 }}>Check your inbox for a code</Text>
            </View>
          </View>
        </View>
        <View style={[{ gap: spacing.xl2, marginTop: spacing.xl5 }]}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Verification code"
            placeholderTextColor={faintColor}
            style={{ width: "100%", minHeight: 52, borderRadius: radii.input, backgroundColor: surfaceHover, borderWidth: 1, borderColor: borderColor, color: textColor, paddingHorizontal: 16, fontSize: 14 }}
            keyboardType="number-pad"
          />
          {error ? (
            <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: redDarkColor, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }}>
              <Text style={{ color: redColor, fontSize: 12 }}>{error}</Text>
            </View>
          ) : null}
          <PrimaryButton
            label={loading ? "Verifying..." : "Verify"}
            onPress={handleVerify}
            disabled={loading || !code}
            icon={loading ? <ActivityIndicator color="#000000" /> : <AppIcon name="check" size={16} color="#000000" />}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: spacing.xl5, paddingBottom: spacing.xl7 }}>
      <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, { paddingTop: spacing.lg }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <RoundButton onPress={() => navigation.replace("Login")}>
            <AppIcon name="arrow-left" size={16} color={textColor} />
          </RoundButton>
          <View>
            <Text style={{ color: textColor, fontSize: 17, fontWeight: "700" }}>Create Account</Text>
            <Text style={{ color: mutedColor, fontSize: 11, marginTop: 2 }}>Start your fitness journey</Text>
          </View>
        </View>
      </View>

      <View style={[{ gap: spacing.xl2, marginTop: spacing.xl4 }]}>
        <View>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Username</Text>
          <TextInput
            value={form.username}
            onChangeText={(v) => setForm((c) => ({ ...c, username: v }))}
            placeholder="jordan_lifts"
            placeholderTextColor={faintColor}
            style={{ width: "100%", minHeight: 52, borderRadius: radii.input, backgroundColor: surfaceHover, borderWidth: 1, borderColor: borderColor, color: textColor, paddingHorizontal: 16, fontSize: 14 }}
          />
        </View>
        <View>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(v) => setForm((c) => ({ ...c, email: v }))}
            placeholder="jordan@example.com"
            placeholderTextColor={faintColor}
            style={{ width: "100%", minHeight: 52, borderRadius: radii.input, backgroundColor: surfaceHover, borderWidth: 1, borderColor: borderColor, color: textColor, paddingHorizontal: 16, fontSize: 14 }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Password</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              value={form.password}
              onChangeText={(v) => setForm((c) => ({ ...c, password: v }))}
              placeholder="Create a strong password"
              placeholderTextColor={faintColor}
              style={{ width: "100%", minHeight: 52, borderRadius: radii.input, backgroundColor: surfaceHover, borderWidth: 1, borderColor: borderColor, color: textColor, paddingHorizontal: 16, fontSize: 14, paddingRight: 46 }}
              secureTextEntry={!showPassword}
            />
            <Pressable style={{ position: "absolute", right: spacing.xl2, top: spacing.xl3 }} onPress={() => setShowPassword((v) => !v)}>
              <AppIcon name={showPassword ? "eye-off" : "eye"} size={16} color={mutedColor} />
            </Pressable>
          </View>
          {form.password.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.xl }}>
              {checks.map((check) => (
                <View key={check.label} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: check.ok ? accent : surfaceHover, alignItems: "center", justifyContent: "center" }}>
                    {check.ok ? <AppIcon name="check" size={8} color="#000000" /> : null}
                  </View>
                  <Text style={[check.ok ? { color: accent } : { color: mutedColor }, { fontSize: 10 }]}>{check.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, lineHeight: 16 }}>
          By creating an account, you agree to our <Text style={{ color: accent, fontWeight: "700" }}>Terms of Service</Text> and{" "}
          <Text style={{ color: accent, fontWeight: "700" }}>Privacy Policy</Text>.
        </Text>
        {error ? (
          <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: redDarkColor, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }}>
            <Text style={{ color: redColor, fontSize: 12 }}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Creating Account..." : "Create Account"}
          onPress={handleRegister}
          disabled={loading || fetchStatus === "fetching"}
          icon={loading ? <ActivityIndicator color="#000000" /> : <AppIcon name="arrow-right" size={16} color="#000000" />}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, marginVertical: spacing.xl4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: borderColor }} />
          <Text style={{ color: mutedColor, fontSize: 11 }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: borderColor }} />
        </View>
        <View style={{ gap: spacing.lg }}>
          {OAUTH_PROVIDERS.map((provider) => (
            <Pressable
              key={provider.strategy}
              style={{ minHeight: 52, borderRadius: radii.input, backgroundColor: surfaceHover, borderWidth: 1, borderColor: borderColor, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.lg }}
              onPress={() => handleOAuth(provider.strategy)}
              disabled={oauthProvider !== null}
            >
              {oauthProvider === provider.strategy ? (
                <ActivityIndicator color={textColor} />
              ) : (
                <AppIcon name={provider.icon} size={18} color={textColor} />
              )}
              <Text style={{ color: textColor, fontSize: 14, fontWeight: "600" }}>
                {oauthProvider === provider.strategy ? `Connecting to ${provider.label}...` : `Continue with ${provider.label}`}
              </Text>
            </Pressable>
          ))}
        </View>
        <View nativeID="clerk-captcha" />
      </View>

      <Text style={[{ color: mutedColor, fontSize: 13, textAlign: "center" }, { marginTop: spacing.xl5 }]}>
        Already have an account?{" "}
        <Text style={[{ color: accent, fontWeight: "700" }]} onPress={() => navigation.replace("Login")}>
          Sign In
        </Text>
      </Text>
    </Screen>
  );
}
