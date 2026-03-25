import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, ProgressBar, PrimaryButton, Card } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useAuth } from "../../app/providers/AuthProvider";
import { useAppConfigQuery } from "../../features/meta/hooks";

type Props = RootStackScreenProps<"Splash">;

export function SplashScreen({ navigation }: Props): React.JSX.Element {
  const { status, bootstrapMessage, hasProfile, bootstrap } = useAuth();
  const appConfigQuery = useAppConfigQuery();

  useEffect(() => {
    if (appConfigQuery.isSuccess && status === "idle") {
      void bootstrap();
    }
  }, [appConfigQuery.isSuccess, bootstrap, status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      navigation.replace("Login");
      return;
    }

    if (status === "authenticated") {
      navigation.replace(hasProfile ? "MainTabs" : "ProfileSetup");
    }
  }, [hasProfile, navigation, status]);

  const progress = appConfigQuery.isLoading
    ? 25
    : status === "bootstrapping"
      ? 70
      : status === "authenticated" || status === "unauthenticated"
        ? 100
        : 40;

  const statusLabel = appConfigQuery.isLoading
    ? "Fetching app config..."
    : appConfigQuery.isError
      ? "Unable to reach the API"
      : bootstrapMessage;

  return (
    <Screen
      glowColor="rgba(0,180,140,0.24)"
      scroll={false}
      contentContainerStyle={styles.centeredContent}
    >
      <View style={styles.splashLogo}>
        <Text style={styles.splashEmoji}>🏋️</Text>
      </View>
      <Text style={styles.splashTitle}>{appConfigQuery.data?.app_name ?? "Athelix"}</Text>
      <Text style={styles.splashSubtitle}>Your training, connected.</Text>

      <View style={styles.splashProgressCard}>
        <Text style={styles.splashProgressValue}>{progress}%</Text>
        <ProgressBar value={progress} color={COLORS.teal} height={8} />
        <Text style={styles.splashStatus}>{statusLabel}</Text>
      </View>

      {appConfigQuery.isError ? (
        <Card style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Feather name="wifi-off" size={16} color={COLORS.red} />
            <Text style={styles.errorTitle}>Backend unavailable</Text>
          </View>
          <Text style={styles.errorText}>
            The app could not load `GET /meta/app-config`. Check that the backend is running and the base URL is correct.
          </Text>
          <PrimaryButton
            label="Retry"
            onPress={() => {
              void appConfigQuery.refetch();
            }}
            style={{ marginTop: 16 }}
          />
        </Card>
      ) : null}

      <Text style={styles.splashFooter}>
        {(appConfigQuery.data?.app_name ?? "Athelix")} v{appConfigQuery.data?.version ?? "1.0.0"}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  splashLogo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
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
  errorCard: { width: "100%", marginTop: 18 },
  errorHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  errorTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  errorText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  splashFooter: { position: "absolute", bottom: 26, color: "rgba(255,255,255,0.2)", fontSize: 11 },
});
