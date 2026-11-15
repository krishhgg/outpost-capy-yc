import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useAudioPlayer } from "expo-audio";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { ICON } from "./Hud";
import { Outlined, Sea, WoodHeader } from "./pixel";
import { Badge, Button, Card, COLOR, DEEP, DemoNote, EmptyState, FONT, INK, ModeBadge, PARCH, ProgressPill, feel } from "./ui";

// T2's list adds what the studio makes for a bounty, its campaign page and its demo library's progress. They are
// optional here so the board still draws from a list without them.
type Bounty = FunctionReturnType<typeof api.bounties.list>[number] & Partial<{
  pregenerated: boolean;
  progress: { ready: number; total: number };
  makes: string;
  url: string;
}>;

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
        {!list ? (
          <View testID="bounties-loading">
            {[0, 1].map(i => <View key={i} style={s.slot}><Card loading /></View>)}
          </View>
        ) : list.length === 0 ? (
          <View style={s.slot}>
            <EmptyState who="courier" title="The board is empty" testID="bounties-empty"
              body="No open campaigns right now. New Whop Content Rewards campaigns show up here as the board refreshes."
              action={{ label: "Back to Base", onPress: () => router.navigate("/"), testID: "bounties-empty-base" }} />
          </View>
        ) : list.map(b => <BountyCard key={b.id} b={b} failed={failed === b.id} onTake={() => onTake(b)} />)}
        {list && list.length > 0 && (
          <Text style={s.footnote}>Real campaigns from Whop Content Rewards. Rates and budgets are the brand's own.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function BountyCard({ b, failed, onTake }: { b: Bounty; failed: boolean; onTake: () => void }) {
  const library = b.pregenerated && b.progress && b.progress.total > 0 ? b.progress.total : 0;
  return (
    <Animated.View layout={LinearTransition.springify().damping(16)} entering={FadeIn.duration(220)} style={s.slot}>
      <Card title={b.brand} sub={b.source === "content_rewards" ? "Content Rewards" : "Whop bounty"} style={s.card}
        testID={`bounty-card-${b.id}`}>
        <View style={s.row}>
          <ModeBadge mode={b.mode} testID={`bounty-mode-${b.id}`} />
          {library > 0 && (
            <Badge label={`${library} videos pregenerated for the demo`} tone="violet" icon="play" dashed
              testID={`bounty-pregenerated-${b.id}`} style={s.shrink} />
          )}
        </View>

        <Text style={s.title} numberOfLines={3}>{b.title}</Text>

        <View style={s.row}>
          <View style={s.reward} accessible accessibilityLabel={`Reward ${b.rewardLabel}`} testID={`bounty-reward-${b.id}`}>
            <View style={s.rewardBar}><Outlined size={22} color={COLOR.gold}>{b.rewardLabel}</Outlined></View>
            <Image source={ICON.coin} style={s.rewardCoin} />
          </View>
          {b.budgetLabel && <Badge label={b.budgetLabel} tone="parch" icon="coin" testID={`bounty-budget-${b.id}`} />}
          {b.spotsLabel && <Badge label={b.spotsLabel} tone="parch" icon="person" testID={`bounty-spots-${b.id}`} />}
        </View>

        {b.makes ? (
          <View style={s.makes} testID={`bounty-makes-${b.id}`}>
            <Text style={s.makesHead}>OUTPOST MAKES</Text>
            <Text style={s.makesText}>{b.makes}</Text>
          </View>
        ) : null}

        {b.taken ? <Taken b={b} /> : (
          <Button label="TAKE" bevel="green" feel="commit" onPress={onTake} testID={`bounty-take-${b.id}`}
            accessibilityLabel={`Take ${b.brand}: ${b.title}`} style={s.take} />
        )}
        {failed && <Text style={s.failed}>That didn't go through. Tap Take to try again.</Text>}

        {b.url ? (
          <Pressable onPress={() => { feel("tap"); WebBrowser.openBrowserAsync(b.url!).catch(() => {}); }} hitSlop={8}
            accessibilityRole="link" accessibilityLabel={`Open the ${b.brand} campaign page`} testID={`bounty-link-${b.id}`}>
            {({ pressed }) => (
              <View style={[s.row, pressed && s.pressed]}>
                <Image source={ICON.glass} style={s.linkIcon} />
                <Text style={s.link}>See the campaign page</Text>
              </View>
            )}
          </Pressable>
        ) : null}
      </Card>
    </Animated.View>
  );
}

// After Take: a TAKEN badge, how many of the bounty's pregenerated videos are in the Feed so far, and a way there.
function Taken({ b }: { b: Bounty }) {
  const p = b.progress;
  const pill = !p || p.total === 0 ? <ProgressPill label="No pregenerated videos yet" state="waiting" testID={`bounty-progress-${b.id}`} />
    : p.ready >= p.total ? <ProgressPill label={`All ${p.total} ready in your Feed`} state="done" testID={`bounty-progress-${b.id}`} />
    : <ProgressPill label={`${p.ready} of ${p.total} ready`} state="working" done={p.ready} total={p.total} testID={`bounty-progress-${b.id}`} />;
  return (
    <View style={s.taken}>
      <View style={s.row}>
        <Badge label="TAKEN" tone="green" icon="check" testID={`bounty-taken-${b.id}`} />
        {pill}
      </View>
      <Button label="Swipe them" size="sm" onPress={() => router.navigate("/feed")} testID={`bounty-feed-${b.id}`} style={s.swipe} />
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: DEEP },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 32 },
  slot: { marginTop: 14 },
  card: { gap: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  shrink: { flexShrink: 1 },
  title: { color: PARCH.ink, fontSize: 23, fontFamily: FONT.bold, lineHeight: 25 },
  reward: { height: 40, justifyContent: "center" },
  rewardBar: {
    marginLeft: 16, paddingLeft: 26, paddingRight: 12, height: 36, justifyContent: "center",
    backgroundColor: COLOR.night, borderWidth: 2, borderColor: INK,
  },
  rewardCoin: { position: "absolute", left: 0, width: 38, height: 38 },
  makes: { backgroundColor: PARCH.top, borderLeftWidth: 4, borderLeftColor: COLOR.orange, paddingHorizontal: 10, paddingVertical: 6 },
  makesHead: { color: COLOR.orangeDeep, fontSize: 13, fontFamily: FONT.bold, letterSpacing: 0.5 },
  makesText: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.semi, lineHeight: 21 },
  take: { marginTop: 4 },
  failed: { color: COLOR.redDeep, fontSize: 16, fontFamily: FONT.semi },
  taken: { gap: 10, marginTop: 2 },
  swipe: { alignSelf: "flex-start" },
  linkIcon: { width: 20, height: 20 },
  link: { color: COLOR.orangeDeep, fontSize: 17, fontFamily: FONT.bold, textDecorationLine: "underline" },
  pressed: { opacity: 0.6 },
  footnote: {
    alignSelf: "center", color: COLOR.foam, fontSize: 14, fontFamily: FONT.semi, marginTop: 16, textAlign: "center",
    lineHeight: 18, textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0,
  },
});
