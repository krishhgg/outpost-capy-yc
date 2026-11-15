import { useEffect, useState, type ReactNode } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Outlined, Sea, WoodHeader } from "../pixel";
import { ICON } from "../Hud";
import {
  Badge, Button, Card, CardRow, Chip, ChipRow, COLOR, DEEP, DemoNote, EmptyState, FONT, HonestyLabel, ModeBadge, money,
  NumberTicker, PARCH, ProgressBar, ProgressPill, ProgressSteps, SectionHeader, TierBadge, TierProgress, Toast, useToast,
  VerdictBadge,
} from ".";

// Every primitive in its states, on the water and on parchment, so screen threads can see what they get and device
// tests can screenshot it. Reach it at outpost://ui-gallery, or outpost://ui-gallery?only=badges for one section.
const SECTIONS = ["buttons", "chips", "badges", "numbers", "progress", "tiers", "cards", "empty", "toast", "demo"] as const;
type Section = (typeof SECTIONS)[number];

export function Gallery() {
  const param = useLocalSearchParams<{ only?: string }>().only;
  const [only, setOnly] = useState<Section | null>(SECTIONS.includes(param as Section) ? (param as Section) : null);
  const toast = useToast();
  const show = (k: Section) => only === null || only === k;
  return (
    <View style={s.fill} testID="ui-gallery">
      <Sea />
      <WoodHeader title="UI KIT" sub="Outpost's shared primitives"
        right={<Button label="Done" size="sm" variant="secondary" feel="tap" testID="gallery-done"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />}
        below={(
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filter} contentContainerStyle={s.filterRow}>
            <Chip label="All" size="md" feel="tap" selected={only === null} onPress={() => setOnly(null)} testID="gallery-filter-all" />
            {SECTIONS.map(k => (
              <Chip key={k} label={k[0].toUpperCase() + k.slice(1)} size="md" feel="tap" selected={only === k}
                onPress={() => setOnly(k)} testID={`gallery-filter-${k}`} />
            ))}
          </ScrollView>
        )} />
      <ScrollView style={s.fill} contentContainerStyle={s.list} testID="gallery-scroll">
        {show("buttons") && <Buttons />}
        {show("chips") && <Chips />}
        {show("badges") && <Badges />}
        {show("numbers") && <Numbers />}
        {show("progress") && <Progress />}
        {show("tiers") && <Tiers />}
        {show("cards") && <Cards />}
        {show("empty") && <Empties />}
        {show("toast") && <Toasts onShow={() => toast.show({
          title: "5 clips ready for Notion", body: "Swipe them while the bounty has budget", who: "director",
          action: { label: "Swipe", onPress: () => {} }, testID: "gallery-live-toast",
        })} />}
        {show("demo") && <Demo />}
      </ScrollView>
      {toast.node}
    </View>
  );
}

function Group({ id, title, sub, children }: { id: Section; title: string; sub: string; children: ReactNode }) {
  return (
    <View style={s.section} testID={`gallery-${id}`}>
      <SectionHeader title={title} sub={sub} />
      {children}
    </View>
  );
}

// Pressing Take shows the loading state for a moment, as it would while the mutation runs.
function Buttons() {
  const [busy, setBusy] = useState(false);
  const take = () => { setBusy(true); setTimeout(() => setBusy(false), 1500); };
  return (
    <Group id="buttons" title="Buttons" sub="Primary, secondary, any bevel. Press sound + haptic.">
      <Card>
        <View style={s.stack}>
          <Button label="Take bounty" onPress={take} loading={busy} loadingLabel="Taking" feel="commit" testID="gallery-button-primary" />
          <View style={s.pair}>
            <Button label="Maybe later" variant="secondary" size="md" onPress={() => {}} style={s.flex} testID="gallery-button-secondary" />
            <Button label="Collect" bevel="green" size="md" icon="coin" onPress={() => {}} style={s.flex} testID="gallery-button-green" />
          </View>
          <View style={s.pair}>
            <Button label="Taken" size="md" disabled onPress={() => {}} style={s.flex} testID="gallery-button-disabled" />
            <Button label="Posting" bevel="teal" size="md" loading onPress={() => {}} style={s.flex} testID="gallery-button-loading" />
          </View>
          <View style={s.wrapRow}>
            <Button label="Small" size="sm" onPress={() => {}} />
            <Button label="Remake" size="sm" bevel="orange" onPress={() => {}} />
            <Button label="Skip" size="sm" variant="secondary" onPress={() => {}} />
          </View>
        </View>
      </Card>
    </Group>
  );
}

// Tapping an idle chip sends it: pending for a moment, then selected, the way an edit queues a remake.
function Chips() {
  const [state, setState] = useState<Record<string, "idle" | "pending" | "selected">>({ hook: "idle", short: "selected", look: "pending" });
  const send = (k: string) => {
    setState(st => ({ ...st, [k]: "pending" }));
    setTimeout(() => setState(st => ({ ...st, [k]: "selected" })), 1400);
  };
  const chip = (k: string, label: string) => (
    <Chip key={k} label={label} selected={state[k] === "selected"} pending={state[k] === "pending"} pendingLabel="Remaking"
      onPress={() => send(k)} testID={`gallery-chip-${k}`} />
  );
  return (
    <Group id="chips" title="Edit chips" sub="Big and one-tap. Idle, selected, pending, disabled.">
      <View style={s.videoish}>
        <ChipRow>
          {chip("hook", "Punchier hook")}
          {chip("short", "Shorter")}
          {chip("look", "New look")}
          <Chip label="Say more" icon="glass" disabled onPress={() => {}} testID="gallery-chip-disabled" />
        </ChipRow>
      </View>
      <Card>
        <Text style={s.caption}>md size, for filters</Text>
        <ChipRow>
          <Chip label="All" size="md" selected onPress={() => {}} />
          <Chip label="Clip" size="md" onPress={() => {}} />
          <Chip label="Original" size="md" onPress={() => {}} />
        </ChipRow>
      </Card>
    </Group>
  );
}

function Badges() {
  return (
    <Group id="badges" title="Badges" sub="Flat tags: never pressable. Mode, verdict, status, honesty.">
      <Card>
        <View style={s.stack}>
          <Text style={s.caption}>Mode</Text>
          <View style={s.wrapRow}><ModeBadge mode="clip" testID="gallery-mode-clip" /><ModeBadge mode="original" testID="gallery-mode-original" /></View>
          <Text style={s.caption}>Verdict vs baseline views</Text>
          <VerdictBadge verdict="hit" ratio={2.1} testID="gallery-verdict-hit" />
          <VerdictBadge verdict="solid" ratio={1.1} testID="gallery-verdict-solid" />
          <VerdictBadge verdict="miss" ratio={0.6} reason="Hook too slow" testID="gallery-verdict-miss" />
          <Text style={s.caption}>Status</Text>
          <View style={s.wrapRow}>
            <Badge label="Taken" tone="green" icon="check" />
            <Badge label="Submitted" tone="slate" />
            <Badge label="Approved +$3" tone="gold" icon="coin" />
            <Badge label="Denied" tone="red" />
            <Badge label="Dry run" tone="parch" />
          </View>
          <Text style={s.caption}>Honesty labels</Text>
          <HonestyLabel kind="forecast" detail testID="gallery-honesty-forecast" />
          <HonestyLabel kind="estimated" detail testID="gallery-honesty-estimated" />
          <HonestyLabel kind="seeded" detail testID="gallery-honesty-seeded" />
          <HonestyLabel kind="provisional" detail testID="gallery-honesty-provisional" />
        </View>
      </Card>
    </Group>
  );
}

// The numbers move by themselves every few seconds so the count and the delta flash can be seen, and the buttons
// move them on demand.
function useDrift() {
  const [n, setN] = useState({ views: 12480, cents: 1840, score: 52, step: 0 });
  const bump = (d: number) => setN(v => ({ views: v.views + (d > 0 ? 1320 : 0), cents: v.cents + (d > 0 ? 240 : -120), score: Math.max(0, Math.min(100, v.score + d)), step: v.step + 1 }));
  useEffect(() => {
    const t = setInterval(() => setN(v => {
      const d = v.step % 2 === 0 ? 4 : -2;
      return { views: v.views + (d > 0 ? 1320 : 0), cents: v.cents + (d > 0 ? 240 : -120), score: Math.max(0, Math.min(100, v.score + d)), step: v.step + 1 };
    }), 3200);
    return () => clearInterval(t);
  }, []);
  return { ...n, bump };
}

function Numbers() {
  const { views, cents, score, bump } = useDrift();
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 2500); return () => clearTimeout(t); }, []);
  return (
    <Group id="numbers" title="Number ticker" sub="Counts to the new value and flashes +4 / -2.">
      <View style={s.hud}>
        <Stat icon="eye" label="views"><NumberTicker value={views} size={26} testID="gallery-ticker-views" /></Stat>
        <Stat icon="coin" label="pending"><NumberTicker value={cents} format={money} size={26} testID="gallery-ticker-money" /></Stat>
        <Stat icon="check" label="loading"><NumberTicker value={loading ? undefined : 7} size={26} testID="gallery-ticker-loading" /></Stat>
      </View>
      <Card>
        <View style={s.tickerRow}>
          <View>
            <Text style={s.caption}>Taste score</Text>
            <NumberTicker value={score} size={56} outlined={false} sound testID="gallery-ticker-score" />
          </View>
          <View style={s.stackTight}>
            <Button label="+4" size="sm" bevel="green" onPress={() => bump(4)} testID="gallery-ticker-up" />
            <Button label="-2" size="sm" bevel="orange" onPress={() => bump(-2)} testID="gallery-ticker-down" />
          </View>
        </View>
        <HonestyLabel kind="estimated" detail="Pending $ is estimated, not guaranteed" />
      </Card>
    </Group>
  );
}

function Stat({ icon, label, children }: { icon: keyof typeof ICON; label: string; children: ReactNode }) {
  return (
    <View style={s.stat}>
      <Image source={ICON[icon]} style={s.statIcon} />
      <View>{children}<Text style={s.statLabel}>{label}</Text></View>
    </View>
  );
}

function Progress() {
  const [made, setMade] = useState(2);
  useEffect(() => { const t = setInterval(() => setMade(m => (m >= 5 ? 0 : m + 1)), 1800); return () => clearInterval(t); }, []);
  return (
    <Group id="progress" title="Progress" sub="Background jobs that never block the user.">
      <Card>
        <View style={s.stack}>
          <ProgressPill label="Queued" state="waiting" testID="gallery-pill-waiting" />
          <ProgressPill label="Downloading footage" state="working" testID="gallery-pill-downloading" />
          <ProgressPill label={made >= 5 ? "5 clips ready" : `Making ${made + 1} of 5`} state={made >= 5 ? "done" : "working"} done={made} total={5} testID="gallery-pill-making" />
          <ProgressPill label="Ready" state="done" testID="gallery-pill-ready" />
          <ProgressPill label="Footage needs a login" state="failed" testID="gallery-pill-failed" />
          <Text style={s.caption}>Steps</Text>
          <ProgressSteps steps={["Footage", "Making 2 of 5", "Ready"]} current={1} testID="gallery-steps-making" />
          <ProgressSteps steps={["Footage", "Making", "Ready"]} current={3} testID="gallery-steps-done" />
          <ProgressSteps steps={["Footage blocked", "Making", "Ready"]} current={0} failed testID="gallery-steps-failed" />
          <Text style={s.caption}>Bar</Text>
          <ProgressBar value={made / 5} color={COLOR.green} testID="gallery-bar" />
        </View>
      </Card>
    </Group>
  );
}

function Tiers() {
  const { score } = useDrift();
  return (
    <Group id="tiers" title="Taste tiers" sub="Settler 0-39 · Curator 40-59 · Showrunner 60-79 · Tastemaker 80+">
      <View style={s.wrapRow}>
        <TierBadge score={20} testID="gallery-tier-settler" />
        <TierBadge score={45} testID="gallery-tier-curator" />
        <TierBadge score={70} testID="gallery-tier-showrunner" />
        <TierBadge score={90} testID="gallery-tier-tastemaker" />
      </View>
      <Card><TierProgress score={score} testID="gallery-tier-live" /></Card>
      <Card><TierProgress score={46} calibrating={{ scored: 3, needed: 5 }} testID="gallery-tier-calibrating" /></Card>
      <Card><TierProgress score={undefined} testID="gallery-tier-loading" /></Card>
    </Group>
  );
}

// A bounty card composed from the primitives, the way the Bounties screen can build it.
function Cards() {
  const [taken, setTaken] = useState(false);
  return (
    <Group id="cards" title="Cards" sub="Game-board panels: bounties, lists, loading.">
      <Card title="NOTION" sub="Whop bounty" testID="gallery-card-bounty">
        <View style={s.stack}>
          <View style={s.wrapRow}><ModeBadge mode="clip" /><HonestyLabel kind="seeded" /></View>
          <Text style={s.bountyTitle}>Clip the Notion AI launch keynote into 30s shorts</Text>
          <View style={s.reward}>
            <Outlined size={34} width={2.5} color={COLOR.gold}>$3</Outlined>
            <Text style={s.rewardUnit}>per 1K views</Text>
          </View>
          <Text style={s.caption}>$2,400 budget left · 41 spots · you'd make 5 clips</Text>
          {taken ? <ProgressSteps steps={["Footage", "Making 2 of 5", "Ready"]} current={1} /> : null}
          <Button label={taken ? "Taken" : "Take"} bevel="green" disabled={taken} feel="commit" onPress={() => setTaken(true)} testID="gallery-card-take" />
        </View>
      </Card>
      <Card title="LIVE NOW" testID="gallery-card-list">
        <CardRow first image={require("../../assets/ui/ig.png")} title="Notion AI in 30 seconds" sub="Instagram · 2 days" right={<VerdictBadge verdict="hit" ratio={2.4} size="sm" />} />
        <CardRow image={require("../../assets/ui/yt.png")} title="The doc that writes itself" sub="YouTube · 1 day" right={<VerdictBadge verdict="solid" ratio={1.0} size="sm" />} />
        <CardRow image={require("../../assets/ui/ig.png")} title="Stop taking meeting notes" sub="Instagram · 6 hours" right={<VerdictBadge verdict="miss" ratio={0.4} size="sm" />} onPress={() => {}} />
      </Card>
      <Card loading testID="gallery-card-loading" />
    </Group>
  );
}

function Empties() {
  return (
    <Group id="empty" title="Empty and loading" sub="Never a blank screen.">
      <EmptyState who="courier" title="No bounties yet" body="The courier checks Whop every 15 minutes. Seeded bounties show up here too."
        action={{ label: "Check now", onPress: () => {}, testID: "gallery-empty-action" }} testID="gallery-empty" />
      <EmptyState who="writer" title="Loading bounties" loading testID="gallery-empty-loading" />
      <EmptyState icon="play" title="All caught up" body="New clips land here as the studio finishes them." testID="gallery-empty-icon" />
    </Group>
  );
}

function Toasts({ onShow }: { onShow: () => void }) {
  return (
    <Group id="toast" title="Toast" sub="An in-app nudge from under the status bar.">
      <Toast inline title="5 clips ready for Notion" body="Swipe them while the bounty has budget" who="director"
        action={{ label: "Swipe", onPress: () => {} }} testID="gallery-toast-inline" />
      <Toast inline title="Remade: punchier hook" icon="check" testID="gallery-toast-plain" />
      <Button label="Show a live toast" variant="secondary" size="md" onPress={onShow} testID="gallery-toast-show" />
    </Group>
  );
}

function Demo() {
  return (
    <Group id="demo" title="Demo note" sub="The v1 disclosure. Small, calm, always visible.">
      <DemoNote testID="gallery-demo-water" />
      <Card><DemoNote on="card" testID="gallery-demo-card" /></Card>
    </Group>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: DEEP },
  flex: { flex: 1 },
  filter: { marginTop: 10, marginHorizontal: -16 },
  filterRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 2 },
  list: { padding: 12, paddingBottom: 60, gap: 28 },
  section: { gap: 12 },
  stack: { gap: 10 },
  stackTight: { gap: 8 },
  pair: { flexDirection: "row", gap: 10 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  caption: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi },
  videoish: { backgroundColor: "#141018", borderWidth: 3, borderColor: "#24152B", padding: 12 },
  hud: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statIcon: { width: 28, height: 28 },
  statLabel: { color: COLOR.foam, fontSize: 14, fontFamily: FONT.semi, marginTop: -4 },
  tickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  bountyTitle: { color: PARCH.ink, fontSize: 21, fontFamily: FONT.bold, lineHeight: 24 },
  reward: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  rewardUnit: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.semi, marginBottom: 6 },
});
