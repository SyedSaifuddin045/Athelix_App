import { apiClient } from "../client";
import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  User,
  UserOverview,
  UserProfile,
  AppConfig,
  BodyWeightLog,
} from "../types";
import type { PaginationParams } from "../types/base";

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async refresh(data: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/refresh", data);
    return response.data;
  },

  async me(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },
};

export const metaService = {
  async getAppConfig(): Promise<AppConfig> {
    const response = await apiClient.get<AppConfig>("/meta/app-config");
    return response.data;
  },
};

export const userService = {
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>("/users/me");
    return response.data;
  },

  async updateMe(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>("/users/me", data);
    return response.data;
  },

  async getOverview(): Promise<UserOverview> {
    const response = await apiClient.get<UserOverview>("/users/me/overview");
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>("/users/me/profile");
    return response.data;
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>("/users/me/profile", data);
    return response.data;
  },

  async getBodyWeightLogs(params?: PaginationParams): Promise<{
    data: BodyWeightLog[];
    total: number;
  }> {
    const response = await apiClient.get<{ data: BodyWeightLog[]; total: number }>(
      "/users/me/body-weight-logs",
      { params }
    );
    return response.data;
  },

  async createBodyWeightLog(data: { weight: number; note?: string }): Promise<BodyWeightLog> {
    const response = await apiClient.post<BodyWeightLog>("/users/me/body-weight-logs", data);
    return response.data;
  },

  async updateBodyWeightLog(
    logId: string,
    data: { weight?: number; note?: string }
  ): Promise<BodyWeightLog> {
    const response = await apiClient.patch<BodyWeightLog>(
      `/users/me/body-weight-logs/${logId}`,
      data
    );
    return response.data;
  },

  async deleteBodyWeightLog(logId: string): Promise<void> {
    await apiClient.delete(`/users/me/body-weight-logs/${logId}`);
  },
};
