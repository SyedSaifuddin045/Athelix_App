import { useState } from "react";
import { Alert, Animated, Pressable, Text, View } from "react-native";
import { usePressOpacity } from "../utils/usePressOpacity";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useTheme } from "@tamagui/core";
import { useOverviewQuery } from "../api/queries";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { RoundButton, IconButton } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { AppIcon, type IconName } from "../design-system/icons/AppIcon";
import { formatKg, formatShortDate } from "../utils/format";
import { displayName, initialsFor } from "../utils/display";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

const MENU_ITEMS: { label: string; items: { label: string; icon: IconName; route: keyof RootStackParamList; color: string; badge?: string }[] }[] = [
  {
    label: "My Data",
    items: [
      { label: "Edit Profile", icon: "user", route: "ProfileSetup", color: "#FF5A36" },
      { label: "Bodyweight History", icon: "weight", route: "BodyweightHistory", color: "#22C55E" },
      { label: "Personal Records", icon: "award", route: "PersonalRecords", color: "#FBBF24" },
      { label: "Exercise Progress", icon: "trending-up", route: "ExerciseProgress", color: "#FF5A36" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Account Settings", icon: "settings", route: "Settings", color: "#8B5CF6" },
    ],
  },
];

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false, signOut } = useAuth();
  const overview = useOverviewQuery(isAuthenticated);
  const user = overview.data?.user;
  const profile = overview.data?.profile;
  const name = displayName(user, profile);
  const latestWeight = overview.data?.latest_body_weight_log;

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surfaceColor = theme.surface?.get() ?? "#0D0D0D";
  const screenColor = theme.backgroundFocus?.get() ?? "#0A0A0A";
  const greenColor = theme.colorGreen?.get() ?? "#22C55E";
  const redColor = theme.colorRed?.get() ?? "#EF4444";
  const redDarkColor = theme.colorRedDark?.get() ?? "rgba(239,68,68,0.12)";
  const press = usePressOpacity();

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: spacing.md }}>
        <Text style={{ color: textColor, fontSize: 17, fontWeight: "700" }}>Profile</Text>
        <IconButton icon="settings" onPress={() => navigation.navigate("Settings")} />
      </View>

      <View style={{ alignItems: "center", paddingTop: spacing.md }}>
        <View style={{ position: "relative", marginBottom: spacing.xl2 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: accent,
              shadowColor: accent,
              shadowOpacity: 0.28,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            }}
          >
            <Text style={{ color: "#000000", fontSize: 28, fontWeight: "800" }}>
              {initialsFor(name)}
            </Text>
          </View>
          <Animated.View style={{ opacity: press.opacity }}>
            <Pressable
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: surfaceColor,
                borderWidth: 2,
                borderColor: screenColor,
              }}
              onPress={() => navigation.navigate("ProfileSetup", { mode: "edit" })}
              onPressIn={press.onPressIn}
              onPressOut={press.onPressOut}
            >
            <AppIcon name="pencil" size={13} color={accent} />
          </Pressable>
          </Animated.View>
        </View>
        <Text style={{ color: textColor, fontSize: 21, fontWeight: "900" }}>{name}</Text>
        <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>
          @{user?.username ?? "athlete"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.md }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: greenColor }} />
          <Text style={{ color: mutedColor, fontSize: 10 }}>
            {profile?.fitness_level ?? "Fitness level"}
            {profile?.height_cm ? ` - ${profile.height_cm}cm` : ""}
            {profile?.weight_kg ? ` - ${formatKg(profile.weight_kg)}` : ""}
          </Text>
        </View>

        <Card elevated style={{ width: "100%", marginTop: spacing.xl3, paddingVertical: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "stretch" }}>
            {([
              { label: "Sessions", value: overview.data?.stats.completed_sessions ?? 0 },
              { label: "Templates", value: overview.data?.stats.total_workout_templates ?? 0 },
              { label: "PRs", value: overview.data?.stats.personal_record_count ?? 0 },
            ] as const).map((stat, index, array) => (
              <View key={stat.label} style={{ flex: 1, alignItems: "center", paddingVertical: spacing.xl3, position: "relative" }}>
                <Text style={{ color: accent, fontSize: 20, fontWeight: "900" }}>
                  {stat.value}
                </Text>
                <Text style={{ color: mutedColor, fontSize: 10, marginTop: spacing.sm }}>
                  {stat.label}
                </Text>
                {index < array.length - 1 ? (
                  <View style={{ position: "absolute", right: 0, top: spacing.xl3, bottom: spacing.xl3, width: 1, backgroundColor: borderColor }} />
                ) : null}
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl3 }}>
        {MENU_ITEMS.map((section) => (
          <View key={section.label}>
            <SectionEyebrow>{section.label}</SectionEyebrow>
            <Card elevated style={{ paddingVertical: 0, marginTop: spacing.lg }}>
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <Animated.View style={{ opacity: press.opacity }}>
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xl,
                        paddingHorizontal: spacing.xl3,
                        paddingVertical: spacing.xl2,
                      }}
                      onPress={() => {
                        if (item.route === "ProfileSetup") {
                          navigation.navigate("ProfileSetup", { mode: "edit" });
                        } else {
                          (navigation.navigate as any)(item.route);
                        }
                      }}
                      onPressIn={press.onPressIn}
                      onPressOut={press.onPressOut}
                    >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: radii.iconWrap,
                        backgroundColor: `${item.color}18`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppIcon name={item.icon} size={15} color={item.color} />
                    </View>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: "700", flex: 1 }}>{item.label}</Text>
                    {item.badge ? (
                      <Text style={{ color: accent, fontSize: 11, fontWeight: "700" }}>
                        {item.badge}
                      </Text>
                    ) : null}
                    <AppIcon name="chevron-right" size={14} color={faintColor} />
                  </Pressable>
                  </Animated.View>
                  {index < section.items.length - 1 ? (
                    <View style={{ height: 1, backgroundColor: borderColor, marginHorizontal: spacing.xl3 }} />
                  ) : null}
                </View>
              ))}
            </Card>
          </View>
        ))}
      </View>

      <Animated.View style={{ opacity: press.opacity }}>
        <Pressable
          onPress={() => {
            Alert.alert(
              "Sign out?",
              "You'll need to sign in again.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign out",
                  style: "destructive",
                  onPress: async () => {
                    await signOut();
                    navigation.replace("Login");
                  },
                },
              ],
            );
          }}
          style={{ marginTop: spacing.xl3 }}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
        >
        <View
          style={{
            minHeight: 52,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.22)",
            backgroundColor: redDarkColor,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: spacing.md,
          }}
        >
          <AppIcon name="log-out" size={15} color={redColor} />
          <Text style={{ color: redColor, fontSize: 14, fontWeight: "700" }}>Sign Out</Text>
        </View>
      </Pressable>
      </Animated.View>

      <Text style={{ color: faintColor, fontSize: 10, textAlign: "center", marginTop: spacing.xl4 }}>
        Athelix - member since {formatShortDate(user?.created_at)}
      </Text>
    </Screen>
  );
}
