import { z } from "zod";

export const exerciseSetSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  exercise_id: z.string(),
  set_number: z.number(),
  set_type: z.string(),
  reps: z.number().nullable(),
  weight_kg: z.number().nullable(),
  duration_sec: z.number().nullable(),
  distance_m: z.number().nullable(),
  rpe: z.number().nullable(),
  is_pr: z.boolean(),
  notes: z.string().nullable(),
  logged_at: z.string(),
});

export const workoutSessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  template_id: z.number().nullable(),
  mesocycle_id: z.number().nullable(),
  name: z.string().nullable(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  perceived_exertion: z.number().nullable(),
  mood: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  is_completed: z.boolean(),
});

export const workoutSessionDetailSchema = workoutSessionSchema.extend({
  sets: z.array(exerciseSetSchema),
});

export const createWorkoutSessionPayloadSchema = z.object({
  template_id: z.number().nullable().optional(),
  mesocycle_id: z.number().nullable().optional(),
  name: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  finished_at: z.string().nullable().optional(),
  perceived_exertion: z.number().nullable().optional(),
  mood: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_completed: z.boolean().optional(),
});

export const updateWorkoutSessionPayloadSchema = createWorkoutSessionPayloadSchema.partial();

export const createExerciseSetPayloadSchema = z.object({
  exercise_id: z.string(),
  set_number: z.number(),
  set_type: z.string(),
  reps: z.number().nullable().optional(),
  weight_kg: z.number().nullable().optional(),
  duration_sec: z.number().nullable().optional(),
  distance_m: z.number().nullable().optional(),
  rpe: z.number().nullable().optional(),
  is_pr: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  logged_at: z.string().nullable().optional(),
});

export const updateExerciseSetPayloadSchema = createExerciseSetPayloadSchema.partial();

export type ExerciseSet = z.infer<typeof exerciseSetSchema>;
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
export type WorkoutSessionDetail = z.infer<typeof workoutSessionDetailSchema>;
export type CreateWorkoutSessionPayload = z.infer<typeof createWorkoutSessionPayloadSchema>;
export type UpdateWorkoutSessionPayload = z.infer<typeof updateWorkoutSessionPayloadSchema>;
export type CreateExerciseSetPayload = z.infer<typeof createExerciseSetPayloadSchema>;
export type UpdateExerciseSetPayload = z.infer<typeof updateExerciseSetPayloadSchema>;
