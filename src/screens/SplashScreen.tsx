import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAppConfigQuery } from "../api/queries";
import { getApiErrorMessage } from "../api/client";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { ProgressBar } from "../components/ui/Indicators";

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
      <View style={styles.splashLogo}>
        <Text style={styles.splashEmoji}>💪</Text>
      </View>
      <Text style={styles.splashTitle}>{appConfig.data?.app_name.replace(/_API$/, "") ?? "Athelix"}</Text>
      <Text style={styles.splashSubtitle}>Your training, elevated.</Text>
      <View style={styles.splashProgressCard}>
        <Text style={styles.splashProgressValue}>{progress}%</Text>
        <ProgressBar value={progress} color={COLORS.teal} height={8} />
        <Text style={styles.splashStatus}>{status}</Text>
        {appConfig.isError ? (
          <Text style={styles.errorText}>{getApiErrorMessage(appConfig.error)}</Text>
        ) : null}
      </View>
      <Text style={styles.splashFooter}>{appConfig.data ? `${appConfig.data.app_name.replace(/_API$/, "")} v${appConfig.data.version}` : "Athelix"}</Text>
    </Screen>
  );
}
