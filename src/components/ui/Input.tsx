import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useTheme } from "@tamagui/core";

import { radii } from "../../design-system/tokens/radii";
import { spacing } from "../../design-system/tokens/spacing";

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean;
  error?: string;
}) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
          fontSize: 11,
          fontWeight: "700",
          marginBottom: spacing.sm,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colorFaint?.get()}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={{
          width: "100%",
          minHeight: 52,
          borderRadius: radii.input,
          backgroundColor: theme.surface2?.get(),
          borderWidth: 1,
          borderColor: error ? (theme.colorRed?.get() ?? "#EF4444") : (theme.borderColor?.get()),
          color: theme.color?.get() ?? "#FFFFFF",
          paddingHorizontal: spacing.xl3,
          fontSize: 14,
        }}
      />
      {error ? (
        <Text style={{ color: theme.colorRed?.get() ?? "#EF4444", fontSize: 11, marginTop: spacing.xs }}>{error}</Text>
      ) : null}
    </View>
  );
}

export function MiniInput({
  value,
  onChangeText,
  placeholder,
  strike,
  error,
  keyboardType,
  style,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  strike?: boolean;
  error?: boolean;
  keyboardType?: "default" | "decimal-pad";
  style?: Record<string, unknown>;
}) {
  const theme = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? ""}
      placeholderTextColor={theme.colorFaint?.get()}
      keyboardType={keyboardType ?? "decimal-pad"}
      style={[
        {
          flex: 1,
          minWidth: 0,
          minHeight: 38,
          borderRadius: radii.stepper,
          backgroundColor: theme.surface2?.get(),
          borderWidth: 1,
          borderColor: error
            ? (theme.colorRed?.get() ?? "#EF4444")
            : (theme.borderColor?.get()),
          color: theme.color?.get() ?? "#FFFFFF",
          textAlign: "center",
          fontSize: 13,
          paddingHorizontal: spacing.xs,
          textDecorationLine: strike ? "line-through" : "none",
          opacity: strike ? 0.5 : 1,
        },
        style,
      ]}
    />
  );
}

export function ChipWrap({
  items,
  selected,
  onSelect,
  activeColor = "#FF5A36",
  columns,
}: {
  items: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  activeColor?: string;
  columns?: number;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
        marginTop: spacing.lg,
      }}
    >
      {items.map((item) => (
        <Pressable
          key={item.value}
          onPress={() => onSelect(item.value)}
          style={{
            paddingHorizontal: spacing.xl2,
            paddingVertical: spacing.lg,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: selected === item.value ? `${activeColor}50` : theme.borderColor?.get(),
            backgroundColor: selected === item.value ? `${activeColor}20` : theme.surface2?.get(),
          }}
        >
          <Text
            style={{
              color: selected === item.value
                ? (theme.color?.get())
                : (theme.colorMuted?.get()),
              fontSize: 12,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SelectableRow({
  selected,
  onPress,
  label,
  sublabel,
  color = "#FF5A36",
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  sublabel?: string;
  color?: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 54,
        borderRadius: radii.input,
        borderWidth: 1,
        borderColor: selected ? `${color}50` : theme.borderColor?.get(),
        backgroundColor: selected ? `${color}12` : theme.surface1?.get(),
        justifyContent: "center",
        paddingHorizontal: spacing.xl2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xl }}>
        <Radio selected={selected} color={color} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: selected
                ? (theme.color?.get() ?? "#FFFFFF")
                : (theme.color?.get() ?? "#FFFFFF"),
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text
              style={{
                color: theme.colorFaint?.get() ?? "rgba(255,255,255,0.34)",
                fontSize: 10,
              }}
            >
              {sublabel}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function Radio({
  selected,
  color = "#FF5A36",
}: {
  selected: boolean;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selected ? color : theme.borderColor?.get(),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {selected ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
          }}
        />
      ) : null}
    </View>
  );
}

export function PickerColumn({
  value,
  onChange,
  values: explicitValues,
  min = 0,
  max = 100,
  step = 1,
  label,
  selected,
  onSelect,
}: {
  value?: number;
  onChange?: (value: number) => void;
  values?: number[];
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  selected?: number;
  onSelect?: (value: number) => void;
}) {
  const theme = useTheme();
  const items = explicitValues ?? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);
  const currentVal = value ?? selected ?? items[0];
  const handleChange = onChange ?? onSelect ?? (() => {});
  const flatRef = useRef<FlatList<number> | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (showPicker && flatRef.current) {
      const index = items.indexOf(currentVal);
      if (index >= 0) {
        setTimeout(() => flatRef.current?.scrollToIndex({ index, animated: false }), 100);
      }
    }
  }, [showPicker]);

  return (
    <View>
      <Pressable
        onPress={() => setShowPicker((v) => !v)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: radii.stepper,
          borderWidth: 1,
          borderColor: theme.borderColor?.get(),
          backgroundColor: theme.surface2?.get(),
        }}
      >
        <Text
          style={{
            color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {currentVal} {label ?? ""}
        </Text>
      </Pressable>
      {showPicker ? (
        <View style={{ height: 160, marginTop: spacing.sm }}>
          <FlatList
            ref={flatRef}
            data={items}
            keyExtractor={(item) => String(item)}
            showsVerticalScrollIndicator={false}
            snapToInterval={40}
            decelerationRate="fast"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  handleChange(item);
                  setShowPicker(false);
                }}
                style={{ height: 40, justifyContent: "center", alignItems: "center" }}
              >
                <Text
                  style={{
                    color: item === currentVal
                      ? (theme.accent?.get() ?? "#FF5A36")
                      : (theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)"),
                    fontSize: item === currentVal ? 16 : 14,
                    fontWeight: item === currentVal ? "700" : "400",
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}
    </View>
  );
}
