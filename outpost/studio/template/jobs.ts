import type { Look, Shot } from "./world";

// One timed thing on screen or in the mix. studio/reel.mjs works these out from the script and the voice timings.
export type Ev =
  | ({ k: "shot" } & Shot)
  | { k: "cap"; t: string; s: number; e: number; hi: [number, number] | null; tone: "y" | "r" | "g" }
  | { k: "tag"; a: string; b: string; s: number; e: number; n: number; of: number }
  | { k: "card"; s: number; e: number; title: string; rows: number; kind: "list" | "number" | "messages" }
  | { k: "item"; t: string; n: number; of: number; s: number; e: number }
  | { k: "count"; t: string; s: number; e: number; final: boolean }
  | { k: "bubble"; t: string; row: number; of: number; s: number; e: number }
  | { k: "flash"; s: number }
  | { k: "ctaPop"; s: number }
  | { k: "sfx"; src: string; s: number; vol: number };

export type Job = {
  id: string; palette: number; preset: number; audio: string; end: number; keyword: string;
  cta1: string; cta2: string; ctaSize: number; // the call to action: big first line through the keyword, then the rest
  look?: Look; // the set, the second character and the talking object; none means the night city and the invoice
  evs: Ev[];
};
export const JOBS: Job[] = [];
