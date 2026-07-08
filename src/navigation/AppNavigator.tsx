import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";
import { useAuth } from "@clerk/expo";
import { createPlatformStackNavigator, platformScreenOptions } from "./createPlatformStackNavigator";

import { useTheme } from "@tamagui/core";
import { radii } from "../design-system/tokens/radii";
import { shadows } from "../design-system/tokens/shadows";
import { AppIcon } from "../design-system/icons/AppIcon";
import { rawColors } from "../design-system/tokens/colors";

const CLERK_CACHE_KEYS = [
  "__clerk_client_jwt",
  "__clerk_cache_environment",
  "__clerk_cache_client",
  "__clerk_cache_session_jwt",
];

import type { RootStackParamList } from "../types/navigation";

import { SplashScreen } from "../screens/SplashScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ProfileSetupScreen } from "../screens/ProfileSetupScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { ExerciseDetailScreen } from "../screens/ExerciseDetailScreen";
import { TemplateListScreen } from "../screens/TemplateListScreen";
import { TemplateBuilderScreen } from "../screens/TemplateBuilderScreen";
import { StartWorkoutScreen } from "../screens/StartWorkoutScreen";
import { ActiveWorkoutScreen } from "../screens/ActiveWorkoutScreen";
import { WorkoutHistoryScreen } from "../screens/WorkoutHistoryScreen";
import { SessionDetailScreen } from "../screens/SessionDetailScreen";
import { MesocycleListScreen } from "../screens/MesocycleListScreen";
import { MesocycleDetailScreen } from "../screens/MesocycleDetailScreen";
import { AchievementsScreen } from "../screens/AchievementsScreen";
import { PersonalRecordsScreen } from "../screens/PersonalRecordsScreen";
import { ExerciseProgressScreen } from "../screens/ExerciseProgressScreen";
import { MuscleBalanceScreen } from "../screens/MuscleBalanceScreen";
import { BodyweightHistoryScreen } from "../screens/BodyweightHistoryScreen";
import { QuickCardioScreen } from "../screens/QuickCardioScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { getTokenWithTimeout, setRefreshTokenHandler, updateClerkToken } from "../api/client";

const RootStack = createPlatformStackNavigator<RootStackParamList>();

function AuthGate({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const backgroundColor = theme.background?.get() ?? rawColors.root;
  const accentColor = theme.accent?.get() ?? rawColors.accent;
  const textColor = theme.color?.get() ?? rawColors.text;
  const mutedColor = theme.colorMuted?.get() ?? rawColors.muted;
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [isLoadedTimedOut, setIsLoadedTimedOut] = useState(false);
  const [showOverlay, setShowOverlay] = useState(!isLoaded);

  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setIsLoadedTimedOut(true), 15000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Delay overlay dismissal slightly to ensure navigation context is stable
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setShowOverlay(false), 100);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(true);
    }
  }, [isLoaded]);

  useEffect(() => {
    setRefreshTokenHandler(isSignedIn ? () => getTokenWithTimeout(getToken) : null);
    return () => setRefreshTokenHandler(null);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      getTokenWithTimeout(getToken).then((t) => { if (t) updateClerkToken(t); });
    } else {
      updateClerkToken(null);
    }

    const interval = setInterval(async () => {
      const token = await getTokenWithTimeout(getToken);
      if (token) updateClerkToken(token);
    }, 5 * 60 * 1000);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isSignedIn) {
        getTokenWithTimeout(getToken).then((t) => { if (t) updateClerkToken(t); });
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isLoaded, isSignedIn]);

  // Always render children (navigator stays mounted) — show overlays on top
  // This keeps NavigationContainer context alive so screens always find it
  return (
    <View style={{ flex: 1 }}>
      {children}
      {isLoadedTimedOut ? (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text style={{ color: textColor, fontSize: 18, textAlign: "center", marginBottom: 8 }}>
            Could not restore session
          </Text>
          <Text style={{ color: mutedColor, fontSize: 14, textAlign: "center", marginBottom: 24 }}>
            We had trouble loading your account. Please try again.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={async () => {
              await Promise.allSettled(
                CLERK_CACHE_KEYS.map((k) => SecureStore.deleteItemAsync(k))
              );
              await Updates.reloadAsync();
            }}
            style={{
              backgroundColor: accentColor,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {showOverlay && !isLoadedTimedOut ? (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: radii.card,
              backgroundColor: accentColor,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              ...shadows.glow(accentColor),
            }}
          >
            <AppIcon name="dumbbell" size={42} color="#000000" strokeWidth={2.5} />
          </View>
          <Text style={{ color: textColor, fontSize: 24, fontWeight: "700", marginBottom: 32 }}>
            Athelix
          </Text>
          <ActivityIndicator size="small" color={accentColor} />
          <Text style={{ color: mutedColor, fontSize: 12, marginTop: 16 }}>
            Restoring session...
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function AppNavigator() {
  return (
    <AuthGate>
      <RootStack.Navigator
        screenOptions={platformScreenOptions({
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: rawColors.root },
        })}
      >
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        <RootStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        <RootStack.Screen name="TemplateList" component={TemplateListScreen} />
        <RootStack.Screen name="TemplateBuilder" component={TemplateBuilderScreen} />
        <RootStack.Screen name="StartWorkout" component={StartWorkoutScreen} />
        <RootStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        <RootStack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
        <RootStack.Screen name="SessionDetail" component={SessionDetailScreen} />
        <RootStack.Screen name="MesocycleList" component={MesocycleListScreen} />
        <RootStack.Screen name="MesocycleDetail" component={MesocycleDetailScreen} />
        <RootStack.Screen name="Achievements" component={AchievementsScreen} />
        <RootStack.Screen name="PersonalRecords" component={PersonalRecordsScreen} />
        <RootStack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
        <RootStack.Screen name="MuscleBalance" component={MuscleBalanceScreen} />
        <RootStack.Screen name="BodyweightHistory" component={BodyweightHistoryScreen} />
        <RootStack.Screen name="QuickCardio" component={QuickCardioScreen} />
        <RootStack.Screen name="Settings" component={SettingsScreen} />
        <RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      </RootStack.Navigator>
    </AuthGate>
  );
}
