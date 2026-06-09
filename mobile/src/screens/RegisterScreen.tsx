import { useCallback, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth, useSignUp as useModernSignUp } from "@clerk/expo";
import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import * as WebBrowser from "expo-web-browser";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton, RoundButton } from "../components/ui/Button";

function waitForLinkingUrl(prefix: string, timeoutMs = 30000): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    const sub = Linking.addEventListener("url", (event) => {
      if (event.url && event.url.startsWith(prefix)) {
        clearTimeout(timer);
        sub.remove();
        resolve(event.url);
      }
    });
  });
}

const OAUTH_PROVIDERS = [
  { strategy: "oauth_google" as const, label: "Google", icon: "google" as const, color: "#FFFFFF" },
  { strategy: "oauth_facebook" as const, label: "Facebook", icon: "facebook" as const, color: "#1877F2" },
  { strategy: "oauth_apple" as const, label: "Apple", icon: "apple" as const, color: "#FFFFFF" },
] as const;

function RegisterScreen({ navigation }: { navigation: any }) {
  const { signIn: legacySignIn, setActive } = useSignIn();
  const { signUp: legacySignUp } = useSignUp();
  const { getToken } = useAuth();
  const { signUp: modernSignUp, fetchStatus } = useModernSignUp();
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

    if (!legacySignIn || !legacySignUp || !setActive) {
      setError("Authentication not ready. Please try again.");
      setOauthProvider(null);
      return;
    }

    try {
      const redirectUrl = "athelix://sso-callback";

      await legacySignIn.create({ strategy, redirectUrl });
      const externalUrl = legacySignIn.firstFactorVerification?.externalVerificationRedirectURL?.toString();
      if (!externalUrl) {
        throw new Error("Failed to start OAuth flow");
      }

      const linkingUrl = waitForLinkingUrl(redirectUrl);
      const authResult = await WebBrowser.openAuthSessionAsync(externalUrl, redirectUrl);

      let capturedUrl: string | null = null;
      if (authResult.type === "success" && authResult.url) {
        capturedUrl = authResult.url;
      } else {
        capturedUrl = await Promise.race([
          linkingUrl,
          new Promise<null>((r) => setTimeout(r, 3000)),
        ]);
      }

      if (!capturedUrl) {
        throw new Error("No redirect URL received from OAuth provider");
      }

      const params = new URL(capturedUrl).searchParams;
      const rotatingTokenNonce = params.get("rotating_token_nonce") ?? "";
      if (!rotatingTokenNonce) {
        throw new Error(
          `No rotating token in OAuth redirect. URL: ${capturedUrl}`
        );
      }

      await legacySignIn.reload({ rotatingTokenNonce });

      if (legacySignIn.firstFactorVerification?.status === "transferable") {
        await legacySignUp.create({ transfer: true });
      }

      const sessionId = legacySignIn.createdSessionId || legacySignUp.createdSessionId;

      if (!sessionId) {
        const status = legacySignIn.status || "unknown";
        const ffStatus = legacySignIn.firstFactorVerification?.status || "none";
        throw new Error(
          `OAuth flow did not produce a session. Sign-in status: ${status}, verification: ${ffStatus}`
        );
      }

      await setActive({ session: sessionId });

      let token = await getToken();
      for (let i = 0; i < 30 && !token; i++) {
        await new Promise((r) => setTimeout(r, 200));
        token = await getToken();
      }
      updateClerkToken(token);
      setOauthProvider(null);
      navigation.replace("ProfileSetup");
    } catch (err) {
      setOauthProvider(null);
      setError(getApiErrorMessage(err));
    }
  }, [legacySignIn, legacySignUp, setActive, getToken, navigation]);

  const handleRegister = async () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error: createError } = await modernSignUp.create({
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
        await modernSignUp.update({ username: form.username.trim() });
      }

      const { error: sendError } = await modernSignUp.verifications.sendEmailCode();
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
      const { error: verifyError } = await modernSignUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        setLoading(false);
        setError(verifyError.message || "Invalid verification code");
        return;
      }

      if (modernSignUp.status === "complete") {
        await modernSignUp.finalize();
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
