# Draws the four agents as pixel sprites, two walk frames each, and saves them upscaled so the app never blurs them.
# Run: python3 outpost/art/sprites.py <out dir> [scale]
import os
import sys

from PIL import Image

out = sys.argv[1]
scale = int(sys.argv[2]) if len(sys.argv) > 2 else 6
os.makedirs(out, exist_ok=True)

# Each agent: hat rows (3), then a shared body. Letters are palette keys; "." is transparent.
HATS = {
    "writer": [  # a beanie with a bobble
        "....kk....",
        "..kHHHHk..",
        ".kHHhhHHk.",
    ],
    "director": [  # a beret tipped to one side
        "......k...",
        "..kkkkHk..",
        ".kHHHHHHkk",
    ],
    "courier": [  # a cap with a brim
        "..........",
        "..kkkkkk..",
        ".kHHHHHHk.",
    ],
    "merchant": [  # a short top hat
        "..kkkkkk..",
        "..kHHHHk..",
        ".kkhhhhkk.",
    ],
}
HEAD = [
    ".kRRRRRRk.",
    ".kSSSSSSk.",
    ".kSkSSkSk.",
    ".kSSSSSSk.",
    "..kksskk..",
]
BODY = [
    ".kCCCCCCk.",
    "kCCcCCcCCk",
    "kSkCCCCkSk",
    ".kkCCCCkk.",
]
LEGS = [
    [  # stand / mid-step
        "..kPPPPk..",
        "..kPkkPk..",
        "..kBk.kBk.",
        "..kk...kk.",
    ],
    [  # stride
        "..kPPPPk..",
        ".kPk..kPk.",
        ".kBk..kBk.",
        ".kk....kk.",
    ],
]

BASE = {"k": "#24152B", "S": "#F2C29B", "s": "#D59A72", "P": "#3B3F66", "B": "#5A3420", "R": "#5A3A22"}
AGENTS = {
    "writer": {"C": "#2FC9B5", "c": "#1E8F82", "H": "#2FC9B5", "h": "#FFFFFF"},
    "director": {"C": "#FF8B2B", "c": "#C25A12", "H": "#E8483B", "h": "#E8483B"},
    "courier": {"C": "#4F9BF2", "c": "#2D63B8", "H": "#4F9BF2", "h": "#4F9BF2", "R": "#8A4B22"},
    "merchant": {"C": "#FFC83A", "c": "#C48B12", "H": "#3A2A44", "h": "#FFC83A", "R": "#2B2B2B"},
}


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


for name, colors in AGENTS.items():
    pal = {**BASE, **colors}
    for frame, legs in enumerate(LEGS):
        rows = HATS[name] + HEAD + BODY + legs
        img = Image.new("RGBA", (10, len(rows)), (0, 0, 0, 0))
        for y, row in enumerate(rows):
            assert len(row) == 10, (name, y, row)
            for x, ch in enumerate(row):
                if ch != ".":
                    img.putpixel((x, y), hexrgb(pal[ch]))
        img.resize((10 * scale, len(rows) * scale), Image.NEAREST).save(os.path.join(out, f"agent-{name}-{frame}.png"))
# Portraits for where an agent speaks (the find card, the remake line, the reason sheet, the away card): the hat,
# head and shoulders in a sky window with an outline. 14 art pixels at 9 is 126 px, which a 3x screen shows at 42 pt
# with no resampling.
PORTRAIT_SCALE = 9
SKY = ["#9ADCF8"] * 7 + ["#7CCBF0"] * 5
for name, colors in AGENTS.items():
    pal = {**BASE, **colors}
    img = Image.new("RGBA", (14, 14), hexrgb(BASE["k"]))
    for y in range(12):
        for x in range(12):
            img.putpixel((x + 1, y + 1), hexrgb(SKY[y]))
    for y, row in enumerate(HATS[name] + HEAD + BODY):
        for x, ch in enumerate(row):
            if ch != ".":
                img.putpixel((x + 2, y + 1), hexrgb(pal[ch]))
    big = img.resize((14 * PORTRAIT_SCALE, 14 * PORTRAIT_SCALE), Image.NEAREST)
    big.save(os.path.join(out, f"portrait-{name}@3x.png"))
# Raid stars: lit and not yet lit.
STAR = [
    ".....k.....",
    "....kHk....",
    "....kHk....",
    "kkkkkHYkkkk",
    "kHHHHYYYYYk",
    ".kYYYYYYYk.",
    "..kYYYYYk..",
    "..kYYYYYk..",
    ".kYYkkkYYk.",
    ".kYk...kYk.",
    "kkk.....kkk",
]
for name, pal in {"star-lit": {"k": "#24152B", "Y": "#FFC83A", "H": "#FFF0A0"},
                  "star-dim": {"k": "#24152B", "Y": "#B9A07A", "H": "#D8C6A0"}}.items():
    img = Image.new("RGBA", (11, 11), (0, 0, 0, 0))
    for y, row in enumerate(STAR):
        for x, ch in enumerate(row):
            if ch != ".":
                img.putpixel((x, y), hexrgb(pal[ch]))
    img.resize((11 * scale, 11 * scale), Image.NEAREST).save(os.path.join(out, f"{name}.png"))

print("sprites", out, "size", (10, len(HATS["writer"]) + len(HEAD) + len(BODY) + len(LEGS[0])))
