# Cardio Activity Types + Calorie Tracking

## Overview

Add exercise category system (strength/cardio/flexibility/other) to support cardio logging with duration/distance/RPE inputs and MET-based calorie tracking per exercise and per workout session.

## Backend Data Model

### Exercise Model — new fields

| Field | Type | Description |
|-------|------|-------------|
| `exercise_category` | enum: `strength`, `cardio`, `flexibility`, `other` | Classifies exercise type |
| `met_value` | float, nullable | MET at moderate effort for cardio exercises; null for strength |

Existing `duration_sec` and `distance_m` on `ExerciseSetResponse`/`ExerciseSetCreate`/`ExerciseSetUpdate` already support cardio — no set-level model changes.

### WorkoutSession — computed field

`calories_burned` → float, computed server-side on response:

```
per_set_calories = exercise.met_value × (coalesce(set.rpe, 5) / 5) × user.weight_kg × (set.duration_sec / 3600)

Null handling: if `met_value`, `weight_kg`, or `duration_sec` is null, set calories = 0 for that set. If RPE is null, default to 5 (moderate effort).
per_exercise_calories = SUM of its sets
session.calories_burned = SUM of all sets
```

Computed on read — no new storage table.

## API Changes

| Endpoint | Change |
|----------|--------|
| `GET /exercises` | Response includes `exercise_category` + `met_value`; new query param `category` for filtering |
| `GET /exercises/filters` | Response includes `categories: string[]` |
| `GET /workout-sessions/{id}` | Response includes `calories_burned: number`; each set includes `calories_burned` for per-exercise breakdown |

## MET Values — Seeding

Populate from Compendium of Physical Activities. Done via Alembic migration:

| Exercise | base_MET |
|----------|----------|
| Running (6 mph) | 9.8 |
| Running (5 mph) | 8.3 |
| Cycling (moderate) | 8.0 |
| Cycling (vigorous) | 10.0 |
| Swimming (moderate) | 8.0 |
| Walking | 3.5 |
| Jump rope | 8.8 |
| Rowing machine | 7.0 |
| Elliptical | 5.0 |
| Stair climber | 9.0 |
| Hiking | 6.0 |
| HIIT (general) | 8.0 |

Strength exercises default to `exercise_category = "strength"`, `met_value = null`.

## Frontend — UI Changes

### ExercisePicker — category tabs

New segmented control at top:
```
[ Strength ] [ Cardio ] [ Flexibility ] [ All ]
```

Strength tab shows existing muscle group grid. Cardio tab shows exercises filtered by `category = "cardio"`, grouped by equipment. Flexibility tab shows `category = "flexibility"` exercises. Search remains across all tabs.

### ActiveWorkoutScreen — cardio input mode

When `exercise.exercise_category = "cardio"`, replace weight/reps input with:

| Field | Input Type |
|-------|------------|
| Duration | mm:ss input |
| Distance | Decimal (km) |
| RPE | 1-10 (existing component) |

Each set row:
```
Set 1  |  [__:__]  |  [__.__ km]  |  [__] RPE
```

Session timer remains — user can tap lap-style to log duration per set.

### WorkoutDraftSet — new fields

Add `duration_sec: number | null` and `distance_m: number | null` to `src/utils/mapping.ts`.

### SessionDetailScreen — calories display

Per-exercise row:
```
Running (3 sets)                    245 kcal
  Set 1 | 10:00 | 2.0 km | RPE 6   85 kcal
```

Session header adds `calories_burned`:
```
Duration: 45min | Volume: 4,500 kg | Calories: 350
```

Hidden when session has zero calories (pure strength).

### API Queries

`useExercisesQuery` — add optional `category` filter param mapping to new backend query param.

## Implementation Order

1. Backend: add `exercise_category` + `met_value` to Exercise model, add migration, compute `calories_burned` in session endpoint
2. Backend: seed MET values for known exercises via migration
3. Orval regenerate
4. Frontend: update `WorkoutDraftSet` with `duration_sec`, `distance_m`
5. Frontend: ExercisePicker category tabs
6. Frontend: ActiveWorkoutScreen cardio input UI
7. Frontend: SessionDetailScreen calorie display
8. Test

## Testing

| Area | Tests |
|------|-------|
| Backend | Category filter on `GET /exercises`, `calories_burned` matches hand-calculation, null met_value excluded from computation |
| Frontend | ExercisePicker renders tabs from category data, cardio exercise shows duration/distance/RPE inputs, session detail displays calories |
| Integration | Log cardio exercise → verify calories on session detail screen |
