import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { queryClient } from "../queryClient";
import { authStorage } from "../../lib/api/authStorage";
import {
  registerAuthLifecycleHandlers,
  setAccessToken,
} from "../../lib/api/client";
import { queryKeys } from "../../lib/api/queryKeys";
import { clearQueuedWorkoutActions } from "../../features/workouts/queue";
import { login, refreshSession, register } from "../../features/auth/api";
import type { AuthResponse, LoginPayload, RegisterPayload } from "../../features/auth/schemas";
import {
  getCurrentUserOverview,
  upsertCurrentUserProfile,
  type UpsertProfilePayload,
  type UserOverview,
} from "../../features/users/api";
import type { User } from "../../features/users/schemas";

type AuthStatus = "idle" | "bootstrapping" | "authenticated" | "unauthenticated";
type AuthDestination = "ProfileSetup" | "MainTabs";

interface AuthContextValue {
  status: AuthStatus;
  bootstrapMessage: string;
  currentUser: User | null;
  hasProfile: boolean | null;
  bootstrap: () => Promise<void>;
  signIn: (payload: LoginPayload) => Promise<AuthDestination>;
  signUp: (payload: RegisterPayload) => Promise<AuthDestination>;
  completeProfile: (payload: UpsertProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function primeUserCaches(overview: UserOverview): void {
  queryClient.setQueryData(queryKeys.users.overview, overview);
  queryClient.setQueryData(queryKeys.users.me, overview.user);
  queryClient.setQueryData(queryKeys.users.profile, overview.profile);
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [bootstrapMessage, setBootstrapMessage] = useState("Initializing...");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const bootstrapStartedRef = useRef(false);

  const applySession = useCallback(async (session: AuthResponse): Promise<void> => {
    setAccessToken(session.access_token);
    await authStorage.setRefreshToken(session.refresh_token);
    setCurrentUser(session.user);
  }, []);

  const loadOverview = useCallback(async (): Promise<UserOverview> => {
    const overview = await getCurrentUserOverview();
    primeUserCaches(overview);
    setCurrentUser(overview.user);
    setHasProfile(overview.has_profile);
    return overview;
  }, []);

  const clearSession = useCallback(async (clearQueryCache: boolean): Promise<void> => {
    setAccessToken(null);
    await authStorage.clearRefreshToken();
    await clearQueuedWorkoutActions();
    setCurrentUser(null);
    setHasProfile(null);

    if (clearQueryCache) {
      queryClient.clear();
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await clearSession(true);
    setStatus("unauthenticated");
  }, [clearSession]);

  const bootstrap = useCallback(async (): Promise<void> => {
    if (bootstrapStartedRef.current) {
      return;
    }

    bootstrapStartedRef.current = true;
    setStatus("bootstrapping");
    setBootstrapMessage("Restoring session...");

    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) {
        setStatus("unauthenticated");
        setBootstrapMessage("Ready");
        return;
      }

      setBootstrapMessage("Refreshing session...");
      const session = await refreshSession({ refresh_token: refreshToken });
      await applySession(session);
      setBootstrapMessage("Syncing overview...");
      await loadOverview();
      setStatus("authenticated");
      setBootstrapMessage("Ready");
    } catch {
      await clearSession(false);
      setStatus("unauthenticated");
      setBootstrapMessage("Ready");
    }
  }, [applySession, clearSession, loadOverview]);

  const signIn = useCallback(
    async (payload: LoginPayload): Promise<AuthDestination> => {
      const session = await login(payload);
      await applySession(session);
      const overview = await loadOverview();
      setStatus("authenticated");
      return overview.has_profile ? "MainTabs" : "ProfileSetup";
    },
    [applySession, loadOverview],
  );

  const signUp = useCallback(
    async (_payload: RegisterPayload): Promise<AuthDestination> => {
      const session = await register(_payload);
      await applySession(session);
      setStatus("authenticated");
      setHasProfile(false);
      queryClient.setQueryData(queryKeys.users.me, session.user);
      return "ProfileSetup";
    },
    [applySession],
  );

  const completeProfile = useCallback(
    async (payload: UpsertProfilePayload): Promise<void> => {
      const profile = await upsertCurrentUserProfile(payload);
      setHasProfile(true);
      queryClient.setQueryData(queryKeys.users.profile, profile);
      await loadOverview();
    },
    [loadOverview],
  );

  useEffect(() => {
    registerAuthLifecycleHandlers({
      onSessionRefresh: async (session) => {
        setCurrentUser(session.user);
        queryClient.setQueryData(queryKeys.users.me, session.user);
      },
      onUnauthorized: async () => {
        await clearSession(true);
        setStatus("unauthenticated");
      },
    });
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      bootstrapMessage,
      currentUser,
      hasProfile,
      bootstrap,
      signIn,
      signUp,
      completeProfile,
      logout,
    }),
    [
      bootstrap,
      bootstrapMessage,
      completeProfile,
      currentUser,
      hasProfile,
      logout,
      signIn,
      signUp,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
