"""Synthesizes the reel sound effects, so no clip comes from someone else's library.

Run: python studio/sfx.py <out dir>   (writes bed, boom, riser, thud, pop, tick, roll, whoosh, chime, glitch .wav)
"""
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, attack=0.004, decay=0.3):
    x = np.arange(n) / SR
    return np.minimum(1.0, x / attack) * np.exp(-x / decay)


def sweep(f0, f1, sec, curve=3.0):
    # A sine whose pitch glides from f0 to f1, fastest at the start.
    x = t(sec) / sec
    f = f1 + (f0 - f1) * np.exp(-curve * x)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def norm(x, peak=0.9):
    return (x / (np.max(np.abs(x)) + 1e-9) * peak).astype(np.float32)


def boom():
    # Trailer hit: a falling sub sine with a short noise crack on top.
    n = int(1.6 * SR)
    sub = sweep(120, 38, 1.6, 6) * env(n, 0.003, 0.55)
    crack = lowpass(rng.standard_normal(n), 2500) * env(n, 0.001, 0.05)
    return norm(sub + 0.6 * crack)


def riser():
    # Noise and a tone that both climb for 1.4 s and stop dead, so the hit lands on the next beat.
    sec = 1.4
    x = t(sec) / sec
    tone = sweep(180, 1400, sec, -2.2) * x ** 2
    noise = rng.standard_normal(len(x))
    hiss = noise - lowpass(noise, 300 + 5000 * x[-1])
    return norm(0.6 * tone + 0.5 * hiss * x ** 3)


def thud():
    n = int(0.45 * SR)
    body = sweep(95, 45, 0.45, 9) * env(n, 0.002, 0.12)
    click = rng.standard_normal(n) * env(n, 0.0005, 0.006)
    return norm(body + 0.3 * click)


def pop():
    n = int(0.12 * SR)
    return norm(sweep(500, 1300, 0.12, -6) * env(n, 0.002, 0.035), 0.7)


def tick():
    n = int(0.05 * SR)
    return norm(np.sin(2 * np.pi * 2200 * t(0.05)) * env(n, 0.0005, 0.008), 0.6)


def roll():
    # A counter spinning up: ticks that speed up over 0.8 s.
    out = np.zeros(int(0.85 * SR), np.float32)
    k, at = tick(), 0.0
    gap = 0.11
    while at < 0.78:
        i = int(at * SR)
        out[i:i + len(k)] += k[: len(out) - i]
        at += gap
        gap = max(0.035, gap * 0.82)
    return norm(out, 0.6)


def whoosh():
    sec = 0.5
    x = t(sec) / sec
    noise = rng.standard_normal(len(x))
    band = lowpass(noise, 1800) - lowpass(noise, 250)
    return norm(band * np.sin(np.pi * x) ** 2, 0.7)


def chime():
    # Two soft bell tones a fifth apart, for the bright twist.
    sec = 1.2
    n = int(sec * SR)
    a = np.sin(2 * np.pi * 880 * t(sec)) * env(n, 0.002, 0.5)
    b = np.sin(2 * np.pi * 1320 * t(sec)) * env(n, 0.002, 0.4)
    b = np.concatenate([np.zeros(int(0.09 * SR)), b])[:n]
    return norm(a + 0.8 * b, 0.6)


def glitch():
    # A short digital buzz: square bursts at jumping pitches.
    out = []
    for f in (220, 880, 140, 660, 330):
        seg = t(0.03)
        out.append(np.sign(np.sin(2 * np.pi * f * seg)) * 0.5)
    return norm(np.concatenate(out), 0.5)


def bed():
    # A dark pad under the voice: a low drone that swells slowly, 60 s so any reel fits inside it.
    sec = 60.0
    x = t(sec)
    pad = sum(np.sin(2 * np.pi * f * x + 0.3 * np.sin(2 * np.pi * 0.07 * k * x)) * a
              for k, (f, a) in enumerate([(55, 1.0), (55.4, 0.7), (82.4, 0.5), (110, 0.35), (164.8, 0.15)], 1))
    swell = 0.75 + 0.25 * np.sin(2 * np.pi * x / 9.0)
    fade = np.minimum(1.0, x / 1.5)
    return norm(pad * swell * fade, 0.5)


SOUNDS = {"bed": bed, "boom": boom, "riser": riser, "thud": thud, "pop": pop, "tick": tick, "roll": roll,
          "whoosh": whoosh, "chime": chime, "glitch": glitch}

if __name__ == "__main__":
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    for name, make in SOUNDS.items():
        sf.write(out / f"{name}.wav", make(), SR)
    print(" ".join(sorted(SOUNDS)))
