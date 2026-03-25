import { api } from "../../lib/api/client";
import {
  createExerciseSetPayloadSchema,
  createWorkoutSessionPayloadSchema,
  exerciseSetSchema,
  updateExerciseSetPayloadSchema,
  updateWorkoutSessionPayloadSchema,
  workoutSessionDetailSchema,
  workoutSessionSchema,
  type CreateExerciseSetPayload,
  type CreateWorkoutSessionPayload,
  type ExerciseSet,
  type UpdateExerciseSetPayload,
  type UpdateWorkoutSessionPayload,
  type WorkoutSession,
  type WorkoutSessionDetail,
} from "./schemas";

export async function createWorkoutSession(
  payload: CreateWorkoutSessionPayload,
): Promise<WorkoutSession> {
  const response = await api.post(
    "/workout-sessions",
    createWorkoutSessionPayloadSchema.parse(payload),
  );
  return workoutSessionSchema.parse(response.data);
}

export async function getWorkoutSession(
  sessionId: number,
): Promise<WorkoutSessionDetail> {
  const response = await api.get(`/workout-sessions/${sessionId}`);
  return workoutSessionDetailSchema.parse(response.data);
}

export async function listWorkoutSessions(): Promise<WorkoutSession[]> {
  const response = await api.get("/workout-sessions");
  return workoutSessionSchema.array().parse(response.data);
}

export async function updateWorkoutSession(
  sessionId: number,
  payload: UpdateWorkoutSessionPayload,
): Promise<WorkoutSession> {
  const response = await api.patch(
    `/workout-sessions/${sessionId}`,
    updateWorkoutSessionPayloadSchema.parse(payload),
  );
  return workoutSessionSchema.parse(response.data);
}

export async function createExerciseSet(
  sessionId: number,
  payload: CreateExerciseSetPayload,
): Promise<ExerciseSet> {
  const response = await api.post(
    `/workout-sessions/${sessionId}/sets`,
    createExerciseSetPayloadSchema.parse(payload),
  );
  return exerciseSetSchema.parse(response.data);
}

export async function updateExerciseSet(
  sessionId: number,
  setId: number,
  payload: UpdateExerciseSetPayload,
): Promise<ExerciseSet> {
  const response = await api.patch(
    `/workout-sessions/${sessionId}/sets/${setId}`,
    updateExerciseSetPayloadSchema.parse(payload),
  );
  return exerciseSetSchema.parse(response.data);
}

export async function deleteExerciseSet(
  sessionId: number,
  setId: number,
): Promise<void> {
  await api.delete(`/workout-sessions/${sessionId}/sets/${setId}`);
}

export async function deleteWorkoutSession(sessionId: number): Promise<void> {
  await api.delete(`/workout-sessions/${sessionId}`);
}
