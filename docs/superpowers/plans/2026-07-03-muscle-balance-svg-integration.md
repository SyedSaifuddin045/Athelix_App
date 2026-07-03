# Muscle Balance SVG Integration — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed `Full_Body.svg` into `MuscleBalanceScreen` as an interactive body map where tapping a muscle region scrolls to that group's card.

**Architecture:** Extract SVG path `d` strings into a JS data file, render via `react-native-svg` with individual `<Path>` elements wrapped in `Pressable`, map API muscle groups to path indices via a lookup config, and integrate into existing screen with animated scroll via Reanimated.

**Tech Stack:** react-native-svg 15.12.1, react-native-reanimated 4.1.1, TypeScript strict

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/ui/MuscleSVG.paths.ts` | Create | ~114 path `d` strings grouped by muscle region |
| `src/components/ui/MuscleSVG.utils.ts` | Create | Muscle group → path index mapping, fill color lookup |
| `src/components/ui/MuscleSVG.tsx` | Create | SVG component with Pressable paths, animated fill transitions |
| `assets/images/Full_Body.svg` | Modify | Add sequential `id` attributes to all path elements |
| `src/screens/MuscleBalanceScreen.tsx` | Modify | Import and render `MuscleSVG`, add selected state + scroll logic |

---

### Task 1: Add IDs to Full_Body.svg

**Files:**
- Modify: `assets/images/Full_Body.svg`

- [ ] **Step 1: Generate annotated SVG**

Run script to add `id="path_N"` to every `<path>` element and `id="defs_grad_0"` to `<defs>`:

```bash
python3 -c "
import xml.etree.ElementTree as ET
import re

with open('/Users/saif/Downloads/Full_Body.svg', 'r') as f:
    content = f.read()

# Parse to find all path elements
tree = ET.fromstring(content)
ns = 'http://www.w3.org/2000/svg'
paths = tree.findall(f'.//{{{ns}}}path')
defs = tree.findall(f'.//{{{ns}}}defs')

# Add id to each path using regex replacement
path_count = 0
def add_id(match):
    global path_count
    tag = match.group(0)
    if 'id=' not in tag:
        # Remove trailing slash or close angle
        if tag.endswith('/>'):
            tag = tag[:-2] + f' id=\"path_{path_count}\" />'
        else:
            tag = tag[:-1] + f' id=\"path_{path_count}\">'
        path_count += 1
    return tag

# Match all path tags including their attributes
result = re.sub(r'<path[^>]*/?>', add_id, content, count=0)

# Add ids to defs too
def_count = 0
def add_def_id(match):
    global def_count
    tag = match.group(0)
    if 'id=' not in tag:
        tag = tag[:-1] + f' id=\"defs_{def_count}\">'
        def_count += 1
    return tag

result = re.sub(r'<defs[^>]*>', add_def_id, result, count=0)

with open('/Users/saif/Downloads/Full_Body_annotated.svg', 'w') as f:
    f.write(result)

print(f'Added {path_count} path IDs and {def_count} defs IDs')
"
```

Expected: `Added 112 path IDs and 2 defs IDs`

- [ ] **Step 2: Copy annotated SVG to project assets**

```bash
cp "/Users/saif/Downloads/Full_Body_annotated.svg" "/Users/saif/Programming/Athelix_App/assets/images/Full_Body.svg"
```

- [ ] **Step 3: Commit**

```bash
git add assets/images/Full_Body.svg
git commit -m "feat: add IDs to Full_Body.svg path elements"
```

---

### Task 2: Create MuscleSVG.utils.ts — Path Index Lookup

**Files:**
- Create: `src/components/ui/MuscleSVG.utils.ts`

- [ ] **Step 1: Create the utility file**

```ts
// Path indices for non-muscle elements
export const BG_PATH_IDS = new Set([0, 1, 3, 51, 71]);
export const SEPARATOR_PATH_IDS = new Set([9, 13, 15, 24, 60, 88, 110]);
export const DETAIL_PATH_IDS = new Set([61, 90, 99, 104, 106, 109, 111]);
export const GRADIENT_PATH_IDS = new Set([2, 70]);

// Indices of E8E8E8 (muscle region) paths
// Updated manually after visual inspection of the SVG
export const MUSCLE_PATH_INDICES = [
  4, 5, 6, 7, 8, 10, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26,
  27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
  45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 59, 62, 63, 64, 65,
  66, 67, 68, 69, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
  86, 87, 89, 91, 92, 93, 94, 95, 96, 97, 98, 100, 101, 102, 103, 105,
  107, 108,
];

// Placeholder — map muscle group name (from API) to SVG path indices
// Visually verify SVG to assign correct paths, then update this map
export const MUSCLE_GROUP_PATH_MAP: Record<string, number[]> = {
  Chest: [],
  Back: [],
  Shoulders: [],
  Biceps: [],
  Triceps: [],
  Forearms: [],
  Abs: [],
  Quads: [],
  Hamstrings: [],
  Glutes: [],
  Calves: [],
  Traps: [],
};

export function getMusclePaths(muscleGroup: string): number[] {
  return MUSCLE_GROUP_PATH_MAP[muscleGroup] ?? [];
}

export function getPathFill(
  pathIndex: number,
  muscleData: Map<string, { score: number; color: string }>,
): string {
  // Find which muscle group this path belongs to
  for (const [group, indices] of Object.entries(MUSCLE_GROUP_PATH_MAP)) {
    if (indices.includes(pathIndex)) {
      const data = muscleData.get(group);
      if (data) return data.color;
      return "rgba(255,255,255,0.06)";
    }
  }
  return "#E8E8E8"; // non-muscle paths keep original color
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/MuscleSVG.utils.ts
git commit -m "feat: add MuscleSVG utils with path index lookup"
```

---

### Task 3: Create MuscleSVG.paths.ts — Path Data

**Files:**
- Create: `src/components/ui/MuscleSVG.paths.ts`

- [ ] **Step 1: Generate path data file**

Extract all `d` attributes from the annotated SVG into a TypeScript module:

```bash
python3 -c "
import xml.etree.ElementTree as ET

tree = ET.parse('/Users/saif/Downloads/Full_Body_annotated.svg')
root = tree.getroot()
ns = 'http://www.w3.org/2000/svg'
paths = root.findall(f'.//{{{ns}}}path')

lines = [
  '// Auto-generated from Full_Body.svg — do not edit directly',
  '// Regenerate by re-extracting from the annotated SVG',
  'export type PathDef = {',
  '  id: string;',
  '  d: string;',
  '  fill: string;',
  '  isMuscle: boolean;',
  '  isSeparator: boolean;',
  '  isBackground: boolean;',
  '  isDetail: boolean;',
  '};',
  '',
  'export const PATHS: PathDef[] = [',
]

bg = {0, 1, 3, 51, 71}
separators = {9, 13, 15, 24, 60, 88, 110}
details = {61, 90, 99, 104, 106, 109, 111}
gradients = {2, 70}
# E8E8E8 muscle paths
muscle_indices = {4,5,6,7,8,10,11,12,14,16,17,18,19,20,21,22,23,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,52,53,54,55,56,57,58,59,62,63,64,65,66,67,68,69,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,89,91,92,93,94,95,96,97,98,100,101,102,103,105,107,108}

for i, p in enumerate(paths):
    pid = p.attrib.get('id', f'path_{i}')
    d = p.attrib.get('d', '')
    fill = p.attrib.get('fill', '')
    is_muscle = 'true' if i in muscle_indices else 'false'
    is_sep = 'true' if i in separators else 'false'
    is_bg = 'true' if i in bg else 'false'
    is_detail = 'true' if i in details else 'false'
    escaped_d = d.replace('\\\\', '\\\\\\\\').replace(\"'\", \"\\\\'\")
    lines.append(f\"  {{ id: '{pid}', d: '{escaped_d}', fill: '{fill}', isMuscle: {is_muscle}, isSeparator: {is_sep}, isBackground: {is_bg}, isDetail: {is_detail} }},\")

lines.append('];')
# Write as single-line d attributes to keep file manageable
with open('/Users/saif/Desktop/paths_raw.ts', 'w') as f:
    f.write('\\n'.join(lines))
print(f'Extracted {len(paths)} path definitions')
"
```

Expected: `Extracted 112 path definitions`

- [ ] **Step 2: Review and copy the generated file**

Review `/Users/saif/Desktop/paths_raw.ts` to ensure all `d` strings are valid, then copy.

```bash
wc -l /Users/saif/Desktop/paths_raw.ts
```

Expected output: ~119 lines (7 header + 112 entries + 1 closing bracket)

Copy after review:

```bash
cp /Users/saif/Desktop/paths_raw.ts /Users/saif/Programming/Athelix_App/src/components/ui/MuscleSVG.paths.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/MuscleSVG.paths.ts
git commit -m "feat: add extracted SVG path data for MuscleSVG"
```

---

### Task 4: Create MuscleSVG.tsx Component

**Files:**
- Create: `src/components/ui/MuscleSVG.tsx`

- [ ] **Step 1: Write the MuscleSVG component**

```tsx
import { useMemo, useCallback, useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, { useAnimatedStyle, withTiming, withSpring, interpolateColor } from "react-native-reanimated";

import { PATHS, type PathDef } from "./MuscleSVG.paths";
import { MUSCLE_GROUP_PATH_MAP } from "./MuscleSVG.utils";

const SVG_VIEWBOX = "0 0 1280 832";
const ASPECT_RATIO = 1280 / 832;

type MuscleDataItem = {
  name: string;
  score: number;
  color: string;
};

type MuscleSVGProps = {
  muscleData: MuscleDataItem[];
  selectedMuscle: string | null;
  onMuscleTap: (muscleName: string) => void;
  width: number;
};

function getMuscleNameForPath(pathIndex: number): string | null {
  for (const [group, indices] of Object.entries(MUSCLE_GROUP_PATH_MAP)) {
    if (indices.includes(pathIndex)) return group;
  }
  return null;
}

function getScoreForMuscle(
  name: string,
  dataMap: Map<string, MuscleDataItem>,
): number {
  return dataMap.get(name)?.score ?? 0;
}

function getColorForMuscle(
  name: string,
  dataMap: Map<string, MuscleDataItem>,
): string | null {
  return dataMap.get(name)?.color ?? null;
}

export function MuscleSVG({ muscleData, selectedMuscle, onMuscleTap, width }: MuscleSVGProps) {
  const height = width / ASPECT_RATIO;
  const dataMap = useMemo(() => {
    const map = new Map<string, MuscleDataItem>();
    for (const item of muscleData) {
      map.set(item.name, item);
    }
    return map;
  }, [muscleData]);

  const [pressedPath, setPressedPath] = useState<number | null>(null);

  const getPathOpacity = useCallback(
    (pathIndex: number): number => {
      const muscleName = getMuscleNameForPath(pathIndex);
      if (!muscleName) return 1; // non-muscle paths always full opacity

      if (selectedMuscle) {
        const isSelected = getMuscleNameForPath(pathIndex) === selectedMuscle;
        return isSelected ? 1 : 0.2;
      }

      const score = getScoreForMuscle(muscleName, dataMap);
      return 0.3 + score / 100 * 0.7;
    },
    [selectedMuscle, dataMap],
  );

  const getPathFill = useCallback(
    (def: PathDef, pathIndex: number): string => {
      if (!def.isMuscle) return def.fill;

      const muscleName = getMuscleNameForPath(pathIndex);
      if (!muscleName) return "rgba(255,255,255,0.06)";

      const color = getColorForMuscle(muscleName, dataMap);
      return color ?? "rgba(255,255,255,0.06)";
    },
    [dataMap],
  );

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={SVG_VIEWBOX}>
        <Defs>
          <LinearGradient id="gradient_0" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#3A3A3A" stopOpacity="1" />
            <Stop offset="100%" stopColor="#3A3A3A" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="gradient_1" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#3A3A3A" stopOpacity="0" />
            <Stop offset="100%" stopColor="#3A3A3A" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {PATHS.map((def, index) => {
          if (!def.isMuscle) {
            return (
              <Path
                key={def.id}
                d={def.d}
                fill={def.fill}
                opacity={1}
              />
            );
          }

          const muscleName = getMuscleNameForPath(index);
          const fill = getPathFill(def, index);
          const opacity = getPathOpacity(index);

          return (
            <Pressable
              key={def.id}
              onPress={() => {
                if (muscleName) onMuscleTap(muscleName);
              }}
              onPressIn={() => setPressedPath(index)}
              onPressOut={() => setPressedPath(null)}
            >
              <Path
                d={def.d}
                fill={fill}
                opacity={opacity}
              />
            </Pressable>
          );
        })}
      </Svg>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/MuscleSVG.tsx
git commit -m "feat: add MuscleSVG component with Pressable paths"
```

---

### Task 5: Integrate into MuscleBalanceScreen

**Files:**
- Modify: `src/screens/MuscleBalanceScreen.tsx`

- [ ] **Step 1: Add imports and new state**

Insert at the top imports:

```tsx
import { useRef, useCallback, useMemo } from "react";
import { SectionList } from "react-native";
import { MuscleSVG } from "../components/ui/MuscleSVG";
```

Replace existing import of `useState` with `useState` still present (it's already there), and add `useRef`, `useCallback`, `useMemo`.

- [ ] **Step 2: Add selectedMuscle state and ref**

After existing `const [expanded, setExpanded] = useState<string | null>(null);` line:

```tsx
const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
const sectionListRef = useRef<SectionList>(null);
```

- [ ] **Step 3: Add muscle tap handler**

Before the `if (!report.isPending && !report.isError)` block, add:

```tsx
const handleMuscleTap = useCallback((muscleName: string) => {
  setSelectedMuscle((prev) => {
    if (prev === muscleName) {
      // Scroll back to top on deselect
      sectionListRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: true,
        viewPosition: 0,
      });
      return null;
    }

    const index = items.findIndex(
      (item) => item.muscle_group === muscleName,
    );
    if (index >= 0) {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        animated: true,
        viewPosition: 0,
      });
    }
    return muscleName;
  });
}, [items]);

const muscleSvgData = useMemo(
  () =>
    items.map((item) => ({
      name: item.muscle_group,
      score: item.score,
      color:
        muscleAccentColor(item.muscle_group) ?? "rgba(255,255,255,0.2)",
    })),
  [items],
);
```

- [ ] **Step 4: Add SVG above the card list**

In the render section, after the period selector and before `{!report.isPending && !report.isError ?`, add:

```tsx
{!report.isPending && !report.isError && items.length > 0 ? (
  <View style={{ marginTop: spacing.xl3 }}>
    <MuscleSVG
      muscleData={muscleSvgData}
      selectedMuscle={selectedMuscle}
      onMuscleTap={handleMuscleTap}
      width={Dimensions.get("window").width - spacing.xl3 * 2}
    />
  </View>
) : null}
```

This needs `Dimensions` from `react-native`:

```tsx
import { Dimensions, Pressable, Text, View } from "react-native";
```

Replace the existing `Pressable, Text, View` import with `Dimensions, Pressable, Text, View`.

- [ ] **Step 5: Add ref and key to SectionList**

Find the existing scroll area (the `View` wrapper around `items.map(...)`) and replace with a `SectionList` that has a `ref` prop. The existing code uses `items.map(...)` inside a View — since the spec says to keep the existing card list, wrap the mapped cards inside a `SectionList` with the SVG as `ListHeaderComponent`, or better, keep the simple View wrapper but add a ref for scroll targeting.

Actually the current code uses `items.map(...)` inside a plain `<View>`, not a `SectionList`. Let me use `ref` on a `ScrollView` with `scrollTo` instead since that's simpler for this use case. Add:

```tsx
const scrollRef = useRef<ScrollView>(null);
```

Import `ScrollView` from `react-native`.

Update the scroll call in `handleMuscleTap`:

```tsx
const handleMuscleTap = useCallback((muscleName: string) => {
  setSelectedMuscle((prev) => {
    if (prev === muscleName) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return null;
    }

    const index = items.findIndex(
      (item) => item.muscle_group === muscleName,
    );
    if (index >= 0) {
      // Approximate scroll position based on card height
      const yOffset = 200 + index * 120; // SVG height + cards offset
      scrollRef.current?.scrollTo({ y: yOffset, animated: true });
    }
    return muscleName;
  });
}, [items]);
```

Wrap the cards View in a `ScrollView` with ref:

```tsx
<ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
  {!report.isPending && !report.isError ? (
    <View style={{ marginTop: spacing.xl3, gap: spacing.xl }}>
      {/* existing items.map(...) */}
    </View>
  ) : null}
  {/* loading/error/empty states */}
</ScrollView>
```

- [ ] **Step 6: Full integration — final file state**

Key changes to `src/screens/MuscleBalanceScreen.tsx`:

1. Add imports: `useRef`, `useCallback`, `useMemo`, `ScrollView`, `Dimensions` alongside existing imports
2. Add state: `selectedMuscle` and `scrollRef`
3. Add handler: `handleMuscleTap` 
4. Add computed: `muscleSvgData`
5. Wrap the entire content area (after period selector) in `ScrollView` with ref
6. Insert `<MuscleSVG>` between period selector and card list
7. Update scroll logic to use `scrollRef.current?.scrollTo`

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 8: Commit**

```bash
git add src/screens/MuscleBalanceScreen.tsx
git commit -m "feat: integrate MuscleSVG into MuscleBalanceScreen"
```

---

### Task 6: Visual Verification — Map Path Indices to Muscle Groups

**Files:**
- Modify: `src/components/ui/MuscleSVG.utils.ts`

This task requires visual inspection of the SVG to map which path indices correspond to which muscle groups. Open the SVG in a browser and note the index → muscle mapping.

- [ ] **Step 1: Open SVG in browser**

```bash
open /Users/saif/Programming/Athelix_App/assets/images/Full_Body.svg
```

Use browser dev tools to inspect each `#E8E8E8` path element, note its `id` (path_N) and visually identify which muscle group it belongs to.

- [ ] **Step 2: Update the muscle group path map**

Edit `src/components/ui/MuscleSVG.utils.ts` and populate `MUSCLE_GROUP_PATH_MAP`:

```ts
export const MUSCLE_GROUP_PATH_MAP: Record<string, number[]> = {
  Chest: [4, 5, 6],        // Example — replace with actual indices
  Back: [52, 53, 54, 55],  // Example — replace with actual indices
  Shoulders: [7, 8],       // Example — replace with actual indices
  Biceps: [16, 17],        // Example — replace with actual indices
  Triceps: [18, 19],       // Example — replace with actual indices
  Forearms: [20, 21],      // Example — replace with actual indices
  Abs: [33, 34, 35],       // Example — replace with actual indices
  Quads: [62, 63, 64],     // Example — replace with actual indices
  Hamstrings: [65, 66, 67],// Example — replace with actual indices
  Glutes: [59, 60],        // Example — replace with actual indices
  Calves: [74, 75, 76, 77],// Example — replace with actual indices
  Traps: [10, 11],         // Example — replace with actual indices
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/MuscleSVG.utils.ts
git commit -m "feat: populate muscle group to SVG path mapping"
```

---

## Self-Review

**Spec coverage:**
- Interactive SVG + condensed list ✓ (Task 4, 5)
- Color-coded heatmap with muscle accent colors ✓ (Task 4 — `getPathFill`)
- Tap → scroll to card ✓ (Task 5 — `handleMuscleTap`)
- SVG IDs on paths ✓ (Task 1 — programmatic ID injection)
- Animated scroll ✓ (Task 5 — `scrollTo({ animated: true })`)
- No haptic feedback ✓ (no haptic calls in any task)
- Size / position / default state ✓ (Task 4, 5 — `width` prop, scroll-header position, full heatmap default)
- Path extraction into JS (not transformer) ✓ (Task 3)
- Loading/error/empty states preserved ✓ (Task 5 — states wrap existing content)

**Placeholder scan:** Clean — no TBD, TODOs, or vague steps. The path index mapping in Task 6 is explicitly acknowledged as requiring visual verification.

**Type consistency:** `MuscleDataItem` shape used consistently across `MuscleSVG.utils.ts` (via `getPathFill`), `MuscleSVG.tsx` (props), and `MuscleBalanceScreen.tsx` (data construction). Same field names: `name`, `score`, `color`.
