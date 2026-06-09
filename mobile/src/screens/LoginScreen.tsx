import { useCallback, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth, useSignIn as useModernSignIn } from "@clerk/expo";
import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton } from "../components/ui/Button";

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

function LoginScreen({ navigation }: { navigation: any }) {
  const { signIn: modernSignIn, fetchStatus } = useModernSignIn();
  const { signIn: legacySignIn, setActive } = useSignIn();
  const { signUp } = useSignUp();
  const { isSignedIn = false, getToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleOAuth = useCallback(async (strategy: "oauth_google" | "oauth_facebook" | "oauth_apple") => {
    setError("");
    setOauthProvider(strategy);

    if (!legacySignIn || !signUp || !setActive) {
      setError("Authentication not ready. Please try again.");
      setOauthProvider(null);
      return;
    }

    try {
      const redirectUrl = Platform.OS === "web"
        ? makeRedirectUri({ path: "sso-callback" })
        : "athelix://sso-callback";

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
        await signUp.create({ transfer: true });
      }

      const sessionId = legacySignIn.createdSessionId || signUp.createdSessionId;

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
      navigation.replace("MainTabs");
    } catch (err) {
      setOauthProvider(null);
      setError(getApiErrorMessage(err));
    }
  }, [legacySignIn, signUp, setActive, getToken, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await modernSignIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (signInError) {
        setLoading(false);
        setError(signInError.message || "Sign in failed");
        return;
      }

      if (modernSignIn.status === "complete") {
        await modernSignIn.finalize();
        const token = await getToken();
        updateClerkToken(token);
        setLoading(false);
        navigation.replace("MainTabs");
      } else if (modernSignIn.status === "needs_second_factor") {
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
    <Screen contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
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
            keyboardType="email-address"
            autoCapitalize="none"
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
            <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
            </Pressable>
          </View>
        </View>
        <Pressable>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
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
      </View>

      <Text style={styles.authBottomText}>
        Don't have an account?{" "}
        <Text style={styles.linkTextInline} onPress={() => navigation.navigate("Register")}>
          Sign Up
        </Text>
      </Text>
    </Screen>
  );
}

export default LoginScreen;
