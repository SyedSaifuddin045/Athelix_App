import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useOverviewQuery } from "../api/queries";
import type { PersonalRecordResponse } from "../api/model";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { AppIcon } from "../design-system/icons/AppIcon";
import { recordValue } from "../utils/mapping";
import { formatShortDate } from "../utils/format";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Achievements">;
};

export function AchievementsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const overview = useOverviewQuery(isAuthenticated);
  const allPrs = overview.data?.recent_personal_records ?? [];
  const latestPr = allPrs[0];

  if (overview.isPending) {
    return (
      <Screen>
        <BackHeader title="Achievements" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading achievements..." />
      </Screen>
    );
  }

  const gold = theme.colorGold?.get() ?? "#FBBF24";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";

  return (
    <Screen>
      <BackHeader title="Achievements" subtitle="Personal records and milestones" onBack={() => navigation.goBack()} />

      {latestPr ? (
        <Pressable style={{ marginTop: spacing.xl3, marginBottom: spacing.xl2 }}>
          <Card elevated accent="gold">
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.xl }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "rgba(251,191,36,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name="trophy" size={28} color={gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: gold, fontSize: 11, lineHeight: 16, marginBottom: spacing.xs }}>
                  Latest Achievement
                </Text>
                <Text style={{ color: gold, fontSize: 15, fontWeight: "800" }}>
                  {latestPr.record_type.replace(/_/g, " ")} PR
                </Text>
                <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16, marginTop: spacing.sm }}>
                  {latestPr.exercise_id} • {recordValue(latestPr)}
                </Text>
                <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16, marginTop: spacing.xs }}>
                  {formatShortDate(latestPr.achieved_on)}
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      ) : null}

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl }}>
        <View>
          <SectionEyebrow>All PRs</SectionEyebrow>
          <Text style={{ color: textColor, fontSize: 28, fontWeight: "900", marginTop: 4, marginBottom: spacing.lg }}>
            {allPrs.length} {allPrs.length === 1 ? "Achievement" : "Achievements"}
          </Text>

          {allPrs.length > 0 ? (
            <View style={{ gap: spacing.lg }}>
              {allPrs.map((record) => (
                <Card
                  key={record.id}
                  elevated
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: gold,
                    borderColor: "rgba(251,191,36,0.2)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xl, flex: 1 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: "rgba(251,191,36,0.15)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppIcon name="award" size={20} color={gold} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: gold, fontSize: 13, fontWeight: "700", marginBottom: spacing.xxs }}
                          numberOfLines={1}
                        >
                          {record.record_type.replace(/_/g, " ")}
                        </Text>
                        <Text style={{ color: mutedColor, fontSize: 13, lineHeight: 16, marginBottom: spacing.xs }}>
                          {record.exercise_id}
                        </Text>
                        <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>
                          {formatShortDate(record.achieved_on)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
                      <Text style={{ color: gold, fontSize: 20, fontWeight: "800" }}>
                        {recordValue(record)}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
              <Text style={{ color: textColor, fontSize: 15, fontWeight: "700" }}>No achievements yet</Text>
              <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>Complete workouts and hit new personal bests to earn achievements.</Text>
              <PrimaryButton
                label="Start Your First Workout"
                onPress={() => navigation.navigate("StartWorkout", {})}
                icon={<AppIcon name="dumbbell" size={16} color="#000000" />}
              />
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
