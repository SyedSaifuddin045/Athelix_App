import { z } from "zod";

export const workoutTemplateSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const workoutTemplateExerciseSchema = z.object({
  id: z.number(),
  template_id: z.number(),
  exercise_id: z.string(),
  order_index: z.number(),
  target_sets: z.number().nullable(),
  target_reps: z.number().nullable(),
  target_rpe: z.number().nullable(),
  rest_seconds: z.number().nullable(),
  notes: z.string().nullable(),
});

export const workoutTemplateDetailSchema = workoutTemplateSchema.extend({
  exercises: z.array(workoutTemplateExerciseSchema),
});

export const createWorkoutTemplatePayloadSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
});

export const updateWorkoutTemplatePayloadSchema = createWorkoutTemplatePayloadSchema.partial();

export const createWorkoutTemplateExercisePayloadSchema = z.object({
  exercise_id: z.string(),
  order_index: z.number(),
  target_sets: z.number().nullable().optional(),
  target_reps: z.number().nullable().optional(),
  target_rpe: z.number().nullable().optional(),
  rest_seconds: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateWorkoutTemplateExercisePayloadSchema =
  createWorkoutTemplateExercisePayloadSchema.partial();

export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;
export type WorkoutTemplateExercise = z.infer<typeof workoutTemplateExerciseSchema>;
export type WorkoutTemplateDetail = z.infer<typeof workoutTemplateDetailSchema>;
export type CreateWorkoutTemplatePayload = z.infer<typeof createWorkoutTemplatePayloadSchema>;
export type UpdateWorkoutTemplatePayload = z.infer<typeof updateWorkoutTemplatePayloadSchema>;
export type CreateWorkoutTemplateExercisePayload = z.infer<
  typeof createWorkoutTemplateExercisePayloadSchema
>;
export type UpdateWorkoutTemplateExercisePayload = z.infer<
  typeof updateWorkoutTemplateExercisePayloadSchema
>;
