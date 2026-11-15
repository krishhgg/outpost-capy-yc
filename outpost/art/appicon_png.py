# Turns appicon.py's renders into the app icon and the splash image, with the village's outlines and palette.
# Run: python3 outpost/art/appicon_png.py <render dir> <assets dir>
# Writes icon.png (1024 px, the island on the sea, no transparency as iOS wants) and splash-icon.png (the island
# alone on a clear background; app.json puts it on the same sea blue).
import ast
import json
import os
import random
import sys

import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))

# pixelate.py does its work as it runs, so take just its pixel() function: outlines, grass tufts, leaf marks, palette.
PIXELATE = os.path.join(here, "pixelate.py")
g = {"np": np, "random": random, "Image": Image}
for node in ast.parse(open(PIXELATE).read()).body:
    if isinstance(node, ast.FunctionDef) and node.name == "pixel":
        exec(compile(ast.Module([node], type_ignores=[]), PIXELATE, "exec"), g)
random.seed(7)

rgba = np.asarray(Image.open(os.path.join(src, "color.png")).convert("RGBA")).astype(np.int32)
ids = np.asarray(Image.open(os.path.join(src, "id.png")).convert("RGB")).astype(np.int32)
solid = rgba[..., 3] > 127
palette = np.array([[int(l[i:i + 2], 16) for i in (1, 3, 5)]
                    for l in map(str.strip, open(os.path.join(here, "village-palette.txt"))) if len(l) == 7 and l[0] == "#"])
art = np.asarray(g["pixel"](rgba[..., :3], ids, solid, tufts=True, palette=palette, rim=True, leaves=True)).astype(np.int32)


def near(mask):
    """Pixels next to the mask, up, down, left or right, but not in it."""
    pad = np.pad(mask, 1)
    return (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]) & ~mask


# The island's rim gets the village's dark line, then a ring of white foam where it meets the water.
rim = solid & near(~solid)
art[rim] = (art[rim] * 0.42 + np.array([34, 22, 58]) * 0.52).astype(np.int32)
foam = near(solid)
h, w = solid.shape
sea = np.array([int(json.load(open(os.path.join(out, "base", "layout.json")))["sea"][i:i + 2], 16) for i in (1, 3, 5)])

# Splash: the island and its foam on a clear background.
splash = np.zeros((h, w, 4), dtype=np.uint8)
splash[solid, :3] = art[solid]
splash[foam, :3] = (233, 252, 255)
splash[..., 3] = (solid | foam) * 255
# 18x, so iOS's 1x, 2x and 3x copies at 192 pt (a sixth, a third and half of it) keep whole pixels.
Image.fromarray(splash).resize((w * 18, h * 18), Image.NEAREST).save(os.path.join(out, "splash-icon.png"), optimize=True)

# Icon: the same island on the sea, with a few glints on the water like the Base's shore.
icon = np.broadcast_to(sea, (h, w, 3)).copy()
rnd = random.Random(3)
taken = solid | foam | near(solid | foam)
for _ in range(40):
    y, x, n = rnd.randrange(2, h - 2), rnd.randrange(2, w - 6), rnd.choice((3, 4, 4, 5))
    if not taken[y, x:x + n].any():
        icon[y, x:x + n] = (111, 208, 242) if rnd.random() < 0.6 else (233, 252, 255)
        taken[max(0, y - 1):y + 2, max(0, x - 1):x + n + 1] = True
icon[solid] = art[solid]
icon[foam] = (233, 252, 255)
Image.fromarray(icon.astype(np.uint8)).resize((1024, 1024), Image.NEAREST).save(os.path.join(out, "icon.png"), optimize=True)
print("wrote", out)
