import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useMesocycleDetailQuery, useMesocycleAnalyticsQuery } from "../api/queries";
import { useDeleteMesocycle } from "../api/mutations";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, RoundButton } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/Indicators";
import { MetaInline, AnalyticsCard } from "../components/ui/Stats";
import { SectionEyebrow } from "../components/ui/Indicators";
import { Icon } from "../components/ui/Icon";
import { workoutTitle } from "../utils/display";
import { formatShortDate, formatVolume } from "../utils/format";
import { toNumberId } from "../utils/helpers";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "MesocycleDetail">;
  route: RouteProp<RootStackParamList, "MesocycleDetail">;
};

export function MesocycleDetailScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const mesocycleId = toNumberId(route?.params?.id);
  const detail = useMesocycleDetailQuery(mesocycleId, isAuthenticated);
  const analytics = useMesocycleAnalyticsQuery(mesocycleId, undefined, isAuthenticated);
  const deleteMeso = useDeleteMesocycle({ onSuccess: () => navigation.replace("MesocycleList") });

  if (detail.isPending) {
    return (
      <Screen>
        <BackHeader title="Mesocycle" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading mesocycle..." />
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen>
        <BackHeader title="Mesocycle" onBack={() => navigation.goBack()} />
        <ErrorCard error={detail.error} onRetry={() => detail.refetch()} />
      </Screen>
    );
  }

  const meso = detail.data;
  const summary = analytics.data?.current_block_summary;
  const delta = analytics.data?.comparison_to_previous;
  const start = new Date(meso.started_on).getTime();
  const end = meso.ended_on ? new Date(meso.ended_on).getTime() : start + (meso.weeks ?? 0) * 7 * 24 * 60 * 60 * 1000;
  const progress = end > start ? Math.max(0, Math.min(100, ((Date.now() - start) / (end - start)) * 100)) : 0;

  return (
    <Screen>
      <BackHeader
        title="Mesocycle"
        onBack={() => navigation.goBack()}
        right={
          <RoundButton onPress={() => mesocycleId && deleteMeso.mutate(mesocycleId)} accent>
            <Icon name="trash-2" size={15} color={COLORS.red} />
          </RoundButton>
        }
      />

      <Card elevated accent="purple" style={{ marginTop: SPACING.xl3 }}>
        <View style={styles.rowGap}>
          <View style={[styles.statusDot, { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal }]} />
          <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>{meso.ended_on ? "COMPLETE" : "ACTIVE"}</Text>
        </View>
        <Text style={[styles.heroTitle, { marginTop: SPACING.lg }]}>{meso.name}</Text>
        <Text style={[styles.detailLabel, { marginTop: SPACING.xxs }]}>{meso.goal ?? "Training block"}</Text>
        <View style={[styles.rowBetween, { marginTop: SPACING.xl3 }]}>
          <Text style={styles.detailLabel}>{meso.weeks ? `${meso.weeks} weeks` : "Open ended"}</Text>
          <Text style={[styles.smallStrongText, { color: COLORS.purple }]}>{Math.round(progress)}%</Text>
        </View>
        <View style={{ marginTop: SPACING.md }}>
          <ProgressBar value={progress} color={COLORS.purple} />
        </View>
        <View style={[styles.rowGapLarge, { marginTop: SPACING.xl3, flexWrap: "wrap", gap: SPACING.xl }]}>
          <MetaInline icon="calendar" label={`${formatShortDate(meso.started_on)} -> ${formatShortDate(meso.ended_on)}`} />
          <MetaInline icon="list-checks" label={`${meso.sessions.length} sessions logged`} />
        </View>
      </Card>

      <Card elevated accent="purple" style={{ marginTop: SPACING.xl2 }}>
        <View style={styles.rowGap}>
          <Icon name="lock" size={13} color={COLORS.purple} />
          <Text style={[styles.listRowTitle, { color: COLORS.purple }]}>Block Analytics</Text>
        </View>
        <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.lg, marginTop: SPACING.xl2 }]}>
          <AnalyticsCard label="vs. Previous Block" value={delta ? formatVolume(delta.total_volume_load_delta) : "-"} sub="volume delta" color={COLORS.green} />
          <AnalyticsCard label="Deload Suggestion" value={analytics.data?.deload_suggestion.is_recommended ? "Yes" : "No"} sub="based on high RPE weeks" color={COLORS.text} />
          <AnalyticsCard label="Total Sets" value={String(summary?.total_sets ?? 0)} sub="current block" color={COLORS.green} />
          <AnalyticsCard label="Avg Session RPE" value={summary?.average_session_rpe?.toFixed(1) ?? "-"} sub="current block" color={COLORS.green} />
        </View>
        <Pressable
          onPress={() => navigation.navigate({ name: "MuscleBalance", params: { mesocycleId: mesocycleId ?? undefined } })}
          style={[styles.analyticsLink, { marginTop: SPACING.xl2, borderRadius: RADIUS.input, backgroundColor: "rgba(139,92,246,0.12)", paddingHorizontal: SPACING.xl2, paddingVertical: SPACING.xl2, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
        >
          <View style={styles.rowGap}>
            <Icon name="bar-chart-2" size={14} color={COLORS.purple} />
            <Text style={[styles.smallStrongText, { color: COLORS.purple }]}>Muscle Balance Analysis</Text>
          </View>
          <Icon name="chevron-right" size={13} color={COLORS.purple} />
        </Pressable>
      </Card>

      <View style={{ marginTop: SPACING.xl3 }}>
        <SectionEyebrow>Linked Sessions</SectionEyebrow>
        <View style={{ gap: SPACING.lg, marginTop: SPACING.xl }}>
          {meso.sessions.map((session) => (
            <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: String(session.id) })}>
              <Card elevated style={[styles.listRowCard, { flexDirection: "row", alignItems: "center", gap: SPACING.lg }]}>
                <View style={[styles.softIconWrap, { width: 40, height: 40, borderRadius: RADIUS.iconWrap, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }]}>
                  <Icon name="list-checks" size={16} color={COLORS.purple} />
                </View>
                <View style={[styles.listRowBody, { flex: 1 }]}>
                  <Text style={styles.listRowTitle}>{workoutTitle(session)}</Text>
                  <Text style={styles.detailLabel}>
                    {formatShortDate(session.started_at)} - {session.total_sets ?? 0} sets - {formatVolume(session.total_volume)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={13} color={COLORS.faint} />
              </Card>
            </Pressable>
          ))}
          {meso.sessions.length === 0 ? <Text style={styles.detailLabel}>No sessions linked to this mesocycle yet.</Text> : null}
        </View>
      </View>
    </Screen>
  );
}
