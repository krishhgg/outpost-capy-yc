import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { Block, Outlined, type Bevel } from "../pixel";
import { ICON } from "../Hud";
import { HonestyLabel } from "./Badge";
import { Skeleton } from "./Loader";
import { NumberTicker } from "./NumberTicker";
import { ProgressBar } from "./Progress";
import { COLOR, FONT, PARCH } from "./tokens";

// Taste tiers, renamed from the brief's Scout / Curator / Director / Tastemaker so they don't collide with the
// village's own Scout (the Whop find) and Director (the agent who remakes videos). Same bands.
export const TIERS = [
  { key: "settler", name: "Settler", min: 0, bevel: "slate", icon: ICON.house, color: COLOR.slate },
  { key: "curator", name: "Curator", min: 40, bevel: "teal", icon: ICON.glass, color: COLOR.teal },
  { key: "showrunner", name: "Showrunner", min: 60, bevel: "orange", icon: ICON.play, color: COLOR.orange },
  { key: "tastemaker", name: "Tastemaker", min: 80, bevel: "gold", icon: require("../../assets/base/star-lit.png") as ImageSourcePropType, color: COLOR.gold },
] as const satisfies readonly { key: string; name: string; min: number; bevel: Bevel; icon: ImageSourcePropType; color: string }[];
export type Tier = (typeof TIERS)[number];

export function tierFor(score: number): Tier {
  return [...TIERS].reverse().find(t => score >= t.min) ?? TIERS[0];
}
export function nextTier(score: number): Tier | null {
  return TIERS.find(t => t.min > score) ?? null;
}

// The tier as an emblem: its color's bevel, its icon, its name. No lift, so it reads as a rank, not a button.
export function TierBadge({ score, size = "md", testID = "tier-badge" }: { score: number; size?: "md" | "sm"; testID?: string }) {
  const t = tierFor(score);
  const sm = size === "sm";
  return (
    <Block bevel={t.bevel} depth={sm ? 2 : 3} style={[s.badge, sm && s.badgeSm]} testID={testID}>
      <View style={s.badgeRow} accessible accessibilityLabel={`${t.name} tier`}>
        <Image source={t.icon} style={sm ? s.iconSm : s.icon} />
        <Outlined size={sm ? 15 : 19}>{t.name.toUpperCase()}</Outlined>
      </View>
    </Block>
  );
}

// Score, tier and the way to the next one. Undefined score is loading. `calibrating` shows a provisional score with
// how many posts are scored so far ("3 of 5 posts scored"), labeled, instead of pretending it's settled.
export function TierProgress({ score, calibrating, testID = "tier-progress" }:
  { score: number | undefined; calibrating?: { scored: number; needed: number }; testID?: string }) {
  if (score === undefined) {
    return (
      <View style={s.wrap} testID={testID}>
        <View style={s.head}><Skeleton width={130} height={30} /><Skeleton width={70} height={40} delay={150} /></View>
        <Skeleton height={14} delay={300} />
        <Skeleton width={160} height={12} delay={450} />
      </View>
    );
  }
  const t = tierFor(score);
  const next = nextTier(score);
  const fill = next ? (score - t.min) / (next.min - t.min) : 1;
  return (
    <View style={s.wrap} testID={testID}>
      <View style={s.head}>
        <TierBadge score={score} />
        <View style={s.score}>
          <NumberTicker value={Math.round(score)} size={40} outlined={false} testID={`${testID}-score`} />
          <Text style={s.outOf}>/100</Text>
        </View>
      </View>
      <ProgressBar value={fill} color={t.color} height={14} testID={`${testID}-bar`} />
      <View style={s.foot}>
        <Text style={s.next}>{next ? `${next.min - Math.round(score)} to ${next.name}` : "Top tier. Keep your eye sharp."}</Text>
        {next ? <Text style={s.range}>{`${t.min}–${next.min - 1}`}</Text> : null}
      </View>
      {calibrating ? (
        <View style={s.calibrating}>
          <HonestyLabel kind="provisional" />
          <Text style={s.calText}>{`${calibrating.scored} of ${calibrating.needed} posts scored`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingTop: 5, paddingBottom: 7 },
  badgeSm: { paddingHorizontal: 7, paddingTop: 3, paddingBottom: 4 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  icon: { width: 24, height: 24 },
  iconSm: { width: 18, height: 18 },
  wrap: { gap: 8, alignSelf: "stretch" },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  score: { flexDirection: "row", alignItems: "flex-end" },
  outOf: { color: PARCH.soft, fontSize: 18, fontFamily: FONT.bold, marginBottom: 8, marginLeft: 2 },
  foot: { flexDirection: "row", justifyContent: "space-between" },
  next: { color: PARCH.ink, fontSize: 16, fontFamily: FONT.semi },
  range: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi },
  calibrating: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  calText: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi },
});
