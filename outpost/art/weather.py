# Draws the village's weather, laid over the picture by Ambient.tsx: a cloud's shadow that drifts across the map, a
# sparkle that blinks on the water, and two frames of the shoreline's foam edge that swap so the surf laps. The foam
# is read from village.png, since it has to follow the drawn shoreline pixel for pixel. Everything uses the village's
# pixel size (6 screen pixels per art pixel) so it sits on its grid.
# Run: python3 outpost/art/weather.py <village.png> <out dir>
import os
import sys

from PIL import Image

src, out = sys.argv[1], sys.argv[2]
SCALE = 6
os.makedirs(out, exist_ok=True)


def save(img, name):
    img.resize((img.width * SCALE, img.height * SCALE), Image.NEAREST).save(os.path.join(out, f"{name}.png"))


# The cloud's shadow: three overlapping ellipses in a flat, see-through blue-black, a little darker in the middle.
SHADOW = (0x14, 0x2A, 0x3A)
cloud = Image.new("RGBA", (46, 18), (0, 0, 0, 0))
PUFFS = [(12, 11, 11, 6), (24, 8, 14, 8), (35, 11, 10, 6)]  # center x, center y, radius x, radius y
for y in range(cloud.height):
    for x in range(cloud.width):
        d = min(((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 for cx, cy, rx, ry in PUFFS)
        if d <= 1:
            cloud.putpixel((x, y), SHADOW + (72 if d <= 0.45 else 50,))
save(cloud, "cloud")

# A sparkle: a white plus with a bright middle.
glint = Image.new("RGBA", (3, 3), (0, 0, 0, 0))
for x, y in [(1, 0), (0, 1), (1, 1), (2, 1), (1, 2)]:
    glint.putpixel((x, y), (0xFF, 0xFF, 0xFF, 255 if (x, y) == (1, 1) else 200))
save(glint, "glint")

# The foam edge. Where foam meets open water, each frame pushes the foam one pixel further out in every other run of
# four columns, and the two frames take turns, so the edge looks like it's lapping. Rows 186 to 200 hold the whole edge.
FOAM, WATER = (0xF1, 0xFF, 0xF8), (0x3E, 0xB4, 0xE2)
TOP, BOTTOM = 186, 201
art = Image.open(src).convert("RGB")
art = art.resize((art.width // SCALE, art.height // SCALE), Image.NEAREST)
edge = {}
for x in range(art.width):
    for y in range(BOTTOM - 2, TOP - 1, -1):
        if art.getpixel((x, y)) == FOAM and art.getpixel((x, y + 1)) == WATER:
            edge[x] = y + 1
            break
for k in (0, 1):
    foam = Image.new("RGBA", (art.width, BOTTOM - TOP), (0, 0, 0, 0))
    for x, y in edge.items():
        if (x // 4) % 2 == k:
            foam.putpixel((x, y - TOP), FOAM + (255,))
    save(foam, f"foam{k}")
print("wrote weather sprites to", out, "with", len(edge), "foam edge columns")
