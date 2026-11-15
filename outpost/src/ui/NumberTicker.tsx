import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { Outlined } from "../pixel";
import { tick } from "../click";
import { Dots } from "./Loader";
import { COLOR, FONT, PARCH, POP, thousands } from "./tokens";

export type NumberTickerProps = {
  // A whole number: a count, cents or points. Undefined while it loads.
  value: number | undefined;
  format?: (n: number) => string;
  size?: number;
  color?: string;
  // Outlined white-on-ink type (on the water, wood or a colored block) or plain ink type (on parchment).
  outlined?: boolean;
  // Flash the change ("+4", "-2") beside the number when it moves. On by default.
  delta?: boolean;
  // Play the HUD's tick when it moves. Off by default; use it for the one number the user is watching.
  sound?: boolean;
  duration?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

// A number that counts to its new value instead of jumping, pops once, and flashes the change in green (up) or muted
// red (down). The first value after loading appears without any of that, so opening a screen doesn't animate.
export function NumberTicker({ value, format = thousands, size = 34, color, outlined = true, delta = true, sound, duration = 650, testID, style }:
  NumberTickerProps) {
  const [shown, setShown] = useState(value ?? 0);
  const shownRef = useRef(value ?? 0);
  const target = useRef(value);
  const [flash, setFlash] = useState<{ id: number; diff: number } | null>(null);
  const pop = useSharedValue(1);

  useEffect(() => {
    const before = target.current;
    target.current = value;
    if (value === undefined) return;
    if (before === undefined || before === value) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const from = shownRef.current;
    const t0 = Date.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / duration);
      const n = Math.round(from + (value - from) * (1 - (1 - k) ** 3));
      shownRef.current = n;
      setShown(n);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    pop.value = withSequence(withTiming(1.18, { duration: 110 }), withSpring(1, POP));
    if (delta) setFlash({ id: t0, diff: value - before });
    if (sound) tick();
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const ink = color ?? (outlined ? "#fff" : PARCH.ink);
  const line = Math.round(size * 1.22 * 1.12);

  return (
    <View style={[s.wrap, style]} testID={testID} accessible accessibilityLabel={value === undefined ? "Loading" : format(value)}>
      {value === undefined ? (
        <View style={[s.loading, { height: line }]}><Dots color={outlined ? COLOR.foam : PARCH.soft} size={Math.max(5, Math.round(size / 5))} /></View>
      ) : (
        <Animated.View style={popStyle}>
          {outlined ? <Outlined size={size} color={ink} width={size >= 40 ? 3 : undefined}>{format(shown)}</Outlined>
            : <Text style={{ color: ink, fontFamily: FONT.bold, fontSize: Math.round(size * 1.22), lineHeight: line }}>{format(shown)}</Text>}
        </Animated.View>
      )}
      {flash && flash.diff !== 0 ? (
        <Delta key={flash.id} text={`${flash.diff > 0 ? "+" : "-"}${format(Math.abs(flash.diff))}`} up={flash.diff > 0}
          size={Math.max(16, Math.round(size * 0.55))} onDone={() => setFlash(f => (f?.id === flash.id ? null : f))} />
      ) : null}
    </View>
  );
}

// The change, risen from the number's top right corner: it punches in, holds long enough to read, then floats off.
function Delta({ text, up, size, onDone }: { text: string; up: boolean; size: number; onDone: () => void }) {
  const t = useSharedValue(0);
  const scale = useSharedValue(0.4);
  useEffect(() => {
    scale.value = withSequence(withTiming(1.2, { duration: 120 }), withSpring(1, POP));
    t.value = withDelay(1100, withTiming(1, { duration: 500, easing: Easing.in(Easing.quad) }));
    const timer = setTimeout(onDone, 1700);
    return () => clearTimeout(timer);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ translateY: -14 * t.value }, { scale: scale.value }] }));
  return (
    <Animated.View style={[s.delta, style]} pointerEvents="none" testID="ticker-delta">
      <Outlined size={size} color={up ? COLOR.greenPale : COLOR.redPale}>{text}</Outlined>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-start", alignSelf: "flex-start" },
  loading: { justifyContent: "center", paddingHorizontal: 4 },
  delta: { position: "absolute", left: "100%", top: -6, marginLeft: 4 },
});
