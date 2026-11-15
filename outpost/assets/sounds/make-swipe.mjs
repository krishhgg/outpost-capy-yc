// Writes post.wav (a quick rising three-note chime for an approved video), remake.wav (two soft falling notes for a
// video sent back), tick.wav (one short blip as each line of the Away card lands), collect.wav (a four-note run up for
// Collect) and click.wav (a short tock for every button press). Synthesized here like star.wav, so there is no license
// to track.
// Run: node assets/sounds/make-swipe.mjs assets/sounds
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const RATE = 44100;

function render(len, notes, decay) {
  const n = Math.floor(RATE * len);
  const pcm = new Float32Array(n);
  for (const [f, start, gain] of notes) {
    for (let i = Math.floor(start * RATE); i < n; i++) {
      const t = i / RATE - start;
      const env = Math.min(1, t / 0.004) * Math.exp(-t * decay);
      pcm[i] += gain * env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * 2 * f * t) + 0.1 * Math.sin(2 * Math.PI * 3 * f * t));
    }
  }
  const peak = Math.max(...pcm.map(Math.abs));
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round((pcm[i] / peak) * 0.7 * 32767), 44 + i * 2);
  return buf;
}

const dir = process.argv[2];
writeFileSync(join(dir, "post.wav"), render(0.55, [[1046.5, 0, 0.4], [1318.5, 0.06, 0.38], [1568, 0.12, 0.42]], 9)); // C6 E6 G6
writeFileSync(join(dir, "remake.wav"), render(0.45, [[784, 0, 0.35], [587.3, 0.09, 0.32]], 10)); // G5 D5
writeFileSync(join(dir, "tick.wav"), render(0.09, [[1760, 0, 0.5]], 45)); // A6
writeFileSync(join(dir, "click.wav"), render(0.06, [[659.3, 0, 0.5], [1318.5, 0, 0.15]], 75)); // E5, gone in a few ms
writeFileSync(join(dir, "collect.wav"), render(0.7, [[784, 0, 0.36], [1046.5, 0.05, 0.36], [1318.5, 0.1, 0.38], [1568, 0.15, 0.42]], 7)); // G5 C6 E6 G6
console.log("wrote post.wav, remake.wav, tick.wav, click.wav and collect.wav to", dir);
