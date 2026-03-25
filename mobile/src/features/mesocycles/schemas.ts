import { z } from "zod";
import { muscleBalanceReportSchema } from "../analytics/schemas";
import { workoutSessionSchema } from "../workouts/schemas";

export const mesocycleSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  goal: z.string().nullable(),
  started_on: z.string(),
  ended_on: z.string().nullable(),
  weeks: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
});

export const mesocycleDetailSchema = mesocycleSchema.extend({
  sessions: z.array(workoutSessionSchema),
});

export const mesocycleCreatePayloadSchema = z.object({
  name: z.string().min(1),
  goal: z.string().nullable().optional(),
  started_on: z.string(),
  ended_on: z.string().nullable().optional(),
  weeks: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const mesocycleUpdatePayloadSchema = mesocycleCreatePayloadSchema.partial();

export const weeklyEffortSchema = z.object({
  week_start: z.string(),
  week_end: z.string(),
  average_rpe: z.number(),
  session_count: z.number(),
  exceeded_threshold: z.boolean(),
});

export const deloadSuggestionSchema = z.object({
  is_recommended: z.boolean(),
  threshold: z.number(),
  minimum_consecutive_weeks: z.number(),
  current_consecutive_high_weeks: z.number(),
  longest_consecutive_high_weeks: z.number(),
  weekly_average_rpe: z.array(weeklyEffortSchema),
});

export const trainingBlockSummarySchema = z.object({
  completed_sessions: z.number(),
  total_sets: z.number(),
  distinct_exercises: z.number(),
  total_volume_load: z.number(),
  average_session_volume_load: z.number(),
  average_session_rpe: z.number().nullable(),
});

export const trainingBlockDeltaSchema = z.object({
  completed_sessions_delta: z.number(),
  total_sets_delta: z.number(),
  distinct_exercises_delta: z.number(),
  total_volume_load_delta: z.number(),
  average_session_volume_load_delta: z.number(),
  average_session_rpe_delta: z.number().nullable(),
});

export const exerciseBlockComparisonSchema = z.object({
  exercise_id: z.string(),
  exercise_name: z.string(),
  current_completed_sets: z.number(),
  previous_completed_sets: z.number(),
  completed_sets_delta: z.number(),
  current_total_volume_load: z.number(),
  previous_total_volume_load: z.number(),
  total_volume_load_delta: z.number(),
  current_best_e1rm: z.number().nullable(),
  previous_best_e1rm: z.number().nullable(),
  best_e1rm_delta: z.number().nullable(),
});

export const mesocycleAnalyticsSchema = z.object({
  mesocycle: mesocycleSchema,
  previous_mesocycle: mesocycleSchema.nullable(),
  current_block_summary: trainingBlockSummarySchema,
  previous_block_summary: trainingBlockSummarySchema.nullable(),
  comparison_to_previous: trainingBlockDeltaSchema.nullable(),
  deload_suggestion: deloadSuggestionSchema,
  exercise_comparisons: z.array(exerciseBlockComparisonSchema),
  muscle_balance: muscleBalanceReportSchema,
});

export type Mesocycle = z.infer<typeof mesocycleSchema>;
export type MesocycleDetail = z.infer<typeof mesocycleDetailSchema>;
export type CreateMesocyclePayload = z.infer<typeof mesocycleCreatePayloadSchema>;
export type UpdateMesocyclePayload = z.infer<typeof mesocycleUpdatePayloadSchema>;
export type WeeklyEffort = z.infer<typeof weeklyEffortSchema>;
export type DeloadSuggestion = z.infer<typeof deloadSuggestionSchema>;
export type TrainingBlockSummary = z.infer<typeof trainingBlockSummarySchema>;
export type TrainingBlockDelta = z.infer<typeof trainingBlockDeltaSchema>;
export type ExerciseBlockComparison = z.infer<typeof exerciseBlockComparisonSchema>;
export type MesocycleAnalytics = z.infer<typeof mesocycleAnalyticsSchema>;
