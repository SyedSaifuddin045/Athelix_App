import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAuth, useSignIn, useSSO } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { CLERK_SSO_REDIRECT_URL } from "../auth/clerk";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton } from "../components/ui/Button";
import { AppIcon } from "../design-system/icons/AppIcon";

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
  const theme = useTheme();
  const accent = theme.accent?.toString() ?? "#FF5A36";
  const textColor = theme.color?.toString() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.toString() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.toString() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)";
  const redColor = theme.colorRed?.toString() ?? "#EF4444";
  const redDarkColor = theme.colorRedDark?.toString() ?? "rgba(239,68,68,0.12)";
  const surfaceHover = theme.surfaceHover?.toString() ?? "rgba(255,255,255,0.06)";

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
    <Screen contentContainerStyle={{ paddingHorizontal: spacing.xl5, paddingBottom: spacing.xl7 }}>
      <View style={[{ alignItems: "center", paddingTop: spacing.xl4, paddingBottom: spacing.xl6 }]}>
        <View
          style={[
            {
              shadowColor: accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            },
            {
              width: 80,
              height: 80,
              borderRadius: radii.card,
              backgroundColor: accent,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <AppIcon name="dumbbell" size={36} color="#000000" strokeWidth={2.5} />
        </View>
        <Text style={[{ color: textColor, fontSize: 28, fontWeight: "900" }, { marginTop: spacing.xl4 }]}>Welcome back</Text>
        <Text style={[{ color: mutedColor, fontSize: 13 }, { marginTop: spacing.sm }]}>
          Sign in to continue your journey
        </Text>
      </View>

      <View style={[{ gap: spacing.xl2 }]}>
        <View>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="jordan@example.com"
            placeholderTextColor={faintColor}
            style={{
              width: "100%",
              minHeight: 52,
              borderRadius: radii.input,
              backgroundColor: surfaceHover,
              borderWidth: 1,
              borderColor: borderColor,
              color: textColor,
              paddingHorizontal: 16,
              fontSize: 14,
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Password</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={faintColor}
              style={{
                width: "100%",
                minHeight: 52,
                borderRadius: radii.input,
                backgroundColor: surfaceHover,
                borderWidth: 1,
                borderColor: borderColor,
                color: textColor,
                paddingHorizontal: 16,
                fontSize: 14,
                paddingRight: 46,
              }}
              secureTextEntry={!showPassword}
            />
            <Pressable
              style={{ position: "absolute", right: spacing.xl2, top: spacing.xl3 }}
              onPress={() => setShowPassword((v) => !v)}
            >
              <AppIcon name={showPassword ? "eye-off" : "eye"} size={16} color={mutedColor} />
            </Pressable>
          </View>
        </View>
        <Pressable>
          <Text style={{ color: accent, fontSize: 12, fontWeight: "600" }}>Forgot password?</Text>
        </Pressable>
        {error ? (
          <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: redDarkColor, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }}>
            <Text style={{ color: redColor, fontSize: 12 }}>{error}</Text>
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
              <AppIcon name="arrow-right" size={16} color="#000000" />
            )
          }
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
              style={{
                minHeight: 52,
                borderRadius: radii.input,
                backgroundColor: surfaceHover,
                borderWidth: 1,
                borderColor: borderColor,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: spacing.lg,
              }}
              onPress={() => handleOAuth(provider.strategy)}
              disabled={oauthProvider !== null}
            >
              {oauthProvider === provider.strategy ? (
                <ActivityIndicator color={textColor} />
              ) : (
                <AppIcon name={provider.icon} size={18} color={textColor} />
              )}
              <Text style={{ color: textColor, fontSize: 14, fontWeight: "600" }}>
                {oauthProvider === provider.strategy
                  ? `Connecting to ${provider.label}...`
                  : `Continue with ${provider.label}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={[{ color: mutedColor, fontSize: 13, textAlign: "center" }, { marginTop: spacing.xl5 }]}>
        Don't have an account?{" "}
        <Text
          style={[{ color: accent, fontWeight: "700" }]}
          onPress={() => navigation.navigate("Register")}
        >
          Sign Up
        </Text>
      </Text>
    </Screen>
  );
}
