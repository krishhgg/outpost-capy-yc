import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Block, Sea, WoodHeader } from "./pixel";
import { Badge, Card, COLOR, EmptyState, FONT, PARCH, ProgressBar, ProgressPill, ProgressSteps, SectionHeader, SPACE } from "./ui";

// The four nodes both kinds of job walk through. A staged one's last stage lands it in the Feed, so it ends on Done.
export const STEP_NAMES = ["Script", "Voice", "Render", "Done"];
// The studio worker's stage names, in order (convex/studio.ts).
const STUDIO_STAGES = ["writing script", "voicing", "rendering", "uploading"];

export type Stage = { label: string; ms: number };

// Where a staged generation is after `elapsed` ms. It holds on its last stage until the server says it landed.
export function stagedAt(stages: Stage[], elapsed: number, landed: boolean) {
  const total = stages.reduce((n, s) => n + s.ms, 0);
  if (landed && elapsed >= total) return { step: stages.length, label: "Done", value: 1 };
  let at = 0;
  for (const [i, s] of stages.entries()) {
    at += s.ms;
    if (elapsed < at) return { step: i, label: s.label, value: Math.max(0, elapsed) / total };
  }
  return { step: stages.length - 1, label: stages[stages.length - 1].label, value: 0.97 };
}

// Re-renders every `ms` while `on`.
export function useNow(ms: number, on = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms, on]);
  return now;
}

// The honesty tag every pregenerated video carries where it shows as a card.
export function Pregenerated({ testID }: { testID?: string }) {
  return (
    <View style={s.tagRow} testID={testID}>
      <Badge label="PREGENERATED" tone="parch" size="sm" dashed />
      <Text style={s.tagLine}>Pregenerated for the demo</Text>
    </View>
  );
}

export function DoneButton({ testID }: { testID: string }) {
  return (
    <Pressable onPress={() => router.back()} hitSlop={12} testID={testID} accessibilityRole="button" accessibilityLabel="Done">
      {({ pressed }) => (
        <Block bevel="slate" depth={pressed ? 1 : 3} lift={pressed ? 0 : 3}
          style={[s.doneBtn, pressed && { transform: [{ translateX: 3 }, { translateY: 3 }] }]}>
          <Text style={s.done}>Done</Text>
        </Block>
      )}
    </Pressable>
  );
}

const FEED_WORDS: Record<string, string> = { ready: "In your Feed", right: "Approved", left: "Sent back" };

// Every video being made for this user: staged prompts from the create screen, and real studio jobs with the
// worker's live stage.
export function Generations({ device }: { device: string }) {
  const data = useQuery(api.generate.list, { deviceId: device });
  const running = !!data?.staged.some(g => g.doneAt == null || Date.now() - g.startedAt < 20_000);
  const now = useNow(250, running);
  return (
    <View style={s.fill}>
      <Sea />
      <WoodHeader title="PROGRESS" size={28} sub="Videos being made for you" right={<DoneButton testID="generations-done" />} />
      <ScrollView style={s.fill} contentContainerStyle={s.list} testID="generations">
        {!data ? <Card loading testID="generations-loading" /> : (
          <>
            <SectionHeader title="From your prompts" action={{ label: "New prompt", onPress: () => router.push("/create"), testID: "generations-new" }} />
            {data.staged.length === 0 ? (
              <EmptyState title="No prompts yet" body="Pick a prompt and it shows up here." who="writer" testID="generations-empty"
                action={{ label: "Pick a prompt", onPress: () => router.push("/create"), testID: "generations-empty-create" }} />
            ) : data.staged.map(g => {
              const at = stagedAt(data.stages, now - g.startedAt, g.doneAt != null);
              const done = at.step >= data.stages.length;
              return (
                <Card key={g.id} testID="generation-staged">
                  <View style={s.cardTop}>
                    {g.brand ? <Badge label={g.brand} tone="gold" size="sm" /> : null}
                    <View style={s.flex} />
                    <ProgressPill label={done ? (g.video ? FEED_WORDS[g.video.status] ?? "Done" : "Not added") : at.label}
                      state={done ? (g.video ? "done" : "failed") : "working"} />
                  </View>
                  <Text style={s.prompt} numberOfLines={3}>{g.prompt}</Text>
                  <ProgressSteps steps={STEP_NAMES} current={at.step} />
                  {!done ? <ProgressBar value={at.value} style={s.bar} /> : null}
                  <Pregenerated />
                </Card>
              );
            })}

            <SectionHeader title="In the studio" sub="Remakes and new videos the laptop studio is making" />
            {data.studio.length === 0 ? (
              <EmptyState title="Nothing in the studio" body="Remakes you ask for in the Feed show up here." who="director" testID="studio-empty" />
            ) : data.studio.map(r => {
              const step = r.status === "making" ? Math.max(0, STUDIO_STAGES.indexOf(r.stage ?? "")) : -1;
              return (
                <Card key={r.id} testID="generation-studio">
                  <View style={s.cardTop}>
                    <Badge label="STUDIO" tone="slate" size="sm" />
                    <View style={s.flex} />
                    <ProgressPill label={r.status === "queued" ? "Waiting for the studio" : cap(r.stage ?? "starting")}
                      state={r.status === "queued" ? "waiting" : "working"} />
                  </View>
                  <Text style={s.prompt} numberOfLines={2}>{r.title}</Text>
                  {r.status === "making" ? <ProgressSteps steps={STEP_NAMES} current={step} /> : null}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const s = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  list: { padding: SPACE.lg, gap: SPACE.lg, paddingBottom: 60 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.sm },
  prompt: { color: PARCH.ink, fontSize: 19, fontFamily: FONT.bold, marginBottom: SPACE.md },
  bar: { marginTop: SPACE.md },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACE.md },
  tagLine: { color: PARCH.soft, fontSize: 15, fontFamily: FONT.semi, flexShrink: 1 },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  done: { color: COLOR.white, fontSize: 18, fontFamily: FONT.bold },
});
