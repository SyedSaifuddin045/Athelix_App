import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";

import type { TabParamList } from "../types/navigation";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { rawColors } from "../design-system/tokens/colors";
import { AppIcon, type IconName } from "../design-system/icons/AppIcon";

import { HomeScreen } from "../screens/HomeScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import { TrainHubScreen } from "../screens/TrainHubScreen";
import { ProgressHubScreen } from "../screens/ProgressHubScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<TabParamList>();

const TABS: { name: keyof TabParamList; icon: IconName; label: string }[] = [
  { name: "Home", icon: "home", label: "Home" },
  { name: "Explore", icon: "search", label: "Explore" },
  { name: "Train", icon: "dumbbell", label: "Train" },
  { name: "Progress", icon: "trending-up", label: "Progress" },
  { name: "Profile", icon: "user", label: "Profile" },
];

function TabIcon({ icon, color, focused }: { icon: IconName; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <AppIcon name={icon} size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

export function MainTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: rawColors.root,
        },
        tabBarStyle: {
          backgroundColor: rawColors.tabBar,
          borderTopColor: theme.borderColor?.get() ?? rawColors.border,
          borderTopWidth: 1,
          paddingTop: spacing.md,
          paddingBottom: spacing.lg + Math.max(insets.bottom, spacing.sm),
          height: 70 + Math.max(insets.bottom, spacing.sm),
        },
        tabBarActiveTintColor: theme.accent?.get(),
        tabBarInactiveTintColor: theme.colorFaint?.get(),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: spacing.xxs,
        },
      }}
    >
      {TABS.map(({ name, icon, label }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={
            name === "Home"
              ? HomeScreen
              : name === "Explore"
                ? ExploreScreen
                : name === "Train"
                  ? TrainHubScreen
                  : name === "Progress"
                    ? ProgressHubScreen
                    : ProfileScreen
          }
          options={{
            tabBarLabel: label,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icon} color={color} focused={focused} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
