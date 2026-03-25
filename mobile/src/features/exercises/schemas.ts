import { z } from "zod";

export const exerciseSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  body_part: z.string().nullable(),
  equipment: z.string().nullable(),
  gif_url: z.string().nullable(),
  target: z.string().nullable(),
});

export const exerciseFiltersSchema = z.object({
  body_parts: z.array(z.string()),
  equipment: z.array(z.string()),
  targets: z.array(z.string()),
});

export const exerciseInstructionSchema = z.object({
  id: z.number(),
  step_number: z.number().nullable(),
  instruction: z.string().nullable(),
});

export const exerciseSecondaryMuscleSchema = z.object({
  id: z.number(),
  muscle: z.string(),
});

export const exerciseDetailSchema = exerciseSummarySchema.extend({
  instructions: z.array(exerciseInstructionSchema),
  secondary_muscles: z.array(exerciseSecondaryMuscleSchema),
});

export const exerciseListSchema = z.object({
  items: z.array(exerciseSummarySchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;
export type ExerciseDetail = z.infer<typeof exerciseDetailSchema>;
export type ExerciseFilters = z.infer<typeof exerciseFiltersSchema>;
export type ExerciseListResponse = z.infer<typeof exerciseListSchema>;
