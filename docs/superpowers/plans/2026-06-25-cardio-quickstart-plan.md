# Cardio Quick-Start & Enhanced Calorie Burn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add standalone quick-start timer sessions for cardio activities and enhance calorie formula with height/age/gender via Mifflin-St Jeor BMR.

**Architecture:** Backend migration seeds 10 canonical cardio exercises + refactored calorie helpers using full profile. Frontend adds HomeScreen quick-action cards + new QuickCardio screen with timer and finish form. Existing mutation/set-creation flow reused.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic (backend), React Native + React Query (frontend)

---

### Task 1: Seed canonical cardio exercises (backend migration)

**Files:**
- Create: `alembic/versions/c8d9e0f1a2b3_seed_canonical_cardio_exercises.py`

- [ ] **Step 1: Verify current migration head**

Run: `alembic current 2>&1 || true`
Expected: shows latest head revision (e.g. `b9b3ac1ccd42`)

- [ ] **Step 2: Create migration file**

```python
"""seed canonical cardio exercises

Revision ID: c8d9e0f1a2b3
Revises: b9b3ac1ccd42
Create Date: 2026-06-25
"""
from alembic import op
from sqlalchemy import text
from datetime import datetime, timezone

revision = "c8d9e0f1a2b3"
down_revision = "b9b3ac1ccd42"
branch_labels = None
depends_on = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


CARDIO_EXERCISES = [
    {
        "id": "cardio_run",
        "name": "Running (Outdoor)",
        "body_part": "cardio",
        "equipment": "body weight",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 9.8,
    },
    {
        "id": "cardio_walk",
        "name": "Walking",
        "body_part": "cardio",
        "equipment": "body weight",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 3.5,
    },
    {
        "id": "cardio_cycle",
        "name": "Cycling (Outdoor)",
        "body_part": "cardio",
        "equipment": "body weight",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 8.0,
    },
    {
        "id": "cardio_swim",
        "name": "Swimming",
        "body_part": "cardio",
        "equipment": "body weight",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 8.0,
    },
    {
        "id": "cardio_hike",
        "name": "Hiking",
        "body_part": "cardio",
        "equipment": "body weight",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 6.0,
    },
    {
        "id": "cardio_row",
        "name": "Rowing Machine",
        "body_part": "cardio",
        "equipment": "rowing machine",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 7.0,
    },
    {
        "id": "cardio_elliptical",
        "name": "Elliptical Trainer",
        "body_part": "cardio",
        "equipment": "elliptical machine",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 5.0,
    },
    {
        "id": "cardio_stair",
        "name": "Stair Climber",
        "body_part": "cardio",
        "equipment": "stepmill machine",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 9.0,
    },
    {
        "id": "cardio_treadmill",
        "name": "Treadmill (Running)",
        "body_part": "cardio",
        "equipment": "treadmill",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 9.8,
    },
    {
        "id": "cardio_bike",
        "name": "Stationary Bike",
        "body_part": "cardio",
        "equipment": "stationary bike",
        "target": "cardiovascular",
        "exercise_category": "cardio",
        "met_value": 8.0,
    },
]


def upgrade():
    conn = op.get_bind()
    now = _now()
    for ex in CARDIO_EXERCISES:
        conn.execute(
            text("""
                INSERT INTO app_schema.exercises
                    (id, name, body_part, equipment, target,
                     exercise_category, met_value, created_at, updated_at)
                VALUES
                    (:id, :name, :body_part, :equipment, :target,
                     :exercise_category, :met_value, :created_at, :updated_at)
                ON CONFLICT (id) DO NOTHING
            """),
            {
                "id": ex["id"],
                "name": ex["name"],
                "body_part": ex["body_part"],
                "equipment": ex["equipment"],
                "target": ex["target"],
                "exercise_category": ex["exercise_category"],
                "met_value": ex["met_value"],
                "created_at": now,
                "updated_at": now,
            },
        )


def downgrade():
    conn = op.get_bind()
    ids = [ex["id"] for ex in CARDIO_EXERCISES]
    for eid in ids:
        conn.execute(
            text("DELETE FROM app_schema.exercises WHERE id = :id"),
            {"id": eid},
        )
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/saif/Programming/Athlix
alembic upgrade head
```

Expected: runs successfully, 10 new rows in `app_schema.exercises`.

- [ ] **Step 4: Verify exercises exist**

```bash
cd /Users/saif/Programming/Athlix
.venv/bin/python3 -c "
from app.core.database import SessionLocal
from app.models.exercise import Exercise
from sqlalchemy import select
db = SessionLocal()
count = db.execute(select(Exercise).where(Exercise.id.like('cardio_%'))).scalars().all()
print(f'Found {len(count)} canonical cardio exercises')
for e in count:
    print(f'  {e.id}: {e.name} (MET={e.met_value})')
db.close()
"
```

Expected: 10 exercises printed with correct names and MET values.

- [ ] **Step 5: Commit**

---

### Task 2: Refactor calorie helpers for enhanced formula

**Files:**
- Modify: `app/api/v1/endpoints/workout_sessions.py`

- [ ] **Step 1: Add helper functions before `_compute_calories`**

Add these functions after `_compute_session_stats` (after line 86):

```python
from datetime import date


def _compute_age(date_of_birth: date | None) -> int | None:
    if date_of_birth is None:
        return None
    today = date.today()
    return today.year - date_of_birth.year - (
        (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    )


def _compute_bmr_hourly(
    weight_kg: float, height_cm: float | None, age: int | None, gender: str | None
) -> float | None:
    if height_cm is None or age is None or gender is None:
        return None
    if gender.lower() in ("male", "m"):
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    elif gender.lower() in ("female", "f"):
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    else:
        avg = (
            10 * weight_kg + 6.25 * height_cm - 5 * age
        )
        bmr = avg
    return bmr / 24.0


def _get_activity_calorie_type(name: str) -> str:
    lowered = name.lower()
    if any(kw in lowered for kw in ("run", "jog")):
        return "running"
    if "walk" in lowered:
        return "walking"
    if "hike" in lowered:
        return "hiking"
    return "met"
```

- [ ] **Step 2: Rewrite `_compute_calories`**

Replace the existing `_compute_calories` function (lines 89-119):

```python
def _compute_calories(
    db: Session, sets: list[ExerciseSet], user_id: int
) -> float | None:
    from app.models.user import UserProfile
    profile = db.execute(
        select(
            UserProfile.weight_kg,
            UserProfile.height_cm,
            UserProfile.gender,
            UserProfile.date_of_birth,
        ).where(UserProfile.user_id == user_id)
    ).first()
    if profile is None or profile.weight_kg is None:
        return None

    weight_kg = float(profile.weight_kg)
    height_cm = float(profile.height_cm) if profile.height_cm else None
    gender = profile.gender
    age = _compute_age(profile.date_of_birth)
    bmr_hr = _compute_bmr_hourly(weight_kg, height_cm, age, gender)

    exercise_ids = list(set(s.exercise_id for s in sets))
    exercise_met_map: dict[str, float | None] = {}
    exercise_name_map: dict[str, str] = {}
    for eid in exercise_ids:
        row = db.execute(
            select(Exercise.met_value, Exercise.name).where(Exercise.id == eid)
        ).first()
        exercise_met_map[eid] = float(row.met_value) if row and row.met_value is not None else None
        exercise_name_map[eid] = row.name if row else ""

    total = 0.0
    has_cardio = False
    for s in sets:
        met = exercise_met_map.get(s.exercise_id)
        name = exercise_name_map.get(s.exercise_id, "")
        if s.duration_sec is None or s.duration_sec == 0:
            continue

        hours = s.duration_sec / 3600.0
        cal_type = _get_activity_calorie_type(name)
        distance_km = (s.distance_m or 0) / 1000.0

        if cal_type != "met" and distance_km > 0:
            factor = {"running": 1.036, "walking": 0.5, "hiking": 0.6}.get(cal_type, 1.036)
            cal = weight_kg * distance_km * factor
            has_cardio = True
        elif met is not None:
            rpe = s.rpe if s.rpe is not None else 5.0
            height_factor = 1.0 + (height_cm - 170.0) * 0.002 if height_cm else 1.0
            cal = met * (rpe / 5.0) * weight_kg * hours * height_factor
            has_cardio = True
        else:
            continue

        if bmr_hr and cal < bmr_hr * hours:
            cal = bmr_hr * hours
        total += cal

    return round(total, 1) if has_cardio else None
```

- [ ] **Step 3: Rewrite `_compute_set_calories`**

Replace the existing function (lines 122-143). Add `distance_m` parameter:

```python
def _compute_set_calories(
    db: Session,
    exercise_id: str,
    set_rpe: float | None,
    set_duration_sec: int | None,
    distance_m: float | None,
    user_id: int,
) -> float | None:
    if set_duration_sec is None or set_duration_sec == 0:
        return None

    from app.models.user import UserProfile
    profile = db.execute(
        select(
            UserProfile.weight_kg,
            UserProfile.height_cm,
            UserProfile.gender,
            UserProfile.date_of_birth,
        ).where(UserProfile.user_id == user_id)
    ).first()
    if profile is None or profile.weight_kg is None:
        return None

    weight_kg = float(profile.weight_kg)
    height_cm = float(profile.height_cm) if profile.height_cm else None
    gender = profile.gender
    age = _compute_age(profile.date_of_birth)
    bmr_hr = _compute_bmr_hourly(weight_kg, height_cm, age, gender)

    met = db.execute(
        select(Exercise.met_value, Exercise.name).where(Exercise.id == exercise_id)
    ).first()
    if met is None:
        return None
    met_val = float(met.met_value) if met.met_value is not None else None
    name = met.name or ""
    if met_val is None:
        return None

    hours = set_duration_sec / 3600.0
    cal_type = _get_activity_calorie_type(name)
    dist_km = (distance_m or 0) / 1000.0

    if cal_type != "met" and dist_km > 0:
        factor = {"running": 1.036, "walking": 0.5, "hiking": 0.6}.get(cal_type, 1.036)
        cal = weight_kg * dist_km * factor
    else:
        rpe = set_rpe if set_rpe is not None else 5.0
        height_factor = 1.0 + (height_cm - 170.0) * 0.002 if height_cm else 1.0
        cal = met_val * (rpe / 5.0) * weight_kg * hours * height_factor

    if bmr_hr and cal < bmr_hr * hours:
        cal = bmr_hr * hours

    return round(cal, 1)
```

- [ ] **Step 4: Update call site of `_compute_set_calories`**

Find line 323 and update to pass `s.distance_m`:

Change:
```python
cal = _compute_set_calories(db, s.exercise_id, s.rpe, s.duration_sec, current_user.id)
```
To:
```python
cal = _compute_set_calories(db, s.exercise_id, s.rpe, s.duration_sec, s.distance_m, current_user.id)
```

- [ ] **Step 5: Verify syntax**

```bash
cd /Users/saif/Programming/Athlix
.venv/bin/python3 -c "import ast; ast.parse(open('app/api/v1/endpoints/workout_sessions.py').read()); print('OK')"
```

Expected: OK

- [ ] **Step 6: Commit**

---

### Task 3: Create cardio activity type map (frontend)

**Files:**
- Create: `src/utils/cardio.ts`

- [ ] **Step 1: Create `src/utils/cardio.ts`**

```typescript
export type CardioActivityType =
  | "running"
  | "walking"
  | "cycling"
  | "swimming"
  | "hiking"
  | "rowing"
  | "elliptical"
  | "stair_climber"
  | "treadmill"
  | "stationary_bike";

export interface CardioActivity {
  type: CardioActivityType;
  label: string;
  icon: string;
  exerciseId: string;
  color: string;
}

export const CARDIO_ACTIVITIES: CardioActivity[] = [
  { type: "running", label: "Run", icon: "run", exerciseId: "cardio_run", color: "#FF5A36" },
  { type: "walking", label: "Walk", icon: "walk", exerciseId: "cardio_walk", color: "#22C55E" },
  { type: "cycling", label: "Cycle", icon: "cycle", exerciseId: "cardio_cycle", color: "#3B82F6" },
  { type: "swimming", label: "Swim", icon: "swim", exerciseId: "cardio_swim", color: "#8B5CF6" },
  { type: "hiking", label: "Hike", icon: "hike", exerciseId: "cardio_hike", color: "#F59E0B" },
  { type: "rowing", label: "Row", icon: "row", exerciseId: "cardio_row", color: "#22C55E" },
  { type: "elliptical", label: "Elli", icon: "elliptical", exerciseId: "cardio_elliptical", color: "#FF5A36" },
  { type: "stair_climber", label: "Stair", icon: "stairs", exerciseId: "cardio_stair", color: "#3B82F6" },
  { type: "treadmill", label: "Tread", icon: "treadmill", exerciseId: "cardio_treadmill", color: "#8B5CF6" },
  { type: "stationary_bike", label: "Bike", icon: "stationary-bike", exerciseId: "cardio_bike", color: "#F59E0B" },
];

export function getCardioActivity(type: CardioActivityType): CardioActivity {
  const act = CARDIO_ACTIVITIES.find((a) => a.type === type);
  if (!act) throw new Error(`Unknown cardio activity: ${type}`);
  return act;
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep -c "cardio" || echo "0 errors"`

Expected: 0 errors (or only pre-existing errors)

- [ ] **Step 3: Commit**

---

### Task 4: Add QuickCardio route to navigation types

**Files:**
- Modify: `src/types/navigation.ts`

- [ ] **Step 1: Add import and route to `RootStackParamList`**

Add to the import section:
```typescript
import type { CardioActivityType } from "../utils/cardio";
```

Add to `RootStackParamList`:
```typescript
  QuickCardio: { activityType: CardioActivityType };
```

The full type should now have `QuickCardio` in the union.

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "navigation.ts" || echo "0 errors"`

Expected: 0 errors

- [ ] **Step 3: Commit**

---

### Task 5: Register QuickCardioScreen in AppNavigator

**Files:**
- Create: `src/screens/QuickCardioScreen.tsx` (just the shell, full implementation in Task 7)
- Modify: `src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Create minimal QuickCardioScreen shell**

```typescript
import { Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { COLORS } from "../theme/colors";
import { Screen } from "../components/ui/Layout";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "QuickCardio">;
  route: RouteProp<RootStackParamList, "QuickCardio">;
};

export function QuickCardioScreen({ navigation, route }: Props) {
  return (
    <Screen>
      <Text style={{ color: COLORS.text }}>QuickCardio: {route.params.activityType}</Text>
    </Screen>
  );
}
```

- [ ] **Step 2: Register in AppNavigator**

Add import at top:
```typescript
import { QuickCardioScreen } from "../screens/QuickCardioScreen";
```

Add screen after `BodyweightHistory`:
```typescript
        <RootStack.Screen name="QuickCardio" component={QuickCardioScreen} />
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "QuickCardio" || echo "0 errors"`

Expected: 0 errors

- [ ] **Step 4: Commit**

---

### Task 6: Add Quick Cardio section to HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Add imports**

Add to imports:
```typescript
import { FlatList } from "react-native";
import { CARDIO_ACTIVITIES, type CardioActivity } from "../utils/cardio";
```

- [ ] **Step 2: Add Quick Cardio section before "Last Workout" section**

Add this block between the Bodyweight card (ending `</Pressable>`) and the "Last Workout" section (starting `{/* Last Workout */}`). Find the closing `</Pressable>` of the bodyweight section (before `{/* Last Workout */}`):

Insert after the bodyweight `</Pressable>` (after line 162 `</Pressable>`):

```typescript
      <View style={{ marginBottom: SPACING.xl2 }}>
        <View style={[styles.sectionHeadingRow, { marginBottom: SPACING.lg }]}>
          <Text style={styles.sectionCardTitle}>Quick Cardio</Text>
        </View>
        <FlatList
          data={CARDIO_ACTIVITIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: SPACING.md }}
          keyExtractor={(item) => item.type}
          renderItem={({ item }: { item: CardioActivity }) => (
            <Pressable
              onPress={() => navigation.navigate("QuickCardio", { activityType: item.type })}
            >
              <View
                style={{
                  width: 80,
                  height: 100,
                  backgroundColor: COLORS.cardElevated,
                  borderRadius: RADIUS.card,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: SPACING.sm,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: item.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{iconForActivity(item.type)}</Text>
                </View>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 12,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </View>
```

- [ ] **Step 3: Add `iconForActivity` helper function (outside the component)**

Add before the `HomeScreen` function or at end of file:

```typescript
function iconForActivity(type: string): string {
  const icons: Record<string, string> = {
    running: "🏃",
    walking: "🚶",
    cycling: "🚴",
    swimming: "🏊",
    hiking: "🥾",
    rowing: "🚣",
    elliptical: "🏋️",
    stair_climber: "🪜",
    treadmill: "🏃",
    stationary_bike: "🚲",
  };
  return icons[type] ?? "🏃";
}
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep "HomeScreen" || echo "0 errors"`

Expected: 0 errors (or only pre-existing errors in other files)

- [ ] **Step 5: Commit**

---

### Task 7: Build QuickCardioScreen (timer + finish form)

**Files:**
- Create: `src/components/ui/RpeStepper.tsx`
- Modify: `src/screens/QuickCardioScreen.tsx` (full implementation)

- [ ] **Step 1: Create RpeStepper component**

```typescript
import { Pressable, Text, View } from "react-native";
import { COLORS } from "../../theme/colors";
import { SPACING, RADIUS } from "../../theme/spacing";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function RpeStepper({ value, onChange, min = 1, max = 10 }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS.card,
          backgroundColor: COLORS.cardSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "600" }}>−</Text>
      </Pressable>
      <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "700", minWidth: 30, textAlign: "center" }}>
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS.card,
          backgroundColor: COLORS.cardSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "600" }}>+</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Replace QuickCardioScreen shell with full implementation**

```typescript
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "../types/navigation";
import { getCardioActivity, type CardioActivityType } from "../utils/cardio";
import { createWorkoutSessionWorkoutSessionsPost } from "../api/endpoints/workout-sessions/workout-sessions";
import { createExerciseSetWorkoutSessionsSessionIdSetsPost } from "../api/endpoints/workout-sessions/workout-sessions";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { RpeStepper } from "../components/ui/RpeStepper";
import { queryKeys } from "../api/queryKeys";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "QuickCardio">;
  route: RouteProp<RootStackParamList, "QuickCardio">;
};

type Phase = "idle" | "running" | "paused" | "finish";

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function QuickCardioScreen({ navigation, route }: Props) {
  const activity = getCardioActivity(route.params.activityType);
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [distanceKm, setDistanceKm] = useState("");
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startTimer() {
    startTimeRef.current = new Date();
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
  }

  function pauseTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPhase("paused");
  }

  function resumeTimer() {
    setPhase("running");
    intervalRef.current = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
  }

  function finishTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPhase("finish");
  }

  async function handleSave() {
    if (!distanceKm || parseFloat(distanceKm) <= 0 || rpe < 1 || rpe > 10) return;
    setSaving(true);
    try {
      const now = new Date();
      const startedAt = startTimeRef.current ?? now;
      const finishedAt = now;

      const sessionRes = await createWorkoutSessionWorkoutSessionsPost({
        name: activity.label,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        is_completed: false,
      });
      const session = sessionRes.data;

      await createExerciseSetWorkoutSessionsSessionIdSetsPost(session.id, {
        exercise_id: activity.exerciseId,
        set_number: 1,
        set_type: "normal",
        duration_sec: elapsedSec,
        distance_m: parseFloat(distanceKm) * 1000,
        rpe,
        notes: notes || undefined,
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });

      navigation.replace("SessionDetail", { id: String(session.id) });
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  }

  if (phase === "finish") {
    const distNum = parseFloat(distanceKm) || 0;
    const estimatedCalories = distNum > 0 && elapsedSec > 0
      ? Math.round(parseFloat(activity.exerciseId.includes("walk") ? "0.5" : "1.036") * 80 * distNum)
      : null;

    return (
      <Screen>
        <BackHeader title="Finish" onBack={() => setPhase("paused")} />
        <View style={{ flex: 1, paddingTop: SPACING.xl3, gap: SPACING.xl2 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, color: COLORS.text, fontWeight: "700" }}>{activity.label}</Text>
            <Text style={{ fontSize: 14, color: COLORS.muted, marginTop: SPACING.xs }}>Duration: {formatTimer(elapsedSec)}</Text>
          </View>

          <View>
            <Text style={[styles.detailLabel, { marginBottom: SPACING.sm }]}>Distance (km)</Text>
            <TextInput
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={COLORS.faint}
              style={{
                backgroundColor: COLORS.cardSoft,
                color: COLORS.text,
                fontSize: 20,
                fontWeight: "600",
                padding: SPACING.md,
                borderRadius: RADIUS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
          </View>

          <View>
            <Text style={[styles.detailLabel, { marginBottom: SPACING.sm }]}>RPE (1-10)</Text>
            <RpeStepper value={rpe} onChange={setRpe} />
          </View>

          <View>
            <Text style={[styles.detailLabel, { marginBottom: SPACING.sm }]}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it feel?"
              placeholderTextColor={COLORS.faint}
              style={{
                backgroundColor: COLORS.cardSoft,
                color: COLORS.text,
                fontSize: 16,
                padding: SPACING.md,
                borderRadius: RADIUS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
                minHeight: 60,
                textAlignVertical: "top",
              }}
              multiline
            />
          </View>

          {estimatedCalories ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
              <Text style={{ fontSize: 16, color: COLORS.orange }}>🔥</Text>
              <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: "600" }}>
                ~{estimatedCalories} kcal estimated
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            label={saving ? "Saving..." : "Save Workout"}
            onPress={handleSave}
            disabled={saving || !distanceKm || parseFloat(distanceKm) <= 0}
          />
        </View>
      </Screen>
    );
  }

  const isRunning = phase === "running";
  const canFinish = phase === "running" || phase === "paused";

  return (
    <Screen>
      <BackHeader title={activity.label} onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.xl4 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: activity.color + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 36 }}>{iconForActivity(route.params.activityType)}</Text>
        </View>
        <Text style={{ fontSize: 22, color: COLORS.text, fontWeight: "700" }}>{activity.label}</Text>
        <Text style={{ fontSize: 48, color: COLORS.text, fontWeight: "200", fontVariant: ["tabular-nums"] }}>
          {formatTimer(elapsedSec)}
        </Text>
        {isRunning ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red }} />
            <Text style={{ color: COLORS.red, fontSize: 12, fontWeight: "600" }}>REC</Text>
          </View>
        ) : (
          <View style={{ height: 20 }} />
        )}
        <View style={{ flexDirection: "row", gap: SPACING.xl2 }}>
          {phase === "idle" ? (
            <PrimaryButton label="Start" onPress={startTimer} />
          ) : (
            <>
              <PrimaryButton
                label={isRunning ? "Pause" : "Resume"}
                onPress={isRunning ? pauseTimer : resumeTimer}
              />
              <PrimaryButton label="Finish" onPress={finishTimer} disabled={!canFinish} />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Add `iconForActivity` to QuickCardioScreen (if not already imported from elsewhere)**

Add at end of file or use the one defined in HomeScreen. Since both files need it, extract to `src/utils/cardio.ts`:

Add to `src/utils/cardio.ts`:
```typescript
export function iconForActivity(type: string): string {
  const icons: Record<string, string> = {
    running: "🏃", walking: "🚶", cycling: "🚴", swimming: "🏊",
    hiking: "🥾", rowing: "🚣", elliptical: "🏋️", stair_climber: "🪜",
    treadmill: "🏃", stationary_bike: "🚲",
  };
  return icons[type] ?? "🏃";
}
```

Then update HomeScreen to import `iconForActivity` from `../utils/cardio` instead of defining it locally.

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep -E "QuickCardio|cardio" || echo "0 errors"`

Expected: 0 errors

- [ ] **Step 5: Commit**

---

### Task 8: Verify and final check

**Files:**
- Both repos

- [ ] **Step 1: Backend type check**

```bash
cd /Users/saif/Programming/Athlix
.venv/bin/python3 -c "
import ast
for f in ['app/api/v1/endpoints/workout_sessions.py', 'alembic/versions/c8d9e0f1a2b3_seed_canonical_cardio_exercises.py']:
    ast.parse(open(f).read())
    print(f'{f}: OK')
"
```

Expected: both files parse OK

- [ ] **Step 2: Frontend type check**

```bash
cd /Users/saif/Programming/Athelix_App
npx tsc --noEmit 2>&1
```

Expected: no errors related to QuickCardio, cardio.ts, or the navigation changes

- [ ] **Step 3: Verify migration runs clean**

```bash
cd /Users/saif/Programming/Athlix
alembic upgrade head
```

Expected: runs without error
