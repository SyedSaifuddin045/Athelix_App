import { z } from "zod";

export const appConfigSchema = z.object({
  app_name: z.string(),
  version: z.string(),
  environment: z.string(),
  auth: z.object({
    token_type: z.string(),
    access_token_expires_in: z.number(),
    refresh_token_expires_in: z.number(),
  }),
  docs: z.object({
    docs_url: z.string().nullable(),
    redoc_url: z.string().nullable(),
    openapi_url: z.string().nullable(),
  }),
  features: z.object({
    auth: z.boolean(),
    user_profiles: z.boolean(),
    body_weight_tracking: z.boolean(),
    exercises: z.boolean(),
    workout_templates: z.boolean(),
    workout_sessions: z.boolean(),
    personal_records: z.boolean(),
    progress_tracking: z.boolean(),
    mesocycles: z.boolean(),
    deload_suggestions: z.boolean(),
    muscle_balance_reports: z.boolean(),
  }),
  supported_values: z.object({
    e1rm_formulas: z.array(z.string()),
    personal_record_types: z.array(z.string()),
    mesocycle_goals: z.array(z.string()),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
