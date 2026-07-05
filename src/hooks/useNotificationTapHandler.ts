import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function handleNavigation(
  data: Record<string, unknown>,
  navigation: NavigationProp,
): void {
  const screen = data.screen as string | undefined;
  if (!screen) return;

  switch (screen) {
    case "session": {
      const sessionId = data.sessionId as string | undefined;
      if (sessionId) navigation.navigate("SessionDetail", { id: sessionId });
      break;
    }
    case "template": {
      const templateId = data.templateId as string | undefined;
      if (templateId) navigation.navigate("TemplateBuilder", { id: templateId });
      break;
    }
    case "workout": {
      const templateId = data.templateId as string | undefined;
      if (templateId) navigation.navigate("StartWorkout", { id: templateId });
      break;
    }
    case "mesocycle": {
      const mesocycleId = data.mesocycleId as string | undefined;
      if (mesocycleId) navigation.navigate("MesocycleDetail", { id: mesocycleId });
      break;
    }
    default:
      break;
  }
}

/**
 * Listens for notification taps (foreground, background, killed state)
 * and navigates to the appropriate screen based on deep link data.
 */
export function useNotificationTapHandler(): void {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const foregroundSub = Notifications.addNotificationReceivedListener((event) => {
      const data = event.request.content.data as Record<string, unknown>;
      if (data?.screen) {
        handleNavigation(data, navigation);
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        handleNavigation(data, navigation);
      },
    );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as Record<string, unknown>;
        handleNavigation(data, navigation);
      }
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [navigation]);
}
