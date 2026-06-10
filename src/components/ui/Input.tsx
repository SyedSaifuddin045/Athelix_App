import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import { COLORS } from "../../theme/colors";
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
        placeholderTextColor="rgba(255,255,255,0.28)"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={styles.input}
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
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  strike?: boolean;
  error?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.25)"
      style={[styles.miniInput, strike ? { textDecorationLine: "line-through" } : null, error ? { borderColor: COLORS.red, borderWidth: 1.5 } : null]}
      keyboardType={keyboardType ?? "default"}
    />
  );
}

export function ChipWrap({
  items,
  selected,
  onSelect,
  activeColor,
  columns,
  style,
}: {
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  activeColor: string;
  columns?: number;
  style?: object;
}) {
  return (
    <View style={[styles.chipWrap, columns === 2 ? { flexDirection: "row", flexWrap: "wrap" } : null, style]}>
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onSelect(item)}
          style={[
            styles.optionChip,
            columns === 2 ? { width: "48%" } : null,
            selected === item
              ? { backgroundColor: `${activeColor}20`, borderColor: `${activeColor}40` }
              : null,
          ]}
        >
          <Text style={[styles.optionChipText, selected === item ? { color: activeColor } : null]}>{item}</Text>
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
        selected ? { backgroundColor: `${color}12`, borderColor: `${color}44` } : null,
      ]}
    >
      <View style={styles.rowGap}>
        <Radio selected={selected} color={color} />
        <View>
          <Text style={[styles.listRowTitle, selected ? { color: COLORS.text } : { color: "rgba(255,255,255,0.68)" }]}>{label}</Text>
          {sublabel ? <Text style={[styles.listMeta, { color }]}>{sublabel}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function Radio({ selected, color }: { selected: boolean; color: string }) {
  return (
    <View style={[styles.radioOuter, { borderColor: selected ? color : "rgba(255,255,255,0.3)" }]}>
      {selected ? <View style={[styles.radioInner, { backgroundColor: color }]} /> : null}
    </View>
  );
}

const ITEM_H = 44;

export function PickerColumn({ values, selected, onSelect, label, itemWidth = 64 }: {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
  label: string;
  itemWidth?: number;
}) {
  const flatRef = useRef<FlatList>(null);
  const listHeight = ITEM_H * 5;

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0) {
      flatRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
    }
  }, []);

  return (
    <View style={{ alignItems: "center", width: itemWidth }}>
      <Text style={[styles.fieldLabel, { marginBottom: 4, textAlign: "center" }]}>{label}</Text>
      <View style={{ height: listHeight, overflow: "hidden", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
        <FlatList
          ref={flatRef}
          data={values}
          keyExtractor={(v) => String(v)}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, idx) => ({ length: ITEM_H, offset: ITEM_H * idx, index: idx })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
            onSelect(values[idx] ?? values[0]);
          }}
          renderItem={({ item, index }) => {
            const isSelected = item === selected;
            return (
              <Pressable
                onPress={() => {
                  flatRef.current?.scrollToIndex({ index, animated: true });
                  onSelect(item);
                }}
                style={{ height: ITEM_H, justifyContent: "center", alignItems: "center" }}
              >
                <Text style={{
                  color: isSelected ? COLORS.text : "rgba(255,255,255,0.3)",
                  fontSize: isSelected ? 20 : 14,
                  fontWeight: isSelected ? "700" : "400",
                  opacity: isSelected ? 1 : 0.5,
                }}>
                  {String(item).padStart(2, "0")}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}
