# Athelix Full App Polish — Design Spec

**Date:** 2026-06-11
**Status:** Approved

---

## 1. Goals

- Remove all emoji-as-decoration from the UI (exercises, empty states, placeholders)
- Replace the flat exercise list with a category-grid browsing experience
- Apply a constrained typographic system across the app
- Normalize all spacing to `SPACING` tokens
- Clean up unused code (`exerciseEmoji`, `splashEmoji` style, `data.ts` fallbacks in production)
- Fix the hardcoded difficulty-badge bug in ExercisePicker
- Preserve all existing functionality — no business logic changes

---

## 2. Typography System

A constrained 4-step scale (no raw `fontSize` values in screens).

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 28 | 800 | Screen titles |
| `h2` | 18 | 700 | Exercise names, section headers |
| `body` | 14 | 500 | Body text, labels, empty state messages |
| `caption` | 12 | 500 | Subtitle, muscle groups, metadata, timestamps |

All font sizes in screens must reference one of these four. No `fontSize: 10`, `fontSize: 13`, `fontSize: 16` etc.

---

## 3. Exercise Cards (6 screens)

All exercise display surfaces share this card pattern:

```
┌────────────────────────────────────────┐
│  ┃  Bench Press           ──────────›  │
│  ┃  Chest · Barbell                    │
└────────────────────────────────────────┘
```

- **3px accent bar** on leading edge, color-coded by muscle group. Card component gains `accentColor?: string` prop — renders `borderLeftWidth: 3, borderLeftColor: accentColor`
- **Name:** `h2` (18/700 white) single line
- **Subtitle:** `caption` (12/500) in `COLORS.muted`, format: `"Muscle · Equipment"`
- **Right end:** chevron (browse) or plus (pick) at 16px, low opacity
- **No emoji, no icon** — pure typography + colored bar

### Muscle group → accent color mapping

| Muscle Group | Color |
|-------------|-------|
| Chest | `#FF5A36` (COLORS.teal) |
| Back | `#22C55E` (COLORS.green) |
| Legs | `#8B5CF6` (COLORS.purple) |
| Shoulders | `#3B82F6` (COLORS.blue) |
| Arms | `#F59E0B` (COLORS.orange) |
| Core / other | `rgba(255,255,255,0.2)` (COLORS.border) |

### Affected screens and how they change

| Screen | Current | New |
|--------|---------|-----|
| ExercisePicker (browse) | emoji circle + name + subtitle + difficulty tag | accent bar + name + subtitle |
| ExercisePicker (pick) | emoji circle + name + subtitle + plus | accent bar + name + subtitle + plus |
| ActiveWorkoutScreen | emoji + name in Card header | accent bar + name (no emoji) |
| TemplateBuilderScreen | emoji + name + grip handle | accent bar + name + grip handle |
| SessionDetailScreen | emoji + name in Card header | accent bar + name |
| PersonalRecordsScreen | emoji + name in header | accent bar + name |
| ExerciseDetailScreen | 72px emoji circle hero card | name only, no hero circle |

---

## 4. Category-Grid Explorer (ExploreScreen + ExercisePicker)

### 4.1 Top-level grid (browse & pick variants)

```
┌──────────────────────────────┐
│  🔍 Search (debounced 300ms) │
├──────────────────────────────┤
│  ┌────────┐  ┌────────┐     │
│  │  Chest │  │  Back  │     │
│  │  (24)  │  │  (18)  │     │
│  └────────┘  └────────┘     │
│  ┌────────┐  ┌────────┐     │
│  │  Legs  │  │  Arms  │     │
│  │  (32)  │  │  (14)  │     │
│  └────────┘  └────────┘     │
│  ┌────────┐  ┌────────┐     │
│  │Shoulders│ │  Core  │     │
│  │  (12)  │  │  (10)  │     │
│  └────────┘  └────────┘     │
├──────────────────────────────┤
│  Equip: [All] [Barbell] ...  │  ← horiz scroll chips
└──────────────────────────────┘
```

- Grid cards: 48px height (vertically compact), accent bar on left, group name in `h2`, count badge in `caption` aligned right
- Equipment filter updates grid counts live
- Equipment filter updates grid counts live
- Search input — debounced 300ms, typing clears grid, shows flat filtered results

### 4.2 Inside a muscle group

When user taps a group card:

```
┌──────────────────────────────┐
│  ← Chest (24)                │  ← sticky header
├──────────────────────────────┤
│  ┃ Bench Press               │
│  ┃ Chest · Barbell           │
│  ┃ Incline Press             │
│  ┃ Chest · Barbell           │
│  ┃ Push-ups                  │
│  ┃ Chest · Bodyweight        │
│  ...                         │
└──────────────────────────────┘
```

- Back button + group name + count
- Flat list of exercises filtered to that group
- Standard exercise cards with accent bars

### 4.3 Modal picker variant

Same 2x3 grid layout but cards are 40px height. Tapping a group navigates into its filtered exercise list (same as browse). Each exercise row has a plus icon on the right (same as current pick variant). Bottom sheet has a header with title + X close button + sticky "Done" bar only if no exercises added (otherwise the user taps back through the group navigation). Same accent bars, no emoji.

### 4.4 Filter bar

Two rows, always visible:

```
Muscle: [All] [Chest] [Back] [Legs] [Arms] [Shoulders]
Equip:  [All] [Barbell] [Dumbbell] [Bodyweight] [Machine] [Cable]
```

- Chips: 28px height, 10px font (one-off from type scale for compactness)
- Active = filled accent background, inactive = border only
- "All" resets that row

---

## 5. Empty States

- No emoji anywhere in empty states
- Use `EmptyCard` component with a Lucide icon only if the screen already did — otherwise simple text

| Screen | Current | New |
|--------|---------|-----|
| ExercisePicker (browse) | 🔍 + "No exercises found" | "No exercises match your search" (body, muted) |
| ExercisePicker (pick) | 🔍 + "No exercises found" | "No exercises match your search" |
| TemplateBuilderScreen | 📋 + "No exercises yet" | EmptyCard with `file-plus` icon |
| All others already using EmptyCard | emoji-free | unchanged |

---

## 6. Cleanup

### Remove
- `exerciseEmoji` function from `display.ts` and ExercisePicker (duplicate)
- `splashEmoji` style from `styles.ts`
- `data.ts` fallback imports from ExerciseDetailScreen (DIFFICULTY_COLORS, EXERCISE_DETAILS, EXERCISE_FALLBACK)
- Hardcoded color literals (`rgba(255,255,255,0.07)` etc) — replace with `COLORS.*`

### Fix
- Difficulty badge in ExercisePicker always shows `DIFFICULTY_COLORS["Intermediate"]` regardless of exercise — remove badge entirely (muscle group + equipment already convey enough)
- All raw `gap:` / `marginTop:` / `paddingHorizontal:` values → `SPACING.*`
- All raw `fontSize:` values → one of the 4 type-scale tokens (except chip labels at 10px)
- 🔍 in search input → use Lucide `search` icon (already done, verify)
- ⚡ drag placeholder in TemplateBuilder → use Lucide `grip-vertical` (already done, verify)

---

## 7. Files to Modify

| File | Changes |
|------|---------|
| `src/components/ExercisePicker.tsx` | Replace entire component with category-grid UX; remove emoji, fix difficulty badge |
| `src/components/ui/Card.tsx` | Add colored accent bar support to Card |
| `src/components/ui/Button.tsx` | No changes expected |
| `src/components/ui/Input.tsx` | No changes expected |
| `src/components/ui/Stats.tsx` | No changes expected |
| `src/components/ui/Icon.tsx` | No changes expected |
| `src/components/ui/Indicators.tsx` | No changes expected |
| `src/screens/ExploreScreen.tsx` | Minor — passes through to ExercisePicker (may need no changes) |
| `src/screens/ActiveWorkoutScreen.tsx` | Remove emoji from exercise headers, add accent bar |
| `src/screens/TemplateBuilderScreen.tsx` | Remove emoji from exercise cards, add accent bar; fix 📋 empty state |
| `src/screens/SessionDetailScreen.tsx` | Remove emoji from exercise groups, add accent bar |
| `src/screens/PersonalRecordsScreen.tsx` | Remove emoji from exercise headers, add accent bar |
| `src/screens/ExerciseDetailScreen.tsx` | Remove hero emoji circle; remove data.ts imports |
| `src/screens/ExerciseProgressScreen.tsx` | Uses ExercisePicker — no code changes |
| `src/utils/display.ts` | Remove `exerciseEmoji` function |
| `src/utils/mapping.ts` | Remove emoji from mapped types |
| `src/theme/styles.ts` | Remove `splashEmoji` style; ensure `SPACING.*` usage |
| `src/theme/spacing.ts` | No changes |
| `src/theme/colors.ts` | No changes |
| `src/data.ts` | No changes (mock data, but `exerciseEmoji` in types may still reference) |
| `src/__tests__/components/*.test.tsx` | Update any tests affected by emoji removal |
| `src/__tests__/screens/screens.test.tsx` | May need updates if screen rendering changes |
