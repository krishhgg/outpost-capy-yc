import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDevice } from "../session";
import { Badge } from "./Badge";
import { COLOR, FONT, INK, PARCH } from "./tokens";

// The v1 disclosure (COORDINATOR 1): every post goes to Outpost's own demo accounts, or in demo mode nothing posts at
// all. Small and calm, a gold DEMO tag and one line. `on` is what it sits on: the water (light type with an ink shadow)
// or a parchment card.
export function DemoNote({ text, on = "water", style, testID = "demo-note" }:
  { text?: string; on?: "water" | "card"; style?: StyleProp<ViewStyle>; testID?: string }) {
  const device = useDevice();
  const status = useQuery(api.feed.status, device && !text ? { deviceId: device } : "skip");
  const line = text ?? (status?.mode === "demo" ? "Posting is simulated" : "Posts go to Outpost's demo accounts");
  return (
    <View style={[s.row, style]} testID={testID} accessible accessibilityLabel={`Demo: ${line}`}>
      <Badge label="DEMO" tone="gold" size="sm" />
      <Text style={[s.text, on === "water" ? s.water : s.card]} numberOfLines={1}>{line}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
  text: { fontSize: 15, fontFamily: FONT.semi, flexShrink: 1 },
  water: { color: COLOR.foam, textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0 },
  card: { color: PARCH.soft },
});
