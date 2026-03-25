import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, PrimaryButton, Screen, ScreenState, SectionEyebrow, Tag } from "../../components";
import { COLORS } from "../../theme/colors";
import { TabScreenProps } from "../../types/navigation";
import { useAuth } from "../../app/providers/AuthProvider";
import { useCurrentProfileQuery, useCurrentUserQuery } from "../../features/users/hooks";
import { useRefetchOnFocus } from "../../lib/hooks/useRefetchOnFocus";

type Props = TabScreenProps<"Profile">;

function getInitials(label: string): string {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const { logout } = useAuth();
  const userQuery = useCurrentUserQuery();
  const profileQuery = useCurrentProfileQuery();

  useRefetchOnFocus([userQuery.refetch, profileQuery.refetch]);

  if ((userQuery.isLoading || profileQuery.isLoading) && !userQuery.data) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <ScreenState title="Loading profile" loading message="Fetching your account details" />
      </Screen>
    );
  }

  if (userQuery.isError || !userQuery.data || profileQuery.isError) {
    return (
      <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <ScreenState
          title="Profile unavailable"
          message="The app could not load your account details."
          actionLabel="Retry"
          onAction={() => {
            void userQuery.refetch();
            void profileQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const user = userQuery.data;
  const profile = profileQuery.data;
  const displayName = profile?.display_name || user.username;

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            {profile?.fitness_level ? (
              <Tag
                label={profile.fitness_level}
                color={COLORS.purple}
                backgroundColor={`${COLORS.purple}20`}
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.teal}>Account</SectionEyebrow>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user.username}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Profile</SectionEyebrow>
        {profile ? (
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>
                {profile.height_cm ? `${profile.height_cm}` : "—"}
              </Text>
              <Text style={styles.statLabel}>Height (cm)</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>
                {profile.weight_kg ? `${profile.weight_kg}` : "—"}
              </Text>
              <Text style={styles.statLabel}>Weight (kg)</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{profile.preferred_unit ?? "—"}</Text>
              <Text style={styles.statLabel}>Preferred Unit</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{profile.gender ?? "—"}</Text>
              <Text style={styles.statLabel}>Gender</Text>
            </Card>
          </View>
        ) : (
          <Card style={styles.missingProfileCard}>
            <Text style={styles.missingTitle}>Profile not created</Text>
            <Text style={styles.missingText}>
              `GET /users/me/profile` returned a not-found state, so this account still needs onboarding.
            </Text>
            <PrimaryButton
              label="Complete Profile"
              onPress={() => navigation.navigate("ProfileSetup")}
              style={{ marginTop: 16 }}
            />
          </Card>
        )}
      </View>

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
  header: { marginBottom: 20 },
  avatarSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#000000", fontSize: 28, fontWeight: "900" },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  profileEmail: { color: COLORS.muted, fontSize: 13, marginTop: 2, marginBottom: 10 },
  section: { marginTop: 28 },
  infoCard: { marginTop: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { color: COLORS.muted, fontSize: 12 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: "700", maxWidth: "58%", textAlign: "right" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  statCard: { width: "48%", alignItems: "center", paddingVertical: 16 },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: "900", textTransform: "capitalize" },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4, textAlign: "center" },
  missingProfileCard: { marginTop: 10 },
  missingTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  missingText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
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
  signOutText: { color: COLORS.muted, fontSize: 14, fontWeight: "600" },
});
