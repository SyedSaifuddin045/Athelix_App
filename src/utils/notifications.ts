import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_TOKEN_KEY = "expo_push_token";

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** Request OS notification permission. Shows system dialog on first call. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF5A36",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return true;
    // Already denied → can't re-prompt on iOS, must go to Settings
    if (existingStatus === "denied") return false;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === "granted";
  } catch {
    return false;
  }
}

/** Get or refresh the Expo push token. Can fail if APNs not ready. */
export async function getPushToken(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export async function getSavedPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Register for push notifications: request permission + fetch token.
 *  Permission success is the gate — token fetch failure still returns granted. */
export async function registerForPushNotifications(): Promise<{ granted: boolean; token: string | null }> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    return { granted: false, token: null };
  }
  const token = await getPushToken();
  return { granted: true, token };
}
