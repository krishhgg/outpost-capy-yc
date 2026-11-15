# Draws the water tile that fills the space behind the Feed, You and Under the hood: the same deep blue as before, with
# a few small wave crests so it reads as sea rather than a flat colour. 32 x 32 art pixels, written at 6x as
# sea@3x.png, so one art pixel is 2 pt on screen, close to the village's own pixel size.
# Run: python3 outpost/art/sea.py outpost/assets/ui
import os
import sys

from PIL import Image

out = sys.argv[1]
SIZE, SCALE = 32, 6
DEEP = (0x2B, 0x78, 0xC4)  # DEEP in src/pixel.tsx
CREST = (0x47, 0x94, 0xDA)
GLINT = (0x5E, 0xA4, 0xE4)

img = Image.new("RGB", (SIZE, SIZE), DEEP)
# Each crest is two pixels up in the middle and two down either side. Staggered so the repeat isn't obvious.
for x, y in [(3, 4), (19, 9), (9, 17), (25, 22), (14, 28), (28, 14)]:
    for dx, dy in [(2, 0), (3, 0), (0, 1), (1, 1), (4, 1), (5, 1)]:
        img.putpixel(((x + dx) % SIZE, (y + dy) % SIZE), CREST)
for x, y in [(27, 3), (6, 24), (17, 19)]:
    img.putpixel((x, y), GLINT)

os.makedirs(out, exist_ok=True)
img.resize((SIZE * SCALE, SIZE * SCALE), Image.NEAREST).save(os.path.join(out, "sea@3x.png"))
print("wrote sea@3x.png to", out)
