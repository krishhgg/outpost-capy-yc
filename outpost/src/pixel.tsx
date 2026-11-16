import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { click } from "./click";

// The pixel look: a chunky display face for titles, buttons and big numbers, a finer one for everything else, a dark
// purple outline instead of black, and flat bevels (a light strip on top, a dark strip on the bottom) in place of
// shadows and rounded corners. Both faces keep C, 5, 7 and Z apart at phone sizes, which the first face did not.
export const FONT = { bold: "Jersey10_400Regular", semi: "Jersey15_400Regular", regular: "Jersey15_400Regular" };
// Jersey draws smaller than its point size, so Outlined callers keep their sizes and get this much more.
const DISPLAY = 1.22;
export const INK = "#24152B";
export const WOOD = { base: "#3A2618", grain: "#30200F", lip: "#7A5434" };
export const PARCH = { base: "#F6E4BE", top: "#FFF5DC", bottom: "#D6BA8C", ink: "#34221A", soft: "#7A5C46" };
export const DEEP = "#2B78C4"; // the deep-water blue behind every screen
// The spring every pop settles on: one overshoot of about a fifth, then still within about 0.6 s. Reanimated 4's own
// default is mass 4 and stiffness 900, so a config that sets only `damping` rings for seconds.
export const POP = { mass: 1, stiffness: 180, damping: 12 } as const;

// The water behind a screen: DEEP with small wave crests (art/sea.py), tiled. Put it first inside a DEEP container.
export function Sea() {
  // A required image brings its own 64x64 size, which beats absoluteFill's insets, so the size is set here too.
  return <Image source={require("../assets/ui/sea.png")} resizeMode="repeat" style={s.sea} pointerEvents="none" />;
}

const BEVELS = {
  gold: { base: "#FFC83A", top: "#FFE88C", bottom: "#C48412" },
  slate: { base: "#46567A", top: "#7888B4", bottom: "#2C3650" },
  green: { base: "#5BC44A", top: "#A6EC7C", bottom: "#2F8A2C" },
  orange: { base: "#F07A2A", top: "#FFB070", bottom: "#B04A10" },
  teal: { base: "#2EB8A6", top: "#7FF2E4", bottom: "#1A7E72" },
  parch: { base: PARCH.base, top: PARCH.top, bottom: PARCH.bottom },
} as const;
export type Bevel = keyof typeof BEVELS;

// White text with a dark outline, the way game UIs letter over busy art. The outline is the same text drawn behind
// at eight offsets.
export function Outlined({ children, size, color = "#fff", width, style }:
  { children: string; size: number; color?: string; width?: number; style?: StyleProp<TextStyle> }) {
  const base = { fontFamily: FONT.bold, fontSize: Math.round(size * DISPLAY), lineHeight: Math.round(size * DISPLAY * 1.12) };
  // A thinner outline on small text, so the letters keep their holes.
  width ??= size < 28 ? 1.5 : 2;
  const offsets = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  return (
    <View style={style as StyleProp<ViewStyle>}>
      {offsets.map(([x, y], i) => (
        <Text key={i} style={[base, s.under, { color: INK, transform: [{ translateX: x * width }, { translateY: y * width }] }]}
          accessible={false} importantForAccessibility="no">{children}</Text>
      ))}
      <Text style={[base, { color }]}>{children}</Text>
    </View>
  );
}

// A flat beveled block: outline, base color, light top strip, dark bottom strip. `lift` drops a hard ink shadow that
// many points down and right, so a panel sits above the scene the way a game's menus do.
export function Block({ bevel = "parch", children, style, depth = 4, lift = 0, testID }:
  { bevel?: Bevel; children?: ReactNode; style?: StyleProp<ViewStyle>; depth?: number; lift?: number; testID?: string }) {
  const c = BEVELS[bevel];
  return (
    <View style={[s.block, { backgroundColor: c.base }, lift > 0 && { boxShadow: `${lift}px ${lift}px 0px ${INK}` }, style]} testID={testID}>
      <View style={[s.lipTop, { backgroundColor: c.top, height: depth }]} />
      <View style={[s.lipBottom, { backgroundColor: c.bottom, height: depth + 2 }]} />
      {children}
    </View>
  );
}

// A button that sinks when pressed: the bottom bevel thins, and the face drops into its shadow.
export function PixelButton({ label, onPress, bevel = "gold", size = 26, testID, disabled, style }:
  { label: string; onPress: () => void; bevel?: Bevel; size?: number; testID?: string; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={() => { click(); onPress(); }} disabled={disabled} testID={testID} style={style} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <Block bevel={bevel} depth={pressed ? 2 : 5} lift={pressed || disabled ? 0 : 4}
          style={[s.button, pressed && s.sunk, disabled && { opacity: 0.5 }]}>
          <Outlined size={size}>{label}</Outlined>
        </Block>
      )}
    </Pressable>
  );
}

// The wooden board across the top of each screen: a big outlined title, a gold line under it, an optional control
// on the right, and an optional row under them. `left` takes the title's place, as the Base's counters do.
export function WoodHeader({ title, sub, subID, left, right, below, inset = true, size = 34 }:
  { title: string; sub?: string; subID?: string; left?: ReactNode; right?: ReactNode; below?: ReactNode; inset?: boolean; size?: number }) {
  const top = useSafeAreaInsets().top;
  return (
    <View style={[s.wood, { paddingTop: (inset ? top : 0) + 8 }]}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <View key={i} style={[s.grain, { top: 14 + i * 22 }]} />)}
      <View style={s.woodRow}>
        <View style={s.shrink}>
          {left}
          {title ? <Outlined size={size} width={2.5}>{title}</Outlined> : null}
          {sub ? <Text style={s.woodSub} numberOfLines={1} testID={subID}>{sub}</Text> : null}
        </View>
        {right}
      </View>
      {below}
      <View style={s.woodEdge} />
    </View>
  );
}

// A card's title on a small wood board across its top edge, the way game menus label a panel. Put it right before the
// card and give the card `UNDER_PLAQUE`, so the board overlaps the card's border and the card's content clears it.
export function Plaque({ title, sub, style }: { title: string; sub?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.plaque, style]}>
      <View style={[s.grain, { top: 9 }]} />
      <Outlined size={18} width={1.5}>{title}</Outlined>
      {sub ? <Text style={s.plaqueSub} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}
export const UNDER_PLAQUE = { marginTop: 0, paddingTop: 24 };

const s = StyleSheet.create({
  sea: { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" },
  under: { position: "absolute", left: 0, top: 0 },
  block: { borderWidth: 3, borderColor: INK, overflow: "hidden" },
  lipTop: { position: "absolute", left: 0, right: 0, top: 0 },
  lipBottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  button: { alignItems: "center", justifyContent: "center", paddingVertical: 14, paddingHorizontal: 16 },
  sunk: { transform: [{ translateX: 4 }, { translateY: 4 }] }, // a pressed button drops into its 4 pt shadow
  wood: { backgroundColor: WOOD.base, paddingHorizontal: 16, paddingBottom: 16, overflow: "hidden" },
  grain: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: WOOD.grain },
  woodRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  woodEdge: { position: "absolute", left: 0, right: 0, bottom: 0, height: 7, borderTopWidth: 4, borderTopColor: INK, backgroundColor: WOOD.lip },
  woodSub: { color: "#FFD65C", fontSize: 17, fontFamily: FONT.semi, marginTop: 2 },
  shrink: { flexShrink: 1 },
  plaque: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: -16,
    zIndex: 2, backgroundColor: WOOD.base, borderWidth: 3, borderColor: INK, paddingHorizontal: 12, paddingVertical: 2,
    overflow: "hidden", boxShadow: `3px 3px 0px ${INK}`,
  },
  plaqueSub: { color: "#FFD65C", fontSize: 17, fontFamily: FONT.semi },
});
