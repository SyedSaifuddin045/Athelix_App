import { api } from "../../lib/api/client";
import {
  createWorkoutTemplateExercisePayloadSchema,
  createWorkoutTemplatePayloadSchema,
  updateWorkoutTemplateExercisePayloadSchema,
  updateWorkoutTemplatePayloadSchema,
  workoutTemplateDetailSchema,
  workoutTemplateExerciseSchema,
  workoutTemplateSchema,
  type CreateWorkoutTemplateExercisePayload,
  type CreateWorkoutTemplatePayload,
  type WorkoutTemplate,
  type WorkoutTemplateDetail,
  type WorkoutTemplateExercise,
  type UpdateWorkoutTemplateExercisePayload,
  type UpdateWorkoutTemplatePayload,
} from "./schemas";

export async function listWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const response = await api.get("/workout-templates");
  return workoutTemplateSchema.array().parse(response.data);
}

export async function getWorkoutTemplateDetail(
  templateId: number,
): Promise<WorkoutTemplateDetail> {
  const response = await api.get(`/workout-templates/${templateId}`);
  return workoutTemplateDetailSchema.parse(response.data);
}

export async function createWorkoutTemplate(
  payload: CreateWorkoutTemplatePayload,
): Promise<WorkoutTemplate> {
  const response = await api.post(
    "/workout-templates",
    createWorkoutTemplatePayloadSchema.parse(payload),
  );
  return workoutTemplateSchema.parse(response.data);
}

export async function updateWorkoutTemplate(
  templateId: number,
  payload: UpdateWorkoutTemplatePayload,
): Promise<WorkoutTemplate> {
  const response = await api.patch(
    `/workout-templates/${templateId}`,
    updateWorkoutTemplatePayloadSchema.parse(payload),
  );
  return workoutTemplateSchema.parse(response.data);
}

export async function deleteWorkoutTemplate(templateId: number): Promise<void> {
  await api.delete(`/workout-templates/${templateId}`);
}

export async function listWorkoutTemplateExercises(
  templateId: number,
): Promise<WorkoutTemplateExercise[]> {
  const response = await api.get(`/workout-templates/${templateId}/exercises`);
  return workoutTemplateExerciseSchema.array().parse(response.data);
}

export async function createWorkoutTemplateExercise(
  templateId: number,
  payload: CreateWorkoutTemplateExercisePayload,
): Promise<WorkoutTemplateExercise> {
  const response = await api.post(
    `/workout-templates/${templateId}/exercises`,
    createWorkoutTemplateExercisePayloadSchema.parse(payload),
  );
  return workoutTemplateExerciseSchema.parse(response.data);
}

export async function updateWorkoutTemplateExercise(
  templateId: number,
  templateExerciseId: number,
  payload: UpdateWorkoutTemplateExercisePayload,
): Promise<WorkoutTemplateExercise> {
  const response = await api.patch(
    `/workout-templates/${templateId}/exercises/${templateExerciseId}`,
    updateWorkoutTemplateExercisePayloadSchema.parse(payload),
  );
  return workoutTemplateExerciseSchema.parse(response.data);
}

export async function deleteWorkoutTemplateExercise(
  templateId: number,
  templateExerciseId: number,
): Promise<void> {
  await api.delete(`/workout-templates/${templateId}/exercises/${templateExerciseId}`);
}
