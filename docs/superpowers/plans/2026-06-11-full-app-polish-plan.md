# Full App Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all emoji-as-decoration from the Athelix app UI, replace the flat exercise list with a category-grid explorer, apply a constrained typography/spacing system, and clean up dead code.

**Architecture:** The Card component gains an `accentColor` prop for colored left-border bars. The ExercisePicker is rewritten from a flat FlatList to a category-grid + drill-in list UX. All 6 screens that display exercises have their emoji references stripped and get the accent bar. Utility functions and mapping layers are cleaned up.

**Tech Stack:** React Native, Lucide icons, React Navigation, Exported components from `src/components/ui/*`

**Spec:** `docs/superpowers/specs/2026-06-11-full-app-polish-design.md`

---

### Task 1: Add accent bar support to Card component

**Files:**
- Modify: `src/components/ui/Card.tsx`
- Test: `src/__tests__/components/Card.test.tsx`

- [ ] **Step 1: Add `accentColor` prop to Card**

Modify the Card component to accept an optional `accentColor?: string` prop. When set, render `borderLeftWidth: 3, borderLeftColor: accentColor`. The card's existing `borderRadius` should apply to this border (it will, since `borderLeftWidth` respects `borderRadius` in RN).

```typescript
// src/components/ui/Card.tsx — update the Card function signature and rendering
export function Card({
  children,
  style,
  elevated,
  accent,
  accentColor,
}: {
  children: React.ReactNode;
  style?: object | object[];
  elevated?: boolean;
  accent?: "green" | "purple" | "blue" | "red" | "coral" | "gold" | "none";
  accentColor?: string;
}) {
  const borderColor = accentColor || (accent
    ? accent === "green" ... // existing logic unchanged
    : COLORS.border);
  const borderLeftStyle = accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : {};
  return (
    <View style={[
      styles.card,
      { borderColor, ...borderLeftStyle },
      elevated ? { backgroundColor: COLORS.cardElevated, ...SHADOWS.md } : null,
      style,
    ]}>
      {children}
    </View>
  );
}
```

- [ ] **Step 2: Verify existing card tests still pass**

Run: `npx jest src/__tests__/components/Card.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Card.tsx src/__tests__/components/Card.test.tsx
git commit -m "feat: add accentColor prop to Card for colored accent bars"
```

---

### Task 2: Remove exerciseEmoji from display.ts and mapExerciseEmoji from mapping.ts

**Files:**
- Modify: `src/utils/display.ts`
- Modify: `src/utils/mapping.ts`

- [ ] **Step 1: Remove `exerciseEmoji` from display.ts**

Delete the `exerciseEmoji` function from `src/utils/display.ts`. It is only referenced by ExercisePicker (which has its own copy) and mapping.ts.

- [ ] **Step 2: Remove emoji from mapping.ts**

Find `mapExerciseItem`, `mapExerciseDetail`, and `templateDraftFromDetail` in `src/utils/mapping.ts`. Remove the `emoji` field from all returned objects. Remove any references to `exerciseEmoji` or `emoji` in the mapping functions.

- [ ] **Step 3: Commit**

```bash
git add src/utils/display.ts src/utils/mapping.ts
git commit -m "refactor: remove exerciseEmoji function and emoji field from mapped types"
```

---

### Task 3: Rewrite ExercisePicker with category-grid UX

**Files:**
- Modify: `src/components/ExercisePicker.tsx` (full rewrite)

This is the largest task. The ExercisePicker component is completely redesigned:

**State machine:**
- `view: "grid" | "list"` — grid shows category cards, list shows exercises in a selected category
- `selectedGroup: string | null` — which muscle group is active
- `query: string` — search text, when non-empty shows flat search results instead of grid
- `muscle: string` / `equipment: string` — filter state

**Layout:**
- Top: search bar (debounced 300ms) + clear button
- Below search: equipment chips (horizontal scroll)
- Body: 2x3 category grid OR exercise list OR search results

**Category grid:**
- 2 columns, each card is 48px height with accent bar on left, group name + count
- 6 cards: Chest, Back, Legs, Arms, Shoulders, Core (use filters data or hardcoded)
- Tapping a card sets `selectedGroup` and switches to list view

**Inside a category (list view):**
- Back button + group name header (sticky)
- FlatList of exercises filtered to that group
- Each exercise rendered as a Card with `accentColor` matching the group

**Search active:**
- Flat list across all groups, no category header
- Same card rendering

**Equipment filter:**
- Always visible chip row below search
- Active chip = filled accent, inactive = border
- Filtering recalculates category counts

**Empty state:**
- When no results: text "No exercises match your search" in `body` muted — no emoji, no icon
- When no exercises in a category during pick variant: "No [group] exercises available"

- [ ] **Step 1: Commit the ExercisePicker rewrite**

```bash
git add src/components/ExercisePicker.tsx
git commit -m "feat: rewrite ExercisePicker with category-grid browsing UX"
```

---

### Task 4: Update ExploreScreen

**Files:**
- Modify: `src/screens/ExploreScreen.tsx`

- [ ] **Step 1: Verify ExploreScreen passes through correctly**

ExploreScreen is a thin wrapper around ExercisePicker with `variant="browse"`. No changes should be needed — verify the screen still renders correctly with the new ExercisePicker.

- [ ] **Step 2: Commit**

```bash
git add src/screens/ExploreScreen.tsx
git commit -m "chore: verify ExploreScreen compatibility with new ExercisePicker"
```

---

### Task 5: Update ExerciseDetailScreen — remove hero emoji, remove data.ts fallbacks

**Files:**
- Modify: `src/screens/ExerciseDetailScreen.tsx`

- [ ] **Step 1: Remove the emoji hero circle**

Find the hero card section (around lines 73-85). Remove the 72px emoji circle. The card should just show exercise name + difficulty tag.

Before:
```tsx
<View style={[styles.heroCard, { flexDirection: "row", alignItems: "center", gap: SPACING.xl3 }]}>
  <View style={[styles.heroEmojiWrap, { width: 72, height: 72, borderRadius: RADIUS.card, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }]}>
    <Text style={{ fontSize: 34 }}>{exercise.emoji}</Text>
  </View>
  <View style={{ flex: 1 }}>
    <Text style={styles.heroTitle}>{exercise.name}</Text>
    {exercise.difficulty ? <Tag ... /> : null}
  </View>
</View>
```

After:
```tsx
<View>
  <Text style={styles.heroTitle}>{exercise.name}</Text>
  {exercise.difficulty ? <Tag ... /> : null}
</View>
```

- [ ] **Step 2: Remove data.ts imports**

Remove `DIFFICULTY_COLORS`, `EXERCISE_DETAILS`, `EXERCISE_FALLBACK` from `import { ... } from "../data"`.

Remove the fallback logic in the `exercise` initialization. Use `exerciseQuery.data` only:
```tsx
const exercise = exerciseQuery.data ? mapExerciseDetail(exerciseQuery.data) : null;
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/ExerciseDetailScreen.tsx
git commit -m "feat: remove emoji and data.ts fallbacks from ExerciseDetailScreen"
```

---

### Task 6: Update ActiveWorkoutScreen — remove emoji, add accent bar

**Files:**
- Modify: `src/screens/ActiveWorkoutScreen.tsx`

- [ ] **Step 1: Remove emoji from exercise headers**

Find the exercise Cards (around line 330-450). Remove the emoji `<Text>` element. Add `accentColor` to the Card based on the exercise's muscle group using the color mapping.

```tsx
function muscleAccentColor(muscle: string): string | undefined {
  const key = muscle.toLowerCase();
  if (key.includes("chest")) return "#FF5A36";
  if (key.includes("back")) return "#22C55E";
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring")) return "#8B5CF6";
  if (key.includes("shoulder")) return "#3B82F6";
  if (key.includes("arm") || key.includes("bicep") || key.includes("tricep")) return "#F59E0B";
  return undefined;
}
```

Replace `<Text style={{ fontSize: 22 }}>{exercise.emoji}</Text>` with the exercise name using `h2` text style.

- [ ] **Step 2: Remove old import of `exerciseEmoji` if present**

- [ ] **Step 3: Commit**

```bash
git add src/screens/ActiveWorkoutScreen.tsx
git commit -m "feat: remove emoji, add accent bar to ActiveWorkoutScreen exercise cards"
```

---

### Task 7: Update TemplateBuilderScreen — remove emoji, fix empty state

**Files:**
- Modify: `src/screens/TemplateBuilderScreen.tsx`

- [ ] **Step 1: Remove emoji from exercise cards**

Find the exercise card rendering (around lines 395-540). Remove the emoji `<Text>` element. Add `accentColor` to the Card. Replace the ⚡ drag placeholder emoji with a Lucide `grip-vertical` icon.

- [ ] **Step 2: Fix empty state**

Replace the 📋 emoji empty state with an EmptyCard using `file-plus` icon:
```tsx
<EmptyCard icon="file-plus" title="No exercises yet" text='Tap "Add Exercise" to build your template' />
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/TemplateBuilderScreen.tsx
git commit -m "feat: remove emoji, add accent bar, fix empty state in TemplateBuilderScreen"
```

---

### Task 8: Update SessionDetailScreen — remove emoji, add accent bar

**Files:**
- Modify: `src/screens/SessionDetailScreen.tsx`

- [ ] **Step 1: Remove emoji from exercise group headers**

Find the exercise group Card rendering (around lines 159-191). Remove the emoji `<Text>`. Add `accentColor` to the Card.

- [ ] **Step 2: Commit**

```bash
git add src/screens/SessionDetailScreen.tsx
git commit -m "feat: remove emoji, add accent bar to SessionDetailScreen"
```

---

### Task 9: Update PersonalRecordsScreen — remove emoji, add accent bar

**Files:**
- Modify: `src/screens/PersonalRecordsScreen.tsx`

- [ ] **Step 1: Remove emoji from exercise headers**

Find the exercise section headers (around lines 100-110). Remove the emoji `<Text>`. Add `accentColor` to the Card.

- [ ] **Step 2: Commit**

```bash
git add src/screens/PersonalRecordsScreen.tsx
git commit -m "feat: remove emoji, add accent bar to PersonalRecordsScreen"
```

---

### Task 10: Normalize spacing and typography in key files

**Files:**
- Modify: `src/components/ExercisePicker.tsx`
- Modify: `src/screens/TemplateBuilderScreen.tsx`
- Modify: `src/screens/ActiveWorkoutScreen.tsx`

- [ ] **Step 1: Replace raw spacing values with SPACING tokens**

Scan the three heaviest files for raw `gap:`, `marginTop:`, `paddingHorizontal:`, `paddingVertical:` values. Replace with `SPACING.*` tokens.

- [ ] **Step 2: Replace raw fontSize values with type scale tokens**

Scan for `fontSize:` values that aren't 10 (chip labels). Replace with `FONT_SIZES.h1` (28), `FONT_SIZES.h2` (18), `FONT_SIZES.body` (14), or `FONT_SIZES.caption` (12).

- [ ] **Step 3: Commit**

```bash
git add src/components/ExercisePicker.tsx src/screens/TemplateBuilderScreen.tsx src/screens/ActiveWorkoutScreen.tsx
git commit -m "refactor: normalize spacing and typography tokens in key files"
```

---

### Task 11: Clean up theme/styles.ts

**Files:**
- Modify: `src/theme/styles.ts`

- [ ] **Step 1: Remove `splashEmoji` style**

Find and delete `splashEmoji: { fontSize: 38 }` from the stylesheet.

- [ ] **Step 2: Normalize hardcoded color literals**

Scan for hardcoded color literals like `"rgba(255,255,255,0.07)"` and `"rgba(255,90,54,0.15)"`. Where possible, replace with `COLORS.*` references. Leave in place for complex tokens that don't have a COLORS equivalent (e.g., `"rgba(255,90,54,0.15)"` = teal at 15% opacity, no COLORS entry exists).

- [ ] **Step 3: Commit**

```bash
git add src/theme/styles.ts
git commit -m "refactor: remove unused splashEmoji style, normalize color literals"
```

---

### Task 12: Update tests

**Files:**
- Modify: `src/__tests__/components/*.test.tsx` (as needed)
- Modify: `src/__tests__/screens/screens.test.tsx` (as needed)

- [ ] **Step 1: Run existing tests to see what breaks**

Run: `npx jest`
Expected: Some tests may fail if they reference emoji or removed props.

- [ ] **Step 2: Fix any failing tests**

- If a test checks for emoji text content, update it.
- If a test passes `icon` as JSX to a component that now expects string, update it.
- If a test creates an exercise object with `emoji` field, remove it.

- [ ] **Step 3: Run tests again to confirm pass**

Run: `npx jest`
Expected: All 13 suites pass, 124+ tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/
git commit -m "test: update tests for emoji removal and component changes"
```

---

### Task 13: Run full typecheck and final pass

**Files:**
- All modified files

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors introduced. Pre-existing API model errors in ExerciseProgressScreen, HomeScreen, MuscleBalanceScreen remain.

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: All suites pass.

- [ ] **Step 3: Final review**

Verify the app renders correctly by checking no remaining references to:
- `exercise.emoji` or `item.emoji` in any screen
- `exerciseEmoji` in any file
- `splashEmoji` in styles
- `DIFFICULTY_COLORS` in ExercisePicker (should be removed with the old badge)
- 🔍/📋/⚡ emoji in any UI context

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: final typecheck and cleanup pass"
```
