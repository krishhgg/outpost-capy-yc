import { useRef } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import { Block, FONT, INK, Outlined, PARCH, PixelButton } from "./pixel";
import { Portrait } from "./Portrait";

export type Find = NonNullable<FunctionReturnType<typeof api.scout.next>>;

const { width: W } = Dimensions.get("window");
const money = (c: number) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
const per = (days: number | null) =>
  days === 7 ? " a week" : days === 30 || days === 31 ? " a month" : days === 365 ? " a year" : days ? ` every ${days} days` : " recurring";

// A paid product the Scout found on the Whop marketplace. Right: the studio makes a video on the problem it solves. Left: skip it.
export function FindCard({ find, onSwipe }: { find: Find; onSwipe: (dir: "right" | "left") => void }) {
  const x = useSharedValue(0);
  const done = useRef(false); // a swipe and a button tap can't both count
  const thrown = useRef(false); // a second button tap can't redirect a throw
  const commit = (dir: 1 | -1) => {
    if (done.current) return;
    done.current = true;
    Haptics.impactAsync(dir > 0 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    onSwipe(dir > 0 ? "right" : "left");
  };
  const pan = Gesture.Pan()
    .onUpdate(e => { x.value = e.translationX; })
    .onEnd(e => {
      const go = Math.abs(e.translationX) > W * 0.25 || Math.abs(e.velocityX) > 800;
      if (go) {
        const dir = (Math.sign(e.translationX || e.velocityX) || 1) as 1 | -1;
        x.value = withTiming(dir * W * 1.5, { duration: 160 }, finished => { if (finished) runOnJS(commit)(dir); });
      } else x.value = withSpring(0);
    });
  const fling = (dir: 1 | -1) => {
    if (thrown.current) return;
    thrown.current = true;
    x.value = withTiming(dir * W * 1.5, { duration: 220 }, finished => { if (finished) runOnJS(commit)(dir); });
  };
  const card = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { rotate: `${interpolate(x.value, [-W, W], [-10, 10])}deg` }],
  }));
  const make = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, W * 0.25], [0, 1], "clamp") }));
  const skip = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-W * 0.25, 0], [1, 0], "clamp") }));

  // Sellers stuff search terms after a bar ("… Dashboard | No Subscription"), so the name stops at the first one.
  const name = find.title.split(/\s[|•]\s/)[0].trim() || find.title;
  // The listing's own numbers. The price is the loudest, since it's the proof people pay for this.
  const price = `${money(find.priceCents)}${find.renews ? per(find.everyDays) : " one time"}`;
  // 34 fits about 19 characters on a 375 pt phone. A longer price, like "$149.99 every 90 days", steps down to stay on one line.
  const stats = [
    `${find.members.toLocaleString()} member${find.members === 1 ? "" : "s"}`,
    find.reviews > 0 ? `★ ${find.rating.toFixed(1)} (${find.reviews})` : null,
  ].filter((t): t is string => !!t);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[st.card, card]} testID="find-card">
        <Block style={st.face} depth={4} lift={4}>
          <View style={st.kickerRow}>
            <Portrait who="writer" />
            {/* What the Scout searched for rides in the kicker, so the picture gets the line it used to take. */}
            {/* Tags are flat, a fill and a 2 pt outline, so only the buttons look pressable. */}
            <View style={st.kicker}>
              <Text style={st.kickerText} numberOfLines={1}>{`Found on Whop · “${find.query}”`}</Text>
            </View>
          </View>
          {/* The listing's picture, uncropped, over a blurred copy of itself that fills the rest of the card's height. */}
          <View style={st.image}>
            {find.image ? (
              <>
                <Image source={{ uri: find.image }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={16} />
                <Image source={{ uri: find.image }} style={StyleSheet.absoluteFill} resizeMode="contain" />
              </>
            ) : null}
          </View>
          <Text style={st.title} numberOfLines={2}>{name}</Text>
          {find.headline ? <Text style={st.headline} numberOfLines={2}>{find.headline}</Text> : null}
          <View style={st.stats}>
            <View style={st.price}><Outlined size={price.length <= 16 ? 34 : 26}>{price}</Outlined></View>
            {stats.map(t => <View key={t} style={st.stat}><Text style={st.statText}>{t}</Text></View>)}
          </View>
          <Text style={st.why}>Make it and the studio's next video is on the problem it solves.</Text>
          <View style={st.actions}>
            <PixelButton label="SKIP" bevel="slate" size={20} onPress={() => fling(-1)} testID="find-skip" style={st.action} />
            <PixelButton label="MAKE IT" bevel="green" size={20} onPress={() => fling(1)} testID="find-make" style={st.action} />
          </View>
        </Block>
        <Animated.View style={[st.stamp, st.make, make]}><Block bevel="green" depth={3} style={st.stampFace}><Outlined size={34}>MAKE IT</Outlined></Block></Animated.View>
        <Animated.View style={[st.stamp, st.skip, skip]}><Block bevel="slate" depth={3} style={st.stampFace}><Outlined size={34}>SKIP</Outlined></Block></Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const st = StyleSheet.create({
  card: { position: "absolute", top: 0, bottom: 0, left: 12, right: 12 },
  face: { flex: 1, padding: 14, paddingBottom: 16 },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  kicker: { flexShrink: 1, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: INK, backgroundColor: "#2EB8A6" },
  kickerText: { color: INK, fontSize: 16, fontFamily: FONT.bold },
  image: { marginTop: 12, flex: 1, minHeight: 90, borderWidth: 3, borderColor: INK, backgroundColor: PARCH.bottom, overflow: "hidden" },
  title: { color: PARCH.ink, fontSize: 24, fontFamily: FONT.bold, marginTop: 12 },
  headline: { color: PARCH.soft, fontSize: 18, fontFamily: FONT.semi, marginTop: 4 },
  stats: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 },
  price: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: INK, backgroundColor: "#FFC83A" },
  stat: { backgroundColor: PARCH.top, borderWidth: 2, borderColor: INK, paddingHorizontal: 9, paddingVertical: 5 },
  statText: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.bold },
  why: { color: PARCH.ink, fontSize: 17, fontFamily: FONT.semi, marginTop: 12, lineHeight: 20 },
  actions: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 14 },
  action: { flex: 1 },
  stamp: { position: "absolute", top: 70 },
  stampFace: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
  make: { left: 22, transform: [{ rotate: "-10deg" }] },
  skip: { right: 22, transform: [{ rotate: "10deg" }] },
});
