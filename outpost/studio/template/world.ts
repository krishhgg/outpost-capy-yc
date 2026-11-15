// The 3D set every reel is shot on: the blocky freelancer (he is "you"), an optional second character, a talking
// object, and one of four sets. reel.mjs decides the shots; this file builds the set and, for any time t, poses
// everyone and places the camera. Everything is a function of t, so exports and captures are frame-exact.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const W = 1080, H = 1920;

export type Act = "talk" | "type" | "phone" | "facepalm" | "shrug" | "point" | "think" | "shock" | "celebrate" | "wave" | "slump" | "idle";
export type Mood = "neutral" | "happy" | "worried" | "shocked" | "smug" | "sad" | "determined";
export type Cam = "cu" | "mcu" | "ms" | "wide" | "low" | "ots" | "mascot" | "orbit" | "top" | "them";
export type Tint = "night" | "alarm" | "bright";
export type Bill = "happy" | "worried" | "overdue" | "paid";
// hud: a card sits in the top third, so the camera tilts up and the freelancer drops lower in the frame.
// act2 and mood2 are the second character's; talk is whose mouth moves ("" while the narrator speaks).
export type Shot = {
  s: number; e: number; cam: Cam; act: Act; mood: Mood; tint: Tint; bill: Bill; seed: number; hud: boolean;
  act2?: Act; mood2?: Mood; talk?: "me" | "them" | "";
};
// What a video is shot with. Unknown names fall back to the night city, no second character, and the invoice.
export type Look = { set?: string; cast?: string; buddy?: string };
type Paint = { accent: string; top: string };

// One world palette per video: the sky, the floor grid, the rim light, and the hoodie that goes with them.
const WORLDS = [
  { top: "#2A2F86", bottom: "#070924", grid: "#4459E8", rim: "#6F86FF", hoodie: "#2EC4B6", city: "#FFD98A" },
  { top: "#4A2277", bottom: "#0D0620", grid: "#9A5BEA", rim: "#C68BFF", hoodie: "#FF8A3D", city: "#FFC6F0" },
  { top: "#0F4C5E", bottom: "#03141A", grid: "#2BC3D0", rim: "#64E8EE", hoodie: "#FF5D73", city: "#C8FFF6" },
  { top: "#5A2418", bottom: "#140605", grid: "#E2703F", rim: "#FFA36B", hoodie: "#5DA9FF", city: "#FFE0B0" },
  { top: "#173F2E", bottom: "#04120B", grid: "#30C77F", rim: "#83F5B8", hoodie: "#F2F2F2", city: "#E6FFB8" },
];
// The same freelancer in every video, so the account has a face people come back to.
const SKIN = "#C98B5E", HAIR = "#24160F", PANTS = "#1D2340", SHOES = "#F4F4F4";

// Everyone else a story can need. Each has a build, hair and clothes of their own, so a dialogue reads at a glance.
type Style = {
  skin: string; hair: string; hairdo: "short" | "long" | "bun" | "cap" | "bald" | "curly";
  top: string; topKind: "hoodie" | "suit" | "tee" | "blazer" | "cardigan"; pants: string; shoes: string;
  glasses: boolean; tie?: string; hat?: string; stache?: boolean; scale: number;
};
export const CAST: Record<string, Style> = {
  boss: { skin: "#E3B58F", hair: "#8E8E8E", hairdo: "short", top: "#2B2E3F", topKind: "suit", tie: "#D7263D", pants: "#22252F", shoes: "#1A1A1A", glasses: false, scale: 1.06 },
  client: { skin: "#8D5A3B", hair: "#15100E", hairdo: "long", top: "#8E44AD", topKind: "blazer", pants: "#2C2C3A", shoes: "#1A1A1A", glasses: false, scale: 0.98 },
  friend: { skin: "#F1C27D", hair: "#B5651D", hairdo: "cap", hat: "#2E86DE", top: "#FFB703", topKind: "tee", pants: "#3D5A80", shoes: "#FFFFFF", glasses: false, scale: 0.97 },
  coworker: { skin: "#B07A55", hair: "#3B2416", hairdo: "bun", top: "#3FA796", topKind: "cardigan", pants: "#2E3440", shoes: "#5C4033", glasses: true, scale: 0.95 },
  roommate: { skin: "#D49A6A", hair: "#1E1E1E", hairdo: "curly", top: "#9B5DE5", topKind: "hoodie", pants: "#4A4E69", shoes: "#F15BB5", glasses: false, scale: 1.0 },
  landlord: { skin: "#E8B48F", hair: "#DADADA", hairdo: "bald", top: "#6C757D", topKind: "tee", pants: "#3E3E3E", shoes: "#2B2B2B", glasses: false, stache: true, scale: 1.04 },
};
export const BUDDIES = ["invoice", "piggy", "calendar", "mug"];
export const SETS = ["city", "office", "home", "cafe"];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const outBack = (x: number) => { const t = clamp01(x), c = 1.6; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const rnd = (seed: number, n: number) => { const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}
function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}
const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...extra });

// ---------- Faces ----------
// Big square eyes, thick brows and a mouth, drawn per mood; `blink` closes the eyes, `gaze` moves the pupils, and
// `open` (0 to 1) opens the mouth while the character speaks.
function drawFace(g: CanvasRenderingContext2D, st: Style, mood: Mood, blink: boolean, gx: number, gy: number, open = 0) {
  const S = 512, SK = st.skin, BROW = st.hairdo === "bald" ? "#6E5A4A" : st.hair;
  g.fillStyle = SK;
  g.fillRect(0, 0, S, S);
  const eyeY = 228, eyes = [150, 362];
  const ew = 108, eh = mood === "shocked" ? 132 : mood === "smug" ? 70 : 118;
  for (const [k, ex] of eyes.entries()) {
    if (blink) {
      g.fillStyle = "#1A1210";
      g.fillRect(ex - ew / 2, eyeY + 8, ew, 14);
    } else {
      g.fillStyle = "#FFFFFF";
      rr(g, ex - ew / 2, eyeY - eh / 2, ew, eh, 14);
      g.fill();
      const pw = mood === "shocked" ? 34 : 50, ph = mood === "shocked" ? 40 : 62;
      const px = ex - pw / 2 + gx * 18 + (mood === "smug" ? 14 : 0), py = eyeY - ph / 2 + gy * 16 + (mood === "smug" ? 6 : 4);
      g.fillStyle = "#14100E";
      rr(g, px, py, pw, Math.min(ph, eh - 8), 8);
      g.fill();
      g.fillStyle = "#FFFFFF";
      g.fillRect(px + pw - 18, py + 8, 12, 12);
      if (mood === "smug") {
        // Heavy lids.
        g.fillStyle = SK;
        g.fillRect(ex - ew / 2 - 2, eyeY - eh / 2 - 4, ew + 4, 26);
        g.fillStyle = "#1A1210";
        g.fillRect(ex - ew / 2 - 2, eyeY - eh / 2 + 18, ew + 4, 9);
      }
    }
    // Brows: angle and height say most of the mood.
    const side = k === 0 ? -1 : 1;
    // Positive lifts the inner ends (worried, sad); negative drops them (determined).
    const tilt = { neutral: 0, happy: 0.08, worried: 0.3, shocked: 0, smug: -0.12, sad: 0.34, determined: -0.32 }[mood] * side;
    const lift = { neutral: 0, happy: -10, worried: -14, shocked: -34, smug: 4, sad: -6, determined: 10 }[mood];
    g.save();
    g.translate(ex, eyeY - eh / 2 - 34 + lift);
    g.rotate(tilt);
    g.fillStyle = BROW;
    g.fillRect(-64, -14, 128, 30);
    g.restore();
  }
  if (st.glasses) {
    // Thick dark frames and a bridge. On the freelancer they are what makes him this account's face.
    g.strokeStyle = "#16181F";
    g.lineWidth = 14;
    for (const ex of eyes) { rr(g, ex - 78, eyeY - 74, 156, 148, 22); g.stroke(); }
    g.fillStyle = "#16181F";
    g.fillRect(228, eyeY - 14, 56, 14);
    g.fillRect(0, eyeY - 20, 72, 12);
    g.fillRect(440, eyeY - 20, 72, 12);
  }
  // Nose shadow and cheeks.
  g.fillStyle = "rgba(90,40,20,0.22)";
  g.fillRect(240, 300, 32, 46);
  if (mood === "happy" || mood === "shocked") {
    g.fillStyle = "rgba(255,90,90,0.25)";
    g.fillRect(84, 318, 70, 30);
    g.fillRect(358, 318, 70, 30);
  }
  if (st.stache) {
    g.fillStyle = st.hair;
    rr(g, 176, 350, 160, 30, 14);
    g.fill();
  }
  // Mouth.
  g.fillStyle = "#3A1410";
  g.strokeStyle = "#3A1410";
  g.lineCap = "round";
  g.lineWidth = 16;
  const my = 395;
  if (open > 0.05) {
    // Speaking: an open mouth whose height follows the syllables, wider when happy.
    const w = mood === "happy" ? 120 : 92, h = 18 + 62 * open;
    rr(g, 256 - w / 2, my - h / 2 + 4, w, h, Math.min(h / 2, 28));
    g.fill();
    g.fillStyle = "#E86A6A";
    if (h > 40) { rr(g, 256 - w / 3, my + h / 2 - 22, (2 * w) / 3, 14, 7); g.fill(); }
    return;
  }
  g.beginPath();
  switch (mood) {
    case "happy":
      g.moveTo(186, my - 18);
      g.quadraticCurveTo(256, my + 20, 326, my - 18);
      g.lineTo(316, my - 4);
      g.quadraticCurveTo(256, my + 72, 196, my - 4);
      g.closePath();
      g.fill();
      g.fillStyle = "#FFFFFF";
      g.fillRect(214, my - 12, 84, 14);
      break;
    case "shocked":
      g.ellipse(256, my + 4, 34, 44, 0, 0, Math.PI * 2);
      g.fill();
      break;
    case "worried":
      g.moveTo(200, my + 10);
      for (let i = 0; i <= 6; i++) g.lineTo(200 + i * 19, my + 10 + (i % 2 ? -12 : 0));
      g.stroke();
      break;
    case "sad":
      g.moveTo(206, my + 22);
      g.quadraticCurveTo(256, my - 26, 306, my + 22);
      g.stroke();
      break;
    case "smug":
      g.moveTo(206, my + 8);
      g.quadraticCurveTo(268, my + 22, 318, my - 16);
      g.stroke();
      break;
    case "determined":
      g.moveTo(206, my + 6);
      g.lineTo(306, my + 6);
      g.stroke();
      break;
    default:
      g.moveTo(216, my);
      g.quadraticCurveTo(256, my + 14, 296, my);
      g.stroke();
  }
}

// ---------- The invoice ----------
function drawBill(g: CanvasRenderingContext2D, mood: Bill, blink: boolean, w: Paint) {
  const Wd = 512, Ht = 660;
  g.fillStyle = "#F7F2E6";
  g.fillRect(0, 0, Wd, Ht);
  g.fillStyle = w.accent;
  g.fillRect(0, 0, Wd, 92);
  g.fillStyle = "#FFFFFF";
  g.font = "800 46px Helvetica, Arial, sans-serif";
  g.textBaseline = "middle";
  g.fillText("INVOICE", 34, 48);
  g.font = "600 30px Menlo, monospace";
  g.textAlign = "right";
  g.fillText("#0042", Wd - 30, 50);
  g.textAlign = "left";
  // Face.
  const ey = 210;
  for (const ex of [176, 336]) {
    g.fillStyle = "#1B1B22";
    if (blink) g.fillRect(ex - 30, ey, 60, 10);
    else if (mood === "happy" || mood === "paid") {
      g.lineWidth = 14; g.strokeStyle = "#1B1B22"; g.lineCap = "round";
      g.beginPath(); g.moveTo(ex - 30, ey + 14); g.lineTo(ex, ey - 14); g.lineTo(ex + 30, ey + 14); g.stroke();
    } else {
      rr(g, ex - 24, ey - 30, 48, 62, 12); g.fill();
      g.fillStyle = "#FFFFFF"; g.fillRect(ex + 2, ey - 22, 12, 12);
    }
  }
  g.strokeStyle = "#1B1B22"; g.lineWidth = 12; g.lineCap = "round";
  g.beginPath();
  if (mood === "happy" || mood === "paid") { g.moveTo(222, 282); g.quadraticCurveTo(256, 312, 290, 282); }
  else if (mood === "overdue") { g.moveTo(216, 300); g.quadraticCurveTo(256, 266, 296, 300); }
  else { g.moveTo(222, 292); g.lineTo(240, 282); g.lineTo(256, 292); g.lineTo(272, 282); g.lineTo(290, 292); }
  g.stroke();
  // Line items.
  g.fillStyle = "#C9C2B2";
  for (let i = 0; i < 4; i++) {
    g.fillRect(40, 372 + i * 46, 250 - (i % 2) * 70, 16);
    g.fillRect(380, 372 + i * 46, 90, 16);
  }
  g.fillStyle = "#1B1B22";
  g.fillRect(40, 568, 432, 4);
  g.font = "800 40px Helvetica, Arial, sans-serif";
  g.fillText("TOTAL", 40, 612);
  // The stamp says where the money is.
  if (mood === "overdue" || mood === "paid") {
    g.save();
    g.translate(256, 470);
    g.rotate(-0.22);
    const c = mood === "overdue" ? "#E8322B" : "#18B45B";
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 12;
    rr(g, -190, -58, 380, 116, 16); g.stroke();
    g.font = "900 82px Helvetica, Arial, sans-serif";
    g.textAlign = "center";
    g.fillText(mood === "overdue" ? "OVERDUE" : "PAID", 0, 6);
    g.restore();
  }
}

// ---------- The other talking objects ----------
// They share the invoice's face and its stamp, so every object acts out the same three states: worried, a red
// stamp on a mistake, and a green one after the turn.
function objEyes(g: CanvasRenderingContext2D, xs: number[], ey: number, mood: Bill, blink: boolean, k = 1) {
  for (const ex of xs) {
    g.fillStyle = "#1B1B22";
    if (blink) g.fillRect(ex - 30 * k, ey, 60 * k, 10 * k);
    else if (mood === "happy" || mood === "paid") {
      g.lineWidth = 14 * k; g.strokeStyle = "#1B1B22"; g.lineCap = "round";
      g.beginPath(); g.moveTo(ex - 30 * k, ey + 14 * k); g.lineTo(ex, ey - 14 * k); g.lineTo(ex + 30 * k, ey + 14 * k); g.stroke();
    } else {
      rr(g, ex - 24 * k, ey - 30 * k, 48 * k, 62 * k, 12 * k); g.fill();
      g.fillStyle = "#FFFFFF"; g.fillRect(ex + 2 * k, ey - 22 * k, 12 * k, 12 * k);
    }
  }
}
function objMouth(g: CanvasRenderingContext2D, cx: number, my: number, mood: Bill, k = 1) {
  g.strokeStyle = "#1B1B22"; g.lineWidth = 12 * k; g.lineCap = "round";
  g.beginPath();
  if (mood === "happy" || mood === "paid") { g.moveTo(cx - 34 * k, my); g.quadraticCurveTo(cx, my + 30 * k, cx + 34 * k, my); }
  else if (mood === "overdue") { g.moveTo(cx - 40 * k, my + 14 * k); g.quadraticCurveTo(cx, my - 20 * k, cx + 40 * k, my + 14 * k); }
  else { g.moveTo(cx - 34 * k, my + 4 * k); for (let i = 1; i <= 4; i++) g.lineTo(cx - 34 * k + i * 17 * k, my + (i % 2 ? -6 : 4) * k); }
  g.stroke();
}
function stamp(g: CanvasRenderingContext2D, cx: number, cy: number, text: string, good: boolean, k = 1) {
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.22);
  const c = good ? "#18B45B" : "#E8322B";
  g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 12 * k;
  g.font = `900 ${Math.round(82 * k)}px Helvetica, Arial, sans-serif`;
  const w = Math.max(300 * k, g.measureText(text).width + 70 * k);
  rr(g, -w / 2, -58 * k, w, 116 * k, 16 * k); g.stroke();
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 0, 6 * k);
  g.restore();
}
const STAMP: Record<string, [string, string]> = { piggy: ["BROKE", "SAVED"], calendar: ["LATE", "DONE"], mug: ["EMPTY", "FULL"] };

function drawPiggy(g: CanvasRenderingContext2D, mood: Bill, blink: boolean) {
  const Wd = 512, Ht = 404;
  g.fillStyle = "#F4A6C1"; g.fillRect(0, 0, Wd, Ht);
  objEyes(g, [150, 362], 120, mood, blink);
  // The snout, with its nostrils.
  g.fillStyle = "#EC7FA6"; g.beginPath(); g.ellipse(256, 222, 78, 52, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#A8466C";
  for (const x of [228, 284]) { g.beginPath(); g.ellipse(x, 222, 13, 20, 0, 0, Math.PI * 2); g.fill(); }
  objMouth(g, 256, 318, mood);
  if (mood === "overdue" || mood === "paid") stamp(g, 256, 300, STAMP.piggy[mood === "paid" ? 1 : 0], mood === "paid", 0.8);
}
function drawCalendar(g: CanvasRenderingContext2D, mood: Bill, blink: boolean, w: Paint) {
  const Wd = 512, Ht = 660;
  g.fillStyle = "#FBFAF5"; g.fillRect(0, 0, Wd, Ht);
  g.fillStyle = "#E8322B"; g.fillRect(0, 0, Wd, 120);
  g.fillStyle = "#FFFFFF"; g.font = "900 64px Helvetica, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("FRIDAY", Wd / 2, 64);
  // Rings on top.
  g.fillStyle = "#3A3D4A";
  for (const x of [130, 382]) { rr(g, x - 14, -10, 28, 50, 12); g.fill(); }
  objEyes(g, [176, 336], 236, mood, blink);
  objMouth(g, 256, 316, mood);
  // A week of days below the face, with today ringed.
  g.font = "700 34px Helvetica, Arial, sans-serif"; g.fillStyle = "#9A98A8";
  for (let i = 0; i < 7; i++) {
    const x = 52 + i * 68, y = 430;
    g.fillText(String(9 + i), x, y);
    if (i === 6) { g.strokeStyle = w.accent; g.lineWidth = 6; g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.stroke(); }
  }
  g.fillStyle = "#D9D6CC";
  for (let i = 0; i < 2; i++) g.fillRect(40, 500 + i * 46, 432 - i * 120, 16);
  g.textAlign = "left";
  if (mood === "overdue" || mood === "paid") stamp(g, 256, 520, STAMP.calendar[mood === "paid" ? 1 : 0], mood === "paid");
}
// The mug's canvas wraps around a cylinder; the face sits in the middle half, which faces the camera.
function drawMug(g: CanvasRenderingContext2D, mood: Bill, blink: boolean, w: Paint) {
  const Wd = 1024, Ht = 512;
  g.fillStyle = "#F3EEE4"; g.fillRect(0, 0, Wd, Ht);
  g.fillStyle = w.accent; g.fillRect(0, Ht - 70, Wd, 26);
  objEyes(g, [432, 592], 180, mood, blink, 0.9);
  objMouth(g, 512, 270, mood, 0.9);
  if (mood === "happy" || mood === "paid") {
    g.fillStyle = "rgba(255,110,110,0.3)";
    g.fillRect(352, 236, 56, 24); g.fillRect(616, 236, 56, 24);
  }
  if (mood === "overdue" || mood === "paid") stamp(g, 512, 380, STAMP.mug[mood === "paid" ? 1 : 0], mood === "paid", 0.75);
}

// ---------- The laptop and phone screens ----------
function drawLaptop(g: CanvasRenderingContext2D, w: Paint, paid: boolean) {
  const Wd = 640, Ht = 400;
  g.fillStyle = "#11131C";
  g.fillRect(0, 0, Wd, Ht);
  g.fillStyle = "#1C2030";
  g.fillRect(0, 0, Wd, 40);
  for (const [i, c] of ["#FF5F57", "#FEBC2E", "#28C840"].entries()) { g.fillStyle = c; g.beginPath(); g.arc(24 + i * 22, 20, 7, 0, 7); g.fill(); }
  g.fillStyle = "#E9ECF5";
  g.font = "800 30px Helvetica, Arial, sans-serif";
  g.textBaseline = "middle";
  g.fillText("Clients", 28, 76);
  const rows = [["Studio North", "$1,200"], ["Maple & Co", "$640"], ["Juniper", "$2,050"], ["Oak Lane", "$480"]];
  rows.forEach(([n, a], i) => {
    const y = 124 + i * 64;
    g.fillStyle = i % 2 ? "#161A27" : "#1A1F2E";
    g.fillRect(20, y - 26, Wd - 40, 56);
    g.fillStyle = "#C9CEDC"; g.font = "600 24px Helvetica, Arial, sans-serif";
    g.fillText(n, 36, y + 2);
    g.fillText(a, 330, y + 2);
    const late = !paid && i % 2 === 0;
    g.fillStyle = late ? "#E8322B" : "#18B45B";
    rr(g, 470, y - 16, 130, 36, 18); g.fill();
    g.fillStyle = "#FFFFFF"; g.font = "800 20px Helvetica, Arial, sans-serif";
    g.textAlign = "center"; g.fillText(late ? "OVERDUE" : "PAID", 535, y + 2); g.textAlign = "left";
  });
  g.fillStyle = w.accent;
  g.fillRect(0, Ht - 6, Wd, 6);
}

function drawPhone(g: CanvasRenderingContext2D, w: Paint) {
  const Wd = 256, Ht = 512;
  const grd = g.createLinearGradient(0, 0, 0, Ht);
  grd.addColorStop(0, w.top); grd.addColorStop(1, "#05060C");
  g.fillStyle = grd; g.fillRect(0, 0, Wd, Ht);
  g.fillStyle = "#FFFFFF"; g.font = "700 54px Helvetica, Arial, sans-serif"; g.textAlign = "center";
  g.fillText("9:41", Wd / 2, 96);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = "rgba(255,255,255,0.88)";
    rr(g, 16, 150 + i * 98, Wd - 32, 82, 18); g.fill();
    g.fillStyle = i === 0 ? "#E8322B" : w.accent;
    rr(g, 28, 166 + i * 98, 48, 48, 12); g.fill();
    g.fillStyle = "#3A3F4E";
    g.fillRect(88, 172 + i * 98, 130, 12);
    g.fillRect(88, 196 + i * 98, 96, 10);
  }
}

// ---------- Sets ----------
// Each set is a backdrop of walls and props around the same stage, open toward the camera like a sitcom set, plus
// the light it is lit with. The city is the original night scene: a grid floor and lit towers in the fog.
type Rig = {
  root: THREE.Group; hips: THREE.Group; torso: THREE.Group; head: THREE.Group;
  armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group;
};
type SetLight = { fog: string; near: number; far: number; hemi: [string, string, number]; key: [string, number]; rim: [string, number]; sky: string[]; grid: boolean };
export type World = ReturnType<typeof buildWorld>;

function wallTex(set: string, P: (typeof WORLDS)[number]) {
  const c = canvas(1536, 576), g = c.getContext("2d")!;
  if (set === "office") {
    g.fillStyle = "#DCE1EA"; g.fillRect(0, 0, 1536, 576);
    // A band of tall windows onto a daytime skyline.
    for (let i = 0; i < 6; i++) {
      const x = 90 + i * 232, y = 70, w = 200, h = 330;
      const sky = g.createLinearGradient(0, y, 0, y + h);
      sky.addColorStop(0, "#8FC9F2"); sky.addColorStop(1, "#E4F3FD");
      g.fillStyle = sky; g.fillRect(x, y, w, h);
      for (let b = 0; b < 4; b++) {
        const bw = 30 + rnd(i, b) * 40, bh = 80 + rnd(b, i + 9) * 170, bx = x + rnd(i + 3, b) * (w - bw);
        g.fillStyle = b % 2 ? "#9AA9BE" : "#B5C1D2"; g.fillRect(bx, y + h - bh, bw, bh);
      }
      g.strokeStyle = "#8A93A6"; g.lineWidth = 10; g.strokeRect(x, y, w, h);
      g.fillStyle = "#8A93A6"; g.fillRect(x + w / 2 - 3, y, 6, h);
    }
    g.fillStyle = "#B8BFCC"; g.fillRect(0, 450, 1536, 18);
    // A wall clock.
    g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(1460, 40, 0, 0, 7); g.fill();
  } else if (set === "home") {
    g.fillStyle = new THREE.Color(P.top).lerp(new THREE.Color("#3A2F4F"), 0.5).getStyle(); g.fillRect(0, 0, 1536, 576);
    // A window onto the night, with a moon and a skyline of lit windows.
    const x = 560, y = 90, w = 420, h = 300;
    const sky = g.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, "#0B1033"); sky.addColorStop(1, "#2B2F6E");
    g.fillStyle = sky; g.fillRect(x, y, w, h);
    g.fillStyle = "#FFF4C9"; g.beginPath(); g.arc(x + 320, y + 80, 34, 0, 7); g.fill();
    for (let b = 0; b < 9; b++) {
      const bw = 34 + rnd(b, 2) * 30, bh = 60 + rnd(b, 3) * 120, bx = x + b * 48;
      g.fillStyle = "#14183A"; g.fillRect(bx, y + h - bh, bw, bh);
      g.fillStyle = "#FFD98A";
      for (let k = 0; k < 6; k++) if (rnd(b, k + 20) > 0.55) g.fillRect(bx + 6 + (k % 2) * 14, y + h - bh + 10 + Math.floor(k / 2) * 22, 8, 10);
    }
    g.strokeStyle = "#F2E8DA"; g.lineWidth = 16; g.strokeRect(x, y, w, h);
    g.fillStyle = "#F2E8DA"; g.fillRect(x + w / 2 - 5, y, 10, h); g.fillRect(x, y + h / 2 - 5, w, 10);
    // Posters and a shelf of books.
    const posters: [number, number, string, string][] = [[140, 120, "#FF6B6B", "#FFE66D"], [330, 160, "#4ECDC4", "#1A535C"], [1130, 110, "#F7B801", "#6A4C93"]];
    for (const [px, py, a, b] of posters) {
      g.fillStyle = a; g.fillRect(px, py, 150, 200);
      g.fillStyle = b; g.beginPath(); g.arc(px + 75, py + 90, 46, 0, 7); g.fill();
      g.fillRect(px + 25, py + 160, 100, 14);
    }
    g.fillStyle = "#6B4A33"; g.fillRect(1100, 380, 300, 14);
    for (let i = 0; i < 9; i++) { g.fillStyle = ["#E63946", "#457B9D", "#F1FAEE", "#2A9D8F", "#E9C46A"][i % 5]; g.fillRect(1110 + i * 30, 380 - 50 - (i % 3) * 10, 22, 50 + (i % 3) * 10); }
  } else {
    // The cafe: a brick wall, a chalkboard menu and shelves of cups.
    g.fillStyle = "#8C4A35"; g.fillRect(0, 0, 1536, 576);
    for (let row = 0; row < 24; row++) for (let col = 0; col < 33; col++) {
      const x = col * 48 - (row % 2) * 24, y = row * 24;
      g.fillStyle = ["#A65A40", "#9A5139", "#B0664A", "#94503A"][(row * 7 + col * 3) % 4];
      g.fillRect(x + 2, y + 2, 44, 20);
    }
    g.fillStyle = "#26302B"; rr(g, 560, 70, 420, 260, 10); g.fill();
    g.strokeStyle = "#6B4A33"; g.lineWidth = 14; rr(g, 560, 70, 420, 260, 10); g.stroke();
    g.fillStyle = "#F4F1E8"; g.font = "800 52px Helvetica, Arial, sans-serif"; g.textAlign = "center"; g.fillText("MENU", 770, 130);
    g.font = "600 28px Helvetica, Arial, sans-serif"; g.textAlign = "left";
    for (const [i, t] of ["Coffee", "Latte", "Tea", "Toast"].entries()) {
      g.fillText(t, 610, 180 + i * 38);
      g.fillRect(800, 172 + i * 38, 120, 4);
    }
    for (const sx of [120, 1130]) {
      g.fillStyle = "#6B4A33"; g.fillRect(sx, 220, 300, 14); g.fillRect(sx, 330, 300, 14);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = ["#F4F1E8", "#2A9D8F", "#E9C46A"][i % 3];
        rr(g, sx + 16 + i * 46, 220 - 44, 34, 44, 6); g.fill();
        rr(g, sx + 16 + i * 46, 330 - 36, 34, 36, 6); g.fill();
      }
    }
  }
  return c;
}

function floorTex(set: string) {
  const c = canvas(256, 256), g = c.getContext("2d")!;
  if (set === "office") {
    for (const [x, y, col] of [[0, 0, "#5E6A80"], [128, 0, "#56627A"], [0, 128, "#56627A"], [128, 128, "#5E6A80"]] as const) {
      g.fillStyle = col; g.fillRect(x, y, 128, 128);
    }
  } else if (set === "home") {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = ["#8B5E3C", "#7A5234", "#946644", "#835838"][i % 4]; g.fillRect(0, i * 32, 256, 32);
      g.fillStyle = "#5E3B22"; g.fillRect(0, i * 32, 256, 2); g.fillRect(((i * 97) % 256), i * 32, 2, 32);
    }
  } else {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? "#2B2B30" : "#EFE6D5"; g.fillRect(x * 128, y * 128, 128, 128); }
  }
  return c;
}

const LIGHT: Record<string, SetLight> = {
  office: { fog: "#B9C3D3", near: 12, far: 42, hemi: ["#FFFFFF", "#5A6070", 1.35], key: ["#FFFFFF", 2.3], rim: ["#9FC4FF", 1.8], sky: ["#E8EEF6", "#C4D2E4", "#F2F6FA"], grid: false },
  home: { fog: "#231B33", near: 10, far: 34, hemi: ["#FFB57A", "#1A1424", 0.75], key: ["#FFD9B0", 2.1], rim: ["#8E7CFF", 2.6], sky: ["#2A2048", "#0F0A1C", "#3A2A5A"], grid: false },
  cafe: { fog: "#D9B48A", near: 12, far: 40, hemi: ["#FFE3C2", "#4A3424", 1.2], key: ["#FFF0D8", 2.4], rim: ["#FFC48A", 1.7], sky: ["#F6DDBB", "#C89A6A", "#FBE9D0"], grid: false },
};

export function buildWorld(palette: number, cfg: Look = {}) {
  const P = WORLDS[((palette % WORLDS.length) + WORLDS.length) % WORLDS.length];
  const set = SETS.includes(cfg.set ?? "") ? cfg.set! : "city";
  const castStyle = cfg.cast ? CAST[cfg.cast] : undefined;
  const buddyKind = BUDDIES.includes(cfg.buddy ?? "") ? cfg.buddy! : "invoice";
  const accent = P.grid;
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const scene = new THREE.Scene();
  const L: SetLight = LIGHT[set] ?? { fog: "", near: 9, far: 36, hemi: [P.rim, "#05060E", 0.9], key: ["#FFF1DE", 2.4], rim: [P.rim, 3.2], sky: [], grid: true };

  // Sky: a tall gradient with a soft glow low in the frame, one per tint.
  const sky = (top: string, bottom: string, glow: string) => {
    const c = canvas(8, 512), g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, bottom); grd.addColorStop(0.55, top); grd.addColorStop(0.8, glow); grd.addColorStop(1, bottom);
    g.fillStyle = grd; g.fillRect(0, 0, 8, 512);
    return keep(tex(c));
  };
  const skies = {
    night: L.sky.length ? sky(L.sky[0], L.sky[1], L.sky[2]) : sky(P.top, P.bottom, P.top),
    alarm: sky("#5A0F18", "#120206", "#8A1A20"),
    bright: sky("#FFB867", "#3A2A6A", "#FFD9A0"),
  };
  const fogNight = L.fog || new THREE.Color(P.bottom).lerp(new THREE.Color(P.top), 0.45).getStyle();
  scene.fog = new THREE.Fog(fogNight, L.near, L.far);

  const geo = (w: number, h: number, d: number, r = 0.035) => keep(new RoundedBoxGeometry(w, h, d, 2, r));
  const part = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    return mesh;
  };

  // The floor: the city's dark plane with a glowing grid, or a textured floor indoors.
  let floorMat: THREE.MeshStandardMaterial;
  if (L.grid) {
    const gc = canvas(256, 256), gg = gc.getContext("2d")!;
    gg.fillStyle = "#000000"; gg.fillRect(0, 0, 256, 256);
    gg.strokeStyle = "#FFFFFF"; gg.lineWidth = 5; gg.strokeRect(0, 0, 256, 256);
    const gridTex = keep(tex(gc));
    gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
    gridTex.repeat.set(60, 60);
    floorMat = keep(new THREE.MeshStandardMaterial({ color: "#0A0C1E", roughness: 0.9, emissive: P.grid, emissiveMap: gridTex, emissiveIntensity: 0.55 }));
  } else {
    const ft = keep(tex(floorTex(set)));
    ft.wrapS = ft.wrapT = THREE.RepeatWrapping;
    ft.repeat.set(set === "home" ? 30 : 40, set === "home" ? 30 : 40);
    floorMat = keep(new THREE.MeshStandardMaterial({ map: ft, roughness: set === "cafe" ? 0.45 : 0.85 }));
  }
  const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(120, 120)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const dressing = new THREE.Group();
  scene.add(dressing);
  let lamp: THREE.PointLight | null = null;
  if (set === "city") {
    // The city: blocks of lit windows in a ring, far enough to sit in the fog.
    const wc = canvas(128, 256), wg = wc.getContext("2d")!;
    wg.fillStyle = "#0B0D1C"; wg.fillRect(0, 0, 128, 256);
    for (let y = 8; y < 256; y += 20) for (let x = 8; x < 128; x += 20) {
      const r = rnd(x * 3 + 1, y);
      if (r > 0.45) { wg.fillStyle = r > 0.9 ? "#FFFFFF" : P.city; wg.globalAlpha = 0.55 + r * 0.45; wg.fillRect(x, y, 11, 12); }
    }
    wg.globalAlpha = 1;
    const winTex = keep(tex(wc));
    const bMat = keep(new THREE.MeshStandardMaterial({ color: "#151830", roughness: 0.8, emissive: "#FFFFFF", emissiveMap: winTex, emissiveIntensity: 0.55 }));
    const bGeo = keep(new THREE.BoxGeometry(1, 1, 1));
    const N = 90;
    const city = new THREE.InstancedMesh(bGeo, bMat, N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const a = rnd(i, 1) * Math.PI * 2, r = 17 + rnd(i, 2) * 20;
      const w = 1.8 + rnd(i, 3) * 2.6, h = 1.5 + rnd(i, 4) ** 2 * 8, d = 1.8 + rnd(i, 5) * 2.6;
      v.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.round(a / (Math.PI / 2)) * (Math.PI / 2));
      m4.compose(v, q, sc.set(w, h, d));
      city.setMatrixAt(i, m4);
    }
    dressing.add(city);
  } else {
    // Three walls: the back one carries the painted detail, the sides are plain paint.
    const wt = keep(tex(wallTex(set, P)));
    const back = new THREE.Mesh(keep(new THREE.PlaneGeometry(24, 9)), keep(new THREE.MeshStandardMaterial({ map: wt, roughness: 0.9 })));
    back.position.set(0.4, 4.5, -4.2);
    back.receiveShadow = true;
    dressing.add(back);
    const paint = set === "office" ? "#C9D0DC" : set === "home" ? new THREE.Color(P.top).lerp(new THREE.Color("#2E2540"), 0.6).getStyle() : "#7E4330";
    const sideM = keep(new THREE.MeshStandardMaterial({ color: paint, roughness: 0.95 }));
    for (const x of [-8.5, 9.3]) {
      const wall = new THREE.Mesh(keep(new THREE.PlaneGeometry(20, 9)), sideM);
      wall.position.set(x, 4.5, 5.8);
      wall.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      dressing.add(wall);
    }
    const front = new THREE.Mesh(keep(new THREE.PlaneGeometry(24, 9)), sideM);
    front.position.set(0.4, 4.5, 15.5); front.rotation.y = Math.PI;
    dressing.add(front);
    const M = (c: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => keep(mat(c, extra));
    const plant = (x: number, z: number, s = 1) => {
      const g = new THREE.Group();
      g.add(part(keep(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 16)), M("#C8693F"), 0, 0.25, 0));
      for (let i = 0; i < 5; i++) {
        const leaf = part(keep(new THREE.IcosahedronGeometry(0.26 + rnd(i, x) * 0.12, 0)), M(i % 2 ? "#3F9B5A" : "#2F7D48"));
        leaf.position.set((rnd(i, 1) - 0.5) * 0.5, 0.7 + rnd(i, 2) * 0.6, (rnd(i, 3) - 0.5) * 0.4);
        g.add(leaf);
      }
      g.position.set(x, 0, z); g.scale.setScalar(s);
      dressing.add(g);
    };
    if (set === "office") {
      // Cubicle partitions with desks and glowing monitors behind them.
      const fabric = M("#7D8597"), trim = M("#4A5060"), screenM = M("#1B2030", { emissive: "#7FB7FF", emissiveIntensity: 0.6 });
      for (const [x, z] of [[-4.6, -2.4], [-2.2, -2.9], [3.4, -2.6], [5.8, -2.2]]) {
        dressing.add(part(geo(2.0, 1.35, 0.1, 0.02), fabric, x, 0.68, z + 0.7));
        dressing.add(part(geo(2.04, 0.06, 0.14, 0.02), trim, x, 1.38, z + 0.7));
        dressing.add(part(geo(1.8, 0.06, 0.8, 0.02), trim, x, 0.95, z));
        dressing.add(part(geo(0.7, 0.45, 0.05, 0.02), screenM, x, 1.5, z - 0.1));
      }
      plant(-6.2, -1.2, 1.3); plant(7.2, -0.6, 1.2);
      // A water cooler.
      const cooler = new THREE.Group();
      cooler.add(part(geo(0.5, 1.1, 0.5, 0.04), M("#E9ECF2"), 0, 0.55, 0));
      cooler.add(part(keep(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 18)), M("#7EC8F8", { transparent: true, opacity: 0.75, roughness: 0.2 }), 0, 1.38, 0));
      cooler.position.set(-6.4, 0, 1.4);
      dressing.add(cooler);
    } else if (set === "home") {
      // The bed, a nightstand with a warm lamp, and a rug under the stage.
      const bed = new THREE.Group();
      bed.add(part(geo(2.2, 0.45, 3.2, 0.05), M("#5B3A29"), 0, 0.22, 0));
      bed.add(part(geo(2.1, 0.3, 3.0, 0.1), M("#F2EFE9"), 0, 0.58, 0));
      bed.add(part(geo(2.12, 0.18, 1.9, 0.08), M(new THREE.Color(P.hoodie).lerp(new THREE.Color("#FFFFFF"), 0.2).getStyle()), 0, 0.78, 0.5));
      bed.add(part(geo(0.8, 0.22, 0.45, 0.1), M("#FFFFFF"), -0.5, 0.82, -1.2));
      bed.add(part(geo(0.8, 0.22, 0.45, 0.1), M("#FFFFFF"), 0.5, 0.82, -1.2));
      bed.add(part(geo(2.2, 1.2, 0.12, 0.04), M("#5B3A29"), 0, 0.6, -1.6));
      bed.position.set(-3.9, 0, -2.2);
      dressing.add(bed);
      dressing.add(part(geo(0.6, 0.6, 0.5, 0.04), M("#6B4A33"), -2.3, 0.3, -3.4));
      dressing.add(part(keep(new THREE.CylinderGeometry(0.05, 0.08, 0.5, 12)), M("#2B2B2B"), -2.3, 0.85, -3.4));
      dressing.add(part(keep(new THREE.ConeGeometry(0.28, 0.3, 20, 1, true)), M("#FFE1A8", { emissive: "#FFB867", emissiveIntensity: 0.9, side: THREE.DoubleSide }), -2.3, 1.2, -3.4));
      lamp = new THREE.PointLight("#FFB867", 6, 7, 1.6);
      lamp.position.set(-2.3, 1.25, -3.2);
      dressing.add(lamp);
      const rug = new THREE.Mesh(keep(new THREE.CircleGeometry(2.4, 40)), M(new THREE.Color(P.grid).lerp(new THREE.Color("#FFFFFF"), 0.15).getStyle(), { roughness: 1 }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(0.5, 0.01, 0.4); rug.receiveShadow = true;
      dressing.add(rug);
      plant(4.6, -3.2, 1.4);
      dressing.add(part(geo(1.4, 1.8, 0.6, 0.04), M("#6B4A33"), 5.6, 0.9, -3.6));
    } else {
      // The counter with an espresso machine, pendant lamps over it, and little tables.
      const wood = M("#6B4A33"), top = M("#E9E2D3", { roughness: 0.4 });
      dressing.add(part(geo(6.5, 1.15, 0.9, 0.03), wood, 0.6, 0.58, -2.9));
      dressing.add(part(geo(6.7, 0.08, 1.0, 0.02), top, 0.6, 1.19, -2.9));
      const machine = new THREE.Group();
      machine.add(part(geo(0.9, 0.7, 0.55, 0.05), M("#B9C0C8", { metalness: 0.6, roughness: 0.3 }), 0, 0.35, 0));
      machine.add(part(geo(0.2, 0.08, 0.1, 0.02), M("#2B2B2B"), -0.2, 0.25, 0.3));
      machine.add(part(geo(0.12, 0.12, 0.04, 0.02), M("#FF5A3C", { emissive: "#FF5A3C", emissiveIntensity: 1 }), 0.25, 0.55, 0.28));
      machine.position.set(-1.4, 1.23, -3.0);
      dressing.add(machine);
      for (const x of [-1.6, 0.8, 3.2]) {
        dressing.add(part(keep(new THREE.CylinderGeometry(0.012, 0.012, 2.2, 6)), M("#222222"), x, 4.6, -2.7));
        dressing.add(part(keep(new THREE.ConeGeometry(0.34, 0.32, 24, 1, true)), M("#2B2B30", { side: THREE.DoubleSide }), x, 3.4, -2.7));
        dressing.add(part(keep(new THREE.SphereGeometry(0.11, 16, 12)), M("#FFF2C8", { emissive: "#FFD27A", emissiveIntensity: 2 }), x, 3.26, -2.7));
      }
      for (const [x, z] of [[-3.6, 1.2], [4.6, 0.6]]) {
        dressing.add(part(keep(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 28)), top, x, 0.98, z));
        dressing.add(part(keep(new THREE.CylinderGeometry(0.06, 0.1, 0.95, 12)), M("#2B2B2B"), x, 0.48, z));
        dressing.add(part(keep(new THREE.CylinderGeometry(0.11, 0.14, 0.14, 16)), M("#F4F1E8"), x + 0.15, 1.08, z));
      }
      plant(-5.6, -2.6, 1.3); plant(6.6, -2.4, 1.1);
    }
  }

  // Dust in the air.
  const dustGeo = keep(new THREE.BufferGeometry());
  const pts = new Float32Array(400 * 3);
  for (let i = 0; i < 400; i++) { pts[i * 3] = (rnd(i, 7) - 0.5) * 24; pts[i * 3 + 1] = rnd(i, 8) * 9; pts[i * 3 + 2] = (rnd(i, 9) - 0.5) * 24; }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  const dust = new THREE.Points(dustGeo, keep(new THREE.PointsMaterial({ color: set === "city" ? P.rim : "#FFFFFF", size: 0.035, transparent: true, opacity: set === "city" ? 0.55 : 0.25, depthWrite: false })));
  scene.add(dust);

  // Lights: a warm key with shadows, a rim from behind, and a sky fill.
  const hemi = new THREE.HemisphereLight(L.hemi[0], L.hemi[1], L.hemi[2]);
  const key = new THREE.DirectionalLight(L.key[0], L.key[1]);
  key.position.set(3, 5, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.bias = -0.0005;
  const rim = new THREE.DirectionalLight(L.rim[0], L.rim[1]);
  rim.position.set(-4, 4, -5);
  const glow = new THREE.PointLight("#9FE8FF", 0, 2.2);
  scene.add(hemi, key, rim, glow);

  // ---------- People ----------
  function person(st: Style) {
    const skinM = keep(mat(st.skin)), hairM = keep(mat(st.hair, { roughness: 0.9 })), topM = keep(mat(st.top));
    const topDark = keep(mat(new THREE.Color(st.top).multiplyScalar(0.72).getStyle()));
    const pantsM = keep(mat(st.pants)), shoeM = keep(mat(st.shoes)), whiteM = keep(mat("#FFFFFF"));
    const root = new THREE.Group();
    const hips = new THREE.Group(); hips.position.y = 0.82; root.add(hips);
    const legs = [-0.15, 0.15].map(x => {
      const leg = new THREE.Group(); leg.position.set(x, 0, 0);
      leg.add(part(geo(0.27, 0.72, 0.3), pantsM, 0, -0.38, 0));
      leg.add(part(geo(0.3, 0.13, 0.4, 0.04), shoeM, 0, -0.76, 0.04));
      hips.add(leg);
      return leg;
    });
    const torso = new THREE.Group(); hips.add(torso);
    torso.add(part(geo(0.8, 0.74, 0.44, 0.06), topM, 0, 0.36, 0));
    if (st.topKind === "hoodie") {
      torso.add(part(geo(0.5, 0.18, 0.04, 0.02), topDark, 0, 0.16, 0.22));
      for (const x of [-0.09, 0.09]) torso.add(part(geo(0.035, 0.2, 0.03, 0.01), whiteM, x, 0.56, 0.23));
      torso.add(part(geo(0.66, 0.13, 0.48, 0.05), topDark, 0, 0.75, -0.01));
    } else if (st.topKind === "suit" || st.topKind === "blazer") {
      // A shirt showing in a V, lapels, and for the suit a tie.
      torso.add(part(geo(0.22, 0.36, 0.03, 0.01), whiteM, 0, 0.54, 0.222));
      for (const side of [-1, 1]) {
        const lapel = part(geo(0.1, 0.4, 0.03, 0.01), topDark, side * 0.13, 0.52, 0.226);
        lapel.rotation.z = side * 0.32;
        torso.add(lapel);
      }
      if (st.tie) torso.add(part(geo(0.08, 0.34, 0.025, 0.01), keep(mat(st.tie)), 0, 0.52, 0.24));
      for (const y of [0.18, 0.3]) torso.add(part(geo(0.04, 0.04, 0.02, 0.01), topDark, 0.06, y, 0.225));
    } else if (st.topKind === "cardigan") {
      torso.add(part(geo(0.2, 0.74, 0.03, 0.01), keep(mat("#F4F1E8")), 0, 0.36, 0.222));
      for (const y of [0.16, 0.32, 0.48]) torso.add(part(geo(0.04, 0.04, 0.02, 0.01), topDark, 0.13, y, 0.226));
    } else {
      torso.add(part(geo(0.3, 0.06, 0.03, 0.02), topDark, 0, 0.71, 0.222));
    }
    const shortSleeve = st.topKind === "tee";
    const arms = [-1, 1].map(side => {
      const arm = new THREE.Group(); arm.position.set(side * 0.52, 0.66, 0);
      if (shortSleeve) {
        arm.add(part(geo(0.25, 0.3, 0.29, 0.05), topM, 0, -0.13, 0));
        arm.add(part(geo(0.19, 0.34, 0.22, 0.04), skinM, 0, -0.43, 0));
      } else arm.add(part(geo(0.23, 0.6, 0.27, 0.05), topM, 0, -0.28, 0));
      arm.add(part(geo(0.21, 0.17, 0.23, 0.04), skinM, 0, -0.66, 0));
      torso.add(arm);
      return arm;
    });
    const head = new THREE.Group(); head.position.y = 0.8; torso.add(head);
    const faceCanvas = canvas(512, 512), faceG = faceCanvas.getContext("2d")!;
    const faceTex = keep(tex(faceCanvas));
    const faceM = keep(mat(st.skin, { map: faceTex, color: "#FFFFFF" }));
    head.add(part(geo(0.68, 0.64, 0.62, 0.07), [skinM, skinM, skinM, skinM, faceM, skinM], 0, 0.34, 0));
    switch (st.hairdo) {
      case "short":
        head.add(part(geo(0.74, 0.17, 0.68, 0.05), hairM, 0, 0.7, -0.01));
        head.add(part(geo(0.26, 0.12, 0.08, 0.03), hairM, -0.19, 0.6, 0.31));
        head.add(part(geo(0.22, 0.09, 0.08, 0.03), hairM, 0.12, 0.62, 0.31));
        head.add(part(geo(0.74, 0.44, 0.12, 0.04), hairM, 0, 0.47, -0.31));
        for (const side of [-1, 1]) head.add(part(geo(0.06, 0.4, 0.5, 0.02), hairM, side * 0.36, 0.48, -0.06));
        break;
      case "long":
        head.add(part(geo(0.76, 0.18, 0.7, 0.06), hairM, 0, 0.71, -0.01));
        head.add(part(geo(0.78, 0.95, 0.14, 0.05), hairM, 0, 0.3, -0.31));
        for (const side of [-1, 1]) head.add(part(geo(0.08, 0.85, 0.42, 0.03), hairM, side * 0.37, 0.3, -0.08));
        head.add(part(geo(0.5, 0.1, 0.08, 0.03), hairM, -0.08, 0.62, 0.31));
        break;
      case "bun":
        head.add(part(geo(0.74, 0.16, 0.68, 0.05), hairM, 0, 0.7, -0.01));
        head.add(part(geo(0.74, 0.4, 0.12, 0.04), hairM, 0, 0.5, -0.31));
        head.add(part(keep(new THREE.SphereGeometry(0.17, 16, 12)), hairM, 0, 0.86, -0.2));
        for (const side of [-1, 1]) head.add(part(geo(0.06, 0.34, 0.46, 0.02), hairM, side * 0.36, 0.5, -0.06));
        break;
      case "cap": {
        const hatM = keep(mat(st.hat ?? "#2E86DE"));
        head.add(part(geo(0.74, 0.2, 0.7, 0.08), hatM, 0, 0.73, -0.01));
        head.add(part(geo(0.6, 0.04, 0.32, 0.02), hatM, 0, 0.64, 0.45));
        head.add(part(geo(0.74, 0.3, 0.12, 0.04), hairM, 0, 0.5, -0.31));
        for (const side of [-1, 1]) head.add(part(geo(0.06, 0.26, 0.4, 0.02), hairM, side * 0.36, 0.52, -0.06));
        break;
      }
      case "bald":
        head.add(part(geo(0.74, 0.22, 0.12, 0.04), hairM, 0, 0.42, -0.31));
        for (const side of [-1, 1]) head.add(part(geo(0.06, 0.2, 0.42, 0.02), hairM, side * 0.36, 0.44, -0.08));
        break;
      case "curly":
        for (let i = 0; i < 12; i++) {
          const c = part(keep(new THREE.SphereGeometry(0.15, 10, 8)), hairM);
          c.position.set(-0.3 + (i % 4) * 0.2, 0.7 + (i % 2) * 0.05, -0.28 + Math.floor(i / 4) * 0.26);
          head.add(c);
        }
        head.add(part(geo(0.74, 0.4, 0.12, 0.04), hairM, 0, 0.48, -0.31));
        break;
    }
    root.scale.setScalar(st.scale);
    scene.add(root);
    const rig: Rig = { root, hips, torso, head, armL: arms[0], armR: arms[1], legL: legs[0], legR: legs[1] };
    let key = "";
    // Redraws the face only when what it shows changes.
    const face = (mood: Mood, blink: boolean, gaze: [number, number], open: number) => {
      const k = `${mood}|${blink}|${gaze[0]}|${gaze[1]}|${open}`;
      if (k === key) return;
      key = k;
      drawFace(faceG, st, mood, blink, gaze[0], gaze[1], open);
      faceTex.needsUpdate = true;
    };
    return { rig, face };
  }

  const me = person({ skin: SKIN, hair: HAIR, hairdo: "short", top: P.hoodie, topKind: "hoodie", pants: PANTS, shoes: SHOES, glasses: true, scale: 1 });
  const rig = me.rig;
  // The second character stands on his right, turned toward him.
  const them = castStyle ? person(castStyle) : null;
  const THEM = { x: 1.3, z: 0.15, turn: -0.5, h: castStyle?.scale ?? 1 };

  // ---------- Props ----------
  const desk = new THREE.Group();
  const deskM = keep(mat(set === "city" ? "#2B2F52" : set === "home" ? "#6B4A33" : "#3A3F52")), metal = keep(mat("#9AA3BF", { metalness: 0.6, roughness: 0.35 }));
  desk.add(part(geo(1.7, 0.07, 0.72, 0.02), deskM, 0, 1.08, 0));
  for (const [x, z] of [[-0.78, -0.3], [0.78, -0.3], [-0.78, 0.3], [0.78, 0.3]]) desk.add(part(geo(0.06, 1.06, 0.06, 0.01), deskM, x, 0.53, z));
  const lapCanvas = canvas(640, 400), lapG = lapCanvas.getContext("2d")!;
  const lapTex = keep(tex(lapCanvas));
  desk.add(part(geo(0.62, 0.03, 0.42, 0.01), metal, 0, 1.13, 0.02));
  const lid = new THREE.Group(); lid.position.set(0, 1.13, 0.22); lid.rotation.x = 0.28;
  lid.add(part(geo(0.62, 0.4, 0.02, 0.01), metal, 0, 0.2, 0));
  const screen = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.58, 0.36)), keep(new THREE.MeshBasicMaterial({ map: lapTex })));
  screen.position.set(0, 0.2, -0.012); screen.rotation.y = Math.PI;
  lid.add(screen);
  desk.add(lid);
  desk.position.set(0, 0, 0.62);
  scene.add(desk);

  const phone = new THREE.Group();
  phone.add(part(geo(0.16, 0.31, 0.025, 0.02), keep(mat("#15161C")), 0, 0, 0));
  const phCanvas = canvas(256, 512), phG = phCanvas.getContext("2d")!;
  const phTex = keep(tex(phCanvas));
  const phScreen = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.145, 0.29)), keep(new THREE.MeshBasicMaterial({ map: phTex })));
  phScreen.position.z = 0.014;
  phone.add(phScreen);
  rig.armR.add(phone);
  phone.position.set(-0.02, -0.74, 0.1);
  phone.rotation.x = -0.6;

  // The talking object, standing on two stubby feet. With a second character in the scene it moves to his left
  // and shrinks, so both people have room.
  const W0: Paint = { accent, top: P.top };
  const bill = new THREE.Group();
  const footM = keep(mat("#22243A"));
  let billCanvas: HTMLCanvasElement, billH = 0.72;
  if (buddyKind === "mug") {
    billCanvas = canvas(1024, 512);
    const mugTex = keep(tex(billCanvas));
    const side = keep(mat("#FFFFFF", { map: mugTex }));
    const rimM = keep(mat("#F3EEE4"));
    bill.add(part(keep(new THREE.CylinderGeometry(0.38, 0.34, 0.86, 40, 1, false, Math.PI, Math.PI * 2)), [side, rimM, rimM], 0, 0.6, 0));
    bill.add(part(keep(new THREE.CylinderGeometry(0.33, 0.33, 0.02, 32)), keep(mat("#4A2C1A")), 0, 1.02, 0));
    const handle = part(keep(new THREE.TorusGeometry(0.17, 0.05, 10, 24)), rimM, 0.4, 0.62, 0);
    handle.rotation.y = Math.PI / 2;
    bill.add(handle);
    billH = 0.6;
  } else if (buddyKind === "piggy") {
    billCanvas = canvas(512, 404);
    const face = keep(mat("#FFFFFF", { map: keep(tex(billCanvas)) })), pink = keep(mat("#F4A6C1"));
    bill.add(part(geo(0.95, 0.75, 0.7, 0.16), [pink, pink, pink, pink, face, pink], 0, 0.6, 0));
    for (const x of [-0.3, 0.3]) bill.add(part(geo(0.16, 0.18, 0.08, 0.03), keep(mat("#EC7FA6")), x, 1.02, 0.1));
    bill.add(part(geo(0.3, 0.03, 0.06, 0.01), keep(mat("#7A3050")), 0, 0.98, -0.05));
    for (const [x, z] of [[-0.3, 0.2], [0.3, 0.2], [-0.3, -0.2], [0.3, -0.2]]) bill.add(part(geo(0.14, 0.24, 0.14, 0.03), pink, x, 0.12, z));
    billH = 0.6;
  } else {
    billCanvas = canvas(512, 660);
    const paper = keep(mat(buddyKind === "calendar" ? "#FBFAF5" : "#F7F2E6"));
    const face = keep(mat("#FFFFFF", { map: keep(tex(billCanvas)) }));
    bill.add(part(geo(0.82, 1.06, 0.1, 0.03), [paper, paper, paper, paper, face, paper], 0, 0.72, 0));
    for (const x of [-0.18, 0.18]) bill.add(part(geo(0.1, 0.2, 0.1, 0.03), footM, x, 0.1, 0));
    for (const side of [-1, 1]) bill.add(part(geo(0.18, 0.06, 0.06, 0.02), footM, side * 0.48, 0.66, 0));
  }
  const billG = billCanvas.getContext("2d")!;
  const billTex = (bill.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
  const billMap = (Array.isArray(billTex) ? billTex.find(m => m.map) : billTex)?.map ?? null;
  const BUD = them ? { x: -1.15, z: 0.55, s: 0.72 } : { x: 1.08, z: 0.35, s: 1 };
  bill.position.set(BUD.x, 0, BUD.z);
  bill.scale.setScalar(BUD.s);
  scene.add(bill);
  const drawBuddy = (mood: Bill, blink: boolean) => {
    if (buddyKind === "piggy") drawPiggy(billG, mood, blink);
    else if (buddyKind === "calendar") drawCalendar(billG, mood, blink, W0);
    else if (buddyKind === "mug") drawMug(billG, mood, blink, W0);
    else drawBill(billG, mood, blink, W0);
    if (billMap) billMap.needsUpdate = true;
  };

  let billKey = "", lapKey = "";
  drawPhone(phG, W0);
  phTex.needsUpdate = true;

  const camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 120);

  // ---------- Posing ----------
  function pose(r: Rig, act: Act, u: number, seed: number) {
    r.root.position.set(0, 0, 0); r.root.rotation.set(0, 0, 0);
    r.torso.rotation.set(0, 0, 0); r.head.rotation.set(0, 0, 0);
    r.armL.rotation.set(0, 0, -0.08); r.armR.rotation.set(0, 0, 0.08);
    r.legL.rotation.set(0, 0, 0); r.legR.rotation.set(0, 0, 0);
    const br = Math.sin(u * 2.4 + seed);
    r.torso.position.y = br * 0.008;
    r.head.rotation.x = br * 0.02;
    let gaze: [number, number] = [0, 0];
    const sway = Math.sin(u * 1.3 + seed) * 0.06;
    switch (act) {
      case "talk":
        r.armR.rotation.set(-0.45 - 0.3 * (0.5 + 0.5 * Math.sin(u * 3.4)), 0, 0.2);
        r.armL.rotation.set(-0.2 - 0.15 * Math.sin(u * 2.7 + 1), 0, -0.18);
        r.head.rotation.set(0.05 * Math.sin(u * 5.2), sway * 2, 0.04 * Math.sin(u * 1.7));
        break;
      case "type":
        for (const [k, a] of [r.armL, r.armR].entries()) a.rotation.set(-1.05 + 0.06 * Math.sin(u * 19 + k * 2.1), 0, k ? -0.18 : 0.18);
        r.head.rotation.set(0.32, sway, 0);
        gaze = [0, 1];
        break;
      case "phone":
        r.armR.rotation.set(-1.75, 0, -0.42);
        r.armL.rotation.set(-0.1, 0, -0.1);
        r.head.rotation.set(0.18, 0.12, 0);
        gaze = [0.3, 0.6];
        break;
      case "facepalm": {
        const k = ease(u / 0.35);
        r.armR.rotation.set(-2.55 * k, 0, -0.62 * k + 0.08);
        r.head.rotation.set(0.3 * k, 0.16 * Math.sin(u * 2.2) * k, 0);
        r.torso.rotation.x = 0.08 * k;
        break;
      }
      case "shrug": {
        const k = ease(u / 0.3), up = Math.sin(clamp01((u - 0.1) / 0.5) * Math.PI) * 0.06;
        r.armL.rotation.set(-0.7 * k, 0, -0.85 * k);
        r.armR.rotation.set(-0.7 * k, 0, 0.85 * k);
        r.torso.position.y += up;
        r.head.rotation.set(0, 0, 0.16 * k);
        gaze = [0, -0.4];
        break;
      }
      case "point": {
        const k = outBack(u / 0.35);
        r.armR.rotation.set(-2.5 * k, 0, 0.45 * k);
        r.armL.rotation.set(-0.15, 0, -0.1);
        r.head.rotation.set(-0.22 * k, 0.32 * k, 0);
        gaze = [1, -1];
        break;
      }
      case "think":
        r.armR.rotation.set(-2.15, 0, -0.62);
        r.armL.rotation.set(-0.95, 0, -0.55);
        r.head.rotation.set(-0.08, 0.12, 0.14 + 0.03 * Math.sin(u * 1.5));
        gaze = [0.6, -1];
        break;
      case "shock": {
        const k = outBack(u / 0.22);
        r.root.position.z = -0.18 * ease(u / 0.22);
        r.root.position.y = Math.max(0, Math.sin(clamp01(u / 0.3) * Math.PI)) * 0.12;
        r.armL.rotation.set(-2.3 * k, 0, -0.45 * k);
        r.armR.rotation.set(-2.3 * k, 0, 0.45 * k);
        r.torso.rotation.x = -0.12 * k;
        r.head.rotation.set(-0.12 * k, 0, 0);
        break;
      }
      case "celebrate": {
        const hop = Math.abs(Math.sin(u * 6.2));
        r.root.position.y = hop * 0.22;
        r.armL.rotation.set(-2.85, 0, -0.38 + 0.2 * Math.sin(u * 12));
        r.armR.rotation.set(-2.85, 0, 0.38 - 0.2 * Math.sin(u * 12));
        r.legL.rotation.x = -0.25 * hop; r.legR.rotation.x = 0.2 * hop;
        r.head.rotation.set(-0.15, 0, 0.06 * Math.sin(u * 6.2));
        break;
      }
      case "wave": {
        const k = ease(u / 0.25);
        r.armR.rotation.set(-0.2 * k, 0, (2.55 + 0.32 * Math.sin(u * 9)) * k);
        r.head.rotation.set(0, 0, 0.1 * Math.sin(u * 4.5));
        break;
      }
      case "slump":
        r.torso.rotation.x = 0.16;
        r.armL.rotation.set(-0.12, 0, -0.02); r.armR.rotation.set(-0.12, 0, 0.02);
        r.head.rotation.set(0.22 + 0.02 * br, 0, 0);
        r.torso.position.y -= 0.04;
        gaze = [0, 1];
        break;
    }
    return gaze;
  }

  // ---------- Cameras ----------
  // Each shot is framed for 9:16 with the face high in the frame, room for a card on top and captions at ~65%.
  const look = new THREE.Vector3();
  function place(sh: Shot, u: number, d: number) {
    const p = ease(u / Math.max(d, 0.6)), side = sh.seed % 2 ? 1 : -1, j = rnd(sh.seed, 3);
    let fov = 32, roll = 0;
    const pos = camera.position;
    switch (sh.cam) {
      case "cu": {
        const dist = 3.25 - 0.4 * p;
        pos.set(side * (0.32 + j * 0.2), 1.98, dist); look.set(0, 1.86, 0);
        fov = 30;
        break;
      }
      case "mcu": pos.set(side * (0.55 + 0.15 * p), 1.82, 3.7 - 0.35 * p); look.set(0.04, 1.62, 0); break;
      case "ms": pos.set(0.55 + side * 0.35 + 0.25 * p * side, 1.7, 7.4 - 0.5 * p); look.set(0.55, 1.3, 0); fov = 33; break;
      case "wide": {
        const a = side * (0.5 + 0.18 * p);
        pos.set(Math.sin(a) * 10, 5.4 - 0.6 * p, Math.cos(a) * 10); look.set(0.4, 0.9, 0);
        fov = 42;
        break;
      }
      case "low": pos.set(side * (0.7 - 0.2 * p), 0.45, 3.6 - 0.4 * p); look.set(0.3, 1.62, 0); fov = 40; break;
      case "ots": pos.set(-1.25 * side, 2.45, -0.75 + 0.12 * p); look.set(0.1, 1.25, 0.9); fov = 38; break;
      case "mascot":
        // A medium shot of whoever stands beside him: the second character, or the talking object.
        if (them) { pos.set(THEM.x - 0.35 + side * 0.3, 1.55 * THEM.h, THEM.z + 4.5 - 0.4 * p); look.set(THEM.x, 1.45 * THEM.h, THEM.z); }
        else { pos.set(1.08 + side * (0.4 + 0.1 * p), 1.25, 3.5 - 0.4 * p); look.set(1.08, 0.95, 0.35); }
        fov = 32;
        break;
      case "them": {
        // A close-up of the second character, from his side so they face the camera in three quarters.
        const dist = 3.1 - 0.35 * p;
        pos.set(THEM.x - 0.62 - j * 0.2, 1.98 * THEM.h, THEM.z + dist); look.set(THEM.x - 0.05, 1.85 * THEM.h, THEM.z);
        fov = 30;
        break;
      }
      case "orbit": {
        const a = side * (-0.45 + 0.9 * p);
        pos.set(0.5 + Math.sin(a) * 5.4, 1.8, Math.cos(a) * 5.4); look.set(0.5, 1.3, 0);
        break;
      }
      case "top": pos.set(0.4 + side * 0.6, 7.5 - 0.8 * p, 2.4); look.set(0.4, 0.4, 0); fov = 40; break;
    }
    if (sh.hud) {
      // Pull back a little and pan up, so the card on top has sky behind it.
      pos.sub(look).multiplyScalar(1.18).add(look);
      pos.y += 0.42; look.y += 0.42;
    }
    if (sh.tint === "alarm") roll = side * 0.07;
    // A little handheld drift, and a kick at the start of a shock.
    const kick = sh.act === "shock" ? Math.max(0, 1 - u / 0.35) * 0.05 : 0;
    pos.x += Math.sin(u * 1.7 + sh.seed) * 0.012 + Math.sin(u * 37) * kick;
    pos.y += Math.sin(u * 1.3 + sh.seed * 2) * 0.01 + Math.cos(u * 41) * kick;
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(look);
  }

  // ---------- One frame ----------
  // The mouth of whoever speaks opens and closes with a syllable-like rhythm.
  const mouth = (u: number, seed: number) => Math.round(clamp01(Math.abs(Math.sin(u * 10.5 + seed)) * (0.65 + 0.35 * Math.sin(u * 3.1 + seed * 2))) * 3) / 3;
  function frame(shots: Shot[], t: number) {
    let sh = shots[0];
    for (const x of shots) if (x.s <= t + 1e-4) sh = x;
    if (!sh) return camera;
    const u = Math.max(0, t - sh.s), d = sh.e - sh.s;
    const gaze = pose(rig, sh.act, u, sh.seed);
    const blink = (t + sh.seed * 0.37) % 3.4 < 0.12 && sh.mood !== "shocked";
    if (them && sh.talk === "them") { rig.head.rotation.y += 0.38; gaze[0] = 1; }
    me.face(sh.mood, blink, gaze, sh.talk === "me" ? mouth(u, sh.seed) : 0);
    if (them) {
      const g2 = pose(them.rig, sh.act2 ?? "idle", u, sh.seed + 7);
      them.rig.root.position.x += THEM.x; them.rig.root.position.z += THEM.z;
      them.rig.root.rotation.y += THEM.turn;
      if (sh.talk !== "them") { them.rig.head.rotation.y -= 0.2; g2[0] = -1; }
      const b2 = (t + sh.seed * 0.23 + 1.1) % 3.1 < 0.12 && sh.mood2 !== "shocked";
      them.face(sh.mood2 ?? "neutral", b2, g2, sh.talk === "them" ? mouth(u, sh.seed + 3) : 0);
    }
    const bblink = (t + 1.3) % 2.9 < 0.1;
    const bk = `${sh.bill}|${bblink}`;
    if (bk !== billKey) { billKey = bk; drawBuddy(sh.bill, bblink); }
    const paid = sh.bill === "paid";
    const lk = `${paid}`;
    if (lk !== lapKey) { lapKey = lk; drawLaptop(lapG, W0, paid); lapTex.needsUpdate = true; }

    desk.visible = sh.act === "type" || sh.cam === "ots";
    phone.visible = sh.act === "phone";
    glow.intensity = phone.visible ? 1.6 : 0;
    if (phone.visible) phone.getWorldPosition(glow.position);

    // The object bobs, and acts out its own mood.
    const bu = t * 2.2;
    bill.position.y = Math.abs(Math.sin(bu)) * (sh.bill === "paid" ? 0.18 : 0.05) * BUD.s;
    bill.rotation.set(0, (them ? 0.35 : -0.35) + Math.sin(t * 0.9) * 0.08, sh.bill === "overdue" ? Math.sin(t * 30) * 0.04 : sh.bill === "worried" ? Math.sin(t * 3) * 0.08 : 0);
    if (sh.bill === "paid") bill.rotation.y += Math.PI * 2 * outBack(u / 0.6);

    // Tint: alarm goes red, bright warms the whole set.
    const tint = sh.tint;
    scene.background = skies[tint];
    (scene.fog as THREE.Fog).color.set(tint === "alarm" ? "#2A060C" : tint === "bright" && set === "city" ? "#6A4A7A" : fogNight);
    rim.color.set(tint === "alarm" ? "#FF2A2A" : tint === "bright" ? "#FFE2A8" : L.rim[0]);
    rim.intensity = tint === "alarm" ? L.rim[1] + 1.2 : L.rim[1];
    key.intensity = L.key[1] * (tint === "bright" ? 1.25 : tint === "alarm" && set !== "city" ? 0.75 : 1);
    hemi.intensity = L.hemi[2] * (tint === "bright" ? 1.6 : 1);
    if (L.grid) floorMat.emissive.set(tint === "alarm" ? "#FF3A3A" : tint === "bright" ? "#FFC46B" : P.grid);
    if (lamp) lamp.intensity = tint === "alarm" ? 2 : 6;
    dust.rotation.y = t * 0.03;
    dust.position.y = -((t * 0.15) % 1);

    place(sh, u, d);
    return camera;
  }

  return {
    scene, frame, accent,
    dispose() { for (const x of disposables) x.dispose(); },
  };
}

// One WebGL context for every reel in a mount, released when the last reel lets go.
let shared: THREE.WebGLRenderer | null = null, users = 0;
export function acquireRenderer() {
  users++;
  if (!shared) {
    shared = new THREE.WebGLRenderer({ canvas: canvas(W, H), antialias: true, preserveDrawingBuffer: true });
    shared.outputColorSpace = THREE.SRGBColorSpace;
    shared.toneMapping = THREE.ACESFilmicToneMapping;
    shared.toneMappingExposure = 1.05;
    shared.shadowMap.enabled = true;
    shared.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  return shared;
}
export function releaseRenderer() {
  if (--users > 0 || !shared) return;
  shared.dispose();
  shared.forceContextLoss();
  shared = null;
}
