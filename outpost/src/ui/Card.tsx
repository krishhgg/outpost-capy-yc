import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import { Block, Outlined, Plaque, UNDER_PLAQUE, type Bevel } from "../pixel";
import { ICON, type IconName } from "../Hud";
import { Skeleton } from "./Loader";
import { feel, type Feel } from "./feel";
import { COLOR, FONT, INK, PARCH } from "./tokens";

export type CardProps = {
  children?: ReactNode;
  // A wood plaque across the top edge with the card's name, as on the You tab's "Live now".
  title?: string;
  sub?: string;
  bevel?: Bevel;
  // A pressable card sinks into its shadow like a button. Leave it out for a card with its own buttons inside.
  onPress?: () => void;
  feel?: Feel;
  // Skeleton lines in place of the children.
  loading?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// The game-board panel every list and bounty sits on: parchment, a 3 pt ink outline, flat bevels and a hard shadow.
export function Card({ children, title, sub, bevel = "parch", onPress, feel: kind = "press", loading, testID, accessibilityLabel, style }: CardProps) {
  const body = (pressed: boolean) => (
    <Block bevel={bevel} lift={pressed ? 0 : 4} style={[s.card, title ? UNDER_PLAQUE : null, pressed && s.sunk, style]} testID={onPress ? undefined : testID}>
      {loading ? (
        <View style={s.skeleton} testID={testID ? `${testID}-loading` : undefined}>
          <Skeleton width="55%" height={20} />
          <Skeleton height={14} delay={150} />
          <Skeleton width="80%" height={14} delay={300} />
        </View>
      ) : children}
    </Block>
  );
  return (
    <View>
      {title ? <Plaque title={title} sub={sub} /> : null}
      {onPress && !loading ? (
        <Pressable onPress={() => { feel(kind); onPress(); }} testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          {({ pressed }) => body(pressed)}
        </Pressable>
      ) : body(false)}
    </View>
  );
}

// A row inside a Card: an icon or image, a title and a line under it, and anything on the right (a badge, a number,
// a small button). Rows after the first get a parchment rule above them.
export function CardRow({ title, sub, icon, image, right, first, onPress, testID }:
  { title: string; sub?: string; icon?: IconName; image?: ImageSourcePropType; right?: ReactNode; first?: boolean; onPress?: () => void; testID?: string }) {
  const content = (pressed: boolean) => (
    <View style={[s.row, first && s.firstRow, pressed && s.rowPressed]}>
      {icon || image ? <Image source={image ?? ICON[icon!]} style={s.rowIcon} /> : null}
      <View style={s.rowText}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={s.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return <View testID={testID}>{content(false)}</View>;
  return (
    <Pressable onPress={() => { feel("tap"); onPress(); }} testID={testID} accessibilityRole="button" accessibilityLabel={title}>
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

// A heading that sits on the water between cards: outlined white type, an optional line under it, an optional link
// on the right ("See all").
export function SectionHeader({ title, sub, action, testID }:
  { title: string; sub?: string; action?: { label: string; onPress: () => void; testID?: string }; testID?: string }) {
  return (
    <View style={s.section} testID={testID}>
      <View style={s.sectionText}>
        <Outlined size={22} width={2}>{title}</Outlined>
        {sub ? <Text style={s.sectionSub} numberOfLines={2}>{sub}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={() => { feel("tap"); action.onPress(); }} hitSlop={10} testID={action.testID} accessibilityRole="button">
          {({ pressed }) => <Text style={[s.action, pressed && { opacity: 0.6 }]}>{action.label}</Text>}
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, paddingBottom: 18 },
  sunk: { transform: [{ translateX: 4 }, { translateY: 4 }] },
  skeleton: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 2, borderTopColor: PARCH.bottom },
  firstRow: { borderTopWidth: 0, paddingTop: 0 },
  rowPressed: { opacity: 0.7 },
  rowIcon: { width: 32, height: 32 },
  rowText: { flex: 1 },
  rowTitle: { color: PARCH.ink, fontSize: 18, fontFamily: FONT.bold },
  rowSub: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi },
  section: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  sectionText: { flexShrink: 1 },
  sectionSub: {
    color: COLOR.foam, fontSize: 15, fontFamily: FONT.semi, marginTop: -2,
    textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0,
  },
  action: {
    color: COLOR.sign, fontSize: 18, fontFamily: FONT.bold, marginBottom: 2,
    textShadowColor: INK, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0,
  },
});
