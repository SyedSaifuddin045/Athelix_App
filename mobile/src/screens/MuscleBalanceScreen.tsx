import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useMuscleBalanceQuery } from "../api/queries";
import { MUSCLE_PERIODS } from "../data";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, RoundButton } from "../components/ui/Button";
import { SectionEyebrow, Tag, ProgressBar } from "../components/ui/Indicators";

export function MuscleBalanceScreen({ navigation, route }: { navigation: any; route?: { params?: { mesocycleId?: number | null } } }) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const [period, setPeriod] = useState("1W");
  const [expanded, setExpanded] = useState<string | null>(null);
  const weeks = period === "1W" ? 1 : period === "2W" ? 2 : period === "4W" ? 4 : 8;
  const mesocycleId = route?.params?.mesocycleId ?? undefined;
  const report = useMuscleBalanceQuery({ weeks, mesocycle_id: mesocycleId }, isAuthenticated);
  const items = report.data?.items ?? [];
  const strongItems = items.filter((item) => item.status === "Strong");
  const balancedItems = items.filter((item) => item.status === "Balanced");
  const needsAttentionItems = items.filter((item) => item.status !== "Strong" && item.status !== "Balanced");

  function statusColor(status: string) {
    if (status === "Strong") return COLORS.green;
    if (status === "Balanced") return COLORS.gold;
    if (status === "Undertrained") return COLORS.orange;
    return COLORS.red;
  }

  function sectionHeaderColor(group: string) {
    if (group === "strong") return COLORS.green;
    if (group === "balanced") return COLORS.gold;
    return COLORS.orange;
  }

  function renderItems(groupItems: (typeof items), groupKey: string) {
    if (groupItems.length === 0) return null;
    const headerColor = sectionHeaderColor(groupKey);
    return (
      <View style={{ marginTop: 18 }}>
        <SectionEyebrow color={headerColor}>{groupKey === "strong" ? "Strong Areas" : groupKey === "balanced" ? "Balanced" : "Needs Attention"}</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 10 }}>
          {groupItems.map((item) => {
            const isExpanded = expanded === item.muscle_group;
            const color = statusColor(item.status);
            return (
              <Pressable key={item.muscle_group} onPress={() => setExpanded(isExpanded ? null : item.muscle_group)}>
                <Card>
                  <View style={styles.rowBetween}>
                    <Text style={styles.listRowTitle}>{item.muscle_group}</Text>
                    <View style={styles.rowGap}>
                      <Text style={[styles.detailLabel, { minWidth: 32, textAlign: "right" }]}>{item.score}</Text>
                      <Tag label={item.status} color={color} />
                    </View>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <ProgressBar value={item.score} color={color} />
                  </View>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8, lineHeight: 16 }}>
                    {item.recommendation}
                  </Text>
                  {item.exercises.length > 0 && (
                    <View style={{ marginTop: 10, borderTopWidth: isExpanded ? 1 : 0, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: isExpanded ? 8 : 0 }}>
                      {isExpanded && item.exercises.map((ex, i) => (
                        <View key={i} style={[styles.rowBetween, { marginTop: i > 0 ? 4 : 0 }]}>
                          <Text style={[styles.detailLabel, { flex: 1 }]}>{ex.exercise_name}</Text>
                          <Text style={styles.detailLabel}>
                            {ex.completed_sets.toFixed(1)} sets ({ex.average_weekly_sets.toFixed(1)}/wk)
                          </Text>
                        </View>
                      ))}
                      <Text style={[styles.detailLabel, { marginTop: 4, textAlign: "right" }]}>
                        {item.weekly_sets.toFixed(1)} sets · {item.average_weekly_sets.toFixed(1)}/wk
                      </Text>
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <BackHeader
        title="Muscle Balance"
        onBack={() => navigation.goBack()}
        right={
          <RoundButton>
            <Feather name="info" size={15} color="rgba(255,255,255,0.6)" />
          </RoundButton>
        }
      />

      <View style={styles.segmentedWrap}>
        {MUSCLE_PERIODS.map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setPeriod(entry)}
            style={[styles.segmentedOption, period === entry ? styles.segmentedOptionActive : null]}
          >
            <Text style={[styles.segmentedText, period === entry ? { color: "#a78bfa" } : null]}>{entry}</Text>
          </Pressable>
        ))}
      </View>

      {report.isPending ? <LoadingCard label="Loading muscle balance..." /> : null}
      {report.isError ? <ErrorCard error={report.error} onRetry={() => report.refetch()} /> : null}

      {renderItems(strongItems, "strong")}
      {renderItems(balancedItems, "balanced")}
      {renderItems(needsAttentionItems, "needs-attention")}

      {!report.isPending && items.length === 0 ? <EmptyCard title="No muscle data" text="Complete workouts to generate analytics." /> : null}
    </Screen>
  );
}
