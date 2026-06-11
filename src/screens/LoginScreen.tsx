import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAuth, useSignIn, useSSO } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { CLERK_SSO_REDIRECT_URL } from "../auth/clerk";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS, SHADOWS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";

const OAUTH_PROVIDERS = [
  { strategy: "oauth_google" as const, label: "Google", icon: "chrome" as const },
  { strategy: "oauth_facebook" as const, label: "Facebook", icon: "facebook" as const },
  { strategy: "oauth_apple" as const, label: "Apple", icon: "apple" as const },
] as const;

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Login"> };

export function LoginScreen({ navigation }: Props) {
  const { signIn, fetchStatus } = useSignIn();
  const { isSignedIn = false, getToken } = useAuth();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleOAuth = useCallback(
    async (strategy: "oauth_google" | "oauth_facebook" | "oauth_apple") => {
      setError("");
      setOauthProvider(strategy);
      try {
        const { createdSessionId, setActive, signUp, signIn } = await startSSOFlow({
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
          navigation.replace("MainTabs");
          return;
        }
        if (signUp?.status === "missing_requirements") {
          throw new Error("Please sign up via the Register screen to complete your profile.");
        }
        if (signIn?.status === "needs_second_factor") {
          throw new Error("Additional verification required.");
        }
        throw new Error("SSO flow did not produce a session");
      } catch (err) {
        setOauthProvider(null);
        setError(getApiErrorMessage(err));
      }
    },
    [getToken, navigation, startSSOFlow],
  );

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });
      if (signInError) {
        setLoading(false);
        setError(signInError.message || "Sign in failed");
        return;
      }
      if (signIn.status === "complete") {
        await signIn.finalize();
        const token = await getToken();
        updateClerkToken(token);
        setLoading(false);
        navigation.replace("MainTabs");
      } else if (signIn.status === "needs_second_factor") {
        setLoading(false);
        setError("Additional verification required.");
      } else {
        setLoading(false);
        setError("Sign in could not be completed.");
      }
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
    }
  };

  if (isSignedIn) return null;

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: SPACING.xl5, paddingBottom: SPACING.xl7 }}>
      <View style={[styles.authTop, { alignItems: "center", paddingTop: SPACING.xl4, paddingBottom: SPACING.xl6 }]}>
        <View
          style={[
            styles.authLogo,
            SHADOWS.glow(COLORS.teal),
            {
              width: 80,
              height: 80,
              borderRadius: RADIUS.card,
              backgroundColor: COLORS.teal,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Icon name="dumbbell" size={36} color="#000000" strokeWidth={2.5} />
        </View>
        <Text style={[styles.authTitle, { marginTop: SPACING.xl4 }]}>Welcome back</Text>
        <Text style={[styles.authSubtitle, { marginTop: SPACING.sm }]}>
          Sign in to continue your journey
        </Text>
      </View>

      <View style={[styles.formStack, { gap: SPACING.xl2 }]}>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="jordan@example.com"
            placeholderTextColor={COLORS.faint}
            style={[
              styles.input,
              {
                backgroundColor: COLORS.cardSoft,
                borderColor: COLORS.border,
                color: COLORS.text,
                borderRadius: RADIUS.input,
              },
            ]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputWrap, { position: "relative" }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.faint}
              style={[
                styles.input,
                styles.inputWithRight,
                {
                  backgroundColor: COLORS.cardSoft,
                  borderColor: COLORS.border,
                  color: COLORS.text,
                  borderRadius: RADIUS.input,
                },
              ]}
              secureTextEntry={!showPassword}
            />
            <Pressable
              style={[styles.inputRightIcon, { position: "absolute", right: SPACING.xl2, top: SPACING.xl3 }]}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={16} color={COLORS.muted} />
            </Pressable>
          </View>
        </View>
        <Pressable>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: COLORS.redDark, borderColor: "rgba(239,68,68,0.25)" }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
          disabled={loading || fetchStatus === "fetching"}
          icon={
            loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Icon name="arrow-right" size={16} color="#000000" />
            )
          }
        />
        <View style={[styles.authDividerRow, { flexDirection: "row", alignItems: "center", gap: SPACING.lg, marginVertical: SPACING.xl4 }]}>
          <View style={[styles.divider, { flex: 1, height: 1, backgroundColor: COLORS.border }]} />
          <Text style={[styles.dividerText, { color: COLORS.muted }]}>or</Text>
          <View style={[styles.divider, { flex: 1, height: 1, backgroundColor: COLORS.border }]} />
        </View>
        <View style={{ gap: SPACING.lg }}>
          {OAUTH_PROVIDERS.map((provider) => (
            <Pressable
              key={provider.strategy}
              style={[
                styles.oauthButton,
                {
                  minHeight: 52,
                  borderRadius: RADIUS.input,
                  backgroundColor: COLORS.cardSoft,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: SPACING.lg,
                },
              ]}
              onPress={() => handleOAuth(provider.strategy)}
              disabled={oauthProvider !== null}
            >
              {oauthProvider === provider.strategy ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Icon name={provider.icon} size={18} color={COLORS.text} />
              )}
              <Text style={[styles.oauthButtonText, { color: COLORS.text }]}>
                {oauthProvider === provider.strategy
                  ? `Connecting to ${provider.label}...`
                  : `Continue with ${provider.label}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={[styles.authBottomText, { color: COLORS.muted, marginTop: SPACING.xl5 }]}>
        Don't have an account?{" "}
        <Text
          style={[styles.linkTextInline, { fontWeight: "700" }]}
          onPress={() => navigation.navigate("Register")}
        >
          Sign Up
        </Text>
      </Text>
    </Screen>
  );
}
