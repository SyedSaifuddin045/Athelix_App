import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { TabParamList } from "../types/navigation";
import { HomeScreen, ExploreScreen, TrainHubScreen, ProgressHubScreen, ProfileScreen } from "../screens";

const Tab = createBottomTabNavigator<TabParamList>();

export function MainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(8,14,14,0.98)",
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 10,
          height: 70,
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
