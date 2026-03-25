import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  BackHeader,
  Card,
  ChipWrap,
  PrimaryButton,
  Screen,
  ScreenState,
  SectionEyebrow,
} from "../../components";
import { useAuth } from "../../app/providers/AuthProvider";
import {
  useCurrentProfileQuery,
  useCurrentUserQuery,
  useUpdateCurrentUserMutation,
} from "../../features/users/hooks";
import { isApiError } from "../../lib/api/error";
import { queryKeys } from "../../lib/api/queryKeys";
import { COLORS } from "../../theme/colors";
import { RootStackScreenProps } from "../../types/navigation";

type Props = RootStackScreenProps<"Settings">;

const GENDERS = ["male", "female", "non_binary", "prefer_not_to_say"] as const;
const FITNESS_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const UNITS = [
  { label: "Metric", value: "metric" },
  { label: "Imperial", value: "imperial" },
] as const;

function parseNullableNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SettingsScreen({ navigation }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const { completeProfile, logout } = useAuth();
  const userQuery = useCurrentUserQuery();
  const profileQuery = useCurrentProfileQuery();
  const updateCurrentUserMutation = useUpdateCurrentUserMutation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const hydratedSignatureRef = useRef("");

  useFocusEffect(
    React.useCallback(() => {
      void userQuery.refetch();
      void profileQuery.refetch();
    }, [profileQuery, userQuery]),
  );

  const sourceSignature = useMemo(
    () =>
      JSON.stringify({
        username: userQuery.data?.username ?? "",
        email: userQuery.data?.email ?? "",
        display_name: profileQuery.data?.display_name ?? "",
        date_of_birth: profileQuery.data?.date_of_birth ?? "",
        gender: profileQuery.data?.gender ?? "",
        height_cm: profileQuery.data?.height_cm ?? "",
        weight_kg: profileQuery.data?.weight_kg ?? "",
        fitness_level: profileQuery.data?.fitness_level ?? "",
        preferred_unit: profileQuery.data?.preferred_unit ?? "",
      }),
    [profileQuery.data, userQuery.data],
  );

  useEffect(() => {
    if (!userQuery.data) {
      return;
    }

    if (hydratedSignatureRef.current === sourceSignature) {
      return;
    }

    setUsername(userQuery.data.username);
    setEmail(userQuery.data.email);
    setDisplayName(profileQuery.data?.display_name ?? "");
    setDateOfBirth(profileQuery.data?.date_of_birth ?? "");
    setGender(profileQuery.data?.gender ?? "");
    setHeight(
      profileQuery.data?.height_cm !== null && profileQuery.data?.height_cm !== undefined
        ? `${profileQuery.data.height_cm}`
        : "",
    );
    setWeight(
      profileQuery.data?.weight_kg !== null && profileQuery.data?.weight_kg !== undefined
        ? `${profileQuery.data.weight_kg}`
        : "",
    );
    setFitnessLevel(profileQuery.data?.fitness_level ?? "");
    setUnit(profileQuery.data?.preferred_unit === "imperial" ? "imperial" : "metric");
    hydratedSignatureRef.current = sourceSignature;
  }, [profileQuery.data, sourceSignature, userQuery.data]);

  async function handleSave(): Promise<void> {
    if (!userQuery.data) {
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedUsername || !trimmedEmail) {
      setError("Username and email are required.");
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const nextProfilePayload = {
      display_name: displayName.trim() || null,
      date_of_birth: dateOfBirth.trim() || null,
      gender: gender || null,
      height_cm: parseNullableNumber(height),
      weight_kg: parseNullableNumber(weight),
      fitness_level: fitnessLevel || null,
      preferred_unit: unit,
    };
    const currentProfileSnapshot = profileQuery.data
      ? JSON.stringify({
          display_name: profileQuery.data.display_name,
          date_of_birth: profileQuery.data.date_of_birth,
          gender: profileQuery.data.gender,
          height_cm: profileQuery.data.height_cm,
          weight_kg: profileQuery.data.weight_kg,
          fitness_level: profileQuery.data.fitness_level,
          preferred_unit: profileQuery.data.preferred_unit,
        })
      : null;
    const nextProfileSnapshot = JSON.stringify(nextProfilePayload);
    const hasProfileInput =
      Boolean(displayName.trim()) ||
      Boolean(dateOfBirth.trim()) ||
      Boolean(gender) ||
      Boolean(height.trim()) ||
      Boolean(weight.trim()) ||
      Boolean(fitnessLevel) ||
      unit === "imperial";
    const shouldUpdateProfile = profileQuery.data
      ? currentProfileSnapshot !== nextProfileSnapshot
      : hasProfileInput;
    const shouldUpdateUser =
      trimmedUsername !== userQuery.data.username || trimmedEmail !== userQuery.data.email;

    if (!shouldUpdateUser && !shouldUpdateProfile) {
      setSuccess("Nothing changed.");
      setSaving(false);
      return;
    }

    try {
      if (shouldUpdateUser) {
        const updatedUser = await updateCurrentUserMutation.mutateAsync({
          username: trimmedUsername,
          email: trimmedEmail,
        });
        queryClient.setQueryData(queryKeys.users.me, updatedUser);
        await queryClient.invalidateQueries({ queryKey: queryKeys.users.overview });
      }

      if (shouldUpdateProfile) {
        await completeProfile(nextProfilePayload);
      }

      setSuccess("Settings saved.");
    } catch (saveError) {
      setError(
        isApiError(saveError)
          ? saveError.message
          : "Unable to save your settings right now.",
      );
      void userQuery.refetch();
      void profileQuery.refetch();
    } finally {
      setSaving(false);
    }
  }

  if ((userQuery.isLoading || profileQuery.isLoading) && !userQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState title="Loading settings" message="Fetching your account preferences." loading />
      </Screen>
    );
  }

  if (userQuery.isError || !userQuery.data || profileQuery.isError) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <ScreenState
          title="Settings unavailable"
          message="The app could not load your account settings."
          actionLabel="Retry"
          onAction={() => {
            void userQuery.refetch();
            void profileQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title="Settings" subtitle="Account and profile preferences" onBack={() => navigation.goBack()} />

      {!profileQuery.data ? (
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Profile incomplete</Text>
          <Text style={styles.noticeText}>
            This account does not have a saved profile yet. Saving profile fields here will create one.
          </Text>
        </Card>
      ) : null}

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.teal}>Account Details</SectionEyebrow>
        <Card style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.fieldInput}
              autoCapitalize="none"
              placeholderTextColor="rgba(255,255,255,0.28)"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.fieldInput}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="rgba(255,255,255,0.28)"
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Profile</SectionEyebrow>
        <Card style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.fieldInput}
              placeholder="Jordan"
              placeholderTextColor="rgba(255,255,255,0.28)"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              style={styles.fieldInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.28)"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.rowGap}>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Height (cm)</Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                style={styles.fieldInput}
                placeholder="175"
                keyboardType="decimal-pad"
                placeholderTextColor="rgba(255,255,255,0.28)"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                style={styles.fieldInput}
                placeholder="82.5"
                keyboardType="decimal-pad"
                placeholderTextColor="rgba(255,255,255,0.28)"
              />
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.blue}>Training Preferences</SectionEyebrow>
        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <ChipWrap
            items={[...GENDERS]}
            selected={gender}
            onSelect={setGender}
            activeColor={COLORS.teal}
            columns={2}
          />

          <View style={styles.preferenceSpacer} />

          <Text style={styles.fieldLabel}>Fitness Level</Text>
          <ChipWrap
            items={[...FITNESS_LEVELS]}
            selected={fitnessLevel}
            onSelect={setFitnessLevel}
            activeColor={COLORS.purple}
          />

          <View style={styles.preferenceSpacer} />

          <Text style={styles.fieldLabel}>Measurement System</Text>
          <View style={styles.unitOptions}>
            {UNITS.map((unitOption) => (
              <Pressable
                key={unitOption.value}
                onPress={() => setUnit(unitOption.value)}
                style={[styles.unitOption, unit === unitOption.value && styles.unitOptionActive]}
              >
                <Text style={[styles.unitText, unit === unitOption.value && styles.unitTextActive]}>
                  {unitOption.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>

      {error ? (
        <View style={styles.messageBoxError}>
          <Text style={styles.messageTextError}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.messageBoxSuccess}>
          <Text style={styles.messageTextSuccess}>{success}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label={saving ? "Saving..." : "Save Settings"}
        onPress={() => {
          void handleSave();
        }}
        icon={
          saving ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Feather name="check" size={16} color="#000000" />
          )
        }
        disabled={saving}
        style={{ marginTop: 24 }}
      />

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.red}>Session</SectionEyebrow>
        <Pressable
          style={styles.signOutButton}
          onPress={() => {
            void logout();
          }}
        >
          <Feather name="log-out" size={16} color={COLORS.muted} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  noticeCard: {
    marginTop: 16,
    borderColor: `${COLORS.orange}24`,
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  noticeText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  card: {
    marginTop: 10,
  },
  fieldRow: {
    paddingVertical: 4,
  },
  rowGap: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  fieldInput: {
    color: COLORS.text,
    fontSize: 15,
    minHeight: 44,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 12,
  },
  preferenceSpacer: {
    height: 18,
  },
  unitOptions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  unitOptionActive: {
    backgroundColor: `${COLORS.teal}20`,
    borderColor: `${COLORS.teal}40`,
  },
  unitText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  unitTextActive: {
    color: COLORS.teal,
  },
  messageBoxError: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  messageTextError: {
    color: COLORS.red,
    fontSize: 12,
  },
  messageBoxSuccess: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
    backgroundColor: `${COLORS.green}14`,
    borderWidth: 1,
    borderColor: `${COLORS.green}24`,
  },
  messageTextSuccess: {
    color: COLORS.green,
    fontSize: 12,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: COLORS.card,
  },
  signOutText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
  },
});
