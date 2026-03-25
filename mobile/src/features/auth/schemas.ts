import { z } from "zod";
import { userSchema } from "../users/schemas";

export const loginPayloadSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(8),
});

export const registerPayloadSchema = z.object({
  username: z.string().trim().min(3),
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(8),
});

export const refreshPayloadSchema = z.object({
  refresh_token: z.string().min(1),
});

export const authResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_expires_in: z.number(),
  user: userSchema,
});

export type LoginPayload = z.infer<typeof loginPayloadSchema>;
export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
export type RefreshPayload = z.infer<typeof refreshPayloadSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
