import { Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { useTheme } from "@tamagui/core";
import { radii } from "../../design-system/tokens/radii";
import { spacing } from "../../design-system/tokens/spacing";

interface AppInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  style?: object;
}

export function AppInput({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  errorMessage,
  keyboardType,
  secureTextEntry,
  multiline,
  style,
}: AppInputProps) {
  const theme = useTheme();
  const bgColor = theme.surface2?.toString() ?? "rgba(255,255,255,0.06)";
  const border = error
    ? (theme.colorRed?.toString() ?? "#EF4444")
    : (theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)");
  const textColor = theme.color?.toString() ?? "#FFFFFF";
  const placeholderColor = theme.colorFaint?.toString() ?? "rgba(255,255,255,0.25)";

  return (
    <View style={{ flex: 1 }}>
      {label ? (
        <Text
          style={{
            color: theme.colorMuted?.toString() ?? "rgba(255,255,255,0.45)",
            fontSize: 11,
            fontWeight: "700",
            marginBottom: spacing.sm,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[
          {
            width: "100%",
            minHeight: multiline ? 80 : 52,
            borderRadius: radii.input,
            backgroundColor: bgColor,
            borderWidth: 1,
            borderColor: border,
            color: textColor,
            paddingHorizontal: spacing.xl3,
            paddingVertical: multiline ? spacing.xl2 : 0,
            fontSize: 14,
            ...(multiline ? { textAlignVertical: "top" } : {}),
          },
          style,
        ]}
      />
      {error && errorMessage ? (
        <Text
          style={{
            color: theme.colorRed?.toString() ?? "#EF4444",
            fontSize: 10,
            marginTop: spacing.sm,
            marginLeft: spacing.xxs,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
