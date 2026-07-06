import { useState, useEffect, useCallback, useRef } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RecentNotification {
  id: string;
  title: string;
  body: string;
  receivedAt: Date;
  read: boolean;
}

const STORAGE_KEY = "@athelix/recent-notifications";

/** Unique ID generator. Timestamp prefix prevents collision with cached IDs. */
let idCounter = 0;
function uid(): string {
  return `${Date.now().toString(36)}-${idCounter++}`;
}

function serialize(items: RecentNotification[]): string {
  return JSON.stringify(items);
}

function deserialize(json: string): RecentNotification[] {
  return JSON.parse(json).map(
    (n: Record<string, unknown>): RecentNotification => ({
      id: n.id as string,
      title: n.title as string,
      body: n.body as string,
      receivedAt: new Date(n.receivedAt as string),
      read: n.read as boolean,
    }),
  );
}

/**
 * Tracks push notifications received while the app is in the foreground.
 * Persists the last 20 notifications to AsyncStorage so the list survives
 * app restarts. Hydrates from storage on mount.
 */
export function useRecentNotifications(): {
  notifications: RecentNotification[];
  unreadCount: number;
  clearAll: () => void;
  markRead: (id: string) => void;
} {
  const [notifications, setNotifications] = useState<RecentNotification[]>([]);
  const hydrated = useRef(false);

  // ── Hydrate from AsyncStorage on mount ──
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) setNotifications(deserialize(json));
      hydrated.current = true;
    });
  }, []);

  // ── Persist to AsyncStorage on every change (debounced) ──
  useEffect(() => {
    if (!hydrated.current) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, serialize(notifications));
    }, 500);
    return () => clearTimeout(timer);
  }, [notifications]);

  // ── Live notification listener ──
  useEffect(() => {
    if (typeof Notifications.addNotificationReceivedListener !== "function") return;

    const sub = Notifications.addNotificationReceivedListener((event) => {
      const { title, body } = event.request.content;
      setNotifications((prev) => {
        const next: RecentNotification[] = [
          {
            id: uid(),
            title: title ?? "",
            body: body ?? "",
            receivedAt: new Date(),
            read: false,
          },
          ...prev,
        ];
        return next.slice(0, 20);
      });
    });
    return () => sub.remove();
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    // Also clear storage immediately so shutdown-timing doesn't lose the clear
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, clearAll, markRead };
}
