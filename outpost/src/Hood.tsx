import { type ReactNode, useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, LayoutAnimationConfig, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useClock } from "./Feed";
import type { Who } from "./Agents";
import { Portrait } from "./Portrait";
import { TasteGraph } from "./TasteGraph";
import { Block, DEEP, FONT, INK, PARCH, Plaque, Sea, UNDER_PLAQUE, WoodHeader } from "./pixel";

// A fixed swatch per service, so a service keeps its color as rows come and go.
const SWATCH: Record<string, string> = {
  claude: "#FF9F43", kokoro: "#3DD6C4", compound: "#B48CFF", convex: "#FF6FB5",
  zernio: "#7FB2FF", whop: "#FFD23F", supermemory: "#7CF29A",
};
// The agent that makes each call, so a row says who is working. Convex is the Base itself.
const AGENT: Record<string, Who> = {
  claude: "writer", supermemory: "writer", kokoro: "director", compound: "director", zernio: "courier", whop: "merchant",
};
const HOUSE = require("../assets/ui/house.png");
const DOT = { ok: "#3FAE3A", error: "#D9442F", skipped: "#A88C6E" } as const;
const SYNC = { pending: "Not in Supermemory yet", synced: "In Supermemory", failed: "Supermemory refused it" } as const;

const dur = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);
const clock = (at: number) => new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
function ago(now: number, at: number) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

// A service row that lights up gold and fades back when the service makes a new call. Not on first open.
function Flash({ at, testID, children }: { at: number | undefined; testID: string; children: ReactNode }) {
  const glow = useSharedValue(0);
  const seen = useRef(at);
  useEffect(() => {
    if (at === seen.current) return;
    seen.current = at;
    glow.value = withSequence(withTiming(1, { duration: 0 }), withTiming(0, { duration: 600 }));
  }, [at, glow]);
  const lit = useAnimatedStyle(() => ({ backgroundColor: `rgba(255, 210, 63, ${glow.value * 0.75})` }));
  return <Animated.View style={[s.svc, lit]} testID={testID}>{children}</Animated.View>;
}

export function Hood({ device }: { device: string }) {
  const data = useQuery(api.hood.calls, { deviceId: device });
  const now = useClock(5000);
  const names = new Map<string, string>(data?.services.map(sv => [sv.key, sv.name]));
  const [allCalls, setAllCalls] = useState(false);

  return (
    <View style={s.fill}>
    <Sea />
    <WoodHeader title="UNDER THE HOOD" size={28} sub="Every outside call, as it happens." right={
      <Pressable onPress={() => router.back()} hitSlop={12} testID="hood-done" accessibilityRole="button" accessibilityLabel="Done">
        {({ pressed }) => (
          <Block bevel="slate" depth={pressed ? 1 : 3} lift={pressed ? 0 : 3}
            style={[s.doneBtn, pressed && { transform: [{ translateX: 3 }, { translateY: 3 }] }]}>
            <Text style={s.done}>Done</Text>
          </Block>
        )}
      </Pressable>
    } />
    <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: 60 }} testID="hood">

      {!data ? <Text style={s.muted}>Loading…</Text> : (
        <>
          <Plaque title="Services" style={s.section} />
          <Block style={[s.card, UNDER_PLAQUE]} depth={3} lift={4}>
            {data.services.map((sv, i) => {
              const last = sv.last;
              const state = sv.needsKey ? "Waiting on its key"
                : !last ? "No calls yet"
                : last.status === "error" ? `${last.op} failed`
                : last.status === "skipped" ? `${last.op} skipped`
                : `${last.op} · ${dur(last.ms)}`;
              const dot = sv.needsKey || !last ? DOT.skipped : DOT[last.status];
              return (
                <View key={sv.key} style={i > 0 && s.rule}>
                <Flash at={last?.at} testID={`hood-service-${sv.key}`}>
                  <View style={[s.swatch, { backgroundColor: SWATCH[sv.key] }]} />
                  {AGENT[sv.key] ? <Portrait who={AGENT[sv.key]} style={s.face} /> : <Image source={HOUSE} style={s.face} />}
                  <View style={s.flex}>
                    <Text style={s.svcName}>{sv.name}</Text>
                    <Text style={s.svcRole}>{sv.role}</Text>
                  </View>
                  <View style={s.svcRight}>
                    <View style={s.stateRow}>
                      <View style={[s.dot, { backgroundColor: dot }]} />
                      <Text style={s.svcState} numberOfLines={1}>{state}</Text>
                    </View>
                    {last && <Text style={s.svcWhen}>{ago(now, last.at)}</Text>}
                  </View>
                </Flash>
                </View>
              );
            })}
          </Block>

          {/* Right under Services, so a call shows up on the first screen while you watch. The newest five, the rest
              one tap away. */}
          <Plaque title="Live calls" style={s.section} />
          <Block style={[s.card, UNDER_PLAQUE]} depth={3} lift={4}>
            {/* New rows slide in. The rows already there on open don't. */}
            <LayoutAnimationConfig skipEntering>
              {data.log.length === 0 ? <Text style={s.muted}>Nothing yet. The studio logs here as it makes your first video.</Text> : (
                (allCalls ? data.log : data.log.slice(0, 5)).map((c, i) => (
                  <Animated.View key={c.id} entering={FadeInDown.duration(260)} style={[s.call, i > 0 && s.rule]} testID="hood-call">
                    <View style={s.callTop}>
                      <View style={[s.swatchSm, { backgroundColor: SWATCH[c.service] ?? "#8A93A6" }]} />
                      <Text style={s.callSvc}>{names.get(c.service) ?? c.service}</Text>
                      <Text style={s.callOp} numberOfLines={1}>{c.op}</Text>
                      <View style={[s.dot, { backgroundColor: DOT[c.status] }]} />
                      <Text style={s.callMeta}>{c.status === "ok" ? dur(c.ms) : c.status === "error" ? "failed" : "skipped"} · {clock(c.at)}</Text>
                    </View>
                    {c.detail ? <Text style={s.detail} numberOfLines={2}>{c.detail}</Text> : null}
                  </Animated.View>
                ))
              )}
            </LayoutAnimationConfig>
            {data.log.length > 5 && (
              <Pressable onPress={() => setAllCalls(a => !a)} hitSlop={8} testID="hood-calls-toggle" accessibilityRole="button">
                <Text style={s.more}>{allCalls ? "Show the newest 5" : `Show all ${data.log.length} calls`}</Text>
              </Pressable>
            )}
          </Block>

          <Plaque title="Taste notes" style={s.section} />
          <Block style={[s.card, UNDER_PLAQUE]} depth={3} lift={4}>
            <Text style={s.note}>Your skip reasons. Claude reads the newest five, plus what Supermemory learned, before it writes each script.</Text>
            {data.notes.length === 0 ? <Text style={s.muted}>Swipe a video left and pick a reason to add one.</Text> : (
              data.notes.map((n, i) => (
                <View key={n.id} style={[s.noteRow, i > 0 && s.rule]} testID="hood-note">
                  <Text style={s.noteText} numberOfLines={2}>{n.text}</Text>
                  <Text style={[s.sync, n.sync === "synced" && { color: DOT.ok }, n.sync === "failed" && { color: DOT.error }]}>{SYNC[n.sync]}</Text>
                </View>
              ))
            )}
          </Block>

          <Plaque title="What Supermemory learned" style={s.section} />
          <Block style={[s.card, UNDER_PLAQUE]} depth={3} lift={4}>
            <Text style={s.note} testID="hood-taste-state">
              {data.taste.busy ? "Learning from your newest note…" : data.taste.at ? `Updated ${ago(now, data.taste.at)}` : "Skip a video with a reason and it starts learning."}
            </Text>
            <TasteGraph notes={data.notes} memories={data.taste.memories} />
            {data.taste.learned.map((line, i) => (
              <View key={i} style={[s.noteRow, s.rule]} testID="hood-learned">
                <Text style={s.learned}>{line}</Text>
              </View>
            ))}
          </Block>

        </>
      )}
    </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: DEEP },
  flex: { flex: 1 },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  done: { color: "#fff", fontSize: 18, fontFamily: FONT.bold },
  section: { marginTop: 24 },
  note: { color: PARCH.soft, fontSize: 16, fontFamily: FONT.semi, paddingBottom: 6 },
  muted: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.semi, paddingVertical: 14 },
  card: { marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingBottom: 4 },
  rule: { borderTopWidth: 2, borderTopColor: PARCH.bottom },
  // Out to the card's edges, so the gold flash fills the whole row.
  svc: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, marginHorizontal: -14, paddingHorizontal: 14 },
  face: { width: 28, height: 28 },
  more: { color: "#B04A10", fontSize: 17, fontFamily: FONT.bold, paddingVertical: 10 },
  swatch: { width: 12, height: 30, borderWidth: 2, borderColor: INK },
  svcName: { color: PARCH.ink, fontSize: 20, fontFamily: FONT.bold },
  svcRole: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi, marginTop: 1 },
  svcRight: { alignItems: "flex-end", maxWidth: "48%" },
  stateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  svcState: { color: PARCH.ink, fontSize: 15, fontFamily: FONT.semi, flexShrink: 1 },
  svcWhen: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.regular, marginTop: 2 },
  dot: { width: 8, height: 8, borderWidth: 1.5, borderColor: INK },
  noteRow: { paddingVertical: 10 },
  noteText: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.semi },
  sync: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi, marginTop: 2 },
  learned: { color: "#2F6B2C", fontSize: 17, fontFamily: FONT.semi },
  call: { paddingVertical: 9 },
  callTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatchSm: { width: 8, height: 14, borderWidth: 1.5, borderColor: INK },
  callSvc: { color: PARCH.ink, fontSize: 16, fontFamily: FONT.bold },
  callOp: { color: PARCH.ink, fontSize: 16, fontFamily: FONT.regular, flex: 1 },
  callMeta: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi },
  detail: { color: PARCH.soft, fontSize: 11, fontFamily: "Menlo", marginTop: 3, marginLeft: 14 },
});
