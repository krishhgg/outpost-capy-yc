import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Block, Sea, WoodHeader } from "./pixel";
import { Portrait } from "./Portrait";
import { DoneButton, Pregenerated, STEP_NAMES, stagedAt, useNow } from "./Generations";
import { Badge, Button, Card, COLOR, Dots, EmptyState, FONT, INK, PARCH, ProgressSteps, SPACE, feel } from "./ui";

type Suggestion = { id: Id<"videos">; prompt: string; hook: string; brand: string | null };

// The suggestion that shares the most words with what the user typed, or a random one when nothing matches.
function closest(text: string, list: Suggestion[]) {
  const words = (t: string) => new Set(t.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2));
  const mine = words(text);
  let best: Suggestion | null = null;
  let score = 0;
  for (const s of list) {
    const n = [...words(s.prompt + " " + (s.brand ?? ""))].filter(w => mine.has(w)).length;
    if (n > score) { best = s; score = n; }
  }
  return best ?? list[Math.floor(Math.random() * list.length)];
}

// A new chat: the writer offers prompts, each backed by a video that's already made. Picking one plays the staged
// steps, then the video waits at the front of the Feed.
export function Create({ device }: { device: string }) {
  const suggestions = useQuery(api.generate.suggestions, { deviceId: device });
  const list = useQuery(api.generate.list, { deviceId: device });
  const start = useMutation(api.generate.start);
  const [chat, setChat] = useState<{ id: Id<"generations"> | null; prompt: string; at: number } | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);

  const gen = chat?.id ? list?.staged.find(g => g.id === chat.id) : undefined;
  const stages = list?.stages ?? [];
  const now = useNow(200, !!chat);
  const at = chat && stages.length ? stagedAt(stages, now - chat.at, gen?.doneAt != null) : null;
  const done = !!at && at.step >= stages.length;

  const go = (s: Suggestion, prompt: string) => {
    setError(null);
    setText("");
    setChat({ id: null, prompt, at: Date.now() });
    start({ deviceId: device, suggestionId: s.id, prompt })
      .then(id => setChat(c => c && { ...c, id }))
      .catch(e => { setChat(null); setError(typeof e?.data === "string" ? e.data : "Couldn't start that one. Try another."); });
  };
  const submit = () => {
    const t = text.trim();
    if (!t || !suggestions?.length) return;
    feel("commit");
    go(closest(t, suggestions), t);
  };

  return (
    <View style={s.fill}>
      <Sea />
      <WoodHeader title="CREATE" size={28} sub="Pick a prompt for a paid bounty" right={<DoneButton testID="create-done" />} />
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scroll} style={s.fill} contentContainerStyle={s.chat} testID="create-chat" keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => chat && scroll.current?.scrollToEnd({ animated: true })}>
          <Agent text="What should we make?" />

          {!chat ? (
            !suggestions ? <Card loading testID="create-loading" />
              : suggestions.length === 0 ? (
                <EmptyState title="No prompts ready yet" who="writer" testID="create-empty"
                  action={{ label: "See progress", onPress: () => router.push("/generations"), testID: "create-empty-progress" }} />
              ) : (
                <View style={s.suggestions} testID="create-suggestions">
                  {suggestions.map((sug, i) => (
                    <Card key={sug.id} onPress={() => go(sug, sug.hook)} feel="commit" testID={"suggestion-" + i}
                      accessibilityLabel={"Make: " + sug.prompt} style={s.suggestion}>
                      <Text style={s.suggestionText} numberOfLines={2}>{sug.hook}</Text>
                      {sug.brand ? <Badge label={sug.brand} tone="gold" size="sm" /> : null}
                    </Card>
                  ))}
                </View>
              )
          ) : (
            <>
              <Animated.View entering={FadeInDown.duration(220)} style={s.mineWrap}>
                <Block bevel="gold" lift={3} style={s.mine} testID="create-prompt">
                  <Text style={s.mineText}>{chat.prompt}</Text>
                </Block>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(250).duration(220)}>
                <Card testID="create-progress">
                  <View style={s.agentRow}>
                    <Portrait who={done ? "director" : at && at.step >= 1 ? "director" : "writer"} style={s.face} />
                    <Text style={s.status} testID="create-stage">{done ? "Ready at the front of your Feed" : (at?.label ?? "Starting")}</Text>
                    {!done ? <Dots size={5} color={PARCH.ink} /> : null}
                  </View>
                  <ProgressSteps steps={STEP_NAMES} current={at?.step ?? 0} testID="create-steps" />
                  {done ? (
                    <>
                      {gen && !gen.video ? <Text style={s.warn}>Not available. Try another prompt.</Text> : <View style={s.tag}><Pregenerated testID="create-pregenerated" /></View>}
                      <View style={s.actions}>
                        <Button label="Open Feed" bevel="green" size="md" onPress={() => router.navigate("/feed")} testID="create-open-feed" style={s.grow} />
                        <Button label="New chat" variant="secondary" size="md" onPress={() => setChat(null)} testID="create-new" style={s.grow} />
                      </View>
                    </>
                  ) : null}
                </Card>
              </Animated.View>
            </>
          )}

          {error ? <Text style={s.error} testID="create-error">{error}</Text> : null}
          <Pressable onPress={() => router.push("/generations")} hitSlop={10} testID="create-progress-link" accessibilityRole="button">
            {({ pressed }) => <Text style={[s.link, pressed && { opacity: 0.6 }]}>See all progress</Text>}
          </Pressable>
        </ScrollView>

        {!chat ? (
          <View style={s.inputRow}>
            <TextInput style={s.input} value={text} onChangeText={setText} placeholder="Or describe a video" placeholderTextColor={PARCH.soft}
              returnKeyType="send" onSubmitEditing={submit} maxLength={200} testID="create-input" />
            <Button label="Make" size="sm" onPress={submit} disabled={!text.trim() || !suggestions?.length} testID="create-submit" />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

function Agent({ text }: { text: string }) {
  return (
    <View style={s.agentRow}>
      <Portrait who="writer" style={s.face} />
      <Block lift={3} style={s.agent}><Text style={s.agentText}>{text}</Text></Block>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1 },
  chat: { padding: SPACE.lg, gap: SPACE.lg, paddingBottom: 30 },
  agentRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.sm },
  face: { borderWidth: 2, borderColor: INK },
  agent: { padding: SPACE.md },
  agentText: { color: PARCH.ink, fontSize: 20, fontFamily: FONT.bold },
  suggestions: { gap: SPACE.md },
  suggestion: { padding: SPACE.md, paddingBottom: SPACE.md + 2, gap: SPACE.sm },
  suggestionText: { color: PARCH.ink, fontSize: 20, fontFamily: FONT.bold },
  mineWrap: { alignItems: "flex-end" },
  mine: { padding: SPACE.md, maxWidth: "85%" },
  mineText: { color: INK, fontSize: 18, fontFamily: FONT.bold },
  status: { color: PARCH.ink, fontSize: 21, fontFamily: FONT.bold, flexShrink: 1 },
  tag: { marginTop: SPACE.md },
  actions: { flexDirection: "row", gap: SPACE.md, marginTop: SPACE.lg },
  warn: { color: COLOR.redDeep, fontSize: 17, fontFamily: FONT.semi, marginTop: SPACE.md },
  error: { color: COLOR.foam, fontSize: 16, fontFamily: FONT.semi, textAlign: "center", textShadowColor: INK, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0 },
  link: { color: COLOR.sign, fontSize: 18, fontFamily: FONT.bold, textAlign: "center", textShadowColor: INK, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, padding: SPACE.md, paddingBottom: SPACE.xl, backgroundColor: "rgba(36,21,43,0.35)" },
  input: { flex: 1, backgroundColor: PARCH.top, color: PARCH.ink, borderWidth: 2, borderColor: INK, paddingHorizontal: 12, paddingVertical: 10, fontSize: 18, fontFamily: FONT.regular },
});
