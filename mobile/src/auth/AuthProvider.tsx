import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-react-native";

import { getApiErrorMessage, setUnauthorizedHandler } from "../api/client";
import { loginUserAuthLoginPost, refreshTokensAuthRefreshPost, registerUserAuthRegisterPost } from "../api/endpoints/auth/auth";
import { getCurrentUserOverviewUsersMeOverviewGet } from "../api/endpoints/users/users";
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from "../api/model";
import { queryKeys } from "../api/queryKeys";
import { clearAuthTokens, getRefreshToken, persistAuthTokens, restoreAccessExpiry } from "../api/tokenStore";
import { Events } from "../analytics/events";

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
  const posthog = usePostHog();
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
    posthog.capture(Events.USER_LOGGED_OUT);
    posthog.reset();
    await clearAuthTokens();
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }, [posthog, queryClient]);

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
          const userData = overview.data.user;
          setUser(userData);
          setStatus("authenticated");
          setError(null);
          queryClient.setQueryData(queryKeys.overview, overview.data);
          queryClient.setQueryData(queryKeys.authMe, userData);
          posthog.identify(String(userData.id), {
            $set: { email: userData.email, username: userData.username },
          });
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
      posthog.identify(String(response.data.user.id), {
        $set: { email: response.data.user.email, username: response.data.user.username },
      });
      posthog.capture(Events.USER_LOGGED_IN);
    },
    [applyAuth, posthog],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await registerUserAuthRegisterPost(payload);
      if (!isAuthSuccess(response)) throw new Error("Registration failed");
      await applyAuth(response.data);
      posthog.identify(String(response.data.user.id), {
        $set: { email: response.data.user.email, username: response.data.user.username },
        $set_once: { first_seen: new Date().toISOString() },
      });
      posthog.capture(Events.USER_SIGNED_UP, { email: response.data.user.email });
    },
    [applyAuth, posthog],
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
