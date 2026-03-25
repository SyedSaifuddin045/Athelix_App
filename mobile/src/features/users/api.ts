import { z } from "zod";
import { api } from "../../lib/api/client";
import { isApiError } from "../../lib/api/error";
import { personalRecordSchema } from "../progress/schemas";
import {
  bodyWeightLogSchema,
  userOverviewStatsSchema,
  userProfileSchema,
  userSchema,
  workoutStreaksSchema,
  type User,
  type UserProfile,
} from "./schemas";
import { workoutSessionSchema } from "../workouts/schemas";

const mesocycleSummarySchema = z.object({
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

export const userOverviewSchema = z.object({
  user: userSchema,
  has_profile: z.boolean(),
  profile: userProfileSchema.nullable(),
  latest_body_weight_log: bodyWeightLogSchema.nullable(),
  active_mesocycle: mesocycleSummarySchema.nullable(),
  latest_completed_session: workoutSessionSchema.nullable(),
  recent_personal_records: z.array(personalRecordSchema),
  workout_streaks: workoutStreaksSchema,
  stats: userOverviewStatsSchema,
});

const profilePayloadSchema = z.object({
  display_name: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  height_cm: z.number().nullable().optional(),
  weight_kg: z.number().nullable().optional(),
  fitness_level: z.string().nullable().optional(),
  preferred_unit: z.string().nullable().optional(),
});

const userUpdatePayloadSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
});

const bodyWeightLogPayloadSchema = z.object({
  weight_kg: z.number().positive(),
  logged_at: z.string(),
  notes: z.string().nullable().optional(),
});

const bodyWeightLogUpdatePayloadSchema = bodyWeightLogPayloadSchema.partial();

export type UserOverview = z.infer<typeof userOverviewSchema>;
export type UpsertProfilePayload = z.infer<typeof profilePayloadSchema>;
export type UpdateCurrentUserPayload = z.infer<typeof userUpdatePayloadSchema>;
export type CreateBodyWeightLogPayload = z.infer<typeof bodyWeightLogPayloadSchema>;
export type UpdateBodyWeightLogPayload = z.infer<typeof bodyWeightLogUpdatePayloadSchema>;

export async function getCurrentUser(): Promise<User> {
  const response = await api.get("/users/me");
  return userSchema.parse(response.data);
}

export async function getCurrentUserOverview(): Promise<UserOverview> {
  const response = await api.get("/users/me/overview");
  return userOverviewSchema.parse(response.data);
}

export async function updateCurrentUser(
  payload: UpdateCurrentUserPayload,
): Promise<User> {
  const response = await api.patch("/users/me", userUpdatePayloadSchema.parse(payload));
  return userSchema.parse(response.data);
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await api.get("/users/me/profile");
    return userProfileSchema.parse(response.data);
  } catch (error) {
    if (isApiError(error) && error.statusCode === 404) {
      return null;
    }

    throw error;
  }
}

export async function upsertCurrentUserProfile(
  payload: UpsertProfilePayload,
): Promise<UserProfile> {
  const response = await api.put("/users/me/profile", profilePayloadSchema.parse(payload));
  return userProfileSchema.parse(response.data);
}

export async function listBodyWeightLogs() {
  const response = await api.get("/users/me/body-weight-logs");
  return bodyWeightLogSchema.array().parse(response.data);
}

export async function createBodyWeightLog(
  payload: CreateBodyWeightLogPayload,
) {
  const response = await api.post(
    "/users/me/body-weight-logs",
    bodyWeightLogPayloadSchema.parse(payload),
  );
  return bodyWeightLogSchema.parse(response.data);
}

export async function updateBodyWeightLog(
  logId: number,
  payload: UpdateBodyWeightLogPayload,
) {
  const response = await api.patch(
    `/users/me/body-weight-logs/${logId}`,
    bodyWeightLogUpdatePayloadSchema.parse(payload),
  );
  return bodyWeightLogSchema.parse(response.data);
}

export async function deleteBodyWeightLog(logId: number): Promise<void> {
  await api.delete(`/users/me/body-weight-logs/${logId}`);
}
