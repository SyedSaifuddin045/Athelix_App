import { create } from "zustand";
import type { User, AppConfig } from "../../api/types";
import { authService, metaService } from "../../api/services";
import { secureStorage } from "../../utils/secureStorage";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  appConfig: AppConfig | null;
  error: string | null;

  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  appConfig: null,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });

    try {
      const config = await metaService.getAppConfig();
      set({ appConfig: config });

      const hasTokens = await secureStorage.hasTokens();
      if (hasTokens) {
        try {
          const user = await authService.me();
          set({ user, isAuthenticated: true });
        } catch {
          const refreshToken = await secureStorage.getRefreshToken();
          if (refreshToken) {
            try {
              const authResponse = await authService.refresh({ refresh_token: refreshToken });
              await secureStorage.setAccessToken(authResponse.access_token);
              await secureStorage.setRefreshToken(authResponse.refresh_token);
              await secureStorage.setUser(authResponse.user);
              set({ user: authResponse.user, isAuthenticated: true });
            } catch {
              await secureStorage.clearAll();
              set({ user: null, isAuthenticated: false });
            }
          }
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const authResponse = await authService.login({ username, password });
      await secureStorage.setAccessToken(authResponse.access_token);
      await secureStorage.setRefreshToken(authResponse.refresh_token);
      await secureStorage.setUser(authResponse.user);
      set({ user: authResponse.user, isAuthenticated: true });
    } catch (error: unknown) {
      const errorMessage = 
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Login failed"
          : "Login failed";
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const authResponse = await authService.register({ username, email, password });
      await secureStorage.setAccessToken(authResponse.access_token);
      await secureStorage.setRefreshToken(authResponse.refresh_token);
      await secureStorage.setUser(authResponse.user);
      set({ user: authResponse.user, isAuthenticated: true });
    } catch (error: unknown) {
      const errorMessage = 
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Registration failed"
          : "Registration failed";
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await secureStorage.clearAll();
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
