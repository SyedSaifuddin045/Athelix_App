import { useState } from "react";
import { Modal, Pressable, Text, View, FlatList } from "react-native";
import { useTheme } from "@tamagui/core";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRecentNotifications, type RecentNotification } from "../hooks/useRecentNotifications";
import { IconButton } from "./ui/Button";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationDropdown({
  notifications,
  onClose,
  onClearAll,
  onTapItem,
  top,
}: {
  notifications: RecentNotification[];
  onClose: () => void;
  onClearAll: () => void;
  onTapItem: (id: string) => void;
  top: number;
}) {
  const theme = useTheme();
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const surfaceColor = theme.surface?.get() ?? "#111d1b";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        {/* Dropdown card */}
        <View
          style={{
            position: "absolute",
            top,
            right: 20,
            width: 320,
            maxHeight: 420,
            backgroundColor: surfaceColor,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 16,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: spacing.xl3,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.06)",
            }}
          >
            <Text style={{ color: textColor, fontSize: 14, fontWeight: "700" }}>
              Notifications
            </Text>
            {notifications.length > 0 && (
              <Pressable onPress={onClearAll} hitSlop={8}>
                <Text
                  style={{
                    color: theme.accent?.get() ?? "#FF5A36",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Clear all
                </Text>
              </Pressable>
            )}
          </View>

          {/* Content */}
          {notifications.length === 0 ? (
            <View style={{ paddingVertical: spacing.xl4, alignItems: "center" }}>
              <Text style={{ color: mutedColor, fontSize: 13 }}>
                No notifications
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              scrollEnabled={notifications.length > 4}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onTapItem(item.id)}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.xl3,
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.04)",
                    opacity: pressed ? 0.7 : item.read ? 0.5 : 1,
                    backgroundColor: item.read
                      ? "transparent"
                      : "rgba(255,90,54,0.03)",
                  })}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontSize: 13,
                      fontWeight: item.read ? "500" : "600",
                    }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      color: mutedColor,
                      fontSize: 12,
                      marginTop: 2,
                      lineHeight: 16,
                    }}
                    numberOfLines={2}
                  >
                    {item.body || "No content"}
                  </Text>
                  <Text
                    style={{
                      color: faintColor,
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    {timeAgo(item.receivedAt)}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

export function NotificationBell() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, clearAll, markRead } =
    useRecentNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleClearAll = () => {
    clearAll();
    // Keep dropdown open to show empty state
  };

  const handleTapItem = (id: string) => {
    markRead(id);
    setShowDropdown(false);
  };

  // Position dropdown just below the bell icon (~60px from top safe area inset)
  const dropdownTop = insets.top + 60;

  return (
    <View style={{ position: "relative" }}>
      <IconButton
        icon="bell"
        size={40}
        onPress={() => setShowDropdown((prev) => !prev)}
      />
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 9,
            height: 9,
            borderRadius: 4.5,
            backgroundColor: "#FF3B30",
          }}
        />
      )}
      {showDropdown && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setShowDropdown(false)}
          onClearAll={handleClearAll}
          onTapItem={handleTapItem}
          top={dropdownTop}
        />
      )}
    </View>
  );
}
