import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation, Easing, useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { Block, FONT, INK, PARCH } from "./pixel";
import { Portrait } from "./Portrait";

export type Pt = { x: number; y: number };
export type Who = "writer" | "director" | "courier" | "merchant";

// Two walk frames per agent, drawn by art/sprites.py.
const SPRITES: Record<Who, [number, number]> = {
  writer: [require("../assets/base/agent-writer-0.png"), require("../assets/base/agent-writer-1.png")],
  director: [require("../assets/base/agent-director-0.png"), require("../assets/base/agent-director-1.png")],
  courier: [require("../assets/base/agent-courier-0.png"), require("../assets/base/agent-courier-1.png")],
  merchant: [require("../assets/base/agent-merchant-0.png"), require("../assets/base/agent-merchant-1.png")],
};
const SPRITE_W = 10, SPRITE_H = 16; // in art pixels
const MAP_W = 192; // the village picture's width in art pixels, so a speech bubble can stay on the map
const SPEECH_W = 220;
const DOING_W = 120; // the box the job tag centres in over the agent's head
// Agents at the campfire stand about a sprite apart, so the tap area grows up and down but barely sideways.
const SLOP = { top: 12, bottom: 8, left: 2, right: 2 };
const ROLE: Record<Who, string> = { writer: "Writer", director: "Director", courier: "Courier", merchant: "Merchant" };

const SPEED = 38; // points a second, a slow stroll
const PAUSE_MS = 900; // how long an agent stands at each end of its walk

// Timed walking legs from `from` through `points`, at strolling pace.
function walk(from: Pt, points: Pt[]) {
  const xs = [], ys = [];
  let at = from, ms = 0, far = 0;
  for (const p of points) {
    const d = Math.hypot(p.x - at.x, p.y - at.y);
    const leg = Math.max(200, (d / SPEED) * 1000);
    xs.push(withTiming(p.x, { duration: leg, easing: Easing.linear }));
    ys.push(withTiming(p.y, { duration: leg, easing: Easing.linear }));
    ms += leg;
    far += d;
    at = p;
  }
  // The step bob for the walk: it strides while moving and ends standing, or just stands if there's nowhere to go.
  const steps = far < 1 ? withTiming(0, { duration: 0 }) : withSequence(strides(Math.ceil(ms / STRIDE_MS)), withTiming(0, { duration: 0 }));
  return { xs, ys, ms, steps };
}
const STRIDE_MS = 320;
const strides = (n: number) => withRepeat(withSequence(withTiming(-2, { duration: STRIDE_MS / 2 }), withTiming(0, { duration: STRIDE_MS / 2 })), n);

// One worker on the map. While it works it walks its route there and back, or works in place if the route is
// one point. With nothing to do it walks `rest.path` (from its post to a spot by the campfire) and waits there,
// facing the fire; without `rest`, because the studio is offline, it goes home to its post and dozes. `px` is one
// art pixel in points. A tap calls `onTalk`; while `talking`, a bubble over its head says `say`, what it is doing now,
// and tapping the bubble calls `onGo`, which goes where the sentence points. While it works and isn't talking, a small
// tag over its head names the job, `doing`.
export function Agent({ who, px, route, working, rest, say, talking, onTalk, onGo, doing, testID }:
  {
    who: Who; px: number; route: Pt[]; working: boolean; rest?: { path: Pt[]; face: 1 | -1 };
    say: string; talking: boolean; onTalk: () => void; onGo?: () => void; doing?: string; testID: string;
  }) {
  const x = useSharedValue(route[0].x);
  const y = useSharedValue(route[0].y);
  const step = useSharedValue(0);
  const face = useSharedValue(1);
  const look = useSharedValue(0); // which way it faces while resting; 0 while it's walking
  const z = useSharedValue(0);
  const camp = useRef<Pt[] | null>(null); // the path it took to the fire, kept until it starts work again
  const idle = !working && !!rest;
  const key = `${working}|${route.map(p => `${p.x},${p.y}`).join(" ")}|${idle ? rest.path.map(p => `${p.x},${p.y}`).join(" ") : "-"}`;

  useEffect(() => {
    [x, y, step, z, look].forEach(v => cancelAnimation(v));
    z.value = 0;
    look.value = 0;
    const from = { x: x.value, y: y.value };
    if (idle) {
      const there = walk(from, camp.current ? [rest.path.at(-1)!] : rest.path);
      camp.current = rest.path;
      x.value = withSequence(...there.xs);
      y.value = withSequence(...there.ys);
      step.value = there.steps;
      look.value = withDelay(there.ms, withTiming(rest.face, { duration: 0 }));
      return;
    }
    // Leaving the fire walks back to its post from wherever it is, even halfway home when work starts.
    const post = camp.current?.[0];
    const back = post && Math.hypot(from.x - post.x, from.y - post.y) >= 1 ? walk(from, [post]) : null;
    if (working) camp.current = null;
    if (!working) {
      // Walk home at the same pace, then doze.
      const home = back ?? walk(from, [route[0]]);
      x.value = withSequence(...home.xs);
      y.value = withSequence(...home.ys);
      step.value = home.steps;
      z.value = withDelay(home.ms, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
      return;
    }
    if (route.length === 1) {
      // Working in place: a quick hammer bob.
      const there = back ?? walk(from, []);
      x.value = withSequence(...there.xs, withTiming(route[0].x, { duration: 400 }));
      y.value = withSequence(...there.ys, withTiming(route[0].y, { duration: 400 }));
      const hammer = withRepeat(withSequence(withTiming(-4, { duration: 110 }), withTiming(0, { duration: 140 })), -1);
      step.value = back ? withSequence(strides(Math.ceil(back.ms / STRIDE_MS)), hammer) : hammer;
      return;
    }
    const legs = [...route.slice(1), ...route.slice(0, -1).reverse()];
    const xs = [], ys = [];
    let at = route[0];
    for (const p of legs) {
      const ms = Math.max(200, (Math.hypot(p.x - at.x, p.y - at.y) / SPEED) * 1000);
      xs.push(withTiming(p.x, { duration: ms, easing: Easing.linear }));
      ys.push(withTiming(p.y, { duration: ms, easing: Easing.linear }));
      // Stand still at the far end and back home before the next trip.
      if (p === route.at(-1) || p === route[0]) {
        xs.push(withTiming(p.x, { duration: PAUSE_MS }));
        ys.push(withTiming(p.y, { duration: PAUSE_MS }));
      }
      at = p;
    }
    if (back) {
      x.value = withSequence(...back.xs, withRepeat(withSequence(...xs), -1));
      y.value = withSequence(...back.ys, withRepeat(withSequence(...ys), -1));
    } else {
      x.value = route[0].x;
      y.value = route[0].y;
      x.value = withRepeat(withSequence(...xs), -1);
      y.value = withRepeat(withSequence(...ys), -1);
    }
    step.value = strides(-1);
  }, [key]);

  // Face the way it's walking.
  useAnimatedReaction(() => x.value, (cur, prev) => {
    if (prev !== null && Math.abs(cur - prev) > 0.05) face.value = cur > prev ? 1 : -1;
  });

  const w = SPRITE_W * px, h = SPRITE_H * px;
  const body = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - w / 2 }, { translateY: y.value - h + step.value }],
  }));
  const flip = useAnimatedStyle(() => ({ transform: [{ scaleX: look.value !== 0 ? look.value : face.value }] }));
  // The stride frame shows on the up-beat of each step, so standing still always shows the first frame.
  const stride = useAnimatedStyle(() => ({ opacity: step.value < -1 ? 1 : 0 }));
  const still = useAnimatedStyle(() => ({ opacity: step.value < -1 ? 0 : 1 }));
  const sleep = useAnimatedStyle(() => ({
    opacity: z.value < 0.15 ? z.value / 0.15 : 1 - z.value,
    transform: [{ translateX: w * 0.7 + z.value * 6 }, { translateY: -6 - z.value * 14 }],
  }));

  // The bubble rides along with the agent, nudged sideways so it never hangs off either edge of the map.
  const mapW = MAP_W * px;
  const speech = useAnimatedStyle(() => {
    const left = Math.min(Math.max(x.value - SPEECH_W / 2, 6), mapW - SPEECH_W - 6);
    return { transform: [{ translateX: left - (x.value - w / 2) }] };
  });
  // The tail stays over the agent's head while the bubble slides to keep on the map.
  const tail = useAnimatedStyle(() => {
    const left = Math.min(Math.max(x.value - SPEECH_W / 2, 6), mapW - SPEECH_W - 6);
    return { transform: [{ translateX: x.value - left - 7 }, { rotate: "45deg" }] };
  });

  return (
    <Animated.View style={[st.agent, { width: w, height: h }, talking && st.front, body]} pointerEvents="box-none" testID={testID}>
      <Pressable style={st.fill} hitSlop={SLOP} onPress={onTalk} testID={`${testID}-tap`}
        accessibilityRole="button" accessibilityLabel={`${ROLE[who]}: ${say}`}>
        <Animated.View style={[st.fill, flip]}>
          <Animated.Image source={SPRITES[who][0]} style={[st.frame, { width: w, height: h }, still]} />
          <Animated.Image source={SPRITES[who][1]} style={[st.frame, { width: w, height: h }, stride]} />
        </Animated.View>
      </Pressable>
      <Animated.Text style={[st.z, sleep]} pointerEvents="none">z</Animated.Text>
      {working && doing && !talking && (
        <View style={[st.doing, { left: w / 2 - DOING_W / 2, bottom: h + 3 }]} pointerEvents="none" testID={`${testID}-doing`}>
          <Text style={st.doingText}>{doing}</Text>
        </View>
      )}
      {talking && (
        <Animated.View style={[st.speech, { bottom: h + 10 }, speech]} pointerEvents="box-none">
          <Animated.View entering={ZoomIn.springify().damping(14).mass(1).stiffness(180)} testID={`${testID}-speech`}>
            <Pressable disabled={!onGo} onPress={onGo} accessibilityRole={onGo ? "button" : undefined}
              accessibilityLabel={`${ROLE[who]}: ${say}`} testID={`${testID}-go`}>
              <Block style={st.speechCard} depth={3} lift={onGo ? 3 : 0}>
                <Portrait who={who} />
                <View style={st.speechBody}>
                  <Text style={st.speechName}>{ROLE[who]}</Text>
                  <Text style={st.speechText}>{say}</Text>
                </View>
                {/* A bubble that goes somewhere says so, the way a game's popups mark their tap targets. */}
                {onGo && <Text style={st.go}>›</Text>}
              </Block>
            </Pressable>
            <Animated.View style={[st.tail, tail]} pointerEvents="none" />
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  agent: { position: "absolute", left: 0, top: 0 },
  front: { zIndex: 5 },
  fill: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  frame: { position: "absolute", left: 0, top: 0 },
  speech: { position: "absolute", left: 0, width: SPEECH_W },
  // A flat tag, not a button: it only says what the agent is doing.
  doing: { position: "absolute", width: DOING_W, alignItems: "center" },
  doingText: { color: PARCH.ink, backgroundColor: PARCH.top, borderWidth: 2, borderColor: INK, fontSize: 12, fontFamily: FONT.bold, paddingHorizontal: 4 },
  speechCard: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingTop: 9, paddingBottom: 11 },
  speechBody: { flex: 1 },
  go: { color: "#C48412", fontSize: 30, lineHeight: 30, fontFamily: FONT.bold, marginLeft: -2 },
  tail: { width: 14, height: 14, marginTop: -9, backgroundColor: PARCH.bottom, borderColor: INK, borderRightWidth: 3, borderBottomWidth: 3 },
  speechName: { color: PARCH.soft, fontSize: 14, fontFamily: FONT.bold },
  speechText: { color: PARCH.ink, fontSize: 16, lineHeight: 19, fontFamily: FONT.bold },
  z: { position: "absolute", top: 0, left: 0, color: "#fff", fontSize: 17, fontFamily: FONT.bold, textShadowColor: INK, textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } },
});
