import { useEffect } from "react";
import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from "react-native-reanimated";
import { INK, PARCH } from "./tokens";

// Three square dots lighting up in turn: the pixel "working" mark for buttons, chips, pills and empty states.
export function Dots({ color = INK, size = 6, testID }: { color?: string; size?: number; testID?: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(3, { duration: 900 }), -1);
  }, []);
  return (
    <View style={{ flexDirection: "row", gap: size * 0.6, alignItems: "center" }} testID={testID} accessibilityLabel="Loading">
      {[0, 1, 2].map(i => <Dot key={i} i={i} t={t} color={color} size={size} />)}
    </View>
  );
}

function Dot({ i, t, color, size }: { i: number; t: SharedValue<number>; color: string; size: number }) {
  const style = useAnimatedStyle(() => ({ opacity: Math.floor(t.value) % 3 === i ? 1 : 0.3 }));
  return <Animated.View style={[{ width: size, height: size, backgroundColor: color }, style]} />;
}

// A parchment bar that breathes while its content loads. Lay several to sketch the shape of what's coming.
export function Skeleton({ width = "100%", height = 16, delay = 0, style }:
  { width?: DimensionValue; height?: number; delay?: number; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.55);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0.55, { duration: 600 })), -1));
  }, []);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, backgroundColor: PARCH.bottom }, anim, style]} />;
}
