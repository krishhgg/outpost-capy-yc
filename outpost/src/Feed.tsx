import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Image, KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation, Easing, FadeInDown, FadeInUp, FadeOut, withDelay, FadeOutUp, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn,
} from "react-native-reanimated";
import { createVideoPlayer, VideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useAudioPlayer } from "expo-audio";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { FindCard } from "./Scout";
import { Block, DEEP, FONT, INK, Outlined, PARCH, PixelButton, POP, Sea, WOOD } from "./pixel";
import { usePayoff } from "./Payoff";
import { Portrait } from "./Portrait";
import { Flame, localDay, Milestones, PLAT } from "./You";
import { ICON } from "./Hud";
import { Badge, Button, COLOR, DemoNote, EmptyState, feel, HONESTY, money, NumberTicker, tierFor, useToast, type Tone } from "./ui";

const { width: W } = Dimensions.get("window");
type Clip = FunctionReturnType<typeof api.feed.next>[number];
type Mode = "dryRun" | "private" | "public" | "demo";
const FIND_EVERY = 3; // videos swiped between Scout cards
const INSET = 16; // every overlay sits this far in from the video's edges
const RAIL = 52; // the Post and Remake buttons down the right edge
const BAR = 64; // the money and score row over the video's top
type Outcome = "post" | "remake";
type Box = { w: number; h: number };
const GOLD = "#FFC83A";
// The first card of an app session leans right and back once, with the POST stamp showing, so the swipe is never a
// secret. Any touch on the deck first, or a swipe, cancels it.
let nudged = false;

// The sheet after a left swipe, hook first since it's the most common fix. "Say more" writes a note.
const REASONS: [string, string][] = [
  ["hook", "Hook too slow"], ["long", "Too long"], ["visuals", "Boring visuals"],
  ["voice", "Voice"], ["topic", "Wrong topic"], ["more", "Say more"],
];

export function useClock(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function Feed({ device, active, findNow }: { device: string; active: boolean; findNow?: string }) {
  const rows = useQuery(api.feed.next, { deviceId: device });
  const status = useQuery(api.feed.status, { deviceId: device });
  const swipe = useMutation(api.feed.swipe);
  const find = useQuery(api.scout.next, { deviceId: device });
  const swipeFind = useMutation(api.scout.swipe);
  const insets = useSafeAreaInsets();
  // A Scout card comes up after every few videos, while the Scout has finds left.
  const [sinceFind, setSinceFind] = useState(0);
  const [findGone, setFindGone] = useState<string | null>(null);
  const showFind = !!find && find.id !== findGone && sinceFind >= FIND_EVERY;
  useEffect(() => { if (findNow) setSinceFind(FIND_EVERY); }, [findNow]);
  const [gone, setGone] = useState<Set<string>>(new Set());
  // The video whose remake reason is being picked.
  const [asking, setAsking] = useState<Clip | null>(null);
  // The bounty an approved video is going to, shown as a pill for a moment after the swipe lands.
  const [sent, setSent] = useState<{ id: string; brand: string; mode: Mode } | null>(null);
  const toast = useToast();
  // This session's swipes, for the segments along the top of the video. A session starts each time the Feed comes into view.
  const [outcomes, setOutcomes] = useState<{ id: Id<"videos">; o: Outcome }[]>([]);
  useEffect(() => { if (active) setOutcomes([]); }, [active]);
  const clips = useMemo(() => (rows ?? []).filter(r => !gone.has(r.id)), [rows, gone]);
  const now = useClock(5000);
  const payoff = usePayoff();
  // The first approval of the day flips todayDone. Seeing that flip while the Feed is open earns the streak banner.
  const you = useQuery(api.you.summary, { deviceId: device, phoneDay: localDay(now) });
  const doneBefore = useRef<boolean | null>(null);
  const streakAt = useRef(0);
  const lastPost = useRef(false); // whether the latest swipe was a post
  useEffect(() => {
    if (!you) return;
    if (doneBefore.current === false && you.todayDone && active) { payoff.streak(you.streak); streakAt.current = Date.now(); }
    doneBefore.current = you.todayDone;
  }, [you?.todayDone]);

  // Resolves true once Convex has taken the swipe, so a payoff never celebrates a swipe that didn't count.
  const send = (clip: Clip, dir: "right" | "left", dwellMs: number, reason?: string, note?: string) =>
    swipe({ deviceId: device, videoId: clip.id, dir, dwellMs, reason, note }).then(r => r.ok, e => {
      // Put the card back so the swipe can be made again.
      console.warn("swipe failed", e);
      setGone(g => { const n = new Set(g); n.delete(clip.id); return n; });
      setOutcomes(o => o.filter(x => x.id !== clip.id));
      return false;
    });

  const remake = (clip: Clip, dwellMs: number, reason: string, label: string, note?: string) =>
    send(clip, "left", dwellMs, reason, note).then(ok => { if (ok) payoff.remake(label); });
  // A swipe or a rail button. Right posts at once; left asks what should change.
  const onSwipe = (clip: Clip, dir: 1 | -1, dwellMs: number) => {
    lastPost.current = dir > 0;
    setGone(g => new Set(g).add(clip.id));
    setOutcomes(x => [...x, { id: clip.id, o: dir > 0 ? "post" : "remake" }]);
    setSinceFind(n => n + 1);
    if (dir < 0) { dwell.current = dwellMs; setAsking(clip); return; }
    send(clip, "right", dwellMs).then(ok => {
      if (!ok) return;
      payoff.post();
      if (!clip.bounty || !status) return;
      feel("success");
      setSent({ id: clip.id, brand: clip.bounty.brand, mode: status.mode });
    });
  };
  const dwell = useRef(0);
  const skip = (clip: Clip) => send(clip, "left", dwell.current).then(ok => { if (ok) payoff.skip(); });
  const swipedToday = outcomes.length > 0 || (!!you && you.todayCounts.approved + you.todayCounts.remakes > 0);

  const offline = !status || now - status.studio.lastSeen > 25_000;
  // Swiping the last card ends the session with a chime, unless the streak banner is sounding or about to: a last post
  // before today counted flips todayDone once Convex takes it. Leaving the Feed or the studio going offline cancels a
  // chime still waiting.
  const star = useAudioPlayer(require("../assets/sounds/star.wav"));
  const hadClips = useRef(false);
  useEffect(() => {
    if (rows === undefined) return;
    if (clips.length > 0) { hadClips.current = true; return; }
    if (!hadClips.current) return;
    hadClips.current = false;
    const streakDue = lastPost.current && !!you && !you.todayDone;
    if (!active || offline || streakDue || Date.now() - streakAt.current < 3000) return;
    const t = setTimeout(() => {
      if (Date.now() - streakAt.current < 3000) return;
      star.seekTo(0).catch(() => {});
      star.play();
    }, 500);
    return () => clearTimeout(t);
  }, [clips.length, rows === undefined, active, offline]);
  // The newest post drops down under the header for a few seconds only when one of its platforms turns live, so it
  // never covers the money counter during a run of swipes. Live links stay on the You tab.
  const latest = status?.recent[0];
  const sig = latest ? `${latest.videoId}:${latest.posts.map(p => `${p.platform}=${p.status}`).join(",")}` : "";
  const [trayUntil, setTrayUntil] = useState(0);
  // Once the newest post is live on a bounty, its submission waits for one tap on Whop. That flow lives on the You tab,
  // so a toast points there.
  const toSubmit = latest?.submission === "manual";
  const lastSubmit = useRef<string | null>(null);
  useEffect(() => {
    if (!latest) return;
    const key = `${latest.videoId}:${latest.submission ?? ""}`;
    const was = lastSubmit.current;
    lastSubmit.current = key;
    if (was === null || was === key || !toSubmit || !active) return;
    toast.show({ title: "Ready to submit on Whop", body: "Your post is live. Submit it from the You tab.", icon: "coin",
      action: { label: "Submit", onPress: () => router.navigate("/you") }, testID: "submit-toast" });
  }, [latest?.videoId, latest?.submission]);
  // Platforms seen turning live while the app is open. Each pops in turn with a tick; one already live on open doesn't.
  const lastSig = useRef("");
  // Kept with the state it came from, so a pill never pops for an older change.
  const [fresh, setFresh] = useState({ sig: "", live: [] as string[] });
  const tick = useAudioPlayer(require("../assets/sounds/tick.wav"));
  // The ticks wait for their pops. A newer post state drops its pops, and the tab stays mounted, so a new state, leaving
  // the Feed or unmounting it cancels any tick still waiting.
  const ticks = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { ticks.current.forEach(clearTimeout); ticks.current = []; }, [active, sig]);
  useEffect(() => {
    if (!sig || !latest) return;
    const [vid, was = ""] = lastSig.current.split(":");
    lastSig.current = sig;
    const before = new Map(vid === latest.videoId ? was.split(",").map(x => x.split("=") as [string, string]) : []);
    const turned = latest.posts.filter(p => p.status === "live" && before.has(p.platform) && before.get(p.platform) !== "live").map(p => p.platform);
    setFresh({ sig, live: turned });
    if (turned.length === 0) return;
    if (active) turned.forEach((_, i) => ticks.current.push(setTimeout(() => {
      tick.seekTo(0).catch(() => {});
      tick.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 250 + i * 350)));
    setTrayUntil(Date.now() + 8000);
  }, [sig]);
  const [box, setBox] = useState<Box | null>(null);
  return (
    <View style={s.screen}>
      <Sea />
      {/* The video runs edge to edge from under the status bar to the tab bar. Everything else floats over it. */}
      <View style={[s.deckArea, { marginTop: insets.top }]} onLayout={e => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {rows === undefined ? <Empty text="Connecting…" />
          : clips.length === 0 ? (!swipedToday ? <NoVideos making={status?.studio.making ?? 0} />
            : <CaughtUp approved={you?.todayCounts.approved ?? 0} remakes={you?.todayCounts.remakes ?? 0}
                streak={you?.todayDone ? you.streak : 0} making={status?.studio.making ?? 0} stages={status?.studio.stages ?? []}
                queued={status?.studio.queued ?? 0} offline={offline}
                onFind={find && find.id !== findGone ? () => setSinceFind(FIND_EVERY) : undefined} />)
          : box && <Deck clips={clips} done={outcomes.map(x => x.o)} onSwipe={onSwipe} active={active && !asking && !showFind}
              box={box} behind={!showFind} />}
        {!showFind && <TopBar device={device} />}
        {sent && <Approved key={sent.id} brand={sent.brand} mode={sent.mode} onDone={() => setSent(null)} />}
        {showFind && find && (
          <FindCard key={find.id} find={find} onSwipe={dir => {
            setFindGone(find.id);
            setSinceFind(0);
            swipeFind({ deviceId: device, findId: find.id, dir }).catch(e => { console.warn("find swipe failed", e); setFindGone(null); setSinceFind(FIND_EVERY); });
          }} />
        )}
        {payoff.layer}
        <View style={s.drop} pointerEvents="box-none">
          {/* The tray steps aside while the streak banner shows and drops back in after it for the rest of its time. */}
          {latest && now < trayUntil && !payoff.banner && (
            <Animated.View entering={FadeInUp.duration(180)} exiting={FadeOutUp.duration(180)} style={s.dropIn}>
              <Tray item={latest} fresh={fresh.sig === sig ? fresh.live : []} sig={sig} />
            </Animated.View>
          )}
          {payoff.toasts}
        </View>
      </View>
      <Modal visible={!!asking} transparent animationType="fade"
        onRequestClose={() => { if (asking) skip(asking); setAsking(null); }}>
        {asking && (
          <ReasonSheet
            hook={asking.hook}
            onPick={(reason, note) => {
              remake(asking, dwell.current, reason, reason === "more" ? "your note" : REASONS.find(([k]) => k === reason)?.[1] ?? reason, note);
              setAsking(null);
            }}
            onSkip={() => { skip(asking); setAsking(null); }}
          />
        )}
      </Modal>
      {toast.node}
    </View>
  );
}

const TIER_TONE: Record<string, Tone> = { settler: "slate", curator: "teal", showrunner: "orange", tastemaker: "gold" };

// The two numbers a swipe moves, mirrored across the top of the video: estimated earnings on the left, the taste score
// on the right. The money is Whop pending plus the forecast for approved public posts not counted yet, so it ticks up
// the moment one is approved; both parts are estimates, so it carries the ESTIMATED tag. Both open the You tab.
function TopBar({ device }: { device: string }) {
  const e = useQuery(api.earnings.summary, { deviceId: device });
  const cents = e ? e.pendingCents + e.forecastCents : undefined;
  const t = e?.taste;
  const tier = t && t.score !== null ? tierFor(t.score) : null;
  const go = () => { feel("tap"); router.navigate("/you"); };
  return (
    <View style={s.bar} pointerEvents="box-none">
      <Pressable onPress={go} hitSlop={8} style={s.barSide} testID="feed-pending" accessibilityRole="button"
        accessibilityLabel={e ? `${money(cents!)} estimated: ${money(e.pendingCents)} pending on Whop plus ${money(e.forecastCents)} forecast` : "Estimated earnings loading"}>
        <Image source={ICON.coin} style={s.barIcon} />
        <View>
          <NumberTicker value={cents} format={money} size={26} testID="feed-money" />
          <Badge label={HONESTY.estimated.label} tone={HONESTY.estimated.tone} size="sm" dashed testID="feed-money-label" />
        </View>
      </Pressable>
      <Pressable onPress={go} hitSlop={8} style={s.barSide} testID="feed-score" accessibilityRole="button"
        accessibilityLabel={!t ? "Taste score loading" : !tier ? "No taste score yet"
          : `Taste score ${t.score}, ${tier.name}${t.state === "calibrating" ? ", provisional" : ""}`}>
        <View style={s.barEnd}>
          {t && t.score === null ? <Outlined size={26}>–</Outlined>
            : <NumberTicker value={t?.score ?? undefined} size={26} delta={false} testID="feed-score-value" style={s.end} />}
          {tier ? <Badge label={t?.state === "calibrating" ? `${tier.name} · prov` : tier.name} tone={TIER_TONE[tier.key]} size="sm"
            dashed={t?.state === "calibrating"} testID="feed-tier" style={s.end} /> : null}
        </View>
        <Image source={ICON.star} style={s.barIcon} />
      </Pressable>
    </View>
  );
}

// "$4 / 1K views" reads as "$4/1K" on the pill.
const shortReward = (label: string) => label.replace(/\s*\/\s*/g, "/").replace(/\s*views?\b/i, "");

// The one tag on the video, where TikTok puts its caption: the bounty it's for (or the Scout's pick), with the required
// pregenerated line over it, so the pill shares its bottom edge with the Post button. Tapping it opens the studio's forecast and a remake's reason, so they never cover the video.
function Caption({ clip }: { clip: Clip }) {
  const [open, setOpen] = useState(false);
  const more = !!clip.predicted || !!clip.remade;
  const label = clip.bounty ? `${clip.bounty.brand} · ${shortReward(clip.bounty.rewardLabel)}`
    : clip.scout ? `Scout pick · ${money(clip.scout.priceCents)} app` : null;
  if (!label && !clip.pregenerated) return null;
  return (
    <View style={s.caption} pointerEvents="box-none">
      {open && more ? (
        <Animated.View entering={FadeInDown.duration(150)} style={s.panel} testID="forecast-panel">
          {clip.predicted ? (
            <View style={s.panelHead}>
              <Badge label={HONESTY.forecast.label} tone={HONESTY.forecast.tone} size="sm" dashed />
              <Text style={s.panelScore}>{`${Math.round(clip.predicted.score)}/100`}</Text>
            </View>
          ) : null}
          <Text style={s.panelText} numberOfLines={3}>
            {[clip.remade ? `Remade: ${clip.remade.label}.` : "", clip.predicted?.reason ?? ""].filter(Boolean).join(" ")}
          </Text>
        </Animated.View>
      ) : null}
      {clip.pregenerated ? <Text style={s.pregen} testID="pregenerated-label">Pregenerated for the demo</Text> : null}
      {label ? (
        <Pressable disabled={!more} onPress={() => { feel("tap"); setOpen(o => !o); }} hitSlop={6} accessibilityRole={more ? "button" : undefined}
          testID={clip.bounty ? "bounty-tag" : "scout-label"} accessibilityLabel={more ? `${label}. Tap for the forecast` : label}>
          {({ pressed }) => (
            <Block bevel={clip.bounty ? "gold" : "teal"} depth={pressed ? 1 : 2} style={s.pill}>
              <Image source={clip.bounty ? ICON.coin : ICON.glass} style={s.pillIcon} />
              <Text style={[s.pillLabel, !clip.bounty && { color: "#fff" }]} numberOfLines={1}>{label}</Text>
            </Block>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

// The moment after a bounty video is approved: a small pill naming the bounty and what the posting mode does with it.
// The money counter's tick is the real payoff, so this stays out of the way and fades.
function Approved({ brand, mode, onDone }: { brand: string; mode: Mode; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1500); return () => clearTimeout(t); }, []);
  const word = mode === "public" || mode === "demo" ? "Posting" : mode === "private" ? "Private test" : "Dry run";
  return (
    <Animated.View entering={ZoomIn.springify().damping(14).stiffness(220)} exiting={FadeOut.duration(250)} style={s.approved}
      pointerEvents="none" testID="posting-banner" accessible accessibilityLabel={`Approved for ${brand}. ${word}`}>
      <View style={s.approvedPill}>
        <Image source={ICON.check} style={s.pillIcon} />
        <Outlined size={17}>{`Approved · ${brand} · ${word}`}</Outlined>
      </View>
    </Animated.View>
  );
}

// The end of a session, as a streak payoff: the day just kept, what today's swipes added up to, the next day to come
// back for, and what the studio is doing meanwhile. Every number is real.
function CaughtUp({ approved, remakes, streak, making, stages, queued, offline, onFind }:
  { approved: number; remakes: number; streak: number; making: number; stages: string[]; queued: number; offline: boolean; onFind?: () => void }) {
  const studio = offline ? "Studio offline · the laptop is asleep" : making > 0 ? [`Making ${making} now · ${stages[0]}`, queued > 0 ? `${queued} queued` : ""].filter(Boolean).join(" · ")
    : queued > 0 ? `${queued} video${queued === 1 ? "" : "s"} queued at the studio` : "The studio is resting";
  const shown = useCountUp(approved);
  return (
    <Animated.View entering={ZoomIn.springify().damping(12).mass(1).stiffness(180)} style={s.caughtWrap}>
      <Block style={s.caught} lift={4} testID="caught-up">
        <Outlined size={32} width={2.5}>ALL CAUGHT UP</Outlined>
        {streak > 0 ? (
          <View style={s.caughtHero} testID="caught-streak">
            <Flame size={60} />
            <View>
              <Outlined size={44} width={3} color={GOLD}>{`DAY ${streak}`}</Outlined>
              <Text style={s.caughtKept}>streak kept</Text>
            </View>
          </View>
        ) : <Image source={ICON.check} style={s.caughtIcon} />}
        <View style={s.caughtTiles} testID="caught-counts">
          <View style={s.caughtTile}><Text style={s.caughtNum}>{shown}</Text><Text style={s.caughtLabel}>approved today</Text></View>
          <View style={s.caughtTile}><Text style={s.caughtNum}>{remakes}</Text><Text style={s.caughtLabel}>sent back</Text></View>
        </View>
        {streak > 0 ? <View style={s.caughtPath}><Milestones streak={streak} /></View> : null}
        <View style={s.caughtStudio}>
          {making > 0 && <View style={s.caughtCrew}><Portrait who="writer" /><Portrait who="director" /></View>}
          <Text style={s.caughtNext}>{studio}</Text>
        </View>
        {onFind && <PixelButton label="See the Scout's find" bevel="teal" size={20} onPress={onFind} testID="caught-find" style={s.caughtBtn} />}
        <Button label="Find more bounties" bevel="green" size="md" onPress={() => router.navigate("/bounties")} testID="caught-bounties"
          style={onFind ? s.caughtBtn2 : s.caughtBtn} />
        <PixelButton label="Back to Base" bevel="gold" size={20} onPress={() => router.navigate("/")} testID="caught-base" style={s.caughtBtn2} />
      </Block>
    </Animated.View>
  );
}

// Nothing to swipe and nothing swiped today. The Feed fills from bounties, so this points at the board.
function NoVideos({ making }: { making: number }) {
  return (
    <Animated.View entering={ZoomIn.springify().damping(12).mass(1).stiffness(180)} style={s.caughtWrap}>
      <EmptyState icon="coin" title="No videos yet" testID="feed-empty"
        body={making > 0 ? `Studio · remaking ${making} for you` : "Take a bounty and its videos land here."}
        action={{ label: "Browse bounties", onPress: () => router.navigate("/bounties"), testID: "empty-bounties" }} />
      <DemoNote style={s.demoNote} />
    </Animated.View>
  );
}

// Counts a number up from where it was shown last, so today's total lands with a little run instead of just appearing.
function useCountUp(to: number, ms = 600) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = Date.now(), a = from.current;
    const t = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / ms);
      const v = Math.round(a + (to - a) * k);
      setN(v);
      from.current = v;
      if (k === 1) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [to]);
  return n;
}

function Empty({ text }: { text: string }) {
  return (
    <Block style={s.empty} lift={4}>
      <Text style={s.emptyText}>{text}</Text>
    </Block>
  );
}

type Recent = FunctionReturnType<typeof api.feed.status>["recent"][number];

// The newest approved video and where each platform's copy stands. Tap a live one to open it.
function Tray({ item, fresh, sig }: { item: Recent; fresh: string[]; sig: string }) {
  const dry = item.posts.every(p => p.status === "dry_run");
  return (
    <Block style={s.tray} depth={3} lift={3} testID="post-tray">
      <Text style={s.trayTag}>{dry ? "APPROVED" : "POSTED"}</Text>
      <Text style={s.trayHook} numberOfLines={1}>{item.hook}</Text>
      {item.posts.map(p => {
        const name = p.platform === "youtube" ? "YouTube" : "Instagram";
        const [short, full, color] =
          p.status === "live" ? ["Live", "Live, tap to open", "#2F8A2C"]
          : p.status === "queued" || p.status === "publishing" ? ["Posting", "Posting", "#B06A00"]
          : p.status === "held" ? [clock(p.slotAt), `Queued, goes out ${clock(p.slotAt)}`, "#B06A00"]
          : p.status === "dry_run" ? ["Dry run", "Dry run, not sent", PARCH.soft]
          : p.status === "skipped" ? ["Skipped", p.error ?? "Skipped", PARCH.soft]
          : ["Failed", `Failed: ${p.error ?? "share by hand"}`, "#C0392B"];
        const at = fresh.indexOf(p.platform);
        return (
          <Pill key={p.platform} live={p.status === "live"} pop={at < 0 ? -1 : 250 + at * 350} sig={sig}
            onPress={p.url ? () => WebBrowser.openBrowserAsync(p.url!) : undefined} testID={`post-${p.platform}`} label={`${name}: ${full}`}>
            <Image source={PLAT[p.platform].mark} style={s.pillMark} />
            <Text style={[s.pillText, { color: p.status === "live" ? "#fff" : color }]} numberOfLines={1}>{short}</Text>
          </Pill>
        );
      })}
    </Block>
  );
}

// A live post is something to press, so its pill gets the green bevel and a lift; the rest stay flat tags. A pill
// seen turning live pops once, `pop` ms after the tray updates, so two platforms land one after the other.
function Pill({ live, pop, sig, onPress, testID, label, children }:
  { live: boolean; pop: number; sig: string; onPress?: () => void; testID: string; label: string; children: ReactNode }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    // A newer state drops any pop still waiting from the last one.
    cancelAnimation(scale);
    scale.value = 1;
    if (pop >= 0) scale.value = withDelay(pop, withSequence(withTiming(1.3, { duration: 120 }), withSpring(1, POP)));
  }, [pop, sig]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable disabled={!onPress} onPress={onPress} testID={testID} accessibilityLabel={label} accessibilityRole={onPress ? "link" : undefined}>
        {live ? <Block bevel="green" depth={2} lift={3} style={s.pill}>{children}</Block> : <View style={[s.pill, s.pillFlat]}>{children}</View>}
      </Pressable>
    </Animated.View>
  );
}

// The deck: the top card fills the area edge to edge, the next one waits behind it a little smaller and grows into place
// as the top card is dragged off.
function Deck({ clips, done, onSwipe, active, box, behind }:
  { clips: Clip[]; done: Outcome[]; onSwipe: (c: Clip, dir: 1 | -1, dwellMs: number) => void; active: boolean; box: Box; behind: boolean }) {
  const card = { width: box.w, height: box.h };
  const players = useRef(new Map<string, VideoPlayer>());
  const committed = useRef<string | null>(null); // a card swiped away can't be swiped again by a second tap
  const thrown = useRef<string | null>(null); // the card a button has already thrown; a second tap can't redirect it
  const shownAt = useRef(Date.now());
  const shownId = useRef<string | null>(null);
  const x = useSharedValue(0);
  const hint = useSharedValue(0); // the POST stamp's opacity during the nudge
  const past = useSharedValue(0); // which side of the throw point a drag is on: 1 right, -1 left, 0 inside
  const stampPop = useSharedValue(1);
  const nudging = useSharedValue(false); // the nudge is moving x, so a touch can take it back
  const top = clips[0];
  const [, force] = useState(0);
  useEffect(() => {
    if (nudged || !active || !top) return;
    const t = setTimeout(() => {
      if (nudged || committed.current || thrown.current) return;
      nudged = true;
      nudging.value = true;
      // Eased back rather than sprung, so it doesn't swing past the middle and flash REMAKE. The callback runs however
      // the return ends, also when a drag, a throw or a touch replaces it.
      x.value = withSequence(withTiming(30, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) }, () => { nudging.value = false; }));
      hint.value = withSequence(withTiming(0.6, { duration: 280 }), withTiming(0, { duration: 420 }));
    }, 1200);
    return () => clearTimeout(t);
  }, [active, top?.id]);

  // Keep the top card and the next two loaded, release the rest.
  useEffect(() => {
    const want = clips.slice(0, 3);
    let fresh = false;
    for (const c of want) {
      if (players.current.has(c.id)) continue;
      const p = createVideoPlayer({ uri: c.url });
      p.loop = true;
      players.current.set(c.id, p);
      if (c.id === top?.id) fresh = true;
    }
    for (const [id, p] of players.current) if (!want.some(c => c.id === id)) { p.release(); players.current.delete(id); }
    // A new clip arriving further down the deck leaves the card being watched alone.
    if (fresh || top?.id !== shownId.current) {
      shownId.current = top?.id ?? null;
      committed.current = null;
      thrown.current = null;
      for (const [id, p] of players.current) if (id === top?.id) { p.currentTime = 0; if (active) p.play(); } else p.pause();
      shownAt.current = Date.now();
      x.value = 0;
    }
    force(n => n + 1);
  }, [top?.id, clips.length]);
  // Only the Feed tab makes sound. Leaving it pauses the top card, coming back resumes it.
  useEffect(() => {
    const cur = top && players.current.get(top.id);
    if (!cur) return;
    if (active) { cur.play(); shownAt.current = Date.now(); } else cur.pause();
  }, [active]);
  // Clear the map too: a hot reload runs this cleanup and then reuses the ref.
  useEffect(() => () => { for (const p of players.current.values()) p.release(); players.current.clear(); }, []);

  const commit = (dir: 1 | -1) => {
    if (!top || committed.current === top.id) return;
    committed.current = top.id;
    nudged = true;
    Haptics.impactAsync(dir > 0 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    onSwipe(top, dir, Date.now() - shownAt.current);
  };
  // The rail buttons throw the card the same way a swipe does.
  const fling = (dir: 1 | -1) => {
    if (!top || thrown.current === top.id) return;
    thrown.current = top.id;
    nudged = true;
    x.value = withTiming(dir * W * 1.5, { duration: 220 }, finished => { if (finished) runOnJS(commit)(dir); });
  };

  // A touch means they found the card, so the nudge never plays again. It also stops a nudge that's running, so the
  // POST stamp doesn't show under their finger: the card goes back to the middle, unless a drag moves it first. A
  // button throw that's running is left alone.
  const seen = () => { nudged = true; };
  const tickPast = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
  const pan = Gesture.Pan()
    .onBegin(() => {
      past.value = 0;
      runOnJS(seen)();
      cancelAnimation(hint);
      hint.value = 0;
      if (nudging.value) {
        nudging.value = false;
        x.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });
      }
    })
    .onUpdate(e => {
      x.value = e.translationX;
      // Crossing the point where letting go throws the card ticks once and pops its stamp, so the thumb knows before it
      // lets go.
      const side = Math.abs(e.translationX) > W * 0.25 ? Math.sign(e.translationX) : 0;
      if (side === past.value) return;
      past.value = side;
      if (side === 0) return;
      runOnJS(tickPast)();
      stampPop.value = withSequence(withTiming(1.2, { duration: 90 }), withSpring(1, POP));
    })
    .onEnd(e => {
      const go = Math.abs(e.translationX) > W * 0.25 || Math.abs(e.velocityX) > 800;
      if (go) {
        const dir = (Math.sign(e.translationX || e.velocityX) || 1) as 1 | -1;
        x.value = withTiming(dir * W * 1.5, { duration: 160 }, finished => { if (finished) runOnJS(commit)(dir); });
      } else x.value = withSpring(0);
    });

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { rotate: `${interpolate(x.value, [-W, W], [-10, 10])}deg` }],
  }));
  const nextStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.94 + 0.06 * Math.min(Math.abs(x.value) / (W * 0.5), 1) }] }));
  const postStamp = useAnimatedStyle(() => ({
    opacity: Math.max(hint.value, interpolate(x.value, [0, W * 0.25], [0, 1], "clamp")),
    transform: [{ rotate: "-10deg" }, { scale: x.value > 0 ? stampPop.value : 1 }],
  }));
  const remakeStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-W * 0.25, 0], [1, 0], "clamp"),
    transform: [{ rotate: "10deg" }, { scale: x.value < 0 ? stampPop.value : 1 }],
  }));

  const next = clips[1] && players.current.get(clips[1].id);
  const cur = top && players.current.get(top.id);
  return (
    <View style={s.fill}>
      {next && (
        <Animated.View style={[s.card, card, nextStyle, !behind && s.hidden]}>
          <VideoView player={next} style={s.video} nativeControls={false} contentFit="cover" />
          <Shade />
        </Animated.View>
      )}
      {cur && (
        <GestureDetector gesture={pan}>
          <Animated.View style={[s.card, card, topStyle]} testID="top-card">
            <VideoView key={top.id} player={cur} style={s.video} nativeControls={false} contentFit="cover" />
            <Shade />
            <Segments key={`p${top.id}`} done={done} left={clips.length} player={cur} />
            <Caption key={top.id} clip={top} />
            <Animated.View style={[s.stamp, s.post, postStamp]}><Block bevel="green" depth={3} style={s.stampFace}><Outlined size={34}>POST</Outlined></Block></Animated.View>
            <Animated.View style={[s.stamp, s.remake, remakeStamp]}><Block bevel="orange" depth={3} style={s.stampFace}><Outlined size={34}>REMAKE</Outlined></Block></Animated.View>
          </Animated.View>
        </GestureDetector>
      )}
      {/* Down the right edge, level with the caption, TikTok-style. Remake on top, Post under the thumb. */}
      {cur && active && (
        <View style={s.rail} pointerEvents="box-none">
          <RailButton bevel="orange" label="Remake" onPress={() => fling(-1)} testID="remake-button"><Image source={ICON.play} style={[s.railIcon, s.flip]} /></RailButton>
          <RailButton bevel="green" label="Post" onPress={() => fling(1)} testID="post-button"><Image source={ICON.check} style={s.railIcon} /></RailButton>
        </View>
      )}
    </View>
  );
}

function RailButton({ bevel, label, onPress, testID, children }:
  { bevel: "green" | "orange"; label: string; onPress: () => void; testID: string; children: ReactNode }) {
  return (
    <Pressable onPress={() => { feel("press"); onPress(); }} hitSlop={6} testID={testID} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <Block bevel={bevel} depth={pressed ? 2 : 4} lift={pressed ? 0 : 3} style={[s.railButton, pressed && s.sunk]}>{children}</Block>
      )}
    </Pressable>
  );
}

// Stepped dark bands at the top and bottom of a card, pixel-style, so the white numbers and the caption read on any frame.
function Shade() {
  return (
    <>
      <View style={[s.shade, { top: 0 }]} pointerEvents="none">
        {[0.5, 0.34, 0.2, 0.08].map(a => <View key={a} style={[s.band, { backgroundColor: `rgba(10,6,14,${a})` }]} />)}
      </View>
      <View style={[s.shade, { bottom: 0 }]} pointerEvents="none">
        {[0.08, 0.2, 0.34, 0.5].map(a => <View key={a} style={[s.band, { backgroundColor: `rgba(10,6,14,${a})` }]} />)}
      </View>
    </>
  );
}

// Where you are in this session, the way Stories mark their segments along the top: one per video, gold once posted,
// orange once sent back, and the one on screen filling as it plays. At most 12. The last 6 swipes always keep their
// place, so a long deck can't push them out; past that the oldest drop off.
function Segments({ done, left, player }: { done: Outcome[]; left: number; player: VideoPlayer }) {
  const past = Math.min(done.length, Math.max(12 - left, 6));
  const ahead = Math.min(left, 12 - past);
  const behind = done.slice(done.length - past);
  return (
    <View style={s.segs} pointerEvents="none" testID="session-segments">
      {behind.map((o, i) => <View key={`d${i}`} style={[s.seg, { backgroundColor: o === "post" ? GOLD : "#F07A2A" }]} />)}
      {Array.from({ length: ahead }, (_, i) => (
        <View key={`a${i}`} style={s.seg}>{i === 0 && <Progress player={player} />}</View>
      ))}
    </View>
  );
}

// How far through its clip the top card is, filling the current segment.
function Progress({ player }: { player: VideoPlayer }) {
  const p = useSharedValue(0);
  useEffect(() => {
    player.timeUpdateEventInterval = 0.25;
    const sub = player.addListener("timeUpdate", ({ currentTime }) => {
      const k = player.duration > 0 ? Math.min(1, currentTime / player.duration) : 0;
      // A loop jumps back to the start at once. Forward steps glide, so the line moves smoothly between events.
      p.value = k < p.value ? k : withTiming(k, { duration: 250, easing: Easing.linear });
    });
    return () => sub.remove();
  }, [player]);
  const style = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return <Animated.View style={[s.progressFill, style]} testID="clip-progress" />;
}

// After a left swipe: what the studio should change, as big buttons that read in a glance. The video going back is named
// in one line under the title, since the deck behind has already moved on. "Say more" opens a note box.
function ReasonSheet({ hook, onPick, onSkip }: { hook: string; onPick: (reason: string, note?: string) => void; onSkip: () => void }) {
  const [writing, setWriting] = useState(false);
  const [note, setNote] = useState("");
  return (
    // The sheet rides up with the keyboard, so "Say more" keeps its note box and send button in view.
    <KeyboardAvoidingView behavior="padding" style={s.sheetWrap}>
      <Pressable style={s.fill} onPress={onSkip} />
      <Block style={s.sheet} depth={4} testID="reason-sheet">
        {/* The same wooden board as the Away card and the raid picker, so the sheet reads as a game menu. */}
        <View style={s.sheetBoard}>
          <View style={[s.sheetGrain, { top: 12 }]} /><View style={[s.sheetGrain, { top: 38 }]} />
          <Outlined size={26} width={2}>What should change?</Outlined>
          <View style={s.sheetEdge} />
        </View>
        <Text style={s.sheetHook} numberOfLines={1} testID="reason-hook" accessibilityLabel={`Sending back ${hook}`}>{hook}</Text>
        {writing ? (
          <View>
            <TextInput style={s.input} autoFocus value={note} onChangeText={setNote} placeholder="Tell the studio what to change"
              placeholderTextColor={PARCH.soft} maxLength={200} />
            <PixelButton label="Send it back" bevel="orange" size={20} disabled={!note.trim()} onPress={() => onPick("more", note.trim())} style={s.send} />
          </View>
        ) : (
          <View style={s.grid}>
            {REASONS.map(([key, label]) => (
              <Pressable key={key} style={s.reasonCell} testID={`reason-${key}`} onPress={() => { feel("commit"); if (key === "more") setWriting(true); else onPick(key); }}
                accessibilityRole="button" accessibilityLabel={label}>
                {({ pressed }) => (
                  <View style={[s.reason, pressed && s.reasonDown]}>
                    <Text style={s.reasonText} numberOfLines={1}>{label}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
        <Pressable onPress={onSkip} hitSlop={12} testID="reason-skip" accessibilityRole="button"><Text style={s.skip}>Just skip it</Text></Pressable>
      </Block>
    </KeyboardAvoidingView>
  );
}

const shadow = { textShadowColor: INK, textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 };

const s = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: DEEP },
  deckArea: { flex: 1 },
  // Toasts and the post tray drop in just under the money and score row.
  drop: { position: "absolute", left: 0, right: 0, top: BAR + 8, height: 64 },
  dropIn: { position: "absolute", left: 0, right: 0, top: 0 },
  bar: { position: "absolute", top: 16, left: INSET, right: INSET, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  barSide: { flexDirection: "row", alignItems: "center", gap: 8 },
  barEnd: { alignItems: "flex-end" },
  end: { alignSelf: "flex-end" },
  barIcon: { width: 32, height: 32 },
  tray: { marginHorizontal: INSET, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 10, paddingRight: 6, paddingTop: 7, paddingBottom: 9 },
  trayTag: { color: "#B06A00", fontSize: 15, fontFamily: FONT.bold },
  trayHook: { flex: 1, color: PARCH.ink, fontSize: 16, fontFamily: FONT.semi },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 7, alignSelf: "flex-start", maxWidth: "100%" },
  pillIcon: { width: 22, height: 22 },
  pillLabel: { color: INK, fontSize: 18, fontFamily: FONT.bold, flexShrink: 1 },
  pillMark: { width: 18, height: 18 },
  pillText: { fontSize: 15, fontFamily: FONT.bold, flexShrink: 1 },
  pillFlat: { backgroundColor: PARCH.top, borderWidth: 2, borderColor: INK, paddingBottom: 3 },
  hidden: { opacity: 0 },
  caption: { position: "absolute", left: INSET, right: INSET + RAIL + INSET, bottom: INSET, alignItems: "flex-start", gap: 6 },
  pregen: { color: "rgba(255,255,255,0.72)", fontSize: 13, fontFamily: FONT.semi, ...shadow },
  panel: { alignSelf: "stretch", backgroundColor: PARCH.top, borderWidth: 2, borderColor: INK, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, gap: 4 },
  panelHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  panelScore: { color: INK, fontSize: 19, fontFamily: FONT.bold },
  panelText: { color: PARCH.ink, fontSize: 15, fontFamily: FONT.semi },
  approved: { position: "absolute", left: INSET, right: INSET, bottom: INSET + RAIL * 2 + 12 + INSET, alignItems: "center" },
  approvedPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLOR.greenDeep, borderWidth: 2, borderColor: INK, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 6 },
  rail: { position: "absolute", right: INSET, bottom: INSET, gap: 12 },
  railButton: { width: RAIL, height: RAIL, alignItems: "center", justifyContent: "center" },
  railIcon: { width: 28, height: 28 },
  flip: { transform: [{ scaleX: -1 }] },
  sunk: { transform: [{ translateY: 3 }] },
  shade: { position: "absolute", left: 0, right: 0, height: 120 },
  band: { flex: 1 },
  caughtWrap: { flex: 1, justifyContent: "center", marginHorizontal: 24, marginBottom: 40 },
  caughtIcon: { width: 48, height: 48, marginTop: 10 },
  caughtHero: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  caughtKept: { color: PARCH.ink, fontSize: 19, fontFamily: FONT.bold, marginTop: -4 },
  caughtTiles: { flexDirection: "row", gap: 10, alignSelf: "stretch", marginTop: 14 },
  caughtTile: { flex: 1, alignItems: "center", backgroundColor: PARCH.top, borderWidth: 2, borderColor: INK, paddingTop: 4, paddingBottom: 8 },
  caughtNum: { color: PARCH.ink, fontSize: 36, fontFamily: FONT.bold },
  caughtLabel: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi, marginTop: -4 },
  caughtStudio: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  caughtCrew: { flexDirection: "row", gap: 4 },
  caught: { alignItems: "center", paddingHorizontal: 18, paddingTop: 20, paddingBottom: 20 },
  caughtPath: { alignSelf: "stretch", marginTop: 14, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 },
  caughtNext: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.semi, textAlign: "center", flexShrink: 1 },
  caughtBtn: { alignSelf: "stretch", marginTop: 16 },
  caughtBtn2: { alignSelf: "stretch", marginTop: 10 },
  empty: { marginHorizontal: 28, marginTop: 120, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 22 },
  emptyText: { color: PARCH.ink, fontSize: 21, fontFamily: FONT.semi, textAlign: "center", lineHeight: 28 },
  card: { position: "absolute", top: 0, left: 0, borderWidth: 2, borderColor: INK, backgroundColor: "#000", overflow: "hidden" },
  video: { flex: 1 },
  segs: { position: "absolute", left: INSET, right: INSET, top: 6, height: 4, flexDirection: "row", gap: 3 },
  seg: { flex: 1, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: GOLD },
  demoNote: { marginTop: 14 },
  stamp: { position: "absolute", top: BAR + 48 },
  stampFace: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
  post: { left: INSET + 6 }, // tilted -10 degrees in postStamp
  remake: { right: INSET + 6 }, // tilted 10 degrees in remakeStamp
  sheetWrap: { flex: 1, backgroundColor: "rgba(20,10,30,0.97)" }, // dark enough that the next card's hook can't be read
  sheet: { padding: INSET, paddingBottom: 40, borderBottomWidth: 0 },
  sheetBoard: { alignItems: "center", marginHorizontal: -INSET, marginTop: -INSET, marginBottom: 12,
    paddingHorizontal: INSET, paddingTop: 12, paddingBottom: 18, backgroundColor: WOOD.base, overflow: "hidden" },
  sheetGrain: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: WOOD.grain },
  sheetEdge: { position: "absolute", left: 0, right: 0, bottom: 0, height: 6, borderTopWidth: 3, borderTopColor: INK, backgroundColor: WOOD.lip },
  sheetHook: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.semi, textAlign: "center", marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reasonCell: { width: "48%", flexGrow: 1 },
  reason: { backgroundColor: PARCH.top, borderWidth: 2, borderColor: INK, borderBottomWidth: 5, paddingHorizontal: 8, paddingTop: 14, paddingBottom: 13, alignItems: "center" },
  reasonDown: { borderBottomWidth: 2, marginTop: 3, backgroundColor: PARCH.bottom },
  reasonText: { color: PARCH.ink, fontSize: 22, fontFamily: FONT.bold },
  input: { backgroundColor: PARCH.top, color: PARCH.ink, borderWidth: 2, borderColor: INK, padding: 14, fontSize: 20, fontFamily: FONT.regular },
  send: { marginTop: 12 },
  skip: { color: PARCH.soft, textAlign: "center", marginTop: 18, fontSize: 18, fontFamily: FONT.semi },
});
