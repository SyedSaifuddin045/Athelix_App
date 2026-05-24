import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  LayoutAnimation,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { QueryClientProvider, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DIFFICULTY_COLORS,
  EXERCISE_DETAILS,
  EXERCISE_EQUIPMENT,
  EXERCISE_FALLBACK,
  EXERCISE_MUSCLES,
  EXERCISE_PROGRESS_PERIODS,
  FITNESS_LEVELS,
  GENDERS,
  GOALS,
  MESOCYCLE_GOALS,
  MUSCLE_PERIODS,
  PROGRESS_SECTIONS,
  RECORD_TYPES,
  TRAIN_SECTIONS,
  UNITS,
  type ExerciseDetail,
  type ExerciseItem,
  type TemplateExercise,
  type WorkoutExercise,
  type WorkoutSet,
} from "./src/data";
import { installApiFetchInterceptor, getApiErrorMessage, getFieldError } from "./src/api/client";
import { queryClient } from "./src/api/queryClient";
import { queryKeys } from "./src/api/queryKeys";
import {
  useAppConfigQuery,
  useBodyWeightLogsQuery,
  useCurrentUserQuery,
  useExerciseDetailQuery,
  useExerciseFiltersQuery,
  useExerciseProgressQuery,
  useExercisesQuery,
  useMesocycleAnalyticsQuery,
  useMesocycleDetailQuery,
  useMesocyclesQuery,
  useMuscleBalanceQuery,
  useOverviewQuery,
  usePersonalRecordsQuery,
  useProfileQuery,
  useSessionDetailQuery,
  useSessionsQuery,
  useTemplateDetailQuery,
  useTemplatesQuery,
} from "./src/api/queries";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { ExercisePicker } from "./src/components/ExercisePicker";
import {
  createBodyWeightLogUsersMeBodyWeightLogsPost,
  deleteBodyWeightLogUsersMeBodyWeightLogsLogIdDelete,
  updateCurrentUserUsersMePatch,
  upsertCurrentUserProfileUsersMeProfilePut,
} from "./src/api/endpoints/users/users";
import {
  createWorkoutTemplateWorkoutTemplatesPost,
  deleteTemplateExerciseWorkoutTemplatesTemplateIdExercisesTemplateExerciseIdDelete,
  deleteWorkoutTemplateWorkoutTemplatesTemplateIdDelete,
  createTemplateExerciseWorkoutTemplatesTemplateIdExercisesPost,
  updateWorkoutTemplateWorkoutTemplatesTemplateIdPatch,
  updateTemplateExerciseWorkoutTemplatesTemplateIdExercisesTemplateExerciseIdPatch,
} from "./src/api/endpoints/workout-templates/workout-templates";
import {
  createExerciseSetWorkoutSessionsSessionIdSetsPost,
  createWorkoutSessionWorkoutSessionsPost,
  deleteExerciseSetWorkoutSessionsSessionIdSetsSetIdDelete,
  deleteWorkoutSessionWorkoutSessionsSessionIdDelete,
  updateExerciseSetWorkoutSessionsSessionIdSetsSetIdPatch,
  updateWorkoutSessionWorkoutSessionsSessionIdPatch,
} from "./src/api/endpoints/workout-sessions/workout-sessions";
import {
  createMesocycleMesocyclesPost,
  deleteMesocycleMesocyclesMesocycleIdDelete,
} from "./src/api/endpoints/mesocycles/mesocycles";
import type {
  ExerciseDetailResponse,
  ExerciseResponse,
  ExerciseSetResponse,
  PersonalRecordResponse,
  UserProfileResponse,
  UserResponse,
  WorkoutSessionDetailResponse,
  WorkoutSessionResponse,
  WorkoutTemplateDetailResponse,
  WorkoutTemplateResponse,
} from "./src/api/model";

installApiFetchInterceptor();

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  ExerciseDetail: { id: string };
  TemplateList: undefined;
  TemplateBuilder: { id?: string };
  StartWorkout: { id?: string };
  ActiveWorkout: { sessionId?: number; templateId?: string; mesocycleId?: string | null } | undefined;
  WorkoutHistory: undefined;
  SessionDetail: { id: string };
  MesocycleList: undefined;
  MesocycleDetail: { id: string };
  PersonalRecords: undefined;
  ExerciseProgress: { id?: string };
  MuscleBalance: { mesocycleId?: number } | undefined;
  BodyweightHistory: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Train: undefined;
  Progress: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const COLORS = {
  root: "#040707",
  screen: "#080e0e",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.42)",
  faint: "rgba(255,255,255,0.28)",
  border: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.04)",
  cardSoft: "rgba(255,255,255,0.06)",
  teal: "#00d4a8",
  green: "#22c55e",
  gold: "#fbbf24",
  orange: "#f59e0b",
  red: "#f87171",
  purple: "#8b5cf6",
  blue: "#3b82f6",
};

function shadow(color: string) {
  return {
    shadowColor: color,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  } as const;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
}

function getMuscleStatus(sets: number, target: number) {
  const ratio = sets / target;
  if (ratio >= 1.1) return { label: "Over", color: COLORS.green };
  if (ratio >= 0.85) return { label: "On track", color: COLORS.teal };
  if (ratio >= 0.6) return { label: "Under", color: COLORS.orange };
  return { label: "Low", color: "#ef4444" };
}

type TemplateDraftExercise = TemplateExercise & {
  exerciseId: string;
  templateExerciseId?: number;
  setCount: number;
};

type WorkoutDraftSet = WorkoutSet & {
  serverId?: number;
};

type WorkoutDraftExercise = Omit<WorkoutExercise, "sets"> & {
  exerciseId: string;
  sets: WorkoutDraftSet[];
};

function toNumberId(id?: string | number | null) {
  if (typeof id === "number") return Number.isFinite(id) ? id : null;
  if (!id) return null;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rpeError(value: string): string | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "RPE must be a number";
  if (parsed < 1 || parsed > 10) return "RPE must be between 1 and 10";
  return null;
}

function parseRestSeconds(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes(":")) {
    const [minutes, seconds] = trimmed.split(":").map((item) => Number(item));
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) return minutes * 60 + seconds;
  }
  const minutes = Number(trimmed);
  return Number.isFinite(minutes) ? Math.round(minutes * 60) : null;
}

function formatCompactNumber(value?: number | null) {
  if (value == null) return "0";
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

function formatKg(value?: number | null, suffix = "kg") {
  if (value == null) return "-";
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return suffix ? `${rounded} ${suffix}` : rounded;
}

function formatVolume(value?: number | null) {
  if (value == null) return "0 kg";
  return `${formatCompactNumber(value)} kg`;
}

function formatDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeLabel(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function displayName(user?: UserResponse | null, profile?: UserProfileResponse | null) {
  return profile?.display_name || user?.username || "Athlete";
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AT";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function exerciseEmoji(exercise?: Pick<ExerciseResponse, "body_part" | "target"> | ExerciseDetailResponse | null) {
  const key = `${exercise?.target ?? ""} ${exercise?.body_part ?? ""}`.toLowerCase();
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring") || key.includes("glute")) return "🦵";
  if (key.includes("chest") || key.includes("shoulder")) return "🏋️";
  if (key.includes("back") || key.includes("lat")) return "💪";
  return "💪";
}

function mapExerciseItem(exercise: ExerciseResponse): ExerciseItem {
  return {
    id: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.target ?? exercise.body_part ?? "Unknown",
    equipment: exercise.equipment ?? "Unknown",
    difficulty: "Intermediate",
    emoji: exerciseEmoji(exercise),
  };
}

function mapExerciseDetail(exercise: ExerciseDetailResponse): ExerciseDetail {
  return {
    name: exercise.name,
    emoji: exerciseEmoji(exercise),
    primaryMuscle: exercise.target ?? exercise.body_part ?? "Unknown",
    secondaryMuscles: exercise.secondary_muscles.map((item) => item.muscle),
    equipment: exercise.equipment ?? "Unknown",
    difficulty: "Intermediate",
    category: exercise.body_part ?? "Exercise",
    instructions: exercise.instructions
      .slice()
      .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
      .map((item) => item.instruction)
      .filter((item): item is string => !!item),
    tips: [],
  };
}

function exerciseLookup(items?: ExerciseResponse[]) {
  return new Map((items ?? []).map((item) => [item.id, item]));
}

function nameForExercise(id: string, lookup: Map<string, ExerciseResponse>) {
  return lookup.get(id)?.name ?? id;
}

function workoutTitle(session?: WorkoutSessionResponse | WorkoutSessionDetailResponse | null) {
  return session?.name || (session?.is_completed ? "Completed Workout" : "Workout");
}

function templateDraftFromDetail(detail: WorkoutTemplateDetailResponse, lookup: Map<string, ExerciseResponse>): TemplateDraftExercise[] {
  return detail.exercises
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      id: String(item.id),
      templateExerciseId: item.id,
      exerciseId: item.exercise_id,
      name: item.exercise_name ?? nameForExercise(item.exercise_id, lookup),
      emoji: exerciseEmoji(lookup.get(item.exercise_id)),
      notes: item.notes ?? "",
      setCount: Math.max(1, item.target_sets ?? 1),
      sets: [{
        reps: item.target_reps ? String(item.target_reps) : "8",
        rpe: item.target_rpe ? String(item.target_rpe) : "7",
        rest: item.rest_seconds ? String(Math.round(item.rest_seconds / 60)) : "2",
      }],
    }));
}

function workoutDraftFromTemplate(detail: WorkoutTemplateDetailResponse, lookup: Map<string, ExerciseResponse>): WorkoutDraftExercise[] {
  return detail.exercises
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => {
      const totalSets = Math.max(1, item.target_sets ?? 1);
      return {
        id: String(item.id),
        exerciseId: item.exercise_id,
        name: nameForExercise(item.exercise_id, lookup),
        emoji: exerciseEmoji(lookup.get(item.exercise_id)),
        notes: item.notes ?? "",
        sets: Array.from({ length: totalSets }, (_, index) => ({
          id: `${item.id}-${index + 1}`,
          weight: "",
          reps: item.target_reps ? String(item.target_reps) : "8",
          rpe: item.target_rpe ? String(item.target_rpe) : "",
          done: false,
          warmup: false,
        })),
      };
    });
}

function groupSetsByExercise(sets: ExerciseSetResponse[], lookup: Map<string, ExerciseResponse>) {
  const groups = new Map<string, { exerciseId: string; name: string; emoji: string; sets: ExerciseSetResponse[] }>();
  sets.forEach((set) => {
    const current =
      groups.get(set.exercise_id) ??
      {
        exerciseId: set.exercise_id,
        name: nameForExercise(set.exercise_id, lookup),
        emoji: exerciseEmoji(lookup.get(set.exercise_id)),
        sets: [],
      };
    current.sets.push(set);
    groups.set(set.exercise_id, current);
  });
  return Array.from(groups.values());
}

function recordValue(record: PersonalRecordResponse) {
  const type = record.record_type.toLowerCase();
  if (type.includes("weight") || type.includes("1rm") || type.includes("e1rm")) return formatKg(record.value);
  return String(Math.round(record.value));
}

type SuccessData<TResponse> = Extract<TResponse, { status: 200 | 201 | 204 }> extends { data: infer TData } ? TData : never;

function successData<TResponse extends { status: number; data: unknown }>(response: TResponse): SuccessData<TResponse> {
  return response.data as SuccessData<TResponse>;
}

function Glow({ color }: { color: string }) {
  return <View pointerEvents="none" style={[styles.glow, { backgroundColor: color }]} />;
}

function Screen({
  children,
  glowColor = "rgba(0,180,140,0.18)",
  scroll = true,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  glowColor?: string;
  scroll?: boolean;
  contentContainerStyle?: object;
}) {
  if (!scroll) {
    return (
      <View style={styles.screen}>
        <Glow color={glowColor} />
        <View style={[styles.flexFill, contentContainerStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Glow color={glowColor} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function BackHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        {onBack ? (
          <RoundButton onPress={onBack}>
            <Feather name="arrow-left" size={16} color={COLORS.text} />
          </RoundButton>
        ) : null}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ? <View>{right}</View> : <View style={{ width: 36 }} />}
    </View>
  );
}

function RoundButton({
  children,
  onPress,
  accent,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.roundButton,
        accent
          ? { backgroundColor: "rgba(0,212,168,0.16)", borderColor: "rgba(0,212,168,0.32)" }
          : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object | object[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionEyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.sectionEyebrow, color ? { color } : null]}>{children}</Text>;
}

function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
  subtle,
}: {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: object | object[];
  subtle?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.primaryButton,
        subtle
          ? { backgroundColor: COLORS.cardSoft, borderWidth: 1, borderColor: COLORS.border, shadowOpacity: 0 }
          : shadow(COLORS.teal),
        disabled ? { opacity: 0.6 } : null,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.primaryButtonText, subtle ? { color: "rgba(255,255,255,0.7)" } : null]}>{label}</Text>
    </Pressable>
  );
}

function LoadingCard({ label = "Loading..." }: { label?: string }) {
  return (
    <Card style={{ alignItems: "center", gap: 10, marginTop: 18 }}>
      <ActivityIndicator color={COLORS.teal} />
      <Text style={styles.detailLabel}>{label}</Text>
    </Card>
  );
}

function ErrorCard({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Card style={{ marginTop: 18, borderColor: "rgba(239,68,68,0.24)", backgroundColor: "rgba(239,68,68,0.08)" }}>
      <Text style={[styles.listRowTitle, { color: COLORS.red }]}>Could not load data</Text>
      <Text style={[styles.detailLabel, { marginTop: 6 }]}>{getApiErrorMessage(error)}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={[styles.smallAccentButton, { alignSelf: "flex-start", marginTop: 12 }]}>
          <Feather name="refresh-cw" size={13} color={COLORS.teal} />
          <Text style={styles.smallAccentText}>Retry</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>-</Text>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.confirmBackdrop} onPress={onCancel}>
        <View style={styles.confirmDialog}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmButtons}>
            <Pressable onPress={onCancel} style={styles.confirmButtonCancel}>
              <Text style={styles.confirmButtonText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.confirmButtonConfirm, destructive ? { backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.3)" } : null]}
            >
              <Text style={[styles.confirmButtonText, destructive ? { color: COLORS.red } : null]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function Tag({
  label,
  color = COLORS.teal,
  backgroundColor,
}: {
  label: string;
  color?: string;
  backgroundColor?: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: backgroundColor ?? `${color}24` }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({
  value,
  color = COLORS.teal,
  backgroundColor = "rgba(255,255,255,0.08)",
  height = 6,
}: {
  value: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.progressTrack, { backgroundColor, height }]}>
      <View style={[styles.progressFill, { width: `${safeValue}%`, backgroundColor: color }]} />
    </View>
  );
}

function VerticalBars({
  data,
  height = 80,
  activeColor = COLORS.teal,
  mutedColor = "rgba(255,255,255,0.18)",
}: {
  data: { label?: string; day?: string; value: number; highlight?: boolean }[];
  height?: number;
  activeColor?: string;
  mutedColor?: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={{ height: height + 20 }}>
      <View style={[styles.barRow, { height }]}>
        {data.map((item, index) => {
          const barHeight = item.value === 0 ? 6 : Math.max(14, (item.value / max) * (height - 8));
          const isActive = item.highlight ?? index === data.length - 1;
          return (
            <View key={`${item.label ?? item.day}-${index}`} style={styles.barColumn}>
              <View style={[styles.barTrackShell, { height }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: item.value === 0 ? "rgba(255,255,255,0.08)" : isActive ? activeColor : mutedColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.label ?? item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TrendChart({
  data,
  color = COLORS.teal,
  height = 130,
  labelEvery = 2,
  referenceValue,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  labelEvery?: number;
  referenceValue?: number;
}) {
  const [width, setWidth] = useState(0);
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const chartHeight = height - 28;
  const innerWidth = Math.max(width - 12, 1);
  const points = data.map((item, index) => ({
    x: 6 + (data.length === 1 ? innerWidth / 2 : (innerWidth * index) / (data.length - 1)),
    y: 6 + (chartHeight - 12) * (1 - (item.value - min) / range),
  }));

  const referenceY =
    referenceValue === undefined ? undefined : 6 + (chartHeight - 12) * (1 - (referenceValue - min) / range);

  return (
    <View style={{ height }} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
      <View style={[styles.chartArea, { height: chartHeight }]}>
        <View style={[styles.chartGridLine, { top: 6 }]} />
        <View style={[styles.chartGridLine, { top: chartHeight / 2 }]} />
        <View style={[styles.chartGridLine, { top: chartHeight - 6 }]} />
        {referenceY !== undefined ? <View style={[styles.referenceLine, { top: referenceY }]} /> : null}
        {points.map((point, index) => {
          if (index === data.length - 1) return null;
          const next = points[index + 1];
          const distance = Math.hypot(next.x - point.x, next.y - point.y);
          const angle = Math.atan2(next.y - point.y, next.x - point.x);
          return (
            <View
              key={`segment-${index}`}
              style={[
                styles.chartSegment,
                {
                  width: distance,
                  left: (point.x + next.x) / 2 - distance / 2,
                  top: (point.y + next.y) / 2 - 1,
                  backgroundColor: color,
                  transform: [{ rotateZ: `${angle}rad` }],
                },
              ]}
            />
          );
        })}
        {points.map((point, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.chartDot,
              {
                left: point.x - 4,
                top: point.y - 4,
                backgroundColor: index === data.length - 1 ? color : COLORS.screen,
                borderColor: color,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.chartLabels}>
        {data.map((item, index) => (
          <Text key={item.label} style={styles.chartLabelText}>
            {index % labelEvery === 0 || index === data.length - 1 ? item.label : " "}
          </Text>
        ))}
      </View>
    </View>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <View style={styles.rowGapTiny}>
        {icon}
        <Text style={styles.statPillValue}>{value}</Text>
      </View>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function DividerVertical() {
  return <View style={styles.verticalDivider} />;
}

function MetricBlock({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text style={styles.metricBlockValue}>{value}</Text>
      <Text style={styles.metricBlockLabel}>{label}</Text>
    </View>
  );
}

function CompactStatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Card style={styles.compactStatCard}>
      <Text style={[styles.compactStatValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.compactStatLabel}>{label}</Text>
    </Card>
  );
}

function DetailStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card style={[styles.compactStatCard, { alignItems: "center" }]}>
      {icon}
      <Text style={styles.compactStatValue}>{value}</Text>
      <Text style={styles.compactStatLabel}>{label}</Text>
    </Card>
  );
}

function AnalyticsCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={styles.analyticsCard}>
      <Text style={styles.analyticsLabel}>{label}</Text>
      <Text style={[styles.analyticsValue, { color }]}>{value}</Text>
      <Text style={styles.analyticsSub}>{sub}</Text>
    </View>
  );
}

function MetaInline({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.rowGapTiny}>
      {icon}
      <Text style={styles.listMeta}>{text}</Text>
    </View>
  );
}

function ChipWrap({
  items,
  selected,
  onSelect,
  activeColor,
  columns,
  style,
}: {
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  activeColor: string;
  columns?: number;
  style?: object;
}) {
  return (
    <View style={[styles.chipWrap, columns === 2 ? { flexDirection: "row", flexWrap: "wrap" } : null, style]}>
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onSelect(item)}
          style={[
            styles.optionChip,
            columns === 2 ? { width: "48%" } : null,
            selected === item
              ? { backgroundColor: `${activeColor}20`, borderColor: `${activeColor}40` }
              : null,
          ]}
        >
          <Text style={[styles.optionChipText, selected === item ? { color: activeColor } : null]}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SelectableRow({
  selected,
  onPress,
  label,
  sublabel,
  color = COLORS.teal,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  sublabel?: string;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectableRow,
        selected ? { backgroundColor: `${color}12`, borderColor: `${color}44` } : null,
      ]}
    >
      <View style={styles.rowGap}>
        <Radio selected={selected} color={color} />
        <View>
          <Text style={[styles.listRowTitle, selected ? { color: COLORS.text } : { color: "rgba(255,255,255,0.68)" }]}>{label}</Text>
          {sublabel ? <Text style={[styles.listMeta, { color }]}>{sublabel}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

function Radio({ selected, color }: { selected: boolean; color: string }) {
  return (
    <View style={[styles.radioOuter, { borderColor: selected ? color : "rgba(255,255,255,0.3)" }]}>
      {selected ? <View style={[styles.radioInner, { backgroundColor: color }]} /> : null}
    </View>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.28)"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

function MiniInput({
  value,
  onChangeText,
  placeholder,
  strike,
  error,
  keyboardType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  strike?: boolean;
  error?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.25)"
      style={[styles.miniInput, strike ? { textDecorationLine: "line-through" } : null, error ? { borderColor: COLORS.red, borderWidth: 1.5 } : null]}
      keyboardType={keyboardType ?? "default"}
    />
  );
}

function SplashScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const appConfig = useAppConfigQuery();
  const progress = appConfig.isPending || auth.status === "loading" ? 65 : 100;
  const status =
    appConfig.isPending
      ? "Fetching app config..."
      : auth.status === "loading"
        ? "Restoring session..."
        : auth.status === "authenticated"
          ? "Ready!"
          : "Sign in to continue";

  useEffect(() => {
    if (appConfig.isPending || auth.status === "loading") return;
    const timer = setTimeout(() => {
      navigation.replace(auth.status === "authenticated" ? "MainTabs" : "Login");
    }, 450);
    return () => clearTimeout(timer);
  }, [appConfig.isPending, auth.status, navigation]);

  return (
    <Screen glowColor="rgba(0,180,140,0.24)" scroll={false} contentContainerStyle={styles.centeredContent}>
      <View style={styles.splashLogo}>
        <Text style={styles.splashEmoji}>💪</Text>
      </View>
      <Text style={styles.splashTitle}>{appConfig.data?.app_name ?? "Athelix"}</Text>
      <Text style={styles.splashSubtitle}>Your training, elevated.</Text>
      <View style={styles.splashProgressCard}>
        <Text style={styles.splashProgressValue}>{progress}%</Text>
        <ProgressBar value={progress} color={COLORS.teal} height={8} />
        <Text style={styles.splashStatus}>{status}</Text>
        {appConfig.isError || auth.error ? (
          <Text style={styles.errorText}>{appConfig.isError ? getApiErrorMessage(appConfig.error) : auth.error}</Text>
        ) : null}
      </View>
      <Text style={styles.splashFooter}>{appConfig.data ? `${appConfig.data.app_name} v${appConfig.data.version}` : "Athelix"}</Text>
    </Screen>
  );
}

function LoginScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await auth.login({ email: email.trim(), password });
      setLoading(false);
      navigation.replace("MainTabs");
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Screen glowColor="rgba(0,180,140,0.22)" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={styles.authTop}>
        <View style={styles.authLogo}>
          <Text style={styles.splashEmoji}>💪</Text>
        </View>
        <Text style={styles.authTitle}>Welcome back</Text>
        <Text style={styles.authSubtitle}>Sign in to continue your journey</Text>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="jordan@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[styles.input, styles.inputWithRight]}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
            </Pressable>
          </View>
        </View>
        <Pressable>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
          disabled={loading}
          icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="arrow-right" size={16} color="#000000" />}
        />
      </View>

      <Text style={styles.authBottomText}>
        Don't have an account?{" "}
        <Text style={styles.linkTextInline} onPress={() => navigation.navigate("Register")}>
          Sign Up
        </Text>
      </Text>
    </Screen>
  );
}

function RegisterScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const checks = [
    { label: "8+ characters", ok: form.password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label: "Number", ok: /[0-9]/.test(form.password) },
  ];

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await auth.register({ username: form.username.trim(), email: form.email.trim(), password: form.password });
      setLoading(false);
      navigation.replace("ProfileSetup");
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err));
      const extracted: Record<string, string> = {};
      ["username", "email", "password"].forEach((field) => {
        const msg = getFieldError(err, field);
        if (msg) extracted[field] = msg;
      });
      if (Object.keys(extracted).length) setFieldErrors(extracted);
    }
  };

  return (
    <Screen glowColor="rgba(0,180,140,0.18)" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={[styles.headerRow, { paddingTop: 10 }]}>
        <View style={styles.headerLeft}>
          <RoundButton onPress={() => navigation.replace("Login")}>
            <Feather name="arrow-left" size={16} color={COLORS.text} />
          </RoundButton>
          <View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Start your fitness journey</Text>
          </View>
        </View>
      </View>

      <View style={styles.formStack}>
        <View>
          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            value={form.username}
            onChangeText={(value) => {
              setForm((current) => ({ ...current, username: value }));
              clearFieldError("username");
            }}
            placeholder="jordan_lifts"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.input, fieldErrors.username ? { borderColor: COLORS.red } : null]}
          />
          {fieldErrors.username ? <Text style={styles.fieldError}>{fieldErrors.username}</Text> : null}
        </View>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => {
              setForm((current) => ({ ...current, email: value }));
              clearFieldError("email");
            }}
            placeholder="jordan@example.com"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.input, fieldErrors.email ? { borderColor: COLORS.red } : null]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
        </View>
        <View>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={form.password}
              onChangeText={(value) => {
                setForm((current) => ({ ...current, password: value }));
                clearFieldError("password");
              }}
              placeholder="Create a strong password"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[styles.input, styles.inputWithRight, fieldErrors.password ? { borderColor: COLORS.red } : null]}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
            </Pressable>
          </View>
          {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}
          {form.password.length > 0 ? (
            <View style={styles.passwordChecks}>
              {checks.map((check) => (
                <View key={check.label} style={styles.passwordCheck}>
                  <View style={[styles.checkBubble, check.ok ? { backgroundColor: COLORS.teal } : null]}>
                    {check.ok ? <Feather name="check" size={8} color="#000000" /> : null}
                  </View>
                  <Text style={[styles.passwordCheckText, check.ok ? { color: COLORS.teal } : null]}>{check.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <Text style={styles.legalText}>
          By creating an account, you agree to our <Text style={styles.linkTextInline}>Terms of Service</Text> and{" "}
          <Text style={styles.linkTextInline}>Privacy Policy</Text>.
        </Text>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={loading ? "Creating Account..." : "Create Account"}
          onPress={handleRegister}
          disabled={loading}
          icon={loading ? <ActivityIndicator color="#000000" /> : <Feather name="arrow-right" size={16} color="#000000" />}
        />
      </View>

      <Text style={styles.authBottomText}>
        Already have an account?{" "}
        <Text style={styles.linkTextInline} onPress={() => navigation.replace("Login")}>
          Sign In
        </Text>
      </Text>
    </Screen>
  );
}

function HomeScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const overview = useOverviewQuery(auth.isAuthenticated);
  const data = overview.data;
  const name = displayName(data?.user ?? auth.user, data?.profile);
  const latestSession = data?.latest_completed_session;
  const latestWeight = data?.latest_body_weight_log;
  const activeMeso = data?.active_mesocycle;

  useEffect(() => {
    if (data && !data.has_profile) navigation.navigate("ProfileSetup");
  }, [data, navigation]);

  if (overview.isPending) {
    return (
      <Screen glowColor="rgba(0,180,140,0.22)">
        <LoadingCard label="Loading your dashboard..." />
      </Screen>
    );
  }

  if (overview.isError) {
    return (
      <Screen glowColor="rgba(0,180,140,0.22)">
        <ErrorCard error={overview.error} onRetry={() => overview.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen glowColor="rgba(0,180,140,0.22)">
      <View style={styles.mainHeader}>
        <Pressable style={styles.homeIdentity} onPress={() => navigation.navigate("Profile")}>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarInitials}>{initialsFor(name)}</Text>
          </View>
          <View>
            <Text style={styles.kickerText}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
            <Text style={styles.greetingText}>Hey, {name.split(" ")[0]}</Text>
          </View>
        </Pressable>
        <RoundButton>
          <Ionicons name="notifications-outline" size={16} color="rgba(255,255,255,0.7)" />
          <View style={styles.notificationDot} />
        </RoundButton>
      </View>

      <Pressable
        onPress={() => (activeMeso ? navigation.navigate("MesocycleDetail", { id: String(activeMeso.id) }) : navigation.navigate("MesocycleList"))}
        style={styles.inlineSection}
      >
        <Card style={{ borderColor: "rgba(0,212,168,0.22)", backgroundColor: "rgba(0,212,168,0.1)" }}>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={styles.bannerIcon}>
                <Feather name="trending-up" size={15} color={COLORS.teal} />
              </View>
              <View>
                <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>{activeMeso ? "Active Mesocycle" : "No Active Mesocycle"}</Text>
                <Text style={styles.cardTitle}>
                  {activeMeso ? `${activeMeso.name}${activeMeso.weeks ? ` - ${activeMeso.weeks} weeks` : ""}` : "Plan a training block"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.35)" />
          </View>
        </Card>
      </Pressable>

      <Card style={styles.inlineSection}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionCardTitle}>This Week</Text>
          <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>
            {data?.weekly_activity.reduce((sum, d) => sum + d.value, 0) ?? 0} / 7 days
          </Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <VerticalBars data={data?.weekly_activity.map((item, index) => ({ day: item.day, value: item.value, highlight: index === 6 })) ?? []} />
        </View>
        <View style={styles.statRowDivider} />
        <View style={styles.threeUp}>
          <StatPill
            icon={<MaterialCommunityIcons name="fire" size={12} color="#f97316" />}
            label="Day Streak"
            value={String(data?.workout_streaks.current_daily_streak ?? 0)}
          />
          <DividerVertical />
          <StatPill
            icon={<MaterialCommunityIcons name="dumbbell" size={12} color={COLORS.teal} />}
            label="Workouts"
            value={String(data?.stats.completed_sessions ?? 0)}
          />
          <DividerVertical />
          <StatPill
            icon={<Feather name="trending-up" size={12} color={COLORS.green} />}
            label="Templates"
            value={String(data?.stats.total_workout_templates ?? 0)}
          />
        </View>
      </Card>

      <Pressable onPress={() => navigation.navigate("BodyweightHistory")} style={styles.inlineSection}>
        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={styles.softIconWrap}>
                <MaterialCommunityIcons name="scale-bathroom" size={16} color={COLORS.teal} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Latest Bodyweight</Text>
                <View style={styles.rowGapSmall}>
                  <Text style={styles.heroMetric}>{latestWeight ? latestWeight.weight_kg.toFixed(1) : "-"}</Text>
                  <Text style={styles.metricSuffix}>kg</Text>
                  {latestWeight ? <Text style={[styles.metricChange, { color: COLORS.green }]}>{formatShortDate(latestWeight.logged_at)}</Text> : null}
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
          </View>
        </Card>
      </Pressable>

      <View style={styles.inlineSection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionCardTitle}>Last Workout</Text>
          <Pressable style={styles.rowGapTiny} onPress={() => navigation.navigate("WorkoutHistory")}>
            <Text style={styles.linkText}>See All</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.teal} />
          </Pressable>
        </View>
        <Pressable onPress={() => latestSession && navigation.navigate("SessionDetail", { id: String(latestSession.id) })}>
          <Card>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.cardTitle}>{latestSession ? workoutTitle(latestSession) : "No completed workouts yet"}</Text>
                <Text style={styles.detailLabel}>
                  {latestSession ? `${formatShortDate(latestSession.started_at)} - ${formatTimeLabel(latestSession.started_at)}` : "Start a workout to build history"}
                </Text>
              </View>
              {latestSession ? <Tag label="Done" color={COLORS.teal} /> : null}
            </View>
            <View style={[styles.rowGapLarge, { marginTop: 14 }]}>
              <MetricBlock value={`${latestSession?.duration_minutes ?? 0} min`} label="Duration" />
              <MetricBlock value={`${latestSession?.total_sets ?? 0} sets`} label="Sets" />
              <MetricBlock value={formatVolume(latestSession?.total_volume)} label="Volume" />
            </View>
          </Card>
        </Pressable>
      </View>

      <View style={styles.inlineSection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionCardTitle}>Recent PRs</Text>
          <Pressable style={styles.rowGapTiny} onPress={() => navigation.navigate("PersonalRecords")}>
            <Text style={styles.linkText}>All PRs</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.teal} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {(data?.recent_personal_records.length ? data.recent_personal_records : []).map((item) => (
            <Pressable key={item.id} onPress={() => navigation.navigate("PersonalRecords")}>
              <Card style={[styles.prCard, { borderColor: `${COLORS.gold}38` }]}>
                <View style={styles.rowGapTiny}>
                  <Feather name="award" size={10} color={COLORS.gold} />
                  <Text style={[styles.prBadge, { color: COLORS.gold }]}>PR</Text>
                </View>
                <Text style={[styles.detailLabel, { marginTop: 10 }]}>{item.exercise_id}</Text>
                <Text style={[styles.prValue, { color: COLORS.gold }]}>{Math.round(item.value)}</Text>
                <Text style={[styles.detailLabel, { marginTop: 6 }]}>{formatShortDate(item.achieved_on)}</Text>
              </Card>
            </Pressable>
          ))}
          {data?.recent_personal_records.length === 0 ? (
            <Card style={styles.prCard}>
              <Text style={styles.detailLabel}>No PRs yet</Text>
            </Card>
          ) : null}
        </ScrollView>
      </View>

      <PrimaryButton
        label="Start Workout"
        onPress={() => navigation.navigate("StartWorkout")}
        icon={<Feather name="plus" size={20} color="#000000" />}
        style={{ marginTop: 20 }}
      />
    </Screen>
  );
}

function ExploreScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  return (
    <Screen glowColor="rgba(0,120,180,0.16)" scroll={false} contentContainerStyle={styles.scrollContent}>
      <ExercisePicker
        variant="browse"
        title="Exercise Library"
        enabled={auth.isAuthenticated}
        onNavigate={(exerciseId) => navigation.navigate("ExerciseDetail", { id: exerciseId })}
      />
    </Screen>
  );
}

function ExerciseDetailScreen({ navigation, route }: { navigation: any; route: { params: { id: string } } }) {
  const auth = useAuth();
  const { id } = route.params;
  const exerciseQuery = useExerciseDetailQuery(id, auth.isAuthenticated);
  const exercise = exerciseQuery.data ? mapExerciseDetail(exerciseQuery.data) : (EXERCISE_DETAILS[id ?? ""] ?? EXERCISE_FALLBACK);

  if (exerciseQuery.isPending) {
    return (
      <Screen glowColor="rgba(0,180,140,0.16)">
        <BackHeader title="Exercise Detail" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading exercise..." />
      </Screen>
    );
  }

  if (exerciseQuery.isError) {
    return (
      <Screen glowColor="rgba(0,180,140,0.16)">
        <BackHeader title="Exercise Detail" onBack={() => navigation.goBack()} />
        <ErrorCard error={exerciseQuery.error} onRetry={() => exerciseQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen glowColor="rgba(0,180,140,0.16)">
      <BackHeader
        title="Exercise Detail"
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={styles.smallAccentButton} onPress={() => navigation.navigate("TemplateBuilder")}>
            <Feather name="plus" size={13} color={COLORS.teal} />
            <Text style={styles.smallAccentText}>Add</Text>
          </Pressable>
        }
      />

      <Card style={[styles.heroCard, { marginTop: 18 }]}>
        <View style={styles.heroEmojiWrap}>
          <Text style={{ fontSize: 38 }}>{exercise.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{exercise.name}</Text>
          <View style={[styles.rowGap, { marginTop: 8 }]}>
            <Tag label={exercise.difficulty} color={DIFFICULTY_COLORS[exercise.difficulty]} />
            <Text style={styles.detailLabel}>{exercise.category}</Text>
          </View>
          <View style={[styles.rowGap, { marginTop: 10 }]}>
            <Text style={styles.detailLabel}>{exercise.equipment}</Text>
            <Text style={styles.detailLabel}>{exercise.primaryMuscle}</Text>
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionEyebrow>Muscles Worked</SectionEyebrow>
        <View style={[styles.filterTagRow, { marginTop: 12 }]}>
          <View style={styles.primaryMuscleTag}>
            <View style={styles.primaryMuscleDot} />
            <Text style={styles.primaryMuscleText}>Primary: {exercise.primaryMuscle}</Text>
          </View>
          {exercise.secondaryMuscles.map((muscle) => (
            <View key={muscle} style={styles.secondaryMuscleTag}>
              <View style={styles.secondaryMuscleDot} />
              <Text style={styles.secondaryMuscleText}>{muscle}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionEyebrow>How To</SectionEyebrow>
        <View style={{ marginTop: 12, gap: 12 }}>
          {exercise.instructions.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepBubble}>
                <Text style={styles.stepBubbleText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </Card>

      {exercise.tips.length > 0 ? (
        <Card style={{ marginTop: 14, backgroundColor: "rgba(0,212,168,0.06)", borderColor: "rgba(0,212,168,0.18)" }}>
          <SectionEyebrow color={COLORS.teal}>Pro Tips</SectionEyebrow>
          <View style={{ marginTop: 12, gap: 10 }}>
            {exercise.tips.map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <Text style={{ color: COLORS.teal }}>→</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Pressable onPress={() => navigation.navigate("ExerciseProgress", { id: id ?? "0025" })} style={{ marginTop: 14 }}>
        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <Feather name="trending-up" size={18} color={COLORS.teal} />
              <View>
                <Text style={styles.listRowTitle}>Your Progress</Text>
                <Text style={styles.detailLabel}>View e1RM history</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
          </View>
        </Card>
      </Pressable>
    </Screen>
  );
}

function TrainHubScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const overview = useOverviewQuery(auth.isAuthenticated);
  return (
    <Screen glowColor="rgba(0,180,140,0.18)">
      <View style={styles.tabIntro}>
        <SectionEyebrow>Train</SectionEyebrow>
        <Text style={styles.tabTitle}>Workouts</Text>
      </View>

      <Pressable onPress={() => navigation.navigate("StartWorkout")} style={{ marginTop: 18 }}>
        <View style={[styles.trainHero, shadow(COLORS.teal)]}>
          <View style={styles.trainHeroIcon}>
            <Feather name="play" size={24} color="#ffffff" />
          </View>
          <Text style={styles.trainHeroTitle}>Start Workout</Text>
          <Text style={styles.trainHeroSubtitle}>Begin now or choose a template</Text>
        </View>
      </Pressable>

      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard label="Sessions" value={String(overview.data?.stats.completed_sessions ?? 0)} />
        <CompactStatCard label="Templates" value={String(overview.data?.stats.total_workout_templates ?? 0)} />
        <CompactStatCard label="PRs" value={String(overview.data?.stats.personal_record_count ?? 0)} />
      </View>

      <View style={{ marginTop: 18, gap: 12 }}>
        {TRAIN_SECTIONS.map((section) => {
          let badgeLabel = "badge" in section ? section.badge : "";
          if ("badgeKey" in section) {
            if (section.badgeKey === "templates") {
              badgeLabel = `${overview.data?.stats.total_workout_templates ?? 0} saved`;
            } else if (section.badgeKey === "sessions") {
              badgeLabel = `${overview.data?.stats.completed_sessions ?? 0} sessions`;
            }
          }
          return (
            <Pressable
              key={section.title}
              onPress={() => {
                if (section.title === "Templates") navigation.navigate("TemplateList");
                else if (section.title === "Workout History") navigation.navigate("WorkoutHistory");
                else if (section.title === "Mesocycles") navigation.navigate("MesocycleList");
              }}
            >
              <Card style={{ borderColor: "advanced" in section && section.advanced ? "rgba(139,92,246,0.2)" : COLORS.border }}>
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flexShrink: 1 }]}>
                    <View style={[styles.sectionIconWrapSmall, { backgroundColor: `${section.color}18` }]}>
                      {section.title === "Templates" ? <Feather name="book-open" size={18} color={section.color} /> : null}
                      {section.title === "Workout History" ? (
                        <MaterialCommunityIcons name="history" size={18} color={section.color} />
                      ) : null}
                      {section.title === "Mesocycles" ? <Feather name="trending-up" size={18} color={section.color} /> : null}
                    </View>
                    <View style={{ flex: 1, flexShrink: 1 }}>
                      <Text style={styles.cardTitle}>{section.title}</Text>
                      <Text style={styles.detailLabel}>{section.desc}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <Tag label={badgeLabel} color={"advanced" in section && section.advanced ? COLORS.purple : section.color} />
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.25)" />
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function TemplateListScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const templates = useTemplatesQuery(auth.isAuthenticated);
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: number) => deleteWorkoutTemplateWorkoutTemplatesTemplateIdDelete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });

  const handleDelete = (template: WorkoutTemplateResponse) => {
    Alert.alert("Delete template?", template.name, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTemplate.mutate(template.id) },
    ]);
  };

  return (
    <Screen glowColor="rgba(0,180,140,0.14)">
      <BackHeader
        title="Templates"
        subtitle={`${templates.data?.length ?? 0} saved`}
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={styles.smallAccentButton} onPress={() => navigation.navigate("TemplateBuilder")}>
            <Feather name="plus" size={15} color={COLORS.teal} />
            <Text style={styles.smallAccentText}>New</Text>
          </Pressable>
        }
      />

      {templates.isPending ? <LoadingCard label="Loading templates..." /> : null}
      {templates.isError ? <ErrorCard error={templates.error} onRetry={() => templates.refetch()} /> : null}

      <View style={{ gap: 12, marginTop: 18 }}>
        {(templates.data ?? []).map((template) => (
          <Card key={template.id} style={{ borderRadius: 28 }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowGap}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.teal }]} />
                  <Text style={styles.cardTitle}>{template.name}</Text>
                </View>
                <Text style={[styles.detailLabel, { marginLeft: 14, marginTop: 6 }]}>
                  {template.description || `Created ${formatShortDate(template.created_at)}`}
                </Text>
              </View>
              <RoundButton onPress={() => navigation.navigate("TemplateBuilder", { id: String(template.id) })}>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.5)" />
              </RoundButton>
            </View>
            <View style={[styles.rowBetween, { marginTop: 14 }]}>
              <View style={styles.rowGapLarge}>
                <MetaInline icon={<Feather name="calendar" size={11} color="rgba(255,255,255,0.32)" />} text={formatShortDate(template.updated_at)} />
                {template.is_public ? <Tag label="Public" color={COLORS.blue} /> : <Tag label="Private" color={COLORS.teal} />}
              </View>
              <Pressable
                style={[styles.smallActionTag, { backgroundColor: "rgba(0,212,168,0.13)", borderColor: "rgba(0,212,168,0.32)" }]}
                onPress={() => navigation.navigate("StartWorkout", { id: String(template.id) })}
              >
                <Feather name="play" size={11} color={COLORS.teal} />
                <Text style={[styles.smallActionText, { color: COLORS.teal }]}>Start</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => handleDelete(template)} style={{ alignSelf: "flex-start", marginTop: 12 }}>
              <Text style={[styles.listMeta, { color: COLORS.red }]}>Delete</Text>
            </Pressable>
          </Card>
        ))}

        {!templates.isPending && (templates.data?.length ?? 0) === 0 ? (
          <EmptyCard title="No templates yet" text="Create your first reusable workout plan." />
        ) : null}

        <Pressable onPress={() => navigation.navigate("TemplateBuilder")}>
          <View style={styles.dashedAddCard}>
            <View style={styles.addCircle}>
              <Feather name="plus" size={18} color="rgba(255,255,255,0.45)" />
            </View>
            <Text style={styles.emptyStateText}>Create new template</Text>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}

const MINUTES = [0, 1, 2, 3, 4, 5];
const SECONDS = [0, 10, 15, 20, 30, 45];

function PickerColumn({ values, selected, onSelect, label, itemWidth = 64 }: {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
  label: string;
  itemWidth?: number;
}) {
  const ITEM_H = 44;
  const flatRef = useRef<FlatList>(null);
  const listHeight = ITEM_H * 5;

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0) {
      flatRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
    }
  }, []);

  return (
    <View style={{ alignItems: "center", width: itemWidth }}>
      <Text style={[styles.fieldLabel, { marginBottom: 4, textAlign: "center" }]}>{label}</Text>
      <View style={{ height: listHeight, overflow: "hidden", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
        <FlatList
          ref={flatRef}
          data={values}
          keyExtractor={(v) => String(v)}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, idx) => ({ length: ITEM_H, offset: ITEM_H * idx, index: idx })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
            onSelect(values[idx] ?? values[0]);
          }}
          renderItem={({ item, index }) => {
            const isSelected = item === selected;
            return (
              <Pressable
                onPress={() => {
                  flatRef.current?.scrollToIndex({ index, animated: true });
                  onSelect(item);
                }}
                style={{ height: ITEM_H, justifyContent: "center", alignItems: "center" }}
              >
                <Text style={{
                  color: isSelected ? COLORS.text : "rgba(255,255,255,0.3)",
                  fontSize: isSelected ? 20 : 14,
                  fontWeight: isSelected ? "700" : "400",
                  opacity: isSelected ? 1 : 0.5,
                }}>
                  {String(item).padStart(2, "0")}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

function TemplateBuilderScreen({ navigation, route }: { navigation: any; route: { params?: { id?: string } } }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const id = route.params?.id;
  const templateId = toNumberId(id);
  const isEdit = !!templateId;
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<TemplateDraftExercise[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [saveError, setSaveError] = useState("");
  const detail = useTemplateDetailQuery(templateId, auth.isAuthenticated && isEdit);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, auth.isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!detail.data || lookup.size === 0) return;
    if (initialized.current) {
      setExercises((prev) =>
        prev.map((ex) => {
          const resolved = nameForExercise(ex.exerciseId, lookup);
          return {
            ...ex,
            name: resolved !== ex.exerciseId ? resolved : ex.name,
            emoji: exerciseEmoji(lookup.get(ex.exerciseId)),
          };
        }),
      );
      return;
    }
    initialized.current = true;
    setName(detail.data.name);
    setExercises(templateDraftFromDetail(detail.data, lookup));
    setExpanded(detail.data.exercises[0] ? String(detail.data.exercises[0].id) : null);
  }, [detail.data, lookup]);

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Template name is required.");

      for (const exercise of exercises) {
        const rpe = exercise.sets[0]?.rpe ?? "";
        const err = rpeError(rpe);
        if (err) throw new Error(`"${exercise.name}": ${err}`);
      }
      const template =
        isEdit && templateId
          ? successData(await updateWorkoutTemplateWorkoutTemplatesTemplateIdPatch(templateId, { name: name.trim() }))
          : successData(await createWorkoutTemplateWorkoutTemplatesPost({ name: name.trim(), is_public: false }));

      if (isEdit && detail.data) {
        const kept = new Set(exercises.map((exercise) => exercise.templateExerciseId).filter(Boolean));
        const removed = detail.data.exercises.filter((exercise) => !kept.has(exercise.id));
        await Promise.all(
          removed.map((exercise) =>
            deleteTemplateExerciseWorkoutTemplatesTemplateIdExercisesTemplateExerciseIdDelete(template.id, exercise.id),
          ),
        );
      }

      for (const [index, exercise] of exercises.entries()) {
        const config = exercise.sets[0];
        const payload = {
          exercise_id: exercise.exerciseId,
          order_index: index,
          target_sets: exercise.setCount,
          target_reps: config ? numberOrNull(config.reps) : null,
          target_rpe: config ? numberOrNull(config.rpe) : null,
          rest_seconds: config ? parseRestSeconds(config.rest) : null,
          notes: exercise.notes || null,
        };

        if (exercise.templateExerciseId) {
          await updateTemplateExerciseWorkoutTemplatesTemplateIdExercisesTemplateExerciseIdPatch(
            template.id,
            exercise.templateExerciseId,
            payload,
          );
        } else {
          await createTemplateExerciseWorkoutTemplatesTemplateIdExercisesPost(template.id, payload);
        }
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      navigation.replace("TemplateList");
    },
    onError: (err) => setSaveError(getApiErrorMessage(err)),
  });

  const REST_PRESETS = ["0:30", "1:00", "1:30", "2:00", "2:30", "3:00", "5:00"];

  const addExercise = (exercise: ExerciseResponse) => {
    const nextId = Date.now().toString();
    const nextExercise: TemplateDraftExercise = {
      id: nextId,
      exerciseId: exercise.id,
      name: exercise.name,
      emoji: exerciseEmoji(exercise),
      notes: "",
      setCount: 1,
      sets: [{ reps: "8", rpe: "7", rest: "2:00" }],
    };
    setExercises((current) => [...current, nextExercise]);
    setExpanded(nextId);
    setShowExercisePicker(false);
  };

  const setSetCount = (exerciseId: string, delta: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, setCount: Math.max(1, ex.setCount + delta) } : ex,
      ),
    );
  };

  const updateSingleConfig = (exerciseId: string, field: "reps" | "rpe" | "rest", value: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: [{ ...ex.sets[0], [field]: value }] } : ex,
      ),
    );
  };

  const updateNote = (exerciseId: string, value: string) => {
    setExercises((current) =>
      current.map((exercise) => (exercise.id === exerciseId ? { ...exercise, notes: value } : exercise)),
    );
  };

  const removeExercise = (exerciseId: string) => {
    setExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= exercises.length) return;
    setExercises((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerExerciseId, setTimerExerciseId] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState(1);
  const [customSeconds, setCustomSeconds] = useState(30);

  const resetCustomTime = () => {
    setCustomMinutes(1);
    setCustomSeconds(30);
  };

  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const gapOffsetsRef = useRef(new Map<string, Animated.Value>());
  const cardHeightsRef = useRef(new Map<string, number>());
  const dragStartIdxRef = useRef(0);
  const dragFinalRef = useRef(0);
  const CARD_H_DEFAULT = 76;

  const draggedHeight = (id: string) => cardHeightsRef.current.get(id) ?? CARD_H_DEFAULT;

  const cumulativeSwaps = (startIdx: number, dy: number): number => {
    let swaps = 0;
    let accH = 0;
    if (dy > 0) {
      for (let i = startIdx + 1; i < exercises.length; i++) {
        const nh = cardHeightsRef.current.get(exercises[i].id) ?? CARD_H_DEFAULT;
        accH += nh;
        if (dy >= accH - nh / 2) {
          swaps = i - startIdx;
        } else {
          break;
        }
      }
    } else if (dy < 0) {
      const absDY = Math.abs(dy);
      for (let i = startIdx - 1; i >= 0; i--) {
        const nh = cardHeightsRef.current.get(exercises[i].id) ?? CARD_H_DEFAULT;
        accH += nh;
        if (absDY >= accH - nh / 2) {
          swaps = i - startIdx;
        } else {
          break;
        }
      }
    }
    return swaps;
  };

  const getGap = (id: string) => {
    let val = gapOffsetsRef.current.get(id);
    if (!val) {
      val = new Animated.Value(0);
      gapOffsetsRef.current.set(id, val);
    }
    return val;
  };

  // Clean up stale gap entries
  const activeIds = new Set(exercises.map((ex) => ex.id));
  gapOffsetsRef.current.forEach((_, id) => {
    if (!activeIds.has(id)) gapOffsetsRef.current.delete(id);
  });

  const setAllGaps = (draggedId: string, translationY: number) => {
    const startIdx = dragStartIdxRef.current;
    const h = draggedHeight(draggedId);
    const swaps = cumulativeSwaps(startIdx, translationY);
    const targetIdx = Math.max(0, Math.min(exercises.length - 1, startIdx + swaps));

    exercises.forEach((ex, idx) => {
      const val = getGap(ex.id);
      if (ex.id === draggedId) {
        val.setValue(translationY);
      } else {
        let offset = 0;
        if (targetIdx > startIdx && idx > startIdx && idx <= targetIdx) {
          offset = -h;
        } else if (targetIdx < startIdx && idx >= targetIdx && idx < startIdx) {
          offset = h;
        }
        val.setValue(offset);
      }
    });
  };

  const resetAllGaps = () => {
    exercises.forEach((ex) => {
      const val = gapOffsetsRef.current.get(ex.id);
      if (val) val.setValue(0);
    });
  };

  const handleDragMove = (translationY: number, exerciseId: string) => {
    if (draggedIdRef.current !== exerciseId) return;
    dragFinalRef.current = translationY;
    setAllGaps(exerciseId, translationY);
  };

  const handleDragEnd = (exerciseId: string) => {
    const startIdx = dragStartIdxRef.current;
    const rawDy = dragFinalRef.current;
    const swaps = cumulativeSwaps(startIdx, rawDy);
    const targetIdx = Math.max(0, Math.min(exercises.length - 1, startIdx + swaps));

    if (targetIdx !== startIdx) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExercises((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(startIdx, 1);
        updated.splice(targetIdx, 0, moved);
        return updated;
      });
    }

    draggedIdRef.current = null;
    resetAllGaps();
  };

  const draggingId = dragActiveId;
  const dragStartIdx = dragStartIdxRef.current;
  const rawDy = dragFinalRef.current;
  const dragSwaps = cumulativeSwaps(dragStartIdx, rawDy);
  const dragTargetIdx = draggingId ? Math.max(0, Math.min(exercises.length - 1, dragStartIdx + dragSwaps)) : -1;

  const setRestTime = (exerciseId: string, rest: string) => {
    updateSingleConfig(exerciseId, "rest", rest);
    setShowTimerModal(false);
    setTimerExerciseId(null);
  };

  return (
    <Screen glowColor="rgba(0,0,0,0)" contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={styles.builderTopBar}>
        <RoundButton onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={16} color={COLORS.text} />
        </RoundButton>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Template" : "New Template"}</Text>
        <Pressable style={styles.saveChip} onPress={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>
          {saveTemplate.isPending ? <ActivityIndicator color="#000000" size="small" /> : null}
          <Text style={styles.saveChipText}>{saveTemplate.isPending ? "Saving" : "Save"}</Text>
        </Pressable>
      </View>

      {detail.isPending && isEdit ? <LoadingCard label="Loading template..." /> : null}
      {detail.isError ? <ErrorCard error={detail.error} onRetry={() => detail.refetch()} /> : null}
      {saveError ? (
        <View style={[styles.errorBox, { marginTop: 12 }]}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      ) : null}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Template name (e.g. Push Day A)"
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={[styles.input, styles.templateNameInput]}
      />

      <View style={{ gap: 12, marginTop: 16 }}>
        {exercises.map((exercise, index) => (
          <View key={exercise.id} style={{ position: "relative" }}>
            {draggingId && index === dragTargetIdx && exercise.id !== draggingId ? (
              <View style={{
                backgroundColor: "rgba(0,212,168,0.04)",
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: "rgba(0,212,168,0.3)",
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: 0.55,
              }}>
                <Text style={{ fontSize: 18, opacity: 0.5 }}>
                  {exercises.find((ex) => ex.id === draggingId)?.emoji ?? "⚡"}
                </Text>
                <Text style={{ color: COLORS.teal, fontSize: 13, fontWeight: "600", fontStyle: "italic" }}>
                  {exercises.find((ex) => ex.id === draggingId)?.name ?? ""}
                </Text>
              </View>
            ) : null}
            <View onLayout={(e) => cardHeightsRef.current.set(exercise.id, e.nativeEvent.layout.height)}>
              <Animated.View style={{
                transform: [{ translateY: getGap(exercise.id) }],
              }}>
                <View style={[styles.card, {
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  zIndex: dragActiveId === exercise.id ? 100 : 1,
                  elevation: dragActiveId === exercise.id ? 10 : 1,
                }, dragActiveId === exercise.id ? {
                  borderColor: COLORS.teal,
                  borderWidth: 1.5,
                  backgroundColor: "rgba(0,212,168,0.06)",
                  ...shadow(COLORS.teal),
                } : null]}>
                  <PanGestureHandler
                    onGestureEvent={(e) => handleDragMove(e.nativeEvent.translationY, exercise.id)}
                    onHandlerStateChange={(e) => {
                      if (e.nativeEvent.state === State.ACTIVE) {
                        draggedIdRef.current = exercise.id;
                        dragStartIdxRef.current = exercises.findIndex((ex) => ex.id === exercise.id);
                        dragFinalRef.current = 0;
                        setDragActiveId(exercise.id);
                      } else if (e.nativeEvent.state === State.END || e.nativeEvent.state === State.CANCELLED || e.nativeEvent.state === State.FAILED) {
                        handleDragEnd(exercise.id);
                        setDragActiveId(null);
                      }
                    }}
                    activateAfterLongPress={300}
                    minDist={5}
                  >
                    <View>
                      <View style={styles.rowBetween}>
                        <View style={[styles.rowGap, { flex: 1 }]}>
                          <MaterialCommunityIcons name="drag-vertical" size={18} color={dragActiveId === exercise.id ? COLORS.teal : "rgba(255,255,255,0.3)"} />
                          <Text style={{ fontSize: 20 }}>{exercise.emoji}</Text>
                          <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
                        </View>
                      </View>
                    </View>
                  </PanGestureHandler>

                  {expanded === exercise.id ? (
                        <View style={{ marginTop: 14, gap: 12 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                            <View style={{ minWidth: 80 }}>
                              <Text style={styles.fieldLabel}>Reps</Text>
                              <MiniInput
                                value={exercise.sets[0]?.reps ?? "8"}
                                onChangeText={(value) => updateSingleConfig(exercise.id, "reps", value)}
                              />
                            </View>
                            <View>
                              <Text style={styles.fieldLabel}>Sets</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Pressable
                                  onPress={() => setSetCount(exercise.id, -1)}
                                  style={[styles.stepperBtn, { opacity: exercise.setCount <= 1 ? 0.3 : 1 }]}
                                  disabled={exercise.setCount <= 1}
                                >
                                  <Feather name="minus" size={14} color={COLORS.text} />
                                </Pressable>
                                <Text style={[styles.listRowTitle, { minWidth: 22, textAlign: "center" }]}>
                                  {exercise.setCount}
                                </Text>
                                <Pressable onPress={() => setSetCount(exercise.id, 1)} style={styles.stepperBtn}>
                                  <Feather name="plus" size={14} color={COLORS.text} />
                                </Pressable>
                              </View>
                            </View>
                            <View style={{ minWidth: 60 }}>
                              <Text style={styles.fieldLabel}>RPE</Text>
                              <MiniInput
                                value={exercise.sets[0]?.rpe ?? "7"}
                                onChangeText={(value) => updateSingleConfig(exercise.id, "rpe", value)}
                                error={(() => {
                                  const n = Number(exercise.sets[0]?.rpe);
                                  return exercise.sets[0]?.rpe !== "" && (isNaN(n) || n < 1 || n > 10);
                                })()}
                                keyboardType="numeric"
                              />
                              {(() => {
                                const n = Number(exercise.sets[0]?.rpe);
                                const invalid = exercise.sets[0]?.rpe !== "" && (isNaN(n) || n < 1 || n > 10);
                                return invalid ? <Text style={{ color: COLORS.red, fontSize: 9, marginTop: 4, textAlign: "center" }}>1–10</Text> : null;
                              })()}
                            </View>
                            <View>
                              <Text style={styles.fieldLabel}>Rest</Text>
                              <Pressable
                                onPress={() => {
                                  const current = exercise.sets[0]?.rest ?? "2:00";
                                  const parts = current.includes(":") ? current.split(":") : [current, "0"];
                                  setCustomMinutes(Number(parts[0]) || 2);
                                  setCustomSeconds(Number(parts[1]) || 0);
                                  setTimerExerciseId(exercise.id);
                                  setShowTimerModal(true);
                                }}
                                style={styles.restChip}
                              >
                                <Feather name="clock" size={12} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.restChipText}>{exercise.sets[0]?.rest ?? "2:00"}</Text>
                              </Pressable>
                            </View>
                          </View>
                          <TextInput
                            value={exercise.notes}
                            onChangeText={(value) => updateNote(exercise.id, value)}
                            placeholder="Notes (optional)..."
                            placeholderTextColor="rgba(255,255,255,0.28)"
                            style={[styles.input, { marginTop: 4 }]}
                          />
                        </View>
                      ) : null}
                </View>
              </Animated.View>
            </View>

            <Animated.View style={{
              position: "absolute",
              right: 14,
              top: 14,
              flexDirection: "row",
              alignItems: "center",
              zIndex: 999,
              transform: [{ translateY: getGap(exercise.id) }],
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Pressable onPress={() => moveExercise(index, index - 1)} hitSlop={8}>
                  <Feather name="chevron-up" size={15} color="rgba(255,255,255,0.3)" />
                </Pressable>
                <Pressable onPress={() => moveExercise(index, index + 1)} hitSlop={8}>
                  <Feather name="chevron-down" size={15} color="rgba(255,255,255,0.3)" />
                </Pressable>
              </View>
              <View style={{ width: 1, height: 16, marginHorizontal: 8, backgroundColor: "rgba(255,255,255,0.1)" }} />
              <Pressable onPress={() => setExpanded((current) => (current === exercise.id ? null : exercise.id))} hitSlop={8}>
                <Feather name={expanded === exercise.id ? "chevron-up" : "chevron-down"} size={17} color="rgba(255,255,255,0.6)" />
              </Pressable>
              <Pressable onPress={() => removeExercise(exercise.id)} hitSlop={8} style={{ marginLeft: 10 }}>
                <Feather name="trash-2" size={15} color="rgba(239,68,68,0.6)" />
              </Pressable>
            </Animated.View>
          </View>
        ))}

        <Pressable onPress={() => setShowExercisePicker(true)}>
          <View style={styles.dashedAddCard}>
            <View style={[styles.addCircle, { backgroundColor: "rgba(0,212,168,0.12)" }]}>
              <Feather name="plus" size={18} color={COLORS.teal} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Add Exercise</Text>
              <Text style={styles.detailLabel}>Search from exercise library</Text>
            </View>
          </View>
        </Pressable>

        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📋</Text>
            <Text style={styles.emptyStateTitle}>No exercises yet</Text>
            <Text style={styles.emptyStateText}>Tap "Add Exercise" to build your template</Text>
          </View>
        ) : null}
      </View>

      <ExercisePicker
        variant="pick"
        visible={showExercisePicker}
        title="Add Exercise"
        enabled={auth.isAuthenticated}
        onSelect={(exercise) => addExercise(exercise)}
        onClose={() => setShowExercisePicker(false)}
      />

      <Modal visible={showTimerModal} transparent animationType="slide" onRequestClose={() => setShowTimerModal(false)}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => { setShowTimerModal(false); resetCustomTime(); }} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Rest Timer</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18, justifyContent: "center" }}>
              {REST_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => timerExerciseId && setRestTime(timerExerciseId, preset)}
                  style={styles.chipButton}
                >
                  <Text style={styles.chipButtonText}>{preset}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>Custom</Text>
              <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", alignItems: "flex-end" }}>
                <PickerColumn values={MINUTES} selected={customMinutes} onSelect={setCustomMinutes} label="Min" itemWidth={56} />
                <Text style={{ fontSize: 24, fontWeight: "900", color: COLORS.text, paddingBottom: 18 }}>:</Text>
                <PickerColumn values={SECONDS} selected={customSeconds} onSelect={setCustomSeconds} label="Sec" itemWidth={56} />
              </View>
              <PrimaryButton
                label={`Set ${String(customMinutes).padStart(2, "0")}:${String(customSeconds).padStart(2, "0")}`}
                onPress={() => timerExerciseId && setRestTime(timerExerciseId, `${customMinutes}:${String(customSeconds).padStart(2, "0")}`)}
                subtle
                style={{ marginTop: 14 }}
              />
            </View>
            <PrimaryButton label="Done" onPress={() => { setShowTimerModal(false); resetCustomTime(); }} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}


function StartWorkoutScreen({ navigation, route }: { navigation: any; route?: { params?: { id?: string } } }) {
  const auth = useAuth();
  const id = route?.params?.id;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(id ?? null);
  const [selectedMeso, setSelectedMeso] = useState<string | null>(null);
  const templates = useTemplatesQuery(auth.isAuthenticated);
  const mesocycles = useMesocyclesQuery(auth.isAuthenticated);
  const startSession = useMutation({
    mutationFn: async ({ templateId }: { templateId?: string | null }) => {
      const template = templates.data?.find((item) => String(item.id) === templateId);
      const response = await createWorkoutSessionWorkoutSessionsPost({
        template_id: toNumberId(templateId),
        mesocycle_id: toNumberId(selectedMeso),
        name: template?.name ?? "Workout",
        started_at: new Date().toISOString(),
        is_completed: false,
      });
      return successData(response);
    },
    onSuccess: (session, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      navigation.replace("ActiveWorkout", {
        sessionId: session.id,
        templateId: variables.templateId ?? undefined,
        mesocycleId: selectedMeso,
      });
    },
  });

  return (
    <Screen glowColor="rgba(0,180,140,0.2)">
      <BackHeader title="Start Workout" subtitle="Choose how to begin" onBack={() => navigation.goBack()} />

      <Pressable onPress={() => startSession.mutate({ templateId: null })} style={{ marginTop: 18 }} disabled={startSession.isPending}>
        <Card style={{ borderColor: "rgba(0,212,168,0.3)", backgroundColor: "rgba(0,212,168,0.12)" }}>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={[styles.sectionIconWrapSmall, { backgroundColor: "rgba(0,212,168,0.2)" }]}>
                <Feather name="zap" size={22} color={COLORS.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Empty Workout</Text>
                <Text style={styles.detailLabel}>Start from scratch</Text>
              </View>
            </View>
            <Feather name="play" size={20} color={COLORS.teal} />
          </View>
        </Card>
      </Pressable>

      <View style={{ marginTop: 20 }}>
        <SectionEyebrow>Attach to Mesocycle (optional)</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          <SelectableRow selected={selectedMeso === null} onPress={() => setSelectedMeso(null)} label="No mesocycle" />
          {(mesocycles.data ?? []).map((meso) => (
            <SelectableRow
              key={meso.id}
              selected={selectedMeso === String(meso.id)}
              onPress={() => setSelectedMeso(String(meso.id))}
              label={meso.name}
              sublabel={meso.goal ?? `${meso.weeks ?? "-"} weeks`}
              color={COLORS.purple}
            />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionEyebrow>From Template</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {templates.isPending ? <LoadingCard label="Loading templates..." /> : null}
          {(templates.data ?? []).map((template) => (
            <Pressable key={template.id} onPress={() => setSelectedTemplate((current) => (current === String(template.id) ? null : String(template.id)))}>
              <Card
                style={{
                  borderColor: selectedTemplate === String(template.id) ? "rgba(0,212,168,0.44)" : COLORS.border,
                  backgroundColor: selectedTemplate === String(template.id) ? "rgba(0,212,168,0.12)" : COLORS.card,
                }}
              >
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flex: 1, alignItems: "flex-start" }]}>
                    <Radio selected={selectedTemplate === String(template.id)} color={COLORS.teal} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{template.name}</Text>
                      <View style={[styles.rowGapLarge, { marginTop: 6 }]}>
                        <MetaInline
                          icon={<MaterialCommunityIcons name="dumbbell" size={10} color="rgba(255,255,255,0.32)" />}
                          text={template.description ?? "Template"}
                        />
                        <MetaInline icon={<Feather name="calendar" size={10} color="rgba(255,255,255,0.32)" />} text={formatShortDate(template.updated_at)} />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.listMeta}>{template.is_public ? "Public" : "Private"}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      <PrimaryButton
        label={
          selectedTemplate
            ? `Start with ${templates.data?.find((item) => String(item.id) === selectedTemplate)?.name ?? "template"}`
            : "Start Workout"
        }
        onPress={() => startSession.mutate({ templateId: selectedTemplate })}
        disabled={startSession.isPending}
        icon={startSession.isPending ? <ActivityIndicator color="#000000" /> : <Feather name="play" size={18} color="#000000" />}
        style={{ marginTop: 22 }}
      />
      {startSession.isError ? (
        <View style={[styles.errorBox, { marginTop: 12 }]}>
          <Text style={styles.errorText}>{getApiErrorMessage(startSession.error)}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function ActiveWorkoutScreen({
  navigation,
  route,
}: {
  navigation: any;
  route?: { params?: { sessionId?: number; templateId?: string; mesocycleId?: string | null } };
}) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const sessionId = route?.params?.sessionId;
  const templateId = toNumberId(route?.params?.templateId);
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<WorkoutDraftExercise[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showFinish, setShowFinish] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [error, setError] = useState("");
  const template = useTemplateDetailQuery(templateId, auth.isAuthenticated && !!templateId);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, auth.isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!template.data || lookup.size === 0) return;
    if (exercises.length > 0) {
      setExercises((prev) =>
        prev.map((ex) => ({
          ...ex,
          name: nameForExercise(ex.exerciseId, lookup),
          emoji: exerciseEmoji(lookup.get(ex.exerciseId)),
        })),
      );
      return;
    }
    const draft = workoutDraftFromTemplate(template.data, lookup);
    setExercises(draft);
    setExpanded(draft[0]?.id ?? null);
  }, [lookup, template.data]);

  const completedSets = exercises.flatMap((exercise) => exercise.sets.filter((set) => set.done && !set.warmup)).length;
  const totalSets = exercises.flatMap((exercise) => exercise.sets.filter((set) => !set.warmup)).length;

  const persistSet = async (exercise: WorkoutDraftExercise, set: WorkoutDraftSet, shouldComplete: boolean) => {
    if (!sessionId) throw new Error("Session was not created.");
    if (!shouldComplete) {
      if (set.serverId) await deleteExerciseSetWorkoutSessionsSessionIdSetsSetIdDelete(sessionId, set.serverId);
      return undefined;
    }

    const rpeErr = rpeError(set.rpe);
    if (rpeErr) throw new Error(`"${exercise.name}": ${rpeErr}`);

    const setNumber = exercise.sets.filter((item) => !item.warmup).findIndex((item) => item.id === set.id) + 1;
    const payload = {
      exercise_id: exercise.exerciseId,
      set_number: Math.max(1, setNumber),
      set_type: set.warmup ? "warmup" : "working",
      reps: numberOrNull(set.reps),
      weight_kg: numberOrNull(set.weight),
      rpe: numberOrNull(set.rpe),
      is_pr: false,
      notes: null,
      logged_at: new Date().toISOString(),
    };

    if (set.serverId) {
      const response = await updateExerciseSetWorkoutSessionsSessionIdSetsSetIdPatch(sessionId, set.serverId, payload);
      return successData(response).id;
    }
    const response = await createExerciseSetWorkoutSessionsSessionIdSetsPost(sessionId, payload);
    return successData(response).id;
  };

  const toggleSet = async (exerciseId: string, setId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    const set = exercise?.sets.find((item) => item.id === setId);
    if (!exercise || !set) return;
    const shouldComplete = !set.done;
    setError("");
    try {
      const serverId = await persistSet(exercise, set, shouldComplete);
      setExercises((current) =>
        current.map((currentExercise) =>
          currentExercise.id === exerciseId
            ? {
                ...currentExercise,
                sets: currentExercise.sets.map((currentSet) =>
                  currentSet.id === setId ? { ...currentSet, done: shouldComplete, serverId: shouldComplete ? serverId : undefined } : currentSet,
                ),
              }
            : currentExercise,
        ),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const updateSet = (exerciseId: string, setId: string, field: "weight" | "reps" | "rpe", value: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
            }
          : exercise,
      ),
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: [
                ...exercise.sets,
                {
                  id: Date.now().toString(),
                  weight: exercise.sets.filter((set) => !set.warmup).at(-1)?.weight ?? "60",
                  reps: exercise.sets.filter((set) => !set.warmup).at(-1)?.reps ?? "8",
                  rpe: "",
                  done: false,
                  warmup: false,
                },
              ],
            }
          : exercise,
      ),
    );
  };

  const addExercise = (exercise: ExerciseResponse) => {
    const nextId = Date.now().toString();
    const nextExercise: WorkoutDraftExercise = {
      id: nextId,
      exerciseId: exercise.id,
      name: exercise.name,
      emoji: exerciseEmoji(exercise),
      notes: "",
      sets: [{ id: `${nextId}-1`, weight: "60", reps: "8", rpe: "", done: false, warmup: false }],
    };
    setExercises((current) => [...current, nextExercise]);
    setExpanded(nextId);
    setShowExercisePicker(false);
  };

  const confirmDiscard = async () => {
    if (sessionId) {
      try {
        await deleteWorkoutSessionWorkoutSessionsSessionIdDelete(sessionId);
        queryClient.removeQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      } catch (err) {
        Alert.alert("Error", getApiErrorMessage(err));
        return;
      }
    }
    setShowDiscardConfirm(false);
    navigation.goBack();
  };

  const discardWorkout = () => {
    setShowDiscardConfirm(true);
  };

  const finishWorkout = async () => {
    if (!sessionId) return;
    if (!auth.isAuthenticated) {
      setError("Session expired. Please log in again.");
      return;
    }
    setError("");
    try {
      await updateWorkoutSessionWorkoutSessionsSessionIdPatch(sessionId, {
        finished_at: new Date().toISOString(),
        is_completed: true,
        mood,
        notes: note || null,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      setShowFinish(false);
      navigation.replace("SessionDetail", { id: String(sessionId) });
    } catch (err) {
      console.error("Finish workout error:", err);
      const msg = getApiErrorMessage(err);
      if (msg.includes("fetch") || msg.includes("network")) {
        setError("Network error. Check your connection and try again.");
      } else {
        setError(msg);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen glowColor="rgba(0,0,0,0)">
        <Card style={[styles.stickyCard, { marginTop: 0 }]}>
          <View style={styles.rowBetween}>
            <Pressable style={styles.dangerPill} onPress={discardWorkout}>
              <Feather name="x" size={13} color={COLORS.red} />
              <Text style={styles.dangerPillText}>Discard</Text>
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
              <Text style={styles.timerSubtext}>
                {completedSets}/{totalSets} work sets done
              </Text>
            </View>
            <Pressable style={styles.finishPill} onPress={() => setShowFinish(true)}>
              <Feather name="check" size={13} color="#000000" />
              <Text style={styles.finishPillText}>Finish</Text>
            </Pressable>
          </View>
          <View style={{ marginTop: 14 }}>
            <ProgressBar value={totalSets ? (completedSets / totalSets) * 100 : 0} color={COLORS.teal} />
          </View>
        </Card>

        {template.isPending && templateId ? <LoadingCard label="Loading template workout..." /> : null}
        {error ? (
          <View style={[styles.errorBox, { marginTop: 12 }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 16, gap: 12 }}>
          {exercises.map((exercise) => {
            const done = exercise.sets.filter((set) => set.done && !set.warmup).length;
            const total = exercise.sets.filter((set) => !set.warmup).length;
            return (
              <Card key={exercise.id} style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
                <Pressable onPress={() => setExpanded((current) => (current === exercise.id ? null : exercise.id))} style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    <Text style={{ fontSize: 22 }}>{exercise.emoji}</Text>
                    <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
                  </View>
                  <View style={styles.rowGap}>
                    <Text style={styles.listMeta}>
                      {done}/{total}
                    </Text>
                    <Feather name={expanded === exercise.id ? "chevron-up" : "chevron-down"} size={15} color="rgba(255,255,255,0.42)" />
                  </View>
                </Pressable>
                {expanded === exercise.id ? (
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.workoutGridHeader}>
                      {["Set", "kg", "Reps", "RPE", ""].map((label) => (
                        <Text key={label} style={[styles.gridHeaderText, label === "" ? { width: 36 } : { flex: 1 }]}>
                          {label}
                        </Text>
                      ))}
                    </View>
                    <View style={{ gap: 8 }}>
                      {exercise.sets.map((set) => (
                        <View key={set.id} style={[styles.workoutGridRow, set.done ? { opacity: 0.56 } : null]}>
                          <View style={styles.workoutGridIndex}>
                            <Text style={[styles.smallStrongText, { color: set.warmup ? COLORS.orange : "rgba(255,255,255,0.55)" }]}>
                              {set.warmup ? "W" : exercise.sets.filter((item) => !item.warmup).indexOf(set) + 1}
                            </Text>
                          </View>
                          <MiniInput
                            value={set.weight}
                            onChangeText={(value) => updateSet(exercise.id, set.id, "weight", value)}
                            strike={set.done}
                          />
                          <MiniInput
                            value={set.reps}
                            onChangeText={(value) => updateSet(exercise.id, set.id, "reps", value)}
                            strike={set.done}
                          />
                          <MiniInput
                            value={set.rpe}
                            onChangeText={(value) => updateSet(exercise.id, set.id, "rpe", value)}
                            placeholder="-"
                          />
                          <Pressable
                            onPress={() => void toggleSet(exercise.id, set.id)}
                            style={[styles.doneToggle, set.done ? { backgroundColor: COLORS.teal, borderColor: COLORS.teal } : null]}
                          >
                            {set.done ? <Feather name="check" size={15} color="#000000" /> : null}
                          </Pressable>
                        </View>
                      ))}
                    </View>
                    <Pressable style={styles.dashedButton} onPress={() => addSet(exercise.id)}>
                      <Feather name="plus" size={13} color={COLORS.teal} />
                      <Text style={styles.dashedButtonText}>Add Set</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })}

          <Pressable onPress={() => setShowExercisePicker(true)}>
            <View style={styles.dashedAddCard}>
              <View style={[styles.addCircle, { backgroundColor: "rgba(0,212,168,0.12)" }]}>
                <Feather name="plus" size={18} color={COLORS.teal} />
              </View>
              <Text style={[styles.cardTitle, { color: "rgba(255,255,255,0.58)" }]}>Add Exercise</Text>
            </View>
          </Pressable>

          <Card>
            <SectionEyebrow>Session Notes</SectionEyebrow>
            <View style={[styles.rowGap, { marginTop: 12, flexWrap: "wrap" }]}>
              {["😴", "😐", "😊", "💪", "🔥"].map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setMood(entry)}
                  style={[
                    styles.moodButton,
                    mood === entry ? { backgroundColor: "rgba(0,212,168,0.2)", borderColor: "rgba(0,212,168,0.4)" } : null,
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{entry}</Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.rowGap, { alignItems: "flex-start", marginTop: 14 }]}>
              <Feather name="file-text" size={14} color="rgba(255,255,255,0.3)" style={{ marginTop: 10 }} />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="How did this session feel? Any notes..."
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.notesInput}
                multiline
              />
            </View>
          </Card>
        </View>

        <Modal visible={showFinish} transparent animationType="slide" onRequestClose={() => setShowFinish(false)}>
          <View style={styles.modalScrim}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowFinish(false)} />
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Finish Workout?</Text>
              <Text style={styles.sheetSubtitle}>
                {formatTime(elapsed)} elapsed - {completedSets}/{totalSets} sets completed
              </Text>
              <View style={[styles.rowGap, { marginTop: 16, flexWrap: "wrap" }]}>
                <Feather name="smile" size={16} color={COLORS.teal} />
                {["😴", "😐", "😊", "💪", "🔥"].map((entry) => (
                  <Pressable key={entry} onPress={() => setMood(entry)} style={{ opacity: mood && mood !== entry ? 0.45 : 1 }}>
                    <Text style={{ fontSize: 24 }}>{entry}</Text>
                  </Pressable>
                ))}
              </View>
              <PrimaryButton
                label="Finish & Save"
                onPress={() => void finishWorkout()}
                icon={<Feather name="check" size={16} color="#000000" />}
                style={{ marginTop: 18 }}
              />
              <PrimaryButton label="Keep going" onPress={() => setShowFinish(false)} subtle style={{ marginTop: 10 }} />
            </View>
          </View>
        </Modal>

        <ExercisePicker
          variant="pick"
          visible={showExercisePicker}
          title="Add Exercise"
          enabled={auth.isAuthenticated}
          onSelect={(exercise) => addExercise(exercise)}
          onClose={() => setShowExercisePicker(false)}
        />

        <ConfirmDialog
          visible={showDiscardConfirm}
          title="Discard Workout"
          message="This will delete the session and all logged sets."
          confirmText="Discard"
          cancelText="Cancel"
          destructive
          onConfirm={confirmDiscard}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function WorkoutHistoryScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const sessions = useSessionsQuery(auth.isAuthenticated);
  const totalVolume = (sessions.data ?? []).reduce((sum, session) => sum + (session.total_volume ?? 0), 0);
  const grouped = useMemo(() => {
    return (sessions.data ?? []).reduce<Record<string, WorkoutSessionResponse[]>>((acc, session) => {
      const key = formatDateLabel(session.started_at);
      acc[key] = [...(acc[key] ?? []), session];
      return acc;
    }, {});
  }, [sessions.data]);

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader title="Workout History" subtitle={`${sessions.data?.length ?? 0} sessions`} onBack={() => navigation.goBack()} />
      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard label="Total Sessions" value={String(sessions.data?.length ?? 0)} />
        <CompactStatCard label="Total Volume" value={`${Math.round(totalVolume / 1000)}k kg`} />
        <CompactStatCard label="Completed" value={String((sessions.data ?? []).filter((session) => session.is_completed).length)} />
      </View>
      {sessions.isPending ? <LoadingCard label="Loading history..." /> : null}
      {sessions.isError ? <ErrorCard error={sessions.error} onRetry={() => sessions.refetch()} /> : null}
      <View style={{ marginTop: 18, gap: 18 }}>
        {Object.entries(grouped).map(([week, weekSessions]) => (
          <View key={week}>
            <SectionEyebrow>{week}</SectionEyebrow>
            <View style={{ gap: 10, marginTop: 12 }}>
              {weekSessions.map((session) => (
                <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: String(session.id) })}>
                  <Card style={styles.listRowCard}>
                    <View style={styles.historyMoodWrap}>
                      <Text style={{ fontSize: 18 }}>{session.mood ?? "✓"}</Text>
                    </View>
                    <View style={styles.listRowBody}>
                      <Text style={styles.listRowTitle}>{workoutTitle(session)}</Text>
                      <Text style={styles.detailLabel}>
                        {formatShortDate(session.started_at)} - {formatTimeLabel(session.started_at)}
                      </Text>
                      <View style={[styles.rowGapLarge, { marginTop: 6 }]}>
                        <MetaInline icon={<Feather name="clock" size={10} color="rgba(255,255,255,0.3)" />} text={`${session.duration_minutes ?? 0}m`} />
                        <MetaInline
                          icon={<MaterialCommunityIcons name="dumbbell" size={10} color="rgba(255,255,255,0.3)" />}
                          text={`${session.total_sets ?? 0} sets`}
                        />
                        {(session.prs_count ?? 0) > 0 ? <Tag label={`${session.prs_count} PR`} color={COLORS.gold} /> : null}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.22)" />
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        {!sessions.isPending && (sessions.data?.length ?? 0) === 0 ? (
          <EmptyCard title="No workouts yet" text="Start a workout to populate your history." />
        ) : null}
      </View>
    </Screen>
  );
}

function SessionDetailScreen({ navigation, route }: { navigation: any; route?: { params?: { id?: string } } }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const sessionId = toNumberId(route?.params?.id);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const detail = useSessionDetailQuery(sessionId, auth.isAuthenticated);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, auth.isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);
  const exerciseGroups = useMemo(() => groupSetsByExercise(detail.data?.sets ?? [], lookup), [detail.data?.sets, lookup]);

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
      <Screen glowColor="rgba(0,180,140,0.12)">
        <BackHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading session..." />
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen glowColor="rgba(0,180,140,0.12)">
        <BackHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <ErrorCard error={detail.error} onRetry={() => detail.refetch()} />
      </Screen>
    );
  }

  const session = detail.data;

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader
        title="Session Detail"
        onBack={() => navigation.goBack()}
        right={
          <RoundButton onPress={() => setShowMenu((value) => !value)}>
            <Feather name="more-horizontal" size={16} color="rgba(255,255,255,0.7)" />
          </RoundButton>
        }
      />

      <View style={{ marginTop: 18 }}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap}>
            <Text style={{ fontSize: 30 }}>{session.mood ?? "✓"}</Text>
            <View>
              <Text style={styles.heroTitle}>{workoutTitle(session)}</Text>
              <Text style={styles.detailLabel}>{formatDateLabel(session.started_at)}</Text>
            </View>
          </View>
          {(session.prs_count ?? 0) > 0 ? <Tag label={`${session.prs_count} PR!`} color={COLORS.gold} /> : null}
        </View>
        <View style={[styles.threeUpGrid, { marginTop: 14 }]}>
          <DetailStat label="Duration" value={`${session.duration_minutes ?? 0}m`} icon={<Feather name="clock" size={13} color={COLORS.teal} />} />
          <DetailStat
            label="Sets"
            value={String(session.total_sets ?? session.sets.length)}
            icon={<MaterialCommunityIcons name="dumbbell" size={13} color={COLORS.teal} />}
          />
          <DetailStat
            label="Volume"
            value={formatVolume(session.total_volume)}
            icon={<MaterialCommunityIcons name="dumbbell" size={13} color={COLORS.teal} />}
          />
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 18 }}>
        {exerciseGroups.map((exercise) => (
          <Card key={exercise.name} style={{ paddingHorizontal: 16, paddingVertical: 0 }}>
            <View style={styles.exerciseHeader}>
              <Text style={{ fontSize: 20 }}>{exercise.emoji}</Text>
              <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
              {exercise.sets.some((set) => set.is_pr) ? <Tag label="PR" color={COLORS.gold} /> : null}
            </View>
            <View style={{ paddingVertical: 14 }}>
              <View style={styles.sessionGridHeader}>
                {["Set", "kg", "Reps", "RPE"].map((label) => (
                  <Text key={label} style={styles.gridHeaderText}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={{ gap: 8 }}>
                {exercise.sets.map((set) => (
                  <View key={set.id} style={styles.sessionGridRow}>
                    <Text style={[styles.smallStrongText, { width: 28, textAlign: "center", color: set.set_type === "warmup" ? COLORS.orange : COLORS.muted }]}>
                      {set.set_type === "warmup" ? "W" : set.set_number}
                    </Text>
                    {[formatKg(set.weight_kg, ""), set.reps ?? "-", set.rpe ?? "-"].map((value, index) => (
                      <View key={`${set.id}-${index}`} style={styles.sessionCell}>
                        <Text style={styles.sessionCellText}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: 24, marginBottom: 32 }}>
        <PrimaryButton label="Done" onPress={() => navigation.goBack()} icon={<Feather name="check" size={18} color="#000000" />} />
      </View>

      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEdit(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit Session</Text>
            <View style={{ marginTop: 16, gap: 14 }}>
              <View>
                <Text style={styles.inputLabel}>Workout Name</Text>
                <TextInput
                  style={styles.textArea}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Workout name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Mood (emoji)</Text>
                <TextInput
                  style={styles.input}
                  value={editMood}
                  onChangeText={setEditMood}
                  placeholder="e.g. 😊"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={styles.textArea}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Add notes..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                />
              </View>
            </View>
            <PrimaryButton label="Save Changes" onPress={() => void saveEdit()} icon={<Feather name="check" size={16} color="#000000" />} style={{ marginTop: 18 }} />
            <PrimaryButton label="Cancel" onPress={() => setShowEdit(false)} subtle style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.menuModalBackdrop} onPress={() => setShowMenu(false)}>
          <View style={styles.menuModalContent}>
            <Pressable style={styles.menuItem} onPress={handleEdit} hitSlop={12}>
              <Feather name="edit-3" size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.menuItemText}>Edit session</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDelete} hitSlop={12}>
              <Feather name="trash-2" size={14} color={COLORS.red} />
              <Text style={[styles.menuItemText, { color: COLORS.red }]}>Delete session</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Session"
        message="This will permanently delete this workout session and recalculate PRs."
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Screen>
  );
}

function MesocycleListScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const mesocycles = useMesocyclesQuery(auth.isAuthenticated);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMesoName, setNewMesoName] = useState("");
  const [newMesoGoal, setNewMesoGoal] = useState<string | null>(null);
  const [newMesoWeeks, setNewMesoWeeks] = useState("6");
  const createMeso = useMutation({
    mutationFn: async () =>
      createMesocycleMesocyclesPost({
        name: newMesoName || "New Mesocycle",
        goal: newMesoGoal,
        started_on: new Date().toISOString().slice(0, 10),
        weeks: newMesoWeeks ? Number(newMesoWeeks) : null,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      setShowCreateModal(false);
      setNewMesoName("");
      setNewMesoGoal(null);
      setNewMesoWeeks("6");
      navigation.navigate("MesocycleDetail", { id: String(successData(response).id) });
    },
  });

  return (
    <Screen glowColor="rgba(139,92,246,0.16)">
      <BackHeader
        title="Mesocycles"
        subtitle="Block periodization planning"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={[styles.smallAccentButton, { backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.3)" }]}
          >
            <Feather name="plus" size={14} color={COLORS.purple} />
            <Text style={[styles.smallAccentText, { color: COLORS.purple }]}>New</Text>
          </Pressable>
        }
      />

      <View style={[styles.rowGap, { marginTop: 6 }]}>
        <Tag label="ADVANCED" color={COLORS.purple} />
      </View>

      <Card style={{ marginTop: 18, backgroundColor: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.2)" }}>
        <View style={styles.rowGap}>
          <Feather name="trending-up" size={18} color={COLORS.purple} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.listRowTitle, { color: COLORS.purple }]}>Advanced Planning Mode</Text>
            <Text style={styles.detailLabel}>
              Mesocycles are optional training blocks.
            </Text>
          </View>
        </View>
      </Card>

      {mesocycles.isPending ? <LoadingCard label="Loading mesocycles..." /> : null}
      {mesocycles.isError ? <ErrorCard error={mesocycles.error} onRetry={() => mesocycles.refetch()} /> : null}

      <View style={{ marginTop: 18, gap: 12 }}>
        {(mesocycles.data ?? []).map((meso) => {
          const start = new Date(meso.started_on).getTime();
          const end = meso.ended_on ? new Date(meso.ended_on).getTime() : start + (meso.weeks ?? 0) * 7 * 24 * 60 * 60 * 1000;
          const progress = end > start ? ((Date.now() - start) / (end - start)) * 100 : 0;
          return (
            <Pressable key={meso.id} onPress={() => navigation.navigate("MesocycleDetail", { id: String(meso.id) })}>
              <Card style={{ borderColor: "rgba(139,92,246,0.24)" }}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowGap}>
                      <View style={[styles.statusDot, { backgroundColor: COLORS.purple }]} />
                      <Text style={styles.cardTitle}>{meso.name}</Text>
                    </View>
                    <Text style={[styles.detailLabel, { marginLeft: 14, marginTop: 6 }]}>{meso.goal ?? "Training block"}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Tag label={meso.ended_on ? "Complete" : "Active"} color={meso.ended_on ? COLORS.green : COLORS.purple} />
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.25)" />
                  </View>
                </View>
                <View style={{ marginTop: 14 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.detailLabel}>{meso.weeks ? `${meso.weeks} weeks` : "Open ended"}</Text>
                    <Text style={[styles.smallStrongText, { color: COLORS.purple }]}>{Math.round(Math.max(0, Math.min(100, progress)))}%</Text>
                  </View>
                  <View style={{ marginTop: 8 }}>
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
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateModal(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Mesocycle</Text>

            <View style={{ marginTop: 20 }}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                value={newMesoName}
                onChangeText={setNewMesoName}
                placeholder="e.g. Summer Strength Block"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.input}
                autoFocus
              />
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Goal (optional)</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {MESOCYCLE_GOALS.map((goal) => (
                  <Pressable
                    key={goal.value}
                    onPress={() => setNewMesoGoal(newMesoGoal === goal.value ? null : goal.value)}
                    style={[
                      styles.chipButton,
                      newMesoGoal === goal.value ? { backgroundColor: "rgba(139,92,246,0.2)", borderColor: "rgba(139,92,246,0.5)" } : null,
                    ]}
                  >
                    <Text style={[styles.chipButtonText, newMesoGoal === goal.value ? { color: COLORS.text } : null]}>
                      {goal.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Weeks (optional)</Text>
              <TextInput
                value={newMesoWeeks}
                onChangeText={setNewMesoWeeks}
                placeholder="e.g. 6"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.input}
                keyboardType="number-pad"
              />
            </View>

            <PrimaryButton
              label={createMeso.isPending ? "Creating..." : "Create"}
              onPress={() => createMeso.mutate()}
              disabled={createMeso.isPending}
              icon={<Feather name="check" size={16} color="#000000" />}
              style={{ marginTop: 22 }}
            />
            <PrimaryButton label="Cancel" onPress={() => setShowCreateModal(false)} subtle style={{ marginTop: 10 }} />

            {createMeso.isError ? (
              <Text style={[styles.errorText, { marginTop: 10, textAlign: "center" }]}>{getApiErrorMessage(createMeso.error)}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function MesocycleDetailScreen({ navigation, route }: { navigation: any; route?: { params?: { id?: string } } }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const mesocycleId = toNumberId(route?.params?.id);
  const detail = useMesocycleDetailQuery(mesocycleId, auth.isAuthenticated);
  const analytics = useMesocycleAnalyticsQuery(mesocycleId, undefined, auth.isAuthenticated);
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
      <Screen glowColor="rgba(139,92,246,0.16)">
        <BackHeader title="Mesocycle" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading mesocycle..." />
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen glowColor="rgba(139,92,246,0.16)">
        <BackHeader title="Mesocycle" onBack={() => navigation.goBack()} />
        <ErrorCard error={detail.error} onRetry={() => detail.refetch()} />
      </Screen>
    );
  }

  const meso = detail.data;
  const summary = analytics.data?.current_block_summary;
  const delta = analytics.data?.comparison_to_previous;
  const muscleBalance = analytics.data?.muscle_balance;
  const start = new Date(meso.started_on).getTime();
  const end = meso.ended_on ? new Date(meso.ended_on).getTime() : start + (meso.weeks ?? 0) * 7 * 24 * 60 * 60 * 1000;
  const progress = end > start ? Math.max(0, Math.min(100, ((Date.now() - start) / (end - start)) * 100)) : 0;

  return (
    <Screen glowColor="rgba(139,92,246,0.16)">
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
        <Pressable onPress={() => navigation.navigate("MuscleBalance", { mesocycleId: mesocycleId })} style={styles.analyticsLink}>
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

function ProgressHubScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const overview = useOverviewQuery(auth.isAuthenticated);
  const latestPr = overview.data?.recent_personal_records[0];
  return (
    <Screen glowColor="rgba(251,191,36,0.1)">
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
                if (section.path === "personalRecords") navigation.navigate("PersonalRecords");
                else if (section.path === "exerciseProgress") navigation.navigate("ExerciseProgress");
                else if (section.path === "muscleBalance") navigation.navigate("MuscleBalance");
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

function PersonalRecordsScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const appConfig = useAppConfigQuery();
  const records = usePersonalRecordsQuery(filter === "All" ? undefined : { record_type: filter }, auth.isAuthenticated);
  const exercises = useExercisesQuery({ limit: 200, offset: 0 }, auth.isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(exercises.data?.items), [exercises.data?.items]);

  const grouped = useMemo(() => {
    const normalized = search.toLowerCase();
    const groups = new Map<string, PersonalRecordResponse[]>();
    (records.data ?? []).forEach((record) => {
      const name = nameForExercise(record.exercise_id, lookup);
      if (normalized && !name.toLowerCase().includes(normalized) && !record.exercise_id.toLowerCase().includes(normalized)) return;
      groups.set(record.exercise_id, [...(groups.get(record.exercise_id) ?? []), record]);
    });
    return Array.from(groups.entries()).map(([exerciseId, items]) => ({ exerciseId, records: items }));
  }, [lookup, records.data, search]);
  const recordTypes = ["All", ...(appConfig.data?.supported_values.personal_record_types ?? RECORD_TYPES.filter((type) => type !== "All"))];

  return (
    <Screen glowColor="rgba(251,191,36,0.14)">
      <BackHeader title="Personal Records" subtitle="Automatically tracked" onBack={() => navigation.goBack()} />

      <Card style={{ marginTop: 18 }}>
        <Text style={styles.stepText}>
          PRs are automatically derived from completed sessions.
        </Text>
      </Card>

      <View style={[styles.searchWrap, { marginTop: 14 }]}>
        <Feather name="award" size={14} color="rgba(255,255,255,0.35)" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor="rgba(255,255,255,0.32)"
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 14 }}>
        {recordTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => setFilter(type)}
            style={[
              styles.filterChip,
              filter === type ? { backgroundColor: "rgba(251,191,36,0.2)", borderColor: "rgba(251,191,36,0.4)" } : null,
            ]}
          >
            <Text style={[styles.filterChipText, filter === type ? { color: COLORS.gold } : null]}>{type}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {records.isPending ? <LoadingCard label="Loading personal records..." /> : null}
      {records.isError ? <ErrorCard error={records.error} onRetry={() => records.refetch()} /> : null}

      <View style={{ marginTop: 16, gap: 12 }}>
        {grouped.map((entry) => {
          const exercise = lookup.get(entry.exerciseId);
          return (
          <Card key={entry.exerciseId} style={{ paddingVertical: 0 }}>
            <Pressable style={styles.exerciseHeader} onPress={() => navigation.navigate("ExerciseProgress", { id: entry.exerciseId })}>
              <Text style={{ fontSize: 20 }}>{exerciseEmoji(exercise)}</Text>
              <Text style={[styles.listRowTitle, { flex: 1 }]}>{nameForExercise(entry.exerciseId, lookup)}</Text>
              <View style={styles.rowGapTiny}>
                <Feather name="trending-up" size={13} color="rgba(255,255,255,0.32)" />
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.22)" />
              </View>
            </Pressable>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
              {entry.records.map((record) => (
                  <View key={record.id} style={styles.rowBetween}>
                    <View style={styles.rowGap}>
                      <View style={[styles.softIconWrap, { backgroundColor: "rgba(251,191,36,0.12)" }]}>
                        <Feather name="award" size={13} color={COLORS.gold} />
                      </View>
                      <View>
                        <Text style={styles.smallStrongText}>{record.record_type}</Text>
                        <Text style={styles.listMeta}>{formatShortDate(record.achieved_on)}</Text>
                      </View>
                    </View>
                    <View style={styles.rowGap}>
                      <Text style={[styles.prValue, { color: COLORS.gold }]}>{recordValue(record)}</Text>
                    </View>
                  </View>
                ))}
            </View>
          </Card>
          );
        })}
        {!records.isPending && grouped.length === 0 ? <EmptyCard title="No records found" text="Complete workouts to generate records." /> : null}
      </View>
    </Screen>
  );
}

function ExerciseProgressScreen({ navigation, route }: { navigation: any; route: { params: { id?: string } } }) {
  const auth = useAuth();
  const routeId = route.params?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(routeId);
  const fromPicker = !routeId;
  const [period, setPeriod] = useState("3M");
  const progress = useExerciseProgressQuery(selectedId, undefined, auth.isAuthenticated && !!selectedId);

  const now = new Date();
  const periodDays: Record<string, number | null> = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365, All: null };
  const cutoffDays = periodDays[period] ?? null;
  const cutoffDate = cutoffDays ? new Date(now.getTime() - cutoffDays * 86400000) : null;

  const rawE1rmData =
    progress.data?.e1rm_history.map((item) => ({
      label: formatShortDate(item.performed_at),
      value: item.default_e1rm ?? item.weight_kg ?? 0,
      performed_at: item.performed_at,
    })) ?? [];
  const rawVolumeData =
    progress.data?.weekly_volume_history.map((item, index, array) => ({
      label: formatShortDate(item.week_start),
      value: item.volume_load,
      highlight: index === array.length - 1,
      week_start: item.week_start,
    })) ?? [];

  const e1rmData = cutoffDate
    ? rawE1rmData.filter((item) => new Date(item.performed_at) >= cutoffDate)
    : rawE1rmData;
  const volumeData = cutoffDate
    ? rawVolumeData.filter((item) => new Date(item.week_start) >= cutoffDate)
    : rawVolumeData;

  const current = e1rmData.at(-1)?.value ?? 0;
  const gain = current - (e1rmData[0]?.value ?? current);

  const allTimestamps = [
    ...(progress.data?.e1rm_history ?? []).map((i) => new Date(i.performed_at).getTime()),
    ...(progress.data?.weekly_volume_history ?? []).map((i) => new Date(i.week_start).getTime()),
  ];
  const earliestDataDate = allTimestamps.length ? new Date(Math.min(...allTimestamps)) : now;
  const availablePeriods = EXERCISE_PROGRESS_PERIODS.filter((p) => {
    const days = periodDays[p];
    if (days === null) return true;
    return earliestDataDate <= new Date(now.getTime() - days * 86400000);
  });

  if (!selectedId) {
    return (
      <Screen glowColor="rgba(0,180,140,0.12)">
        <BackHeader title="Exercise Progress" onBack={() => navigation.goBack()} />
        <View style={{ marginTop: 18, flex: 1 }}>
          <Text style={[styles.sectionCardTitle, { marginBottom: 14 }]}>Your Tracked Exercises</Text>
          <ExercisePicker
            variant="browse"
            onNavigate={(exerciseId) => setSelectedId(exerciseId)}
            enabled={auth.isAuthenticated}
            trackedOnly
            subtitle="Exercises you've logged in workouts"
          />
        </View>
      </Screen>
    );
  }

  if (progress.isPending) {
    return (
      <Screen glowColor="rgba(0,180,140,0.12)">
        <BackHeader title="Exercise Progress" onBack={fromPicker ? () => setSelectedId(undefined) : () => navigation.goBack()} />
        <LoadingCard label="Loading progress..." />
      </Screen>
    );
  }

  if (progress.isError) {
    return (
      <Screen glowColor="rgba(0,180,140,0.12)">
        <BackHeader title="Exercise Progress" onBack={fromPicker ? () => setSelectedId(undefined) : () => navigation.goBack()} />
        <ErrorCard error={progress.error} onRetry={() => progress.refetch()} />
      </Screen>
    );
  }

  const exerciseName = progress.data?.exercise_name ?? "Exercise";

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader title={exerciseName} subtitle="Exercise Progress" onBack={fromPicker ? () => setSelectedId(undefined) : () => navigation.goBack()} />

      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard label="Current e1RM" value={`${current} kg`} valueColor={COLORS.teal} />
        <CompactStatCard label="Gain" value={`${gain >= 0 ? "+" : ""}${Math.round(gain)} kg`} valueColor={gain >= 0 ? COLORS.green : COLORS.red} />
        <CompactStatCard label="All-time PR" value={`${current} kg`} valueColor={COLORS.gold} />
      </View>

      {e1rmData.length > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionCardTitle}>e1RM History</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {availablePeriods.map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setPeriod(entry)}
                  style={[
                    styles.periodChip,
                    period === entry ? { backgroundColor: "rgba(0,212,168,0.2)", borderColor: "rgba(0,212,168,0.35)" } : null,
                  ]}
                >
                  <Text style={[styles.periodChipText, period === entry ? { color: COLORS.teal } : null]}>{entry}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={{ marginTop: 14 }}>
            <TrendChart data={e1rmData} color={COLORS.teal} height={128} />
          </View>
        </Card>
      ) : null}

      {volumeData.length > 0 ? (
        <Card style={{ marginTop: 14 }}>
          <Text style={styles.sectionCardTitle}>Weekly Volume</Text>
          <View style={{ marginTop: 12 }}>
            <VerticalBars data={volumeData} height={90} />
          </View>
        </Card>
      ) : null}

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>Recent Overloads</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {(progress.data?.progressive_overload ?? []).map((entry) => (
            <Card key={`${entry.current_session_id}-${entry.performed_at}`} style={styles.listRowCard}>
              <View style={[styles.softIconWrap, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
                <Feather name="award" size={13} color={COLORS.green} />
              </View>
              <View style={styles.listRowBody}>
                <View style={styles.rowGapTiny}>
                  <Text style={[styles.smallStrongText, { color: COLORS.green }]}>+{formatVolume(entry.volume_load_delta)}</Text>
                  <Text style={styles.detailLabel}>- volume</Text>
                </View>
                <Text style={styles.listMeta}>
                  {formatShortDate(entry.performed_at)} - session {entry.current_session_id}
                </Text>
              </View>
            </Card>
          ))}
          {progress.data?.progressive_overload.length === 0 ? (
            <Text style={styles.detailLabel}>No overload comparisons yet.</Text>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function MuscleBalanceScreen({ navigation, route }: { navigation: any; route?: { params?: { mesocycleId?: number | null } } }) {
  const auth = useAuth();
  const [period, setPeriod] = useState("1W");
  const [expanded, setExpanded] = useState<string | null>(null);
  const weeks = period === "1W" ? 1 : period === "2W" ? 2 : period === "4W" ? 4 : 8;
  const mesocycleId = route?.params?.mesocycleId ?? undefined;
  const report = useMuscleBalanceQuery({ weeks, mesocycle_id: mesocycleId }, auth.isAuthenticated);
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
    <Screen glowColor="rgba(139,92,246,0.15)">
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

function ProfileScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const overview = useOverviewQuery(auth.isAuthenticated);
  const user = overview.data?.user ?? auth.user;
  const profile = overview.data?.profile;
  const name = displayName(user, profile);
  const menuSections = [
    {
      label: "My Data",
      items: [
        { label: "Edit Profile", icon: <Feather name="user" size={15} color={COLORS.teal} />, route: "ProfileSetup" as keyof RootStackParamList, color: COLORS.teal },
        {
          label: "Bodyweight History",
          icon: <MaterialCommunityIcons name="scale-bathroom" size={15} color={COLORS.green} />,
          route: "BodyweightHistory" as keyof RootStackParamList,
          color: COLORS.green,
          badge: overview.data?.latest_body_weight_log ? formatKg(overview.data.latest_body_weight_log.weight_kg) : undefined,
        },
        { label: "Personal Records", icon: <Feather name="award" size={15} color={COLORS.gold} />, route: "PersonalRecords" as keyof RootStackParamList, color: COLORS.gold },
        { label: "Exercise Progress", icon: <Feather name="trending-up" size={15} color={COLORS.teal} />, route: "ExerciseProgress" as keyof RootStackParamList, color: COLORS.teal },
      ],
    },
    {
      label: "Account",
      items: [{ label: "Account Settings", icon: <Feather name="settings" size={15} color={COLORS.purple} />, route: "Settings" as keyof RootStackParamList, color: COLORS.purple }],
    },
  ];

  return (
    <Screen glowColor="rgba(100,60,200,0.14)">
      <View style={styles.mainHeader}>
        <Text style={styles.headerTitle}>Profile</Text>
        <RoundButton onPress={() => navigation.navigate("Settings")}>
          <Feather name="settings" size={16} color="rgba(255,255,255,0.65)" />
        </RoundButton>
      </View>

      <View style={styles.profileTop}>
        <View style={styles.profileAvatarWrap}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarInitials}>{initialsFor(name)}</Text>
          </View>
          <Pressable style={styles.profileEditButton} onPress={() => navigation.navigate("ProfileSetup")}>
            <Feather name="edit-3" size={13} color={COLORS.teal} />
          </Pressable>
        </View>
        <Text style={styles.heroTitle}>{name}</Text>
        <Text style={styles.detailLabel}>@{user?.username ?? "athlete"}</Text>
        <View style={[styles.rowGapTiny, { marginTop: 8 }]}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.green }]} />
          <Text style={styles.listMeta}>
            {profile?.fitness_level ?? "Fitness level"} - {profile?.height_cm ? `${profile.height_cm}cm` : "height"} -{" "}
            {profile?.weight_kg ? formatKg(profile.weight_kg) : "weight"}
          </Text>
        </View>

        <Card style={{ width: "100%", marginTop: 18, paddingVertical: 0 }}>
          <View style={styles.profileStatsRow}>
            {[
              { label: "Sessions", value: overview.data?.stats.completed_sessions ?? 0 },
              { label: "Templates", value: overview.data?.stats.total_workout_templates ?? 0 },
              { label: "PRs", value: overview.data?.stats.personal_record_count ?? 0 },
            ].map((stat, index, array) => (
                <View key={stat.label} style={styles.profileStatCell}>
                  <Text style={[styles.profileStatValue, { color: COLORS.teal }]}>{stat.value}</Text>
                  <Text style={styles.profileStatLabel}>{stat.label}</Text>
                  {index < array.length - 1 ? <View style={styles.profileStatDivider} /> : null}
                </View>
              ))}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: 18 }}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionCardTitle}>Achievements</Text>
          <Text style={styles.linkText}>See All</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 10 }}>
          {(overview.data?.recent_personal_records.length ? overview.data.recent_personal_records : []).map((record) => (
            <Card key={record.id} style={styles.achievementCard}>
              <Text style={{ fontSize: 24 }}>🏆</Text>
              <Text style={[styles.smallStrongText, { marginTop: 10 }]}>{record.record_type}</Text>
              <Text style={[styles.listMeta, { color: COLORS.teal, marginTop: 6 }]}>{formatShortDate(record.achieved_on)}</Text>
            </Card>
          ))}
          {overview.data?.recent_personal_records.length === 0 ? (
            <Card style={styles.achievementCard}>
              <Text style={styles.detailLabel}>No PRs yet</Text>
            </Card>
          ) : null}
        </ScrollView>
      </View>

      <View style={{ marginTop: 18, gap: 16 }}>
        {menuSections.map((section) => (
          <View key={section.label}>
            <SectionEyebrow>{section.label}</SectionEyebrow>
            <Card style={{ paddingVertical: 0, marginTop: 10 }}>
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <Pressable
                    style={styles.settingsRow}
                    onPress={() => {
                      if ("id" in item && item.id) {
                        navigation.navigate(item.route, { id: item.id });
                      } else {
                        navigation.navigate(item.route);
                      }
                    }}
                  >
                    <View style={[styles.softIconWrap, { backgroundColor: `${item.color}18` }]}>{item.icon}</View>
                    <Text style={[styles.listRowTitle, { flex: 1 }]}>{item.label}</Text>
                    {"badge" in item && item.badge ? <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>{item.badge}</Text> : null}
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.25)" />
                  </Pressable>
                  {index < section.items.length - 1 ? <View style={styles.rowDivider} /> : null}
                </View>
              ))}
            </Card>
          </View>
        ))}
      </View>

      <Pressable
        onPress={async () => {
          await auth.logout();
          navigation.replace("Login");
        }}
        style={{ marginTop: 18 }}
      >
        <View style={styles.logoutButton}>
          <Feather name="log-out" size={15} color={COLORS.red} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </View>
      </Pressable>

      <Text style={styles.footerText}>Athelix - member since {formatShortDate(user?.created_at)}</Text>
    </Screen>
  );
}

function ProfileSetupScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useProfileQuery(auth.isAuthenticated);
  const [form, setForm] = useState({
    displayName: "",
    dob: "",
    gender: "",
    height: "",
    weight: "",
    fitnessLevel: "",
    unit: "metric",
    goal: "Improve strength",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setForm((current) => ({
      ...current,
      displayName: profile.display_name ?? "",
      dob: profile.date_of_birth ?? "",
      gender: profile.gender ?? "",
      height: profile.height_cm ? String(profile.height_cm) : "",
      weight: profile.weight_kg ? String(profile.weight_kg) : "",
      fitnessLevel: profile.fitness_level ?? "",
      unit: profile.preferred_unit ?? "metric",
    }));
  }, [profileQuery.data]);

  const saveProfile = useMutation({
    mutationFn: async () =>
      upsertCurrentUserProfileUsersMeProfilePut({
        display_name: form.displayName || null,
        date_of_birth: form.dob || null,
        gender: form.gender || null,
        height_cm: numberOrNull(form.height),
        weight_kg: numberOrNull(form.weight),
        fitness_level: form.fitnessLevel || null,
        preferred_unit: form.unit,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      navigation.replace("MainTabs");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  return (
    <Screen glowColor="rgba(0,180,140,0.18)">
      <BackHeader
        title="Profile Setup"
        subtitle="Tell us about yourself"
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={styles.saveChip} onPress={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
            <Feather name="check" size={13} color="#000000" />
            <Text style={styles.saveChipText}>{saveProfile.isPending ? "Saving" : "Save"}</Text>
          </Pressable>
        }
      />

      {profileQuery.isPending ? <LoadingCard label="Loading profile..." /> : null}
      {error ? (
        <View style={[styles.errorBox, { marginTop: 12 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: 18, gap: 20 }}>
        <View>
          <SectionEyebrow>Basic Info</SectionEyebrow>
          <View style={styles.formStack}>
            <LabeledInput label="Display Name" value={form.displayName} onChangeText={(value) => setForm((current) => ({ ...current, displayName: value }))} />
            <LabeledInput label="Date of Birth" value={form.dob} onChangeText={(value) => setForm((current) => ({ ...current, dob: value }))} placeholder="YYYY-MM-DD" />
            <View>
              <Text style={styles.fieldLabel}>Gender</Text>
              <ChipWrap
                items={GENDERS}
                selected={form.gender}
                onSelect={(value) => setForm((current) => ({ ...current, gender: value }))}
                activeColor={COLORS.teal}
              />
            </View>
          </View>
        </View>

        <View>
          <SectionEyebrow>Body Stats</SectionEyebrow>
          <View style={styles.twoUpGrid}>
            <LabeledInput
              label={`Height (${form.unit === "metric" ? "cm" : "ft"})`}
              value={form.height}
              onChangeText={(value) => setForm((current) => ({ ...current, height: value }))}
              keyboardType="numeric"
            />
            <LabeledInput
              label={`Weight (${form.unit === "metric" ? "kg" : "lbs"})`}
              value={form.weight}
              onChangeText={(value) => setForm((current) => ({ ...current, weight: value }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View>
          <SectionEyebrow>Fitness Level</SectionEyebrow>
          <ChipWrap
            items={FITNESS_LEVELS}
            selected={form.fitnessLevel}
            onSelect={(value) => setForm((current) => ({ ...current, fitnessLevel: value }))}
            activeColor={COLORS.teal}
            columns={2}
          />
        </View>

        <View>
          <SectionEyebrow>Primary Goal</SectionEyebrow>
          <View style={{ gap: 10, marginTop: 10 }}>
            {GOALS.map((goal) => (
              <SelectableRow
                key={goal}
                selected={form.goal === goal}
                onPress={() => setForm((current) => ({ ...current, goal }))}
                label={goal}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionEyebrow>Preferred Units</SectionEyebrow>
          <View style={{ gap: 10, marginTop: 10 }}>
            {UNITS.map((unit) => (
              <SelectableRow
                key={unit.value}
                selected={form.unit === unit.value}
                onPress={() => setForm((current) => ({ ...current, unit: unit.value }))}
                label={unit.label}
              />
            ))}
          </View>
        </View>

        <PrimaryButton
          label={saveProfile.isPending ? "Saving Profile..." : "Save Profile"}
          onPress={() => saveProfile.mutate()}
          disabled={saveProfile.isPending}
          style={{ marginTop: 6 }}
        />
      </View>
    </Screen>
  );
}

function BodyweightHistoryScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const logs = useBodyWeightLogsQuery(auth.isAuthenticated);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");
  const entries = useMemo(
    () => (logs.data ?? []).slice().sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()),
    [logs.data],
  );
  const chartData = entries
    .slice()
    .reverse()
    .map((entry) => ({ label: formatShortDate(entry.logged_at), value: entry.weight_kg }));

  const latest = entries[0]?.weight_kg ?? 0;
  const previous = entries[entries.length - 1]?.weight_kg ?? latest;
  const change = latest - previous;

  const createLog = useMutation({
    mutationFn: async () =>
      createBodyWeightLogUsersMeBodyWeightLogsPost({
        weight_kg: Number(newWeight),
        logged_at: new Date().toISOString().split("T")[0],
        notes: newNote || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      setNewWeight("");
      setNewNote("");
      setShowAdd(false);
    },
  });

  const deleteLog = useMutation({
    mutationFn: async (logId: number) => deleteBodyWeightLogUsersMeBodyWeightLogsLogIdDelete(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });

  const addEntry = () => {
    if (!newWeight) return;
    createLog.mutate();
  };

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader
        title="Bodyweight"
        onBack={() => navigation.goBack()}
        right={
          <RoundButton accent onPress={() => setShowAdd(true)}>
            <Feather name="plus" size={16} color={COLORS.teal} />
          </RoundButton>
        }
      />

      <View style={{ marginTop: 18 }}>
        <View style={styles.rowGap}>
          <Text style={styles.bigMetric}>{latest ? latest.toFixed(1) : "-"}</Text>
          <Text style={styles.metricSuffix}>kg</Text>
          {entries.length > 1 ? (
            <Text style={[styles.metricChange, { color: change < 0 ? COLORS.green : "#ef4444" }]}>
              {change < 0 ? "↓" : "↑"} {Math.abs(change).toFixed(1)} kg
            </Text>
          ) : null}
        </View>
        <Text style={styles.detailLabel}>{entries.length > 1 ? `vs. oldest entry (${previous} kg)` : "Add entries to track change"}</Text>
      </View>

      {chartData.length > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <TrendChart data={chartData} color={COLORS.teal} height={128} referenceValue={latest || undefined} />
        </Card>
      ) : null}

      {logs.isPending ? <LoadingCard label="Loading bodyweight logs..." /> : null}
      {logs.isError ? <ErrorCard error={logs.error} onRetry={() => logs.refetch()} /> : null}

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>All Entries</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {entries.map((entry, index) => (
            <Card key={entry.id} style={styles.listRowCard}>
              <View style={styles.listRowBody}>
                <View style={styles.rowGap}>
                  <Text style={[styles.cardTitle, index === 0 ? { color: COLORS.teal } : null]}>{formatKg(entry.weight_kg)}</Text>
                  {index === 0 ? <Tag label="Latest" color={COLORS.teal} /> : null}
                  {index > 0 ? (
                    <Text style={[styles.smallStrongText, { color: entry.weight_kg < entries[index - 1].weight_kg ? COLORS.green : "#ef4444" }]}>
                      {entry.weight_kg < entries[index - 1].weight_kg ? "↓" : "↑"}
                      {Math.abs(entry.weight_kg - entries[index - 1].weight_kg).toFixed(1)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.detailLabel}>
                  {formatDateLabel(entry.logged_at)}
                  {entry.notes ? ` - ${entry.notes}` : ""}
                </Text>
              </View>
              <Pressable onPress={() => deleteLog.mutate(entry.id)} style={styles.deleteWrap}>
                <Feather name="trash-2" size={13} color="rgba(239,68,68,0.8)" />
              </Pressable>
            </Card>
          ))}
          {!logs.isPending && entries.length === 0 ? <EmptyCard title="No entries yet" text="Log your first bodyweight entry." /> : null}
        </View>
      </View>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAdd(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.sheetTitle}>Log Bodyweight</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Feather name="x" size={18} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>
            <View style={{ marginTop: 18 }}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="e.g. 82.5"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.modalMetricInput}
                keyboardType="decimal-pad"
                contextMenuHidden
              />
            </View>
            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="e.g. Morning, fasted"
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.input}
              />
            </View>
            <PrimaryButton
              label={createLog.isPending ? "Saving..." : "Save Entry"}
              onPress={addEntry}
              disabled={createLog.isPending}
              icon={<Feather name="check" size={16} color="#000000" />}
              style={{ marginTop: 20 }}
            />
            {createLog.isError ? (
              <Text style={[styles.errorText, { marginTop: 10 }]}>{getApiErrorMessage(createLog.error)}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SettingsScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUserQuery(auth.isAuthenticated);
  const [form, setForm] = useState({
    username: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    prAlerts: true,
    weeklyReport: false,
    newFeatures: true,
  });

  useEffect(() => {
    if (!currentUser.data) return;
    setForm((current) => ({ ...current, username: currentUser.data.username, email: currentUser.data.email }));
  }, [currentUser.data]);

  const saveAccount = useMutation({
    mutationFn: async () =>
      updateCurrentUserUsersMePatch({
        username: form.username.trim() || null,
        email: form.email.trim() || null,
      }),
    onSuccess: (response) => {
      auth.setUser(successData(response));
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const handleSave = () => {
    setError("");
    saveAccount.mutate();
  };

  return (
    <Screen glowColor="rgba(100,60,200,0.1)">
      <BackHeader
        title="Account Settings"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            style={[styles.saveChip, saved ? { backgroundColor: "rgba(34,197,94,0.2)" } : null]}
            onPress={handleSave}
          >
            <Feather name="check" size={13} color={saved ? COLORS.green : "#000000"} />
            <Text style={[styles.saveChipText, saved ? { color: COLORS.green } : null]}>
              {saveAccount.isPending ? "Saving" : saved ? "Saved!" : "Save"}
            </Text>
          </Pressable>
        }
      />

      {currentUser.isPending ? <LoadingCard label="Loading account..." /> : null}
      {error ? (
        <View style={[styles.errorBox, { marginTop: 12 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: 18, gap: 22 }}>
        <View>
          <SectionEyebrow>Account Details</SectionEyebrow>
          <Card style={{ paddingVertical: 0, marginTop: 10 }}>
            <View style={styles.settingsSectionPad}>
              <LabeledInput label="Username" value={form.username} onChangeText={(value) => setForm((current) => ({ ...current, username: value }))} />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingsSectionPad}>
              <LabeledInput
                label="Email Address"
                value={form.email}
                onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
                keyboardType="email-address"
              />
            </View>
          </Card>
        </View>

        <View>
          <SectionEyebrow>Security</SectionEyebrow>
          <Card style={{ paddingVertical: 0, marginTop: 10 }}>
            <View style={styles.settingsSectionPad}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={form.newPassword}
                  onChangeText={(value) => setForm((current) => ({ ...current, newPassword: value }))}
                  placeholder="Leave blank to keep current"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={[styles.input, styles.inputWithRight]}
                  secureTextEntry={!showPassword}
                />
                <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
                </Pressable>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionEyebrow>Notifications</SectionEyebrow>
          <Card style={{ paddingVertical: 0, marginTop: 10 }}>
            {(
              [
                ["workoutReminders", "Workout Reminders", "Daily reminders to stay consistent"],
                ["prAlerts", "PR Alerts", "Get notified when you set a new record"],
                ["weeklyReport", "Weekly Report", "Weekly summary of your training"],
                ["newFeatures", "New Features", "Updates about new app features"],
              ] as const
            ).map(([key, label, description], index, array) => (
              <View key={key}>
                <View style={styles.notificationRow}>
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    <Feather name="bell" size={15} color={notifications[key] ? COLORS.teal : "rgba(255,255,255,0.3)"} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{label}</Text>
                      <Text style={styles.listMeta}>{description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications[key]}
                    onValueChange={() => setNotifications((current) => ({ ...current, [key]: !current[key] }))}
                    trackColor={{ false: "rgba(255,255,255,0.18)", true: COLORS.teal }}
                    thumbColor="#ffffff"
                  />
                </View>
                {index < array.length - 1 ? <View style={styles.rowDivider} /> : null}
              </View>
            ))}
          </Card>
        </View>

        <View>
          <SectionEyebrow color="rgba(239,68,68,0.7)">Danger Zone</SectionEyebrow>
          <Pressable
            onPress={() =>
              Alert.alert("Delete Account", "This would permanently delete all data. This demo does not perform the action.")
            }
          >
            <View style={styles.dangerZone}>
              <Feather name="trash-2" size={16} color={COLORS.red} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.listRowTitle, { color: COLORS.red }]}>Delete Account</Text>
                <Text style={[styles.listMeta, { color: "rgba(239,68,68,0.66)" }]}>
                  Permanently delete all data. This cannot be undone.
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(8,14,14,0.98)",
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 10 + Math.max(insets.bottom, 6),
          height: 70 + Math.max(insets.bottom, 6),
        },
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: "rgba(255,255,255,0.28)",
        tabBarLabelStyle: { fontSize: 10, marginTop: 2 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} /> }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarIcon: ({ color }) => <Feather name="compass" size={20} color={color} /> }} />
      <Tab.Screen name="Train" component={TrainHubScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name="dumbbell" size={20} color={color} /> }} />
      <Tab.Screen name="Progress" component={ProgressHubScreen} options={{ tabBarIcon: ({ color }) => <Feather name="trending-up" size={20} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} /> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
      <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      <RootStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <RootStack.Screen name="TemplateList" component={TemplateListScreen} />
      <RootStack.Screen name="TemplateBuilder" component={TemplateBuilderScreen} />
      <RootStack.Screen name="StartWorkout" component={StartWorkoutScreen} />
      <RootStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <RootStack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
      <RootStack.Screen name="SessionDetail" component={SessionDetailScreen} />
      <RootStack.Screen name="MesocycleList" component={MesocycleListScreen} />
      <RootStack.Screen name="MesocycleDetail" component={MesocycleDetailScreen} />
      <RootStack.Screen name="PersonalRecords" component={PersonalRecordsScreen} />
      <RootStack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
      <RootStack.Screen name="MuscleBalance" component={MuscleBalanceScreen} />
      <RootStack.Screen name="BodyweightHistory" component={BodyweightHistoryScreen} />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.root} translucent={false} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: COLORS.teal,
            background: COLORS.root,
            card: COLORS.screen,
            text: COLORS.text,
            border: COLORS.border,
            notification: COLORS.teal,
          },
          fonts: {
            regular: { fontFamily: "System", fontWeight: "400" as const },
            medium: { fontFamily: "System", fontWeight: "500" as const },
            bold: { fontFamily: "System", fontWeight: "700" as const },
            heavy: { fontFamily: "System", fontWeight: "800" as const },
          },
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.root, maxWidth: 390, width: "100%", alignSelf: "center" },
  screen: { flex: 1, backgroundColor: COLORS.screen },
  flexFill: { flex: 1 },
  glow: { position: "absolute", top: -180, alignSelf: "center", width: 520, height: 260, borderRadius: 260, opacity: 0.4 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  centeredContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  headerSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  roundButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 16 },
  sectionEyebrow: { color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  primaryButton: { minHeight: 56, borderRadius: 18, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  primaryButtonText: { color: "#000000", fontSize: 15, fontWeight: "800" },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  tagText: { fontSize: 10, fontWeight: "700" },
  progressTrack: { width: "100%", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  barRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  barColumn: { flex: 1, alignItems: "center" },
  barTrackShell: { justifyContent: "flex-end", width: 26 },
  bar: { width: 22, borderRadius: 6, alignSelf: "center" },
  barLabel: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 8 },
  chartArea: { position: "relative" },
  chartGridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  referenceLine: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderStyle: "dashed", borderColor: "rgba(0,212,168,0.32)" },
  chartSegment: { position: "absolute", height: 2, borderRadius: 999 },
  chartDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, borderWidth: 2 },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  chartLabelText: { flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 8, textAlign: "center" },
  splashLogo: { width: 96, height: 96, borderRadius: 28, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center", ...shadow(COLORS.teal) },
  splashEmoji: { fontSize: 38 },
  splashTitle: { color: COLORS.text, fontSize: 32, fontWeight: "900", marginTop: 28 },
  splashSubtitle: { color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 6 },
  splashProgressCard: { width: "100%", marginTop: 28, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 20, gap: 12 },
  splashProgressValue: { color: COLORS.teal, fontSize: 24, fontWeight: "800", textAlign: "center" },
  splashStatus: { color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center" },
  splashFooter: { position: "absolute", bottom: 26, color: "rgba(255,255,255,0.2)", fontSize: 11 },
  authTop: { alignItems: "center", paddingTop: 20, paddingBottom: 28 },
  authLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center", ...shadow(COLORS.teal) },
  authTitle: { color: COLORS.text, fontSize: 28, fontWeight: "900", marginTop: 22 },
  authSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  formStack: { gap: 14 },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  inputWrap: { position: "relative" },
  input: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: COLORS.text, paddingHorizontal: 16, fontSize: 14 },
  inputWithRight: { paddingRight: 46 },
  inputRightIcon: { position: "absolute", right: 14, top: 18 },
  linkText: { color: COLORS.teal, fontSize: 12, fontWeight: "600" },
  errorBox: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" },
  errorText: { color: COLORS.red, fontSize: 12 },
  fieldError: { color: COLORS.red, fontSize: 10, marginTop: 6, marginLeft: 2 },
  authDividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 26 },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerText: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  authBottomText: { color: COLORS.muted, fontSize: 13, textAlign: "center", marginTop: 24 },
  linkTextInline: { color: COLORS.teal, fontWeight: "700" },
  passwordChecks: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  passwordCheck: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkBubble: { width: 14, height: 14, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  passwordCheckText: { color: "rgba(255,255,255,0.35)", fontSize: 10 },
  legalText: { color: "rgba(255,255,255,0.3)", fontSize: 11, lineHeight: 16 },
  mainHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 },
  homeIdentity: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBubble: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.teal, ...shadow(COLORS.teal) },
  avatarInitials: { color: "#000000", fontSize: 14, fontWeight: "800" },
  kickerText: { color: "rgba(255,255,255,0.38)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2 },
  greetingText: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginTop: 2 },
  notificationDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal, top: 9, right: 9 },
  inlineSection: { marginTop: 14 },
  bannerIcon: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,212,168,0.2)" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowGapTiny: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowGapSmall: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  rowGapLarge: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  smallStrongText: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  sectionCardTitle: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  statRowDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 16, marginBottom: 16 },
  threeUp: { flexDirection: "row", alignItems: "stretch", justifyContent: "space-between" },
  statPill: { flex: 1, alignItems: "center", gap: 4 },
  statPillValue: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  statPillLabel: { color: "rgba(255,255,255,0.38)", fontSize: 10 },
  verticalDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.07)", marginHorizontal: 8 },
  softIconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
  detailLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 16 },
  heroMetric: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  metricSuffix: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  metricChange: { fontSize: 11, fontWeight: "700" },
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  metricBlockValue: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  metricBlockLabel: { color: "rgba(255,255,255,0.35)", fontSize: 9, marginTop: 3 },
  prCard: { width: 126, paddingHorizontal: 14, paddingVertical: 14 },
  prBadge: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.1 },
  prValue: { fontSize: 16, fontWeight: "900", marginTop: 6 },
  tabIntro: { paddingTop: 8 },
  tabTitle: { color: COLORS.text, fontSize: 28, fontWeight: "900", marginTop: 4 },
  tabSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  searchWrap: { flex: 1, minHeight: 50, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 13, paddingVertical: 0 },
  filterButton: { width: 48, height: 50, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  filterTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  activeFilterTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(0,212,168,0.15)", borderWidth: 1, borderColor: "rgba(0,212,168,0.3)" },
  activeFilterText: { color: COLORS.teal, fontSize: 11, fontWeight: "700" },
  resultsText: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 10 },
  listRowCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  exerciseEmojiWrap: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  listRowBody: { flex: 1 },
  listRowTitle: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyStateEmoji: { fontSize: 38 },
  emptyStateTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  emptyStateText: { color: COLORS.muted, fontSize: 13, textAlign: "center" },
  heroCard: { flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 20, paddingVertical: 20 },
  heroEmojiWrap: { width: 82, height: 82, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
  heroTitle: { color: COLORS.text, fontSize: 21, fontWeight: "900" },
  primaryMuscleTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(0,212,168,0.15)", borderWidth: 1, borderColor: "rgba(0,212,168,0.3)" },
  primaryMuscleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.teal },
  primaryMuscleText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  secondaryMuscleTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  secondaryMuscleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  secondaryMuscleText: { color: "rgba(255,255,255,0.62)", fontSize: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepBubble: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,212,168,0.2)" },
  stepBubbleText: { color: COLORS.teal, fontSize: 11, fontWeight: "800" },
  stepText: { flex: 1, color: "rgba(255,255,255,0.76)", fontSize: 13, lineHeight: 20 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipText: { flex: 1, color: "rgba(255,255,255,0.74)", fontSize: 13, lineHeight: 18 },
  trainHero: { borderRadius: 28, alignItems: "center", paddingHorizontal: 20, paddingVertical: 28, backgroundColor: COLORS.teal },
  trainHeroIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.18)" },
  trainHeroTitle: { color: "#000000", fontSize: 18, fontWeight: "900", marginTop: 14 },
  trainHeroSubtitle: { color: "rgba(0,0,0,0.55)", fontSize: 12, marginTop: 4 },
  threeUpGrid: { flexDirection: "row", gap: 10 },
  twoUpGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  compactStatCard: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 82 },
  compactStatValue: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  compactStatLabel: { color: "rgba(255,255,255,0.35)", fontSize: 9, textAlign: "center", marginTop: 6 },
  sectionIconWrap: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sectionIconWrapSmall: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  smallAccentButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(0,212,168,0.15)", borderWidth: 1, borderColor: "rgba(0,212,168,0.3)" },
  smallAccentText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  smallActionTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  smallActionText: { fontSize: 12, fontWeight: "700" },
  dashedAddCard: { borderRadius: 24, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.02)", paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  addCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  builderTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  saveChip: { minHeight: 34, borderRadius: 12, backgroundColor: COLORS.teal, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  saveChipText: { color: "#000000", fontSize: 12, fontWeight: "800" },
  templateNameInput: { marginTop: 16, minHeight: 58, borderRadius: 18, fontSize: 16, fontWeight: "700" },
  stepperBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  restChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" },
  restChipText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  miniInput: { flex: 1, minWidth: 0, minHeight: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: COLORS.text, textAlign: "center", fontSize: 13, paddingHorizontal: 4 },
  gridHeaderText: { flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 },
  dashedButton: { marginTop: 10, minHeight: 42, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(0,212,168,0.25)", backgroundColor: "rgba(0,212,168,0.08)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  dashedButtonText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  selectableRow: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "rgba(255,255,255,0.03)", justifyContent: "center", paddingHorizontal: 14 },
  chipButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" },
  chipButtonText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  radioOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  stickyCard: { marginTop: 0, borderRadius: 0, marginHorizontal: -20, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderLeftWidth: 0, borderRightWidth: 0, borderTopWidth: 0 },
  dangerPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" },
  dangerPillText: { color: COLORS.red, fontSize: 12, fontWeight: "600" },
  finishPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.teal },
  finishPillText: { color: "#000000", fontSize: 12, fontWeight: "800" },
  timerText: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  timerSubtext: { color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2 },
  workoutGridHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, marginBottom: 10 },
  workoutGridRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  workoutGridIndex: { width: 32, alignItems: "center", justifyContent: "center" },
  doneToggle: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  moodButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "transparent" },
  notesInput: { flex: 1, minHeight: 64, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", color: COLORS.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, textAlignVertical: "top" },
  modalScrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" },
  modalBackdrop: { flex: 1 },
  bottomSheet: { backgroundColor: "#111d1b", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 24, paddingTop: 14, paddingBottom: 26 },
  sheetHandle: { width: 40, height: 4, borderRadius: 4, alignSelf: "center", backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 18 },
  sheetTitle: { color: COLORS.text, fontSize: 22, fontWeight: "900", textAlign: "center" },
  sheetSubtitle: { color: COLORS.muted, fontSize: 13, textAlign: "center", marginTop: 6 },
  historyMoodWrap: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
  menuModalBackdrop: { flex: 1, justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 60, paddingRight: 20 },
  menuModalContent: { width: 170, borderRadius: 18, backgroundColor: "#111d1b", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingVertical: 6 },
  confirmBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  confirmDialog: { width: "100%", maxWidth: 320, borderRadius: 20, backgroundColor: "#111d1b", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 20, gap: 12 },
  confirmTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", textAlign: "center" },
  confirmMessage: { color: COLORS.muted, fontSize: 14, textAlign: "center", lineHeight: 20 },
  confirmButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  confirmButtonCancel: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  confirmButtonConfirm: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center" },
  confirmButtonText: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  menuPopoverScreen: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 100 },
  menuBackdrop: { flex: 1 },
  menuPopoverContent: { position: "absolute", top: 56, right: 20, width: 170, borderRadius: 18, backgroundColor: "#111d1b", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingVertical: 6 },
  menuPopover: { position: "absolute", top: 46, right: 0, width: 170, borderRadius: 18, backgroundColor: "#111d1b", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingVertical: 6, zIndex: 100 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  menuItemText: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  sessionGridHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sessionGridRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sessionCell: { flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  sessionCellText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  analyticsCard: { width: "48%", borderRadius: 16, backgroundColor: "rgba(139,92,246,0.1)", borderWidth: 1, borderColor: "rgba(139,92,246,0.15)", paddingHorizontal: 12, paddingVertical: 12 },
  analyticsLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 6 },
  analyticsValue: { fontSize: 16, fontWeight: "800" },
  analyticsSub: { color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 4 },
  analyticsLink: { marginTop: 14, borderRadius: 14, backgroundColor: "rgba(139,92,246,0.12)", paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  filterChip: { borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 16, paddingVertical: 7 },
  filterChipText: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700" },
  periodChip: { borderRadius: 10, borderWidth: 1, borderColor: "transparent", paddingHorizontal: 10, paddingVertical: 6 },
  periodChipText: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "700" },
  segmentedWrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, padding: 4, marginTop: 18 },
  segmentedOption: { flex: 1, minHeight: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  segmentedOptionActive: { backgroundColor: "rgba(139,92,246,0.25)", borderColor: "rgba(139,92,246,0.35)" },
  segmentedText: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "700" },
  profileTop: { alignItems: "center", paddingTop: 8 },
  profileAvatarWrap: { position: "relative", marginBottom: 14 },
  profileAvatar: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.teal, ...shadow(COLORS.teal) },
  profileEditButton: { position: "absolute", right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#111d1b", borderWidth: 2, borderColor: COLORS.screen },
  profileStatsRow: { flexDirection: "row", alignItems: "stretch" },
  profileStatCell: { flex: 1, alignItems: "center", paddingVertical: 16, position: "relative" },
  profileStatValue: { fontSize: 20, fontWeight: "900" },
  profileStatLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 6 },
  profileStatDivider: { position: "absolute", right: 0, top: 18, bottom: 18, width: 1, backgroundColor: "rgba(255,255,255,0.07)" },
  achievementCard: { width: 110 },
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginHorizontal: 16 },
  logoutButton: { minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: "rgba(239,68,68,0.22)", backgroundColor: "rgba(239,68,68,0.08)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  logoutText: { color: COLORS.red, fontSize: 14, fontWeight: "700" },
  footerText: { color: "rgba(255,255,255,0.18)", fontSize: 10, textAlign: "center", marginTop: 20 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  optionChip: { borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 10 },
  optionChipText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", textAlign: "center" },
  bigMetric: { color: COLORS.text, fontSize: 40, fontWeight: "900" },
  modalMetricInput: { width: "100%", minHeight: 70, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", color: COLORS.text, fontSize: 28, fontWeight: "900", textAlign: "center" },
  deleteWrap: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.1)" },
  settingsSectionPad: { paddingHorizontal: 16, paddingVertical: 14 },
  notificationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  dangerZone: { minHeight: 74, borderRadius: 18, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.06)", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  listMeta: { color: "rgba(255,255,255,0.34)", fontSize: 10 },
  inputLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600", marginBottom: 6 },
  textArea: { width: "100%", minHeight: 80, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: COLORS.text, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, textAlignVertical: "top" },
});
