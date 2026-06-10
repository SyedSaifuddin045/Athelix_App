import { Pressable, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@clerk/expo";
import { useMesocycleDetailQuery, useMesocycleAnalyticsQuery } from "../api/queries";
import { deleteMesocycleMesocyclesMesocycleIdDelete } from "../api/endpoints/mesocycles/mesocycles";
import { queryKeys } from "../api/queryKeys";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, RoundButton } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/Indicators";
import { MetaInline, AnalyticsCard } from "../components/ui/Stats";
import { SectionEyebrow } from "../components/ui/Indicators";
import { workoutTitle } from "../utils/display";
import { formatShortDate, formatVolume } from "../utils/format";
import { toNumberId } from "../utils/helpers";

export function MesocycleDetailScreen({ navigation, route }: { navigation: any; route?: { params?: { id?: string } } }) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const queryClient = useQueryClient();
  const mesocycleId = toNumberId(route?.params?.id);
  const detail = useMesocycleDetailQuery(mesocycleId, isAuthenticated);
  const analytics = useMesocycleAnalyticsQuery(mesocycleId, undefined, isAuthenticated);
  const deleteMeso = useMutation({
    mutationFn: async () => {
      if (!mesocycleId) return;
      await deleteMesocycleMesocyclesMesocycleIdDelete(mesocycleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      navigation.replace("MesocycleList");
    },
  });

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
          <RoundButton onPress={() => deleteMeso.mutate()}>
            <Feather name="trash-2" size={15} color={COLORS.red} />
          </RoundButton>
        }
      />

      <Card style={{ marginTop: 18, backgroundColor: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.25)" }}>
        <View style={styles.rowGap}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.teal }]} />
          <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>{meso.ended_on ? "COMPLETE" : "ACTIVE"}</Text>
        </View>
        <Text style={[styles.heroTitle, { marginTop: 10 }]}>{meso.name}</Text>
        <Text style={styles.detailLabel}>{meso.goal ?? "Training block"}</Text>
        <View style={[styles.rowBetween, { marginTop: 18 }]}>
          <Text style={styles.detailLabel}>{meso.weeks ? `${meso.weeks} weeks` : "Open ended"}</Text>
          <Text style={[styles.smallStrongText, { color: COLORS.purple }]}>{Math.round(progress)}%</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          <ProgressBar value={progress} color={COLORS.purple} />
        </View>
        <View style={[styles.rowGapLarge, { marginTop: 16, flexWrap: "wrap" }]}>
          <MetaInline icon={<Feather name="calendar" size={12} color="rgba(255,255,255,0.35)" />} text={`${formatShortDate(meso.started_on)} -> ${formatShortDate(meso.ended_on)}`} />
          <MetaInline
            icon={<MaterialCommunityIcons name="dumbbell" size={12} color="rgba(255,255,255,0.35)" />}
            text={`${meso.sessions.length} sessions logged`}
          />
        </View>
      </Card>

      <Card style={{ marginTop: 14, backgroundColor: "rgba(139,92,246,0.07)", borderColor: "rgba(139,92,246,0.2)" }}>
        <View style={styles.rowGap}>
          <Feather name="lock" size={13} color={COLORS.purple} />
          <Text style={[styles.listRowTitle, { color: COLORS.purple }]}>Block Analytics</Text>
        </View>
        <View style={[styles.twoUpGrid, { marginTop: 14 }]}>
          <AnalyticsCard label="vs. Previous Block" value={delta ? formatVolume(delta.total_volume_load_delta) : "-"} sub="volume delta" color={COLORS.green} />
          <AnalyticsCard
            label="Deload Suggestion"
            value={analytics.data?.deload_suggestion.is_recommended ? "Yes" : "No"}
            sub="based on high RPE weeks"
            color={COLORS.text}
          />
          <AnalyticsCard label="Total Sets" value={String(summary?.total_sets ?? 0)} sub="current block" color={COLORS.green} />
          <AnalyticsCard label="Avg Session RPE" value={summary?.average_session_rpe?.toFixed(1) ?? "-"} sub="current block" color={COLORS.green} />
        </View>
        <Pressable onPress={() => navigation.navigate("MuscleBalance", { mesocycleId })} style={styles.analyticsLink}>
          <View style={styles.rowGap}>
            <Feather name="bar-chart-2" size={14} color={COLORS.purple} />
            <Text style={[styles.smallStrongText, { color: COLORS.purple }]}>Muscle Balance Analysis</Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={COLORS.purple} />
        </Pressable>
      </Card>

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>Linked Sessions</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {meso.sessions.map((session) => (
            <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: String(session.id) })}>
              <Card style={styles.listRowCard}>
                <View style={styles.softIconWrap}>
                  <MaterialCommunityIcons name="dumbbell" size={16} color={COLORS.purple} />
                </View>
                <View style={styles.listRowBody}>
                  <Text style={styles.listRowTitle}>{workoutTitle(session)}</Text>
                  <Text style={styles.detailLabel}>
                    {formatShortDate(session.started_at)} - {session.total_sets ?? 0} sets - {formatVolume(session.total_volume)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.22)" />
              </Card>
            </Pressable>
          ))}
          {meso.sessions.length === 0 ? <Text style={styles.detailLabel}>No sessions linked to this mesocycle yet.</Text> : null}
        </View>
      </View>
    </Screen>
  );
}
