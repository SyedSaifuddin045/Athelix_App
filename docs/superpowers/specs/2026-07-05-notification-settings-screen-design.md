# Notification Settings Screen — Design Spec

> Phase 2 of the scheduled notification system. Mobile screen for opt-in control of 3 push notification types, timezone management, and send-hour preference.

## Routes

```diff
+ NotificationSettings: undefined;
```

Added to `RootStackParamList` in `src/types/navigation.ts`.

## Screen: NotificationSettingsScreen

New file at `src/screens/NotificationSettingsScreen.tsx`.

### Layout (top→bottom)

```
┌──────────────────────────────────────┐
│ ← Notification Settings              │  BackHeader
├──────────────────────────────────────┤
│                                      │
│  ┌─ Push Notifications ───────────┐  │
│  │ ○ Morning Motivation           │  │  Switch + label + subtitle
│  │   "Daily encouragement"        │  │
│  │ ────────────────────────────── │  │
│  │ ○ Inactivity Nudges            │  │
│  │   "After 3+ days idle"         │  │
│  │ ────────────────────────────── │  │
│  │ ○ Milestone Celebrations       │  │
│  │   "Every 10 workouts"          │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌─ Schedule ─────────────────────┐  │
│  │ Timezone              UTC      │  │  Read-only, shows detected tz
│  │ ────────────────────────────── │  │
│  │ Send Hour             8 AM    │  │  → tap opens wheel picker
│  │ ────────────────────────────── │  │
│  │ Inactivity Threshold           │  │
│  │   72 hours          [─] [+ ]  │  │  Stepper (24–168h, 24h steps)
│  └────────────────────────────────┘  │
│                                      │
│  [Detect Timezone from Device]       │  Ghost button, calls /settings/detect
│                                      │
└──────────────────────────────────────┘
```

### Send Hour Wheel Picker

- iOS-style spinning wheel
- 24 rows (0–23), each labelled: `6 AM (Early Bird)`, `8 AM (Morning)`, `12 PM (Noon)`, `10 PM`, etc.
- Default: `8 AM (Morning)`

### Data Flow

1. Screen mounts → `GET /devices/settings` (`apiFetch`)
2. Parse response into state. If 404/defaults→show defaults.
3. Toggle change → optimistic update + `PUT /devices/settings` with partial payload
4. Hour/inactivity change → `PUT /devices/settings`
5. "Detect Timezone" button → `POST /devices/settings/detect` with device timezone → refetch
6. On error: revert optimistic toggle, show inline error

## API Integration

3 endpoints via `apiFetch` (not Orval-generated):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/devices/settings` | Fetch current settings |
| PUT | `/devices/settings` | Update settings (partial) |
| POST | `/devices/settings/detect` | Submit detected timezone |

### Hooks in `src/api/queries.ts`

```typescript
export function useNotificationSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.notificationSettings,
    queryFn: async () => {
      const resp = await apiFetch("/devices/settings", { method: "GET" });
      if (!resp.ok) return null;  // 404 = not set up yet
      return resp.json();
    },
  });
}
```

### Hooks in `src/api/mutations.ts`

```typescript
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch("/devices/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationSettings });
    },
  });
}
```

### Query key in `src/api/queryKeys.ts`

```diff
+  notificationSettings: ["notificationSettings"],
```

## UI Patterns (matching existing)

| Element | Pattern | Source |
|---------|---------|--------|
| Toggle rows | `Switch` + label + subtitle + divider | SettingsScreen line 185-232 |
| Section header | `SectionEyebrow` | SettingsScreen line 178 |
| Card container | `Card elevated` with `paddingVertical: 0` | SettingsScreen line 179 |
| Colors | `theme.accent`, `theme.color`, `theme.colorMuted`, `theme.borderColor`, `theme.surface2` | Standard |
| Spacing | `spacing.xl3`, `spacing.xl2`, `spacing.lg`, `spacing.xl` | Standard |
| Back button | `BackHeader` from `../components/ui/Button` | SettingsScreen line 90 |
| Hour picker | Modal with `ScrollView` + tappable rows (no extra dep) | |

## Error Handling

- Failed toggle: revert optimistic state, show brief toast/alert
- Network error on load: show card with "Could not load settings — tap to retry"
- `apiFetch` throws `ApiError` on non-2xx — catch + display via `getApiErrorMessage`

## Files Changed

| File | Action |
|------|--------|
| `src/types/navigation.ts` | Add `NotificationSettings` to `RootStackParamList` |
| `src/api/queryKeys.ts` | Add `notificationSettings` key |
| `src/api/queries.ts` | Add `useNotificationSettingsQuery` |
| `src/api/mutations.ts` | Add `useUpdateNotificationSettings` |
| `src/navigation/AppNavigator.tsx` | Import + register `NotificationSettingsScreen` |
| `src/screens/NotificationSettingsScreen.tsx` | **NEW** |
| `src/screens/SettingsScreen.tsx` | Add "Push Notification Preferences" row in existing Notifications section |

## Edge Cases

- **No settings record yet (404):** Show all toggles OFF, defaults displayed. User can toggle any switch → triggers `PUT /settings` which creates record via upsert.
- **Device timezone detection fails:** "Detect Timezone" button stays tappable. Show "Unable to detect timezone" alert on failure. Timezone field stays as-is.
- **Rapid toggling:** Debounce `PUT` calls by 500ms to avoid race conditions.
- **Offline:** All mutations require network. Query uses `staleTime: 30000` to avoid frequent refetches. Show stale data + indicate if offline.
