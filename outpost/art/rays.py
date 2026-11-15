# Draws the gold sunburst that turns behind the milestone banner, as pixel art: 12 rays in solid bands, near white at the
# middle, then pale, gold, and a darker amber rim. 312 pixels across a 780 pt image is 2.5 pt a pixel, close to the
# village's 2 pt, and scale 8 saves it at about its size on a 3x screen so iOS doesn't soften the edges. 780 pt reaches
# the corners of the Feed's deck area at any angle.
# Run: python3 outpost/art/rays.py <out dir> [scale]
import math
import os
import sys

from PIL import Image

out = sys.argv[1]
scale = int(sys.argv[2]) if len(sys.argv) > 2 else 8
os.makedirs(out, exist_ok=True)

N = 312  # pixels across
RAYS = 12
WHITE = (0xFF, 0xFB, 0xE6, 255)
PALE = (0xFF, 0xF3, 0xB0, 255)
GOLD = (0xFF, 0xD8, 0x4D, 255)
AMBER = (0xF2, 0xA9, 0x3B, 255)
BANDS = [(0.3, WHITE), (0.62, PALE), (0.82, GOLD), (1.0, AMBER)]  # (outer radius, color), middle out

img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
c = (N - 1) / 2
for y in range(N):
    for x in range(N):
        dx, dy = x - c, y - c
        r = math.hypot(dx, dy) / c  # 0 at the middle, 1 at the edge
        if r > 1 or r < 0.08:
            continue
        a = (math.degrees(math.atan2(dy, dx)) % (360 / RAYS)) / (360 / RAYS)
        # Each ray is a wedge a little under half its period wide, so the gaps between rays are as wide as the rays.
        if abs(a - 0.5) > 0.21:
            continue
        img.putpixel((x, y), next(col for edge, col in BANDS if r <= edge))

img.resize((N * scale, N * scale), Image.NEAREST).save(os.path.join(out, "rays.png"))
