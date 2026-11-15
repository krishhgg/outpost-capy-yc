# Draws the small moving pieces laid over the village picture: three campfire frames, the fire's glow on the ground,
# a lantern halo and a smoke puff. They use the village's pixel size (6 screen pixels per art pixel) so they sit on
# its grid, and the glows step in flat bands of alpha the way the sea steps to deep water.
# Run: python3 outpost/art/ambient.py <out dir>
import os
import sys

from PIL import Image

out = sys.argv[1]
SCALE = 6
os.makedirs(out, exist_ok=True)

PALETTE = {
    "R": (0xB0, 0x4A, 0x10, 255),
    "O": (0xF0, 0x7A, 0x2A, 255),
    "Y": (0xFF, 0xC8, 0x3A, 255),
    "L": (0xFF, 0xF3, 0xB0, 255),
    "G": (0xC8, 0xCE, 0xDA, 230),
    "H": (0xF2, 0xF4, 0xF8, 230),
}

SPRITES = {
    "fire0": [
        "....R.....",
        "....O.....",
        "...OO..R..",
        "...OYO.O..",
        "..OOYO.OO.",
        "..OYYYOOO.",
        ".OOYLYYYO.",
        ".OYYLLYYO.",
        ".OYLLLLYOO",
        "OOYLLLLYYO",
        "OYYLLLLLYO",
        ".OYYYYYYO.",
    ],
    "fire1": [
        "......R...",
        ".....OO...",
        "..R..OO...",
        "..O.OYO...",
        ".OO.OYOO..",
        ".OOOYYYO..",
        ".OYYYLYOO.",
        ".OYYLLYYO.",
        "OOYLLLLYO.",
        "OYYLLLLYOO",
        "OYLLLLLYYO",
        ".OYYYYYYO.",
    ],
    "fire2": [
        "..........",
        "...R......",
        "...OO.....",
        "..OYO..O..",
        "..OYOO.OO.",
        ".OOYYO.OYO",
        ".OYYLYOOYO",
        "OOYLLLYYYO",
        "OYYLLLLYO.",
        "OYLLLLLYOO",
        "OYYLLLLLYO",
        ".OYYYYYYO.",
    ],
    "smoke": [
        ".GGG.",
        "GHHGG",
        "GHGGG",
        "GGGGG",
        ".GGG.",
    ],
}


def save(img, name):
    img.resize((img.width * SCALE, img.height * SCALE), Image.NEAREST).save(os.path.join(out, f"{name}.png"))


for name, rows in SPRITES.items():
    img = Image.new("RGBA", (len(rows[0]), len(rows)), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        assert len(row) == len(rows[0]), name
        for x, c in enumerate(row):
            if c != ".":
                img.putpixel((x, y), PALETTE[c])
    save(img, name)


def glow(name, w, h, color, steps):
    """An ellipse of flat alpha bands: steps is [(reach, alpha)] from the middle out, reach 0..1 of the radius."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cx, cy = (w - 1) / 2, (h - 1) / 2
    for y in range(h):
        for x in range(w):
            d = ((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2
            for reach, alpha in steps:
                if d <= reach:
                    img.putpixel((x, y), color + (alpha,))
                    break
    save(img, name)


glow("fireglow", 56, 36, (0xFF, 0xB8, 0x5A), [(0.25, 80), (0.55, 50), (1.0, 24)])
glow("lampglow", 11, 11, (0xFF, 0xE6, 0x8C), [(0.3, 130), (1.0, 55)])
print("wrote ambient sprites to", out)
