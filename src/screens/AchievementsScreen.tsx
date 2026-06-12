import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useOverviewQuery } from "../api/queries";
import type { PersonalRecordResponse } from "../api/model";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, EmptyCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { Icon } from "../components/ui/Icon";
import { recordValue } from "../utils/mapping";
import { formatShortDate } from "../utils/format";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Achievements">;
};

export function AchievementsScreen({ navigation }: Props) {
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

  return (
    <Screen>
      <BackHeader title="Achievements" subtitle="Personal records and milestones" onBack={() => navigation.goBack()} />

      {latestPr ? (
        <Pressable style={{ marginTop: SPACING.xl3, marginBottom: SPACING.xl2 }}>
          <Card elevated accent="gold">
            <View style={[styles.rowGap, { alignItems: "flex-start" }]}>
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
                <Icon name="trophy" size={28} color={COLORS.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailLabel, { color: COLORS.gold, marginBottom: SPACING.xs }]}>
                  Latest Achievement
                </Text>
                <Text style={[styles.cardTitle, { color: COLORS.gold }]}>
                  {latestPr.record_type.replace(/_/g, " ")} PR
                </Text>
                <Text style={[styles.detailLabel, { marginTop: SPACING.sm }]}>
                  {latestPr.exercise_id} • {recordValue(latestPr)}
                </Text>
                <Text style={[styles.detailLabel, { marginTop: SPACING.xs }]}>
                  {formatShortDate(latestPr.achieved_on)}
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      ) : null}

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl }}>
        <View>
          <SectionEyebrow>All PRs</SectionEyebrow>
          <Text style={[styles.tabTitle, { marginBottom: SPACING.lg }]}>
            {allPrs.length} {allPrs.length === 1 ? "Achievement" : "Achievements"}
          </Text>

          {allPrs.length > 0 ? (
            <View style={{ gap: SPACING.lg }}>
              {allPrs.map((record) => (
                <Card
                  key={record.id}
                  elevated
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: COLORS.gold,
                    borderColor: "rgba(251,191,36,0.2)",
                  }}
                >
                  <View style={styles.rowBetween}>
                    <View style={[styles.rowGap, { flex: 1 }]}>
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
                        <Icon name="award" size={20} color={COLORS.gold} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.listRowTitle, { color: COLORS.gold, marginBottom: SPACING.xxs }]}
                          numberOfLines={1}
                        >
                          {record.record_type.replace(/_/g, " ")}
                        </Text>
                        <Text style={[styles.detailLabel, { fontSize: 13, marginBottom: SPACING.xs }]}>
                          {record.exercise_id}
                        </Text>
                        <Text style={[styles.detailLabel, { fontSize: 11 }]}>
                          {formatShortDate(record.achieved_on)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: SPACING.sm }}>
                      <Text style={[styles.heroMetric, { color: COLORS.gold, fontSize: 20 }]}>
                        {recordValue(record)}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <EmptyCard
              title="No achievements yet"
              text="Complete workouts and hit new personal bests to earn achievements. They'll appear here!"
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
