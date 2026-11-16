import { useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useAudioPlayer } from "expo-audio";
import { router, useIsFocused } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { ICON } from "./Hud";
import { Outlined, Plaque, Sea, UNDER_PLAQUE, WoodHeader } from "./pixel";
import { Badge, Button, Card, COLOR, DEEP, DemoNote, EmptyState, FONT, INK, PARCH, POP, TierBadge, feel } from "./ui";

// T2's list adds the bounty's campaign page and its demo library's progress. They are optional here so the board still
// draws from a list without them.
type Bounty = FunctionReturnType<typeof api.bounties.list>[number] & Partial<{
  pregenerated: boolean;
  progress: { ready: number; total: number };
  url: string;
}>;

// Bounties seen locked on this board, kept across tab visits so a card that unlocked while the user was on You still
// plays its unlock when they come back.
const seenLocked = new Set<string>();
const UNLOCK_MS = 3500;

// "$4 / 1K views" as a big "$4" and a small "/1K"; "$5 per approved post" as "$5" and "/post". Null when the bounty has
// no amount yet ("Paid per 1K views"), so the card shows the label as is.
function rewardParts(label: string) {
  const m = /^(\$[\d.,]+) (?:\/ 1K views|(per approved post))$/.exec(label);
  return m ? { amount: m[1], unit: m[2] ? "/post" : "/1K", perK: !m[2] } : null;
}
const rateOf = (b: Bounty) => {
  const r = rewardParts(b.rewardLabel);
  return r?.perK ? parseFloat(r.amount.slice(1).replace(/,/g, "")) : 0;
};

// The bounty board: real paid campaigns as game cards, each one brand, one big rate and Take. Higher-paying bounties
// open as the user's taste score reaches their tier; Whop still pays every bounty directly. Take marks a bounty yours
// and drops its pregenerated videos into the Feed.
export function Bounties({ device }: { device: string }) {
  const list = useQuery(api.bounties.list, { deviceId: device }) as Bounty[] | undefined;
  const summary = useQuery(api.earnings.summary, { deviceId: device });
  const focused = useIsFocused();
  // Take shows as taken the moment it's tapped, and Convex rolls it back if the mutation fails.
  const take = useMutation(api.bounties.take).withOptimisticUpdate((store, { deviceId, bountyId }) => {
    const cur = store.getQuery(api.bounties.list, { deviceId });
    if (cur) store.setQuery(api.bounties.list, { deviceId }, cur.map(b => b.id === bountyId ? { ...b, taken: true } : b));
  });
  const [failed, setFailed] = useState<{ id: Id<"bounties">; text: string } | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const star = useAudioPlayer(require("../assets/sounds/star.wav"));

  useEffect(() => {
    if (!list || !focused) return;
    const fresh = list.filter(b => !b.locked && seenLocked.has(b.id)).map(b => b.id as string);
    for (const b of list) b.locked ? seenLocked.add(b.id) : seenLocked.delete(b.id);
    if (!fresh.length) return;
    feel("success");
    setUnlocked(cur => new Set([...cur, ...fresh]));
    setTimeout(() => setUnlocked(cur => new Set([...cur].filter(id => !fresh.includes(id)))), UNLOCK_MS);
  }, [list, focused]);

  const onTake = (b: Bounty) => {
    setFailed(null);
    take({ deviceId: device, bountyId: b.id }).then(() => {
      star.seekTo(0).catch(() => {});
      star.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, (e: unknown) => {
      setFailed({ id: b.id, text: e instanceof ConvexError && typeof e.data === "string" ? e.data : "Didn't go through. Try again." });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    });
  };

  // Taken first, then the best open bounty, then the best locked one so the next tier is in view, then the rest.
  const byRate = (a: Bounty, b: Bounty) => rateOf(b) - rateOf(a);
  const open = (list ?? []).filter(b => !b.taken && !b.locked).sort(byRate);
  const locked = (list ?? []).filter(b => !b.taken && b.locked).sort(byRate);
  const ordered = [...(list ?? []).filter(b => b.taken), ...open.slice(0, 1), ...locked.slice(0, 1), ...open.slice(1), ...locked.slice(1)];

  const taken = list?.filter(b => b.taken).length ?? 0;
  const sub = !list ? "Checking the board…"
    : list.length === 0 ? "No campaigns right now"
    : taken > 0 ? `${taken} taken · ${open.length} more open`
    : "Take one to fill your Feed";

  return (
    <View style={s.fill}>
      <Sea />
      <WoodHeader title="BOUNTIES" sub={sub} subID="bounties-sub"
        right={summary ? <View style={s.headerTier}><TierBadge score={summary.taste.score ?? 0} size="sm" testID="bounties-tier" /></View> : undefined} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} testID="bounties">
        {!list ? (
          <View testID="bounties-loading">
            {[0, 1].map(i => <View key={i} style={s.slot}><Card loading /></View>)}
          </View>
        ) : list.length === 0 ? (
          <View style={s.slot}>
            <EmptyState who="courier" title="The board is empty" testID="bounties-empty"
              body="New campaigns land here as the board refreshes."
              action={{ label: "Back to Base", onPress: () => router.navigate("/"), testID: "bounties-empty-base" }} />
          </View>
        ) : ordered.map(b => (
          <BountyCard key={b.id} b={b} failed={failed?.id === b.id ? failed.text : null}
            unlocked={unlocked.has(b.id)} onTake={() => onTake(b)} />
        ))}
        {list && list.length > 0 ? <DemoNote style={s.demo} /> : null}
      </ScrollView>
    </View>
  );
}

// One plaque (the brand) and one row: the rate on the left half, Take on the right. Under it one soft line, the
// campaign title, that opens the details (mode, budget, spots, campaign page). A locked card fades and puts its tier
// where Take would be.
function BountyCard({ b, failed, unlocked, onTake }:
  { b: Bounty; failed: string | null; unlocked: boolean; onTake: () => void }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(hintTimer.current), []);
  const showHint = () => {
    feel("tap");
    setHint(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(false), 3000);
  };

  const flash = useSharedValue(0);
  const pop = useSharedValue(1);
  const lockY = useSharedValue(0);
  const lockOn = useSharedValue(0);
  useEffect(() => {
    if (!unlocked) return;
    flash.value = withSequence(withTiming(0.8, { duration: 120 }), withTiming(0, { duration: 260 }), withTiming(0.6, { duration: 120 }), withTiming(0, { duration: 420 }));
    pop.value = withSequence(withTiming(1.04, { duration: 140 }), withSpring(1, POP));
    lockOn.value = 1;
    lockY.value = 0;
    lockY.value = withDelay(120, withTiming(1, { duration: 700 }));
    lockOn.value = withDelay(120, withTiming(0, { duration: 700 }));
  }, [unlocked]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const lockStyle = useAnimatedStyle(() => ({
    opacity: lockOn.value,
    transform: [{ translateY: -46 * lockY.value }, { rotate: `${28 * lockY.value}deg` }, { scale: 1 + 0.3 * lockY.value }],
  }));

  const reward = rewardParts(b.rewardLabel);
  const made = b.pregenerated && b.progress && b.progress.total > 0 ? b.progress.total : 0;
  const need = `Reach ${b.tier.name} (${b.tier.min}) to take this`;
  // The one line under the row: whatever matters most right now, so nothing stacks.
  const line = failed ? <Text style={[s.line, s.failed]} numberOfLines={2} testID={`bounty-failed-${b.id}`}>{failed}</Text>
    : unlocked ? <Badge label={`UNLOCKED · ${b.tier.name.toUpperCase()}`} tone="gold" icon="star" testID={`bounty-unlocked-${b.id}`} />
    : hint ? <Text style={[s.line, s.hint]} numberOfLines={1} testID={`bounty-hint-${b.id}`}>{need}</Text>
    : (
      <Pressable onPress={() => { feel("tap"); setOpen(o => !o); }} hitSlop={8} accessibilityRole="button"
        accessibilityLabel={open ? "Hide details" : `Details: ${b.title}`} testID={`bounty-details-${b.id}`}>
        {({ pressed }) => (
          <View style={[s.metaRow, pressed && s.pressed]}>
            <Text style={s.chev}>{open ? "▾" : "▸"}</Text>
            <Text style={s.line} numberOfLines={open ? 3 : 1}>{b.title}</Text>
          </View>
        )}
      </Pressable>
    );

  return (
    <Animated.View layout={LinearTransition.springify().damping(16)} entering={FadeIn.duration(220)} style={s.slot}>
      <Animated.View style={popStyle}>
        <Plaque title={b.brand} style={s.plaque} />
        <Card style={[UNDER_PLAQUE, s.card, b.locked && s.lockedCard]} testID={`bounty-card-${b.id}`}>
          <View style={s.row}>
            <View style={[s.half, b.locked && s.muted]} accessible accessibilityLabel={`Reward ${b.rewardLabel}`} testID={`bounty-reward-${b.id}`}>
              <View style={s.rewardBar}>
                {reward ? (
                  <View style={s.amountRow}>
                    <Outlined size={26} color={COLOR.gold}>{reward.amount}</Outlined>
                    <Text style={s.unit}>{reward.unit}</Text>
                  </View>
                ) : <Text style={s.unit} numberOfLines={1}>{b.rewardLabel}</Text>}
              </View>
              <Image source={ICON.coin} style={s.rewardCoin} />
            </View>
            <View style={s.half}>
              {b.taken ? (
                <View style={s.takenPlate} testID={`bounty-taken-${b.id}`} accessible accessibilityLabel="Taken">
                  <Image source={ICON.check} style={s.plateIcon} />
                  <Outlined size={18}>TAKEN</Outlined>
                </View>
              ) : b.locked ? (
                <Pressable onPress={showHint} accessibilityRole="button" accessibilityLabel={need} testID={`bounty-locked-${b.id}`}>
                  {({ pressed }) => (
                    <View style={[s.lockPlate, pressed && s.pressed]}>
                      <Image source={ICON.lock} style={s.plateIcon} />
                      <Outlined size={16}>{b.tier.name.toUpperCase()}</Outlined>
                    </View>
                  )}
                </Pressable>
              ) : (
                <Button label="TAKE" bevel="green" size="md" feel="commit" onPress={onTake} testID={`bounty-take-${b.id}`}
                  accessibilityLabel={`Take ${b.brand}: ${b.title}`} />
              )}
              {unlocked ? (
                <Animated.View pointerEvents="none" style={[s.flyingLock, lockStyle]}>
                  <Image source={ICON.lock} style={s.flyingLockIcon} />
                </Animated.View>
              ) : null}
            </View>
          </View>

          {line}

          {open && !failed && !hint && !unlocked ? (
            <View style={s.details}>
              <View style={s.detailRow}>
                <Text style={s.detail} testID={`bounty-mode-${b.id}`}>{b.mode === "clip" ? "Clip" : "Original"}</Text>
                {b.budgetLabel ? <Text style={s.detail} testID={`bounty-budget-${b.id}`}>{`· ${b.budgetLabel}`}</Text> : null}
                {b.spotsLabel ? <Text style={s.detail} testID={`bounty-spots-${b.id}`}>{`· ${b.spotsLabel}`}</Text> : null}
                {made > 0 && !b.taken ? <Text style={s.detail} testID={`bounty-pregenerated-${b.id}`}>{`· ${made} made`}</Text> : null}
              </View>
              {b.url ? (
                <Pressable onPress={() => { feel("tap"); WebBrowser.openBrowserAsync(b.url!).catch(() => {}); }} hitSlop={10} style={s.linkWrap}
                  accessibilityRole="link" accessibilityLabel={`Open the ${b.brand} campaign page`} testID={`bounty-link-${b.id}`}>
                  {({ pressed }) => (
                    <View style={[s.linkRow, pressed && s.pressed]}>
                      <Image source={ICON.glass} style={s.linkIcon} />
                      <Text style={s.link}>Campaign page</Text>
                    </View>
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {b.taken ? <SwipeThem b={b} /> : null}
        </Card>
        <Animated.View pointerEvents="none" style={[s.flash, flashStyle]} />
      </Animated.View>
    </Animated.View>
  );
}

// After Take: one full-width button to the Feed that also says how many of the bounty's videos have landed.
function SwipeThem({ b }: { b: Bounty }) {
  const p = b.progress;
  const label = !p || p.total === 0 ? "Open Feed"
    : p.ready >= p.total ? `Swipe all ${p.total}`
    : `Swipe them · ${p.ready} of ${p.total} ready`;
  return (
    <View testID={`bounty-progress-${b.id}`} accessible={false}>
      <Button label={label} size="md" onPress={() => router.navigate("/feed")} testID={`bounty-feed-${b.id}`} />
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: DEEP },
  scroll: { flex: 1 },
  headerTier: { alignSelf: "center" },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  slot: { marginTop: 16 },
  plaque: { marginLeft: 0 },
  card: { gap: 12 },
  lockedCard: { backgroundColor: "#DDD3C0" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  half: { flex: 1, justifyContent: "center" },
  muted: { opacity: 0.5 },
  rewardBar: {
    marginLeft: 18, paddingLeft: 26, paddingRight: 8, height: 48, justifyContent: "center",
    backgroundColor: COLOR.night, borderWidth: 2, borderColor: INK,
  },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  unit: { color: COLOR.foam, fontSize: 18, fontFamily: FONT.bold },
  rewardCoin: { position: "absolute", left: 0, width: 42, height: 42 },
  takenPlate: {
    height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: COLOR.greenDeep, borderWidth: 2, borderColor: INK,
  },
  lockPlate: {
    height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: COLOR.slate, borderWidth: 2, borderColor: INK,
  },
  plateIcon: { width: 22, height: 22 },
  flyingLock: { position: "absolute", alignSelf: "center", top: 9 },
  flyingLockIcon: { width: 30, height: 30 },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  chev: { color: PARCH.soft, fontSize: 16, lineHeight: 20, width: 12 },
  line: { color: PARCH.soft, fontSize: 16, lineHeight: 20, fontFamily: FONT.semi, flexShrink: 1 },
  hint: { color: PARCH.ink },
  failed: { color: COLOR.redDeep },
  details: { gap: 8, paddingLeft: 18 },
  detailRow: { flexDirection: "row", flexWrap: "wrap", columnGap: 6 },
  detail: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi },
  linkWrap: { alignSelf: "flex-start" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  linkIcon: { width: 20, height: 20 },
  link: { color: COLOR.orangeDeep, fontSize: 17, fontFamily: FONT.bold, textDecorationLine: "underline" },
  pressed: { opacity: 0.6 },
  flash: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: COLOR.gold },
  demo: { marginTop: 24 },
});
