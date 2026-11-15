import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { FONT, INK, PARCH } from "./pixel";

type Note = { id: string; text: string; sync: "pending" | "synced" | "failed" };
type Memory = { id: string; text: string; noteId: string };

const NODE_H = 46;
const GAP = 10;
const MAX_NOTES = 6;
const MAX_MEMORIES = 8;
const GREEN = "#3FAE3A";

// Notes on the left, the memories Supermemory made from each on the right, and a line for each link.
export function TasteGraph({ notes, memories }: { notes: Note[]; memories: Memory[] }) {
  const [w, setW] = useState(0);
  const left = notes.filter(n => n.sync === "synced").slice(0, MAX_NOTES);
  const byNote = left.map(n => memories.filter(m => m.noteId === n.id));
  const right: Memory[] = [];
  for (let round = 0; right.length < MAX_MEMORIES && byNote.some(list => list.length > round); round++) {
    for (const list of byNote) if (list[round] && right.length < MAX_MEMORIES) right.push(list[round]);
  }
  // Keep each note's memories together, in the notes' order, so lines cross as little as possible.
  right.sort((a, b) => left.findIndex(n => n.id === a.noteId) - left.findIndex(n => n.id === b.noteId));
  if (left.length === 0) return <Text style={s.muted}>Notes show here once they're in Supermemory.</Text>;

  const col = Math.max(0, (w - 40) / 2);
  const height = Math.max(left.length, right.length) * (NODE_H + GAP) - GAP;
  const top = (count: number, i: number) => (height - (count * (NODE_H + GAP) - GAP)) / 2 + i * (NODE_H + GAP);
  const noteY = new Map(left.map((n, i) => [n.id, top(left.length, i) + NODE_H / 2]));

  return (
    <View style={{ height, marginVertical: 14 }} onLayout={e => setW(e.nativeEvent.layout.width)} testID="taste-graph">
      {w > 0 && right.map((m, i) => {
        const x1 = col, y1 = noteY.get(m.noteId)!;
        const x2 = w - col, y2 = top(right.length, i) + NODE_H / 2;
        const len = Math.hypot(x2 - x1, y2 - y1);
        return (
          <View key={`e${m.id}`} style={[s.edge, {
            left: x1, top: y1, width: len, transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
          }]} />
        );
      })}
      {w > 0 && left.map((n, i) => (
        <Animated.View key={n.id} entering={FadeIn.duration(300)} style={[s.node, s.note, { left: 0, top: top(left.length, i), width: col }]}>
          <Text style={s.noteText} numberOfLines={2}>{n.text}</Text>
        </Animated.View>
      ))}
      {w > 0 && right.map((m, i) => (
        <Animated.View key={m.id} entering={FadeIn.duration(300).delay(150)} style={[s.node, s.memory, { left: w - col, top: top(right.length, i), width: col }]} testID="taste-memory">
          <View style={s.dot} />
          <Text style={s.memoryText} numberOfLines={3}>{m.text}</Text>
        </Animated.View>
      ))}
      {w > 0 && right.length === 0 && (
        <View style={[s.node, s.waiting, { left: w - col, top: (height - NODE_H) / 2, width: col }]}>
          <Text style={s.waitingText}>Supermemory is still reading these</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  muted: { color: PARCH.soft, fontSize: 17, fontFamily: FONT.semi, paddingVertical: 14 },
  node: { position: "absolute", height: NODE_H, borderWidth: 2, borderColor: INK, paddingHorizontal: 8, justifyContent: "center" },
  note: { backgroundColor: PARCH.top },
  noteText: { color: PARCH.ink, fontSize: 15, fontFamily: FONT.bold },
  memory: { backgroundColor: "#DDF3CC", flexDirection: "row", alignItems: "center", gap: 6 },
  memoryText: { color: "#244F22", fontSize: 15, fontFamily: FONT.semi, flex: 1 },
  dot: { width: 7, height: 7, borderWidth: 1, borderColor: INK, backgroundColor: GREEN },
  waiting: { borderStyle: "dashed", borderColor: PARCH.soft },
  waitingText: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi },
  edge: { position: "absolute", height: 2, backgroundColor: PARCH.soft, transformOrigin: "left center" },
});
