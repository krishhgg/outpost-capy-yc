"""Kokoro voice server. One JSON request per stdin line, one JSON reply per stdout line.

Request:  {"id": "...", "parts": ["hook", "line 1", ...], "voice": "af_heart", "speed": 1.1, "out": "/path.wav"}
          "voices" is optional: one voice per part, for lines said by a character. Missing ones use "voice".
Reply:    {"id": "...", "ok": true, "duration": 12.3, "parts": [{"start": 0.0, "end": 2.1, "words": [[text, start, end], ...]}]}
"""
import json
import sys
import time

import numpy as np
import soundfile as sf
from kokoro import KPipeline

SR = 24000
GAP = 0.22  # seconds of silence between parts
pipe = KPipeline(lang_code="a")
print(json.dumps({"ready": True}), flush=True)


def speak(text, voice, speed):
    audio, words, off = [], [], 0.0
    for r in pipe(text, voice=voice, speed=speed):
        a = np.asarray(r.audio, dtype=np.float32)
        for t in r.tokens or []:
            if t.start_ts is None:
                continue
            start, end = off + t.start_ts, off + (t.end_ts or t.start_ts)
            if any(ch.isalnum() for ch in t.text) or not words:
                words.append([t.text, start, end])
            else:  # punctuation joins the word before it
                words[-1][0] += t.text
                words[-1][2] = end
        audio.append(a)
        off += len(a) / SR
    audio = np.concatenate(audio) if audio else np.zeros(1, np.float32)
    if words:  # trim Kokoro's lead-in and tail silence so parts flow
        lead = max(0.0, words[0][1] - 0.06)
        tail = min(len(audio) / SR, words[-1][2] + 0.12)
        audio = audio[int(lead * SR):int(tail * SR)]
        words = [[w, s - lead, e - lead] for w, s, e in words]
    return audio, words


for line in sys.stdin:
    if not line.strip():
        continue
    req = json.loads(line)
    try:
        t0 = time.time()
        chunks, parts, off = [], [], 0.0
        gap = np.zeros(int(GAP * SR), np.float32)
        voices = req.get("voices") or []
        for i, text in enumerate(req["parts"]):
            a, words = speak(text, voices[i] if i < len(voices) and voices[i] else req["voice"], req.get("speed", 1.0))
            parts.append({"start": round(off, 3), "end": round(off + len(a) / SR, 3),
                          "words": [[w, round(off + s, 3), round(off + e, 3)] for w, s, e in words]})
            chunks.append(a)
            off += len(a) / SR
            if i < len(req["parts"]) - 1:
                chunks.append(gap)
                off += GAP
        sf.write(req["out"], np.concatenate(chunks), SR)
        print(json.dumps({"id": req["id"], "ok": True, "duration": round(off, 3), "parts": parts,
                          "ms": int((time.time() - t0) * 1000)}), flush=True)
    except Exception as e:  # report and keep serving
        print(json.dumps({"id": req.get("id"), "ok": False, "error": f"{type(e).__name__}: {e}"[:300]}), flush=True)
