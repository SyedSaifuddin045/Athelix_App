import { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useAuth } from "@clerk/expo";

import { registerForPushNotifications } from "../utils/notifications";
import { apiFetch } from "../api/client";

async function registerDeviceToken(token: string): Promise<void> {
  try {
    await apiFetch("/devices/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: Platform.OS,
        push_token: token,
        device_name: Platform.OS === "android" ? "Android" : "iOS",
        app_version: undefined,
      }),
    });
  } catch {
    // Silently fail — token will be re-registered on next app launch
  }
}

async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    await apiFetch("/devices/unregister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ push_token: token }),
    });
  } catch {
    // Best-effort
  }
}

/**
 * Registers push notification permission + device token once Clerk is ready.
 * Handles token refresh events from expo-notifications.
 */
export function useNotificationRegistration(): void {
  const { isLoaded, isSignedIn } = useAuth();
  const tokenRef = useRef<string | null>(null);

  const register = useCallback(async () => {
    const { granted, token } = await registerForPushNotifications();
    if (!granted || !token) return;

    tokenRef.current = token;
    await registerDeviceToken(token);
  }, []);

  // Register once Clerk confirms signed-in session
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    register();
  }, [isLoaded, isSignedIn, register]);

  // Listen for token refresh (independent of auth state)
  useEffect(() => {
    const sub = Notifications.addPushTokenListener(async (tokenData) => {
      const newToken = tokenData.data;
      if (newToken && newToken !== tokenRef.current) {
        if (tokenRef.current) {
          await unregisterDeviceToken(tokenRef.current);
        }
        tokenRef.current = newToken;
        await registerDeviceToken(newToken);
      }
    });

    return () => sub.remove();
  }, []);
}
