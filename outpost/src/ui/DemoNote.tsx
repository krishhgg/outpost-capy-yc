import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Badge } from "./Badge";
import { COLOR, FONT, INK, PARCH } from "./tokens";

// The v1 disclosure (COORDINATOR 1): every post goes to Outpost's own demo accounts. Small and calm, a gold DEMO tag
// and one line. `on` is what it sits on: the water (light type with an ink shadow) or a parchment card.
export function DemoNote({ text = "Posts go to Outpost's demo accounts", on = "water", style, testID = "demo-note" }:
  { text?: string; on?: "water" | "card"; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <View style={[s.row, style]} testID={testID} accessible accessibilityLabel={`Demo: ${text}`}>
      <Badge label="DEMO" tone="gold" size="sm" />
      <Text style={[s.text, on === "water" ? s.water : s.card]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
  text: { fontSize: 15, fontFamily: FONT.semi, flexShrink: 1 },
  water: { color: COLOR.foam, textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0 },
  card: { color: PARCH.soft },
});
