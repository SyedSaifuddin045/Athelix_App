import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, Text, TextInput, View } from "react-native";
import { usePostHog } from "posthog-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useCurrentUserQuery } from "../api/queries";
import { useSaveAccount } from "../api/mutations";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card } from "../components/ui/Card";
import { validateUsername } from "../utils/validation";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { LabeledInput } from "../components/ui/Input";
import { AppIcon } from "../design-system/icons/AppIcon";
import { apiFetch, ApiError, getApiErrorMessage } from "../api/client";
import { successData } from "../utils/mapping";
import { Events } from "../analytics/events";


type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Settings"> };

export function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false, signOut } = useAuth();
  const posthog = usePostHog();
  const currentUser = useCurrentUserQuery(isAuthenticated);
  const [form, setForm] = useState({ username: "", email: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const greenColor = theme.colorGreen?.get() ?? "#22C55E";
  const greenDarkColor = theme.colorGreenDark?.get() ?? "rgba(34,197,94,0.12)";
  const redColor = theme.colorRed?.get() ?? "#EF4444";
  const redDarkColor = theme.colorRedDark?.get() ?? "rgba(239,68,68,0.12)";

  useEffect(() => {
    if (!currentUser.data) return;
    setForm((c) => ({ ...c, username: currentUser.data.username, email: currentUser.data.email }));
  }, [currentUser.data]);

  const saveAccount = useSaveAccount({
    onSuccess: () => {
      posthog.capture(Events.ACCOUNT_SETTINGS_UPDATED, {
        changed_username: currentUser.data?.username !== form.username.trim(),
        changed_email: currentUser.data?.email !== form.email.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err);
      const isUsernameConflict = err instanceof ApiError && err.status === 409;
      if (isUsernameConflict) setUsernameError(msg);
      else setError(msg);
    },
  });

  const handleSave = () => {
    setError("");
    const usernameErr = validateUsername(form.username);
    if (usernameErr) {
      setUsernameError(usernameErr);
      return;
    }
    setUsernameError("");
    const payload: { username: string | null; email: string | null; password?: string } = {
      username: form.username.trim() || null,
      email: form.email.trim() || null,
    };
    if (form.newPassword.trim()) {
      if (form.newPassword !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      payload.password = form.newPassword.trim();
    }
    saveAccount.mutate(payload);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <Screen>
      <BackHeader
        title="Account Settings"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            style={{
              minHeight: 34,
              borderRadius: radii.tag,
              backgroundColor: saved ? greenDarkColor : accent,
              paddingHorizontal: spacing.xl,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
            }}
            onPress={handleSave}
          >
            <AppIcon name="check" size={13} color={saved ? greenColor : "#000000"} />
            <Text style={{ color: saved ? greenColor : "#000000", fontSize: 12, fontWeight: "800" }}>
              {saveAccount.isPending ? "Saving" : saved ? "Saved!" : "Save"}
            </Text>
          </Pressable>
        }
      />

      {error ? (
        <View style={{ borderRadius: radii.modal, paddingHorizontal: spacing.xl2, paddingVertical: spacing.lg, backgroundColor: redDarkColor, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: spacing.xl }}>
          <Text style={{ color: redColor, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}

      {!currentUser.isPending ? (
        <View style={{ marginTop: spacing.xl3, gap: spacing.xl5 }}>
          <View>
            <SectionEyebrow>Account Details</SectionEyebrow>
            <Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>
              <View style={{ paddingHorizontal: spacing.xl3, paddingVertical: spacing.xl2 }}>
                <LabeledInput
                  label="Username"
                  value={form.username}
                  onChangeText={(v) => { setForm((c) => ({ ...c, username: v })); setUsernameError(""); setError(""); }}
                  error={usernameError}
                />
              </View>
              <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
              <View style={{ paddingHorizontal: spacing.xl3, paddingVertical: spacing.xl2 }}>
                <LabeledInput label="Email Address" value={form.email} onChangeText={(v) => setForm((c) => ({ ...c, email: v }))} keyboardType="email-address" />
              </View>
            </Card>
          </View>

          <View>
            <SectionEyebrow>Security</SectionEyebrow>
            <Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>
              <View style={{ paddingHorizontal: spacing.xl3, paddingVertical: spacing.xl2 }}>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>New Password</Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    value={form.newPassword}
                    onChangeText={(v) => setForm((c) => ({ ...c, newPassword: v }))}
                    placeholder="Leave blank to keep current"
                    placeholderTextColor={faintColor}
                    style={{
                      width: "100%",
                      minHeight: 52,
                      borderRadius: radii.input,
                      backgroundColor: surface2Color,
                      borderWidth: 1,
                      borderColor,
                      color: textColor,
                      paddingHorizontal: 16,
                      fontSize: 14,
                      paddingRight: 46,
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    style={{ position: "absolute", right: spacing.xl2, top: spacing.xl3, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <AppIcon name={showPassword ? "eye-off" : "eye"} size={16} color={mutedColor} />
                  </Pressable>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
              <View style={{ paddingHorizontal: spacing.xl3, paddingVertical: spacing.xl2 }}>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Confirm Password</Text>
                <TextInput
                  value={form.confirmPassword}
                  onChangeText={(v) => setForm((c) => ({ ...c, confirmPassword: v }))}
                  placeholder="Re-enter new password"
                  placeholderTextColor={faintColor}
                  style={{
                    width: "100%",
                    minHeight: 52,
                    borderRadius: radii.input,
                    backgroundColor: surface2Color,
                    borderWidth: 1,
                    borderColor,
                    color: textColor,
                    paddingHorizontal: 16,
                    fontSize: 14,
                  }}
                  secureTextEntry={!showPassword}
                />
              </View>
            </Card>
          </View>

          <View>
            <SectionEyebrow>Notifications</SectionEyebrow>
            <Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>
              <Pressable
                onPress={() => navigation.navigate("NotificationSettings")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: spacing.xl3,
                  paddingVertical: spacing.xl2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xl, flex: 1 }}>
                  <AppIcon name="bell" size={15} color={accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>
                      Push Notification Preferences
                    </Text>
                    <Text style={{ color: mutedColor, fontSize: 10 }}>
                      Morning motivation, inactivity nudges & milestones
                    </Text>
                  </View>
                </View>
                <AppIcon name="chevron-right" size={14} color={faintColor} />
              </Pressable>
            </Card>
          </View>

          <View>
            <SectionEyebrow>Feedback</SectionEyebrow>
            <Pressable
              onPress={async () => {
                posthog.capture(Events.FEEDBACK_PORTAL_OPENED);
                try {
                  const resp = await apiFetch("/auth/generate-portal-token", { method: "POST" });
                  const data = await resp.json() as { url: string };
                  Linking.openURL(data.url).catch(() => Alert.alert("Error", "Could not open feedback portal"));
                } catch {
                  Linking.openURL("https://feedback.athelix.fit").catch(() =>
                    Alert.alert("Error", "Could not open feedback portal"),
                  );
                }
              }}
            >
              <View
                style={{
                  minHeight: 74,
                  borderRadius: radii.input,
                  borderWidth: 1,
                  borderColor: "rgba(255,90,54,0.2)",
                  backgroundColor: "rgba(255,90,54,0.08)",
                  paddingHorizontal: spacing.xl3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xl,
                  marginTop: spacing.lg,
                }}
              >
                <AppIcon name="message-circle" size={16} color={accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: accent, fontSize: 13, fontWeight: "700" }}>Feedback & Feature Requests</Text>
                  <Text style={{ color: "rgba(255,90,54,0.66)", fontSize: 10 }}>
                    Suggest features, report bugs, or write a review
                  </Text>
                </View>
                <AppIcon name="external-link" size={14} color="rgba(255,90,54,0.5)" />
              </View>
            </Pressable>
          </View>

          <View>
            <SectionEyebrow color={redColor}>Danger Zone</SectionEyebrow>
            <Pressable
              onPress={() =>
                Alert.alert("Delete Account", "This will permanently delete your account and all data. This cannot be undone.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await apiFetch("/auth/delete-account", { method: "POST" });
                        await signOut();
                        navigation.replace("Login");
                      } catch (err) {
                        Alert.alert("Error", getApiErrorMessage(err));
                      }
                    },
                  },
                ])
              }
            >
              <View
                style={{
                  minHeight: 74,
                  borderRadius: radii.input,
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.2)",
                  backgroundColor: redDarkColor,
                  paddingHorizontal: spacing.xl3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xl,
                  marginTop: spacing.lg,
                }}
              >
                <AppIcon name="trash-2" size={16} color={redColor} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: redColor, fontSize: 13, fontWeight: "700" }}>Delete Account</Text>
                  <Text style={{ color: "rgba(239,68,68,0.66)", fontSize: 10 }}>
                    Permanently delete all data. This cannot be undone.
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Screen>
    </KeyboardAvoidingView>
  );
}
