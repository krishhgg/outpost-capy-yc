import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Block, Sea, WoodHeader } from "./pixel";
import { Badge, Card, COLOR, EmptyState, FONT, PARCH, ProgressPill, ProgressSteps, SectionHeader, SPACE } from "./ui";

// The four nodes both kinds of job walk through. A staged one's last stage lands it in the Feed, so it ends on Done.
export const STEP_NAMES = ["Script", "Voice", "Render", "Done"];
// The studio worker's stage names, in order (convex/studio.ts).
const STUDIO_STAGES = ["writing script", "voicing", "rendering", "uploading"];

export type Stage = { label: string; ms: number };

// Where a staged generation is after `elapsed` ms. It holds on its last stage until the server says it landed.
export function stagedAt(stages: Stage[], elapsed: number, landed: boolean) {
  const total = stages.reduce((n, s) => n + s.ms, 0);
  if (landed && elapsed >= total) return { step: stages.length, label: "Done" };
  let at = 0;
  for (const [i, s] of stages.entries()) {
    at += s.ms;
    if (elapsed < at) return { step: i, label: s.label };
  }
  return { step: stages.length - 1, label: stages[stages.length - 1].label };
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

// The one honesty tag every pregenerated video carries where it shows as a card.
export function Pregenerated({ testID }: { testID?: string }) {
  return <Badge label="PREGENERATED FOR DEMO" tone="parch" size="sm" dashed testID={testID} />;
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
              <EmptyState title="No prompts yet" who="writer" testID="generations-empty"
                action={{ label: "Pick a prompt", onPress: () => router.push("/create"), testID: "generations-empty-create" }} />
            ) : data.staged.map(g => {
              const at = stagedAt(data.stages, now - g.startedAt, g.doneAt != null);
              const done = at.step >= data.stages.length;
              return (
                <Card key={g.id} testID="generation-staged">
                  <Text style={s.headline} numberOfLines={2}>{g.prompt}</Text>
                  <View style={s.meta}>
                    {done ? <ProgressPill label={g.video ? FEED_WORDS[g.video.status] ?? "Done" : "Not added"} state={g.video ? "done" : "failed"} /> : null}
                    {g.brand && !g.prompt.includes(g.brand) ? <Badge label={g.brand} tone="gold" size="sm" /> : null}
                    <Pregenerated />
                  </View>
                  {done ? null : <ProgressSteps steps={STEP_NAMES} current={at.step} />}
                </Card>
              );
            })}

            <SectionHeader title="In the studio" />
            {data.studio.length === 0 ? (
              <EmptyState title="Studio is quiet" who="director" testID="studio-empty" />
            ) : data.studio.map(r => (
              <Card key={r.id} testID="generation-studio">
                <Text style={s.headline} numberOfLines={2}>{r.title}</Text>
                {r.status === "making"
                  ? <ProgressSteps steps={STEP_NAMES} current={Math.max(0, STUDIO_STAGES.indexOf(r.stage ?? ""))} />
                  : <ProgressPill label="Waiting for the studio" state="waiting" />}
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  list: { padding: SPACE.lg, gap: SPACE.lg, paddingBottom: 60 },
  headline: { color: PARCH.ink, fontSize: 20, fontFamily: FONT.bold },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: SPACE.sm, marginTop: SPACE.sm, marginBottom: SPACE.sm },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  done: { color: COLOR.white, fontSize: 18, fontFamily: FONT.bold },
});
