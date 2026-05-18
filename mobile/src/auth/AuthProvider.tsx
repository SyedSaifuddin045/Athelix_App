import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage, setUnauthorizedHandler } from "../api/client";
import { loginUserAuthLoginPost, refreshTokensAuthRefreshPost, registerUserAuthRegisterPost } from "../api/endpoints/auth/auth";
import { getCurrentUserOverviewUsersMeOverviewGet } from "../api/endpoints/users/users";
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from "../api/model";
import { queryKeys } from "../api/queryKeys";
import { clearAuthTokens, getRefreshToken, persistAuthTokens, restoreAccessExpiry } from "../api/tokenStore";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: UserResponse | null;
  error: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserResponse | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isAuthSuccess(response: { status: number; data: unknown }): response is { status: 200 | 201; data: AuthResponse } {
  return response.status >= 200 && response.status < 300;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyAuth = useCallback(
    async (auth: AuthResponse) => {
      await persistAuthTokens(auth);
      setUser(auth.user);
      setStatus("authenticated");
      setError(null);
      queryClient.setQueryData(queryKeys.authMe, auth.user);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await clearAuthTokens();
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("loading");
      try {
        await restoreAccessExpiry();
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          if (!cancelled) setStatus("unauthenticated");
          return;
        }

        const refreshed = await refreshTokensAuthRefreshPost({ refresh_token: refreshToken });
        if (!isAuthSuccess(refreshed)) throw new Error("Refresh failed");
        await persistAuthTokens(refreshed.data);
        const overview = await getCurrentUserOverviewUsersMeOverviewGet();
        if (!cancelled) {
          setUser(overview.data.user);
          setStatus("authenticated");
          setError(null);
          queryClient.setQueryData(queryKeys.overview, overview.data);
          queryClient.setQueryData(queryKeys.authMe, overview.data.user);
        }
      } catch (err) {
        await clearAuthTokens();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
          setError(getApiErrorMessage(err));
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await loginUserAuthLoginPost(payload);
      if (!isAuthSuccess(response)) throw new Error("Login failed");
      await applyAuth(response.data);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await registerUserAuthRegisterPost(payload);
      if (!isAuthSuccess(response)) throw new Error("Registration failed");
      await applyAuth(response.data);
    },
    [applyAuth],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout,
      setUser,
    }),
    [error, login, logout, register, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
