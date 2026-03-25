import { z } from "zod";

export const muscleBalanceItemSchema = z.object({
  muscle_group: z.string(),
  completed_sets: z.number(),
  average_weekly_sets: z.number(),
  minimum_weekly_sets: z.number(),
  difference_vs_minimum: z.number(),
  meets_minimum: z.boolean(),
});

export const muscleBalanceReportSchema = z.object({
  weeks_in_scope: z.number(),
  items: z.array(muscleBalanceItemSchema),
});

export type MuscleBalanceItem = z.infer<typeof muscleBalanceItemSchema>;
export type MuscleBalanceReport = z.infer<typeof muscleBalanceReportSchema>;
