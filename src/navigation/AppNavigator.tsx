import { useEffect } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { COLORS } from "../theme/colors";

import type { RootStackParamList } from "../types/navigation";

import { SplashScreen } from "../screens/SplashScreen";
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
import { SettingsScreen } from "../screens/SettingsScreen";
import { getTokenWithTimeout, setRefreshTokenHandler, updateClerkToken } from "../api/client";

const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

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

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.root, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color={COLORS.accent} />
      </View>
    );
  }
  return <>{children}</>;
}

export function AppNavigator() {
  return (
    <AuthGate>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <RootStack.Screen name="Splash" component={SplashScreen} />
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
        <RootStack.Screen name="Settings" component={SettingsScreen} />
      </RootStack.Navigator>
    </AuthGate>
  );
}
