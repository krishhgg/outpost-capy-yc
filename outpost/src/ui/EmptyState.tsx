import { Image, StyleSheet, Text, View } from "react-native";
import { Block } from "../pixel";
import { ICON, type IconName } from "../Hud";
import type { Who } from "../Agents";
import { Portrait } from "../Portrait";
import { Button } from "./Button";
import { Dots } from "./Loader";
import { FONT, PARCH } from "./tokens";

export type EmptyStateProps = {
  title: string;
  body?: string;
  // A village agent's portrait says who is on it ("the courier is fetching footage"); an icon suits a plain empty list.
  who?: Who;
  icon?: IconName;
  action?: { label: string; onPress: () => void; testID?: string };
  // Dots under the title, and no action, while the first data loads.
  loading?: boolean;
  testID?: string;
};

// What a screen shows instead of a blank: a parchment panel with a face or icon, one line of what's going on, one line
// of what happens next, and at most one button.
export function EmptyState({ title, body, who, icon, action, loading, testID }: EmptyStateProps) {
  return (
    <Block lift={4} style={s.panel} testID={testID}>
      {who ? <Portrait who={who} style={s.portrait} /> : icon ? <Image source={ICON[icon]} style={s.icon} /> : null}
      <Text style={s.title}>{title}</Text>
      {loading ? <View style={s.dots}><Dots color={PARCH.soft} size={7} /></View> : null}
      {body ? <Text style={s.body}>{body}</Text> : null}
      {action && !loading ? <Button label={action.label} onPress={action.onPress} size="md" bevel="green" testID={action.testID} style={s.button} /> : null}
    </Block>
  );
}

const s = StyleSheet.create({
  panel: { alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  portrait: { marginBottom: 10 },
  icon: { width: 48, height: 48, marginBottom: 8 },
  title: { color: PARCH.ink, fontSize: 23, fontFamily: FONT.bold, textAlign: "center" },
  dots: { marginTop: 10 },
  body: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.semi, textAlign: "center", lineHeight: 22, marginTop: 6 },
  button: { alignSelf: "stretch", marginTop: 16 },
});
