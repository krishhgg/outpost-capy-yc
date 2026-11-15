# Lifts the two boats out of the village picture so they can bob. Each boat is written alone on a clear background, at
# the village's 6x pixel size, and village.png is rewritten in place with water where the boats were: every boat pixel
# becomes the most common water, foam or sand color of its own row near the boat. Run it once, after pixelate.py.
# Run: python3 outpost/art/boats.py <village.png> <out dir>
import os
import sys
from collections import Counter

from PIL import Image

src, out = sys.argv[1], sys.argv[2]
SCALE = 6
os.makedirs(out, exist_ok=True)

mode = Image.open(src).mode
big = Image.open(src).convert("RGBA")
art = big.resize((big.width // SCALE, big.height // SCALE), Image.NEAREST)
W, H = art.size

# Colors that belong to the scene, not a boat: sand, its shadow, grass, foam, the water bands and a hull's shadow.
SCENE = {"FCDA98", "A29886", "3E842E", "66BF35", "F1FFF8", "3EB4E2", "73D3EB", "247DC9"}
hexof = lambda c: "%02X%02X%02X" % c[:3]

# A hull pixel of each boat, in art pixels; the boat is everything joined to it that isn't scene.
BOATS = {"boat1": (50, 208), "boat2": (150, 213)}

if any(hexof(art.getpixel(seed)) in SCENE for seed in BOATS.values()):
    sys.exit(f"no boat at the seeds in {src}; its boats were already lifted out")

for name, seed in BOATS.items():
    seen, todo = set(), [seed]
    while todo:
        x, y = todo.pop()
        if (x, y) in seen or not (0 <= x < W and 0 <= y < H) or hexof(art.getpixel((x, y))) in SCENE:
            continue
        seen.add((x, y))
        todo += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    xs, ys = [p[0] for p in seen], [p[1] for p in seen]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs) + 1, max(ys) + 1
    boat = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    for y in range(y0, y1):
        # The row a little past the boat on both sides, since the hull fills its widest rows edge to edge.
        row = Counter(art.getpixel((x, y)) for x in range(max(0, x0 - 6), min(W, x1 + 6)) if (x, y) not in seen)
        fill = row.most_common(1)[0][0]
        for x in range(x0, x1):
            if (x, y) in seen:
                boat.putpixel((x - x0, y - y0), art.getpixel((x, y)))
                big.paste(fill, (x * SCALE, y * SCALE, (x + 1) * SCALE, (y + 1) * SCALE))
    boat.resize(((x1 - x0) * SCALE, (y1 - y0) * SCALE), Image.NEAREST).save(os.path.join(out, f"{name}.png"))
    print(name, "at", (x0, y0), "size", (x1 - x0, y1 - y0))

big.convert(mode).save(src)
