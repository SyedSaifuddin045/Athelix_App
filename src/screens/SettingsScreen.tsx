import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, Switch, Text, TextInput, View } from "react-native";
import { usePostHog } from "posthog-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useCurrentUserQuery } from "../api/queries";
import { useSaveAccount } from "../api/mutations";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { LabeledInput } from "../components/ui/Input";
import { Icon } from "../components/ui/Icon";
import { apiFetch, getApiErrorMessage } from "../api/client";
import { successData } from "../utils/mapping";
import { Events } from "../analytics/events";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Settings"> };

export function SettingsScreen({ navigation }: Props) {
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
            style={[
              styles.saveChip,
              {
                minHeight: 34,
                borderRadius: RADIUS.tag,
                backgroundColor: saved ? COLORS.greenDark : COLORS.teal,
                paddingHorizontal: SPACING.xl,
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.sm,
              },
            ]}
            onPress={handleSave}
          >
            <Icon name="check" size={13} color={saved ? COLORS.green : "#000000"} />
            <Text style={[styles.saveChipText, saved ? { color: COLORS.green } : null]}>
              {saveAccount.isPending ? "Saving" : saved ? "Saved!" : "Save"}
            </Text>
          </Pressable>
        }
      />

      {currentUser.isPending ? <LoadingCard label="Loading account..." /> : null}
      {error ? (
        <View style={[styles.errorBox, { marginTop: SPACING.xl, backgroundColor: COLORS.redDark }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl5 }}>
        <View>
          <SectionEyebrow>Account Details</SectionEyebrow>
          <Card elevated style={{ paddingVertical: 0, marginTop: SPACING.lg }}>
            <View style={[styles.settingsSectionPad, { paddingHorizontal: SPACING.xl3, paddingVertical: SPACING.xl2 }]}>
              <LabeledInput label="Username" value={form.username} onChangeText={(v) => setForm((c) => ({ ...c, username: v }))} />
            </View>
            <View style={[styles.rowDivider, { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.xl3 }]} />
            <View style={[styles.settingsSectionPad, { paddingHorizontal: SPACING.xl3, paddingVertical: SPACING.xl2 }]}>
              <LabeledInput label="Email Address" value={form.email} onChangeText={(v) => setForm((c) => ({ ...c, email: v }))} keyboardType="email-address" />
            </View>
          </Card>
        </View>

        <View>
          <SectionEyebrow>Security</SectionEyebrow>
          <Card elevated style={{ paddingVertical: 0, marginTop: SPACING.lg }}>
            <View style={[styles.settingsSectionPad, { paddingHorizontal: SPACING.xl3, paddingVertical: SPACING.xl2 }]}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={[styles.inputWrap, { position: "relative" }]}>
                <TextInput
                  value={form.newPassword}
                  onChangeText={(v) => setForm((c) => ({ ...c, newPassword: v }))}
                  placeholder="Leave blank to keep current"
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
          </Card>
        </View>

        <View>
          <SectionEyebrow>Notifications</SectionEyebrow>
          <Card elevated style={{ paddingVertical: 0, marginTop: SPACING.lg }}>
            {([
              ["workoutReminders", "Workout Reminders", "Daily reminders to stay consistent"],
              ["prAlerts", "PR Alerts", "Get notified when you set a new record"],
              ["weeklyReport", "Weekly Report", "Weekly summary of your training"],
              ["newFeatures", "New Features", "Updates about new app features"],
            ] as const).map(([key, label, description], index, array) => (
              <View key={key}>
                <View style={[styles.notificationRow, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.xl3, paddingVertical: SPACING.xl2, gap: SPACING.xl2 }]}>
                  <View style={[styles.rowGap, { flex: 1, gap: SPACING.xl }]}>
                    <Icon
                      name="bell"
                      size={15}
                      color={notifications[key] ? COLORS.teal : COLORS.faint}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{label}</Text>
                      <Text style={styles.listMeta}>{description}</Text>
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
                    trackColor={{ false: COLORS.border, true: COLORS.teal }}
                    thumbColor="#ffffff"
                  />
                </View>
                {index < array.length - 1 ? (
                  <View style={[styles.rowDivider, { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.xl3 }]} />
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
                  borderRadius: RADIUS.input,
                  borderWidth: 1,
                  borderColor: "rgba(255,90,54,0.2)",
                  backgroundColor: "rgba(255,90,54,0.08)",
                  paddingHorizontal: SPACING.xl3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.xl,
                  marginTop: SPACING.lg,
              }}
            >
              <Icon name="message-circle" size={16} color={COLORS.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.listRowTitle, { color: COLORS.accent }]}>Feedback & Feature Requests</Text>
                <Text style={[styles.listMeta, { color: "rgba(255,90,54,0.66)" }]}>
                  Suggest features, report bugs, or write a review
                </Text>
              </View>
              <Icon name="external-link" size={14} color="rgba(255,90,54,0.5)" />
            </View>
          </Pressable>
        </View>

        <View>
          <SectionEyebrow color={COLORS.red}>Danger Zone</SectionEyebrow>
          <Pressable
            onPress={() =>
              Alert.alert("Delete Account", "This would permanently delete all data. This demo does not perform the action.")
            }
          >
            <View
              style={[
                styles.dangerZone,
                {
                  minHeight: 74,
                  borderRadius: RADIUS.input,
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.2)",
                  backgroundColor: COLORS.redDark,
                  paddingHorizontal: SPACING.xl3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.xl,
                  marginTop: SPACING.lg,
                },
              ]}
            >
              <Icon name="trash-2" size={16} color={COLORS.red} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.listRowTitle, { color: COLORS.red }]}>Delete Account</Text>
                <Text style={[styles.listMeta, { color: "rgba(239,68,68,0.66)" }]}>
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
