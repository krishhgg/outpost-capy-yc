import { memo, useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue,
} from "react-native-reanimated";

// Where the moving pieces go, in art pixels of the 192 x 216 village picture. Measured from village.png: the campfire's
// flame, the Studio's chimney top and the six lantern heads along the road.
const FIRE = { x: 91, y: 84 }; // the flame sprite's top left; it is 10 x 12
const CHIMNEY = { x: 136, y: 6 };
const LAMPS = [[81, 33], [110, 33], [81, 95], [110, 95], [81, 137], [110, 137]];
// The two boats on the water, lifted out of village.png by art/boats.py (the picture has bare water there): each one's
// top left and size.
const BOATS = [{ x: 37, y: 191, w: 29, h: 23 }, { x: 144, y: 199, w: 29, h: 17 }];
// Weather, made by art/weather.py. The foam frames cover rows 186 to 200, where the surf meets the water. The sparkles
// sit on open water clear of the boats and the dock. Two cloud shadows cross the map at different heights and speeds,
// starting part of the way across so one is on the map at launch.
const SHORE = { y: 186, h: 15 };
const GLINTS = [[12, 202], [27, 209], [80, 203], [100, 207], [106, 213], [138, 201], [180, 206], [188, 212]];
const CLOUDS = [{ y: 26, ms: 46000, phase: 0.2 }, { y: 104, ms: 62000, phase: 0.7 }];

const SPRITE = {
  fire: [require("../assets/ambient/fire0.png"), require("../assets/ambient/fire1.png"), require("../assets/ambient/fire2.png")],
  fireGlow: require("../assets/ambient/fireglow.png"),
  lampGlow: require("../assets/ambient/lampglow.png"),
  smoke: require("../assets/ambient/smoke.png"),
  boats: [require("../assets/ambient/boat1.png"), require("../assets/ambient/boat2.png")],
  // Both cover the whole village, clear except at the Studio's and the Post's windows. Made by art/windows.py.
  windowsDark: require("../assets/ambient/windows-dark.png"),
  windowsGlow: require("../assets/ambient/windows-glow.png"),
  foam: [require("../assets/ambient/foam0.png"), require("../assets/ambient/foam1.png")],
  glint: require("../assets/ambient/glint.png"),
  cloud: require("../assets/ambient/cloud.png"),
};

// The village's small motions: the campfire burns and lights the ground, the lanterns glow, the surf laps, the water
// sparkles, the boats bob, cloud shadows drift over and the Studio's chimney smokes while it is making a video. `px` is one art pixel in points. The windows glow while the
// studio laptop is online and go dark while it sleeps; `lit` is undefined until the status loads, so they show as drawn.
export const Ambient = memo(function Ambient({ px, smoking, lit }: { px: number; smoking: boolean; lit?: boolean }) {
  const box = (x: number, y: number, w: number, h: number) => ({ position: "absolute" as const, left: x * px, top: y * px, width: w * px, height: h * px });
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none" testID="base-ambient">
      {lit === false && <Image source={SPRITE.windowsDark} style={box(0, 0, 192, 216)} testID="ambient-windows-dark" />}
      {lit && <Glow source={SPRITE.windowsGlow} style={box(0, 0, 192, 216)} low={0.1} high={1} ms={1800} />}
      <Glow source={SPRITE.fireGlow} style={box(FIRE.x + 5 - 28, FIRE.y + 9 - 18, 56, 36)} low={0.6} high={1} ms={700} />
      {LAMPS.map(([x, y], i) => (
        <Glow key={i} source={SPRITE.lampGlow} style={box(x - 5, y - 5, 11, 11)} low={0.45} high={0.95} ms={1600} delay={i * 270} />
      ))}
      <Fire style={box(FIRE.x, FIRE.y, 10, 12)} />
      <Surf style={box(0, SHORE.y, 192, SHORE.h)} />
      {GLINTS.map(([x, y], i) => (
        <Glint key={i} style={box(x - 1, y - 1, 3, 3)} delay={i * 430} gap={2200 + ((i * 700) % 2000)} />
      ))}
      {BOATS.map((b, i) => <Bob key={i} source={SPRITE.boats[i]} px={px} delay={i * 700} style={box(b.x, b.y, b.w, b.h)} />)}
      {smoking && [0, 1, 2].map(i => <Puff key={i} px={px} delay={i * 900} style={box(CHIMNEY.x, CHIMNEY.y, 5, 5)} />)}
      {CLOUDS.map((c, i) => <Cloud key={i} px={px} ms={c.ms} phase={c.phase} style={box(0, c.y, 46, 18)} />)}
    </View>
  );
});

// Three frames, swapped fast and not quite in order, so the flame doesn't read as a loop.
const ORDER = [0, 1, 2, 1, 0, 2];
function Fire({ style }: { style: object }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % ORDER.length), 140);
    return () => clearInterval(t);
  }, []);
  return <Image source={SPRITE.fire[ORDER[i]]} style={style} testID="ambient-fire" />;
}

// A boat riding the swell: it sits one art pixel lower for a moment, then rises again, in whole pixels so it stays crisp.
function Bob({ source, px, delay, style }: { source: number; px: number; delay: number; style: object }) {
  const t = useLoop(v => {
    v.value = withDelay(delay, withRepeat(withSequence(
      withDelay(1100, withTiming(px, { duration: 0 })),
      withDelay(900, withTiming(0, { duration: 0 }))), -1));
  });
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: t.value }] }));
  return <Animated.Image source={source} style={[style, anim]} testID="ambient-boat" />;
}

function useLoop(make: (v: SharedValue<number>) => void) {
  const v = useSharedValue(0);
  useEffect(() => { make(v); }, []);
  return v;
}

// A light that breathes between two brightnesses.
function Glow({ source, style, low, high, ms, delay = 0 }:
  { source: number; style: object; low: number; high: number; ms: number; delay?: number }) {
  const t = useLoop(v => {
    v.value = withDelay(delay, withRepeat(withSequence(
      withTiming(1, { duration: ms, easing: Easing.inOut(Easing.quad) }),
      withTiming(0.35, { duration: ms * 0.6 }),
      withTiming(0.8, { duration: ms * 0.5 }),
      withTiming(0, { duration: ms, easing: Easing.inOut(Easing.quad) })), -1));
  });
  const anim = useAnimatedStyle(() => ({ opacity: low + (high - low) * t.value }));
  return <Animated.Image source={source} style={[style, anim]} />;
}

// The foam edge's two frames take turns, so the surf laps at the sand.
function Surf({ style }: { style: object }) {
  const t = useLoop(v => { v.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1); });
  const a = useAnimatedStyle(() => ({ opacity: t.value < 0.5 ? 1 : 0 }));
  const b = useAnimatedStyle(() => ({ opacity: t.value < 0.5 ? 0 : 1 }));
  return (
    <>
      <Animated.Image source={SPRITE.foam[0]} style={[style, a]} testID="ambient-surf" />
      <Animated.Image source={SPRITE.foam[1]} style={[style, b]} />
    </>
  );
}

// A sparkle on the water: off most of the time, then a quick bright blink that steps down and out.
function Glint({ style, delay, gap }: { style: object; delay: number; gap: number }) {
  const t = useLoop(v => {
    v.value = withDelay(delay, withRepeat(withSequence(
      withDelay(gap, withTiming(1, { duration: 0 })),
      withDelay(110, withTiming(0.45, { duration: 0 })),
      withDelay(110, withTiming(0, { duration: 0 }))), -1));
  });
  const anim = useAnimatedStyle(() => ({ opacity: t.value }));
  return <Animated.Image source={SPRITE.glint} style={[style, anim]} testID="ambient-glint" />;
}

// A cloud's shadow crossing the map from left to right, in whole art pixels so it stays on the grid. It starts `phase`
// of the way across and wraps around.
function Cloud({ px, ms, phase, style }: { px: number; ms: number; phase: number; style: object }) {
  const t = useLoop(v => { v.value = withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1); });
  const anim = useAnimatedStyle(() => {
    const u = (t.value + phase) % 1;
    return { transform: [{ translateX: Math.round(-46 + u * (192 + 46)) * px }] };
  });
  return <Animated.Image source={SPRITE.cloud} style={[style, anim]} testID="ambient-cloud" />;
}

// One puff of smoke: it leaves the chimney, rises, drifts with the wind and thins out.
function Puff({ px, delay, style }: { px: number; delay: number; style: object }) {
  const t = useLoop(v => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.quad) }), -1));
  });
  const anim = useAnimatedStyle(() => ({
    opacity: t.value < 0.12 ? t.value / 0.12 : 1 - t.value,
    transform: [{ translateY: -8 * px * t.value }, { translateX: 9 * px * t.value }, { scale: 0.6 + 0.9 * t.value }],
  }));
  return <Animated.Image source={SPRITE.smoke} style={[style, anim]} testID="ambient-smoke" />;
}
