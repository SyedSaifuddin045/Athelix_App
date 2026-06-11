import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useMesocyclesQuery } from "../api/queries";
import { useCreateMesocycle } from "../api/mutations";
import { getApiErrorMessage } from "../api/client";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, LoadingCard, ErrorCard, EmptyCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { Tag, ProgressBar, SectionEyebrow } from "../components/ui/Indicators";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { successData } from "../utils/mapping";
import { MESOCYCLE_GOALS } from "../data";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MesocycleList"> };

export function MesocycleListScreen({ navigation }: Props) {
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

  return (
    <Screen>
      <BackHeader
        title="Mesocycles"
        subtitle="Block periodization planning"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={[styles.smallAccentButton, { backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.3)", flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.input }]}
          >
            <Icon name="plus" size={14} color={COLORS.purple} />
            <Text style={[styles.smallAccentText, { color: COLORS.purple }]}>New</Text>
          </Pressable>
        }
      />

      <View style={[styles.rowGap, { marginTop: SPACING.sm }]}>
        <Tag label="ADVANCED" color={COLORS.purple} />
      </View>

      <Card elevated accent="purple" style={{ marginTop: SPACING.xl3 }}>
        <View style={styles.rowGap}>
          <Icon name="trending-up" size={18} color={COLORS.purple} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.listRowTitle, { color: COLORS.purple }]}>Advanced Planning Mode</Text>
            <Text style={styles.detailLabel}>Mesocycles are optional training blocks.</Text>
          </View>
        </View>
      </Card>

      {mesocycles.isPending ? <LoadingCard label="Loading mesocycles..." /> : null}
      {mesocycles.isError ? <ErrorCard error={mesocycles.error} onRetry={() => mesocycles.refetch()} /> : null}

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl }}>
        {(mesocycles.data ?? []).map((meso) => {
          const start = new Date(meso.started_on).getTime();
          const end = meso.ended_on ? new Date(meso.ended_on).getTime() : start + (meso.weeks ?? 0) * 7 * 24 * 60 * 60 * 1000;
          const progress = end > start ? ((Date.now() - start) / (end - start)) * 100 : 0;
          return (
            <Pressable key={meso.id} onPress={() => navigation.navigate("MesocycleDetail", { id: String(meso.id) })}>
              <Card elevated accent="purple">
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowGap}>
                      <View style={[styles.statusDot, { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.purple }]} />
                      <Text style={styles.cardTitle}>{meso.name}</Text>
                    </View>
                    <Text style={[styles.detailLabel, { marginLeft: SPACING.xl2, marginTop: SPACING.sm }]}>{meso.goal ?? "Training block"}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: SPACING.sm }}>
                    <Tag label={meso.ended_on ? "Complete" : "Active"} color={meso.ended_on ? COLORS.green : COLORS.purple} />
                    <Icon name="chevron-right" size={14} color={COLORS.faint} />
                  </View>
                </View>
                <View style={{ marginTop: SPACING.xl2 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.detailLabel}>{meso.weeks ? `${meso.weeks} weeks` : "Open ended"}</Text>
                    <Text style={[styles.smallStrongText, { color: COLORS.purple }]}>{Math.round(Math.max(0, Math.min(100, progress)))}%</Text>
                  </View>
                  <View style={{ marginTop: SPACING.md }}>
                    <ProgressBar value={progress} color={COLORS.purple} />
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
        <View style={[styles.modalScrim, { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }]}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowCreateModal(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.xl5, paddingTop: SPACING.xl2, paddingBottom: SPACING.xl6 }]}>
            <View style={{ width: 40, height: 4, borderRadius: 4, alignSelf: "center", backgroundColor: COLORS.faint, marginBottom: SPACING.xl3 }} />
            <Text style={styles.sheetTitle}>New Mesocycle</Text>

            <View style={{ marginTop: SPACING.xl4 }}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                value={newMesoName}
                onChangeText={setNewMesoName}
                placeholder="e.g. Summer Strength Block"
                placeholderTextColor={COLORS.faint}
                style={[styles.input, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
                autoFocus
              />
            </View>

            <View style={{ marginTop: SPACING.xl3 }}>
              <Text style={styles.fieldLabel}>Goal (optional)</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.md }}>
                {MESOCYCLE_GOALS.map((goal) => (
                  <Pressable
                    key={goal.value}
                    onPress={() => setNewMesoGoal(newMesoGoal === goal.value ? null : goal.value)}
                    style={[
                      styles.chipButton,
                      {
                        paddingHorizontal: SPACING.xl2,
                        paddingVertical: SPACING.lg,
                        borderRadius: RADIUS.input,
                        borderWidth: 1,
                        borderColor: newMesoGoal === goal.value ? "rgba(139,92,246,0.5)" : COLORS.border,
                        backgroundColor: newMesoGoal === goal.value ? "rgba(139,92,246,0.2)" : COLORS.cardSoft,
                      },
                    ]}
                  >
                    <Text style={[styles.chipButtonText, newMesoGoal === goal.value ? { color: COLORS.text } : { color: COLORS.muted }]}>
                      {goal.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ marginTop: SPACING.xl3 }}>
              <Text style={styles.fieldLabel}>Weeks (optional)</Text>
              <TextInput
                value={newMesoWeeks}
                onChangeText={setNewMesoWeeks}
                placeholder="e.g. 6"
                placeholderTextColor={COLORS.faint}
                style={[styles.input, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
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
              icon={<Icon name="check" size={16} color="#000000" />}
              style={{ marginTop: SPACING.xl5 }}
            />
            <PrimaryButton label="Cancel" onPress={() => setShowCreateModal(false)} subtle style={{ marginTop: SPACING.lg }} />

            {createMeso.isError ? (
              <Text style={[styles.errorText, { marginTop: SPACING.lg, textAlign: "center" }]}>{getApiErrorMessage(createMeso.error)}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
