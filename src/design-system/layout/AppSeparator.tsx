import { View, type ViewStyle } from "react-native";
import { useTheme } from "@tamagui/core";

interface AppSeparatorProps {
  style?: ViewStyle;
  marginVertical?: number;
}

export function AppSeparator({ style, marginVertical = 16 }: AppSeparatorProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: theme.borderColor?.get(),
          marginVertical,
        },
        style,
      ]}
    />
  );
}
