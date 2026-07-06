import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@tamagui/core";
import type { RootStackParamList } from "../types/navigation";
import { useNotificationSettingsQuery } from "../api/queries";
import { useSendTestNotification, useUpdateNotificationSettings } from "../api/mutations";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { AppIcon } from "../design-system/icons/AppIcon";
import { apiFetch, getApiErrorMessage } from "../api/client";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "NotificationSettings"> };

const HOUR_LABELS: string[] = Array.from({ length: 24 }, (_, h) => {
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const suffix =
    h === 6 ? " (Early Bird)" :
    h === 8 ? " (Morning)" :
    h === 10 ? " (Midday)" :
    h === 12 ? " (Noon)" :
    h === 15 ? " (Afternoon)" :
    h === 17 ? " (Evening)" :
    h === 20 ? " (Night)" : "";
  return `${hour12} ${period}${suffix}`;
});

const TOGGLES: { key: "morning_motivation_enabled" | "inactivity_nudge_enabled" | "milestone_enabled"; label: string; subtitle: string }[] = [
  { key: "morning_motivation_enabled", label: "Morning Motivation", subtitle: "Daily encouragement at your preferred time" },
  { key: "inactivity_nudge_enabled", label: "Inactivity Nudges", subtitle: "Reminder after 3+ days without a workout" },
  { key: "milestone_enabled", label: "Milestone Celebrations", subtitle: "Congrats every 10 completed workouts" },
];

export function NotificationSettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { data: settings, isLoading, refetch } = useNotificationSettingsQuery(true);
  const updateMutation = useUpdateNotificationSettings();
  const sendTestMutation = useSendTestNotification();

  const [hourPickerOpen, setHourPickerOpen] = useState(false);
  const [pendingHour, setPendingHour] = useState(settings?.preferred_send_hour ?? 8);

  const hasRequestedPermission = useRef(false);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;
    if (hasRequestedPermission.current) return true;
    const { status } = await Notifications.requestPermissionsAsync();
    hasRequestedPermission.current = true;
    if (status === "granted") return true;
    Alert.alert(
      "Permission Required",
      "Please enable notifications in your device Settings to receive alerts.",
    );
    return false;
  }, []);

  // Proactively request permission on screen mount if any toggle is enabled
  useEffect(() => {
    if (!settings) return;
    const anyEnabled = TOGGLES.some((t) => (settings as any)[t.key]);
    if (anyEnabled) {
      ensurePermission();
    }
    // Intentional: only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!settings]);

  const handleToggle = useCallback(
    async (key: string, value: boolean) => {
      if (value) {
        const granted = await ensurePermission();
        if (!granted) return;
      }
      updateMutation.mutate({ [key]: value });
    },
    [updateMutation, ensurePermission],
  );

  const handleMasterToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await ensurePermission();
        if (!granted) return;
        updateMutation.mutate({
          morning_motivation_enabled: true,
          inactivity_nudge_enabled: false,
          milestone_enabled: false,
        });
      } else {
        updateMutation.mutate({
          morning_motivation_enabled: false,
          inactivity_nudge_enabled: false,
          milestone_enabled: false,
        });
      }
    },
    [updateMutation, ensurePermission],
  );

  const handleUpdateSettings = useCallback(
    (data: Record<string, unknown>) => {
      updateMutation.mutate(data);
    },
    [updateMutation],
  );

  const handleDetectTimezone = useCallback(async () => {
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!detectedTz) {
        Alert.alert("Unable to Detect", "Could not determine your timezone.");
        return;
      }
      await apiFetch("/devices/settings/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: detectedTz }),
      });
      refetch();
      Alert.alert("Detected", `Timezone set to ${detectedTz}`);
    } catch (err) {
      Alert.alert("Error", getApiErrorMessage(err));
    }
  }, [refetch]);

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surfaceColor = theme.surface?.get() ?? "#0D0D0D";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";

  if (isLoading) {
    return (
      <Screen>
        <BackHeader title="Notification Settings" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="small" color={accent} />
        </View>
      </Screen>
    );
  }

  const s = settings ?? {};
  const masterEnabled = TOGGLES.some((t) => (s as any)[t.key]);

  return (
    <Screen>
      <BackHeader title="Notification Settings" onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ marginTop: spacing.xl3 }}
        contentContainerStyle={{ gap: spacing.xl5, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Push Notifications ── */}
        <View>
          <SectionEyebrow>Push Notifications</SectionEyebrow>
          <Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>
            {/* Master Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing.xl3,
                paddingVertical: spacing.xl2,
                gap: spacing.xl2,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>Enable Notifications</Text>
                <Text style={{ color: mutedColor, fontSize: 10 }}>Master toggle for all notifications</Text>
              </View>
              <Switch
                value={masterEnabled}
                onValueChange={handleMasterToggle}
                trackColor={{ false: borderColor, true: accent }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
            {TOGGLES.map((t, idx) => (
              <View key={t.key}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: spacing.xl3,
                    paddingVertical: spacing.xl2,
                    gap: spacing.xl2,
                    opacity: masterEnabled ? 1 : 0.4,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>{t.label}</Text>
                    <Text style={{ color: mutedColor, fontSize: 10 }}>{t.subtitle}</Text>
                  </View>
                  <Switch
                    value={(s as any)[t.key] ?? false}
                    onValueChange={masterEnabled ? (v) => handleToggle(t.key, v) : undefined}
                    trackColor={{ false: borderColor, true: masterEnabled ? accent : mutedColor }}
                    thumbColor="#ffffff"
                    disabled={!masterEnabled}
                  />
                </View>
                {idx < TOGGLES.length - 1 ? (
                  <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
                ) : null}
              </View>
            ))}
          </Card>
        </View>

        {/* ── Schedule ── */}
        <View>
          <SectionEyebrow>Schedule</SectionEyebrow>
          <Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>
            {/* Timezone */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing.xl3,
                paddingVertical: spacing.xl2,
              }}
            >
              <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>Timezone</Text>
              <Text style={{ color: mutedColor, fontSize: 13 }}>{s.timezone ?? "UTC"}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />

            {/* Send Hour */}
            <Pressable
              onPress={() => {
                setPendingHour(s.preferred_send_hour ?? 8);
                setHourPickerOpen(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing.xl3,
                paddingVertical: spacing.xl2,
              }}
            >
              <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>Send Hour</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={{ color: mutedColor, fontSize: 13 }}>
                  {HOUR_LABELS[s.preferred_send_hour ?? 8]}
                </Text>
                <AppIcon name="chevron-right" size={14} color={faintColor} />
              </View>
            </Pressable>
            <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />

            {/* Inactivity Threshold */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing.xl3,
                paddingVertical: spacing.xl2,
              }}
            >
              <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>Inactivity Threshold</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Pressable
                  onPress={() => {
                    const next = Math.max(24, (s.inactivity_threshold_hours ?? 72) - 24);
                    handleUpdateSettings({ inactivity_threshold_hours: next });
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: surface2Color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon name="minus" size={14} color={textColor} />
                </Pressable>
                <Text style={{ color: textColor, fontSize: 13, fontWeight: "700", minWidth: 48, textAlign: "center" }}>
                  {s.inactivity_threshold_hours ?? 72}h
                </Text>
                <Pressable
                  onPress={() => {
                    const next = Math.min(168, (s.inactivity_threshold_hours ?? 72) + 24);
                    handleUpdateSettings({ inactivity_threshold_hours: next });
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: surface2Color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon name="plus" size={14} color={textColor} />
                </Pressable>
              </View>
            </View>
          </Card>
        </View>

        {/* ── Detect Timezone ── */}
        <Pressable
          onPress={handleDetectTimezone}
          style={{
            minHeight: 52,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: "rgba(255,90,54,0.2)",
            backgroundColor: "rgba(255,90,54,0.08)",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: spacing.md,
          }}
        >
          <AppIcon name="map-pin" size={15} color={accent} />
          <Text style={{ color: accent, fontSize: 14, fontWeight: "700" }}>Detect Timezone from Device</Text>
        </Pressable>

        {/* ── Test Notification ── */}
        <Pressable
          onPress={() => {
            sendTestMutation.mutate(undefined, {
              onSuccess: (data) => {
                Alert.alert("Test Notification", data.message);
              },
              onError: (err) => {
                Alert.alert("Error", getApiErrorMessage(err));
              },
            });
          }}
          disabled={sendTestMutation.isPending}
          style={{
            minHeight: 52,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: borderColor,
            backgroundColor: surface2Color,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: spacing.md,
            opacity: sendTestMutation.isPending ? 0.5 : 1,
          }}
        >
          <AppIcon name="bell" size={15} color={textColor} />
          <Text style={{ color: textColor, fontSize: 14, fontWeight: "700" }}>
            {sendTestMutation.isPending ? "Sending..." : "Send Test Notification"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* ── Hour Picker Modal ── */}
      <Modal
        visible={hourPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setHourPickerOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          onPress={() => setHourPickerOpen(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: surfaceColor,
              borderTopLeftRadius: radii.modal,
              borderTopRightRadius: radii.modal,
              maxHeight: "60%",
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: borderColor }} />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing.xl3,
                paddingBottom: spacing.md,
              }}
            >
              <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>Select Send Hour</Text>
              <Pressable
                onPress={() => {
                  handleUpdateSettings({ preferred_send_hour: pendingHour });
                  setHourPickerOpen(false);
                }}
                style={{
                  minHeight: 30,
                  borderRadius: radii.tag,
                  backgroundColor: accent,
                  paddingHorizontal: spacing.xl,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#000000", fontSize: 12, fontWeight: "800" }}>Done</Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingBottom: spacing.xl3 }}
              showsVerticalScrollIndicator
            >
              {HOUR_LABELS.map((label, hour) => {
                const isSelected = hour === pendingHour;
                return (
                  <Pressable
                    key={hour}
                    onPress={() => setPendingHour(hour)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: spacing.xl2,
                      paddingHorizontal: spacing.xl3,
                      backgroundColor: isSelected ? "rgba(255,90,54,0.1)" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        color: isSelected ? accent : textColor,
                        fontSize: 15,
                        fontWeight: isSelected ? "700" : "400",
                      }}
                    >
                      {label}
                    </Text>
                    {isSelected ? <AppIcon name="check" size={16} color={accent} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
