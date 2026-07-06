import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import type { NavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";

function handleNavigation(
  data: Record<string, unknown>,
  navigate: (screen: string, params?: Record<string, string>) => void,
): void {
  const screen = data.screen as string | undefined;
  if (!screen) return;

  switch (screen) {
    case "session": {
      const sessionId = data.sessionId as string | undefined;
      if (sessionId) navigate("SessionDetail", { id: sessionId });
      break;
    }
    case "template": {
      const templateId = data.templateId as string | undefined;
      if (templateId) navigate("TemplateBuilder", { id: templateId });
      break;
    }
    case "workout": {
      const templateId = data.templateId as string | undefined;
      if (templateId) navigate("StartWorkout", { id: templateId });
      break;
    }
    case "mesocycle": {
      const mesocycleId = data.mesocycleId as string | undefined;
      if (mesocycleId) navigate("MesocycleDetail", { id: mesocycleId });
      break;
    }
    default:
      break;
  }
}

/**
 * Listens for notification taps (foreground, background, killed state)
 * and navigates to the appropriate screen based on deep link data.
 *
 * Uses navigation ref directly instead of useNavigation() to avoid
 * context timing issues with native-stack on Android.
 */
export function useNotificationTapHandler(
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>,
): void {
  useEffect(() => {
    const navigate: (screen: string, params?: Record<string, string>) => void = (
      screen,
      params,
    ) => {
      (navigationRef.current as any)?.navigate(screen, params);
    };

    const foregroundSub = Notifications.addNotificationReceivedListener((event) => {
      const data = event.request.content.data as Record<string, unknown>;
      if (data?.screen) {
        handleNavigation(data, navigate);
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        handleNavigation(data, navigate);
      },
    );

    // Use setTimeout to ensure navigationRef is populated before checking
    const timer = setTimeout(() => {
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          const data = response.notification.request.content.data as Record<string, unknown>;
          handleNavigation(data, navigate);
        }
      });
    }, 0);

    return () => {
      foregroundSub.remove();
      responseSub.remove();
      clearTimeout(timer);
    };
  }, [navigationRef]);
}
