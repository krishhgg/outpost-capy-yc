import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useAudioPlayer } from "expo-audio";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { ICON, type IconName } from "./Hud";
import { Block, DEEP, FONT, INK, Outlined, PARCH, PixelButton, Plaque, POP, Sea, UNDER_PLAQUE, WoodHeader } from "./pixel";
import { Portrait } from "./Portrait";
import { click } from "./click";

// T2's list adds what the studio makes for a bounty, its campaign page and its demo library's progress. They are
// optional here so the board still draws from a list without them.
type Bounty = FunctionReturnType<typeof api.bounties.list>[number] & Partial<{
  pregenerated: boolean;
  progress: { ready: number; total: number };
  makes: string;
  url: string;
}>;

const GOLD = "#FFC83A";
const NIGHT = "#1C110B";
const FOAM = "#F5E6C8";

// The bounty board: real paid campaigns as game cards. Take marks a bounty yours and drops its pregenerated videos
// into the Feed; the card then counts how many have landed. Nothing here waits on the studio.
export function Bounties({ device }: { device: string }) {
  const list = useQuery(api.bounties.list, { deviceId: device }) as Bounty[] | undefined;
  // Take shows as taken the moment it's tapped, and Convex rolls it back if the mutation fails.
  const take = useMutation(api.bounties.take).withOptimisticUpdate((store, { deviceId, bountyId }) => {
    const cur = store.getQuery(api.bounties.list, { deviceId });
    if (cur) store.setQuery(api.bounties.list, { deviceId }, cur.map(b => b.id === bountyId ? { ...b, taken: true } : b));
  });
  const [failed, setFailed] = useState<Id<"bounties"> | null>(null);
  const star = useAudioPlayer(require("../assets/sounds/star.wav"));

  const onTake = (b: Bounty) => {
    setFailed(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    take({ deviceId: device, bountyId: b.id }).then(() => {
      star.seekTo(0).catch(() => {});
      star.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, () => {
      setFailed(b.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    });
  };

  const taken = list?.filter(b => b.taken).length ?? 0;
  const sub = !list ? "Checking the board…"
    : list.length === 0 ? "No open campaigns right now"
    : taken > 0 ? `${taken} taken · ${list.length - taken} more open`
    : "Take one and its videos land in your Feed";

  return (
    <View style={s.fill}>
      <Sea />
      <WoodHeader title="BOUNTIES" sub={sub} subID="bounties-sub" />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} testID="bounties">
        <DemoNote />
        {!list ? <Loading />
          : list.length === 0 ? <Empty />
          : list.map(b => <Card key={b.id} b={b} failed={failed === b.id} onTake={() => onTake(b)} />)}
        {list && list.length > 0 && (
          <Text style={s.footnote}>Real campaigns from Whop Content Rewards. Rates and budgets are the brand's own.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function Card({ b, failed, onTake }: { b: Bounty; failed: boolean; onTake: () => void }) {
  return (
    <Animated.View layout={LinearTransition.springify().damping(16)} entering={FadeIn.duration(220)} style={s.slot}>
      <Plaque title={b.brand} sub={b.source === "content_rewards" ? "Content Rewards" : "Whop bounty"} />
      <Block lift={4} style={[s.card, UNDER_PLAQUE]} testID={`bounty-card-${b.id}`}>
        <View style={s.tags}>
          <ModeTag mode={b.mode} />
          {b.pregenerated && b.progress && b.progress.total > 0 && (
            <View style={s.pregen} testID={`bounty-pregenerated-${b.id}`}>
              <Image source={ICON.play} style={s.tagIcon} />
              <Text style={s.pregenText}>{`${b.progress.total} videos pregenerated for the demo`}</Text>
            </View>
          )}
        </View>

        <Text style={s.title} numberOfLines={3}>{b.title}</Text>

        <View style={s.stats}>
          <View style={s.reward} accessible accessibilityLabel={`Reward ${b.rewardLabel}`} testID={`bounty-reward-${b.id}`}>
            <View style={s.rewardBar}><Outlined size={22} color={GOLD}>{b.rewardLabel}</Outlined></View>
            <Image source={ICON.coin} style={s.rewardCoin} />
          </View>
          {b.budgetLabel && <Stat icon="coin" text={b.budgetLabel} testID={`bounty-budget-${b.id}`} />}
          {b.spotsLabel && <Stat icon="person" text={b.spotsLabel} testID={`bounty-spots-${b.id}`} />}
        </View>

        {b.makes ? (
          <View style={s.makes} testID={`bounty-makes-${b.id}`}>
            <Text style={s.makesHead}>OUTPOST MAKES</Text>
            <Text style={s.makesText}>{b.makes}</Text>
          </View>
        ) : null}

        {b.taken ? <Taken b={b} /> : (
          <PixelButton label="TAKE" bevel="green" size={26} onPress={onTake} testID={`bounty-take-${b.id}`} style={s.take} />
        )}
        {failed && <Text style={s.failed}>That didn't go through. Tap Take to try again.</Text>}

        {b.url ? (
          <Pressable onPress={() => { click(); WebBrowser.openBrowserAsync(b.url!).catch(() => {}); }} hitSlop={8}
            accessibilityRole="link" accessibilityLabel={`Open the ${b.brand} campaign page`} testID={`bounty-link-${b.id}`}>
            {({ pressed }) => (
              <View style={[s.linkRow, pressed && s.pressed]}>
                <Image source={ICON.glass} style={s.linkIcon} />
                <Text style={s.link}>See the campaign page</Text>
              </View>
            )}
          </Pressable>
        ) : null}
      </Block>
    </Animated.View>
  );
}

// After Take: a stamped TAKEN, how many of the bounty's videos are in the Feed so far, and a way there.
function Taken({ b }: { b: Bounty }) {
  const pop = useSharedValue(0.6);
  useEffect(() => { pop.value = withSpring(1, POP); }, []);
  const stamp = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const p = b.progress;
  const line = !p || p.total === 0 ? "No pregenerated videos yet"
    : p.ready >= p.total ? `All ${p.total} ready in your Feed`
    : `${p.ready} of ${p.total} ready`;
  return (
    <View style={s.takenWrap}>
      <View style={s.takenRow}>
        <Animated.View style={stamp}>
          <Block bevel="green" depth={3} style={s.stamp} testID={`bounty-taken-${b.id}`}>
            <Image source={ICON.check} style={s.stampIcon} />
            <Outlined size={18}>TAKEN</Outlined>
          </Block>
        </Animated.View>
        <View style={s.progress} testID={`bounty-progress-${b.id}`} accessible accessibilityLabel={line}>
          <Text style={s.progressText} numberOfLines={1}>{line}</Text>
          {p && p.total > 0 && <Meter ready={p.ready} total={p.total} />}
        </View>
      </View>
      <PixelButton label="SWIPE THEM" bevel="gold" size={18} onPress={() => router.navigate("/feed")}
        testID={`bounty-feed-${b.id}`} style={s.swipe} />
    </View>
  );
}

// One block per video, lit as it lands; a plain bar once there are too many blocks to fit.
function Meter({ ready, total }: { ready: number; total: number }) {
  if (total > 12) {
    return <View style={s.bar}><View style={[s.barFill, { width: `${Math.min(1, ready / total) * 100}%` }]} /></View>;
  }
  return (
    <View style={s.blocks}>
      {Array.from({ length: total }, (_, i) => <View key={i} style={[s.block, i < ready && s.blockLit]} />)}
    </View>
  );
}

function ModeTag({ mode }: { mode: Bounty["mode"] }) {
  const clip = mode === "clip";
  return (
    <View style={[s.mode, { backgroundColor: clip ? "#2EB8A6" : "#F07A2A" }]} testID="bounty-mode">
      <Text style={s.modeText}>{clip ? "CLIP" : "ORIGINAL"}</Text>
    </View>
  );
}

function Stat({ icon, text, testID }: { icon: IconName; text: string; testID: string }) {
  return (
    <View style={s.stat} testID={testID}>
      <Image source={ICON[icon]} style={s.tagIcon} />
      <Text style={s.statText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

// v1 posts every approved video to Outpost's own demo accounts, so the board says so up front.
function DemoNote() {
  return (
    <View style={s.demo} testID="demo-note" accessible accessibilityLabel="Demo: posts go to Outpost's demo accounts">
      <View style={s.demoTag}><Text style={s.demoTagText}>DEMO</Text></View>
      <Text style={s.demoText} numberOfLines={1}>Posts go to Outpost's demo accounts</Text>
    </View>
  );
}

function Empty() {
  return (
    <Block lift={4} style={s.empty} testID="bounties-empty">
      <Portrait who="courier" style={s.portrait} />
      <Text style={s.emptyTitle}>The board is empty</Text>
      <Text style={s.emptyBody}>No open campaigns right now. New Whop Content Rewards campaigns show up here as the board refreshes.</Text>
      <PixelButton label="BACK TO BASE" bevel="gold" size={20} onPress={() => router.navigate("/")} testID="bounties-empty-base" style={s.emptyButton} />
    </Block>
  );
}

// Two cards' worth of breathing parchment while the first list loads, so the board never flashes blank.
function Loading() {
  const o = useSharedValue(0.55);
  useEffect(() => { o.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0.55, { duration: 600 })), -1); }, []);
  const breathe = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <View testID="bounties-loading" accessibilityLabel="Loading bounties">
      {[0, 1].map(i => (
        <View key={i} style={s.slot}>
          <View style={s.ghostPlaque} />
          <Block lift={4} style={[s.card, UNDER_PLAQUE]}>
            <Animated.View style={[s.ghostTag, breathe]} />
            <Animated.View style={[s.ghostLine, { width: "85%" }, breathe]} />
            <Animated.View style={[s.ghostLine, { width: "60%" }, breathe]} />
            <Animated.View style={[s.ghostReward, breathe]} />
            <Animated.View style={[s.ghostButton, breathe]} />
          </Block>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: DEEP },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 32 },
  slot: { marginTop: 14 },
  card: { padding: 14, paddingBottom: 18, gap: 10 },
  tags: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  mode: { borderWidth: 2, borderColor: INK, paddingHorizontal: 7, paddingVertical: 1 },
  modeText: { color: "#fff", fontSize: 15, fontFamily: FONT.bold },
  pregen: {
    flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E8DCFF", borderWidth: 2, borderColor: INK,
    borderStyle: "dashed", paddingHorizontal: 7, paddingVertical: 1, flexShrink: 1,
  },
  pregenText: { color: INK, fontSize: 15, fontFamily: FONT.bold, flexShrink: 1 },
  tagIcon: { width: 18, height: 18 },
  title: { color: PARCH.ink, fontSize: 23, fontFamily: FONT.bold, lineHeight: 25 },
  reward: { height: 40, justifyContent: "center" },
  rewardBar: {
    marginLeft: 16, paddingLeft: 26, paddingRight: 12, height: 36, justifyContent: "center",
    backgroundColor: NIGHT, borderWidth: 2, borderColor: INK,
  },
  rewardCoin: { position: "absolute", left: 0, width: 38, height: 38 },
  stats: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  stat: {
    flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: PARCH.top, borderWidth: 2,
    borderColor: PARCH.bottom, paddingHorizontal: 7, paddingVertical: 2, maxWidth: "100%",
  },
  statText: { color: PARCH.ink, fontSize: 16, fontFamily: FONT.semi, flexShrink: 1 },
  makes: { backgroundColor: PARCH.top, borderLeftWidth: 4, borderLeftColor: "#F07A2A", paddingHorizontal: 10, paddingVertical: 6 },
  makesHead: { color: "#B04A10", fontSize: 13, fontFamily: FONT.bold, letterSpacing: 0.5 },
  makesText: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.semi, lineHeight: 21 },
  take: { marginTop: 4 },
  swipe: { alignSelf: "flex-start" },
  failed: { color: "#8A3A32", fontSize: 16, fontFamily: FONT.semi },
  takenWrap: { gap: 8, marginTop: 2 },
  takenRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stamp: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 8, paddingRight: 10, paddingVertical: 4 },
  stampIcon: { width: 22, height: 22 },
  progress: { flex: 1, gap: 4 },
  progressText: { color: PARCH.ink, fontSize: 18, fontFamily: FONT.bold },
  blocks: { flexDirection: "row", gap: 3 },
  block: { flex: 1, maxWidth: 18, height: 12, backgroundColor: PARCH.bottom, borderWidth: 2, borderColor: INK },
  blockLit: { backgroundColor: "#5BC44A" },
  bar: { height: 12, backgroundColor: PARCH.bottom, borderWidth: 2, borderColor: INK, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#5BC44A" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  linkIcon: { width: 20, height: 20 },
  link: { color: "#B04A10", fontSize: 17, fontFamily: FONT.bold, textDecorationLine: "underline" },
  pressed: { opacity: 0.6 },
  demo: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
  demoTag: { backgroundColor: GOLD, borderWidth: 2, borderColor: INK, paddingHorizontal: 5 },
  demoTagText: { color: INK, fontSize: 13, fontFamily: FONT.bold },
  demoText: {
    color: FOAM, fontSize: 15, fontFamily: FONT.semi, flexShrink: 1,
    textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0,
  },
  footnote: {
    alignSelf: "center", color: FOAM, fontSize: 14, fontFamily: FONT.semi, marginTop: 16, textAlign: "center",
    lineHeight: 18, textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0,
  },
  empty: { marginTop: 18, alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  portrait: { marginBottom: 10 },
  emptyTitle: { color: PARCH.ink, fontSize: 23, fontFamily: FONT.bold, textAlign: "center" },
  emptyBody: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.semi, textAlign: "center", lineHeight: 22, marginTop: 6 },
  emptyButton: { alignSelf: "stretch", marginTop: 16 },
  ghostPlaque: {
    alignSelf: "flex-start", marginLeft: 22, marginBottom: -16, zIndex: 2, width: 140, height: 30,
    backgroundColor: "#3A2618", borderWidth: 3, borderColor: INK,
  },
  ghostTag: { width: 90, height: 20, backgroundColor: PARCH.bottom },
  ghostLine: { height: 18, backgroundColor: PARCH.bottom },
  ghostReward: { width: 180, height: 36, backgroundColor: PARCH.bottom },
  ghostButton: { height: 56, backgroundColor: PARCH.bottom, marginTop: 4 },
});
