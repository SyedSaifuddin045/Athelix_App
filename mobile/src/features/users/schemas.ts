import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const userProfileSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  display_name: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  gender: z.string().nullable(),
  height_cm: z.number().nullable(),
  weight_kg: z.number().nullable(),
  fitness_level: z.string().nullable(),
  preferred_unit: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const bodyWeightLogSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  weight_kg: z.number(),
  logged_at: z.string(),
  notes: z.string().nullable(),
});

export const workoutStreaksSchema = z.object({
  current_daily_streak: z.number(),
  longest_daily_streak: z.number(),
  current_weekly_streak: z.number(),
  longest_weekly_streak: z.number(),
});

export const userOverviewStatsSchema = z.object({
  total_workout_templates: z.number(),
  total_sessions: z.number(),
  completed_sessions: z.number(),
  personal_record_count: z.number(),
});

export type User = z.infer<typeof userSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type BodyWeightLog = z.infer<typeof bodyWeightLogSchema>;
export type WorkoutStreaks = z.infer<typeof workoutStreaksSchema>;
export type UserOverviewStats = z.infer<typeof userOverviewStatsSchema>;
