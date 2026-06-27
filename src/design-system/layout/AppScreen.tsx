import { type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "@tamagui/core";

interface AppScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: object;
}

export function AppScreen({ children, scroll = true, contentContainerStyle }: AppScreenProps) {
  const theme = useTheme();

  const screenStyle = {
    flex: 1,
    backgroundColor: theme.background?.toString(),
  };

  if (!scroll) {
    return (
      <View style={screenStyle}>
        <View style={[{ flex: 1 }, contentContainerStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={screenStyle}>
      <ScrollView
        contentContainerStyle={[{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
