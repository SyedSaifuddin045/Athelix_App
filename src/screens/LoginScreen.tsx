import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth, useSignIn, useSSO } from "@clerk/expo";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { CLERK_SSO_REDIRECT_URL } from "../auth/clerk";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton } from "../components/ui/Button";

const OAUTH_PROVIDERS = [
  { strategy: "oauth_google" as const, label: "Google", icon: "google" as const, color: "#FFFFFF" },
  { strategy: "oauth_facebook" as const, label: "Facebook", icon: "facebook" as const, color: "#1877F2" },
  { strategy: "oauth_apple" as const, label: "Apple", icon: "apple" as const, color: "#FFFFFF" },
] as const;

function LoginScreen({ navigation }: { navigation: any }) {
  const { signIn, fetchStatus } = useSignIn();
  const { isSignedIn = false, getToken } = useAuth();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleOAuth = useCallback(async (strategy: "oauth_google" | "oauth_facebook" | "oauth_apple") => {
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
  }, [getToken, navigation, startSSOFlow]);

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
