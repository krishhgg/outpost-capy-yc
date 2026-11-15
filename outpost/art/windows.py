# Draws the two window layers laid over the village: the glass gone dark, for when the studio laptop is asleep, and
# brighter glass, for when it is working. Both are the village's full size (192 x 216 art pixels at 6x),
# clear except at the windows, so the app lays them straight over the picture.
# Run after pixelate.py and boats.py: python3 outpost/art/windows.py <village.png> <out dir>
import os
import sys

from PIL import Image

src, out = sys.argv[1], sys.argv[2]
SCALE = 6
os.makedirs(out, exist_ok=True)

GLASS = (0xFF, 0xD9, 0x77)  # the lit glass in village.png
DARK = (0x2E, 0x32, 0x52, 255)  # glass at night: slate blue
GLOW = (0xFF, 0xC8, 0x5A)
# The windows, as art-pixel boxes (left, top, right, bottom), measured from village.png: the Studio's front window and
# its two on the right, then the Post's front and right. The same yellow is on the lamps and the Vault's trim, so only
# glass inside a box counts.
WINDOWS = [(132, 58, 137, 66), (148, 58, 153, 66), (159, 52, 163, 56), (32, 116, 37, 124), (52, 123, 56, 130)]

art = Image.open(src).convert("RGB")
art = art.resize((art.width // SCALE, art.height // SCALE), Image.NEAREST)
W, H = art.size

dark = Image.new("RGBA", (W, H), (0, 0, 0, 0))
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
for (x0, y0, x1, y1) in WINDOWS:
    found = 0
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if art.getpixel((x, y)) == GLASS:
                dark.putpixel((x, y), DARK)
                found += 1
    if not found:
        sys.exit(f"no lit glass in window box {(x0, y0, x1, y1)}; measure the windows again")
# The glow brightens the glass itself and spills one art pixel onto the frame around it. A wider halo washed over the
# roofs and read as haze.
BRIGHT = (0xFF, 0xF4, 0xC4, 255)
SPILL = GLOW + (90,)
for (x, y) in [(x, y) for y in range(H) for x in range(W) if dark.getpixel((x, y))[3]]:
    glow.putpixel((x, y), BRIGHT)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < H and not dark.getpixel((nx, ny))[3] and not glow.getpixel((nx, ny))[3]:
            glow.putpixel((nx, ny), SPILL)

for img, name in ((dark, "windows-dark.png"), (glow, "windows-glow.png")):
    img.resize((W * SCALE, H * SCALE), Image.NEAREST).save(os.path.join(out, name), optimize=True)
print("wrote windows-dark.png and windows-glow.png to", out)
