import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { useTheme } from "@tamagui/core";
import { radii } from "../../design-system/tokens/radii";
import { spacing } from "../../design-system/tokens/spacing";
import { AppIcon, type IconName } from "../../design-system/icons/AppIcon";

interface AppEmptyStateProps {
  icon?: ReactNode;
  iconName?: IconName;
  title: string;
  text: string;
}

export function AppEmptyState({ icon, iconName, title, text }: AppEmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xl8, gap: spacing.xl }}>
      {icon ?? (iconName ? (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radii.iconWrap,
            backgroundColor: theme.surface2?.get(),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name={iconName} size={24} color={theme.colorFaint?.get()} />
        </View>
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radii.iconWrap,
            backgroundColor: theme.surface2?.get(),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name="file-x" size={24} color={theme.colorFaint?.get()} />
        </View>
      ))}
      <Text
        style={{
          color: theme.color?.get() ?? "#FFFFFF",
          fontSize: 15,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
          fontSize: 13,
          textAlign: "center",
          maxWidth: 260,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
