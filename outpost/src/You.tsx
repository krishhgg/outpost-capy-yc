import { useEffect, useState } from "react";
import { Dimensions, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useAudioPlayer } from "expo-audio";
import Animated, { FadeOut, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, ZoomIn } from "react-native-reanimated";
import { router, useIsFocused } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useClock } from "./Feed";
import { showNews } from "./collect";
import { Counter, ICON, useTicker, type IconName } from "./Hud";
import { TIER_STEPS } from "../convex/tiers";
import { Badge, Button, Card, COLOR, feel, HonestyLabel, NumberTicker, nextTier, ProgressBar, TierBadge, TIERS, tierFor, TYPE, VerdictBadge, money, type Tone } from "./ui";
import type { FunctionReturnType } from "convex/server";
import { Block, DEEP, FONT, INK, Outlined, PARCH, PixelButton, Plaque, POP, Sea, UNDER_PLAQUE, WoodHeader } from "./pixel";

const { width: W } = Dimensions.get("window");
const GAP = 6;
const CELL = Math.floor((W - 32 - 28 - 6 - GAP * 6) / 7); // card margins, padding and outline, then the gaps
const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const GOLD = "#FFC83A";
export const MILESTONES = [3, 7, 14, 30];
const ICE = "#9CC4FF";
export const PLAT = {
  youtube: { name: "YouTube", mark: require("../assets/ui/yt.png") },
  instagram: { name: "Instagram", mark: require("../assets/ui/ig.png") },
} as const;

// "2026-11-14" to "November". Noon, so no time zone can move it to the day before.
const monthName = (day: string) => new Date(`${day}T12:00:00`).toLocaleString("en-US", { month: "long" });
// The grid's weeks can start in the month before: "October – November".
const monthSpan = (from: string, to: string) => monthName(from) === monthName(to) ? monthName(to) : `${monthName(from)} – ${monthName(to)}`;

// 1234 -> "1.2k", 25000 -> "25k".
export function compact(n: number) {
  if (n < 1000) return String(n);
  const [d, unit] = n < 1e6 ? [1e3, "k"] : [1e6, "M"];
  return `${(n / d).toFixed(n / d < 10 ? 1 : 0).replace(/\.0$/, "")}${unit}`;
}

// The phone's local date as YYYY-MM-DD.
export function localDay(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function You({ device }: { device: string }) {
  const phoneDay = localDay(useClock(60_000));
  const data = useQuery(api.you.summary, { deviceId: device, phoneDay });
  const earnings = useQuery(api.earnings.summary, { deviceId: device });
  const bounties = useQuery(api.bounties.list, { deviceId: device });
  const focused = useIsFocused();
  const [month, setMonth] = useState(false);
  const [allPosts, setAllPosts] = useState(false);
  if (!data) return <View style={s.fill} />;
  const { streak, todayDone, freezesLeft, calendar, totals } = data;
  // The calendar ends with the week that holds today, Sunday first.
  const week = calendar.slice(-7);
  const earlier = calendar.slice(0, -7);
  // The month grid starts at the week of the first kept or frozen day, so a new account doesn't see weeks of empty
  // tiles that read as missed days. With none before this week there is no grid, and no link to it.
  const firstMarked = earlier.findIndex(c => c.approved > 0 || c.frozen);
  const past = firstMarked < 0 ? [] : earlier.slice(firstMarked - (firstMarked % 7));
  const posts = data.posts;
  // A platform with posts but not one count yet says "soon" on its chips, instead of "counting".
  const waiting = data.waiting;
  const dryRun = data.mode === "dryRun";
  // Each live video's verdict against the user's baseline, from the same rows as the list.
  const verdicts = new Map((earnings?.posts ?? []).map(p => [p.videoId as string, p]));

  return (
    <View style={s.fill}>
      <Sea />
      {/* The taste card leads, so the header carries no counters. News opens the Away recap over this tab and leaves you here. */}
      <WoodHeader title="YOU" right={
        <Button label="News" size="sm" bevel="gold" feel="tap" onPress={showNews} testID="you-news"
          accessibilityLabel="News since your last visit" />
      } />
      <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: 28 }} testID="you">
        <Taste e={earnings} bounties={bounties} focused={focused} />
        <Earnings e={earnings} device={device} />

        <Block style={s.card} lift={4} testID="you-streak">
          <View style={s.heroRow}>
            <Flame />
            <View>
              <Outlined size={64} width={3} color={GOLD}>{String(streak)}</Outlined>
              <Text style={s.heroLabel}>DAY STREAK</Text>
            </View>
            <View style={[s.todayChip, todayDone ? s.chipDone : s.chipTodo]} testID="you-today">
              {todayDone && <Image source={ICON.check} style={s.chipIcon} />}
              <Text style={s.chipText}>{todayDone ? "Done today" : "Approve 1 today"}</Text>
            </View>
          </View>

          <View style={s.strip} testID="you-week">
            {week.map((c, i) => (
              <Day key={c.day} letter={WEEK[i]} date={Number(c.day.slice(8))} lit={c.approved > 0} frozen={c.frozen}
                future={c.future} today={c.day === data.today} pulse={c.day === data.today && !todayDone} />
            ))}
          </View>

          <Milestones streak={streak} />

          <View style={s.freezeRow} testID="you-freezes">
            {Array.from({ length: freezesLeft }, (_, i) => <Image key={i} source={ICON.ice} style={s.ice} />)}
            <Text style={s.freeze} accessibilityLabel={freezesLeft > 0 ? `${freezesLeft} streak freezes left. One covers a day you miss.` : undefined}>
              {freezesLeft > 0 ? `${freezesLeft} freeze${freezesLeft === 1 ? "" : "s"} left` : "No freezes left"}
            </Text>
          </View>

          {past.length > 0 && (
            <Pressable onPress={() => setMonth(m => !m)} hitSlop={8} testID="you-month-toggle" accessibilityRole="button">
              <Text style={s.monthLink}>{month ? "Hide month" : "See month"}</Text>
            </Pressable>
          )}
          {month && past.length > 0 && (
            <View testID="you-calendar">
              {/* This week is the strip above, so the grid holds the weeks before it. */}
              <Text style={s.monthTitle}>{monthSpan(past[0].day, past[past.length - 1].day)}</Text>
              <View style={s.week}>{WEEK.map((d, i) => <Text key={i} style={[s.cell, s.weekday]}>{d}</Text>)}</View>
              <View style={s.grid}>
                {past.map(c => {
                  const first = c.day.endsWith("-01");
                  // Kept days wear the strip's flame tile and frozen days its ice, so both views mark a day the same way.
                  const mark = c.approved > 0 ? ICON.flame : c.frozen ? ICON.ice : null;
                  return (
                    <View key={c.day} testID={c.approved > 0 ? "you-day-lit" : undefined}
                      style={[s.cell, s.box, c.approved > 0 && s.lit, c.frozen && s.frozen,
                        c.day.slice(0, 7) !== data.today.slice(0, 7) && s.otherMonth]}>
                      {/* The 1st carries its month's short name, so the grid shows where one month ends and the next begins. */}
                      {first && <Text style={s.monthTag}>{monthName(c.day).slice(0, 3).toUpperCase()}</Text>}
                      {mark ? <Image source={mark} style={first ? s.gridMarkSmall : s.dayFlame} />
                        : <Text style={s.date}>{Number(c.day.slice(8))}</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Block>

        {/* What it all added up to, right under the streak, so the totals are on the first screen: the tiles, then one line
            of the rest. A dry run never posts, so live videos and views would sit at zero. It shows what was made instead. */}
        <View style={s.tiles} testID="you-totals">
          <Tile icon="check" label="Approved" value={String(totals.approved)} />
          {dryRun ? <Tile icon="play" label="Made" value={String(totals.made)} /> : <>
            {/* Videos, not posts, so it matches the Live now list below. */}
            <Tile icon="play" label="Videos live" value={String(totals.videos)} />
            <Tile icon="eye" label="Views" value={compact(totals.views)} />
          </>}
        </View>
        <Text style={s.footnote}>
          {(dryRun ? "" : `${totals.made} made · `) + `${totals.remakes} sent back · ${totals.skipped} skipped`}
        </Text>

        {/* No count here: the rows are videos and the totals above count posts, so a count here would disagree with one. */}
        <Plaque title="Live now" style={s.plaque} />
        <Block style={[s.card, UNDER_PLAQUE]} lift={4} testID="you-posts">
          {posts.length > 0 ? <>
            {/* The top three, most viewed first, with the rest one tap away. */}
            {(allPosts ? posts : posts.slice(0, 3)).map((v, i) => (
            <View key={v.id} style={[s.post, i === 0 && s.firstPost]} testID="you-post">
              <View style={s.postHead}>
                {i === 0 && v.views > 0 && <View style={s.topTag} testID="you-post-top"><Text style={s.topText}>TOP</Text></View>}
                <Text style={s.postTitle} numberOfLines={1}>{v.title}</Text>
                <Verdict post={verdicts.get(v.id)} />
              </View>
              <View style={s.plats}>
                {v.platforms.map(p => (
                  <Pressable key={p.id} style={({ pressed }) => [s.plat, pressed && { opacity: 0.7 }]} disabled={!p.url}
                    onPress={() => p.url && Linking.openURL(p.url)} testID={`you-post-${p.platform}`}
                    accessibilityRole={p.url ? "link" : undefined}
                    accessibilityLabel={`${PLAT[p.platform].name}: ${p.counted ? `${p.views} views` : "not counted yet"}`}>
                    <Image source={PLAT[p.platform].mark} style={s.platMark} />
                    <Text style={s.platName}>{PLAT[p.platform].name}</Text>
                    {p.counted ? (
                      <>
                        <Image source={ICON.eye} style={s.postEye} />
                        <Text style={[s.postViews, p.views === 0 && s.zero]}>{compact(p.views)}</Text>
                      </>
                    ) : <Text style={s.pending}>{waiting.includes(p.platform) ? "soon" : "counting"}</Text>}
                  </Pressable>
                ))}
              </View>
            </View>
            ))}
            {posts.length > 3 && (
              <Pressable onPress={() => setAllPosts(a => !a)} hitSlop={8} testID="you-posts-toggle" accessibilityRole="button">
                <Text style={s.monthLink}>{allPosts ? "Show top 3" : `Show all ${posts.length} videos`}</Text>
              </Pressable>
            )}
          </> : (
            <View style={s.empty}>
              <Text style={s.emptyText}>{dryRun ? "Dry run: approved videos don't go live." : "Nothing live yet."}</Text>
              {!dryRun && <PixelButton label="Open the Feed" size={20} bevel="green" onPress={() => router.navigate("/feed")} testID="you-open-feed" />}
            </View>
          )}
        </Block>

      </ScrollView>
    </View>
  );
}

type Earn = FunctionReturnType<typeof api.earnings.summary>;
type Post = Earn["posts"][number];
type Bounty = FunctionReturnType<typeof api.bounties.list>[number];

const pct = (x: number | null | undefined) => (x === null || x === undefined ? "–" : `${Math.round(x * 100)}%`);
export const ESTIMATE = "Estimated, not guaranteed, pending Whop review.";

// The taste score the user last saw on You, or the first one loaded this session (the header counters set it, so a
// score that moves on the Feed before You ever opens still climbs there). You counts up from it on focus.
let ackedScore: number | null = null;

// "$4 / 1K views" -> 4, and back as "$4/1K". Null for a bounty paid per post.
const rateOf = (label: string) => {
  const m = /^\$([\d.,]+) \/ 1K views$/.exec(label);
  return m ? Number(m[1].replace(/,/g, "")) : null;
};
const perK = (dollars: number) => `$${dollars}/1K`;

// The taste score and estimated pending earnings as header counters, for any screen's resource bar. Both count to a new
// value and bump. The pending figure is an estimate, so it always wears "est"; a provisional score wears "prov" instead
// of its tier. They live here rather than in Hud.tsx because src/ui imports Hud.
// `compact` drops the tier name from the tag (a provisional score still says "prov"), for a header that's short on room.
export function ScoreCounter({ device, onPress, compact, testID = "hud-score" }: { device: string; onPress?: () => void; compact?: boolean; testID?: string }) {
  const t = useQuery(api.earnings.summary, { deviceId: device })?.taste;
  const n = useTicker(t?.score ?? undefined);
  useEffect(() => {
    if (ackedScore === null && t?.score != null) ackedScore = Math.round(t.score);
  }, [t?.score]);
  const tier = t?.score === null || t?.score === undefined ? null : tierFor(t.score);
  return <Counter icon="star" value={!t ? "…" : n === undefined ? "–" : String(n)} testID={testID} onPress={onPress}
    tag={!tier ? undefined : t?.state === "calibrating" ? "prov" : compact ? undefined : tier.name}
    label={!t ? "Taste score loading" : !tier ? "No taste score yet"
      : `Taste score ${t.score}, ${tier.name}${t.state === "calibrating" ? ", provisional" : ""}`} />;
}

// Pending includes the forecast for approved clips no platform has counted yet, so it moves the moment a clip is approved.
export function PendingCounter({ device, onPress, testID = "hud-pending" }: { device: string; onPress?: () => void; testID?: string }) {
  const e = useQuery(api.earnings.summary, { deviceId: device });
  const total = e ? e.pendingCents + e.forecastCents : undefined;
  const n = useTicker(total);
  return <Counter icon="coin" value={n === undefined ? "…" : money(n)} tag="est" testID={testID} onPress={onPress}
    label={e ? `${money(e.pendingCents + e.forecastCents)} estimated pending${e.forecastCents ? `, ${money(e.forecastCents)} of it a forecast at your usual views` : ""}. ${ESTIMATE}` : "Pending earnings loading"} />;
}

// Under two days old a post's views are still climbing, so its verdict is "so far".
export const FRESH_MS = 2 * 86_400_000;

// Hit, Solid or Miss against the user's baseline.
export function Verdict({ post }: { post: Pick<Post, "verdict" | "ratio" | "liveAt"> | undefined | null }) {
  if (!post?.verdict || post.ratio === null) return null;
  return <VerdictBadge verdict={post.verdict} ratio={post.ratio} size="sm" reason={Date.now() - post.liveAt < FRESH_MS ? "so far" : undefined} />;
}

// The taste score as the hero: the number, its tier, a bar to the next tier and what that tier opens. Coming back to
// You after the score moved, the number counts up from the last one shown here and the bar slides; crossing into a new
// tier fills the old bar, then pops the unlock card with the bounties that just opened. The percentages, trend and how
// it's scored sit behind Details.
function Taste({ e, bounties, focused }: { e: Earn | undefined; bounties: Bounty[] | undefined; focused: boolean }) {
  const [details, setDetails] = useState(false);
  const raw = e?.taste.score;
  const score = raw === null || raw === undefined ? null : Math.round(raw);
  const [shown, setShown] = useState<number | null>(ackedScore ?? score);
  // The score the bar and badge hold at while the old tier's bar fills to the end.
  const [filling, setFilling] = useState<number | null>(null);
  const [unlock, setUnlock] = useState<{ from: number; to: number } | null>(null);
  const star = useAudioPlayer(require("../assets/sounds/star.wav"));

  useEffect(() => {
    if (score === null) return;
    if (ackedScore === null) ackedScore = score;
    if (!focused) return;
    const from = ackedScore;
    setShown(from);
    if (from === score) return;
    const crossed = tierFor(score).min > tierFor(from).min;
    const timers = [setTimeout(() => {
      setShown(score);
      if (crossed) setFilling(from);
      else ackedScore = score;
    }, 400)];
    if (crossed) timers.push(setTimeout(() => {
      ackedScore = score;
      setFilling(null);
      setUnlock({ from, to: score });
      feel("success");
      star.seekTo(0).catch(() => {});
      star.play();
    }, 1100));
    return () => timers.forEach(clearTimeout);
  }, [score, focused]);

  if (!e) return <Card loading testID="you-taste" style={s.cardGap} />;
  const t = e.taste;
  const pick = t.pickiness;
  // Only a lopsided swipe habit gets a line, since that's the one worth changing.
  const extreme = pick !== null && t.seenClips >= 5 && (pick >= 0.9 || pick <= 0.1);
  const at = filling ?? shown ?? score ?? 0;
  const tier = tierFor(at);
  const next = nextTier(at);
  const fill = filling !== null ? 1 : next ? (at - tier.min) / (next.min - tier.min) : 1;
  // What the next tier opens: the best locked bounty waiting for it, else the tier's own floor rate.
  const nextRate = next && Math.max(...(bounties ?? []).filter(b => b.locked && b.tier.key === next.key)
    .map(b => rateOf(b.rewardLabel) ?? 0), (TIER_STEPS.find(x => x.key === next.key)?.ratePer1kCents ?? 0) / 100);

  return (
    <>
      {unlock && <Unlocked key={unlock.to} unlock={unlock} bounties={bounties} onDismiss={() => setUnlock(null)} />}
      <View style={s.cardGap}>
      <Card title="Taste score" testID="you-taste">
        {score === null ? (
          <Text style={[s.tasteNote, s.center]} testID="you-taste-empty">Swipe 3 clips to get a score.</Text>
        ) : (
          <View style={s.hero} testID="you-tier">
            <View style={s.heroScore}>
              <NumberTicker value={shown ?? score} size={52} outlined={false} sound testID="you-tier-score" />
              <Text style={s.outOf}>/100</Text>
            </View>
            <View style={s.badgeRow}>
              <TierBadge score={at} testID="you-tier-badge" />
              {t.state === "calibrating" && <HonestyLabel kind="provisional" testID="you-taste-provisional" />}
            </View>
            <ProgressBar key={tier.key} value={fill} color={tier.color} height={16} style={s.heroBar} testID="you-tier-bar" />
            <Text style={s.nextLine} numberOfLines={1} adjustsFontSizeToFit testID="you-tier-next">
              {next ? `${next.min - at} to ${next.name} · unlocks ${perK(nextRate ?? 0)} bounties` : "Top tier"}
            </Text>
          </View>
        )}
        <Pressable onPress={() => setDetails(d => !d)} hitSlop={8} testID="you-taste-details" accessibilityRole="button">
          <Text style={[s.monthLink, s.center]}>{details ? "Hide details" : "Details"}</Text>
        </Pressable>
        {details && (
          <View testID="you-taste-more">
            <View style={s.stats}>
              <Stat label="Hit rate" value={pct(t.hitRate)} testID="you-hit-rate"
                a11y={t.scored ? `${t.hits} of ${t.scored} beat your baseline 1.5x` : "No posts scored yet"} />
              <Stat label="Approval" value={pct(t.approvalRate)} testID="you-approval-rate"
                a11y={t.settledSubmissions ? `Whop approved ${t.approvedSubmissions} of ${t.settledSubmissions}` : "Waiting on Whop"} />
              <Stat label="Pickiness" value={pct(pick)} testID="you-pickiness"
                a11y={pick === null ? "No swipes yet" : `Approved ${t.approvedClips} of ${t.seenClips} clips`} />
            </View>
            {e.tasteTrend !== 0 && (
              <Text style={[s.trend, s.center, { color: e.tasteTrend > 0 ? COLOR.greenDeep : COLOR.redDeep }]} testID="you-trend">
                {`${e.tasteTrend > 0 ? "▲ +" : "▼ "}${e.tasteTrend} since last visit`}
              </Text>
            )}
            {extreme && (
              <Text style={[s.tasteNote, s.warn, s.center]} testID="you-pickiness-note">
                {pick >= 0.9 ? "Skip the weak ones: approving everything lowers it." : "Approve the ones you'd watch."}
              </Text>
            )}
            <Text style={s.fine} testID="you-taste-fine">
              {`${t.state === "calibrating" ? `Provisional: ${t.scored} of ${t.needed} posts scored. ` : ""}Approval rate × views against your baseline, the median of your earlier posts${t.baselineFrom === "account" ? " (set for this account)" : ""}. A hit is 1.5x baseline, a miss under 0.8x. Approving 20–50% of clips is the sweet spot. Tiers: ${TIERS.map(x => x.name).join(", ")}. A tier only changes which bounties you can take; Whop sets what they pay.`}
            </Text>
          </View>
        )}
      </Card>
    </View>
    </>
  );
}

// The moment a new tier lands: its badge, "UNLOCKED", and the bounties it just opened, best paying first. It stays
// until dismissed or the next unlock replaces it.
function Unlocked({ unlock, bounties, onDismiss }: { unlock: { from: number; to: number }; bounties: Bounty[] | undefined; onDismiss: () => void }) {
  const from = tierFor(unlock.from).min;
  const to = tierFor(unlock.to);
  const opened = (bounties ?? []).filter(b => !b.locked && !b.taken && b.tier.min > from && b.tier.min <= to.min)
    .map(b => ({ id: b.id, brand: b.brand || b.title, rate: rateOf(b.rewardLabel), label: b.rewardLabel }))
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0)).slice(0, 3);
  const toBoard = () => router.navigate("/bounties");
  return (
    <Animated.View entering={ZoomIn.springify().damping(10).mass(1).stiffness(180)} exiting={FadeOut} style={s.cardGap}>
      <Block bevel="gold" lift={4} style={s.unlock} testID="you-unlock">
        <View style={s.unlockHead} accessible accessibilityLabel={`${to.name} unlocked`}>
          <TierBadge score={unlock.to} testID="you-unlock-tier" />
          <Outlined size={40} width={3}>UNLOCKED</Outlined>
        </View>
        {opened.length > 0 ? opened.map(b => (
          <Pressable key={b.id} onPress={toBoard} style={({ pressed }) => [s.unlockRow, pressed && { opacity: 0.7 }]}
            testID="you-unlock-bounty" accessibilityRole="button" accessibilityLabel={`${b.brand}, ${b.label}, open`}>
            <View>
              <Image source={ICON.lock} style={s.unlockLock} />
              <Image source={ICON.check} style={s.unlockCheck} />
            </View>
            <Text style={s.unlockText} numberOfLines={1}>{`${b.brand} · ${b.rate === null ? b.label : perK(b.rate)}`}</Text>
          </Pressable>
        )) : <Text style={s.unlockNote}>New bounties are open on the board.</Text>}
        <Button label="Take it" bevel="green" feel="commit" onPress={toBoard} testID="you-unlock-take" />
        <Pressable onPress={onDismiss} hitSlop={8} testID="you-unlock-dismiss" accessibilityRole="button">
          <Text style={s.unlockDismiss}>Not now</Text>
        </Pressable>
      </Block>
    </Animated.View>
  );
}

// A number over its name, centered on the card itself rather than boxed. The detail behind it goes to VoiceOver.
function Stat({ label, value, a11y, testID }: { label: string; value: string; a11y: string; testID: string }) {
  return (
    <View style={s.stat} testID={testID} accessible accessibilityLabel={`${label} ${value}. ${a11y}`}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const STATUS: Record<string, { text: string; tone: Tone }> = {
  manual: { text: "NOT ON WHOP YET", tone: "orange" },
  pending: { text: "SUBMITTING", tone: "gold" },
  submitted: { text: "SUBMITTED", tone: "slate" },
  approved: { text: "APPROVED", tone: "green" },
  denied: { text: "DENIED", tone: "red" },
  failed: { text: "FAILED", tone: "red" },
};

// Estimated pending (with the forecast for approved clips not counted yet) and approved money. Only posts that need
// the user show up front: the ones to submit on Whop. Every other bounty post is one tap away.
function Earnings({ e, device }: { e: Earn | undefined; device: string }) {
  const [all, setAll] = useState(false);
  const rows = e?.perVideo ?? [];
  const todo = rows.filter(r => r.status === "manual");
  const rest = rows.filter(r => r.status !== "manual");
  return (
    <View style={s.cardGap}>
      <Card title="Earnings" loading={!e} testID="you-earnings">
      <View style={s.moneyRow}>
        <View>
          <NumberTicker value={e ? e.pendingCents + e.forecastCents : undefined} format={money} size={40} outlined={false}
            color={COLOR.greenDeep} testID="you-pending" />
          <View style={s.pendingRow}>
            <Text style={s.moneyLabel}>pending</Text>
            <HonestyLabel kind="estimated" testID="you-earnings-label" />
          </View>
        </View>
        <View style={s.moneyRight}>
          <NumberTicker value={e?.approvedCents} format={money} size={26} outlined={false} delta={false} testID="you-approved" />
          <Text style={s.moneyLabel}>approved</Text>
        </View>
      </View>
      {!!e?.forecastCents && (
        <Text style={s.forecastLine} testID="you-earnings-forecast">{`${money(e.forecastCents)} of it is a forecast at your usual views`}</Text>
      )}
      {rows.length === 0 && <Text style={[s.emptyText, s.earnEmpty]}>No bounty posts live yet.</Text>}
      {todo.map(r => <EarnRow key={r.videoId} r={r} device={device} compact />)}
      {rest.length > 0 && (
        <Pressable onPress={() => setAll(a => !a)} hitSlop={8} testID="you-earnings-toggle" accessibilityRole="button">
          <Text style={[s.monthLink, s.center]}>{all ? "Hide posts" : `See ${rest.length} post${rest.length === 1 ? "" : "s"}`}</Text>
        </Pressable>
      )}
      {all && rest.map(r => <EarnRow key={r.videoId} r={r} device={device} />)}
    </Card>
    </View>
  );
}

// One bounty video. `compact` (a post waiting on the user) is its brand and estimate, then the "Submit on Whop" flow:
// the campaign page full width, then copying the post link to paste there and "I submitted it". A video posted to both
// platforms has a row per post, so the flow repeats until none is left. The full row adds its title, views and where
// its submission stands. A submission the user reported themselves is a label, not a Whop-confirmed status. A Whop
// Bounty submits itself; its one note line says why it is still waiting or why Whop refused it (then the steps show).
function EarnRow({ r, device, compact: short }: { r: Earn["perVideo"][number]; device: string; compact?: boolean }) {
  const sub = useQuery(api.submit.forVideo, { deviceId: device, videoId: r.videoId });
  const mark = useMutation(api.submit.markSubmitted);
  const [busy, setBusy] = useState(false);
  const status = sub?.status ?? r.status;
  const st = status ? STATUS[status] : null;
  return (
    <View style={s.earnRow} testID="you-earning">
      <View style={s.earnHead}>
        <Text style={s.brand} numberOfLines={1}>{r.brand || "Bounty"}</Text>
        {!short && <Verdict post={r} />}
        <Text style={s.earnCents}>{money(r.estCents)}</Text>
      </View>
      {!short && (
        <Pressable style={({ pressed }) => [s.earnHead, pressed && { opacity: 0.7 }]} disabled={!r.url}
          onPress={() => r.url && Linking.openURL(r.url)} accessibilityRole={r.url ? "link" : undefined}>
          <Text style={s.earnTitle} numberOfLines={1}>{r.title}</Text>
          <Image source={ICON.eye} style={s.postEye} />
          <Text style={s.earnViews}>{compact(r.views)}</Text>
          {status === "submitted" && sub?.selfReported ? <Text style={s.selfReported} testID="you-earning-self">Submitted by you</Text>
            : <Badge label={st?.text ?? "NOT SUBMITTED"} tone={st?.tone ?? "parch"} size="sm" />}
        </Pressable>
      )}
      {!short && status === "denied" && sub?.denialReason ? <Text style={s.denied}>{`Denied: ${sub.denialReason}`}</Text> : null}
      {sub?.auto && sub.note && (status === "pending" || status === "manual") ? <Text style={s.note} numberOfLines={1} testID="you-submit-note">{sub.note}</Text> : null}
      {sub?.status === "manual" && (
        <View style={s.submit} testID="you-submit">
          <Button label="Submit on Whop" size="md" bevel="green" testID="you-submit-whop"
            onPress={() => WebBrowser.openBrowserAsync(sub.deepLink).catch(() => {})} />
          <View style={s.submitButtons}>
            <Button label="Copy link" size="sm" variant="secondary" feel="tap" style={s.flex} testID="you-submit-copy"
              accessibilityLabel={`Copy or share the post link ${sub.postUrl}`}
              onPress={() => { Share.share({ url: sub.postUrl, message: sub.postUrl }).catch(() => {}); }} />
            <Button label="I submitted it" size="sm" variant="secondary" style={s.flex} loading={busy} loadingLabel="Saving"
              onPress={() => { setBusy(true); mark({ deviceId: device, videoId: r.videoId }).finally(() => setBusy(false)); }}
              testID="you-submit-done" />
          </View>
        </View>
      )}
    </View>
  );
}

// Two frames swapped a few times a second, so the flame flickers like a sprite.
export function Flame({ size }: { size?: number }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => 1 - f), 260);
    return () => clearInterval(t);
  }, []);
  return <Image source={frame ? ICON.flame2 : ICON.flame} style={[s.flame, size ? { width: size, height: size } : null]} />;
}

// One day of this week. Today pulses until a video is approved.
function Day({ letter, date, lit, frozen, future, today, pulse }:
  { letter: string; date: number; lit: boolean; frozen: boolean; future: boolean; today: boolean; pulse: boolean }) {
  const glow = useSharedValue(1);
  useEffect(() => {
    glow.value = pulse ? withRepeat(withSequence(withTiming(1.12, { duration: 520 }), withTiming(1, { duration: 520 })), -1) : withTiming(1);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: glow.value }] }));
  return (
    <View style={s.day}>
      <Text style={[s.dayLetter, today && s.dayLetterToday]}>{letter}</Text>
      <Animated.View style={[s.dayBox, lit && s.lit, frozen && s.frozen, future && s.future, today && s.today, style]}
        testID={lit ? "you-day-lit" : undefined}>
        {lit ? <Image source={ICON.flame} style={s.dayFlame} />
          : frozen ? <Image source={ICON.ice} style={s.dayFlame} />
          : <Text style={s.date}>{date}</Text>}
      </Animated.View>
    </View>
  );
}

// The streak's checkpoints as a path: each bar fills toward its milestone from the one before, and a reached
// milestone turns gold with a flame on it. The next one is outlined, with how many days are left. The streak banner
// in the Feed shows it too.
// `reached` is a milestone hit just now: its node pops once the banner it sits in has landed, and `onReach` fires with
// the pop for the sound.
export function Milestones({ streak, reached, onReach }: { streak: number; reached?: number; onReach?: () => void }) {
  const next = MILESTONES.find(m => m > streak);
  const left = next ? next - streak : 0;
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!reached) return;
    pop.value = withDelay(450, withSequence(withTiming(1.4, { duration: 180 }), withSpring(1, POP)));
    const t = setTimeout(() => onReach?.(), 450);
    return () => clearTimeout(t);
  }, [reached]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <View style={s.miles} testID="you-milestones">
      <View style={s.mileRow}>
        {MILESTONES.map((m, i) => {
          const from = i === 0 ? 0 : MILESTONES[i - 1];
          const fill = Math.max(0, Math.min(1, (streak - from) / (m - from)));
          return (
            // The reached leg draws above the next one, so the next leg's track doesn't cover the node as it pops.
            <View key={m} style={[s.mileLeg, m === reached && { zIndex: 1 }]}>
              <View style={s.track}><View style={[s.trackFill, { width: `${fill * 100}%` }]} /></View>
              <Animated.View style={[s.mile, streak >= m && s.mileHit, m === next && s.mileNext, m === reached && popStyle]}>
                <Text style={s.mileNum}>{m}</Text>
                {streak >= m && <Image source={ICON.flame} style={s.mileFlame} />}
              </Animated.View>
            </View>
          );
        })}
      </View>
      <Text style={s.mileLine}>
        {next ? `${left} more day${left === 1 ? "" : "s"} to a ${next}-day streak` : "Every milestone reached. Keep it going."}
      </Text>
    </View>
  );
}

function Tile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Block style={s.tile} depth={3} lift={3}>
      <Image source={ICON[icon]} style={s.tileIcon} />
      <Text style={s.tileValue}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </Block>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: DEEP },
  cardGap: { marginHorizontal: 16, marginTop: 16 },
  center: { textAlign: "center" },
  hero: { alignItems: "center", gap: 8 },
  heroScore: { flexDirection: "row", alignItems: "flex-end" },
  outOf: { color: PARCH.soft, fontSize: 20, fontFamily: FONT.bold, marginBottom: 12, marginLeft: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroBar: { alignSelf: "stretch", marginTop: 4 },
  nextLine: { color: PARCH.ink, fontSize: 18, fontFamily: FONT.semi, textAlign: "center" },
  unlock: { padding: 16, gap: 10 },
  unlockHead: { alignItems: "center", gap: 4 },
  unlockRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: PARCH.top, borderWidth: 2, borderColor: INK, paddingHorizontal: 10, paddingVertical: 6 },
  unlockLock: { width: 28, height: 28, opacity: 0.55 },
  unlockCheck: { position: "absolute", right: -6, bottom: -4, width: 18, height: 18 },
  unlockText: { flex: 1, color: PARCH.ink, fontSize: 22, fontFamily: FONT.bold },
  unlockNote: { color: PARCH.ink, fontSize: 18, fontFamily: FONT.semi, textAlign: "center" },
  unlockDismiss: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.bold, textAlign: "center" },
  forecastLine: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi, marginBottom: 4 },
  trend: { fontSize: 17, fontFamily: FONT.bold, marginTop: 8 },
  tasteNote: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi, marginTop: 8 },
  warn: { color: "#B04A10" },
  stats: { flexDirection: "row", marginTop: 14, paddingTop: 10, borderTopWidth: 2, borderTopColor: PARCH.bottom },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: PARCH.ink, fontSize: 30, fontFamily: FONT.bold },
  statLabel: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi, marginTop: -4 },
  fine: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi, marginTop: 8, lineHeight: 19 },
  moneyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 },
  moneyRight: { alignItems: "flex-end" },
  moneyLabel: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -2 },
  earnEmpty: { marginTop: 6 },
  earnRow: { paddingVertical: 8, gap: 4, borderTopWidth: 2, borderTopColor: PARCH.bottom },
  earnHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: { color: PARCH.ink, fontSize: 18, fontFamily: FONT.bold, flexShrink: 1 },
  earnCents: { marginLeft: "auto", color: "#2F8A2C", fontSize: 18, fontFamily: FONT.bold },
  earnTitle: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi, flex: 1 },
  earnViews: { color: PARCH.ink, fontSize: 15, fontFamily: FONT.bold },
  selfReported: { color: PARCH.soft, fontSize: 14, fontFamily: FONT.semi, fontStyle: "italic" },
  denied: { color: "#8A3A32", fontSize: 15, fontFamily: FONT.semi },
  note: { color: PARCH.soft, fontSize: 14, fontFamily: FONT.semi },
  submit: { marginTop: 4, gap: 8 },
  submitButtons: { flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  card: { marginHorizontal: 16, marginTop: 16, padding: 14, paddingBottom: 18 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  flame: { width: 72, height: 72 },
  heroLabel: { color: PARCH.ink, fontSize: 20, fontFamily: FONT.bold, marginTop: -12 },
  todayChip: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: INK },
  chipDone: { backgroundColor: "#A6EC7C" },
  chipTodo: { backgroundColor: "#FFB070" },
  chipIcon: { width: 18, height: 18 },
  chipText: { color: PARCH.ink, fontSize: 16, fontFamily: FONT.bold },
  strip: { flexDirection: "row", gap: GAP, marginTop: 14 },
  day: { width: CELL, alignItems: "center" },
  dayLetter: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.bold, marginBottom: 4 },
  dayLetterToday: { color: "#F07A2A" },
  dayBox: { width: CELL, height: CELL, backgroundColor: PARCH.bottom, borderWidth: 2, borderColor: INK, alignItems: "center", justifyContent: "center" },
  dayFlame: { width: CELL - 14, height: CELL - 14 },
  freezeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  ice: { width: 26, height: 26 },
  freeze: { flex: 1, color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi, marginLeft: 2 },
  monthLink: { color: "#B04A10", fontSize: 17, fontFamily: FONT.bold, marginTop: 12 },
  week: { flexDirection: "row", gap: GAP, marginTop: 10, marginBottom: 6 },
  weekday: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.bold, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  cell: { width: CELL },
  box: { height: CELL, backgroundColor: PARCH.bottom, borderWidth: 2, borderColor: INK, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  lit: { backgroundColor: GOLD },
  gridMarkSmall: { width: CELL - 24, height: CELL - 24 },
  frozen: { backgroundColor: ICE },
  future: { opacity: 0.35 },
  otherMonth: { opacity: 0.45 },
  monthTitle: { color: PARCH.ink, fontSize: 19, fontFamily: FONT.bold, marginTop: 10 },
  monthTag: { color: PARCH.ink, fontSize: TYPE.tag, fontFamily: FONT.bold, marginBottom: -3 },
  today: { borderWidth: 3, borderColor: "#F07A2A" },
  date: { color: PARCH.ink, fontSize: 16, fontFamily: FONT.bold },
  plaque: { marginTop: 24 },
  post: { paddingVertical: 9, gap: 6, borderTopWidth: 2, borderTopColor: PARCH.bottom },
  firstPost: { borderTopWidth: 0, paddingTop: 0 },
  postHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  topTag: { backgroundColor: GOLD, borderWidth: 2, borderColor: INK, paddingHorizontal: 5 },
  topText: { color: INK, fontSize: 13, fontFamily: FONT.bold },
  postTitle: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.semi, flex: 1 },
  plats: { flexDirection: "row", gap: 8 },
  plat: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: PARCH.top, borderWidth: 2, borderColor: PARCH.bottom, paddingHorizontal: 7, paddingVertical: 2 },
  platMark: { width: 18, height: 18 },
  platName: { color: PARCH.soft, fontSize: 14, fontFamily: FONT.semi, marginRight: 2 },
  postEye: { width: 16, height: 16 },
  postViews: { color: "#2F8A2C", fontSize: 16, fontFamily: FONT.bold },
  zero: { color: PARCH.soft },
  pending: { color: PARCH.soft, fontSize: 14, fontFamily: FONT.semi },
  empty: { gap: 12, paddingTop: 4 },
  emptyText: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.semi },
  tiles: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 16 },
  tile: { flex: 1, alignItems: "center", paddingTop: 10, paddingBottom: 14 },
  tileIcon: { width: 28, height: 28 },
  tileValue: { color: PARCH.ink, fontSize: 37, fontFamily: FONT.bold, marginTop: 2 },
  tileLabel: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi },
  miles: { marginTop: 16 },
  mileRow: { flexDirection: "row", alignItems: "center" },
  mileLeg: { flex: 1, flexDirection: "row", alignItems: "center" },
  track: { flex: 1, height: 12, marginRight: -2, backgroundColor: PARCH.bottom, borderWidth: 2, borderColor: INK, overflow: "hidden" },
  trackFill: { height: "100%", backgroundColor: GOLD },
  mile: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: PARCH.bottom, borderWidth: 2, borderColor: INK },
  mileHit: { backgroundColor: GOLD },
  mileNext: { borderWidth: 3, borderColor: "#F07A2A" },
  mileFlame: { position: "absolute", top: -20, width: 20, height: 20 },
  mileNum: { color: PARCH.ink, fontSize: 18, fontFamily: FONT.bold },
  mileLine: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.semi, marginTop: 8 },
  // The one line under the tiles sits on the water with a hard ink shadow, quieter than the tiles above it.
  footnote: {
    alignSelf: "center", color: "#F5E6C8", fontSize: 16, fontFamily: FONT.semi, marginHorizontal: 16, marginTop: 10,
    textAlign: "center", textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0,
  },
});
