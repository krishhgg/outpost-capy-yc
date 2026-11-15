import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useAudioPlayer } from "expo-audio";
import { Link, router, useFocusEffect, useIsFocused } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { useClock } from "./Feed";
import { compact, localDay, MILESTONES } from "./You";
import { Agent, type Pt, type Who } from "./Agents";
import { Block, DEEP, FONT, INK, Outlined, PARCH, PixelButton, POP, WOOD, WoodHeader } from "./pixel";
import { Bubble, Counter, ICON } from "./Hud";
import { useAwayUp, usePending } from "./collect";
import { Ambient } from "./Ambient";
import { click } from "./click";
import LAYOUT from "../assets/base/layout.json";

// The village is one pixel-art picture (art/village.py), drawn edge to edge. Everything placed on it comes from
// layout.json as fractions of the picture, so labels and agents land on the same roads and doors at any width.
const { width: W } = Dimensions.get("window");
const ART_W = W;
const ART_H = Math.round((W * LAYOUT.h) / LAYOUT.w);
const PX = W / LAYOUT.w; // one art pixel, in points
const at = ([x, y]: number[]): Pt => ({ x: x * ART_W, y: y * ART_H });
const SPOT = Object.fromEntries(Object.entries(LAYOUT.spots).map(([k, v]) => [k, at(v)])) as Record<keyof typeof LAYOUT.spots, Pt>;
// Where idle agents wait by the campfire, in art pixels measured from village.png: outside the two lanterns, and on
// the road just below the fire. `face` turns each one toward it.
const CAMP = {
  writer: { x: 75, y: 99, face: 1 },
  director: { x: 118, y: 99, face: -1 },
  courier: { x: 91, y: 117, face: 1 },
  merchant: { x: 102, y: 117, face: -1 },
} as const;
// Where the Merchant stands while the shop runs: one sprite (10 art pixels) right of the road's end, at the stall's front
// corner.
const STALL = { x: SPOT.shop.x + 10 * PX, y: SPOT.shop.y };
// Where the Director works while the Studio plate shows its step: the plate grows up over the spot at the door, so the
// Director stands 18 art pixels left, at the road's edge beside the plate.
const ASIDE = { x: SPOT.director.x - 18 * PX, y: SPOT.director.y };
const camp = (who: keyof typeof CAMP, home: Pt) =>
  ({ path: [home, { x: CAMP[who].x * PX, y: CAMP[who].y * PX }], face: CAMP[who].face });
// The sea below the picture steps down to deep water in flat bands, the pixel version of a gradient.
const BANDS = [0.2, 0.4, 0.6, 0.8].map(t => mix(LAYOUT.sea, DEEP, t));
const money = (c: number) => `$${(c / 100).toFixed(2)}`;
// Set once an agent has called out on its own, so it happens once per app session, not on every visit to the Base.
let spoke = false;

function mix(a: string, b: string, t: number) {
  const n = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return "#" + [0, 1, 2].map(i => Math.round(n(a, i) * (1 - t) + n(b, i) * t).toString(16).padStart(2, "0")).join("");
}

type Mine = FunctionReturnType<typeof api.raids.mine>;
type Raid = NonNullable<Mine["raid"]>;

export function Base({ device }: { device: string }) {
  const mine = useQuery(api.raids.mine, { deviceId: device });
  const status = useQuery(api.feed.status, { deviceId: device });
  const now = useClock(5000);
  const you = useQuery(api.you.summary, { deviceId: device, phoneDay: localDay(now) });
  const find = useQuery(api.scout.next, { deviceId: device });
  const scroll = useRef<ScrollViewInstance>(null);
  const watch = useMutation(api.raids.watch);
  const [picking, setPicking] = useState(false);
  // True while the store is open in the in-app browser. A sale made there waits for it to close, so its star, chime and
  // banner happen in view instead of under the browser.
  const [browsing, setBrowsing] = useState(false);
  const raid = mine?.raid ?? null;
  const live = raid?.status === "live";

  // While the Base is on screen, Convex checks Whop for new payments every few seconds.
  useFocusEffect(useCallback(() => {
    if (!live) return;
    const ping = () => watch({ deviceId: device }).catch(() => {});
    ping();
    const t = setInterval(ping, 4 * 60_000);
    return () => clearInterval(t);
  }, [device, live]));

  const stages = status?.studio.stages ?? [];
  // The studio claims a job as "writing script", then voices, renders and uploads it.
  const writing = stages.some(st => st === "writing script" || st === "starting");
  const directing = stages.some(st => st !== "writing script" && st !== "starting");
  // Posts waiting for their slot are "held". Counting only the minute around the slot skips a paused queue's old rows.
  const posting = !!status?.sending.some(p =>
    p.status === "publishing" || p.status === "queued" || (p.status === "held" && Math.abs(p.slotAt - now) <= 60_000));
  const asleep = !!status && now - status.studio.lastSeen > 25_000;
  const online = !!status && !asleep;
  const ready = status?.studio.ready ?? 0;
  // A plate that sits under a bubble shows only its name, so a count isn't said twice.
  const studio = !status ? "…" : asleep ? "Asleep" : directing ? "Making a video" : ready > 0 ? "" : "Idle";
  const post = !status ? "…" : status.views > 0 ? `${compact(status.views)} views`
    : status.mode === "dryRun" ? "Dry run" : status.mode === "private" ? "Private test" : "Live";
  // The Vault shows real money. With only test sales it shows the raid's test total, the same figure as the raid card.
  const testOnly = !!mine && mine.vault.earnedCents === 0 && !!raid?.test && raid.netCents > 0;
  const vaultCents = !mine ? 0 : testOnly ? raid!.netCents : mine.vault.earnedCents;
  const vault = !mine ? "…" : testOnly ? `${money(vaultCents)} · test` : `${money(vaultCents)} earned`;
  // The counters hold back what the Away card is giving until its loot lands in them.
  const loot = usePending();
  const shownViews = Math.max(0, (status?.views ?? 0) - loot.views);
  const shownCents = Math.max(0, vaultCents - loot.cents);

  // A tapped agent says what it is doing, from the same data the plates show. One speaks at a time, for a few seconds.
  const [talk, setTalk] = useState<Who | null>(null);
  useEffect(() => {
    if (!talk) return;
    const t = setTimeout(() => setTalk(null), 4500);
    return () => clearTimeout(t);
  }, [talk]);
  const talkTo = (who: Who) => () => {
    click();
    Haptics.selectionAsync().catch(() => {});
    setTalk(t => (t === who ? null : who));
  };
  // Once a session, a moment after the Base settles with the Away card gone, the agent with news says it unprompted,
  // the way a game's villagers call out. Newest kind of news first: a find, then videos to review, then views, then sales.
  const awayUp = useAwayUp();
  const news: Who | null = !online ? null : find ? "writer" : ready > 0 ? "director"
    : status && status.views > 0 ? "courier" : raid && raid.sales > 0 ? "merchant" : null;
  useFocusEffect(useCallback(() => {
    if (spoke || awayUp || !news) return;
    const t = setTimeout(() => { spoke = true; setTalk(news); }, 1500);
    return () => clearTimeout(t);
  }, [awayUp, news]));
  const asleepLine = "Asleep. Open the studio laptop to wake us up.";
  const stage = stages.find(st => st !== "writing script" && st !== "starting");
  // How far the furthest-along video has got past its script: 1 voicing, 2 rendering, 3 uploading. The Scout's plate
  // already says when a script is being written, so the Studio's pips start once a video reaches it.
  const step = online && directing ? Math.max(-1, ...stages.map(st => STEPS.indexOf(st))) : -1;
  // News comes before work in each sentence, since tapping the bubble goes to the news. The job tag still shows the work.
  const says: Record<Who, string> = {
    writer: !online ? asleepLine : find ? "I found a product to sell. Tap to see it." : writing ? "Writing your next script."
      : "Waiting for the next idea.",
    director: !online ? asleepLine
      : ready > 0 ? `${ready} video${ready === 1 ? "" : "s"} ready for you to review.`
      : stage === "voicing" ? "Recording the voiceover."
      : stage === "rendering" ? "Rendering the video."
      : stage === "uploading" ? "Uploading the finished video."
      : directing ? "Making a video." : "Waiting for a script.",
    courier: status?.mode === "dryRun" ? "Dry run. I skip the upload, so nothing posts."
      : posting ? "Posting your video to YouTube and Instagram."
      : status && status.views > 0 ? `${compact(status.views)} views on your posts so far.`
      : status?.mode === "private" ? "Posting privately while you test." : "Waiting for a video you approve.",
    merchant: !raid ? "No shop yet. Tap to open one on Whop."
      : raid.status === "setting_up" ? "Setting up your shop on Whop."
      : raid.status === "failed" ? "The shop didn't open. Try the raid again."
      : `Shop is open. ${raid.sales} sale${raid.sales === 1 ? "" : "s"} so far.`,
  };

  const toFeed = () => router.navigate("/feed");
  const toRaid = () => scroll.current?.scrollToEnd({ animated: true });
  // The money goes to the raid that makes it: its card when one runs, the raid picker when none does.
  const toVault = () => raid ? toRaid() : setPicking(true);
  const toYou = () => router.navigate("/you");
  const toFind = () => router.navigate({ pathname: "/feed", params: { find: String(Date.now()) } });
  // Tapping a speech bubble goes where its sentence points.
  const go = (to?: () => void) => to && (() => { click(); setTalk(null); to(); });
  const goes: Record<Who, (() => void) | undefined> = {
    writer: go(online && find ? toFind : undefined),
    director: go(online && ready > 0 ? toFeed : undefined),
    courier: go(toYou),
    merchant: go(raid ? toRaid : () => setPicking(true)),
  };
  // The job tag over a working agent, from the same status that sends it to its building.
  const doing: Record<Who, string | undefined> = {
    writer: "writing",
    director: step >= 1 ? undefined : "making", // the Studio plate names the step
    courier: "posting",
    merchant: undefined, // the Shop plate under the stall says it's selling, and a tag would cross the camp on each walk
  };

  // The header stays put while the village and the raid scroll under it, the way a game pins its resource bar.
  return (
    <View style={s.screen}>
      <WoodHeader title="" left={
        <View style={s.counters}>
          <Counter icon={you?.todayDone ? "flame" : "flameoff"} value={you ? String(you.streak) : "…"} testID="hud-streak" onPress={toYou}
            label={you ? `${you.streak} day streak${you.todayDone ? ", kept today" : ", not kept today yet"}` : "Streak loading"} />
          <Counter icon="eye" value={status ? compact(shownViews) : "…"} testID="hud-views" onPress={toYou}
            label={status ? `${shownViews} views` : "Views loading"} />
          <Counter icon="coin" value={mine ? money(shownCents) : "…"} tag={testOnly ? "test" : undefined} testID="hud-vault" onPress={toVault}
            label={mine ? `${money(shownCents)}${testOnly ? " in test sales" : " earned"}` : "Vault loading"} />
        </View>
      } right={
        <Link href="/hood" asChild>
          <Pressable hitSlop={8} onPressIn={click} testID="hood-open" accessibilityRole="button" accessibilityLabel="Under the hood">
            {({ pressed }) => (
              <Block bevel="slate" depth={pressed ? 1 : 3} lift={pressed ? 0 : 3}
                style={[s.hoodBtn, pressed && { transform: [{ translateX: 3 }, { translateY: 3 }] }]}>
                <Image source={ICON.gear} style={s.hoodIcon} />
                {/* Under 400 pt the three counters need the room, so Hood keeps only its gear. */}
                {W >= 400 && <Text style={s.hoodText}>Hood</Text>}
              </Block>
            )}
          </Pressable>
        </Link>
      } />
    <ScrollView ref={scroll} style={s.fill} bounces={false} showsVerticalScrollIndicator={false}>
      <View style={{ width: ART_W, height: ART_H }} testID="base-map">
        <Image source={require("../assets/base/village.png")} style={{ width: ART_W, height: ART_H }} />
        <Ambient px={PX} smoking={!asleep && stages.length > 0} lit={status ? online : undefined} />
        {/* Mounted once the raid has loaded, so a sale it already had doesn't replay the first-sale moment. */}
        {mine && <Shop raid={raid} held={browsing} />}
        <Plate name="Scout" label={writing ? "Writing a script" : find ? "" : "Idle"} accent="#7FF2E4" onPress={toFeed} />
        <Plate name="Studio" label={step >= 1 ? STEP_WORDS[step] : studio} accent="#FFB766" pips={step >= 1 ? step : -1} onPress={toFeed} up />
        <Plate name="Post" label={post} accent="#9CC4FF" onPress={toYou} />
        <Plate name="Vault" label={vault} accent="#FFD65C" onPress={toVault} />
        {/* With the studio online, an agent with nothing to do waits at the campfire. Offline, they doze at their posts, and the
            laptop pair stop work even if the studio left a stage behind; posting and the shop run in the cloud, so those two keep going. */}
        <Agent testID="agent-writer" who="writer" px={PX} working={online && writing} route={[SPOT.scout, SPOT.x7, SPOT.studio]}
          rest={online ? camp("writer", SPOT.scout) : undefined} say={says.writer} talking={talk === "writer"} onTalk={talkTo("writer")}
          onGo={goes.writer} doing={doing.writer} />
        <Agent testID="agent-director" who="director" px={PX} working={online && directing} route={[step >= 1 ? ASIDE : SPOT.director]}
          rest={online ? camp("director", SPOT.director) : undefined} say={says.director} talking={talk === "director"}
          onTalk={talkTo("director")} onGo={goes.director} doing={doing.director} />
        <Agent testID="agent-courier" who="courier" px={PX} working={posting}
          route={[SPOT.post, SPOT.x0, SPOT.campLo, SPOT.campHi, SPOT.x7, SPOT.studio]}
          rest={online ? camp("courier", SPOT.post) : undefined} say={says.courier} talking={talk === "courier"} onTalk={talkTo("courier")}
          onGo={goes.courier} doing={doing.courier} />
        <Agent testID="agent-merchant" who="merchant" px={PX} working={live} route={[SPOT.vault, SPOT.x0, SPOT.shopVia, SPOT.shop, STALL]}
          rest={online ? camp("merchant", SPOT.vault) : undefined} say={says.merchant} talking={talk === "merchant"}
          onTalk={talkTo("merchant")} onGo={goes.merchant} doing={doing.merchant} />
        {/* Bubbles over buildings that have something for you, the way a game shows what's ready to collect. They step
            aside while an agent is talking, so only one bubble speaks at a time. */}
        {!talk && (
          <Animated.View style={StyleSheet.absoluteFill} pointerEvents="box-none" entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
            {ready > 0 && (
              <Bubble icon="play" text={String(ready)} {...bubbleAt("Studio")} onPress={toFeed} testID="bubble-studio"
                label={`${ready} videos ready. Open the feed`} />
            )}
            {find && (
              <Bubble icon="glass" text="New" {...bubbleAt("Scout")} testID="bubble-scout" label="The Scout found a product. Open it"
                onPress={toFind} />
            )}
          </Animated.View>
        )}
      </View>

      <View style={s.sea}>
        {BANDS.map((c, i) => <View key={c} style={[s.band, { top: i * 10, backgroundColor: c }]} />)}
        <View style={[s.band, { top: 0, height: 10, backgroundColor: LAYOUT.sea }]} />
        {/* One clear next thing to do: review what's ready. Starting a raid sits beside it until one is running. */}
        <View style={s.actions}>
          {ready > 0 && (
            <Action label={`REVIEW ${ready}`} bevel="green" grow={raid ? 1 : 1.25}
              sub={you && !you.todayDone ? (you.streak === 0 ? "Post 1 to start a streak"
                : MILESTONES.includes(you.streak + 1) ? `Reach a ${you.streak + 1}-day streak` : `Keep your ${you.streak}-day streak`)
                : status?.mode === "dryRun" ? "Dry run · nothing posts"
                : status?.mode === "private" ? "Swipe right to post privately" : "Swipe right to post"}
              pulse onPress={toFeed} testID="review-button" />
          )}
          {!raid && <Action label="RAID" sub="Open a shop on Whop" bevel="gold" grow={1} onPress={() => setPicking(true)} testID="raid-button" />}
        </View>
        {raid && <RaidCard device={device} raid={raid} held={browsing} onBrowse={setBrowsing} />}
      </View>

      <Modal visible={picking} transparent animationType="slide" onRequestClose={() => setPicking(false)}>
        <Picker device={device} onClose={() => setPicking(false)} />
      </Modal>
    </ScrollView>
    </View>
  );
}

// A big home-screen button with a line under its label saying what it does. With pulse, it breathes slowly so the eye
// lands on it first, the way a game pulses the button for what's ready.
function Action({ label, sub, bevel, grow, pulse, onPress, testID }:
  { label: string; sub: string; bevel: "green" | "gold"; grow: number; pulse?: boolean; onPress: () => void; testID: string }) {
  const breath = useSharedValue(1);
  useEffect(() => {
    if (!pulse) return;
    const ease = { duration: 750, easing: Easing.inOut(Easing.quad) };
    breath.value = withRepeat(withSequence(withTiming(1.03, ease), withTiming(1, ease)), -1);
    return () => { cancelAnimation(breath); breath.value = 1; };
  }, [pulse]);
  const breathing = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  return (
    <Animated.View style={[{ flex: grow }, breathing]}>
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${label}. ${sub}`}
        onPress={() => { click(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); onPress(); }}>
        {({ pressed }) => (
          <Block bevel={bevel} depth={pressed ? 2 : 5} lift={pressed ? 0 : 4}
            style={[s.action, pressed && { transform: [{ translateX: 4 }, { translateY: 4 }] }]}>
            <Outlined size={30}>{label}</Outlined>
            <Text style={s.actionSub} numberOfLines={1}>{sub}</Text>
          </Block>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Where a building's bubble rests its tail: on the roof, in art pixels measured from village.png. Up there it covers
// roof tiles rather than the windows and walls, and it stays clear of what the agents say on the lawn below.
// The Scout's bubble hangs off the right corner of its tower, so the teal roof that marks the tower stays in view.
const ROOF = { Scout: [68, 33], Studio: [142, 48] } as const;
function bubbleAt(name: keyof typeof ROOF) {
  const [x, y] = ROOF[name];
  return { x: x * PX, y: y * PX };
}
const BUILDING_H = 0.2 * ART_H; // roughly how tall a building stands above its nameplate

// A wooden nameplate under a building: its name, and what it's doing right now (left out when the bubble says it). With onPress, the building above it
// and the plate are one tap target, and the plate squashes when pressed.
// The studio's steps for one video, in order, as `stage` names them, and the word the Studio plate shows for each.
const STEPS = ["writing script", "voicing", "rendering", "uploading"];
const STEP_WORDS = ["Writing", "Voicing", "Rendering", "Uploading"];

// One step of the video in work on the Studio plate, like a game's build bar: done steps are gold, the current one
// pulses, the rest are dark.
function Pip({ state }: { state: "done" | "now" | "todo" }) {
  const glow = useSharedValue(1);
  useEffect(() => {
    glow.value = state === "now" ? withRepeat(withSequence(withTiming(0.35, { duration: 450 }), withTiming(1, { duration: 450 })), -1)
      : withTiming(1, { duration: 0 });
  }, [state]);
  const style = useAnimatedStyle(() => ({ opacity: glow.value }));
  return <Animated.View style={[s.pip, state === "done" && s.pipLit, state === "now" && s.pipNow, style]} />;
}

const ROW_H = 18; // a plate's second row: the label's line height, taller than the pips beside it

// With `up`, a plate's second row grows it upward instead of down, so its bottom edge stays where the name alone puts it.
// The Studio needs it: the Vault's roof peak sits right under its plate.
function Plate({ name, label, accent, stars, pips = -1, onPress, up }:
  { name: keyof typeof LAYOUT.buildings; label: string; accent: string; stars?: boolean[]; pips?: number; onPress?: () => void;
    up?: boolean }) {
  const at0 = at(LAYOUT.buildings[name].label);
  const p = { x: at0.x, y: at0.y - (up && (label || pips >= 0) ? ROW_H : 0) };
  const plate = (pressed: boolean) => (
    <View style={[s.plate, pressed && { transform: [{ scaleX: 1.08 }, { scaleY: 0.86 }] }]}>
      <View style={s.plateLip} />
      <Text style={s.plateName}>{name}</Text>
      <View style={s.plateRow}>
        {pips >= 0 && (
          <View style={s.pips} testID="studio-pips">
            {STEPS.map((_, i) => <Pip key={i} state={i < pips ? "done" : i === pips ? "now" : "todo"} />)}
          </View>
        )}
        {label ? <Text style={[s.plateLabel, { color: accent }]} numberOfLines={1}>{label}</Text> : null}
        {/* At their drawn size, 22 pt on a 3x screen, so the pixels stay sharp. */}
        {stars?.length ? STAR_ORDER.map(i => <Image key={i} source={stars[i] ? STAR_LIT : STAR_DIM} style={s.plateStar} />) : null}
      </View>
    </View>
  );
  if (!onPress) {
    return (
      <View style={[s.plateWrap, { left: p.x - 90, top: p.y - 13 }]} testID={`building-${name.toLowerCase()}`} pointerEvents="none">
        {plate(false)}
      </View>
    );
  }
  return (
    <Pressable style={[s.plateWrap, s.plateHit, { left: p.x - 90, top: p.y - 13 - BUILDING_H, paddingTop: BUILDING_H }]}
      testID={`building-${name.toLowerCase()}`} accessibilityRole="button" accessibilityLabel={label ? `${name}: ${label}` : name}
      onPress={() => { click(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}>
      {({ pressed }) => plate(pressed)}
    </Pressable>
  );
}

// The raid's first sale. `recent` is newest first and holds at most five, so the first sale is its last entry only
// while it holds every sale. Sales made while the store browser was open land together, so this can't be `recent[0]`.
const firstSale = (r: Raid) => r.recent.length > 0 && r.recent.length >= r.sales ? r.recent[r.recent.length - 1] : undefined;

// The Shop is not on the map until the first sale. Then it rises out of the ground.
function Shop({ raid, held }: { raid: Raid | null; held: boolean }) {
  const sold = (raid?.sales ?? 0) > 0;
  const rise = useSharedValue(sold ? 1 : 0);
  const seen = useRef(sold);
  const [banner, setBanner] = useState<string | null>(null);
  useEffect(() => {
    if (held) return; // a sale made in the store browser rises the Shop once the browser closes
    if (sold && !seen.current) {
      rise.value = withSpring(1, { mass: 1, damping: 9, stiffness: 120 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const sale = raid ? firstSale(raid) : undefined;
      setBanner(`First sale${sale ? ` · ${money(sale.grossCents)}` : ""} · the Shop is open`);
      seen.current = true;
    }
    if (!sold) { seen.current = false; rise.value = 0; }
  }, [sold, held]);
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 7000);
    return () => clearTimeout(t);
  }, [banner]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, rise.value * 2),
    transform: [{ translateY: (1 - rise.value) * 40 }],
  }));
  const box = LAYOUT.shop;
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
        <Image source={require("../assets/base/shop.png")}
          style={{ position: "absolute", left: box.x * ART_W, top: box.y * ART_H, width: box.w * ART_W, height: box.h * ART_H }} />
        <Plate name="Shop" label={raid ? `${raid.sales} sale${raid.sales === 1 ? "" : "s"}` : ""} accent="#FF9AD0" stars={raid?.stars} />
      </Animated.View>
      {banner && (
        <Block bevel="gold" lift={4} style={s.banner} testID="first-sale">
          <Outlined size={17} style={{ alignItems: "center" }}>{banner}</Outlined>
        </Block>
      )}
    </>
  );
}

// raid.stars is [halfway, first sale, goal]. They show in the order they light.
const STAR_ORDER = [1, 0, 2];
const STAR_LABELS = ["Halfway", "First sale", "Goal"];
const STEP_SHORT: Record<string, string> = { product: "Product", checkout: "Checkout", alerts: "Sale alerts" };

function Star({ lit, label, i, held, onLight }: { lit: boolean; label: string; i: number; held: boolean; onLight: () => void }) {
  const pop = useSharedValue(1);
  const was = useRef(lit);
  const focused = useIsFocused();
  useEffect(() => {
    // A star that lights while you're on another tab, or in the store browser, pops when you come back.
    if (!focused || held) return;
    if (lit && !was.current) {
      pop.value = withSequence(withTiming(1.7, { duration: 180 }), withSpring(1, POP));
      onLight();
    }
    was.current = lit;
  }, [lit, focused, held]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <View style={s.star} testID={`star-${i}`}>
      <Animated.Image source={lit ? STAR_LIT : STAR_DIM} style={[s.starImg, style]} />
      <Text style={[s.starLabel, lit && { color: PARCH.ink }]}>{label}</Text>
    </View>
  );
}

const STAR_LIT = require("../assets/base/star-lit.png");
const STAR_DIM = require("../assets/base/star-dim.png");

function RaidCard({ device, raid, held, onBrowse }: { device: string; raid: Raid; held: boolean; onBrowse: (open: boolean) => void }) {
  const retry = useMutation(api.raids.retry);
  const chime = useAudioPlayer(require("../assets/sounds/star.wav"));
  const [news, setNews] = useState<string | null>(null);
  useEffect(() => {
    if (!news) return;
    const t = setTimeout(() => setNews(null), 5000);
    return () => clearTimeout(t);
  }, [news]);
  // A star is a real outcome, so it gets a sound, a tap and a line on the card. They fire only when a star lights while
  // you watch. Stars light in render order, so when one sale lights two, the later and bigger one's line stays.
  const light = (i: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    chime.seekTo(0).catch(() => {});
    chime.play();
    const first = firstSale(raid);
    setNews(i === 1 ? `First sale${first ? ` · ${money(first.grossCents)}` : ""}`
      : i === 0 ? `Halfway · ${money(raid.netCents)} of ${money(raid.goalCents)}` : `Goal reached · ${money(raid.netCents)}`);
  };
  const url = raid.offer?.purchaseUrl ?? null;
  const goal = [money(raid.goalCents / 2), "", money(raid.goalCents)];
  const fill = Math.min(1, raid.netCents / raid.goalCents);
  const broken = raid.steps.find(st => st.state === "error");
  const live = raid.status === "live";
  return (
    <Block bevel="parch" lift={4} style={s.card} testID="raid-card">
      {news && (
        <Animated.View entering={ZoomIn.springify().damping(10).mass(1).stiffness(180)} exiting={FadeOut} style={s.news} pointerEvents="none">
          <Block bevel="gold" lift={3} style={s.newsBlock} testID="raid-news"><Outlined size={18}>{news}</Outlined></Block>
        </Animated.View>
      )}
      <View style={s.cardTop}>
        <Text style={s.cardTitle}>{live ? "Your shop" : "Opening a shop"}</Text>
        {raid.test && <View style={s.testChip}><Text style={s.testText}>Whop test mode · test card</Text></View>}
      </View>
      <Text style={s.cardSub}>{raid.offer ? `${raid.offer.title} · ${money(raid.offer.priceCents)}` : ""}</Text>

      <View style={s.stars}>
        {STAR_ORDER.map(i => (
          <Star key={i} i={i} lit={raid.stars[i]} held={held} onLight={() => light(i)}
            label={goal[i] ? `${STAR_LABELS[i]} · ${goal[i]}` : STAR_LABELS[i]} />
        ))}
      </View>

      {/* Money toward the goal, after Whop's fees. The notch is the halfway star. */}
      <View style={s.bar} testID="raid-bar">
        <View style={[s.barFill, { width: `${fill * 100}%` }]}><View style={s.barShine} /></View>
        <View style={s.barNotch} />
      </View>
      <Text style={s.progress} testID="raid-progress">
        {raid.sales === 0 ? `No sales yet · goal ${money(raid.goalCents)}`
          : `${money(raid.netCents)} of ${money(raid.goalCents)} after Whop fees · ${raid.sales} sale${raid.sales === 1 ? "" : "s"}`}
      </Text>

      {/* Setup steps matter until they're all done. After that they'd only take a row. */}
      {!live && <View style={s.steps}>
        {raid.steps.map(st => (
          <View key={st.key} style={s.step} testID={`raid-step-${st.key}`} accessibilityLabel={`${st.label}: ${st.state}${st.note ? `, ${st.note}` : ""}`}>
            <View style={[s.stepBox, { backgroundColor: st.state === "done" ? "#5BC44A" : st.state === "error" ? "#D9442F" : PARCH.bottom }]} />
            <Text style={s.stepLabel}>{STEP_SHORT[st.key] ?? st.label}</Text>
          </View>
        ))}
      </View>}
      {broken?.note ? <Text style={s.stepError} numberOfLines={2}>{broken.note}</Text> : null}

      {raid.steps.some(st => st.state === "error") && (
        <PixelButton label="Try again" bevel="slate" size={17} style={s.retry} onPress={() => retry({ deviceId: device })} testID="raid-retry" />
      )}
      {url && (
        <View style={s.row}>
          {/* Sharing the link is how sales happen, so it's the green one. Opening the store is for looking, or paying with
              Whop's test card in test mode. */}
          <PixelButton label="Share link" bevel="green" size={17} style={s.flex} onPress={() => Share.share({ url, message: url })} testID="checkout-share" />
          <PixelButton label={raid.test ? "Test checkout" : "Open store"} bevel="slate" size={17} style={s.flex}
            onPress={async () => {
              onBrowse(true);
              try { await WebBrowser.openBrowserAsync(url); } finally { onBrowse(false); }
            }} testID="checkout-open" />
        </View>
      )}
    </Block>
  );
}

// The one raid you can start today, and the ones that aren't built yet. The locked ones stay on the sheet so you can
// see where this goes, but small, so the open one is the obvious tap.
const SHOP_GOAL = 2500; // GOAL_CENTS in convex/raids.ts
const LOCKED: { key: string; name: string; why: string }[] = [
  { key: "double", name: "Double down", why: "Coming next" },
  { key: "affiliate", name: "Whop affiliate", why: "Coming next" },
  { key: "rewards", name: "Content Rewards", why: "Manual for now" },
  { key: "drop", name: "Dropshipping", why: "Needs a supplier" },
  { key: "bounties", name: "Whop Bounties", why: "Needs Whop sign-in" },
];

function Picker({ device, onClose }: { device: string; onClose: () => void }) {
  const start = useMutation(api.raids.start);
  const goal = [money(SHOP_GOAL / 2), "", money(SHOP_GOAL)];
  return (
    <View style={s.sheetWrap}>
      <Pressable style={s.fill} onPress={onClose} />
      <Block bevel="parch" style={[s.sheet, { paddingBottom: 40 }]} testID="raid-picker">
        {/* The same wooden board as the Away card, so the picker reads as a game menu, with a close button on it. */}
        <View style={s.pickBoard}>
          <View style={[s.pickGrain, { top: 12 }]} /><View style={[s.pickGrain, { top: 34 }]} />
          <Outlined size={26}>Pick a raid</Outlined>
          <Pressable onPress={() => { click(); onClose(); }} hitSlop={10} testID="raid-picker-close" accessibilityRole="button" accessibilityLabel="Close">
            {({ pressed }) => (
              <Block bevel="orange" depth={pressed ? 1 : 3} style={[s.pickX, pressed && { transform: [{ translateY: 2 }] }]}>
                <Outlined size={20}>X</Outlined>
              </Block>
            )}
          </Pressable>
          <View style={s.pickEdge} />
        </View>
        <View style={s.hero} testID="raid-hero-shop">
          <View style={s.heroTop}>
            <Image source={ICON.coin} style={s.heroIcon} />
            <View style={s.flex}>
              <Text style={s.heroName}>Open a shop</Text>
              <Text style={s.tileLine}>Sell a $9 Notion template through Whop.</Text>
            </View>
          </View>
          <View style={s.stars}>
            {STAR_ORDER.map(i => (
              <View key={i} style={s.star}>
                <Image source={STAR_DIM} style={s.heroStar} />
                <Text style={s.starLabel}>{goal[i] ? `${STAR_LABELS[i]} · ${goal[i]}` : STAR_LABELS[i]}</Text>
              </View>
            ))}
          </View>
          <PixelButton label="Start" bevel="green" size={24} style={s.heroStart} testID="raid-start-shop"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); start({ deviceId: device, kind: "shop" }); onClose(); }} />
        </View>
        <Text style={s.lockedHead}>Locked</Text>
        <View style={s.lockedGrid}>
          {LOCKED.map(r => (
            <View key={r.key} style={s.locked} testID={`raid-locked-${r.key}`} accessible accessibilityLabel={`${r.name}, locked. ${r.why}`}>
              <Image source={ICON.lock} style={s.lockIcon} />
              <View style={s.flex}>
                <Text style={s.lockedName} numberOfLines={1}>{r.name}</Text>
                <Text style={s.lockedWhy} numberOfLines={1}>{r.why}</Text>
              </View>
            </View>
          ))}
        </View>
      </Block>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DEEP },
  fill: { flex: 1 },
  flex: { flex: 1 },
  hoodBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  hoodIcon: { width: 24, height: 24 },
  hoodText: { color: "#fff", fontSize: 18, fontFamily: FONT.bold },
  counters: { flexDirection: "row", gap: 6 },
  actions: { flexDirection: "row", gap: 10 },
  action: { alignItems: "center", paddingTop: 10, paddingBottom: 12, paddingHorizontal: 8 },
  actionSub: { color: INK, fontSize: 16, fontFamily: FONT.semi, marginTop: -2 },
  plateHit: { width: 180 },
  plateWrap: { position: "absolute", width: 180, alignItems: "center" },
  plate: { backgroundColor: "#34221A", borderWidth: 2, borderColor: INK, paddingHorizontal: 9, paddingTop: 3, paddingBottom: 4, alignItems: "center", maxWidth: 176 },
  plateLip: { position: "absolute", left: 0, right: 0, top: 0, height: 2, backgroundColor: WOOD.lip },
  plateName: { color: "#fff", fontSize: 16, lineHeight: 18, fontFamily: FONT.bold },
  plateLabel: { fontSize: 15, lineHeight: ROW_H, fontFamily: FONT.semi, flexShrink: 1 },
  plateRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  plateStar: { width: 22, height: 22 },
  pips: { flexDirection: "row", gap: 3, marginRight: 5 },
  pip: { width: 9, height: 9, borderWidth: 2, borderColor: INK, backgroundColor: "#5A4030" },
  pipLit: { backgroundColor: "#FFC83A" },
  pipNow: { backgroundColor: "#FFF4C4" },
  banner: { position: "absolute", left: 12, right: 12, top: 12, padding: 10, alignItems: "center" },
  sea: { backgroundColor: DEEP, paddingHorizontal: 14, paddingTop: 28, paddingBottom: 36, gap: 14 },
  band: { position: "absolute", left: 0, right: 0, height: 10 },
  card: { padding: 16 },
  news: { position: "absolute", left: 0, right: 0, top: 10, zIndex: 2, alignItems: "center" }, // over the title row; the card clips
  newsBlock: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 9 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { color: PARCH.ink, fontSize: 27, fontFamily: FONT.bold },
  cardSub: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi, marginTop: 4 },
  testChip: { borderColor: "#7A4FD0", borderWidth: 2, paddingHorizontal: 6, paddingVertical: 2 },
  testText: { color: "#7A4FD0", fontSize: 15, fontFamily: FONT.bold },
  stars: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  star: { flex: 1, alignItems: "center" },
  starImg: { width: 44, height: 44 },
  starLabel: { color: "#A88C6E", fontSize: 15, fontFamily: FONT.semi, marginTop: 4, textAlign: "center" },
  bar: { height: 18, marginTop: 14, backgroundColor: PARCH.bottom, borderWidth: 2, borderColor: INK, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#FFC83A", borderRightWidth: 2, borderRightColor: INK },
  barShine: { height: 4, backgroundColor: "#FFE88C" },
  barNotch: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, backgroundColor: INK, opacity: 0.35 },
  progress: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.semi, textAlign: "center", marginTop: 6 },
  steps: { marginTop: 12, flexDirection: "row", justifyContent: "center", gap: 14 },
  step: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBox: { width: 12, height: 12, borderWidth: 2, borderColor: INK },
  stepLabel: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi },
  stepError: { color: "#C0392B", fontSize: 15, fontFamily: FONT.regular, textAlign: "center", marginTop: 6 },
  row: { flexDirection: "row", gap: 10, marginTop: 14 },
  retry: { marginTop: 14 },
  sheetWrap: { flex: 1, backgroundColor: "rgba(20,10,30,0.55)", justifyContent: "flex-end" },
  sheet: { padding: 18, gap: 10, borderBottomWidth: 0 },
  pickBoard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: -18, marginTop: -18,
    marginBottom: 2, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18, backgroundColor: WOOD.base, overflow: "hidden" },
  pickGrain: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: WOOD.grain },
  pickEdge: { position: "absolute", left: 0, right: 0, bottom: 0, height: 6, borderTopWidth: 3, borderTopColor: INK, backgroundColor: WOOD.lip },
  pickX: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  hero: { backgroundColor: PARCH.top, borderWidth: 3, borderColor: INK, borderBottomWidth: 6, padding: 14, gap: 4 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroIcon: { width: 44, height: 44 },
  heroName: { color: PARCH.ink, fontSize: 26, fontFamily: FONT.bold },
  heroStar: { width: 34, height: 34 },
  heroStart: { marginTop: 10 },
  tileLine: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.regular, lineHeight: 21 },
  lockedHead: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.bold, marginTop: 6 },
  lockedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  locked: { width: "48.5%", flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderWidth: 2, borderColor: INK, backgroundColor: PARCH.bottom, opacity: 0.75 },
  lockIcon: { width: 24, height: 24 },
  lockedName: { color: PARCH.ink, fontSize: 16, fontFamily: FONT.bold },
  lockedWhy: { color: PARCH.soft, fontSize: 14, fontFamily: FONT.regular },
});
