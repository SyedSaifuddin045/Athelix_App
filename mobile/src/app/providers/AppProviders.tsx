import React, { useEffect, useRef } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import { replayQueuedWorkoutActions } from "../../features/workouts/queue";
import { AuthProvider, useAuth } from "./AuthProvider";

function ConnectivityBridge(): null {
  const { status } = useAuth();
  const replayingRef = useRef(false);

  useEffect(() => {
    const replayIfPossible = async (): Promise<void> => {
      if (status !== "authenticated" || replayingRef.current) {
        return;
      }

      replayingRef.current = true;
      try {
        await replayQueuedWorkoutActions(queryClient);
      } finally {
        replayingRef.current = false;
      }
    };

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && (state.isInternetReachable ?? true));
      onlineManager.setOnline(isOnline);

      if (isOnline) {
        void replayIfPossible();
      }
    });

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void replayIfPossible();
      }
    });

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [status]);

  return null;
}

export function AppProviders({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConnectivityBridge />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
