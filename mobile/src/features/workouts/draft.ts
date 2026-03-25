import type { ExerciseDetail } from "../exercises/schemas";
import type { WorkoutTemplateDetail } from "../templates/schemas";
import type { QueuedWorkoutAction } from "./queue";
import type { WorkoutSessionDetail } from "./schemas";

export interface DraftWorkoutSet {
  key: string;
  serverId?: number;
  setNumber: number;
  setType: string;
  reps: string;
  weightKg: string;
  rpe: string;
  done: boolean;
  pending: boolean;
  queueActionId?: string;
}

export interface DraftWorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  equipment?: string | null;
  target?: string | null;
  sets: DraftWorkoutSet[];
}

function getExerciseLabel(
  exerciseId: string,
  exerciseMap: Record<string, ExerciseDetail | undefined>,
): string {
  return exerciseMap[exerciseId]?.name ?? `Exercise ${exerciseId}`;
}

function getExerciseMeta(
  exerciseId: string,
  exerciseMap: Record<string, ExerciseDetail | undefined>,
): Pick<DraftWorkoutExercise, "equipment" | "target"> {
  return {
    equipment: exerciseMap[exerciseId]?.equipment ?? null,
    target: exerciseMap[exerciseId]?.target ?? exerciseMap[exerciseId]?.body_part ?? null,
  };
}

function serializeNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return `${value}`;
}

function applyQueuedSetUpdate(
  draftSet: DraftWorkoutSet,
  payload: Record<string, unknown>,
  queueActionId: string,
): DraftWorkoutSet {
  return {
    ...draftSet,
    setType:
      typeof payload.set_type === "string" ? payload.set_type : draftSet.setType,
    reps:
      "reps" in payload
        ? serializeNumber(payload.reps as number | null | undefined)
        : draftSet.reps,
    weightKg:
      "weight_kg" in payload
        ? serializeNumber(payload.weight_kg as number | null | undefined)
        : draftSet.weightKg,
    rpe:
      "rpe" in payload
        ? serializeNumber(payload.rpe as number | null | undefined)
        : draftSet.rpe,
    done: true,
    pending: true,
    queueActionId,
  };
}

function buildSetKey(
  exerciseId: string,
  setNumber: number,
  serverId?: number,
): string {
  if (serverId !== undefined) {
    return `server-${serverId}`;
  }

  return `draft-${exerciseId}-${setNumber}`;
}

export function buildDraftWorkoutExercises(
  session: WorkoutSessionDetail,
  exerciseMap: Record<string, ExerciseDetail | undefined>,
  template?: WorkoutTemplateDetail,
  queuedActions: QueuedWorkoutAction[] = [],
): DraftWorkoutExercise[] {
  const exerciseOrder = new Map<string, DraftWorkoutExercise>();

  for (const set of session.sets) {
    const exercise = exerciseOrder.get(set.exercise_id) ?? {
      exerciseId: set.exercise_id,
      exerciseName: getExerciseLabel(set.exercise_id, exerciseMap),
      ...getExerciseMeta(set.exercise_id, exerciseMap),
      sets: [],
    };

    exercise.sets.push({
      key: buildSetKey(set.exercise_id, set.set_number, set.id),
      serverId: set.id,
      setNumber: set.set_number,
      setType: set.set_type,
      reps: serializeNumber(set.reps),
      weightKg: serializeNumber(set.weight_kg),
      rpe: serializeNumber(set.rpe),
      done: true,
      pending: false,
    });

    exerciseOrder.set(set.exercise_id, exercise);
  }

  if (template) {
    const sortedExercises = [...template.exercises].sort(
      (left, right) => left.order_index - right.order_index,
    );

    for (const templateExercise of sortedExercises) {
      const existingExercise = exerciseOrder.get(templateExercise.exercise_id) ?? {
        exerciseId: templateExercise.exercise_id,
        exerciseName: getExerciseLabel(templateExercise.exercise_id, exerciseMap),
        ...getExerciseMeta(templateExercise.exercise_id, exerciseMap),
        sets: [],
      };

      const existingSetCount = existingExercise.sets.length;
      const plannedSetCount = templateExercise.target_sets ?? 1;

      for (let index = existingSetCount; index < plannedSetCount; index += 1) {
        existingExercise.sets.push({
          key: buildSetKey(templateExercise.exercise_id, index + 1),
          setNumber: index + 1,
          setType: "working",
          reps: serializeNumber(templateExercise.target_reps),
          weightKg: "",
          rpe: serializeNumber(templateExercise.target_rpe),
          done: false,
          pending: false,
        });
      }

      exerciseOrder.set(templateExercise.exercise_id, existingExercise);
    }
  }

  for (const action of queuedActions) {
    if (action.type === "createSet") {
      const exercise = exerciseOrder.get(action.payload.exercise_id) ?? {
        exerciseId: action.payload.exercise_id,
        exerciseName: getExerciseLabel(action.payload.exercise_id, exerciseMap),
        ...getExerciseMeta(action.payload.exercise_id, exerciseMap),
        sets: [],
      };

      const existingIndex = exercise.sets.findIndex((item) => item.key === action.tempKey);
      const queuedSet: DraftWorkoutSet = {
        key: action.tempKey,
        setNumber: action.payload.set_number,
        setType: action.payload.set_type,
        reps: serializeNumber(action.payload.reps),
        weightKg: serializeNumber(action.payload.weight_kg),
        rpe: serializeNumber(action.payload.rpe),
        done: true,
        pending: true,
        queueActionId: action.id,
      };

      if (existingIndex >= 0) {
        exercise.sets[existingIndex] = queuedSet;
      } else {
        exercise.sets.push(queuedSet);
      }

      exerciseOrder.set(action.payload.exercise_id, exercise);
      continue;
    }

    if (action.type === "updateSet") {
      for (const exercise of exerciseOrder.values()) {
        const setIndex = exercise.sets.findIndex((item) => item.serverId === action.setId);
        if (setIndex >= 0) {
          exercise.sets[setIndex] = applyQueuedSetUpdate(
            exercise.sets[setIndex],
            action.payload,
            action.id,
          );
          break;
        }
      }
      continue;
    }

    if (action.type === "deleteSet") {
      for (const exercise of exerciseOrder.values()) {
        exercise.sets = exercise.sets.filter((item) => {
          if (item.serverId === action.setId) {
            return false;
          }

          if (action.tempKey && item.key === action.tempKey) {
            return false;
          }

          return true;
        });
      }
    }
  }

  return [...exerciseOrder.values()].map((exercise) => ({
    ...exercise,
    sets: [...exercise.sets].sort((left, right) => left.setNumber - right.setNumber),
  }));
}
