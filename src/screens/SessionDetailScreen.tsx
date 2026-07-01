import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useSessionDetailQuery, useExercisesQuery } from "../api/queries";
import { updateWorkoutSessionWorkoutSessionsSessionIdPatch, deleteWorkoutSessionWorkoutSessionsSessionIdDelete } from "../api/endpoints/workout-sessions/workout-sessions";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton, RoundButton, IconButton } from "../components/ui/Button";
import { Tag } from "../components/ui/Indicators";
import { DetailStat } from "../components/ui/Stats";
import { ConfirmDialog } from "../components/ui/Modal";
import { AppIcon } from "../design-system/icons/AppIcon";
import type { IconName } from "../components/ui/Icon";
import { exerciseLookup, groupSetsByExercise } from "../utils/mapping";
import { workoutTitle, muscleAccentColor } from "../utils/display";
import { formatDateLabel, formatVolume, formatKg, formatCalories, formatDurationSec, formatDistanceM } from "../utils/format";
import { toNumberId } from "../utils/helpers";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SessionDetail">;
  route: RouteProp<RootStackParamList, "SessionDetail">;
};

function setCalories(set: { calories_burned?: number | null; duration_sec?: number | null; distance_m?: number | null }): number {
  if (set.calories_burned) return set.calories_burned;
  if (set.duration_sec) return Math.round(5 * 80 * (set.duration_sec / 3600));
  if (set.distance_m) return Math.round(1.036 * 80 * (set.distance_m / 1000));
  return 0;
}

const MOOD_ICONS: Record<string, IconName> = {
  Tired: "sleep",
  Okay: "meh",
  Good: "smile",
  Strong: "zap",
  Beast: "flame",
};

export function SessionDetailScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const queryClient = useQueryClient();
  const sessionId = toNumberId(route?.params?.id);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const detail = useSessionDetailQuery(sessionId, isAuthenticated);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);
  const exerciseGroups = useMemo(() => groupSetsByExercise(detail.data?.sets ?? [], lookup), [detail.data?.sets, lookup]);
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const goldColor = theme.colorGold?.get() ?? "#FBBF24";
  const redColor = theme.colorRed?.get() ?? "#EF4444";
  const orangeColor = theme.colorOrange?.get() ?? "#F59E0B";
  const surfaceColor = theme.surface?.get() ?? "#0D0D0D";
  const surfaceHover = theme.surfaceHover?.get() ?? "rgba(255,255,255,0.06)";

  const confirmDelete = async () => {
    if (!sessionId) return;
    try {
      await deleteWorkoutSessionWorkoutSessionsSessionIdDelete(sessionId);
      queryClient.removeQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      setShowDeleteConfirm(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", getApiErrorMessage(err));
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (!detail.data) return;
    setEditName(detail.data.name ?? "");
    setEditMood(detail.data.mood ?? "");
    setEditNotes(detail.data.notes ?? "");
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!sessionId) return;
    try {
      await updateWorkoutSessionWorkoutSessionsSessionIdPatch(sessionId, {
        name: editName || null,
        mood: editMood || null,
        notes: editNotes || null,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      setShowEdit(false);
    } catch (err) {
      Alert.alert("Error", getApiErrorMessage(err));
    }
  };

  if (detail.isPending || lookupQuery.isPending) {
    return (
      <Screen>
        <BackHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading session..." />
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen>
        <BackHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <ErrorCard error={detail.error} onRetry={() => detail.refetch()} />
      </Screen>
    );
  }

  const session = detail.data;
  const moodIcon = session.mood ? MOOD_ICONS[session.mood] : null;

  return (
    <Screen>
      <BackHeader
        title="Session Detail"
        onBack={() => navigation.goBack()}
        right={
          <RoundButton onPress={() => setShowMenu((v) => !v)}>
            <View style={{ opacity: 0.7 }}><AppIcon name="more-horizontal" size={16} color={textColor} /></View>
          </RoundButton>
        }
      />

      <View style={{ marginTop: spacing.xl3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {moodIcon ? (
              <View style={{ width: 44, height: 44, borderRadius: radii.iconWrap, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }}>
                <AppIcon name={moodIcon} size={22} color={accent} />
              </View>
            ) : (
              <View style={{ width: 44, height: 44, borderRadius: radii.iconWrap, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="check" size={22} color={accent} />
              </View>
            )}
            <View>
              <Text style={{ color: textColor, fontSize: 21, fontWeight: "900" }}>{workoutTitle(session)}</Text>
              <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>{formatDateLabel(session.started_at)}</Text>
            </View>
          </View>
          {(session.prs_count ?? 0) > 0 ? <Tag label={`${session.prs_count} PR!`} color={goldColor} /> : null}
        </View>
        <View style={[{ flexDirection: "row", gap: spacing.xl, marginTop: spacing.xl2 }]}>
          <DetailStat icon="clock" value={`${session.duration_minutes ?? 0}m`} label="Duration" color={accent} />
          <DetailStat icon="list-checks" value={String(session.total_sets ?? session.sets.length)} label="Sets" color={accent} />
          <DetailStat icon="gauge" value={formatVolume(session.total_volume)} label="Volume" color={accent} />
          {(() => {
            const fromSets = session.sets.reduce((s, set) => s + setCalories(set), 0);
            const totalCal = fromSets || (session.calories_burned ?? 0);
            return totalCal > 0 ? <DetailStat icon="flame" value={formatCalories(totalCal)} label="Calories" color="#FF5A36" /> : null;
          })()}
        </View>
      </View>

      <View style={{ gap: spacing.xl, marginTop: spacing.xl3 }}>
        {exerciseGroups.map((exercise) => {
          const isCardioEx = lookup.get(exercise.exerciseId)?.exercise_category === "cardio";
          const exCalories = exercise.sets.reduce((sum, s) => sum + setCalories(s), 0);
          return (
          <Card key={exercise.name} elevated style={{ paddingHorizontal: spacing.xl3, paddingVertical: 0 }}>
            <View style={[{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }, { flexDirection: "row", alignItems: "center", gap: spacing.xl, paddingVertical: spacing.xl2, borderBottomWidth: 1, borderBottomColor: borderColor }]}>
              <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: muscleAccentColor(lookup.get(exercise.exerciseId)?.target ?? lookup.get(exercise.exerciseId)?.body_part) ?? accent }} />
              <Text style={[{ color: textColor, fontSize: 13, fontWeight: "700" }, { flex: 1, fontSize: 14 }]}>{exercise.name}</Text>
              {exCalories > 0 ? <Tag label={`${formatCalories(exCalories)} kcal`} color="#FF5A36" /> : null}
              {exercise.sets.some((set) => set.is_pr) ? <Tag label="PR" color={goldColor} /> : null}
            </View>
            <View style={{ paddingVertical: spacing.xl2 }}>
              <View style={[{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }, { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }]}>
                {(isCardioEx ? ["Set", "Time", "km", "RPE", "kcal"] : ["Set", "kg", "Reps", "RPE"]).map((label) => (
                  <Text key={label} style={[{ flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 }, { flex: 1, color: faintColor, fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center" }]}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={{ gap: spacing.md }}>
                {exercise.sets.map((set) => (
                  <View key={set.id} style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, { flexDirection: "row", alignItems: "center", gap: spacing.md }]}>
                    <Text style={[{ color: textColor, fontSize: 11, fontWeight: "700" }, { width: 28, textAlign: "center", color: set.set_type === "warmup" ? orangeColor : mutedColor }]}>
                      {set.set_type === "warmup" ? "W" : set.set_number}
                    </Text>
                    {isCardioEx ? (
                      <>
                        <View style={[{ flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }, { flex: 1, minHeight: 34, borderRadius: radii.stepper, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }]}>
                          <Text style={[{ color: textColor, fontSize: 12, fontWeight: "700" }]}>{formatDurationSec(set.duration_sec)}</Text>
                        </View>
                        <View style={[{ flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }, { flex: 1, minHeight: 34, borderRadius: radii.stepper, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }]}>
                          <Text style={[{ color: textColor, fontSize: 12, fontWeight: "700" }]}>{formatDistanceM(set.distance_m)}</Text>
                        </View>
                        <View style={[{ flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }, { flex: 1, minHeight: 34, borderRadius: radii.stepper, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }]}>
                          <Text style={[{ color: textColor, fontSize: 12, fontWeight: "700" }]}>{set.rpe ?? "-"}</Text>
                        </View>
                        <View style={[{ flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }, { flex: 1, minHeight: 34, borderRadius: radii.stepper, backgroundColor: "rgba(255,90,54,0.1)", alignItems: "center", justifyContent: "center" }]}>
                          <Text style={[{ color: textColor, fontSize: 12, fontWeight: "700" }, { color: "#FF5A36", fontSize: 11, fontWeight: "700" }]}>{formatCalories(setCalories(set))}</Text>
                        </View>
                      </>
                    ) : (
                      [formatKg(set.weight_kg, ""), set.reps ?? "-", set.rpe ?? "-"].map((value, index) => (
                        <View key={`${set.id}-${index}`} style={[{ flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }, { flex: 1, minHeight: 34, borderRadius: radii.stepper, backgroundColor: surfaceHover, alignItems: "center", justifyContent: "center" }]}>
                          <Text style={[{ color: textColor, fontSize: 12, fontWeight: "700" }]}>{value}</Text>
                        </View>
                      ))
                    )}
                  </View>
                ))}
              </View>
            </View>
          </Card>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.xl5, marginBottom: spacing.xl7 }}>
        <PrimaryButton label="Done" onPress={() => navigation.goBack()} icon={<AppIcon name="check" size={18} color="#000000" />} />
      </View>

      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={[{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }]}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowEdit(false)} />
          <View style={[{ backgroundColor: "#111d1b", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 24, paddingTop: 14, paddingBottom: 26 }, { backgroundColor: surfaceColor, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, borderWidth: 1, borderColor: borderColor, paddingHorizontal: spacing.xl5, paddingTop: spacing.xl2, paddingBottom: spacing.xl6 }]}>
            <View style={{ width: 40, height: 4, borderRadius: 4, alignSelf: "center", backgroundColor: faintColor, marginBottom: spacing.xl3 }} />
            <Text style={{ color: textColor, fontSize: 22, fontWeight: "900", textAlign: "center" }}>Edit Session</Text>
            <View style={{ marginTop: spacing.xl3, gap: spacing.xl2 }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Workout Name</Text>
                <TextInput
                  style={[{ width: "100%", minHeight: 80, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: textColor, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, textAlignVertical: "top" }, { backgroundColor: surfaceHover, borderColor: borderColor, color: textColor, borderRadius: radii.input }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Workout name"
                  placeholderTextColor={faintColor}
                  multiline
                />
              </View>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Mood</Text>
                <TextInput
                  style={[{ width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: textColor, paddingHorizontal: 16, fontSize: 14 }, { backgroundColor: surfaceHover, borderColor: borderColor, color: textColor, borderRadius: radii.input }]}
                  value={editMood}
                  onChangeText={setEditMood}
                  placeholder="Tired, Okay, Good, Strong, Beast"
                  placeholderTextColor={faintColor}
                />
              </View>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Notes</Text>
                <TextInput
                  style={[{ width: "100%", minHeight: 80, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: textColor, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, textAlignVertical: "top" }, { backgroundColor: surfaceHover, borderColor: borderColor, color: textColor, borderRadius: radii.input }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Add notes..."
                  placeholderTextColor={faintColor}
                  multiline
                />
              </View>
            </View>
            <PrimaryButton label="Save Changes" onPress={() => void saveEdit()} icon={<AppIcon name="check" size={16} color="#000000" />} style={{ marginTop: spacing.xl3 }} />
            <PrimaryButton label="Cancel" onPress={() => setShowEdit(false)} subtle style={{ marginTop: spacing.lg }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={[{ flex: 1, justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 60, paddingRight: 20 }, { flex: 1, justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 60, paddingRight: spacing.xl4 }]} onPress={() => setShowMenu(false)}>
          <View style={[{ width: 170, borderRadius: 18, backgroundColor: "#111d1b", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingVertical: 6 }, { width: 170, borderRadius: radii.cardSmall, backgroundColor: surfaceColor, borderWidth: 1, borderColor: borderColor, paddingVertical: spacing.sm }]}>
            <Pressable style={[{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 }, { flexDirection: "row", alignItems: "center", gap: spacing.lg, paddingHorizontal: spacing.xl2, paddingVertical: spacing.xl }]} onPress={handleEdit} hitSlop={12}>
              <AppIcon name="pencil" size={14} color={mutedColor} />
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Edit session</Text>
            </Pressable>
            <Pressable style={[{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 }, { flexDirection: "row", alignItems: "center", gap: spacing.lg, paddingHorizontal: spacing.xl2, paddingVertical: spacing.xl }]} onPress={handleDelete} hitSlop={12}>
              <AppIcon name="trash-2" size={14} color={redColor} />
              <Text style={[{ color: "rgba(255,255,255,0.75)", fontSize: 13 }, { color: redColor }]}>Delete session</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Session"
          message="This will permanently delete this workout session and recalculate PRs."
          confirmLabel="Delete"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </Screen>
  );
}
