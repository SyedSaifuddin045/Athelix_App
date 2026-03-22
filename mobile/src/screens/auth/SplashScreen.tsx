import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";
import { Screen, ProgressBar } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"Splash">;

export function SplashScreen({ navigation }: Props): React.JSX.Element {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const steps = [
      { pct: 20, label: "Fetching app config...", delay: 400 },
      { pct: 50, label: "Restoring session...", delay: 900 },
      { pct: 75, label: "Syncing data...", delay: 1400 },
      { pct: 100, label: "Ready!", delay: 1900 },
    ];

    const timers = steps.map(({ pct, label, delay }) =>
      setTimeout(() => {
        setProgress(pct);
        setStatus(label);
      }, delay)
    );

    const doneTimer = setTimeout(() => {
      navigation.replace("MainTabs");
    }, 2400);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      clearTimeout(doneTimer);
    };
  }, [navigation]);

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
