import type {
  ExerciseResponse,
  ExerciseDetailResponse,
  ExerciseSetResponse,
  PersonalRecordResponse,
  WorkoutTemplateDetailResponse,
} from "../api/model";
import type { ExerciseItem, ExerciseDetail, TemplateExercise, WorkoutExercise, WorkoutSet } from "../data";
import { exerciseEmoji, nameForExercise } from "./display";
import { formatKg } from "./format";

export function mapExerciseItem(exercise: ExerciseResponse): ExerciseItem {
  return {
    id: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.target ?? exercise.body_part ?? "Unknown",
    equipment: exercise.equipment ?? "Unknown",
    difficulty: "Intermediate",
    emoji: exerciseEmoji(exercise),
  };
}

export function mapExerciseDetail(exercise: ExerciseDetailResponse): ExerciseDetail {
  return {
    name: exercise.name,
    emoji: exerciseEmoji(exercise),
    primaryMuscle: exercise.target ?? exercise.body_part ?? "Unknown",
    secondaryMuscles: exercise.secondary_muscles.map((item) => item.muscle),
    equipment: exercise.equipment ?? "Unknown",
    difficulty: "Intermediate",
    category: exercise.body_part ?? "Exercise",
    instructions: exercise.instructions
      .slice()
      .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
      .map((item) => item.instruction)
      .filter((item): item is string => !!item),
    tips: [],
  };
}

export function exerciseLookup(items?: ExerciseResponse[]) {
  return new Map((items ?? []).map((item) => [item.id, item]));
}

export function recordValue(record: PersonalRecordResponse) {
  const type = record.record_type.toLowerCase();
  if (type.includes("weight") || type.includes("1rm") || type.includes("e1rm")) return formatKg(record.value);
  return String(Math.round(record.value));
}

type SuccessData<TResponse> = Extract<TResponse, { status: 200 | 201 | 204 }> extends { data: infer TData }
  ? TData
  : never;

export function successData<TResponse extends { status: number; data: unknown }>(
  response: TResponse,
): SuccessData<TResponse> {
  return response.data as SuccessData<TResponse>;
}

export type TemplateDraftExercise = TemplateExercise & {
  exerciseId: string;
  templateExerciseId?: number;
  setCount: number;
};

export type WorkoutDraftSet = WorkoutSet & {
  serverId?: number;
};

export type WorkoutDraftExercise = Omit<WorkoutExercise, "sets"> & {
  exerciseId: string;
  sets: WorkoutDraftSet[];
};

export function templateDraftFromDetail(
  detail: WorkoutTemplateDetailResponse,
  lookup: Map<string, ExerciseResponse>,
): TemplateDraftExercise[] {
  return detail.exercises
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      id: String(item.id),
      templateExerciseId: item.id,
      exerciseId: item.exercise_id,
      name: item.exercise_name ?? nameForExercise(item.exercise_id, lookup),
      emoji: exerciseEmoji(lookup.get(item.exercise_id)),
      notes: item.notes ?? "",
      setCount: Math.max(1, item.target_sets ?? 1),
      sets: [
        {
          reps: item.target_reps ? String(item.target_reps) : "8",
          rpe: item.target_rpe ? String(item.target_rpe) : "7",
          rest: item.rest_seconds ? String(Math.round(item.rest_seconds / 60)) : "2",
        },
      ],
    }));
}

export function workoutDraftFromTemplate(
  detail: WorkoutTemplateDetailResponse,
  lookup: Map<string, ExerciseResponse>,
): WorkoutDraftExercise[] {
  return detail.exercises
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => {
      const totalSets = Math.max(1, item.target_sets ?? 1);
      return {
        id: String(item.id),
        exerciseId: item.exercise_id,
        name: nameForExercise(item.exercise_id, lookup),
        emoji: exerciseEmoji(lookup.get(item.exercise_id)),
        notes: item.notes ?? "",
        sets: Array.from({ length: totalSets }, (_, index) => ({
          id: `${item.id}-${index + 1}`,
          weight: "",
          reps: item.target_reps ? String(item.target_reps) : "8",
          rpe: item.target_rpe ? String(item.target_rpe) : "",
          done: false,
          warmup: false,
        })),
      };
    });
}

export function groupSetsByExercise(
  sets: ExerciseSetResponse[],
  lookup: Map<string, ExerciseResponse>,
) {
  const groups: Record<string, { exerciseId: string; name: string; emoji: string; sets: ExerciseSetResponse[] }> = {};
  sets.forEach((set) => {
    const key = set.exercise_id;
    if (!groups[key]) {
      groups[key] = {
        exerciseId: key,
        name: nameForExercise(key, lookup),
        emoji: exerciseEmoji(lookup.get(key)),
        sets: [],
      };
    }
    groups[key].sets.push(set);
  });
  return Object.values(groups);
}
