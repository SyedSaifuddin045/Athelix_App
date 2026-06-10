import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { useAuth } from "@clerk/expo";
import { useProfileQuery } from "../api/queries";
import { upsertCurrentUserProfileUsersMeProfilePut } from "../api/endpoints/users/users";
import { GENDERS, FITNESS_LEVELS, GOALS, UNITS } from "../data";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { LabeledInput, ChipWrap, SelectableRow } from "../components/ui/Input";
import { getApiErrorMessage, updateClerkToken } from "../api/client";
import { numberOrNull } from "../utils/validation";
import { queryKeys } from "../api/queryKeys";
import { Events } from "../analytics/events";

export function ProfileSetupScreen({ navigation }: { navigation: any }) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const queryClient = useQueryClient();
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
    goal: "Improve strength",
  });
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const onDateChange = useCallback((_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setForm((current) => ({ ...current, dob: `${year}-${month}-${day}` }));
    }
  }, []);

  const parsedDob = form.dob ? new Date(form.dob + "T00:00:00") : new Date(2000, 0, 1);
  const formattedDob = form.dob
    ? new Date(form.dob + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Tap to select";

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
            <View>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <Pressable onPress={() => setShowDatePicker(true)} style={[styles.input, { justifyContent: "center" }]}>
                <Text style={{ color: form.dob ? COLORS.text : "rgba(255,255,255,0.28)", fontSize: 14 }}>
                  {formattedDob}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={parsedDob}
                  mode="date"
                  display={Platform.OS === "android" ? "default" : "spinner"}
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
            </View>
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
