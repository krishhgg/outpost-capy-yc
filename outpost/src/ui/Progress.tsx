import { useEffect } from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { ICON } from "../Hud";
import { Dots } from "./Loader";
import { COLOR, FONT, INK, PARCH } from "./tokens";

// A chunky bar: ink outline, parchment track, a colored fill that slides to its new width.
export function ProgressBar({ value, color = COLOR.gold, height = 12, testID, style }:
  { value: number; color?: string; height?: number; testID?: string; style?: StyleProp<ViewStyle> }) {
  const w = useSharedValue(clamp(value));
  useEffect(() => { w.value = withTiming(clamp(value), { duration: 500 }); }, [value]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={[s.track, { height }, style]} testID={testID} accessible accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(value) * 100) }}>
      <Animated.View style={[s.fill, { backgroundColor: color }, fill]} />
    </View>
  );
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));

// One square per item, filled as they finish: "Making 2 of 5" as five blocks with two lit.
export function Segments({ done, total, color = COLOR.green, size = 10 }: { done: number; total: number; color?: string; size?: number }) {
  return (
    <View style={s.segs}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[s.seg, { width: size, height: size, backgroundColor: i < done ? color : PARCH.bottom }]} />
      ))}
    </View>
  );
}

export type PillState = "waiting" | "working" | "done" | "failed";

// A background job's status in one line, for a bounty card or a list row: "Downloading footage", "Making 2 of 5",
// "Ready". Working pulses a gold light and shows dots; with `total` it adds a block per item.
export function ProgressPill({ label, state, done, total, testID }:
  { label: string; state: PillState; done?: number; total?: number; testID?: string }) {
  const bg = state === "done" ? COLOR.greenPale : state === "failed" ? COLOR.redPale : state === "working" ? PARCH.top : PARCH.bottom;
  return (
    <View style={[s.pill, { backgroundColor: bg }]} testID={testID} accessible accessibilityLabel={label}>
      {state === "done" ? <Image source={ICON.check} style={s.icon} />
        : state === "failed" ? <View style={[s.light, { backgroundColor: COLOR.red }]} />
        : state === "working" ? <Pulse /> : <View style={[s.light, { backgroundColor: PARCH.soft }]} />}
      <Text style={[s.label, state === "waiting" && s.dim]} numberOfLines={1}>{label}</Text>
      {state === "working" && total !== undefined ? <Segments done={done ?? 0} total={total} />
        : state === "working" ? <Dots size={4} color={PARCH.ink} /> : null}
    </View>
  );
}

function Pulse() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withSequence(withTiming(0.35, { duration: 450 }), withTiming(1, { duration: 450 })), -1);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[s.light, { backgroundColor: COLOR.gold }, style]} />;
}

// The path a job takes, as nodes joined by a track: done nodes are green with a check, the current one is gold and
// breathes, later ones wait in parchment. Put the live detail in the current step's label ("Making 2 of 5").
// `failed` turns the current node muted red and stops it.
export function ProgressSteps({ steps, current, failed, testID }: { steps: string[]; current: number; failed?: boolean; testID?: string }) {
  return (
    <View style={s.steps} testID={testID} accessible accessibilityLabel={`Step ${Math.min(current + 1, steps.length)} of ${steps.length}: ${steps[Math.min(current, steps.length - 1)]}`}>
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? (failed ? "failed" : "now") : "later";
        return (
          <View key={i} style={s.step}>
            <View style={s.nodeRow}>
              <View style={[s.leg, i === 0 && s.hidden, i <= current && s.legDone]} />
              <Node state={state} />
              <View style={[s.leg, i === steps.length - 1 && s.hidden, i < current && s.legDone]} />
            </View>
            <Text style={[s.stepLabel, state === "later" && s.dim, state === "now" && s.now]} numberOfLines={2}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Node({ state }: { state: "done" | "now" | "failed" | "later" }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = state === "now" ? withRepeat(withSequence(withTiming(1.14, { duration: 520 }), withTiming(1, { duration: 520 })), -1) : withTiming(1);
  }, [state]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = state === "done" ? COLOR.green : state === "now" ? COLOR.gold : state === "failed" ? COLOR.red : PARCH.bottom;
  return (
    <Animated.View style={[s.node, { backgroundColor: bg }, style]}>
      {state === "done" ? <Image source={ICON.check} style={s.nodeIcon} /> : state === "now" ? <Dots size={3} /> : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  track: { alignSelf: "stretch", backgroundColor: PARCH.bottom, borderWidth: 2, borderColor: INK, overflow: "hidden" },
  fill: { height: "100%" },
  segs: { flexDirection: "row", gap: 3 },
  seg: { borderWidth: 2, borderColor: INK },
  pill: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7, borderWidth: 2, borderColor: INK,
    paddingLeft: 7, paddingRight: 9, paddingVertical: 4,
  },
  light: { width: 10, height: 10, borderWidth: 2, borderColor: INK },
  icon: { width: 18, height: 18, marginVertical: -2 },
  label: { color: PARCH.ink, fontSize: 16, fontFamily: FONT.bold, flexShrink: 1 },
  dim: { color: PARCH.soft },
  steps: { flexDirection: "row", alignSelf: "stretch" },
  step: { flex: 1, alignItems: "center" },
  nodeRow: { flexDirection: "row", alignItems: "center", alignSelf: "stretch" },
  leg: { flex: 1, height: 8, backgroundColor: PARCH.bottom, borderTopWidth: 2, borderBottomWidth: 2, borderColor: INK },
  legDone: { backgroundColor: COLOR.green },
  hidden: { opacity: 0 },
  node: { width: 28, height: 28, borderWidth: 2, borderColor: INK, alignItems: "center", justifyContent: "center" },
  nodeIcon: { width: 20, height: 20 },
  stepLabel: { color: PARCH.ink, fontSize: 14, fontFamily: FONT.semi, textAlign: "center", marginTop: 4, paddingHorizontal: 2 },
  now: { fontFamily: FONT.bold, color: PARCH.ink },
});
