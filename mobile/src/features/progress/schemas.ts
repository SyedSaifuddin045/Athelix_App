import { z } from "zod";

export const personalRecordSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  exercise_id: z.string(),
  record_type: z.string(),
  value: z.number(),
  achieved_on: z.string(),
  session_id: z.number().nullable(),
  set_id: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
});

export const e1rmFormulaSchema = z.object({
  epley: z.number().nullable(),
  brzycki: z.number().nullable(),
  lombardi: z.number().nullable(),
  oconner: z.number().nullable(),
});

export const exerciseProgressPointSchema = z.object({
  session_id: z.number(),
  performed_at: z.string(),
  best_set_id: z.number().nullable(),
  weight_kg: z.number().nullable(),
  reps: z.number().nullable(),
  default_e1rm: z.number().nullable(),
  formulas: e1rmFormulaSchema,
  volume_load: z.number(),
});

export const weeklyVolumeProgressPointSchema = z.object({
  week_start: z.string(),
  week_end: z.string(),
  volume_load: z.number(),
});

export const progressiveOverloadSchema = z.object({
  current_session_id: z.number(),
  previous_session_id: z.number(),
  performed_at: z.string(),
  current_volume_load: z.number(),
  previous_volume_load: z.number(),
  volume_load_delta: z.number(),
  current_best_weight_kg: z.number().nullable(),
  previous_best_weight_kg: z.number().nullable(),
  best_weight_delta: z.number().nullable(),
  current_default_e1rm: z.number().nullable(),
  previous_default_e1rm: z.number().nullable(),
  default_e1rm_delta: z.number().nullable(),
  improved_metrics: z.array(z.string()),
});

export const progressWorkoutStreaksSchema = z.object({
  current_daily_streak: z.number(),
  longest_daily_streak: z.number(),
  current_weekly_streak: z.number(),
  longest_weekly_streak: z.number(),
});

export const exerciseProgressSchema = z.object({
  exercise_id: z.string(),
  exercise_name: z.string(),
  default_formula: z.string(),
  e1rm_history: z.array(exerciseProgressPointSchema),
  volume_history: z.array(exerciseProgressPointSchema),
  weekly_volume_history: z.array(weeklyVolumeProgressPointSchema),
  progressive_overload: z.array(progressiveOverloadSchema),
  workout_streaks: progressWorkoutStreaksSchema,
});

export type PersonalRecord = z.infer<typeof personalRecordSchema>;
export type E1RMFormula = z.infer<typeof e1rmFormulaSchema>;
export type ExerciseProgressPoint = z.infer<typeof exerciseProgressPointSchema>;
export type WeeklyVolumeProgressPoint = z.infer<typeof weeklyVolumeProgressPointSchema>;
export type ProgressiveOverload = z.infer<typeof progressiveOverloadSchema>;
export type ProgressWorkoutStreaks = z.infer<typeof progressWorkoutStreaksSchema>;
export type ExerciseProgress = z.infer<typeof exerciseProgressSchema>;
