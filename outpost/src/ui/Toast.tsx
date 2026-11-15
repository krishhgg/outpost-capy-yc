import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Block } from "../pixel";
import { ICON, type IconName } from "../Hud";
import type { Who } from "../Agents";
import { Portrait } from "../Portrait";
import { feel } from "./feel";
import { COLOR, FONT, INK, PARCH, POP } from "./tokens";

export type ToastOptions = {
  title: string;
  body?: string;
  who?: Who;
  icon?: IconName;
  // Tapping the toast runs this and closes it. `label` shows as a gold link on the right ("Swipe").
  action?: { label: string; onPress: () => void };
  // How long it stays before it slides away. Default 4 s.
  duration?: number;
  testID?: string;
};

// An in-app nudge that drops from under the status bar, says one thing ("5 clips ready for Notion"), and slides away.
// Mounting it shows it; it calls onHide once it's gone. `inline` draws it in place with no motion or timer, for the
// gallery and for docs. Most screens use useToast() instead of mounting it by hand.
export function Toast({ title, body, who, icon, action, duration = 4000, testID = "toast", inline, onHide }:
  ToastOptions & { inline?: boolean; onHide?: () => void }) {
  const top = useSafeAreaInsets().top;
  const y = useSharedValue(inline ? 0 : -160);
  const gone = useRef(false);
  const hide = () => {
    if (gone.current) return;
    gone.current = true;
    y.value = withTiming(-160, { duration: 220, easing: Easing.in(Easing.quad) }, done => { if (done && onHide) runOnJS(onHide)(); });
  };
  useEffect(() => {
    if (inline) return;
    feel("success");
    y.value = withSpring(0, POP);
    const t = setTimeout(hide, duration);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const card = (
    <Block lift={4} style={s.card}>
      <View style={s.row}>
        {who ? <Portrait who={who} /> : <Image source={ICON[icon ?? "play"]} style={s.icon} />}
        <View style={s.text}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          {body ? <Text style={s.body} numberOfLines={2}>{body}</Text> : null}
        </View>
        {action ? <Text style={s.action}>{action.label}</Text> : null}
      </View>
    </Block>
  );
  return (
    <Animated.View style={[inline ? null : [s.slot, { top: top + 6 }], style]} pointerEvents="box-none" testID={testID}>
      <Pressable onPress={() => { if (inline) return action?.onPress(); feel("tap"); action?.onPress(); hide(); }}
        accessibilityRole={action ? "button" : "alert"} accessibilityLabel={[title, body, action?.label].filter(Boolean).join(". ")}>
        {card}
      </Pressable>
    </Animated.View>
  );
}

// const toast = useToast(); toast.show({ title: "5 clips ready for Notion" }); and render {toast.node} last in the
// screen's root view. A new toast replaces the one showing.
export function useToast() {
  const [current, setCurrent] = useState<(ToastOptions & { id: number }) | null>(null);
  const next = useRef(0);
  return {
    show: (o: ToastOptions) => setCurrent({ ...o, id: ++next.current }),
    hide: () => setCurrent(null),
    node: current ? <Toast key={current.id} {...current} onHide={() => setCurrent(c => (c?.id === current.id ? null : c))} /> : null,
  };
}

const s = StyleSheet.create({
  slot: { position: "absolute", left: 12, right: 12, zIndex: 50 },
  card: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 36, height: 36 },
  text: { flex: 1 },
  title: { color: PARCH.ink, fontSize: 19, fontFamily: FONT.bold },
  body: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi },
  action: {
    color: COLOR.orangeDeep, fontSize: 18, fontFamily: FONT.bold, paddingLeft: 4,
    textDecorationLine: "underline", textDecorationColor: INK,
  },
});
