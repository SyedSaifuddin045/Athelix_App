import { type ReactNode } from "react";
import Animated, { FadeInDown, FadeIn, ZoomIn } from "react-native-reanimated";

type AnimationType = "fade" | "fadeUp" | "scale";

interface AnimatedEnterProps {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
}

const animations: Record<AnimationType, typeof FadeInDown> = {
  fade: FadeIn,
  fadeUp: FadeInDown,
  scale: ZoomIn,
};

export function AnimatedEnter({ children, type = "fadeUp", delay = 0, duration = 300 }: AnimatedEnterProps) {
  const anim = animations[type].delay(delay).duration(duration);
  return <Animated.View entering={anim}>{children}</Animated.View>;
}
