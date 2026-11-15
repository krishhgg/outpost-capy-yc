import { useEffect } from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { ICON, type IconName } from "../Hud";
import { COLOR, FONT, INK, PARCH, POP } from "./tokens";

// Badges are flat: a fill and a 2 pt ink outline, never a bevel, so they never look like something to press.
const TONES = {
  gold: { bg: COLOR.gold, fg: INK },
  green: { bg: COLOR.green, fg: "#fff" },
  red: { bg: COLOR.red, fg: "#fff" },
  slate: { bg: COLOR.slate, fg: "#fff" },
  teal: { bg: COLOR.teal, fg: "#fff" },
  orange: { bg: COLOR.orange, fg: "#fff" },
  violet: { bg: COLOR.violetPale, fg: INK },
  parch: { bg: PARCH.top, fg: PARCH.ink },
  ink: { bg: INK, fg: COLOR.foam },
} as const;
export type Tone = keyof typeof TONES;

export type BadgeProps = {
  label: string;
  tone?: Tone;
  icon?: IconName;
  size?: "md" | "sm";
  // A dashed outline marks a figure that isn't final (see HonestyLabel).
  dashed?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = "parch", icon, size = "md", dashed, testID, style }: BadgeProps) {
  const t = TONES[tone];
  const sm = size === "sm";
  return (
    <View style={[s.badge, sm ? s.sm : s.md, { backgroundColor: t.bg }, dashed && s.dashed, style]} testID={testID}
      accessible accessibilityLabel={label}>
      {icon ? <Image source={ICON[icon]} style={sm ? s.iconSm : s.iconMd} /> : null}
      <Text style={[s.text, sm ? s.textSm : s.textMd, { color: t.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// What the studio makes for a bounty: a clip cut from the brand's footage, or an original video.
export function ModeBadge({ mode, size, testID = "mode-badge" }: { mode: "clip" | "original"; size?: "md" | "sm"; testID?: string }) {
  return mode === "clip"
    ? <Badge label="CLIP" tone="teal" size={size} testID={testID} />
    : <Badge label="ORIGINAL" tone="orange" size={size} testID={testID} />;
}

// A post's result against the account's baseline views. Thresholds from COORDINATOR 2.4.
export type Verdict = "hit" | "solid" | "miss";
export const HIT_AT = 1.5;
export const MISS_UNDER = 0.8;
export function verdictFor(ratio: number): Verdict {
  return ratio >= HIT_AT ? "hit" : ratio >= MISS_UNDER ? "solid" : "miss";
}
const ratioText = (r: number) => `${r >= 10 ? Math.round(r) : r.toFixed(1)}x`;

// Hit is celebratory: green with a gold star that pops in. Solid is calm slate. Miss is a muted red, never alarm red,
// and can carry the likely reason in soft text beside it.
export function VerdictBadge({ verdict, ratio, reason, size = "md", testID = `verdict-${verdict}` }:
  { verdict: Verdict; ratio?: number; reason?: string; size?: "md" | "sm"; testID?: string }) {
  const sm = size === "sm";
  const label = { hit: "HIT", solid: "SOLID", miss: "MISS" }[verdict];
  const tone = ({ hit: "green", solid: "slate", miss: "red" } as const)[verdict];
  const star = useSharedValue(verdict === "hit" ? 0 : 1);
  useEffect(() => {
    if (verdict === "hit") star.value = withDelay(120, withSequence(withTiming(1.35, { duration: 140 }), withSpring(1, POP)));
  }, [verdict]);
  const starStyle = useAnimatedStyle(() => ({ transform: [{ scale: star.value }, { rotate: "-12deg" }] }));
  return (
    <View style={s.verdictRow} testID={testID} accessible
      accessibilityLabel={`${label}${ratio !== undefined ? `, ${ratioText(ratio)} baseline views` : ""}${reason ? `, ${reason}` : ""}`}>
      <View style={[s.badge, sm ? s.sm : s.md, { backgroundColor: TONES[tone].bg }, verdict === "hit" && (sm ? s.hitPadSm : s.hitPad)]}>
        <Text style={[s.text, sm ? s.textSm : s.textMd, s.verdictText]}>{label}</Text>
        {ratio !== undefined ? <Text style={[s.text, sm ? s.textSm : s.textMd, s.ratio]}>{ratioText(ratio)}</Text> : null}
      </View>
      {verdict === "hit" ? <Animated.Image source={require("../../assets/base/star-lit.png")} style={[sm ? s.starSm : s.star, starStyle]} /> : null}
      {reason ? <Text style={[s.reason, sm && s.reasonSm]} numberOfLines={1}>{reason}</Text> : null}
    </View>
  );
}

// Honesty labels: every number that isn't a final, real result says so, in a calm dashed tag rather than a warning.
export const HONESTY = {
  forecast: { label: "FORECAST", line: "The studio's guess before it posts", tone: "violet" },
  estimated: { label: "ESTIMATED", line: "Not guaranteed, pending Whop review", tone: "gold" },
  seeded: { label: "SEEDED", line: "Added by hand for the demo", tone: "parch" },
  provisional: { label: "PROVISIONAL", line: "Until enough posts are scored", tone: "parch" },
} as const;
export type Honesty = keyof typeof HONESTY;

// `detail` adds the explanation beside the tag: true for the standard line, or your own string.
// `on` is what it sits on, so the line stays readable: a parchment card or the water.
export function HonestyLabel({ kind, detail, on = "card", size = "sm", testID = `honesty-${kind}` }:
  { kind: Honesty; detail?: boolean | string; on?: "card" | "water"; size?: "md" | "sm"; testID?: string }) {
  const h = HONESTY[kind];
  const line = detail === true ? h.line : detail || null;
  return (
    <View style={s.honestyRow} testID={testID}>
      <Badge label={h.label} tone={h.tone} size={size} dashed />
      {line ? <Text style={[s.honestyLine, on === "water" && s.onWater]} numberOfLines={2}>{line}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 4, borderWidth: 2, borderColor: INK },
  md: { paddingHorizontal: 8, paddingVertical: 3 },
  sm: { paddingHorizontal: 5, paddingVertical: 1 },
  dashed: { borderStyle: "dashed" },
  iconMd: { width: 18, height: 18, marginLeft: -2 },
  iconSm: { width: 14, height: 14, marginLeft: -1 },
  text: { fontFamily: FONT.bold },
  textMd: { fontSize: 16, lineHeight: 19 },
  textSm: { fontSize: 13, lineHeight: 16 },
  verdictRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  verdictText: { color: "#fff" },
  ratio: { color: "#fff", opacity: 0.9 },
  hitPad: { paddingRight: 16 },
  hitPadSm: { paddingRight: 12 },
  star: { width: 26, height: 26, marginLeft: -20, marginTop: -16 },
  starSm: { width: 20, height: 20, marginLeft: -16, marginTop: -12 },
  reason: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi, flexShrink: 1 },
  reasonSm: { fontSize: 13 },
  honestyRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  honestyLine: { color: PARCH.soft, fontSize: 14, fontFamily: FONT.semi, flexShrink: 1 },
  onWater: { color: COLOR.foam, textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0 },
});
