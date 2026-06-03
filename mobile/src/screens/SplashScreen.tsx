import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { useAppConfigQuery } from "../api/queries";
import { getApiErrorMessage } from "../api/client";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { ProgressBar } from "../components/ui/Indicators";

function SplashScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const appConfig = useAppConfigQuery();
  const progress = appConfig.isPending || auth.status === "loading" ? 65 : 100;
  const status =
    appConfig.isPending
      ? "Fetching app config..."
      : auth.status === "loading"
        ? "Restoring session..."
        : auth.status === "authenticated"
          ? "Ready!"
          : "Sign in to continue";

  useEffect(() => {
    if (appConfig.isPending || auth.status === "loading") return;
    const timer = setTimeout(() => {
      navigation.replace(auth.status === "authenticated" ? "MainTabs" : "Login");
    }, 450);
    return () => clearTimeout(timer);
  }, [appConfig.isPending, auth.status, navigation]);

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
        {appConfig.isError || auth.error ? (
          <Text style={styles.errorText}>{appConfig.isError ? getApiErrorMessage(appConfig.error) : auth.error}</Text>
        ) : null}
      </View>
      <Text style={styles.splashFooter}>{appConfig.data ? `${appConfig.data.app_name.replace(/_API$/, "")} v${appConfig.data.version}` : "Athelix"}</Text>
    </Screen>
  );
}

export default SplashScreen;
