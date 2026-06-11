import { Pressable, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";

import { useAuth } from "@clerk/expo";
import { useOverviewQuery } from "../api/queries";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Indicators";
import { Screen } from "../components/ui/Layout";
import { SectionEyebrow } from "../components/ui/Indicators";
import { CompactStatCard } from "../components/ui/Stats";
import { PROGRESS_SECTIONS } from "../data";
import { recordValue } from "../utils/mapping";
import { formatShortDate } from "../utils/format";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

export function ProgressHubScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const overview = useOverviewQuery(isAuthenticated);
  const latestPr = overview.data?.recent_personal_records[0];
  return (
    <Screen>
      <View style={styles.tabIntro}>
        <SectionEyebrow>Analytics</SectionEyebrow>
        <Text style={styles.tabTitle}>Progress</Text>
        <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
          <CompactStatCard label="PRs" value={String(overview.data?.stats.personal_record_count ?? 0)} valueColor={COLORS.gold} />
          <CompactStatCard label="Sessions" value={String(overview.data?.stats.completed_sessions ?? 0)} valueColor={COLORS.teal} />
          <CompactStatCard label="Streak" value={String(overview.data?.workout_streaks.current_daily_streak ?? 0)} valueColor={COLORS.green} />
        </View>
      </View>

      <View style={{ marginTop: 18, gap: 12 }}>
        {PROGRESS_SECTIONS.map((section) => {
          let badgeLabel = "badge" in section ? section.badge : "";
          if ("badgeKey" in section) {
            if (section.badgeKey === "prs") {
              badgeLabel = `${overview.data?.stats.personal_record_count ?? 0} PRs total`;
            } else if (section.badgeKey === "exercises") {
              badgeLabel = `${overview.data?.stats.tracked_exercises_count ?? 0} exercises tracked`;
            }
          }
          return (
            <Pressable
              key={section.title}
              onPress={() => {
                if (section.path === "personalRecords") navigation.navigate({ name: "PersonalRecords", params: undefined });
                else if (section.path === "exerciseProgress") navigation.navigate({ name: "ExerciseProgress", params: {} });
                else if (section.path === "muscleBalance") navigation.navigate({ name: "MuscleBalance", params: undefined });
              }}
            >
              <Card style={{ borderColor: `${section.color}22`, borderRadius: 28 }}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowGap}>
                    <View style={[styles.sectionIconWrap, { width: 56, height: 56, backgroundColor: `${section.color}16` }]}>
                      {section.path === "personalRecords" ? <Feather name="award" size={26} color={section.color} /> : null}
                      {section.path === "exerciseProgress" ? <Feather name="trending-up" size={26} color={section.color} /> : null}
                      {section.path === "muscleBalance" ? <Feather name="bar-chart-2" size={26} color={section.color} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{section.title}</Text>
                      <Text style={styles.detailLabel}>{section.desc}</Text>
                      <Tag label={badgeLabel} color={section.color} />
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {latestPr ? (
        <Card style={{ marginTop: 18, backgroundColor: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.2)" }}>
          <View style={styles.rowGap}>
            <Text style={{ fontSize: 24 }}>🏆</Text>
            <View>
              <Text style={[styles.listRowTitle, { color: COLORS.gold }]}>New {latestPr.record_type} PR</Text>
              <Text style={styles.detailLabel}>
                {recordValue(latestPr)} - {formatShortDate(latestPr.achieved_on)}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
