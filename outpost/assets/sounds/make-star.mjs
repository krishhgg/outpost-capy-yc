// Writes star.wav, the two-note chime that plays when a raid star lights. Synthesized here, so there is no license
// to track. Run: node assets/sounds/make-star.mjs assets/sounds/star.wav
import { writeFileSync } from "node:fs";
const out = process.argv[2];
const RATE = 44100, LEN = 0.9;
const n = Math.floor(RATE * LEN);
const pcm = new Float32Array(n);
const note = (f, start, gain) => {
  for (let i = Math.floor(start * RATE); i < n; i++) {
    const t = i / RATE - start;
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 6.5);
    pcm[i] += gain * env * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * 2 * f * t) + 0.12 * Math.sin(2 * Math.PI * 3 * f * t));
  }
};
note(1318.5, 0, 0.42);    // E6
note(1975.5, 0.11, 0.38); // B6
const peak = Math.max(...pcm.map(Math.abs));
const buf = Buffer.alloc(44 + n * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round((pcm[i] / peak) * 0.8 * 32767), 44 + i * 2);
writeFileSync(out, buf);
console.log(out, buf.length, "bytes");
