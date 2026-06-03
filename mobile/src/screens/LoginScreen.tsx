import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthProvider";
import { getApiErrorMessage } from "../api/client";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton } from "../components/ui/Button";

function LoginScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await auth.login({ email: email.trim(), password });
      setLoading(false);
      navigation.replace("MainTabs");
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
    }
  };

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
          disabled={loading}
          icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="arrow-right" size={16} color="#000000" />}
        />
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
