# Cardio Quick-Start & Enhanced Calorie Burn

**Date:** 2026-06-25
**Status:** Approved Design

## Overview

Add two ways to log cardio activities: (1) standalone quick-start timer sessions for run/swim/cycle/etc., (2) existing set-based cardio within mixed workouts. Enhance calorie formula to use full profile (height, weight, age, gender) via Mifflin-St Jeor BMR.

## New Exercises (Backend Migration)

Canonical cardio exercises added to the catalog so quick-start activities map to real exercises with proper MET values:

| Activity | MET | exercise_category |
|----------|-----|-------------------|
| Running (Outdoor) | 9.8 | cardio |
| Walking | 3.5 | cardio |
| Cycling (Outdoor) | 8.0 | cardio |
| Swimming | 8.0 | cardio |
| Hiking | 6.0 | cardio |
| Rowing Machine | 7.0 | cardio |
| Elliptical Trainer | 5.0 | cardio |
| Stair Climber | 9.0 | cardio |
| Treadmill (Running) | 9.8 | cardio |
| Stationary Bike | 8.0 | cardio |

These appear in the ExercisePicker under the "Cardio" tab. A migration seeds them with equipment="body weight" for outdoor activities, specific equipment for machines.

## Enhanced Calorie Formula

### Current
`MET × (RPE/5) × weight_kg × duration_hours`

### New (3-step)

**Step 1 — BMR (Mifflin-St Jeor)**
- Male: `10W + 6.25H - 5A + 5`
- Female: `10W + 6.25H - 5A - 161`
- `BMR_hr = BMR / 24`

Where W = weight_kg, H = height_cm, A = age from profile.

**Step 2 — Activity burn by type:**

| Type | Formula | Notes |
|------|---------|-------|
| Run/Walk/Hike + distance | `W × dist_km × k` | k=1.036 run, 0.5 walk, 0.6 hike |
| All others (MET) | `MET × W × hours × (RPE/5) × H_factor` | H_factor = 1 + (H - 170) × 0.002 |

**Step 3 — Final**
- `max(activity_burn, BMR_hr × hours)`
- Never below resting burn
- Per-set, per-exercise, per-session totals

### Implementation
- Refactor `_compute_calories` and `_compute_set_calories` in `workout_sessions.py`
- Fetch full profile (height_cm, weight_kg, gender, date_of_birth) instead of just weight_kg
- Compute age from date_of_birth on the fly
- For distance-based: `ExerciseSet.distance_m` must be present

## HomeScreen — Quick Cardio Section

New horizontal scroll section between "Bodyweight" and "Last Workout":

```
┌──────────────────────────────────────────┐
│  Quick Cardio                     See All  │
│                                            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 🏃  │ │ 🚶  │ │ 🚴  │ │ 🏊  │ │ 🥾  │  │
│  │ Run │ │Walk │ │Cycle│ │Swim │ │Hike │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 🚣  │ │ 🏋️  │ │ 🪜  │ │ 🏃  │ │ 🚲  │  │
│  │ Row │ │Elli │ │Stair│ │Tread│ │Stat │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
└──────────────────────────────────────────┘
```

- 10 activity cards in a horizontal FlatList (scrollable, ~2 rows visible)
- Each card: icon + name, dark elevated card style with colored accent
- Gap between cards: 12px
- Tapping navigates to QuickCardio with activityType param
- "See All" hidden in v1 (only if needed later)

## QuickCardio Screen

Full-screen timer interface matching app's dark theme.

### Timer Mode
```
┌─────────────────────────────────────┐
│  ← Back                    Running  │
│                                         │
│              🏃                        │
│          Running (Outdoor)          │
│                                         │
│           00:15:42                    │
│           ● REC                         │
│                                         │
│        [ Pause ]  [ Finish ]         │
└─────────────────────────────────────┘
```

- Large timer display (monospace, 48px)
- Start → Pause toggle button
- Finish button (only after timer has started)
- Red recording indicator dot

### Finish Form (bottom sheet / screen push)
```
┌─────────────────────────────────────┐
│  ← Back            Finish           │
│                                         │
│            Running (Outdoor)         │
│            Duration: 15:42           │
│                                         │
│   Distance                [4.2] km │
│   RPE (1-10)              [  7  ] │
│   Notes (optional)     [           ] │
│                                         │
│   🔥 ~342 kcal estimated            │
│                                         │
│          [ Save Workout ]           │
└─────────────────────────────────────┘
```

- Distance: numeric TextInput, unit "km" suffix
- RPE: horizontal stepper (buttons - / + with value display)
- Live calorie estimate updates as user enters data
- Save button disabled until distance and RPE entered
- Validation: distance > 0, RPE 1-10

## Navigation & Data Flow

### New Route
```typescript
type RootStackParamList = {
  // ... existing routes
  QuickCardio: { activityType: CardioActivityType };
};

type CardioActivityType =
  | "running" | "walking" | "cycling" | "swimming"
  | "hiking" | "rowing" | "elliptical" | "stair_climber"
  | "treadmill" | "stationary_bike";
```

### Mapping
Frontend holds a static map: `CardioActivityType → { label, icon, exerciseName, metValue }`.

Backend mapping via exercise name lookup.

### Save Flow
1. User fills finish form → taps "Save Workout"
2. Frontend calls `createWorkoutSessionWorkoutSessionsPost` with:
   - `name`: activity label
   - `started_at`: timer start time (ISO)
   - `is_completed: true`
   - Sets array with one entry:
     - `exercise_id`: resolved from mapping
     - `duration_sec`: from timer
     - `distance_m`: converted from km input
     - `rpe`: from input
     - `notes`: optional
3. Backend creates session, computes calories using enhanced formula
4. Frontend navigates to `SessionDetail` showing the result with calorie stat

## Backend Changes

### Files to modify:
- `app/api/v1/endpoints/workout_sessions.py`: enhanced `_compute_calories`, `_compute_set_calories`
- New migration: seed 10 canonical cardio exercises
- `app/exercise_cache.py`: no change (auto-picks up new exercises)

### Calorie helper refactor:
```python
def _get_user_profile(db, user_id):
    """Returns (weight_kg, height_cm, gender, age) from UserProfile."""

def _compute_bmr_hourly(weight_kg, height_cm, age, gender):
    """Mifflin-St Jeor, divide by 24."""

def _compute_distance_calories(weight_kg, distance_m, activity_type):
    """Running/walking/hiking distance-based formula."""

def _compute_met_calories(met, weight_kg, hours, rpe, height_cm):
    """MET-based with height factor."""
```

## Frontend Changes

### New files:
- `src/screens/QuickCardioScreen.tsx`: timer + finish form
- `src/utils/cardio.ts`: CardioActivityType map, icon mapping, exercise lookup

### Modified files:
- `src/screens/HomeScreen.tsx`: add Quick Cardio horizontal scroll section
- `src/types/navigation.ts`: add QuickCardio route + param
- `src/navigation/AppNavigator.tsx`: register QuickCardio screen
- `src/api/queries.ts`: potentially add quick-start query if needed

### UI components needed:
- Timer display (inline in QuickCardioScreen, no new component)
- RPEStepper: reusable ± stepper for RPE 1-10
- ActivityCard: small card with icon + label for horizontal scroll

## Testing

- Unit: calorie formula variations (male/female, with/without height, distance vs MET)
- Unit: QuickCardioScreen timer start/pause/resume
- Integration: create session via quick-start → verify set has correct fields + calories
- Manual: HomeScreen scroll, timer, finish form, save flow

## Future Considerations

- GPS auto-tracking via expo-location
- Background timer when app is backgrounded
- Apple Watch / Wear OS integration for HR-based calories
- Route map display on saved sessions
