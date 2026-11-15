import { createEffect, onCleanup } from "solid-js";
import { useResolution, useTicker } from "@compound/jsx";
import type { SceneNode } from "@compound/jsx";
import { JOBS, type Ev, type Job } from "./jobs";
import { W, H, acquireRenderer, buildWorld, releaseRenderer, type Shot } from "./world";

// A reel: the 3D set from world.ts filling the frame, a label on top, cards in the top third and word-timed captions
// at about two thirds down. studio/reel.mjs times everything; this file only draws it.
const PAD = 60;
const SANS = "Montserrat", MONO = "JetBrains Mono";
const CARD = { x: PAD, y: 190, w: W - 2 * PAD };
const CAP_Y = 1170;
const LIT = { y: "#FFD43B", r: "#FF4B4B", g: "#5BF08F" } as const;

// A quick pop: starts `from` times its size and snaps back, about the box's middle rather than its corner.
function Pop(p: { id: string; x: number; y: number; w: number; h: number; from?: number; at?: number; dur?: number }) {
  const f = p.from ?? 1.1, at = p.at ?? 0, d = p.dur ?? 0.14;
  return [
    <keyframeTrack id={`${p.id}-ps`} property="scale">
      <keyframe id={`${p.id}-ps0`} time={at} value={f} easing="easeOut" />
      <keyframe id={`${p.id}-ps1`} time={at + d} value={1} />
    </keyframeTrack>,
    <keyframeTrack id={`${p.id}-px`} property="x">
      <keyframe id={`${p.id}-px0`} time={at} value={p.x - ((f - 1) * p.w) / 2} easing="easeOut" />
      <keyframe id={`${p.id}-px1`} time={at + d} value={p.x} />
    </keyframeTrack>,
    <keyframeTrack id={`${p.id}-py`} property="y">
      <keyframe id={`${p.id}-py0`} time={at} value={p.y - ((f - 1) * p.h) / 2} easing="easeOut" />
      <keyframe id={`${p.id}-py1`} time={at + d} value={p.y} />
    </keyframeTrack>,
  ];
}

// The set, rendered by three.js into the surface's canvas every frame, from the playhead alone.
function Film(p: { id: string; j: Job }) {
  const { time } = useTicker();
  const resolution = useResolution();
  const shots = p.j.evs.filter((e): e is Extract<Ev, { k: "shot" }> => e.k === "shot") as Shot[];
  return (
    <surface id={p.id} x={0} y={0} width={W} height={H} start={0} end={p.j.end} ref={(node: SceneNode) => {
      const world = buildWorld(p.j.palette, p.j.look);
      const r = acquireRenderer();
      onCleanup(() => { world.dispose(); releaseRenderer(); });
      createEffect(() => {
        const t = time(), k = Math.min(1.5, resolution());
        const el = node.element;
        if (!el) return;
        const w = Math.round(W * k), h = Math.round(H * k);
        if (el.width !== w) { el.width = w; el.height = h; }
        const cam = world.frame(shots, t);
        if (r.domElement.width !== w || r.domElement.height !== h) r.setSize(w, h, false);
        r.render(world.scene, cam);
        el.getContext("2d")!.drawImage(r.domElement, 0, 0, w, h);
      });
    }} />
  );
}

function Draw(p: { id: string; ev: Ev; j: Job }) {
  const e = p.ev, id = p.id;
  switch (e.k) {
    case "cap": {
      const box = { x: PAD, y: CAP_Y, w: W - 2 * PAD, h: 200 };
      return (
        <text id={id} x={box.x} y={box.y} width={box.w} height={box.h} textAlign="center" textBaseline="middle" fontFamily={SANS} fontWeight={800}
          fontSize={76} letterSpacing={-1} leading={1.04} color="#FFFFFF" start={e.s} end={e.e}>
          {e.t}
          <stroke id={`${id}-st`} color="#0A0C1C" width={7} join="round" opacity={0.85} />
          <shadow id={`${id}-sh`} color="#000000" blur={22} offsetY={4} opacity={0.75} />
          {e.hi ? <textRange id={`${id}-hi`} start={e.hi[0]} end={e.hi[1]} color={LIT[e.tone]} /> : null}
          <Pop id={id} x={box.x} y={box.y} w={box.w} h={box.h} from={1.08} dur={0.12} />
        </text>
      );
    }
    case "tag": {
      const d = +(e.e - e.s).toFixed(3), text = e.b ? (e.a ? `${e.a} · ${e.b}` : e.b) : e.a;
      const dash = 30, gap = 10, x0 = (W - (e.of * dash + (e.of - 1) * gap)) / 2;
      return (
        <group id={id} start={e.s} end={e.e}>
          <text id={`${id}-t`} x={PAD} y={96} width={W - 2 * PAD} height={56} textAlign="center" textBaseline="middle" fontFamily={SANS} fontWeight={800}
            fontSize={34} letterSpacing={1.5} color="#FFFFFF" start={0} end={d}>
            {text}
            <shadow id={`${id}-t-sh`} color="#000000" blur={14} opacity={0.7} />
            {e.b ? <textRange id={`${id}-t-b`} start={text.length - e.b.length} end={text.length} color={LIT.y} /> : null}
          </text>
          {Array.from({ length: e.of }, (_, k) => (
            <rect id={`${id}-d${k}`} x={x0 + k * (dash + gap)} y={158} width={dash} height={6} cornerRadius={3} start={0} end={d}
              fill={k === e.n ? LIT.y : "#FFFFFF"} opacity={k === e.n ? 1 : k < e.n ? 0.55 : 0.2} />
          ))}
        </group>
      );
    }
    case "card": {
      const h = e.kind === "number" ? 330 : 96 + e.rows * (e.kind === "messages" ? 108 : 104);
      const d = +(e.e - e.s).toFixed(3);
      return (
        <group id={id} start={e.s} end={e.e}>
          <rect id={`${id}-bg`} x={CARD.x} y={CARD.y} width={CARD.w} height={h} cornerRadius={30} fill="#0A0F2C" opacity={0.88} start={0} end={d}>
            <stroke id={`${id}-bg-st`} color="#FFFFFF" width={2} opacity={0.14} />
            <shadow id={`${id}-bg-sh`} color="#000000" blur={40} offsetY={12} opacity={0.5} />
          </rect>
          <text id={`${id}-title`} x={CARD.x + 40} y={CARD.y + 30} width={CARD.w - 80} height={40} textBaseline="middle" fontFamily={MONO} fontWeight={600}
            fontSize={26} letterSpacing={3} color="#93A0D8" start={0} end={d}>
            {e.title}
          </text>
          <animation id={`${id}-in`} type="slideDown" duration={0.2} />
        </group>
      );
    }
    case "item": {
      const top = CARD.y + 84 + (e.n - 1) * 104, d = +(e.e - e.s).toFixed(3);
      return (
        <group id={id} start={e.s} end={e.e}>
          <text id={`${id}-n`} x={CARD.x + 40} y={top} width={90} height={92} textBaseline="middle" fontFamily={MONO} fontWeight={700} fontSize={40}
            color={LIT.y} start={0} end={d}>
            {String(e.n).padStart(2, "0")}
          </text>
          <text id={`${id}-t`} x={CARD.x + 130} y={top} width={CARD.w - 170} height={92} textBaseline="middle" fontFamily={SANS} fontWeight={800}
            fontSize={50} letterSpacing={-1} color="#FFFFFF" start={0} end={d}>
            {e.t}
          </text>
          <animation id={`${id}-in`} type="slideRight" duration={0.18} />
        </group>
      );
    }
    case "count": {
      const box = { x: CARD.x, y: CARD.y + 70, w: CARD.w, h: 240 };
      return (
        <text id={id} x={box.x} y={box.y} width={box.w} height={box.h} textAlign="center" textBaseline="middle" fontFamily={SANS} fontWeight={900}
          fontSize={190} letterSpacing={-4} color={LIT.y} start={e.s} end={e.e}>
          {e.t}
          <shadow id={`${id}-sh`} color="#FFB000" blur={40} opacity={0.45} />
          {e.final ? <Pop id={id} x={box.x} y={box.y} w={box.w} h={box.h} from={1.15} dur={0.18} /> : null}
        </text>
      );
    }
    case "bubble": {
      const size = 38, est = Math.min(CARD.w - 120, e.t.length * size * 0.56 + 64);
      const x = CARD.x + 40, y = CARD.y + 84 + e.row * 108;
      return (
        <text id={id} x={x} y={y} fontFamily={SANS} fontWeight={600} fontSize={size} color="#FFFFFF" background="#2A3262" padding={[20, 32]} radius={36}
          start={e.s} end={e.e}>
          {e.t}
          <Pop id={id} x={x} y={y} w={est} h={88} from={0.7} dur={0.18} />
        </text>
      );
    }
    case "flash":
      return (
        <rect id={id} x={0} y={0} width={W} height={H} fill="#FF2A2A" start={e.s} end={+(e.s + 0.18).toFixed(3)}>
          <keyframeTrack id={`${id}-ko`} property="opacity">
            <keyframe id={`${id}-ko0`} time={0} value={0.45} easing="easeOut" />
            <keyframe id={`${id}-ko1`} time={0.18} value={0} />
          </keyframeTrack>
        </rect>
      );
    case "sfx":
      return <audio id={id} src={`studio/sfx/${e.src}.wav`} start={e.s} volume={e.vol} />;
    default:
      return null;
  }
}

// The end card: the call to action with its keyword lit, popping in when the narrator says it.
function Cta(p: { j: Job }) {
  const j = p.j, id = `${j.id}-cta`;
  const at = j.evs.find(e => e.k === "ctaPop")?.s ?? j.end;
  const word = (flags: string) => new RegExp(`\\b${j.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, flags);
  const kw = !j.keyword ? -1 : j.cta1.search(word("")) >= 0 ? j.cta1.search(word("")) : j.cta1.search(word("i"));
  const h = j.cta2 ? 300 : 220, d = +(j.end - at).toFixed(3);
  return (
    <group id={id} start={at} end={j.end}>
      <rect id={`${id}-bg`} x={CARD.x} y={CARD.y} width={CARD.w} height={h} cornerRadius={30} fill="#0A0F2C" opacity={0.9} start={0} end={d}>
        <stroke id={`${id}-bg-st`} color={LIT.y} width={3} opacity={0.6} />
        <shadow id={`${id}-bg-sh`} color="#000000" blur={40} offsetY={12} opacity={0.5} />
      </rect>
      <text id={`${id}-1`} x={CARD.x + 30} y={CARD.y + 40} width={CARD.w - 60} height={Math.round(j.ctaSize * 1.3)} textAlign="center" textBaseline="middle"
        fontFamily={SANS} fontWeight={900} fontSize={j.ctaSize} letterSpacing={-1} color="#FFFFFF" start={0} end={d}>
        {j.cta1}
        {kw >= 0 ? <textRange id={`${id}-kw`} start={kw} end={kw + j.keyword.length} color={LIT.y} /> : null}
      </text>
      {j.cta2 ? (
        <text id={`${id}-2`} x={CARD.x + 30} y={CARD.y + 50 + Math.round(j.ctaSize * 1.3)} width={CARD.w - 60} textAlign="center" fontFamily={SANS}
          fontWeight={600} fontSize={42} color="#D5DBF5" start={0} end={d}>
          {j.cta2}
        </text>
      ) : null}
      <Pop id={id} x={0} y={0} w={W} h={2 * CARD.y + h} from={1.12} dur={0.2} />
    </group>
  );
}

function Reel(p: { id: string; j: Job; i: number; last: boolean }) {
  const j = p.j, id = j.id;
  return (
    <scene id={id} name={id} width={W} height={H} x={p.i * (W + 200)} fill="#000000" active={p.last} volume={-3}>
      <Film id={`${id}-film`} j={j} />
      <audio id={`${id}-voice`} src={j.audio} start={0} />
      <audio id={`${id}-bed`} src="studio/sfx/bed.wav" start={0} end={j.end} volume={-22}>
        <animation id={`${id}-bed-out`} type="gain" phase="out" duration={1} />
      </audio>

      {j.evs.map((e, k) => <Draw id={`${id}-e${k}`} ev={e} j={j} />)}
      <Cta j={j} />

      <text id={`${id}-ai`} x={0} y={1810} width={W} textAlign="center" fontFamily={SANS} fontWeight={600} fontSize={26} letterSpacing={2}
        color="#FFFFFF" opacity={0.55} start={0} end={j.end}>
        AI-made video
      </text>
    </scene>
  );
}

export default function Project() {
  return (
    <stage id="stage" background="#161616">
      {JOBS.map((j, i) => <Reel id={`reel-${j.id}`} j={j} i={i} last={i === JOBS.length - 1} />)}
    </stage>
  );
}
