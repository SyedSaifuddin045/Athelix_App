import { api } from "../../lib/api/client";
import {
  authResponseSchema,
  loginPayloadSchema,
  refreshPayloadSchema,
  registerPayloadSchema,
  type AuthResponse,
  type LoginPayload,
  type RefreshPayload,
  type RegisterPayload,
} from "./schemas";
import { userSchema, type User } from "../users/schemas";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await api.post("/auth/login", loginPayloadSchema.parse(payload));
  return authResponseSchema.parse(response.data);
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await api.post("/auth/register", registerPayloadSchema.parse(payload));
  return authResponseSchema.parse(response.data);
}

export async function refreshSession(payload: RefreshPayload): Promise<AuthResponse> {
  const response = await api.post("/auth/refresh", refreshPayloadSchema.parse(payload));
  return authResponseSchema.parse(response.data);
}

export async function getAuthMe(): Promise<User> {
  const response = await api.get("/auth/me");
  return userSchema.parse(response.data);
}
