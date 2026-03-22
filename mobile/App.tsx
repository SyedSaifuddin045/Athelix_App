import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  ACHIEVEMENTS,
  ALL_EXERCISES,
  BODYWEIGHT_CHART,
  BODYWEIGHT_ENTRIES,
  DEFAULT_TEMPLATE_EXERCISES,
  DIFFICULTY_COLORS,
  EXERCISE_DETAILS,
  EXERCISE_EQUIPMENT,
  EXERCISE_FALLBACK,
  EXERCISE_MUSCLES,
  EXERCISE_NAMES,
  EXERCISE_OVERLOADS,
  EXERCISE_PROGRESS_PERIODS,
  EXERCISE_PROGRESS_SERIES,
  EXERCISE_PROGRESS_VOLUME,
  FITNESS_LEVELS,
  GENDERS,
  GOALS,
  INITIAL_WORKOUT_EXERCISES,
  LINKED_SESSIONS,
  MESOCYCLE_LIST,
  MESOCYCLE_STATUS,
  MESOCYCLES,
  MESO_VOLUME_DATA,
  MUSCLE_DATA,
  MUSCLE_PERIODS,
  PERSONAL_RECORDS,
  PROFILE_STATS,
  PROGRESS_QUICK_STATS,
  PROGRESS_SECTIONS,
  RECENT_PRS,
  RECORD_TYPES,
  SESSION_DETAIL,
  START_WORKOUT_TEMPLATES,
  TEMPLATE_LIST,
  TRAIN_SECTIONS,
  UNITS,
  WEEKLY_BARS,
  WORKOUT_SESSIONS,
  WORKOUT_WEEKS,
  type TemplateExercise,
  type WorkoutExercise,
} from "./src/data";

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
  ActiveWorkout: undefined;
  WorkoutHistory: undefined;
  SessionDetail: { id: string };
  MesocycleList: undefined;
  MesocycleDetail: { id: string };
  PersonalRecords: undefined;
  ExerciseProgress: { id: string };
  MuscleBalance: undefined;
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
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  strike?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.25)"
      style={[styles.miniInput, strike ? { textDecorationLine: "line-through" } : null]}
      keyboardType="default"
    />
  );
}

function SplashScreen({ navigation }: { navigation: any }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const steps = [
      { pct: 20, label: "Fetching app config...", delay: 400 },
      { pct: 50, label: "Restoring session...", delay: 900 },
      { pct: 75, label: "Syncing data...", delay: 1400 },
      { pct: 100, label: "Ready!", delay: 1900 },
    ];

    const timers = steps.map(({ pct, label, delay }) =>
      setTimeout(() => {
        setProgress(pct);
        setStatus(label);
      }, delay),
    );

    const doneTimer = setTimeout(() => {
      navigation.replace("MainTabs");
    }, 2400);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      clearTimeout(doneTimer);
    };
  }, [navigation]);

  return (
    <Screen glowColor="rgba(0,180,140,0.24)" scroll={false} contentContainerStyle={styles.centeredContent}>
      <View style={styles.splashLogo}>
        <Text style={styles.splashEmoji}>💪</Text>
      </View>
      <Text style={styles.splashTitle}>FitTrack</Text>
      <Text style={styles.splashSubtitle}>Your training, elevated.</Text>
      <View style={styles.splashProgressCard}>
        <Text style={styles.splashProgressValue}>{progress}%</Text>
        <ProgressBar value={progress} color={COLORS.teal} height={8} />
        <Text style={styles.splashStatus}>{status}</Text>
      </View>
      <Text style={styles.splashFooter}>FitTrack Pro v1.0.0</Text>
    </Screen>
  );
}

function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace("MainTabs");
    }, 1200);
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

      <View style={styles.authDividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or continue as</Text>
        <View style={styles.divider} />
      </View>

      <PrimaryButton
        label="Continue as Demo User"
        onPress={() => navigation.replace("MainTabs")}
        subtle
        icon={<Feather name="user" size={16} color="rgba(255,255,255,0.7)" />}
      />

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
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = [
    { label: "8+ characters", ok: form.password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label: "Number", ok: /[0-9]/.test(form.password) },
  ];

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace("ProfileSetup");
    }, 1200);
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
            onChangeText={(value) => setForm((current) => ({ ...current, username: value }))}
            placeholder="jordan_lifts"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
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
              value={form.password}
              onChangeText={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder="Create a strong password"
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={[styles.input, styles.inputWithRight]}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.inputRightIcon} onPress={() => setShowPassword((value) => !value)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.42)" />
            </Pressable>
          </View>
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
  return (
    <Screen glowColor="rgba(0,180,140,0.22)">
      <View style={styles.mainHeader}>
        <Pressable style={styles.homeIdentity} onPress={() => navigation.navigate("Profile")}>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarInitials}>JD</Text>
          </View>
          <View>
            <Text style={styles.kickerText}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
            <Text style={styles.greetingText}>Hey, Jordan</Text>
          </View>
        </Pressable>
        <RoundButton>
          <Ionicons name="notifications-outline" size={16} color="rgba(255,255,255,0.7)" />
          <View style={styles.notificationDot} />
        </RoundButton>
      </View>

      <Pressable onPress={() => navigation.navigate("MesocycleDetail", { id: "1" })} style={styles.inlineSection}>
        <Card style={{ borderColor: "rgba(0,212,168,0.22)", backgroundColor: "rgba(0,212,168,0.1)" }}>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <View style={styles.bannerIcon}>
                <Feather name="trending-up" size={15} color={COLORS.teal} />
              </View>
              <View>
                <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>Active Mesocycle</Text>
                <Text style={styles.cardTitle}>Strength Block - Week 3/6</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.35)" />
          </View>
        </Card>
      </Pressable>

      <Card style={styles.inlineSection}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionCardTitle}>This Week</Text>
          <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>6 / 7 days</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <VerticalBars data={WEEKLY_BARS.map((item, index) => ({ day: item.day, value: item.value, highlight: index === 6 }))} />
        </View>
        <View style={styles.statRowDivider} />
        <View style={styles.threeUp}>
          <StatPill icon={<MaterialCommunityIcons name="fire" size={12} color="#f97316" />} label="Day Streak" value="12" />
          <DividerVertical />
          <StatPill icon={<MaterialCommunityIcons name="dumbbell" size={12} color={COLORS.teal} />} label="Workouts" value="248" />
          <DividerVertical />
          <StatPill icon={<Feather name="trending-up" size={12} color={COLORS.green} />} label="This Week" value="6" />
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
                  <Text style={styles.heroMetric}>82.4</Text>
                  <Text style={styles.metricSuffix}>kg</Text>
                  <Text style={[styles.metricChange, { color: COLORS.green }]}>↓ 0.3kg</Text>
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
        <Pressable onPress={() => navigation.navigate("SessionDetail", { id: "1" })}>
          <Card>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.cardTitle}>Upper Body Push</Text>
                <Text style={styles.detailLabel}>Yesterday - 6:30 PM</Text>
              </View>
              <Tag label="Done" color={COLORS.teal} />
            </View>
            <View style={[styles.rowGapLarge, { marginTop: 14 }]}>
              <MetricBlock value="52 min" label="Duration" />
              <MetricBlock value="18 sets" label="Sets" />
              <MetricBlock value="8.4k kg" label="Volume" />
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
          {RECENT_PRS.map((item) => (
            <Pressable key={item.exercise} onPress={() => navigation.navigate("PersonalRecords")}>
              <Card style={[styles.prCard, { borderColor: `${item.color}38` }]}>
                <View style={styles.rowGapTiny}>
                  <Feather name="award" size={10} color={item.color} />
                  <Text style={[styles.prBadge, { color: item.color }]}>PR</Text>
                </View>
                <Text style={[styles.detailLabel, { marginTop: 10 }]}>{item.exercise}</Text>
                <Text style={[styles.prValue, { color: item.color }]}>{item.value}</Text>
                <Text style={[styles.detailLabel, { marginTop: 6 }]}>{item.date}</Text>
              </Card>
            </Pressable>
          ))}
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
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = ALL_EXERCISES.filter((exercise) => {
    const normalized = query.toLowerCase();
    return (
      (exercise.name.toLowerCase().includes(normalized) || exercise.primaryMuscle.toLowerCase().includes(normalized)) &&
      (muscle === "All" || exercise.primaryMuscle === muscle) &&
      (equipment === "All" || exercise.equipment === equipment)
    );
  });

  const activeFilters = [muscle !== "All" ? muscle : null, equipment !== "All" ? equipment : null].filter(Boolean) as string[];

  return (
    <Screen glowColor="rgba(0,120,180,0.16)">
      <View style={styles.tabIntro}>
        <Text style={styles.tabTitle}>Exercise Library</Text>
        <Text style={styles.tabSubtitle}>{ALL_EXERCISES.length} exercises</Text>
      </View>

      <View style={[styles.rowGap, { marginTop: 18 }]}>
        <View style={styles.searchWrap}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises..."
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={14} color="rgba(255,255,255,0.42)" />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setShowFilters((value) => !value)}
          style={[
            styles.filterButton,
            showFilters ? { backgroundColor: "rgba(0,212,168,0.2)", borderColor: "rgba(0,212,168,0.35)" } : null,
          ]}
        >
          <Feather name="sliders" size={15} color={showFilters ? COLORS.teal : "rgba(255,255,255,0.6)"} />
        </Pressable>
      </View>

      {activeFilters.length > 0 ? (
        <View style={styles.filterTagRow}>
          {activeFilters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => {
                if (filter === muscle) setMuscle("All");
                if (filter === equipment) setEquipment("All");
              }}
              style={styles.activeFilterTag}
            >
              <Text style={styles.activeFilterText}>{filter}</Text>
              <Feather name="x" size={10} color={COLORS.teal} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {showFilters ? (
        <Card style={{ marginTop: 16 }}>
          <SectionEyebrow>Muscle Group</SectionEyebrow>
          <ChipWrap
            items={EXERCISE_MUSCLES}
            selected={muscle}
            onSelect={setMuscle}
            activeColor={COLORS.teal}
            style={{ marginTop: 10 }}
          />
          <SectionEyebrow color="rgba(255,255,255,0.35)">Equipment</SectionEyebrow>
          <ChipWrap
            items={EXERCISE_EQUIPMENT}
            selected={equipment}
            onSelect={setEquipment}
            activeColor={COLORS.teal}
            style={{ marginTop: 10 }}
          />
        </Card>
      ) : null}

      <Text style={[styles.resultsText, { marginTop: 18 }]}>{filtered.length} results</Text>
      <View style={{ gap: 10 }}>
        {filtered.map((exercise) => (
          <Pressable key={exercise.id} onPress={() => navigation.navigate("ExerciseDetail", { id: exercise.id })}>
            <Card style={styles.listRowCard}>
              <View style={styles.exerciseEmojiWrap}>
                <Text style={{ fontSize: 20 }}>{exercise.emoji}</Text>
              </View>
              <View style={styles.listRowBody}>
                <Text style={styles.listRowTitle}>{exercise.name}</Text>
                <Text style={styles.detailLabel}>
                  {exercise.primaryMuscle} - {exercise.equipment}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Tag label={exercise.difficulty} color={DIFFICULTY_COLORS[exercise.difficulty]} />
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.22)" />
              </View>
            </Card>
          </Pressable>
        ))}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🔍</Text>
            <Text style={styles.emptyStateTitle}>No exercises found</Text>
            <Text style={styles.emptyStateText}>Try different search terms</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function ExerciseDetailScreen({ navigation, route }: { navigation: any; route: { params: { id: string } } }) {
  const { id } = route.params;
  const exercise = EXERCISE_DETAILS[id ?? ""] ?? EXERCISE_FALLBACK;

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

      <Pressable onPress={() => navigation.navigate("ExerciseProgress", { id: id ?? "1" })} style={{ marginTop: 14 }}>
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
        <CompactStatCard label="This Week" value="6" />
        <CompactStatCard label="Total Vol" value="24k" />
        <CompactStatCard label="Avg Duration" value="54" />
      </View>

      <View style={{ marginTop: 18, gap: 12 }}>
        {TRAIN_SECTIONS.map((section) => (
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
                  <Tag label={section.badge} color={"advanced" in section && section.advanced ? COLORS.purple : section.color} />
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.25)" />
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function TemplateListScreen({ navigation }: { navigation: any }) {
  return (
    <Screen glowColor="rgba(0,180,140,0.14)">
      <BackHeader
        title="Templates"
        subtitle={`${TEMPLATE_LIST.length} saved`}
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={styles.smallAccentButton} onPress={() => navigation.navigate("TemplateBuilder")}>
            <Feather name="plus" size={15} color={COLORS.teal} />
            <Text style={styles.smallAccentText}>New</Text>
          </Pressable>
        }
      />

      <View style={{ gap: 12, marginTop: 18 }}>
        {TEMPLATE_LIST.map((template) => (
          <Card key={template.id} style={{ borderRadius: 28 }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowGap}>
                  <View style={[styles.statusDot, { backgroundColor: template.color }]} />
                  <Text style={styles.cardTitle}>{template.name}</Text>
                </View>
                <Text style={[styles.detailLabel, { marginLeft: 14, marginTop: 6 }]}>
                  {template.exercises.slice(0, 3).join(", ")}
                  {template.exercises.length > 3 ? ` +${template.exercises.length - 3}` : ""}
                </Text>
              </View>
              <RoundButton onPress={() => navigation.navigate("TemplateBuilder", { id: template.id })}>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.5)" />
              </RoundButton>
            </View>
            <View style={[styles.rowBetween, { marginTop: 14 }]}>
              <View style={styles.rowGapLarge}>
                <MetaInline icon={<Feather name="clock" size={11} color="rgba(255,255,255,0.32)" />} text={template.duration} />
                <MetaInline
                  icon={<MaterialCommunityIcons name="dumbbell" size={11} color="rgba(255,255,255,0.32)" />}
                  text={`${template.sets} sets`}
                />
                <Text style={styles.listMeta}>Used {template.lastUsed}</Text>
              </View>
              <Pressable
                style={[styles.smallActionTag, { backgroundColor: `${template.color}22`, borderColor: `${template.color}44` }]}
                onPress={() => navigation.navigate("StartWorkout", { id: template.id })}
              >
                <Feather name="play" size={11} color={template.color} />
                <Text style={[styles.smallActionText, { color: template.color }]}>Start</Text>
              </Pressable>
            </View>
          </Card>
        ))}

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

function TemplateBuilderScreen({ navigation, route }: { navigation: any; route: { params?: { id?: string } } }) {
  const id = route.params?.id;
  const isEdit = !!id;
  const [name, setName] = useState(isEdit ? "Upper Body Push" : "");
  const [exercises, setExercises] = useState<TemplateExercise[]>(isEdit ? DEFAULT_TEMPLATE_EXERCISES : []);
  const [expanded, setExpanded] = useState<string | null>(isEdit ? "1" : null);

  const addExercise = () => {
    const nextId = Date.now().toString();
    const nextExercise: TemplateExercise = {
      id: nextId,
      name: "New Exercise",
      emoji: "💪",
      notes: "",
      sets: [{ reps: "8", rpe: "7", rest: "2:00" }],
    };
    setExercises((current) => [...current, nextExercise]);
    setExpanded(nextId);
  };

  const addSet = (exerciseId: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: [...exercise.sets, { reps: "8", rpe: "7", rest: "2:00" }],
            }
          : exercise,
      ),
    );
  };

  const updateSet = (exerciseId: string, index: number, field: "reps" | "rpe" | "rest", value: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set, setIndex) => (setIndex === index ? { ...set, [field]: value } : set)),
            }
          : exercise,
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

  const removeSet = (exerciseId: string, index: number) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, sets: exercise.sets.filter((_, setIndex) => setIndex !== index) } : exercise,
      ),
    );
  };

  return (
    <Screen glowColor="rgba(0,0,0,0)" contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={styles.builderTopBar}>
        <RoundButton onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={16} color={COLORS.text} />
        </RoundButton>
        <Text style={styles.headerTitle}>{isEdit ? "Edit Template" : "New Template"}</Text>
        <Pressable style={styles.saveChip} onPress={() => navigation.replace("TemplateList")}>
          <Text style={styles.saveChipText}>Save</Text>
        </Pressable>
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Template name (e.g. Push Day A)"
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={[styles.input, styles.templateNameInput]}
      />

      <View style={{ gap: 12, marginTop: 16 }}>
        {exercises.map((exercise) => (
          <Card key={exercise.id} style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
            <View style={styles.rowBetween}>
              <View style={[styles.rowGap, { flex: 1 }]}>
                <MaterialCommunityIcons name="drag-vertical" size={16} color="rgba(255,255,255,0.24)" />
                <Text style={{ fontSize: 20 }}>{exercise.emoji}</Text>
                <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
              </View>
              <View style={styles.rowGap}>
                <Pressable onPress={() => setExpanded((current) => (current === exercise.id ? null : exercise.id))}>
                  <Feather name={expanded === exercise.id ? "chevron-up" : "chevron-down"} size={16} color="rgba(255,255,255,0.44)" />
                </Pressable>
                <Pressable onPress={() => removeExercise(exercise.id)}>
                  <Feather name="trash-2" size={15} color="rgba(239,68,68,0.7)" />
                </Pressable>
              </View>
            </View>

            {expanded === exercise.id ? (
              <View style={{ marginTop: 14 }}>
                <View style={styles.templateGridHeader}>
                  {["Set", "Reps", "RPE", "Rest"].map((label) => (
                    <Text key={label} style={styles.gridHeaderText}>
                      {label}
                    </Text>
                  ))}
                </View>
                <View style={{ gap: 8 }}>
                  {exercise.sets.map((set, index) => (
                    <View key={`${exercise.id}-${index}`} style={styles.templateGridRow}>
                      <View style={styles.templateSetIndex}>
                        <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>{index + 1}</Text>
                        {exercise.sets.length > 1 ? (
                          <Pressable onPress={() => removeSet(exercise.id, index)}>
                            <Feather name="trash-2" size={11} color="rgba(239,68,68,0.7)" />
                          </Pressable>
                        ) : null}
                      </View>
                      <MiniInput value={set.reps} onChangeText={(value) => updateSet(exercise.id, index, "reps", value)} />
                      <MiniInput value={set.rpe} onChangeText={(value) => updateSet(exercise.id, index, "rpe", value)} />
                      <MiniInput value={set.rest} onChangeText={(value) => updateSet(exercise.id, index, "rest", value)} />
                    </View>
                  ))}
                </View>
                <Pressable onPress={() => addSet(exercise.id)} style={styles.dashedButton}>
                  <Feather name="plus" size={13} color={COLORS.teal} />
                  <Text style={styles.dashedButtonText}>Add Set</Text>
                </Pressable>
                <TextInput
                  value={exercise.notes}
                  onChangeText={(value) => updateNote(exercise.id, value)}
                  placeholder="Notes (optional)..."
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={[styles.input, { marginTop: 12 }]}
                />
              </View>
            ) : null}
          </Card>
        ))}

        <Pressable onPress={addExercise}>
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
    </Screen>
  );
}

function StartWorkoutScreen({ navigation, route }: { navigation: any; route?: { params?: { id?: string } } }) {
  const id = route?.params?.id;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(id ?? null);
  const [selectedMeso, setSelectedMeso] = useState<string | null>("1");

  return (
    <Screen glowColor="rgba(0,180,140,0.2)">
      <BackHeader title="Start Workout" subtitle="Choose how to begin" onBack={() => navigation.goBack()} />

      <Pressable onPress={() => navigation.navigate("ActiveWorkout")} style={{ marginTop: 18 }}>
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
          {MESOCYCLES.map((meso) => (
            <SelectableRow
              key={meso.id}
              selected={selectedMeso === meso.id}
              onPress={() => setSelectedMeso(meso.id)}
              label={meso.name}
              sublabel={meso.week}
              color={meso.color}
            />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionEyebrow>From Template</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {START_WORKOUT_TEMPLATES.map((template) => (
            <Pressable key={template.id} onPress={() => setSelectedTemplate((current) => (current === template.id ? null : template.id))}>
              <Card
                style={{
                  borderColor: selectedTemplate === template.id ? `${template.color}44` : COLORS.border,
                  backgroundColor: selectedTemplate === template.id ? `${template.color}12` : COLORS.card,
                }}
              >
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flex: 1, alignItems: "flex-start" }]}>
                    <Radio selected={selectedTemplate === template.id} color={template.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{template.name}</Text>
                      <View style={[styles.rowGapLarge, { marginTop: 6 }]}>
                        <MetaInline
                          icon={<MaterialCommunityIcons name="dumbbell" size={10} color="rgba(255,255,255,0.32)" />}
                          text={`${template.exercises} exercises`}
                        />
                        <MetaInline icon={<Feather name="clock" size={10} color="rgba(255,255,255,0.32)" />} text={template.duration} />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.listMeta}>Used {template.lastUsed}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      <PrimaryButton
        label={
          selectedTemplate
            ? `Start with ${START_WORKOUT_TEMPLATES.find((item) => item.id === selectedTemplate)?.name ?? "template"}`
            : "Start Workout"
        }
        onPress={() => navigation.navigate("ActiveWorkout")}
        icon={<Feather name="play" size={18} color="#000000" />}
        style={{ marginTop: 22 }}
      />
    </Screen>
  );
}

function ActiveWorkoutScreen({ navigation }: { navigation: any }) {
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(INITIAL_WORKOUT_EXERCISES);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showFinish, setShowFinish] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("1");

  useEffect(() => {
    const interval = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const completedSets = exercises.flatMap((exercise) => exercise.sets.filter((set) => set.done && !set.warmup)).length;
  const totalSets = exercises.flatMap((exercise) => exercise.sets.filter((set) => !set.warmup)).length;

  const toggleSet = (exerciseId: string, setId: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) => (set.id === setId ? { ...set, done: !set.done } : set)),
            }
          : exercise,
      ),
    );
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

  const addExercise = () => {
    const nextId = Date.now().toString();
    const nextExercise: WorkoutExercise = {
      id: nextId,
      name: "New Exercise",
      emoji: "💪",
      notes: "",
      sets: [{ id: `${nextId}-1`, weight: "60", reps: "8", rpe: "", done: false, warmup: false }],
    };
    setExercises((current) => [...current, nextExercise]);
    setExpanded(nextId);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen glowColor="rgba(0,0,0,0)">
        <Card style={[styles.stickyCard, { marginTop: 0 }]}>
          <View style={styles.rowBetween}>
            <Pressable style={styles.dangerPill} onPress={() => navigation.goBack()}>
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
                            onPress={() => toggleSet(exercise.id, set.id)}
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

          <Pressable onPress={addExercise}>
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
                onPress={() => {
                  setShowFinish(false);
                  navigation.navigate("SessionDetail", { id: "1" });
                }}
                icon={<Feather name="check" size={16} color="#000000" />}
                style={{ marginTop: 18 }}
              />
              <PrimaryButton label="Keep going" onPress={() => setShowFinish(false)} subtle style={{ marginTop: 10 }} />
            </View>
          </View>
        </Modal>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function WorkoutHistoryScreen({ navigation }: { navigation: any }) {
  const totalVolume = WORKOUT_SESSIONS.reduce((sum, session) => sum + parseFloat(session.volume.replace("k", "")) * 1000, 0);

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader title="Workout History" subtitle={`${WORKOUT_SESSIONS.length} sessions`} onBack={() => navigation.goBack()} />
      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard label="Total Sessions" value="248" />
        <CompactStatCard label="Total Volume" value={`${Math.round(totalVolume / 1000)}k kg`} />
        <CompactStatCard label="Best Streak" value="14 days" />
      </View>
      <View style={{ marginTop: 18, gap: 18 }}>
        {Object.entries(WORKOUT_WEEKS).map(([week, sessions]) => (
          <View key={week}>
            <SectionEyebrow>{week}</SectionEyebrow>
            <View style={{ gap: 10, marginTop: 12 }}>
              {sessions.map((session) => (
                <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: session.id })}>
                  <Card style={styles.listRowCard}>
                    <View style={styles.historyMoodWrap}>
                      <Text style={{ fontSize: 18 }}>{session.mood}</Text>
                    </View>
                    <View style={styles.listRowBody}>
                      <Text style={styles.listRowTitle}>{session.name}</Text>
                      <Text style={styles.detailLabel}>
                        {session.date} - {session.time}
                      </Text>
                      <View style={[styles.rowGapLarge, { marginTop: 6 }]}>
                        <MetaInline icon={<Feather name="clock" size={10} color="rgba(255,255,255,0.3)" />} text={`${session.duration}m`} />
                        <MetaInline
                          icon={<MaterialCommunityIcons name="dumbbell" size={10} color="rgba(255,255,255,0.3)" />}
                          text={`${session.sets} sets`}
                        />
                        {session.prs > 0 ? <Tag label={`${session.prs} PR`} color={COLORS.gold} /> : null}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.22)" />
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function SessionDetailScreen({ navigation }: { navigation: any }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert("Delete this session?", "PRs will be recalculated.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => navigation.replace("WorkoutHistory") },
    ]);
  };

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader
        title="Session Detail"
        onBack={() => navigation.goBack()}
        right={
          <View style={{ position: "relative" }}>
            <RoundButton onPress={() => setShowMenu((value) => !value)}>
              <Feather name="more-horizontal" size={16} color="rgba(255,255,255,0.7)" />
            </RoundButton>
            {showMenu ? (
              <View style={styles.menuPopover}>
                <Pressable style={styles.menuItem} onPress={() => setShowMenu(false)}>
                  <Feather name="edit-3" size={14} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.menuItemText}>Edit session</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={handleDelete}>
                  <Feather name="trash-2" size={14} color={COLORS.red} />
                  <Text style={[styles.menuItemText, { color: COLORS.red }]}>Delete session</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
      />

      <View style={{ marginTop: 18 }}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap}>
            <Text style={{ fontSize: 30 }}>{SESSION_DETAIL.mood}</Text>
            <View>
              <Text style={styles.heroTitle}>{SESSION_DETAIL.name}</Text>
              <Text style={styles.detailLabel}>{SESSION_DETAIL.date}</Text>
            </View>
          </View>
          {SESSION_DETAIL.prs > 0 ? <Tag label={`${SESSION_DETAIL.prs} PR!`} color={COLORS.gold} /> : null}
        </View>
        <View style={[styles.threeUpGrid, { marginTop: 14 }]}>
          <DetailStat label="Duration" value={`${SESSION_DETAIL.duration}m`} icon={<Feather name="clock" size={13} color={COLORS.teal} />} />
          <DetailStat
            label="Sets"
            value={String(SESSION_DETAIL.sets)}
            icon={<MaterialCommunityIcons name="dumbbell" size={13} color={COLORS.teal} />}
          />
          <DetailStat
            label="Volume"
            value={SESSION_DETAIL.volume}
            icon={<MaterialCommunityIcons name="dumbbell" size={13} color={COLORS.teal} />}
          />
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 18 }}>
        {SESSION_DETAIL.exercises.map((exercise) => (
          <Card key={exercise.name} style={{ paddingHorizontal: 16, paddingVertical: 0 }}>
            <View style={styles.exerciseHeader}>
              <Text style={{ fontSize: 20 }}>{exercise.emoji}</Text>
              <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
              {exercise.pr ? <Tag label="PR" color={COLORS.gold} /> : null}
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
                {exercise.sets.map((set, index) => (
                  <View key={`${exercise.name}-${index}`} style={styles.sessionGridRow}>
                    <Text style={[styles.smallStrongText, { width: 28, textAlign: "center", color: set.type === "W" ? COLORS.orange : COLORS.muted }]}>
                      {set.type}
                    </Text>
                    {[set.weight, set.reps, set.rpe].map((value) => (
                      <View key={`${exercise.name}-${set.type}-${value}`} style={styles.sessionCell}>
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
    </Screen>
  );
}

function MesocycleListScreen({ navigation }: { navigation: any }) {
  return (
    <Screen glowColor="rgba(139,92,246,0.16)">
      <BackHeader
        title="Mesocycles"
        subtitle="Block periodization planning"
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={[styles.smallAccentButton, { backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.3)" }]}>
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

      <View style={{ marginTop: 18, gap: 12 }}>
        {MESOCYCLE_LIST.map((meso) => {
          const status = MESOCYCLE_STATUS[meso.status];
          const progress = meso.weeks ? (meso.currentWeek / meso.weeks) * 100 : 0;
          return (
            <Pressable key={meso.id} onPress={() => navigation.navigate("MesocycleDetail", { id: meso.id })}>
              <Card style={{ borderColor: `${meso.color}24` }}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowGap}>
                      <View style={[styles.statusDot, { backgroundColor: meso.color }]} />
                      <Text style={styles.cardTitle}>{meso.name}</Text>
                    </View>
                    <Text style={[styles.detailLabel, { marginLeft: 14, marginTop: 6 }]}>{meso.phase}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Tag label={status.label} color={status.color} backgroundColor={status.bg} />
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.25)" />
                  </View>
                </View>
                {meso.status === "active" ? (
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.detailLabel}>
                        Week {meso.currentWeek} of {meso.weeks}
                      </Text>
                      <Text style={[styles.smallStrongText, { color: meso.color }]}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={{ marginTop: 8 }}>
                      <ProgressBar value={progress} color={meso.color} />
                    </View>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function MesocycleDetailScreen({ navigation }: { navigation: any }) {
  return (
    <Screen glowColor="rgba(139,92,246,0.16)">
      <BackHeader title="Mesocycle" onBack={() => navigation.goBack()} />

      <Card style={{ marginTop: 18, backgroundColor: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.25)" }}>
        <View style={styles.rowGap}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.teal }]} />
          <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>ACTIVE</Text>
        </View>
        <Text style={[styles.heroTitle, { marginTop: 10 }]}>Strength Block</Text>
        <Text style={styles.detailLabel}>Phase 1 - Linear Progression</Text>
        <View style={[styles.rowBetween, { marginTop: 18 }]}>
          <Text style={styles.detailLabel}>Week 3 of 6</Text>
          <Text style={[styles.smallStrongText, { color: COLORS.purple }]}>50%</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          <ProgressBar value={50} color={COLORS.purple} />
        </View>
        <View style={[styles.rowGapLarge, { marginTop: 16, flexWrap: "wrap" }]}>
          <MetaInline icon={<Feather name="calendar" size={12} color="rgba(255,255,255,0.35)" />} text="Mar 3 -> Apr 13" />
          <MetaInline
            icon={<MaterialCommunityIcons name="dumbbell" size={12} color="rgba(255,255,255,0.35)" />}
            text="14 sessions logged"
          />
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionCardTitle}>Weekly Volume</Text>
          <Text style={[styles.smallStrongText, { color: COLORS.purple }]}>kg lifted</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <TrendChart data={MESO_VOLUME_DATA.map((item) => ({ label: item.label, value: item.value }))} color={COLORS.purple} labelEvery={1} height={110} />
        </View>
      </Card>

      <Card style={{ marginTop: 14, backgroundColor: "rgba(139,92,246,0.07)", borderColor: "rgba(139,92,246,0.2)" }}>
        <View style={styles.rowGap}>
          <Feather name="lock" size={13} color={COLORS.purple} />
          <Text style={[styles.listRowTitle, { color: COLORS.purple }]}>Block Analytics</Text>
        </View>
        <View style={[styles.twoUpGrid, { marginTop: 14 }]}>
          <AnalyticsCard label="vs. Previous Block" value="+12%" sub="volume increase" color={COLORS.green} />
          <AnalyticsCard label="Deload Suggestion" value="Week 5" sub="based on fatigue" color={COLORS.text} />
          <AnalyticsCard label="Top Lift Gain" value="+10kg" sub="Deadlift e1RM" color={COLORS.green} />
          <AnalyticsCard label="Avg Session RPE" value="7.8" sub="within target 7-9" color={COLORS.green} />
        </View>
        <Pressable onPress={() => navigation.navigate("MuscleBalance")} style={styles.analyticsLink}>
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
          {LINKED_SESSIONS.map((session) => (
            <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: session.id })}>
              <Card style={styles.listRowCard}>
                <View style={styles.softIconWrap}>
                  <MaterialCommunityIcons name="dumbbell" size={16} color={COLORS.purple} />
                </View>
                <View style={styles.listRowBody}>
                  <Text style={styles.listRowTitle}>{session.name}</Text>
                  <Text style={styles.detailLabel}>
                    {session.date} - {session.sets} sets - {session.volume} kg
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.22)" />
              </Card>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function ProgressHubScreen({ navigation }: { navigation: any }) {
  return (
    <Screen glowColor="rgba(251,191,36,0.1)">
      <View style={styles.tabIntro}>
        <SectionEyebrow>Analytics</SectionEyebrow>
        <Text style={styles.tabTitle}>Progress</Text>
        <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
          {PROGRESS_QUICK_STATS.map((stat) => (
            <CompactStatCard key={stat.label} label={stat.label} value={stat.value} valueColor={stat.color} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 18, gap: 12 }}>
        {PROGRESS_SECTIONS.map((section) => (
          <Pressable
            key={section.title}
            onPress={() => {
              if (section.path === "personalRecords") navigation.navigate("PersonalRecords");
              else if (section.path === "exerciseProgress") navigation.navigate("ExerciseProgress", { id: "1" });
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
                    <Tag label={section.badge} color={section.color} />
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Card style={{ marginTop: 18, backgroundColor: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.2)" }}>
        <View style={styles.rowGap}>
          <Text style={{ fontSize: 24 }}>🏆</Text>
          <View>
            <Text style={[styles.listRowTitle, { color: COLORS.gold }]}>New Bench Press PR!</Text>
            <Text style={styles.detailLabel}>110 kg x 3 reps - 3 days ago</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

function PersonalRecordsScreen({ navigation }: { navigation: any }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = PERSONAL_RECORDS.filter((entry) => entry.exercise.toLowerCase().includes(search.toLowerCase()));

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
        {RECORD_TYPES.map((type) => (
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

      <View style={{ marginTop: 16, gap: 12 }}>
        {filtered.map((entry) => (
          <Card key={entry.id} style={{ paddingVertical: 0 }}>
            <Pressable style={styles.exerciseHeader} onPress={() => navigation.navigate("ExerciseProgress", { id: entry.exerciseId })}>
              <Text style={{ fontSize: 20 }}>{entry.emoji}</Text>
              <Text style={[styles.listRowTitle, { flex: 1 }]}>{entry.exercise}</Text>
              <View style={styles.rowGapTiny}>
                <Feather name="trending-up" size={13} color="rgba(255,255,255,0.32)" />
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.22)" />
              </View>
            </Pressable>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
              {entry.records
                .filter((record) => filter === "All" || record.type === filter)
                .map((record) => (
                  <View key={record.type} style={styles.rowBetween}>
                    <View style={styles.rowGap}>
                      <View style={[styles.softIconWrap, { backgroundColor: "rgba(251,191,36,0.12)" }]}>
                        <Feather name="award" size={13} color={COLORS.gold} />
                      </View>
                      <View>
                        <Text style={styles.smallStrongText}>{record.type}</Text>
                        <Text style={styles.listMeta}>{record.date}</Text>
                      </View>
                    </View>
                    <View style={styles.rowGap}>
                      <Text style={[styles.prValue, { color: COLORS.gold }]}>{record.value}</Text>
                      {record.isNew ? <Tag label="NEW" color={COLORS.teal} /> : null}
                    </View>
                  </View>
                ))}
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function ExerciseProgressScreen({ navigation, route }: { navigation: any; route: { params: { id: string } } }) {
  const { id } = route.params;
  const [period, setPeriod] = useState("3M");
  const exercise = EXERCISE_NAMES[id ?? "1"] ?? EXERCISE_NAMES["1"];
  const current = EXERCISE_PROGRESS_SERIES.at(-1)?.value ?? 0;
  const gain = current - (EXERCISE_PROGRESS_SERIES[0]?.value ?? 0);

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader title={exercise.name} subtitle="Exercise Progress" onBack={() => navigation.goBack()} />

      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard label="Current e1RM" value={`${current} kg`} valueColor={COLORS.teal} />
        <CompactStatCard label="Gain (3M)" value={`+${gain} kg`} valueColor={COLORS.green} />
        <CompactStatCard label="All-time PR" value={`${current} kg`} valueColor={COLORS.gold} />
      </View>

      <Card style={{ marginTop: 16 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionCardTitle}>e1RM History</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {EXERCISE_PROGRESS_PERIODS.map((entry) => (
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
          <TrendChart data={EXERCISE_PROGRESS_SERIES} color={COLORS.teal} height={128} />
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={styles.sectionCardTitle}>Weekly Volume</Text>
        <View style={{ marginTop: 12 }}>
          <VerticalBars data={EXERCISE_PROGRESS_VOLUME.map((item) => ({ label: item.label, value: item.value, highlight: item.highlight }))} height={90} />
        </View>
      </Card>

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>Recent Overloads</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {EXERCISE_OVERLOADS.map((entry) => (
            <Card key={`${entry.date}-${entry.change}`} style={styles.listRowCard}>
              <View style={[styles.softIconWrap, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
                <Feather name="award" size={13} color={COLORS.green} />
              </View>
              <View style={styles.listRowBody}>
                <View style={styles.rowGapTiny}>
                  <Text style={[styles.smallStrongText, { color: COLORS.green }]}>{entry.change}</Text>
                  <Text style={styles.detailLabel}>- {entry.type}</Text>
                </View>
                <Text style={styles.listMeta}>
                  {entry.date} - {entry.session}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function MuscleBalanceScreen({ navigation }: { navigation: any }) {
  const [period, setPeriod] = useState("1W");
  const underTarget = MUSCLE_DATA.filter((item) => item.sets < item.target);

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

      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard
          label="On Track"
          value={String(MUSCLE_DATA.filter((item) => item.sets >= item.target * 0.85).length)}
          valueColor={COLORS.teal}
        />
        <CompactStatCard label="Under Target" value={String(underTarget.length)} valueColor={COLORS.orange} />
        <CompactStatCard
          label="Over Target"
          value={String(MUSCLE_DATA.filter((item) => item.sets > item.target * 1.1).length)}
          valueColor={COLORS.green}
        />
      </View>

      <Card style={{ marginTop: 16 }}>
        <Text style={styles.sectionCardTitle}>Sets by Muscle Group</Text>
        <View style={{ marginTop: 16, gap: 12 }}>
          {MUSCLE_DATA.map((item) => (
            <View key={item.muscle}>
              <View style={styles.rowBetween}>
                <Text style={styles.smallStrongText}>{item.muscle}</Text>
                <Text style={styles.listMeta}>
                  {item.sets}/{item.target}
                </Text>
              </View>
              <View style={{ marginTop: 8 }}>
                <ProgressBar value={(item.target / Math.max(item.target, item.sets, 1)) * 100} backgroundColor="rgba(255,255,255,0.08)" color="rgba(255,255,255,0.14)" />
                <View style={{ marginTop: -6 }}>
                  <ProgressBar value={(item.sets / Math.max(item.target, item.sets, 1)) * 100} color={item.color} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>Breakdown</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {MUSCLE_DATA.map((item) => {
            const status = getMuscleStatus(item.sets, item.target);
            return (
              <Card key={item.muscle}>
                <View style={styles.rowBetween}>
                  <Text style={styles.listRowTitle}>{item.muscle}</Text>
                  <View style={styles.rowGap}>
                    <Text style={styles.listMeta}>
                      {item.sets}/{item.target} sets
                    </Text>
                    <Tag label={status.label} color={status.color} />
                  </View>
                </View>
                <View style={{ marginTop: 12 }}>
                  <ProgressBar value={Math.min(100, (item.sets / item.target) * 100)} color={item.color} />
                </View>
              </Card>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function ProfileScreen({ navigation }: { navigation: any }) {
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
          badge: "82.4 kg",
        },
        { label: "Personal Records", icon: <Feather name="award" size={15} color={COLORS.gold} />, route: "PersonalRecords" as keyof RootStackParamList, color: COLORS.gold },
        { label: "Exercise Progress", icon: <Feather name="trending-up" size={15} color={COLORS.teal} />, route: "ExerciseProgress" as keyof RootStackParamList, color: COLORS.teal, id: "1" },
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
            <Text style={styles.avatarInitials}>JD</Text>
          </View>
          <Pressable style={styles.profileEditButton} onPress={() => navigation.navigate("ProfileSetup")}>
            <Feather name="edit-3" size={13} color={COLORS.teal} />
          </Pressable>
        </View>
        <Text style={styles.heroTitle}>Jordan Davis</Text>
        <Text style={styles.detailLabel}>@jordan_lifts</Text>
        <View style={[styles.rowGapTiny, { marginTop: 8 }]}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.green }]} />
          <Text style={styles.listMeta}>Intermediate - 180cm - 82 kg</Text>
        </View>

        <Card style={{ width: "100%", marginTop: 18, paddingVertical: 0 }}>
          <View style={styles.profileStatsRow}>
            {PROFILE_STATS.map((stat, index) => (
              <View key={stat.label} style={styles.profileStatCell}>
                <Text style={[styles.profileStatValue, { color: COLORS.teal }]}>{stat.value}</Text>
                <Text style={styles.profileStatLabel}>{stat.label}</Text>
                {index < PROFILE_STATS.length - 1 ? <View style={styles.profileStatDivider} /> : null}
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
          {ACHIEVEMENTS.map((achievement) => (
            <Card key={achievement.label} style={styles.achievementCard}>
              <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
              <Text style={[styles.smallStrongText, { marginTop: 10 }]}>{achievement.label}</Text>
              <Text style={[styles.listMeta, { color: COLORS.teal, marginTop: 6 }]}>{achievement.date}</Text>
            </Card>
          ))}
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

      <Pressable onPress={() => navigation.replace("Login")} style={{ marginTop: 18 }}>
        <View style={styles.logoutButton}>
          <Feather name="log-out" size={15} color={COLORS.red} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </View>
      </Pressable>

      <Text style={styles.footerText}>FitTrack Pro v1.0.0 - member since Jan 2024</Text>
    </Screen>
  );
}

function ProfileSetupScreen({ navigation }: { navigation: any }) {
  const [form, setForm] = useState({
    displayName: "Jordan Davis",
    dob: "1995-06-15",
    gender: "Male",
    height: "180",
    weight: "82",
    fitnessLevel: "Intermediate",
    unit: "metric",
    goal: "Improve strength",
  });

  return (
    <Screen glowColor="rgba(0,180,140,0.18)">
      <BackHeader
        title="Profile Setup"
        subtitle="Tell us about yourself"
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={styles.saveChip} onPress={() => navigation.replace("Profile")}>
            <Feather name="check" size={13} color="#000000" />
            <Text style={styles.saveChipText}>Save</Text>
          </Pressable>
        }
      />

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

        <PrimaryButton label="Save Profile" onPress={() => navigation.replace("Profile")} style={{ marginTop: 6 }} />
      </View>
    </Screen>
  );
}

function BodyweightHistoryScreen({ navigation }: { navigation: any }) {
  const [entries, setEntries] = useState(BODYWEIGHT_ENTRIES);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");

  const latest = entries[0]?.weight ?? 82.4;
  const previous = entries[entries.length - 1]?.weight ?? 84.3;
  const change = latest - previous;

  const addEntry = () => {
    if (!newWeight) return;
    const next = {
      id: Date.now().toString(),
      date: "Mar 18, 2026",
      weight: Number(newWeight),
      note: newNote,
    };
    setEntries((current) => [next, ...current]);
    setNewWeight("");
    setNewNote("");
    setShowAdd(false);
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
          <Text style={styles.bigMetric}>{latest}</Text>
          <Text style={styles.metricSuffix}>kg</Text>
          <Text style={[styles.metricChange, { color: change < 0 ? COLORS.green : "#ef4444" }]}>
            {change < 0 ? "↓" : "↑"} {Math.abs(change).toFixed(1)} kg
          </Text>
        </View>
        <Text style={styles.detailLabel}>vs. 30 days ago ({previous} kg)</Text>
      </View>

      <Card style={{ marginTop: 16 }}>
        <TrendChart data={BODYWEIGHT_CHART} color={COLORS.teal} height={128} referenceValue={82.4} />
      </Card>

      <View style={{ marginTop: 18 }}>
        <SectionEyebrow>All Entries</SectionEyebrow>
        <View style={{ gap: 10, marginTop: 12 }}>
          {entries.map((entry, index) => (
            <Card key={entry.id} style={styles.listRowCard}>
              <View style={styles.listRowBody}>
                <View style={styles.rowGap}>
                  <Text style={[styles.cardTitle, index === 0 ? { color: COLORS.teal } : null]}>{entry.weight} kg</Text>
                  {index === 0 ? <Tag label="Latest" color={COLORS.teal} /> : null}
                  {index > 0 ? (
                    <Text style={[styles.smallStrongText, { color: entry.weight < entries[index - 1].weight ? COLORS.green : "#ef4444" }]}>
                      {entry.weight < entries[index - 1].weight ? "↓" : "↑"}
                      {Math.abs(entry.weight - entries[index - 1].weight).toFixed(1)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.detailLabel}>
                  {entry.date}
                  {entry.note ? ` - ${entry.note}` : ""}
                </Text>
              </View>
              <Pressable onPress={() => setEntries((current) => current.filter((item) => item.id !== entry.id))} style={styles.deleteWrap}>
                <Feather name="trash-2" size={13} color="rgba(239,68,68,0.8)" />
              </Pressable>
            </Card>
          ))}
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
              label="Save Entry"
              onPress={addEntry}
              icon={<Feather name="check" size={16} color="#000000" />}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SettingsScreen({ navigation }: { navigation: any }) {
  const [form, setForm] = useState({
    username: "jordan_lifts",
    email: "jordan@example.com",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    prAlerts: true,
    weeklyReport: false,
    newFeatures: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
            <Text style={[styles.saveChipText, saved ? { color: COLORS.green } : null]}>{saved ? "Saved!" : "Save"}</Text>
          </Pressable>
        }
      />

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
      <AppContent />
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
  templateGridHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, marginBottom: 10 },
  templateGridRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  templateSetIndex: { width: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  gridHeaderText: { flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 4 },
  miniInput: { flex: 1, minHeight: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: COLORS.text, textAlign: "center", fontSize: 13, paddingHorizontal: 4 },
  dashedButton: { marginTop: 10, minHeight: 42, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(0,212,168,0.25)", backgroundColor: "rgba(0,212,168,0.08)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  dashedButtonText: { color: COLORS.teal, fontSize: 12, fontWeight: "700" },
  selectableRow: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "rgba(255,255,255,0.03)", justifyContent: "center", paddingHorizontal: 14 },
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
  menuPopover: { position: "absolute", top: 46, right: 0, width: 170, borderRadius: 18, backgroundColor: "#111d1b", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingVertical: 6, zIndex: 10 },
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
});
