import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useMesocycleDetailQuery, useMesocycleAnalyticsQuery } from "../api/queries";
import { useDeleteMesocycle } from "../api/mutations";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, RoundButton } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/Indicators";
import { MetaInline, AnalyticsCard } from "../components/ui/Stats";
import { SectionEyebrow } from "../components/ui/Indicators";
import { AppIcon } from "../design-system/icons/AppIcon";
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
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const purpleColor = theme.colorPurple?.get() ?? "#8B5CF6";
  const greenColor = theme.colorGreen?.get() ?? "#22C55E";
  const redColor = theme.colorRed?.get() ?? "#EF4444";

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
            <AppIcon name="trash-2" size={15} color={redColor} />
          </RoundButton>
        }
      />

      <Card elevated accent="purple" style={{ marginTop: spacing.xl3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }]} />
          <Text style={[{ color: accent, fontSize: 11, fontWeight: "700" }]}>{meso.ended_on ? "COMPLETE" : "ACTIVE"}</Text>
        </View>
        <Text style={[{ color: textColor, fontSize: 21, fontWeight: "900" }, { marginTop: spacing.lg }]}>{meso.name}</Text>
        <Text style={[{ color: mutedColor, fontSize: 11, lineHeight: 16 }, { marginTop: spacing.xxs }]}>{meso.goal ?? "Training block"}</Text>
        <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, { marginTop: spacing.xl3 }]}>
          <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>{meso.weeks ? `${meso.weeks} weeks` : "Open ended"}</Text>
          <Text style={[{ color: purpleColor, fontSize: 11, fontWeight: "700" }]}>{Math.round(progress)}%</Text>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <ProgressBar value={progress} color={purpleColor} />
        </View>
        <View style={[{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }, { marginTop: spacing.xl3, flexWrap: "wrap", gap: spacing.xl }]}>
          <MetaInline icon="calendar" label={`${formatShortDate(meso.started_on)} -> ${formatShortDate(meso.ended_on)}`} />
          <MetaInline icon="list-checks" label={`${meso.sessions.length} sessions logged`} />
        </View>
      </Card>

      <Card elevated accent="purple" style={{ marginTop: spacing.xl2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <AppIcon name="lock" size={13} color={purpleColor} />
          <Text style={[{ color: textColor, fontSize: 13, fontWeight: "700" }, { color: purpleColor }]}>Block Analytics</Text>
        </View>
        <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.xl2 }]}>
          <AnalyticsCard label="vs. Previous Block" value={delta ? formatVolume(delta.total_volume_load_delta) : "-"} sub="volume delta" color={greenColor} />
          <AnalyticsCard label="Deload Suggestion" value={analytics.data?.deload_suggestion.is_recommended ? "Yes" : "No"} sub="based on high RPE weeks" color={textColor} />
          <AnalyticsCard label="Total Sets" value={String(summary?.total_sets ?? 0)} sub="current block" color={greenColor} />
          <AnalyticsCard label="Avg Session RPE" value={summary?.average_session_rpe?.toFixed(1) ?? "-"} sub="current block" color={greenColor} />
        </View>
        <Pressable
          onPress={() => navigation.navigate({ name: "MuscleBalance", params: { mesocycleId: mesocycleId ?? undefined } })}
          style={[{ marginTop: spacing.xl2, borderRadius: radii.input, backgroundColor: "rgba(139,92,246,0.12)", paddingHorizontal: spacing.xl2, paddingVertical: spacing.xl2, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <AppIcon name="bar-chart-2" size={14} color={purpleColor} />
            <Text style={[{ color: purpleColor, fontSize: 11, fontWeight: "700" }]}>Muscle Balance Analysis</Text>
          </View>
          <AppIcon name="chevron-right" size={13} color={purpleColor} />
        </Pressable>
      </Card>

      <View style={{ marginTop: spacing.xl3 }}>
        <SectionEyebrow>Linked Sessions</SectionEyebrow>
        <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
          {meso.sessions.map((session) => (
            <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: String(session.id) })}>
              <Card elevated style={[{ flexDirection: "row", alignItems: "center", gap: spacing.lg }]}>
                <View style={[{ width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }, { width: 40, height: 40, borderRadius: radii.iconWrap, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }]}>
                  <AppIcon name="list-checks" size={16} color={purpleColor} />
                </View>
                <View style={[{ flex: 1 }]}>
                  <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>{workoutTitle(session)}</Text>
                  <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>
                    {formatShortDate(session.started_at)} - {session.total_sets ?? 0} sets - {formatVolume(session.total_volume)}
                  </Text>
                </View>
                <AppIcon name="chevron-right" size={13} color={faintColor} />
              </Card>
            </Pressable>
          ))}
          {meso.sessions.length === 0 ? <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>No sessions linked to this mesocycle yet.</Text> : null}
        </View>
      </View>
    </Screen>
  );
}
