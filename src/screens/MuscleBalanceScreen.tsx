import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useMuscleBalanceQuery } from "../api/queries";
import { MUSCLE_PERIODS } from "../data";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { SectionEyebrow, Tag, ProgressBar } from "../components/ui/Indicators";
import { Icon } from "../components/ui/Icon";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "MuscleBalance">;
  route: RouteProp<RootStackParamList, "MuscleBalance">;
};

const STATUS_COLORS: Record<string, string> = {
  Strong: COLORS.green,
  Balanced: COLORS.blue,
  "Needs Attention": COLORS.red,
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Strong: <Icon name="check-circle" size={14} color={COLORS.green} />,
  Balanced: <Icon name="equal" size={14} color={COLORS.blue} />,
  "Needs Attention": <Icon name="alert-triangle" size={14} color={COLORS.red} />,
};

export function MuscleBalanceScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const [period, setPeriod] = useState("1W");
  const [expanded, setExpanded] = useState<string | null>(null);
  const weeks = period === "1W" ? 1 : period === "2W" ? 2 : period === "4W" ? 4 : 8;
  const mesocycleId = route?.params?.mesocycleId ?? undefined;
  const report = useMuscleBalanceQuery({ weeks, mesocycle_id: mesocycleId }, isAuthenticated);
  const items = report.data?.items ?? [];
  const strongItems = items.filter((item) => item.status === "Strong");

  return (
    <Screen>
      <BackHeader title="Muscle Balance" subtitle="Training volume distribution" onBack={() => navigation.goBack()} />

      <View style={[styles.segmentedWrap, { flexDirection: "row", backgroundColor: COLORS.cardSoft, borderRadius: RADIUS.input, padding: SPACING.xs, marginTop: SPACING.xl3 }]}>
        {MUSCLE_PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.segmentedOption,
              {
                flex: 1,
                minHeight: 38,
                borderRadius: RADIUS.input - 4,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: period === p ? "rgba(139,92,246,0.35)" : "transparent",
                backgroundColor: period === p ? "rgba(139,92,246,0.25)" : "transparent",
              },
            ]}
          >
            <Text style={[styles.segmentedText, period === p ? { color: COLORS.purple } : { color: COLORS.muted }]}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      {report.isPending ? <LoadingCard label="Analyzing muscle balance..." /> : null}
      {report.isError ? <ErrorCard error={report.error} onRetry={() => report.refetch()} /> : null}

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl }}>
        {items.map((item) => {
          const isExpanded = expanded === item.muscle_group;
          return (
            <Card key={item.muscle_group} elevated>
              <Pressable onPress={() => setExpanded(isExpanded ? null : item.muscle_group)}>
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    {STATUS_ICONS[item.status]}
                    <Text style={[styles.cardTitle, { flex: 1 }]}>{item.muscle_group}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: SPACING.xxs }}>
                    <Tag label={item.status} color={STATUS_COLORS[item.status] ?? COLORS.muted} />
                    <Text style={styles.listMeta}>{item.percentage}%</Text>
                  </View>
                </View>
                <View style={{ marginTop: SPACING.xl }}>
                  <ProgressBar value={item.percentage} color={STATUS_COLORS[item.status] ?? COLORS.purple} />
                </View>
              </Pressable>
              {isExpanded && item.exercises?.length ? (
                <View style={{ marginTop: SPACING.xl2, gap: SPACING.md }}>
                  {item.exercises.map((ex: any) => (
                    <View key={ex.name} style={[styles.rowGap, { paddingLeft: SPACING.xl }]}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.faint }} />
                      <Text style={[styles.listMeta, { flex: 1 }]}>{ex.name}</Text>
                      <Text style={styles.smallStrongText}>{ex.percentage}%</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}
        {!report.isPending && items.length === 0 ? (
          <EmptyCard title="No data yet" text="Complete sessions to see muscle balance." />
        ) : null}
      </View>
    </Screen>
  );
}
