import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@tamagui/core";
import type { RootStackParamList } from "../types/navigation";
import { useAppConfigQuery } from "../api/queries";
import { getApiErrorMessage } from "../api/client";
import { radii } from "../design-system/tokens/radii";
import { spacing } from "../design-system/tokens/spacing";
import { Screen } from "../components/ui/Layout";
import { ProgressBar } from "../components/ui/Indicators";
import { AppIcon } from "../design-system/icons/AppIcon";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Splash"> };

export function SplashScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isLoaded, isSignedIn = false } = useAuth();
  const appConfig = useAppConfigQuery();
  const [fetchTimedOut, setFetchTimedOut] = useState(false);

  useEffect(() => {
    if (!appConfig.isPending) return;
    const timer = setTimeout(() => setFetchTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, [appConfig.isPending]);

  const ready = isLoaded && (!appConfig.isPending || fetchTimedOut);
  const progress = appConfig.isPending && !fetchTimedOut && !isLoaded ? 30 : fetchTimedOut || (!appConfig.isPending && isLoaded) ? 100 : 65;
  const status =
    fetchTimedOut
      ? "Continuing..."
      : appConfig.isPending
        ? "Fetching app config..."
        : !isLoaded
          ? "Restoring session..."
          : isSignedIn
            ? "Ready!"
            : "Sign in to continue";

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      if (isSignedIn) {
        navigation.replace("MainTabs");
      } else {
        const done = await AsyncStorage.getItem("onboarding_complete");
        navigation.replace(done === "true" ? "Login" : "Onboarding");
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [ready, isSignedIn, navigation]);

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";

  return (
    <Screen scroll={false} contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 20 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: radii.card,
          backgroundColor: accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: accent,
          shadowOpacity: 0.28,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        }}
      >
        <AppIcon name="dumbbell" size={42} color="#000000" strokeWidth={2.5} />
      </View>
      <Text
        style={{
          color: textColor,
          fontSize: 32,
          fontWeight: "900",
          marginTop: 28,
        }}
      >
        {appConfig.data?.app_name.replace(/_API$/, "") ?? "Athelix"}
      </Text>
      <Text
        style={{
          color: theme.colorFaint?.get() ?? "rgba(255,255,255,0.35)",
          fontSize: 13,
          marginTop: 6,
        }}
      >
        Your training, elevated.
      </Text>
      <View
        style={{
          width: "100%",
          marginTop: spacing.xl6,
          backgroundColor: theme.surface1?.get(),
          borderWidth: 1,
          borderColor: theme.borderColor?.get(),
          borderRadius: radii.card,
          paddingHorizontal: spacing.xl3,
          paddingVertical: spacing.xl4,
          gap: spacing.xl,
        }}
      >
        <Text
          style={{
            color: accent,
            fontSize: 24,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          {progress}%
        </Text>
        <ProgressBar value={progress} color={accent} height={8} />
        <Text
          style={{
            color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.35)",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          {status}
        </Text>
        {appConfig.isError ? (
          <Text
            style={{
              color: theme.colorRed?.get() ?? "#EF4444",
              fontSize: 12,
            }}
          >
            {getApiErrorMessage(appConfig.error)}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          position: "absolute",
          bottom: spacing.xl6,
          color: theme.colorFaint?.get() ?? "rgba(255,255,255,0.2)",
          fontSize: 11,
        }}
      >
        {appConfig.data
          ? `${appConfig.data.app_name.replace(/_API$/, "")} v${appConfig.data.version}`
          : "Athelix"}
      </Text>
    </Screen>
  );
}
