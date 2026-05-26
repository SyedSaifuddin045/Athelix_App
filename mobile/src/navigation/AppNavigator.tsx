import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../types/navigation";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { ProfileSetupScreen } from "../screens/ProfileSetupScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import ExerciseDetailScreen from "../screens/ExerciseDetailScreen";
import TemplateListScreen from "../screens/TemplateListScreen";
import { TemplateBuilderScreen } from "../screens/TemplateBuilderScreen";
import { StartWorkoutScreen } from "../screens/StartWorkoutScreen";
import { ActiveWorkoutScreen } from "../screens/ActiveWorkoutScreen";
import { WorkoutHistoryScreen } from "../screens/WorkoutHistoryScreen";
import { SessionDetailScreen } from "../screens/SessionDetailScreen";
import { MesocycleListScreen } from "../screens/MesocycleListScreen";
import { MesocycleDetailScreen } from "../screens/MesocycleDetailScreen";
import { PersonalRecordsScreen } from "../screens/PersonalRecordsScreen";
import { ExerciseProgressScreen } from "../screens/ExerciseProgressScreen";
import { MuscleBalanceScreen } from "../screens/MuscleBalanceScreen";
import { BodyweightHistoryScreen } from "../screens/BodyweightHistoryScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
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
      <RootStack.Screen name="PersonalRecords" component={PersonalRecordsScreen} />
      <RootStack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
      <RootStack.Screen name="MuscleBalance" component={MuscleBalanceScreen} />
      <RootStack.Screen name="BodyweightHistory" component={BodyweightHistoryScreen} />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
    </RootStack.Navigator>
  );
}
