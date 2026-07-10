import { useRef } from "react";
import { Animated } from "react-native";

export function usePressOpacity(pressedOpacity = 0.7) {
  const opacity = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.timing(opacity, { toValue: pressedOpacity, duration: 100, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };
  return { opacity, onPressIn, onPressOut };
}
