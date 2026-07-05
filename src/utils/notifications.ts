import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

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
    if (existingStatus === "denied") return false;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return status === "granted";
  } catch {
    return false;
  }
}

/** Get the raw platform push token (FCM on Android, APNs on iOS).
 *  Uses getDevicePushTokenAsync() for direct FCM/APNs tokens
 *  instead of Expo push tokens. */
export async function getDevicePushToken(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}

/** Register for push notifications: request permission + fetch raw device token. */
export async function registerForPushNotifications(): Promise<{
  granted: boolean;
  token: string | null;
}> {
  const granted = await requestNotificationPermission();
  if (!granted) return { granted: false, token: null };
  const token = await getDevicePushToken();
  return { granted: true, token };
}
