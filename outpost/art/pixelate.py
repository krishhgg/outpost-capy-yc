# Turns village.py's renders into the app's pixel art: a dark outline around every prop, grass tufts on the ground,
# the fixed palette in village-palette.txt, then a nearest-neighbour upscale so each art pixel stays a crisp square on the phone.
# Run: python3 outpost/art/pixelate.py <render dir> <assets dir> [scale]
# Writes village.png, shop.png (cropped, transparent) and layout.json (art size, where the Shop sits, label anchors
# and the road spots agents walk between, all as fractions of the art). Then run boats.py to lift the boats out.
import json
import os
import random
import sys

import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
scale = int(sys.argv[3]) if len(sys.argv) > 3 else 6
os.makedirs(out, exist_ok=True)
random.seed(7)


def load(name, mode):
    return np.asarray(Image.open(os.path.join(src, name)).convert(mode)).astype(np.int32)


def pixel(color, ids, solid, tufts, palette=None, rim=False, leaves=False):
    """Outlines and texture on one layer. `solid` marks pixels that belong to the layer. With a palette, every pixel
    takes the nearest of its colours; without one, the layer gets its own 64."""
    key = (ids[..., 0] << 16) | (ids[..., 1] << 8) | ids[..., 2]
    key[~solid] = 0  # clear background counts as ground, so the layer's edge gets a line
    h, w = key.shape
    img = color.copy()

    if tufts:
        # Little two-tone marks on bright green ground, so the field has texture at pixel scale.
        r, g, b = color[..., 0], color[..., 1], color[..., 2]
        grass = (key == 0) & (g > r + 40) & (g > b + 60)
        # Every try draws the same three numbers, so a new prop only changes the tufts where it lands.
        for _ in range(w * h // 26):
            y, x, wide = random.randrange(1, h - 1), random.randrange(1, w - 1), random.random() < 0.5
            if grass[y, x] and grass[y - 1, x] and grass[y, x + 1]:
                base = color[y, x]
                img[y, x] = np.clip(base * 0.78, 0, 255)
                img[y - 1, x] = np.clip(base * 1.15 + 10, 0, 255)
                if wide:
                    img[y, x + 1] = np.clip(base * 0.82, 0, 255)

    # A prop pixel that touches the ground or another prop gets the line. Between two props only the one with the
    # larger key draws it, so the line stays one pixel wide.
    pad = np.pad(key, 1, constant_values=0)
    edge = np.zeros_like(key, dtype=bool)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        nb = pad[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
        edge |= (key != 0) & (nb != key) & ((nb == 0) | (key > nb))
    # The line is the pixel's own color, darker and pushed toward purple, so it never reads as flat black.
    img[edge] = (color[edge] * 0.42 + np.array([34, 22, 58]) * 0.52).astype(np.int32)
    # Rim light: the first pixel inside a prop's top or left outline catches the sun, one step brighter.
    if rim:
        epad = np.pad(edge, 1, constant_values=False)
        up, left = epad[:-2, 1:-1], epad[1:-1, :-2]
        kup, kleft = pad[:-2, 1:-1], pad[1:-1, :-2]
        lit = (key != 0) & ~edge & ((up & (kup == key)) | (left & (kleft == key)))
        img[lit] = np.clip(color[lit] * 1.22 + 14, 0, 255).astype(np.int32)
    # Leaf marks: small two-tone notches inside the tree crowns, so a crown reads as leaves, not a flat shape. They use
    # their own random stream, so the grass tufts keep their pattern.
    if leaves:
        r, g, b = color[..., 0], color[..., 1], color[..., 2]
        crown = (key != 0) & ~edge & (g > r + 30) & (g > b + 40)
        rnd = random.Random(11)
        for _ in range(w * h // 10):
            y, x = rnd.randrange(2, h - 1), rnd.randrange(1, w - 2)
            if crown[y, x] and crown[y - 1, x] and crown[y - 2, x] and crown[y + 1, x] and crown[y, x + 1]:
                base = color[y, x]
                img[y, x] = base * 0.72
                img[y, x + 1] = base * 0.8
                img[y - 1, x] = np.clip(base * 1.18 + 12, 0, 255)

    img = np.clip(img, 0, 255)
    if palette is not None:
        near = ((img.reshape(-1, 1, 3) - palette[None]) ** 2).sum(2).argmin(1)
        return Image.fromarray(palette[near].reshape(h, w, 3).astype(np.uint8))
    rgb = Image.fromarray(img.astype(np.uint8))
    return rgb.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")


def big(img):
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


color, ids = load("color.png", "RGB"), load("id.png", "RGB")
h, w = color.shape[:2]
PALETTE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "village-palette.txt")
palette = np.array([[int(l[i:i + 2], 16) for i in (1, 3, 5)] for l in map(str.strip, open(PALETTE)) if len(l) == 7 and l[0] == "#"], dtype=np.int32)
village = pixel(color, ids, np.ones((h, w), dtype=bool), tufts=True, palette=palette, rim=True, leaves=True)
big(village).save(os.path.join(out, "village.png"), optimize=True)

shop_rgba = load("shop_color.png", "RGBA")
solid = shop_rgba[..., 3] > 127
shop = pixel(shop_rgba[..., :3], load("shop_id.png", "RGB"), solid, tufts=False).convert("RGBA")
shop.putalpha(Image.fromarray((solid * 255).astype(np.uint8)))
ys, xs = np.nonzero(solid)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
big(shop.crop((x0, y0, x1, y1))).save(os.path.join(out, "shop.png"), optimize=True)

anchors = json.load(open(os.path.join(src, "anchors.json")))
# The sea along the bottom edge, so the screen below the art can carry on in the same blue.
bottom = np.asarray(village)[-1].reshape(-1, 3)
vals, counts = np.unique(bottom, axis=0, return_counts=True)
sea = "#%02X%02X%02X" % tuple(vals[counts.argmax()])
layout = {
    "w": w, "h": h, "sea": sea,
    "shop": {"x": round(x0 / w, 4), "y": round(y0 / h, 4), "w": round((x1 - x0) / w, 4), "h": round((y1 - y0) / h, 4)},
    **anchors,
}
json.dump(layout, open(os.path.join(out, "layout.json"), "w"), indent=1)
print("wrote", out, (w * scale, h * scale), "shop", layout["shop"])
