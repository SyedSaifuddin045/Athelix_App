import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, Switch, Text, TextInput, View } from "react-native";
import { usePostHog } from "posthog-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useCurrentUserQuery } from "../api/queries";
import { useSaveAccount } from "../api/mutations";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { LabeledInput } from "../components/ui/Input";
import { AppIcon } from "../design-system/icons/AppIcon";
import { apiFetch, getApiErrorMessage } from "../api/client";
import { successData } from "../utils/mapping";
import { Events } from "../analytics/events";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Settings"> };

export function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const posthog = usePostHog();
  const currentUser = useCurrentUserQuery(isAuthenticated);
  const [form, setForm] = useState({ username: "", email: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    prAlerts: true,
    weeklyReport: false,
    newFeatures: true,
  });

  const accent = theme.accent?.toString() ?? "#FF5A36";
  const textColor = theme.color?.toString() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.toString() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.toString() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)";
  const surface2Color = theme.surface2?.toString() ?? "rgba(255,255,255,0.06)";
  const greenColor = theme.colorGreen?.toString() ?? "#22C55E";
  const greenDarkColor = theme.colorGreenDark?.toString() ?? "rgba(34,197,94,0.12)";
  const redColor = theme.colorRed?.toString() ?? "#EF4444";
  const redDarkColor = theme.colorRedDark?.toString() ?? "rgba(239,68,68,0.12)";

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
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const handleSave = () => {
    setError("");
    saveAccount.mutate({ username: form.username.trim() || null, email: form.email.trim() || null });
  };

  return (
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

      {currentUser.isPending ? <LoadingCard label="Loading account..." /> : null}
      {error ? (
        <View style={{ borderRadius: radii.modal, paddingHorizontal: spacing.xl2, paddingVertical: spacing.lg, backgroundColor: redDarkColor, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: spacing.xl }}>
          <Text style={{ color: redColor, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl5 }}>
        <View>
          <SectionEyebrow>Account Details</SectionEyebrow>
          <Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>
            <View style={{ paddingHorizontal: spacing.xl3, paddingVertical: spacing.xl2 }}>
              <LabeledInput label="Username" value={form.username} onChangeText={(v) => setForm((c) => ({ ...c, username: v }))} />
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
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>New Password</Text>
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
                  style={{ position: "absolute", right: spacing.xl2, top: spacing.xl3 }}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <AppIcon name={showPassword ? "eye-off" : "eye"} size={16} color={mutedColor} />
                </Pressable>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionEyebrow>Notifications</SectionEyebrow>
          <Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>
            {([
              ["workoutReminders", "Workout Reminders", "Daily reminders to stay consistent"],
              ["prAlerts", "PR Alerts", "Get notified when you set a new record"],
              ["weeklyReport", "Weekly Report", "Weekly summary of your training"],
              ["newFeatures", "New Features", "Updates about new app features"],
            ] as const).map(([key, label, description], index, array) => (
              <View key={key}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl3, paddingVertical: spacing.xl2, gap: spacing.xl2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xl, flex: 1 }}>
                    <AppIcon
                      name="bell"
                      size={15}
                      color={notifications[key] ? accent : faintColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>{label}</Text>
                      <Text style={{ color: mutedColor, fontSize: 10 }}>{description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications[key]}
                    onValueChange={() => {
                      const newValue = !notifications[key];
                      setNotifications((c) => ({ ...c, [key]: newValue }));
                      posthog.capture(Events.NOTIFICATION_SETTING_CHANGED, {
                        setting_name: key,
                        new_value: newValue,
                      });
                    }}
                    trackColor={{ false: borderColor, true: accent }}
                    thumbColor="#ffffff"
                  />
                </View>
                {index < array.length - 1 ? (
                  <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
                ) : null}
              </View>
            ))}
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
              Alert.alert("Delete Account", "This would permanently delete all data. This demo does not perform the action.")
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
    </Screen>
  );
}
