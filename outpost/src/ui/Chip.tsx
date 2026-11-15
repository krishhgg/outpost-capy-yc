import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ICON, type IconName } from "../Hud";
import { Dots } from "./Loader";
import { feel, type Feel } from "./feel";
import { COLOR, FONT, INK, PARCH } from "./tokens";

export type ChipProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  // Picked: gold, sunk, with a check. Use for a choice that stays chosen.
  selected?: boolean;
  // Sent and working: orange, sunk, dots, and `pendingLabel` in place of the label ("Remaking"). Not pressable.
  pending?: boolean;
  pendingLabel?: string;
  disabled?: boolean;
  // lg is the Feed's one-tap edit size (thumb-sized, 52 pt tall); md fits filter rows.
  size?: "lg" | "md";
  feel?: Feel;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

// A big one-tap chip, like the remake reasons: parchment on a thick ink bottom edge that squashes flat when pressed.
export function Chip({ label, onPress, icon, selected, pending, pendingLabel, disabled, size = "lg", feel: kind = "commit", testID, style }: ChipProps) {
  const lg = size === "lg";
  return (
    <Pressable onPress={() => { feel(kind); onPress(); }} disabled={disabled || pending} testID={testID} style={style}
      accessibilityRole="button" accessibilityLabel={pending ? `${label}, ${pendingLabel ?? "working"}` : label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled, busy: !!pending }}>
      {({ pressed }) => {
        const down = pressed || selected || pending;
        return (
          <View style={[s.chip, lg ? s.lg : s.md, down && s.down, selected && s.selected, pending && s.pending, disabled && s.disabled]}>
            {selected ? <Image source={ICON.check} style={lg ? s.iconLg : s.iconMd} />
              : icon ? <Image source={ICON[icon]} style={lg ? s.iconLg : s.iconMd} /> : null}
            <Text style={[s.text, lg ? s.textLg : s.textMd]} numberOfLines={1}>{pending ? (pendingLabel ?? label) : label}</Text>
            {pending ? <Dots size={5} /> : null}
          </View>
        );
      }}
    </Pressable>
  );
}

// Lays chips in rows that wrap, 10 pt apart.
export function ChipRow({ children, style, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  return <View style={[s.row, style]} testID={testID}>{children}</View>;
}

const s = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: PARCH.top,
    borderWidth: 2, borderColor: INK, borderBottomWidth: 5,
  },
  lg: { minHeight: 52, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 7 },
  md: { minHeight: 38, paddingHorizontal: 10, paddingTop: 4, paddingBottom: 3 },
  // Pressed, picked or working, the chip squashes onto its edge and drops by what the edge lost.
  down: { borderBottomWidth: 2, marginTop: 3 },
  selected: { backgroundColor: COLOR.gold },
  pending: { backgroundColor: COLOR.orangePale },
  disabled: { opacity: 0.45 },
  iconLg: { width: 24, height: 24 },
  iconMd: { width: 18, height: 18 },
  text: { color: PARCH.ink, fontFamily: FONT.bold },
  textLg: { fontSize: 21 },
  textMd: { fontSize: 17 },
});
