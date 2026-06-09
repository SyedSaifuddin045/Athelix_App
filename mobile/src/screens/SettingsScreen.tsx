import { useEffect, useState } from "react";
import { Alert, Pressable, Switch, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-react-native";

import { useAuth } from "@clerk/expo";
import { useCurrentUserQuery } from "../api/queries";
import { updateCurrentUserUsersMePatch } from "../api/endpoints/users/users";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { LabeledInput } from "../components/ui/Input";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import { successData } from "../utils/mapping";
import { Events } from "../analytics/events";

export function SettingsScreen({ navigation }: { navigation: any }) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const currentUser = useCurrentUserQuery(isAuthenticated);
  const [form, setForm] = useState({
    username: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
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
    setForm((current) => ({ ...current, username: currentUser.data.username, email: currentUser.data.email }));
  }, [currentUser.data]);

  const saveAccount = useMutation({
    mutationFn: async () =>
      updateCurrentUserUsersMePatch({
        username: form.username.trim() || null,
        email: form.email.trim() || null,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
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
    saveAccount.mutate();
  };

  return (
    <Screen>
      <BackHeader
        title="Account Settings"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            style={[styles.saveChip, saved ? { backgroundColor: "rgba(34,197,94,0.2)" } : null]}
            onPress={handleSave}
          >
            <Feather name="check" size={13} color={saved ? COLORS.green : "#000000"} />
            <Text style={[styles.saveChipText, saved ? { color: COLORS.green } : null]}>
              {saveAccount.isPending ? "Saving" : saved ? "Saved!" : "Save"}
            </Text>
          </Pressable>
        }
      />

      {currentUser.isPending ? <LoadingCard label="Loading account..." /> : null}
      {error ? (
        <View style={[styles.errorBox, { marginTop: 12 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: 18, gap: 22 }}>
        <View>
          <SectionEyebrow>Account Details</SectionEyebrow>
          <Card style={{ paddingVertical: 0, marginTop: 10 }}>
            <View style={styles.settingsSectionPad}>
              <LabeledInput label="Username" value={form.username} onChangeText={(value) => setForm((current) => ({ ...current, username: value }))} />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingsSectionPad}>
              <LabeledInput
                label="Email Address"
                value={form.email}
                onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
                keyboardType="email-address"
              />
            </View>
          </Card>
        </View>

        <View>
          <SectionEyebrow>Security</SectionEyebrow>
          <Card style={{ paddingVertical: 0, marginTop: 10 }}>
            <View style={styles.settingsSectionPad}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={form.newPassword}
                  onChangeText={(value) => setForm((current) => ({ ...current, newPassword: value }))}
                  placeholder="Leave blank to keep current"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={[styles.input, styles.inputWithRight]}
                  secureTextEntry={!showPassword}
                />
                <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
                </Pressable>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionEyebrow>Notifications</SectionEyebrow>
          <Card style={{ paddingVertical: 0, marginTop: 10 }}>
            {(
              [
                ["workoutReminders", "Workout Reminders", "Daily reminders to stay consistent"],
                ["prAlerts", "PR Alerts", "Get notified when you set a new record"],
                ["weeklyReport", "Weekly Report", "Weekly summary of your training"],
                ["newFeatures", "New Features", "Updates about new app features"],
              ] as const
            ).map(([key, label, description], index, array) => (
              <View key={key}>
                <View style={styles.notificationRow}>
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    <Feather name="bell" size={15} color={notifications[key] ? COLORS.teal : "rgba(255,255,255,0.3)"} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{label}</Text>
                      <Text style={styles.listMeta}>{description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications[key]}
                    onValueChange={() => {
                      const newValue = !notifications[key];
                      setNotifications((current) => ({ ...current, [key]: newValue }));
                      posthog.capture(Events.NOTIFICATION_SETTING_CHANGED, {
                        setting_name: key,
                        new_value: newValue,
                      });
                    }}
                    trackColor={{ false: "rgba(255,255,255,0.18)", true: COLORS.teal }}
                    thumbColor="#ffffff"
                  />
                </View>
                {index < array.length - 1 ? <View style={styles.rowDivider} /> : null}
              </View>
            ))}
          </Card>
        </View>

        <View>
          <SectionEyebrow color="rgba(239,68,68,0.7)">Danger Zone</SectionEyebrow>
          <Pressable
            onPress={() =>
              Alert.alert("Delete Account", "This would permanently delete all data. This demo does not perform the action.")
            }
          >
            <View style={styles.dangerZone}>
              <Feather name="trash-2" size={16} color={COLORS.red} />
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
