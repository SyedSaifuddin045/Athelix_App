import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { usePostHog } from "posthog-react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useAuth } from "@clerk/expo";
import { useProfileQuery } from "../api/queries";
import { useSaveProfile } from "../api/mutations";
import { GENDERS, FITNESS_LEVELS, GOALS, UNITS } from "../data";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { LabeledInput, ChipWrap, SelectableRow } from "../components/ui/Input";
import { AppIcon } from "../design-system/icons/AppIcon";
import { getApiErrorMessage } from "../api/client";
import { numberOrNull } from "../utils/validation";
import { Events } from "../analytics/events";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "ProfileSetup"> };

export function ProfileSetupScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const posthog = usePostHog();
  const profileQuery = useProfileQuery(isAuthenticated);
  const [form, setForm] = useState({
    displayName: "",
    dob: "",
    gender: "",
    height: "",
    weight: "",
    fitnessLevel: "",
    unit: "metric",
    goal: "",
  });
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const redColor = theme.colorRed?.get() ?? "#EF4444";
  const redDarkColor = theme.colorRedDark?.get() ?? "rgba(239,68,68,0.12)";
  const surfaceHover = theme.surfaceHover?.get() ?? "rgba(255,255,255,0.06)";

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setForm((c) => ({
      ...c,
      displayName: profile.display_name ?? "",
      dob: profile.date_of_birth ?? "",
      gender: profile.gender ?? "",
      height: profile.height_cm ? String(profile.height_cm) : "",
      weight: profile.weight_kg ? String(profile.weight_kg) : "",
      fitnessLevel: profile.fitness_level ?? "",
      goal: profile.primary_goal ?? "",
      unit: profile.preferred_unit ?? "metric",
    }));
  }, [profileQuery.data]);

  const onDateChange = useCallback((_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setForm((c) => ({ ...c, dob: `${year}-${month}-${day}` }));
    }
  }, []);

  const parsedDob = form.dob ? new Date(form.dob + "T00:00:00") : new Date(2000, 0, 1);
  const formattedDob = form.dob
    ? new Date(form.dob + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Tap to select";

  const saveProfile = useSaveProfile({
    onSuccess: () => {
      posthog.capture(Events.PROFILE_SETUP_COMPLETED, {
        fitness_level: form.fitnessLevel || null,
        goal: form.goal || null,
        unit: form.unit,
        has_body_stats: !!form.height && !!form.weight,
      });
      const superProps: Record<string, string> = {};
      if (form.fitnessLevel) superProps.fitness_level = form.fitnessLevel;
      if (form.goal) superProps.primary_goal = form.goal;
      superProps.preferred_unit = form.unit;
      posthog.register(superProps);
      navigation.replace("MainTabs");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  return (
    <Screen>
      <BackHeader
        title="Profile Setup"
        subtitle="Tell us about yourself"
        onBack={() => {
          Alert.alert(
            "Skip Profile Setup?",
            "You can complete your profile later in Settings. Some features may be limited until then.",
            [
              { text: "Stay", style: "cancel" },
              { text: "Skip", onPress: () => navigation.replace("MainTabs") }
            ]
          );
        }}
        right={
          <Pressable
            style={{ minHeight: 34, borderRadius: radii.tag, backgroundColor: accent, paddingHorizontal: spacing.xl, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
            onPress={() =>
              saveProfile.mutate({
                display_name: form.displayName || null,
                date_of_birth: form.dob || null,
                gender: form.gender || null,
                height_cm: numberOrNull(form.height),
                weight_kg: numberOrNull(form.weight),
                fitness_level: form.fitnessLevel || null,
                preferred_unit: form.unit,
                primary_goal: form.goal || null,
              })
            }
            disabled={saveProfile.isPending}
          >
            <AppIcon name="check" size={13} color="#000000" />
            <Text style={{ color: "#000000", fontSize: 12, fontWeight: "800" }}>{saveProfile.isPending ? "Saving" : "Save"}</Text>
          </Pressable>
        }
      />

      {profileQuery.isPending ? <LoadingCard label="Loading profile..." /> : null}
      {error ? (
        <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: redDarkColor, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: spacing.xl }}>
          <Text style={{ color: redColor, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl5 }}>
        <View>
          <SectionEyebrow>Basic Info</SectionEyebrow>
          <View style={[{ gap: spacing.xl2 }]}>
            <LabeledInput label="Display Name" value={form.displayName} onChangeText={(v) => setForm((c) => ({ ...c, displayName: v }))} />
            <View>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Date of Birth</Text>
              <Pressable onPress={() => setShowDatePicker(true)} style={{ width: "100%", minHeight: 52, borderRadius: radii.input, backgroundColor: surfaceHover, borderWidth: 1, borderColor: borderColor, justifyContent: "center", paddingHorizontal: 16 }}>
                <Text style={{ color: form.dob ? textColor : faintColor, fontSize: 14 }}>
                  {formattedDob}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker value={parsedDob} mode="date" display={Platform.OS === "android" ? "default" : "spinner"} maximumDate={new Date()} onChange={onDateChange} />
              )}
            </View>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" }}>Gender</Text>
              <ChipWrap items={GENDERS.map((g) => ({ value: g, label: g }))} selected={form.gender} onSelect={(v) => setForm((c) => ({ ...c, gender: v }))} activeColor={accent} />
            </View>
          </View>
        </View>

        <View>
          <SectionEyebrow>Body Stats</SectionEyebrow>
          <View style={{ flexDirection: "row", gap: spacing.xl }}>
            <View style={{ flex: 1 }}>
              <LabeledInput label={`Height (${form.unit === "metric" ? "cm" : "ft"})`} value={form.height} onChangeText={(v) => setForm((c) => ({ ...c, height: v }))} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <LabeledInput label={`Weight (${form.unit === "metric" ? "kg" : "lbs"})`} value={form.weight} onChangeText={(v) => setForm((c) => ({ ...c, weight: v }))} keyboardType="numeric" />
            </View>
          </View>
        </View>

        <View>
          <SectionEyebrow>Fitness Level</SectionEyebrow>
          <ChipWrap items={FITNESS_LEVELS.map((f) => ({ value: f, label: f }))} selected={form.fitnessLevel} onSelect={(v) => setForm((c) => ({ ...c, fitnessLevel: v }))} activeColor={accent} columns={2} />
        </View>

        <View>
          <SectionEyebrow>Primary Goal</SectionEyebrow>
          <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
            {GOALS.map((goal) => (
              <SelectableRow key={goal} selected={form.goal === goal} onPress={() => setForm((c) => ({ ...c, goal }))} label={goal} />
            ))}
          </View>
        </View>

        <View>
          <SectionEyebrow>Preferred Units</SectionEyebrow>
          <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
            {UNITS.map((unit) => (
              <SelectableRow key={unit.value} selected={form.unit === unit.value} onPress={() => setForm((c) => ({ ...c, unit: unit.value }))} label={unit.label} />
            ))}
          </View>
        </View>

        <PrimaryButton
          label={saveProfile.isPending ? "Saving Profile..." : "Save Profile"}
          onPress={() =>
            saveProfile.mutate({
              display_name: form.displayName || null,
              date_of_birth: form.dob || null,
              gender: form.gender || null,
              height_cm: numberOrNull(form.height),
              weight_kg: numberOrNull(form.weight),
              fitness_level: form.fitnessLevel || null,
              preferred_unit: form.unit,
              primary_goal: form.goal || null,
            })
          }
          disabled={saveProfile.isPending}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </Screen>
  );
}
