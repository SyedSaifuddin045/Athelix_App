import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import { COLORS } from "../../theme/colors";
import { SPACING, RADIUS } from "../../theme/spacing";
import { styles } from "../../theme/styles";

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.faint}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.input, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
      />
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
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? ""}
      placeholderTextColor={COLORS.faint}
      keyboardType={keyboardType ?? "decimal-pad"}
      style={[
        styles.miniInput,
        {
          minWidth: 0,
          minHeight: 38,
          borderRadius: RADIUS.stepper,
          backgroundColor: COLORS.cardSoft,
          borderWidth: 1,
          borderColor: error ? COLORS.red : COLORS.border,
          color: COLORS.text,
          textAlign: "center",
          fontSize: 13,
          paddingHorizontal: SPACING.xs,
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
  activeColor = COLORS.teal,
  columns,
}: {
  items: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  activeColor?: string;
  columns?: number;
}) {
  return (
    <View
      style={[
        styles.chipWrap,
        {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: SPACING.md,
          marginTop: SPACING.lg,
        },
      ]}
    >
      {items.map((item) => (
        <Pressable
          key={item.value}
          onPress={() => onSelect(item.value)}
          style={[
            styles.optionChip,
            {
              paddingHorizontal: SPACING.xl2,
              paddingVertical: SPACING.lg,
              borderRadius: RADIUS.input,
              borderWidth: 1,
              borderColor: selected === item.value ? `${activeColor}50` : COLORS.border,
              backgroundColor: selected === item.value ? `${activeColor}20` : COLORS.cardSoft,
            },
          ]}
        >
          <Text
            style={[
              styles.optionChipText,
              {
                color: selected === item.value ? COLORS.text : COLORS.muted,
              },
            ]}
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
  color = COLORS.teal,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  sublabel?: string;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectableRow,
        {
          minHeight: 54,
          borderRadius: RADIUS.input,
          borderWidth: 1,
          borderColor: selected ? `${color}50` : COLORS.border,
          backgroundColor: selected ? `${color}12` : COLORS.card,
          justifyContent: "center",
          paddingHorizontal: SPACING.xl2,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xl }}>
        <Radio selected={selected} color={color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.listRowTitle, selected ? { color: COLORS.text } : null]}>{label}</Text>
          {sublabel ? <Text style={styles.listMeta}>{sublabel}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function Radio({
  selected,
  color = COLORS.teal,
}: {
  selected: boolean;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.radioOuter,
        {
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? color : COLORS.border,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      {selected ? (
        <View
          style={[
            styles.radioInner,
            {
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
            },
          ]}
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
        style={[
          styles.restChip,
          {
            flexDirection: "row",
            alignItems: "center",
            gap: SPACING.sm,
            paddingHorizontal: SPACING.xl,
            paddingVertical: SPACING.md,
            borderRadius: RADIUS.stepper,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.cardSoft,
          },
        ]}
      >
        <Text style={[styles.restChipText, { color: COLORS.muted }]}>
          {currentVal} {label ?? ""}
        </Text>
      </Pressable>
      {showPicker ? (
        <View style={{ height: 160, marginTop: SPACING.sm }}>
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
                  style={[
                    {
                      color: item === currentVal ? COLORS.teal : COLORS.muted,
                      fontSize: item === currentVal ? 16 : 14,
                      fontWeight: item === currentVal ? "700" : "400",
                    },
                  ]}
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
