# Muscle Balance Screen Redesign — Design Spec

**Date:** 2026-06-11
**Status:** Draft

---

## 1. Goals

- Add muscle group color identity to each card (Chest=orange, Back=green, Legs=purple, Shoulders=blue, Arms=amber, Core=pink)
- Show volume comparison (`weekly_sets` vs `average_weekly_sets`) as a visual bar
- Keep status colors (green/blue/red) for the status tag
- Fix API data mapping — use actual fields (`score`, `completed_sets`, `average_weekly_sets`)
- Remove `any` typing on exercise data
- Remove hardcoded purple tint from period selector
- Keep minimal, focused UX — one card per muscle group, expandable for exercises

---

## 2. Layout (top to bottom)

```
┌─ Screen ──────────────────────────────────┐
│                                             │
│  ← Muscle Balance                           │
│    Training volume distribution              │
│                                             │
│  ┌─ Period Toggle ──────────────────────┐   │
│  │  1W  │  2W  │  4W  │  8W             │   │
│  └───────────────────────────────────────┘   │
│                                             │
│  ┌─ Card ───────────────────────────────┐   │
│  │ █  Chest                    92%  ●○  │   │
│  │ ┌─────────────────────────────────┐   │   │
│  │ │ ████████████████████░░░░░░░░░░░ │   │   │
│  │ │      18 sets this period · 15 avg│   │   │
│  │ └─────────────────────────────────┘   │   │
│  │ ── exercises ─────────────────────────│   │
│  │ ○ Bench Press        ████░░  10 · 8  │   │
│  │ ○ Incline DB Press   ██░░░░   5 · 4  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  (more cards...)                            │
│                                             │
└─────────────────────────────────────────────┘
```

### 2a. Period Selector

- Kept as segmented control with **4 options**: 1W, 2W, 4W, 8W
- Active state: neutral white text on dark background (`COLORS.card`), no purple tint
- Inactive state: muted text
- Uses `MUSCLE_PERIODS` from `src/data.ts` (unchanged)

### 2b. Muscle Group Card

Each muscle group is a `Card` (existing `Card` component with `elevated` prop):

- **Left accent border** — 3px `borderLeftWidth` colored by the muscle group's accent color (via `muscleAccentColor` from `src/utils/display.ts`). Added via `accentColor` prop on `Card`.

- **Header row:**
  - Colored dot (6px circle, muscle group color) + **muscle group name** (`h2`: 18px, bold, white)
  - Right side: **score %** (white, bold) + **status tag** (colored by status: green/blue/red)

- **Volume bar** — horizontal bar showing `weekly_sets` relative to `average_weekly_sets`:
  - Bar fill: muscle group color, at opacity proportional to `weekly_sets / max(average_weekly_sets, weekly_sets) * 100`
  - Dashed reference line at the `average_weekly_sets` position (rgba white, 20% opacity)
  - Bar height: 8px, pill-shaped (borderRadius: 999)
  - Beneath bar: caption text — `"X sets this period · Y avg"` in muted color

- **Tap to expand** — tapping the card toggles the exercise list

- **Exercise list (expanded):**
  - Each exercise is a row: small dot (muscle group color, 4px) + **exercise name** (body, white) on the left
  - Right side: mini bar showing `completed_sets` vs `average_weekly_sets` + `"X · Y"` sets text
  - Mini bar: 4px height, muscle group color fill, inline with the text
  - Uses proper `MuscleGroupExerciseItemResponse` type (no `any`)

### 2c. Data Mapping

| Screen reads | API provides | Notes |
|---|---|---|
| `item.muscle_group` | `muscle_group` | Unchanged |
| `item.score` | `score` (int 0-100) | Was incorrectly reading `percentage` |
| `item.status` | `status` | Unchanged |
| `item.weekly_sets` | `weekly_sets` | New — for volume bar |
| `item.average_weekly_sets` | `average_weekly_sets` | New — for volume bar reference |
| `ex.exercise_name` | `exercise_name` | Was incorrectly using `name` |
| `ex.completed_sets` | `completed_sets` | Was incorrectly reading `percentage` |
| `ex.average_weekly_sets` | `average_weekly_sets` | New — for mini bar reference |

### 2d. Muscle Group Colors

| Group | Color | Source |
|---|---|---|
| Chest | `#FF5A36` | `muscleAccentColor("chest")` |
| Back | `#22C55E` | `muscleAccentColor("back")` |
| Legs | `#8B5CF6` | `muscleAccentColor("leg")` |
| Shoulders | `#3B82F6` | `muscleAccentColor("shoulder")` |
| Arms | `#F59E0B` | `muscleAccentColor("arm")` |
| Core | `#EC4899` | `muscleAccentColor("core")` |
| Unrecognized | `rgba(255,255,255,0.2)` | Fallback |

### 2e. Status Tag Colors (unchanged)

| Status | Color |
|---|---|
| Strong | `COLORS.green` (`#22C55E`) |
| Balanced | `COLORS.blue` (`#3B82F6`) |
| Needs Attention | `COLORS.red` (`#EF4444`) |

### 2f. Loading / Error / Empty States (unchanged)

- `LoadingCard` with "Analyzing muscle balance..."
- `ErrorCard` with retry button
- `EmptyCard` with "No data yet — Complete sessions to see muscle balance"

---

## 3. Files Changed

| File | Change |
|---|---|
| `src/screens/MuscleBalanceScreen.tsx` | Full redesign — new card layout, volume bars, exercise list, proper data mapping, muscle group colors, `any` → proper types, period selector neutral styling |
| `src/components/ui/Card.tsx` | Ensure `accentColor` prop works correctly for the left border accent |

---

## 4. What's NOT Changing

- API queries, endpoints, models (data shape stays the same, just reading correct fields)
- Navigation setup
- BackHeader component
- Screen/Layout wrapper
- Tag, ProgressBar, Icon components (reused as-is)
- Empty/loading/error states
