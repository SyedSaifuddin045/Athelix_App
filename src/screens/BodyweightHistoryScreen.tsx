import { useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useBodyWeightLogsQuery } from "../api/queries";
import { useCreateBodyWeightLog, useDeleteBodyWeightLog } from "../api/mutations";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton, IconButton } from "../components/ui/Button";
import { SectionEyebrow, Tag } from "../components/ui/Indicators";
import { TrendChart } from "../components/ui/Charts";
import { AppIcon } from "../design-system/icons/AppIcon";
import { formatDateLabel, formatKg, formatShortDate } from "../utils/format";
import { getApiErrorMessage } from "../api/client";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "BodyweightHistory"> };

export function BodyweightHistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const logs = useBodyWeightLogsQuery(isAuthenticated);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");

  const entries = useMemo(
    () => (logs.data ?? []).slice().sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()),
    [logs.data],
  );

  const chartData = useMemo(
    () =>
      entries
        .slice()
        .reverse()
        .map((entry) => ({ label: formatShortDate(entry.logged_at), value: entry.weight_kg })),
    [entries],
  );

  const latest = entries[0]?.weight_kg ?? 0;
  const previous = entries[1]?.weight_kg ?? latest;
  const change = latest - previous;

  const createLog = useCreateBodyWeightLog({
    onSuccess: () => {
      setNewWeight("");
      setNewNote("");
      setShowAdd(false);
    },
  });

  const deleteLog = useDeleteBodyWeightLog();

  const addEntry = () => {
    if (!newWeight) return;
    createLog.mutate({
      weight_kg: Number(newWeight),
      logged_at: new Date().toISOString().split("T")[0],
      notes: newNote || null,
    });
  };

  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const accent = theme.accent?.get() ?? "#FF5A36";

  return (
    <Screen>
      <BackHeader
        title="Bodyweight"
        onBack={() => navigation.goBack()}
        right={
          <IconButton icon="plus" onPress={() => setShowAdd(true)} color={accent} />
        }
      />

      <View style={{ marginTop: spacing.xl3 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}>
          <Text style={{ color: textColor, fontSize: 40, fontWeight: "900" }}>
            {latest ? latest.toFixed(1) : "-"}
          </Text>
          <Text style={{ color: mutedColor, fontSize: 13 }}>kg</Text>
          {entries.length > 1 ? (
            <Text style={{ color: mutedColor, fontSize: 11, fontWeight: "700" }}>
              <AppIcon name={change < 0 ? "trending-down" : "trending-up"} size={12} color={mutedColor} />
              {" "}{Math.abs(change).toFixed(1)} kg
            </Text>
          ) : null}
        </View>
        <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>
          {entries.length > 1 ? `vs. previous entry (${previous} kg)` : "Add entries to track change"}
        </Text>
      </View>

      {chartData.length > 0 ? (
        <Card elevated style={{ marginTop: spacing.xl3 }}>
          <TrendChart
            segments={[chartData]}
            height={128}
            color={accent}
          />
        </Card>
      ) : null}

      {logs.isPending ? <LoadingCard label="Loading bodyweight logs..." /> : null}
      {logs.isError ? <ErrorCard error={logs.error} onRetry={() => logs.refetch()} /> : null}

      <View style={{ marginTop: spacing.xl3 }}>
        <SectionEyebrow>All Entries</SectionEyebrow>
        <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
          {entries.map((entry, index) => (
            <Card key={entry.id} elevated style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <Text style={{ color: index === 0 ? accent : textColor, fontSize: 15, fontWeight: "800" }}>
                    {formatKg(entry.weight_kg)}
                  </Text>
                  {index === 0 ? <Tag label="Latest" color={accent} /> : null}
                  {index > 0 ? (
                    <Text style={{ color: entry.weight_kg < entries[index - 1].weight_kg ? (theme.colorGreen?.get() ?? "#22C55E") : (theme.colorRed?.get() ?? "#EF4444"), fontSize: 11, fontWeight: "700" }}>
                      <AppIcon name={entry.weight_kg < entries[index - 1].weight_kg ? "trending-down" : "trending-up"} size={10} color={entry.weight_kg < entries[index - 1].weight_kg ? (theme.colorGreen?.get() ?? "#22C55E") : (theme.colorRed?.get() ?? "#EF4444")} />
                      {" "}{Math.abs(entry.weight_kg - entries[index - 1].weight_kg).toFixed(1)}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>
                  {formatDateLabel(entry.logged_at)}
                  {entry.notes ? ` - ${entry.notes}` : ""}
                </Text>
              </View>
              <Pressable onPress={() => deleteLog.mutate(entry.id)} style={{ width: 32, height: 32, borderRadius: radii.stepper, backgroundColor: theme.colorRedDark?.get(), alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="trash-2" size={13} color={theme.colorRed?.get() ?? "#EF4444"} />
              </Pressable>
            </Card>
          ))}
          {!logs.isPending && entries.length === 0 ? (
            <EmptyCard title="No entries yet" text="Log your first bodyweight entry." />
          ) : null}
        </View>
      </View>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAdd(false)} />
          <View style={{ backgroundColor: theme.surface?.get(), borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, borderWidth: 1, borderColor: theme.borderColor?.get(), paddingHorizontal: spacing.xl5, paddingTop: spacing.xl2, paddingBottom: spacing.xl6 }}>
            <View style={{ width: 40, height: 4, borderRadius: 4, alignSelf: "center", backgroundColor: theme.colorFaint?.get(), marginBottom: spacing.xl3 }} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: textColor, fontSize: 22, fontWeight: "900", textAlign: "center" }}>Log Bodyweight</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <AppIcon name="x" size={18} color={mutedColor} />
              </Pressable>
            </View>
            <View style={{ marginTop: spacing.xl3 }}>
              <Text style={{ color: mutedColor, fontSize: 11, fontWeight: "700", marginBottom: spacing.sm, letterSpacing: 0.4, textTransform: "uppercase" }}>Weight (kg)</Text>
              <TextInput
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="e.g. 82.5"
                placeholderTextColor={theme.colorFaint?.get()}
                style={{
                  width: "100%",
                  minHeight: 70,
                  borderRadius: radii.input,
                  backgroundColor: theme.surface2?.get(),
                  borderWidth: 1,
                  borderColor: theme.borderColor?.get(),
                  color: textColor,
                  fontSize: 28,
                  fontWeight: "900",
                  textAlign: "center",
                }}
                keyboardType="decimal-pad"
                contextMenuHidden
              />
            </View>
            <View style={{ marginTop: spacing.xl3 }}>
              <Text style={{ color: mutedColor, fontSize: 11, fontWeight: "700", marginBottom: spacing.sm, letterSpacing: 0.4, textTransform: "uppercase" }}>Note (optional)</Text>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="e.g. Morning, fasted"
                placeholderTextColor={theme.colorFaint?.get()}
                style={{
                  width: "100%",
                  minHeight: 52,
                  borderRadius: radii.input,
                  backgroundColor: theme.surface2?.get(),
                  borderWidth: 1,
                  borderColor: theme.borderColor?.get(),
                  color: textColor,
                  paddingHorizontal: spacing.xl3,
                  fontSize: 14,
                }}
              />
            </View>
            <PrimaryButton
              label={createLog.isPending ? "Saving..." : "Save Entry"}
              onPress={addEntry}
              disabled={createLog.isPending}
              icon={<AppIcon name="check" size={16} color="#000000" />}
              style={{ marginTop: spacing.xl4 }}
            />
            {createLog.isError ? (
              <Text style={{ color: theme.colorRed?.get() ?? "#EF4444", fontSize: 12, marginTop: spacing.lg }}>{getApiErrorMessage(createLog.error)}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
