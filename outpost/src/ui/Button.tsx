import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Block, Outlined, type Bevel } from "../pixel";
import { ICON, type IconName } from "../Hud";
import { Dots } from "./Loader";
import { feel, type Feel } from "./feel";
import { FONT, PARCH } from "./tokens";

const SIZES = { lg: { font: 26, padV: 14, icon: 30 }, md: { font: 20, padV: 11, icon: 24 }, sm: { font: 16, padV: 7, icon: 20 } } as const;

export type ButtonProps = {
  label: string;
  onPress: () => void;
  // primary: gold with outlined white type, the one main action on a card or screen.
  // secondary: parchment with ink type, for the quieter choice beside it.
  variant?: "primary" | "secondary";
  // Any pixel.tsx bevel instead of the variant's color: green for go/collect, teal for the Scout, orange for remakes.
  bevel?: Bevel;
  size?: keyof typeof SIZES;
  icon?: IconName;
  disabled?: boolean;
  // Sunk, silent and not pressable, with dots after the label, while the action is in flight.
  loading?: boolean;
  loadingLabel?: string;
  feel?: Feel;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// The pixel bevel button: it sits on a hard ink shadow and sinks into it when pressed, with the shared click and a
// haptic. Disabled fades and flattens; loading stays sunk with dots, so a double tap can't fire twice.
export function Button({ label, onPress, variant = "primary", bevel, size = "lg", icon, disabled, loading, loadingLabel, feel: kind = "press",
  testID, accessibilityLabel, style }: ButtonProps) {
  const z = SIZES[size];
  const face = bevel ?? (variant === "primary" ? "gold" : "parch");
  const outlined = face !== "parch";
  const text = loading ? (loadingLabel ?? label) : label;
  return (
    <Pressable onPress={() => { feel(kind); onPress(); }} disabled={disabled || loading} testID={testID} style={style}
      accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: !!disabled, busy: !!loading }}>
      {({ pressed }) => {
        const down = pressed || !!loading;
        return (
          <Block bevel={face} depth={down ? 2 : 5} lift={down || disabled ? 0 : 4}
            style={[s.button, { paddingVertical: z.padV }, down && s.sunk, disabled && s.disabled]}>
            <View style={s.row}>
              {icon && !loading ? <Image source={ICON[icon]} style={{ width: z.icon, height: z.icon }} /> : null}
              {outlined ? <Outlined size={z.font}>{text}</Outlined>
                : <Text style={[s.ink, { fontSize: Math.round(z.font * 1.22), lineHeight: Math.round(z.font * 1.22 * 1.12) }]}>{text}</Text>}
              {loading ? <Dots color={outlined ? "#fff" : PARCH.ink} size={size === "sm" ? 4 : 6} /> : null}
            </View>
          </Block>
        );
      }}
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: { alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  sunk: { transform: [{ translateX: 4 }, { translateY: 4 }] },
  disabled: { opacity: 0.5 },
  ink: { color: PARCH.ink, fontFamily: FONT.bold },
});
