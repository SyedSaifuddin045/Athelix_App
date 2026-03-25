import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";
import { Screen, ProgressBar } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useAuthStore } from "../../store";
import { usePostHog } from "posthog-react-native";

type Props = RootStackScreenProps<"Splash">;

export function SplashScreen({ navigation }: Props): React.JSX.Element {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const { initialize, isAuthenticated, isInitialized } = useAuthStore();
  const posthog = usePostHog();

  useEffect(() => {
    const initApp = async () => {
      try {
        setStatus("Fetching app config...");
        setProgress(20);
        await new Promise((resolve) => setTimeout(resolve, 400));

        setStatus("Restoring session...");
        setProgress(50);
        await initialize();

        if (isAuthenticated) {
          setStatus("Syncing data...");
          setProgress(75);
          await new Promise((resolve) => setTimeout(resolve, 500));

          const user = useAuthStore.getState().user;
          if (user && posthog) {
            posthog.identify(user.email || user.username, {
              email: user.email,
              username: user.username,
            });
          }
        }

        setProgress(100);
        setStatus("Ready!");

        await new Promise((resolve) => setTimeout(resolve, 300));

        if (isAuthenticated) {
          navigation.replace("MainTabs");
        } else {
          navigation.replace("Login");
        }
      } catch {
        setProgress(100);
        setStatus("Ready!");
        await new Promise((resolve) => setTimeout(resolve, 300));
        navigation.replace("Login");
      }
    };

    initApp();
  }, [initialize, isAuthenticated, navigation, posthog]);

  return (
    <Screen glowColor="rgba(0,180,140,0.24)" scroll={false} contentContainerStyle={styles.centeredContent}>
      <View style={styles.splashLogo}>
        <Text style={styles.splashEmoji}>💪</Text>
      </View>
      <Text style={styles.splashTitle}>FitTrack</Text>
      <Text style={styles.splashSubtitle}>Your training, elevated.</Text>
      <View style={styles.splashProgressCard}>
        <Text style={styles.splashProgressValue}>{progress}%</Text>
        <ProgressBar value={progress} color={COLORS.teal} height={8} />
        <Text style={styles.splashStatus}>{status}</Text>
      </View>
      <Text style={styles.splashFooter}>FitTrack Pro v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centeredContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 20 },
  splashLogo: { width: 96, height: 96, borderRadius: 28, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center" },
  splashEmoji: { fontSize: 38 },
  splashTitle: { color: COLORS.text, fontSize: 32, fontWeight: "900", marginTop: 28 },
  splashSubtitle: { color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 6 },
  splashProgressCard: {
    width: "100%",
    marginTop: 28,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 12,
  },
  splashProgressValue: { color: COLORS.teal, fontSize: 24, fontWeight: "800", textAlign: "center" },
  splashStatus: { color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center" },
  splashFooter: { position: "absolute", bottom: 26, color: "rgba(255,255,255,0.2)", fontSize: 11 },
});
