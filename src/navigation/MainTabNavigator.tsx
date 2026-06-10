import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TabParamList } from "../types/navigation";
import { COLORS } from "../theme/colors";

import HomeScreen from "../screens/HomeScreen";
import ExploreScreen from "../screens/ExploreScreen";
import TrainHubScreen from "../screens/TrainHubScreen";
import { ProgressHubScreen } from "../screens/ProgressHubScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<TabParamList>();

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(8,14,14,0.98)",
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 10 + Math.max(insets.bottom, 6),
          height: 70 + Math.max(insets.bottom, 6),
        },
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: "rgba(255,255,255,0.28)",
        tabBarLabelStyle: { fontSize: 10, marginTop: 2 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} /> }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarIcon: ({ color }) => <Feather name="compass" size={20} color={color} /> }} />
      <Tab.Screen name="Train" component={TrainHubScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="dumbbell" size={20} color={color} /> }} />
      <Tab.Screen name="Progress" component={ProgressHubScreen} options={{ tabBarIcon: ({ color }) => <Feather name="trending-up" size={20} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} /> }} />
    </Tab.Navigator>
  );
}
