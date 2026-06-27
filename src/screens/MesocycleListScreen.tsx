import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useMesocyclesQuery } from "../api/queries";
import { useCreateMesocycle } from "../api/mutations";
import { getApiErrorMessage } from "../api/client";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, LoadingCard, ErrorCard, EmptyCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { Tag, ProgressBar, SectionEyebrow } from "../components/ui/Indicators";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { AppIcon } from "../design-system/icons/AppIcon";
import { successData } from "../utils/mapping";
import { MESOCYCLE_GOALS } from "../data";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MesocycleList"> };

export function MesocycleListScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const mesocycles = useMesocyclesQuery(isAuthenticated);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMesoName, setNewMesoName] = useState("");
  const [newMesoGoal, setNewMesoGoal] = useState<string | null>(null);
  const [newMesoWeeks, setNewMesoWeeks] = useState("6");
  const createMeso = useCreateMesocycle({
    onSuccess: (data) => {
      setShowCreateModal(false);
      setNewMesoName("");
      setNewMesoGoal(null);
      setNewMesoWeeks("6");
      navigation.navigate("MesocycleDetail", { id: String(data.id) });
    },
  });

  const textColor = theme.color?.toString() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.toString() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.toString() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)";
  const surfaceColor = theme.surface?.toString() ?? "#0D0D0D";
  const surface2Color = theme.surface2?.toString() ?? "rgba(255,255,255,0.06)";
  const purpleColor = theme.colorPurple?.toString() ?? "#8B5CF6";
  const greenColor = theme.colorGreen?.toString() ?? "#22C55E";
  const redColor = theme.colorRed?.toString() ?? "#EF4444";

  return (
    <Screen>
      <BackHeader
        title="Mesocycles"
        subtitle="Block periodization planning"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.input, backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.3)", borderWidth: 1 }}
          >
            <AppIcon name="plus" size={14} color={purpleColor} />
            <Text style={{ color: purpleColor, fontSize: 12, fontWeight: "700" }}>New</Text>
          </Pressable>
        }
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: spacing.sm }}>
        <Tag label="ADVANCED" color={purpleColor} />
      </View>

      <Card elevated accent="purple" style={{ marginTop: spacing.xl3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <AppIcon name="trending-up" size={18} color={purpleColor} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: purpleColor, fontSize: 13, fontWeight: "700" }}>Advanced Planning Mode</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16 }}>Mesocycles are optional training blocks.</Text>
          </View>
        </View>
      </Card>

      {mesocycles.isPending ? <LoadingCard label="Loading mesocycles..." /> : null}
      {mesocycles.isError ? <ErrorCard error={mesocycles.error} onRetry={() => mesocycles.refetch()} /> : null}

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl }}>
        {(mesocycles.data ?? []).map((meso) => {
          const start = new Date(meso.started_on).getTime();
          const end = meso.ended_on ? new Date(meso.ended_on).getTime() : start + (meso.weeks ?? 0) * 7 * 24 * 60 * 60 * 1000;
          const progress = end > start ? ((Date.now() - start) / (end - start)) * 100 : 0;
          return (
            <Pressable key={meso.id} onPress={() => navigation.navigate("MesocycleDetail", { id: String(meso.id) })}>
              <Card elevated accent="purple">
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: purpleColor }} />
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>{meso.name}</Text>
                    </View>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16, marginLeft: spacing.xl2, marginTop: spacing.sm }}>{meso.goal ?? "Training block"}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
                    <Tag label={meso.ended_on ? "Complete" : "Active"} color={meso.ended_on ? greenColor : purpleColor} />
                    <AppIcon name="chevron-right" size={14} color={faintColor} />
                  </View>
                </View>
                <View style={{ marginTop: spacing.xl2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16 }}>{meso.weeks ? `${meso.weeks} weeks` : "Open ended"}</Text>
                    <Text style={{ color: purpleColor, fontSize: 11, fontWeight: "700" }}>{Math.round(Math.max(0, Math.min(100, progress)))}%</Text>
                  </View>
                  <View style={{ marginTop: spacing.md }}>
                    <ProgressBar value={progress} color={purpleColor} />
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
        {!mesocycles.isPending && (mesocycles.data?.length ?? 0) === 0 ? (
          <EmptyCard title="No mesocycles yet" text="Create a block when you want advanced planning." />
        ) : null}
      </View>

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowCreateModal(false)} />
          <View style={{ backgroundColor: surfaceColor, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, borderWidth: 1, borderColor, paddingHorizontal: spacing.xl5, paddingTop: spacing.xl2, paddingBottom: spacing.xl6 }}>
            <View style={{ width: 40, height: 4, borderRadius: 4, alignSelf: "center", backgroundColor: faintColor, marginBottom: spacing.xl3 }} />
            <Text style={{ color: textColor, fontSize: 22, fontWeight: "900", textAlign: "center" }}>New Mesocycle</Text>

            <View style={{ marginTop: spacing.xl4 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Name</Text>
              <TextInput
                value={newMesoName}
                onChangeText={setNewMesoName}
                placeholder="e.g. Summer Strength Block"
                placeholderTextColor={faintColor}
                style={{ width: "100%", minHeight: 52, borderRadius: radii.input, backgroundColor: surface2Color, borderWidth: 1, borderColor, color: textColor, paddingHorizontal: 16, fontSize: 14 }}
                autoFocus
              />
            </View>

            <View style={{ marginTop: spacing.xl3 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Goal (optional)</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                {MESOCYCLE_GOALS.map((goal) => (
                  <Pressable
                    key={goal.value}
                    onPress={() => setNewMesoGoal(newMesoGoal === goal.value ? null : goal.value)}
                    style={{
                      paddingHorizontal: spacing.xl2,
                      paddingVertical: spacing.lg,
                      borderRadius: radii.input,
                      borderWidth: 1,
                      borderColor: newMesoGoal === goal.value ? "rgba(139,92,246,0.5)" : borderColor,
                      backgroundColor: newMesoGoal === goal.value ? "rgba(139,92,246,0.2)" : surface2Color,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: newMesoGoal === goal.value ? textColor : mutedColor }}>
                      {goal.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ marginTop: spacing.xl3 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Weeks (optional)</Text>
              <TextInput
                value={newMesoWeeks}
                onChangeText={setNewMesoWeeks}
                placeholder="e.g. 6"
                placeholderTextColor={faintColor}
                style={{ width: "100%", minHeight: 52, borderRadius: radii.input, backgroundColor: surface2Color, borderWidth: 1, borderColor, color: textColor, paddingHorizontal: 16, fontSize: 14 }}
                keyboardType="number-pad"
              />
            </View>

            <PrimaryButton
              label={createMeso.isPending ? "Creating..." : "Create"}
              onPress={() =>
                createMeso.mutate({
                  name: newMesoName || "New Mesocycle",
                  goal: newMesoGoal,
                  started_on: new Date().toISOString().slice(0, 10),
                  weeks: newMesoWeeks ? Number(newMesoWeeks) : null,
                })
              }
              disabled={createMeso.isPending}
              icon={<AppIcon name="check" size={16} color="#000000" />}
              style={{ marginTop: spacing.xl5 }}
            />
            <PrimaryButton label="Cancel" onPress={() => setShowCreateModal(false)} subtle style={{ marginTop: spacing.lg }} />

            {createMeso.isError ? (
              <Text style={{ color: redColor, fontSize: 12, marginTop: spacing.lg, textAlign: "center" }}>{getApiErrorMessage(createMeso.error)}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
