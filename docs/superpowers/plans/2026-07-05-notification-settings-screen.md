# Notification Settings Screen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated notification settings screen on mobile for opt-in control of 3 scheduled push notification types (morning motivation, inactivity nudges, milestones) with timezone detection and send-hour preference.

**Architecture:** New screen registered in root stack navigator, navigated from existing SettingsScreen. Uses `apiFetch` for CRUD against `/devices/settings` endpoints (not Orval-generated). Hour picker uses Modal + ScrollView (no new deps).

**Tech Stack:** React Native, Expo, React Query, apiFetch, Tamagui theme tokens.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/navigation.ts` | Modify | Add `NotificationSettings` route to `RootStackParamList` |
| `src/api/queryKeys.ts` | Modify | Add `notificationSettings` query key |
| `src/api/queries.ts` | Modify | Add `useNotificationSettingsQuery` hook |
| `src/api/mutations.ts` | Modify | Add `useUpdateNotificationSettings` mutation |
| `src/screens/NotificationSettingsScreen.tsx` | **Create** | Full screen: toggles, schedule section, timezone detect |
| `src/navigation/AppNavigator.tsx` | Modify | Import + register `NotificationSettingsScreen` |
| `src/screens/SettingsScreen.tsx` | Modify | Add "Push Notification Preferences" row in Notifications section |

---

### Task 1: Add route to navigation types + query key

**Files:**
- Modify: `src/types/navigation.ts`
- Modify: `src/api/queryKeys.ts`

- [ ] **Step 1: Add NotificationSettings route**

In `src/types/navigation.ts`, add `NotificationSettings: undefined;` to `RootStackParamList` after `Settings`:

```diff
   Settings: undefined;
+  NotificationSettings: undefined;
   QuickCardio: { activityType: CardioActivityType };
```

- [ ] **Step 2: Add notificationSettings query key**

In `src/api/queryKeys.ts`, add after `muscleBalance`:

```diff
   muscleBalance: (params?: unknown) => ["analytics", "muscle-balance", params ?? {}] as const,
+  notificationSettings: ["notifications", "settings"] as const,
```

- [ ] **Step 3: Commit**

```bash
git add src/types/navigation.ts src/api/queryKeys.ts && git commit -m "feat: add NotificationSettings route + query key"
```

---

### Task 2: Add query + mutation hooks for notification settings

**Files:**
- Modify: `src/api/queries.ts` — add `useNotificationSettingsQuery`
- Modify: `src/api/mutations.ts` — add `useUpdateNotificationSettings`

- [ ] **Step 1: Add useNotificationSettingsQuery hook**

In `src/api/queries.ts`, after the last query hook:

```typescript
export function useNotificationSettingsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.notificationSettings,
    queryFn: async () => {
      const resp = await apiFetch("/devices/settings", { method: "GET" });
      if (!resp.ok) return null;
      return resp.json();
    },
    enabled,
    staleTime: 30000,  // 30s — don't refetch too often
  });
}
```

Add `apiFetch` to the imports at the top (check if already imported — it may be from `./client`):
Search for `apiFetch` in the file. If not imported, add:
```typescript
import { apiFetch } from "./client";
```

- [ ] **Step 2: Add useUpdateNotificationSettings mutation**

In `src/api/mutations.ts`, after the last mutation hook:

```typescript
export function useUpdateNotificationSettings(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const resp = await apiFetch("/devices/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new ApiError(resp.status, errBody.detail ?? "Failed to update settings");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationSettings });
      options?.onSuccess?.();
    },
  });
}
```

Add `ApiError` and `apiFetch` imports at top of `mutations.ts`:
```diff
+ import { ApiError, apiFetch } from "./client";
```

- [ ] **Step 3: Verify imports compile**

```bash
cd /Users/saif/Programming/Athelix_App && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/api/queries.ts src/api/mutations.ts && git commit -m "feat: add notification settings query + mutation hooks"
```

---

### Task 3: Create NotificationSettingsScreen

**Files:**
- Create: `src/screens/NotificationSettingsScreen.tsx`

Full screen with:

1. **BackHeader** with title "Notification Settings"
2. **Push Notifications section** (Card with 3 Switch rows)
3. **Schedule section** (Card with timezone display, hour picker trigger, inactivity stepper)
4. **Detect Timezone button** (ghost-style button)
5. **Hour picker modal** (iOS-style wheel with labeled presets)

- [ ] **Step 1: Create the screen file**

Write `src/screens/NotificationSettingsScreen.tsx`:

```typescript
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@tamagui/core";
import type { RootStackParamList } from "../types/navigation";
import { useNotificationSettingsQuery, useUpdateNotificationSettings } from "../api/queries";
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

  const [hourPickerOpen, setHourPickerOpen] = useState(false);
  const [pendingHour, setPendingHour] = useState(settings?.preferred_send_hour ?? 8);

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surfaceColor = theme.surface?.get() ?? "#0D0D0D";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const greenDarkColor = theme.colorGreenDark?.get() ?? "rgba(34,197,94,0.12)";
  const greenColor = theme.colorGreen?.get() ?? "#22C55E";

  const handleToggle = useCallback(
    (key: string, value: boolean) => {
      updateMutation.mutate({ [key]: value });
    },
    [updateMutation],
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
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>{t.label}</Text>
                    <Text style={{ color: mutedColor, fontSize: 10 }}>{t.subtitle}</Text>
                  </View>
                  <Switch
                    value={(s as any)[t.key] ?? false}
                    onValueChange={(v) => handleToggle(t.key, v)}
                    trackColor={{ false: borderColor, true: accent }}
                    thumbColor="#ffffff"
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
```

- [ ] **Step 2: Verify type check**

```bash
cd /Users/saif/Programming/Athelix_App && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/NotificationSettingsScreen.tsx && git commit -m "feat: create NotificationSettingsScreen with toggles, schedule section, timezone detect"
```

---

### Task 4: Wire into AppNavigator + add navigation row in SettingsScreen

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Register screen in AppNavigator**

In `src/navigation/AppNavigator.tsx`:

Add import after the SettingsScreen import (line 44):
```typescript
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
```

Add screen after the SettingsScreen entry (after line 188):
```typescript
        <RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
```

- [ ] **Step 2: Add navigation row to SettingsScreen**

In `src/screens/SettingsScreen.tsx`, locate the Notifications section (starts around line 177-234).

The current Notifications section has 4 local toggles. Add a new row at the BOTTOM of the Card (after the last toggle's divider), navigating to `NotificationSettings`:

Find the closing `</Card>` for the Notifications section (around line 234). After the last `</View>` for the 4th toggle but before `</Card>`, add:

```typescript
                   <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
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
```

To insert correctly: the Notifications Card currently maps over 4 items in `TOGGLES` array. After the last toggle, there's no divider (because `index < array.length - 1` prevents it). I need to add the row after the last `</View>` of the loop's output.

Looking at the code flow in SettingsScreen:

```typescript
              {([
                ["workoutReminders", "Workout Reminders", "Daily reminders to stay consistent"],
                ...
              ] as const).map(([key, label, description], index, array) => (
                <View key={key}>
                  ...
                  {index < array.length - 1 ? (
                    <View style={{ height: 1, ... }} />
                  ) : null}
                </View>
              ))}
```

After the closing `)}` of the map call, before `</Card>`, add the divider + navigation row.

Replace the existing line `</Card>` in the Notifications section with:

```typescript
            </Card>
```

With:

```typescript
              {/* Navigate to full notification settings */}
              <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
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
```

Wait — the closing `</Card>` in the original is `}>` from the JSX. Let me look more carefully at the SettingsScreen code around line 233-234:

```typescript
              ))}
            </Card>
          </View>
```

So after the map's `)}` closing, there's `</Card>` then `</View>`. I need to insert between `)}` and `</Card>`.

Actually I need to look at the exact code. The Card in the Notifications section starts at line 179 with `<Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>` and ends with `</Card>` around line 234. The map output produces Views, and the last item doesn't get a divider (because `index < array.length - 1` is false).

So I should insert after `)}` (the closing of the map) but before `</Card>`:

```
              ))}  <-- map closing
              <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
              <Pressable ...>
                ...
              </Pressable>
            </Card>  <-- original closing
```

- [ ] **Step 3: Verify type check**

```bash
cd /Users/saif/Programming/Athelix_App && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/navigation/AppNavigator.tsx src/screens/SettingsScreen.tsx && git commit -m "feat: wire NotificationSettingsScreen into navigator + SettingsScreen"
```
