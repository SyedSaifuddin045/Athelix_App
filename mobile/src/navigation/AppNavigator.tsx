import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { MainTabNavigator } from "./MainTabNavigator";
import {
  SplashScreen,
  LoginScreen,
  RegisterScreen,
  ProfileSetupScreen,
  ExerciseDetailScreen,
  TemplateListScreen,
  TemplateBuilderScreen,
  StartWorkoutScreen,
  ActiveWorkoutScreen,
  WorkoutHistoryScreen,
  SessionDetailScreen,
  MesocycleListScreen,
  MesocycleDetailScreen,
  PersonalRecordsScreen,
  ExerciseProgressScreen,
  MuscleBalanceScreen,
  BodyweightHistoryScreen,
  SettingsScreen,
} from "../screens";

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator(): React.JSX.Element {
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
