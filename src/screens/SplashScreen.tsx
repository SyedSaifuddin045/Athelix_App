import { useEffect } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAppConfigQuery } from "../api/queries";
import { getApiErrorMessage } from "../api/client";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS, SHADOWS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { ProgressBar } from "../components/ui/Indicators";
import { Icon } from "../components/ui/Icon";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Splash"> };

export function SplashScreen({ navigation }: Props) {
  const { isLoaded, isSignedIn = false } = useAuth();
  const appConfig = useAppConfigQuery();
  const progress = appConfig.isPending || !isLoaded ? 65 : 100;
  const status =
    appConfig.isPending
      ? "Fetching app config..."
      : !isLoaded
        ? "Restoring session..."
        : isSignedIn
          ? "Ready!"
          : "Sign in to continue";

  useEffect(() => {
    if (appConfig.isPending || !isLoaded) return;
    const timer = setTimeout(() => {
      navigation.replace(isSignedIn ? "MainTabs" : "Login");
    }, 450);
    return () => clearTimeout(timer);
  }, [appConfig.isPending, isLoaded, isSignedIn, navigation]);

  return (
    <Screen scroll={false} contentContainerStyle={styles.centeredContent}>
      <View
        style={[
          styles.splashLogo,
          SHADOWS.glow(COLORS.teal),
          {
            width: 96,
            height: 96,
            borderRadius: RADIUS.card,
            backgroundColor: COLORS.teal,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Icon name="dumbbell" size={42} color="#000000" strokeWidth={2.5} />
      </View>
      <Text style={styles.splashTitle}>
        {appConfig.data?.app_name.replace(/_API$/, "") ?? "Athelix"}
      </Text>
      <Text style={styles.splashSubtitle}>Your training, elevated.</Text>
      <View
        style={[
          styles.splashProgressCard,
          {
            width: "100%",
            marginTop: SPACING.xl6,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: RADIUS.card,
            paddingHorizontal: SPACING.xl3,
            paddingVertical: SPACING.xl4,
            gap: SPACING.xl,
          },
        ]}
      >
        <Text style={[styles.splashProgressValue, { color: COLORS.teal }]}>
          {progress}%
        </Text>
        <ProgressBar value={progress} color={COLORS.teal} height={8} />
        <Text style={[styles.splashStatus, { color: COLORS.muted }]}>{status}</Text>
        {appConfig.isError ? (
          <Text style={[styles.errorText, { color: COLORS.red }]}>
            {getApiErrorMessage(appConfig.error)}
          </Text>
        ) : null}
      </View>
      <Text
        style={[
          styles.splashFooter,
          {
            position: "absolute",
            bottom: SPACING.xl6,
            color: COLORS.faint,
            fontSize: 11,
          },
        ]}
      >
        {appConfig.data
          ? `${appConfig.data.app_name.replace(/_API$/, "")} v${appConfig.data.version}`
          : "Athelix"}
      </Text>
    </Screen>
  );
}
