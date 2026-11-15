# Builds the Base village in Blender and renders it at pixel-art size, the way Dead Cells turns 3D into pixels.
# Run: blender -b -P outpost/art/village.py -- <out dir>
# Writes color.png (the lit scene), id.png (one flat color per prop, for outlines) and anchors.json (where each
# building's label and door land on screen, from 0 to 1). pixelate.py turns those into the app's art.
import bpy, json, math, os, random, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/outpost/art"
W, H = 192, 216  # art pixels; the app scales each one up 6 times
os.makedirs(OUT, exist_ok=True)
random.seed(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
S2 = math.sqrt(2)


def P(r, f):
    """Ground point from screen-ish coordinates: r to the right, f away from the viewer."""
    return ((r - f) / S2, (r + f) / S2)


def lin(hexs):
    h = hexs.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


MATS = {}


TEX = {}  # color -> surface pattern, filled in once the palette is defined


def pattern(nt, kind):
    """A brightness multiplier that gives a surface texture at pixel scale: shingle rows, stone blocks or grass patches."""
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Position"], sep.inputs[0])

    def math(op, a, b=None, c=None):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation = op
        for i, v in enumerate((a, b, c)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                nt.links.new(v, n.inputs[i])
        return n.outputs[0]

    if kind in ("rows", "planks"):
        period, dark = (0.34, 0.7) if kind == "rows" else (0.42, 0.78)
        band = math("LESS_THAN", math("FRACT", math("MULTIPLY", sep.outputs["Z"], 1 / period)), 0.3)
        return math("MULTIPLY_ADD", band, dark - 1.0, 1.0)
    if kind == "blocks":
        comb = nt.nodes.new("ShaderNodeCombineXYZ")
        nt.links.new(math("ADD", sep.outputs["X"], sep.outputs["Y"]), comb.inputs[0])
        nt.links.new(sep.outputs["Z"], comb.inputs[1])
        brick = nt.nodes.new("ShaderNodeTexBrick")
        brick.inputs["Scale"].default_value = 1.0
        brick.inputs["Mortar Size"].default_value = 0.07
        brick.inputs["Brick Width"].default_value = 0.8
        brick.inputs["Row Height"].default_value = 0.4
        nt.links.new(comb.outputs[0], brick.inputs["Vector"])
        return math("MULTIPLY_ADD", brick.outputs["Fac"], -0.4, 1.0)
    # grass: soft noise cut into three flat tones
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.42
    noise.inputs["Detail"].default_value = 1.5
    nt.links.new(geo.outputs["Position"], noise.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    cr = ramp.color_ramp
    cr.interpolation = "CONSTANT"
    cr.elements[0].color = (0.8, 0.82, 0.8, 1)
    cr.elements[1].position = 0.6
    cr.elements[1].color = (1.16, 1.18, 1.05, 1)
    cr.elements.new(0.43).color = (1.0, 1.0, 1.0, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs[0])
    return ramp.outputs[0]


def toon(hexs, glow=False):
    """Flat color lit in three bands: cool shadow, base, warm highlight. Glow materials ignore light."""
    key = (hexs, glow)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(f"{hexs}{'-glow' if glow else ''}")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(emit.outputs[0], out.inputs[0])
    base = lin(hexs)
    if glow:
        emit.inputs["Color"].default_value = base
    else:
        diff = nt.nodes.new("ShaderNodeBsdfDiffuse")
        diff.inputs["Color"].default_value = (1, 1, 1, 1)
        s2r = nt.nodes.new("ShaderNodeShaderToRGB")
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        cr = ramp.color_ramp
        cr.interpolation = "CONSTANT"
        # Four flat bands: crevices, shade (cool), side faces, full sun (warm). Values are linear, so a band that
        # should look 30% darker on screen is about 0.45 here.
        cr.elements[0].position = 0.0
        cr.elements[0].color = (0.2, 0.22, 0.48, 1)
        cr.elements[1].position = 0.55
        cr.elements[1].color = (1.08, 1.03, 0.94, 1)
        cr.elements.new(0.1).color = (0.4, 0.46, 0.72, 1)
        cr.elements.new(0.3).color = (0.76, 0.77, 0.88, 1)
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        mix.inputs["A"].default_value = base
        if hexs in TEX:
            tint = nt.nodes.new("ShaderNodeMix")
            tint.data_type = "RGBA"
            tint.blend_type = "MULTIPLY"
            tint.inputs["Factor"].default_value = 1.0
            tint.inputs["A"].default_value = base
            nt.links.new(pattern(nt, TEX[hexs]), tint.inputs["B"])
            nt.links.new(tint.outputs["Result"], mix.inputs["A"])
        nt.links.new(diff.outputs[0], s2r.inputs[0])
        nt.links.new(s2r.outputs[0], ramp.inputs[0])
        nt.links.new(ramp.outputs[0], mix.inputs["B"])
        nt.links.new(mix.outputs["Result"], emit.inputs["Color"])
    MATS[key] = m
    return m


GROUND = set()  # names of ground pieces; no outlines between them
ROLE = {}  # object name -> prop id, so a whole building outlines as one piece
_pid = [0]


def prop():
    _pid[0] += 1
    return _pid[0]


def put(obj, color, pid=None, glow=False, ground=False):
    obj.data.materials.append(toon(color, glow))
    for poly in obj.data.polygons:
        poly.use_smooth = False
    if ground:
        GROUND.add(obj.name)
    ROLE[obj.name] = pid if pid is not None else prop()
    return obj


def box(x, y, z, sx, sy, sz, color, pid=None, rot=0.0, glow=False, ground=False):
    """Box with its bottom at z."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z + sz / 2), rotation=(0, 0, rot))
    o = bpy.context.object
    o.scale = (sx, sy, sz)
    return put(o, color, pid, glow, ground)


def cyl(x, y, z, r, h, color, pid=None, verts=10, glow=False, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(x, y, z + h / 2), rotation=rot)
    return put(bpy.context.object, color, pid, glow)


def cone(x, y, z, r, h, color, pid=None, verts=4, rot=math.pi / 4, glow=False, r2=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=(x, y, z + h / 2), rotation=(0, 0, rot))
    return put(bpy.context.object, color, pid, glow)


def ball(x, y, z, r, color, pid=None, sub=1, squash=1.0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=(x, y, z))
    o = bpy.context.object
    o.scale = (1, 1, squash)
    return put(o, color, pid)


def gable(x, y, z, sx, sy, h, color, pid, along_x=True):
    """A pitched roof whose ridge runs along x (or y)."""
    import bmesh
    me = bpy.data.meshes.new("roof")
    bm = bmesh.new()
    hx, hy = sx / 2, sy / 2
    if along_x:
        v = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0), (-hx, 0, h), (hx, 0, h)]
        faces = [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    else:
        v = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0), (0, -hy, h), (0, hy, h)]
        faces = [(1, 2, 5, 4), (3, 0, 4, 5), (0, 1, 4), (2, 3, 5), (0, 3, 2, 1)]
    vs = [bm.verts.new(p) for p in v]
    for f in faces:
        bm.faces.new([vs[i] for i in f])
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("roof", me)
    bpy.context.collection.objects.link(o)
    o.location = (x, y, z)
    bpy.context.view_layer.objects.active = o
    return put(o, color, pid)


def tri(points, color, pid=None):
    me = bpy.data.meshes.new("tri")
    me.from_pydata(points, [], [tuple(range(len(points)))])
    o = bpy.data.objects.new("tri", me)
    bpy.context.collection.objects.link(o)
    return put(o, color, pid)


def strip(r0, f0, r1, f1, width, color, z=0.0, ground=True):
    """A flat strip between two ground points, for paths and shores."""
    (x0, y0), (x1, y1) = P(r0, f0), P(r1, f1)
    length = math.hypot(x1 - x0, y1 - y0)
    ang = math.atan2(y1 - y0, x1 - x0)
    return box((x0 + x1) / 2, (y0 + y1) / 2, z, length, width, 0.02, color, pid=0, rot=ang, ground=ground)


# ---------- palette ----------
GRASS, GRASS_D, GRASS_L = "#62BC37", "#4FA22C", "#86D64C"
PATH, PATH_D = "#E0BB7C", "#C79A5C"
SAND, FOAM, WATER, DEEP = "#F4D79C", "#E9FCFF", "#3CB2E8", "#2B8FD0"
WOOD, WOOD_D, PLASTER = "#9A6233", "#6E4322", "#F4E4C4"
STONE, STONE_D = "#B3B4C4", "#7F8194"
LEAF, LEAF_D, LEAF_L, TRUNK = "#3FA33B", "#2E8530", "#5BC446", "#7B4A24"
GLOW, FIRE, FIRE2 = "#FFD978", "#FF7A1A", "#FFE15A"
TEAL, ORANGE, BLUE, GOLD, PINK, RED = "#2FC9B5", "#FF8B2B", "#4F9BF2", "#FFC83A", "#FF6FB5", "#E8483B"
TEX.update({TEAL: "rows", ORANGE: "rows", BLUE: "rows", "#B8402F": "rows", "#D9A86A": "planks", WOOD: "planks",
            STONE: "blocks", STONE_D: "blocks", GRASS: "grass"})

# Rows of the village, as distances up the screen. Far enough apart that a nameplate under a building clears the roof below.
ROW1, ROW2, CAMP_F, SHOP_F = 8.4, -0.6, 3.9, -5.6

# ---------- ground ----------
box(0, 0, -0.05, 90, 90, 0.05, GRASS, pid=0, ground=True)
# Shore: sand, foam, shallow and deep water, running straight across the bottom of the screen.
strip(-30, -8.6, 30, -8.6, 2.6, SAND, z=0.03)
strip(-30, -10.0, 30, -10.0, 0.45, FOAM, z=0.04)
for k in range(40):
    r0 = -10 + k * 0.5
    strip(r0, -10.1 - random.uniform(0, 0.35), r0 + random.uniform(0.4, 0.9), -10.1 - random.uniform(0, 0.35), random.uniform(0.25, 0.5), FOAM, z=0.041)
strip(-30, -11.2, 30, -11.2, 0.8, "#6FD0F2", z=0.037)
strip(-30, -13.0, 30, -13.0, 5.0, WATER, z=0.035)
strip(-30, -22.0, 30, -22.0, 13.5, DEEP, z=0.034)
for _ in range(14):  # glints on the water
    r, f = random.uniform(-9, 9), random.uniform(-15, -11.2)
    x, y = P(r, f)
    box(x, y, 0.05, random.uniform(0.3, 0.7), 0.12, 0.01, FOAM, pid=0, rot=math.pi / 4, ground=True)
# Paths: the main road from the hills to the dock, and one across each row of buildings.
strip(0, 16, 0, -8.2, 1.7, PATH, z=0.02)
strip(-6.2, ROW1, 6.2, ROW1, 1.3, PATH, z=0.021)
strip(-6.2, ROW2, 6.2, ROW2, 1.3, PATH, z=0.021)
for f in [x * 0.9 for x in range(-9, 18)]:  # pebbles along the road edge
    for side in (-0.95, 0.95):
        if random.random() < 0.55:
            x, y = P(side + random.uniform(-0.1, 0.1), f + random.uniform(-0.2, 0.2))
            box(x, y, 0.02, 0.18, 0.18, 0.04, PATH_D, pid=0, ground=True)

ANCHORS = {}


def anchor(name, label_rf, door_rf):
    ANCHORS[name] = {"label": label_rf, "door": door_rf}


def window(x, y, z, w, h, face_y, pid):
    """A lit window with a dark wooden frame and a cross of glazing bars, so it reads as a window on a pale wall.
    face_y: on the front (-y) face, else on the right (+x) face. (x, y) is the wall's surface point."""
    if face_y:
        box(x, y - 0.03, z - 0.1, w + 0.24, 0.08, h + 0.2, WOOD_D, pid)
        box(x, y - 0.06, z, w, 0.06, h, GLOW, pid, glow=True)
        box(x, y - 0.1, z, 0.07, 0.04, h, WOOD_D, pid)
        box(x, y - 0.1, z + h / 2 - 0.035, w, 0.04, 0.07, WOOD_D, pid)
        box(x, y - 0.1, z - 0.16, w + 0.3, 0.2, 0.08, WOOD, pid)  # sill
    else:
        box(x + 0.03, y, z - 0.1, 0.08, w + 0.24, h + 0.2, WOOD_D, pid)
        box(x + 0.06, y, z, 0.06, w, h, GLOW, pid, glow=True)
        box(x + 0.1, y, z, 0.04, 0.07, h, WOOD_D, pid)
        box(x + 0.1, y, z + h / 2 - 0.035, 0.04, w, 0.07, WOOD_D, pid)
        box(x + 0.1, y, z - 0.16, 0.2, w + 0.3, 0.08, WOOD, pid)


# ---------- Scout: a watchtower ----------
def scout(r, f):
    pid = prop()
    cx, cy = P(r, f)
    s = 1.0
    for dx in (-s, s):
        for dy in (-s, s):
            box(cx + dx, cy + dy, 0, 0.28, 0.28, 3.6, WOOD, pid)
    for z in (1.1, 2.3):  # cross beams
        box(cx, cy - s, z, 2.2, 0.16, 0.16, WOOD_D, pid)
        box(cx + s, cy, z, 0.16, 2.2, 0.16, WOOD_D, pid)
    box(cx, cy, 3.5, 2.8, 2.8, 0.28, WOOD_D, pid)  # platform
    for i in range(5):  # railing posts on the two visible sides
        t = -1.3 + i * 0.65
        box(cx + 1.32, cy + t, 3.78, 0.12, 0.12, 0.6, WOOD, pid)
        box(cx + t, cy - 1.32, 3.78, 0.12, 0.12, 0.6, WOOD, pid)
    box(cx + 1.32, cy, 4.3, 0.12, 2.7, 0.12, WOOD, pid)
    box(cx, cy - 1.32, 4.3, 2.7, 0.12, 0.12, WOOD, pid)
    for dx in (-1.1, 1.1):
        for dy in (-1.1, 1.1):
            box(cx + dx, cy + dy, 3.78, 0.16, 0.16, 1.5, WOOD_D, pid)
    cone(cx, cy, 5.25, 2.25, 1.6, TEAL, pid)  # roof
    cyl(cx, cy, 6.8, 0.05, 1.4, WOOD_D, pid, verts=6)
    tri([(cx, cy, 8.1), (cx + 0.75, cy - 0.75, 7.85), (cx, cy, 7.55)], TEAL, pid)  # flag
    # A brass telescope on a tripod at the front of the platform, aimed out past the trees: the Scout's job at a glance.
    # It stands at the platform's front corner and pokes out to the left, where the roof doesn't hide it.
    tid = prop()
    tx, ty = cx + 1.0, cy - 1.0
    for a in (0.0, 2.1, 4.2):
        box(tx + 0.22 * math.cos(a), ty + 0.22 * math.sin(a), 3.78, 0.08, 0.08, 0.72, WOOD_D, tid)
    aim = (math.radians(78), 0, math.radians(-45))  # tipped up 12 degrees, pointing left across the screen

    def along(t, h, rad, color, verts):
        # A part centred t along the tube from its middle; cyl() centres at z + h/2, so z is that centre minus h/2.
        ax, az = -math.sin(aim[0]) * math.sqrt(0.5), math.cos(aim[0])
        cyl(tx - 0.28 + ax * t, ty - 0.28 + ax * t, 4.62 + az * t - h / 2, rad, h, color, tid, verts=verts, rot=aim)

    along(0.0, 2.0, 0.22, GOLD, 10)
    along(0.92, 0.18, 0.27, "#B8402F", 10)  # band at the lens end
    along(-1.12, 0.3, 0.12, "#3B3F55", 8)  # eyepiece
    for i in range(6):  # ladder
        box(cx + 1.25, cy - 0.15, 0.4 + i * 0.55, 0.08, 0.7, 0.08, WOOD_D, pid)
    # Haystack and a crate at the foot of the tower.
    ball(*P(r - 1.9, f - 1.6), 0.3, 0.45, "#E9C760", squash=0.8)
    box(*P(r + 1.9, f - 1.2), 0, 0.6, 0.6, 0.6, WOOD, rot=0.3)
    anchor("Scout", (r, f - 2.6), (r + 1.8, f - 0.8))


# ---------- Studio: a workshop with a film reel sign ----------
def studio(r, f):
    pid = prop()
    cx, cy = P(r, f)
    box(cx, cy, 0, 3.6, 3.2, 0.45, STONE, pid)
    box(cx, cy, 0.45, 3.3, 2.9, 1.9, PLASTER, pid)
    for dx in (-1.62, 1.62):
        for dy in (-1.42, 1.42):
            box(cx + dx, cy + dy, 0.45, 0.2, 0.2, 1.9, WOOD_D, pid)
    box(cx, cy - 1.45, 1.4, 3.3, 0.12, 0.14, WOOD_D, pid)
    box(cx + 1.65, cy, 1.4, 0.12, 2.9, 0.14, WOOD_D, pid)
    gable(cx, cy, 2.35, 4.1, 3.7, 1.7, ORANGE, pid, along_x=True)
    box(cx - 1.0, cy + 0.6, 2.6, 0.55, 0.55, 1.9, STONE_D, pid)  # chimney
    box(cx - 1.0, cy + 0.6, 4.5, 0.68, 0.68, 0.15, STONE, pid)
    # Door on the -y face (lower left), lit windows on both faces.
    box(cx - 0.6, cy - 1.47, 0.45, 0.75, 0.12, 1.25, WOOD_D, pid)
    window(cx + 0.65, cy - 1.45, 0.95, 0.75, 0.7, True, pid)
    window(cx + 1.65, cy - 0.5, 0.95, 0.75, 0.7, False, pid)
    window(cx + 1.65, cy + 0.7, 0.95, 0.75, 0.7, False, pid)
    # A big film reel leaning on the right face.
    reel = cyl(cx + 2.05, cy - 0.1, 0.95, 0.85, 0.22, "#3B3F55", pid, verts=16, rot=(0, math.pi / 2, 0))
    reel.location = (cx + 2.05, cy - 0.1, 1.05)
    for a in range(5):
        t = a * 2 * math.pi / 5
        cyl(cx + 2.18, cy - 0.1 + 0.45 * math.cos(t), 1.05 + 0.45 * math.sin(t) - 0.03, 0.15, 0.06, "#1E2030", pid, verts=8, rot=(0, math.pi / 2, 0))
    for i in range(2):
        box(*P(r - 2.0 + i * 0.7, f - 2.0), 0, 0.55, 0.55, 0.55, WOOD, rot=0.2 * i)
    cyl(*P(r - 2.6, f - 1.2), 0, 0.32, 0.75, WOOD_D)  # barrel
    anchor("Studio", (r, f - 2.6), (r - 1.4, f - 1.5))


# ---------- Post: a messenger house with a mailbox ----------
def post(r, f):
    pid = prop()
    cx, cy = P(r, f)
    box(cx, cy, 0, 3.0, 2.8, 0.4, STONE, pid)
    box(cx, cy, 0.4, 2.7, 2.5, 1.7, "#D9A86A", pid)  # plank walls
    for k in range(4):
        box(cx, cy - 1.26, 0.6 + k * 0.42, 2.7, 0.04, 0.05, WOOD_D, pid)
    cone(cx, cy, 2.1, 2.45, 1.7, BLUE, pid)
    box(cx + 1.37, cy + 0.2, 0.4, 0.12, 0.75, 1.2, WOOD_D, pid)  # door, +x face
    window(cx + 1.35, cy - 0.8, 0.95, 0.6, 0.6, False, pid)
    window(cx - 0.5, cy - 1.25, 0.95, 0.7, 0.6, True, pid)
    # A mailbox with its flag up and a letter in the slot, and a stack of tied parcels: big enough to say "post".
    mid = prop()
    mx, my = P(r + 2.3, f - 1.5)
    box(mx, my, 0, 0.18, 0.18, 1.0, WOOD_D, mid)
    box(mx, my, 1.0, 0.8, 0.5, 0.42, BLUE, mid, rot=math.pi / 4)
    # Rounded top, lying along the box. cyl() centres it at z + h/2, so z is the box top minus half its length.
    cyl(mx, my, 1.42 - 0.4, 0.25, 0.8, BLUE, mid, verts=12, rot=(0, math.pi / 2, math.pi / 4))
    box(*P(r + 2.75, f - 1.5), 1.0, 0.08, 0.08, 0.8, WOOD_D, mid, rot=math.pi / 4)  # flag pole at the right end
    # The flag, up: there's mail. Square to the world axes, so its broad side faces both the camera and the sun.
    fx, fy = P(r + 2.75, f - 1.5)
    box(fx + 0.3, fy, 1.42, 0.55, 0.06, 0.36, RED, mid)
    box(*P(r + 2.3, f - 1.78), 1.25, 0.42, 0.05, 0.35, "#FFFFFF", mid, rot=math.pi / 4)  # a letter half out of the slot
    for i, (size, c) in enumerate([(0.78, "#E8D2A2"), (0.66, "#C99A5E"), (0.54, "#E8D2A2")]):
        px, py = P(r - 2.0 + 0.08 * i, f - 1.6)
        box(px, py, 0.46 * i, size, size * 0.85, 0.46, c, rot=math.pi / 4 + 0.2 * i)
        box(px, py, 0.46 * i + 0.455, 0.07, size * 0.86, 0.02, WOOD_D, rot=math.pi / 4 + 0.2 * i)  # twine across the top
    anchor("Post", (r, f - 2.5), (r + 1.9, f + 0.2))


# ---------- Vault: a stone treasury with a gold dome ----------
def vault(r, f):
    pid = prop()
    cx, cy = P(r, f)
    box(cx, cy, 0, 3.4, 3.4, 0.5, STONE_D, pid)
    box(cx, cy, 0.5, 3.0, 3.0, 1.7, STONE, pid)
    for k in range(3):  # block courses
        box(cx, cy - 1.51, 0.85 + k * 0.5, 3.0, 0.04, 0.05, STONE_D, pid)
        box(cx + 1.51, cy, 0.85 + k * 0.5, 0.04, 3.0, 0.05, STONE_D, pid)
    box(cx, cy, 2.2, 3.4, 3.4, 0.3, "#B8402F", pid)  # red tile band under the roof
    # A four-sided gold roof the size of the Post's. The right face is a darker gold, so the pitch reads.
    h, z0, z1 = 1.77, 2.5, 3.9
    A, B, C, D, T = (cx - h, cy - h, z0), (cx + h, cy - h, z0), (cx + h, cy + h, z0), (cx - h, cy + h, z0), (cx, cy, z1)
    for face, color in (((A, B, T), GOLD), ((B, C, T), "#EDAC2A"), ((C, D, T), GOLD), ((D, A, T), GOLD)):
        tri(list(face), color, pid)
    cyl(cx, cy, 3.75, 0.1, 0.5, GOLD, pid, verts=6)
    ball(cx, cy, 4.35, 0.18, FIRE2, pid)
    box(cx - 0.3, cy - 1.53, 0.5, 0.9, 0.12, 1.25, "#5A4630", pid)  # door, -y face
    box(cx - 0.3, cy - 1.56, 1.05, 0.25, 0.06, 0.25, GOLD, pid)
    for dx in (-0.6, -0.3, 0.0):  # iron bars over the door
        box(cx + dx, cy - 1.6, 0.5, 0.08, 0.06, 1.25, "#3B3F55", pid)
    box(cx - 0.3, cy - 1.6, 1.25, 0.9, 0.06, 0.08, "#3B3F55", pid)
    for dx in (-0.95, 0.35):  # torches by the door
        cyl(cx + dx, cy - 1.6, 1.0, 0.07, 0.5, WOOD_D, pid, verts=6)
        ball(cx + dx, cy - 1.6, 1.6, 0.13, FIRE, pid)
    # Coin piles, and an open chest heaped with gold out front: big enough to say "money" without the plate.
    for i in range(3):
        x, y = P(r + 1.7 + 0.45 * i, f - 1.9 + 0.3 * i)
        for k in range(6 - 2 * i):
            cyl(x, y, 0.12 * k, 0.3 - 0.035 * k, 0.12, GOLD, verts=10)
    cid = prop()
    cx2, cy2 = P(r - 2.0, f - 1.5)
    box(cx2, cy2, 0, 1.0, 0.68, 0.55, WOOD, cid, rot=math.pi / 4)
    for dr in (-0.32, 0.32):  # gold bands
        bx, by = P(r - 2.0 + dr, f - 1.5)
        box(bx, by, 0, 0.1, 0.7, 0.57, GOLD, cid, rot=math.pi / 4)
    ball(cx2, cy2, 0.55, 0.42, GOLD, cid, sub=2, squash=0.55)  # the heap of coins
    lx, ly = P(r - 2.0, f - 1.5 + 0.36)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(lx, ly, 0.85), rotation=(math.radians(-18), 0, math.pi / 4))
    lid = bpy.context.object
    lid.scale = (1.0, 0.1, 0.6)
    put(lid, WOOD_D, cid)  # the lid, thrown back
    for (dr, df, z) in [(-0.15, -0.05, 0.78), (0.18, 0.08, 0.74)]:  # glints on the gold
        ball(*P(r - 2.0 + dr, f - 1.5 + df), z, 0.07, GLOW, cid)
    anchor("Vault", (r, f - 2.6), (r - 1.4, f - 1.6))


# ---------- Shop: a market stall by the dock ----------
def shop(r, f):
    pid = prop()
    cx, cy = P(r, f)
    box(cx, cy, 0, 2.6, 1.6, 0.9, WOOD, pid)  # counter
    box(cx, cy, 0.9, 2.75, 1.75, 0.12, WOOD_D, pid)
    for dx in (-1.25, 1.25):
        for dy in (-0.75, 0.75):
            box(cx + dx, cy + dy, 0, 0.14, 0.14, 2.3, WOOD_D, pid)
    for i in range(6):  # striped awning
        x = cx - 1.45 + i * 0.58
        box(x + 0.29, cy, 2.3, 0.58, 2.2, 0.16, PINK if i % 2 == 0 else "#FFFFFF", pid)
    for i, c in enumerate([RED, GOLD, "#7FD04A", BLUE]):  # goods
        box(cx - 0.9 + i * 0.6, cy - 0.2, 1.02, 0.42, 0.42, 0.32, c, pid)
    box(cx, cy - 0.85, 1.6, 1.3, 0.08, 0.45, PLASTER, pid)  # sign
    anchor("Shop", (r, f - 1.6), (r + 1.6, f - 0.6))


scout(-4.1, ROW1)
studio(4.1, ROW1)
post(-4.2, ROW2)
vault(4.2, ROW2)
_before = set(bpy.data.objects.keys())
shop(0.0, SHOP_F)
SHOP = set(bpy.data.objects.keys()) - _before


# ---------- dock and boats ----------
for i in range(8):
    x, y = P(2.4, -8.0 - i * 0.6)
    box(x, y, 0.12, 1.4, 0.5, 0.1, WOOD, rot=math.pi / 4)
for i in (0, 4, 7):
    for side in (-0.7, 0.7):
        x, y = P(2.4 + side, -8.0 - i * 0.6)
        box(x, y, -0.2, 0.16, 0.16, 0.65, WOOD_D)


def boat(r, f, sail):
    pid = prop()
    x, y = P(r, f)
    box(x, y, 0.0, 2.4, 0.9, 0.38, WOOD, pid, rot=math.pi / 4)
    box(x, y, 0.38, 2.6, 1.0, 0.1, WOOD_D, pid, rot=math.pi / 4)
    cyl(x, y, 0.4, 0.06, 2.0, WOOD_D, pid, verts=6)
    ux, uy = P(r + 0.9, f)
    tri([(x, y, 2.35), (x, y, 0.65), (ux, uy, 0.75)], sail, pid)


boat(-4.0, -12.4, "#FFFFFF")
boat(5.6, -13.6, "#FFE8B0")

# ---------- campfire at the heart of the camp ----------
fx, fy = P(0, CAMP_F)
for k in range(9):
    t = k * 2 * math.pi / 9
    ball(fx + 0.75 * math.cos(t), fy + 0.75 * math.sin(t), 0.08, 0.2, STONE_D, squash=0.7)
for a in (0.3, 1.4, 2.5):
    box(fx, fy, 0.05, 1.1, 0.18, 0.18, WOOD_D, rot=a)
cone(fx, fy, 0.15, 0.42, 0.95, FIRE, verts=5, glow=True, rot=0.2)
cone(fx, fy, 0.18, 0.24, 0.65, FIRE2, verts=5, glow=True, rot=0.9)
for k in range(3):  # log seats
    t = 0.6 + k * 2.1
    cyl(fx + 1.6 * math.cos(t), fy + 1.6 * math.sin(t), 0, 0.22, 0.32, WOOD, verts=8)
anchor("Camp", (0, CAMP_F - 1.0), (0, CAMP_F))


# ---------- trees, bushes, rocks, flowers ----------
def tree(r, f, size=1.0):
    pid = prop()
    x, y = P(r, f)
    cyl(x, y, 0, 0.18 * size, 1.0 * size, TRUNK, pid, verts=6)
    for (dx, dy, dz, rr, c) in [(0, 0, 1.4, 0.95, LEAF), (0.35, -0.3, 1.05, 0.65, LEAF_L), (-0.3, 0.3, 1.9, 0.6, LEAF_D)]:
        ball(x + dx * size, y + dy * size, dz * size, rr * size, c, pid)


def pine(r, f, size=1.0):
    pid = prop()
    x, y = P(r, f)
    cyl(x, y, 0, 0.14 * size, 0.6 * size, TRUNK, pid, verts=6)
    for k, (rr, c) in enumerate([(0.95, LEAF_D), (0.72, LEAF), (0.48, LEAF_L)]):
        cone(x, y, (0.5 + k * 0.6) * size, rr * size, 1.0 * size, c, pid, verts=7, rot=0.3 * k)


for (r, f, s) in [(-7.4, 11.5, 1.1), (-5.6, 13.0, 1.0), (7.3, 11.8, 1.15), (5.4, 13.4, 1.0), (-7.6, 3.6, 1.0),
                  (7.5, 3.8, 0.95), (-7.3, -3.6, 1.0), (7.4, -3.2, 1.05), (-2.6, 13.6, 0.9), (2.7, 13.2, 0.85)]:
    tree(r, f, s)
def palm(r, f, lean=0.4):
    pid = prop()
    x, y = P(r, f)
    tx, ty, z = x, y, 0.0
    for k in range(7):  # a curved trunk of stacked rings
        cyl(tx, ty, z, 0.23 - 0.012 * k, 0.42, TRUNK if k % 2 else "#93602F", pid, verts=6)
        tx += lean * 0.12
        ty -= lean * 0.05
        z += 0.4
    # Eight fronds, each folded along its spine: a lit top half and a dark underside, so they read as leaves.
    for a in range(8):
        t = a * math.pi / 4 + 0.2
        c, sn = math.cos(t), math.sin(t)
        base = (tx, ty, z + 0.15)
        tip = (tx + 1.7 * c, ty + 1.7 * sn, z - 0.7)
        mx, my, mz = tx + 0.85 * c, ty + 0.85 * sn, z + 0.2
        tri([base, (mx - 0.34 * sn, my + 0.34 * c, mz + 0.05), tip], LEAF_L if a % 2 else LEAF, pid)
        tri([base, tip, (mx + 0.34 * sn, my - 0.34 * c, mz - 0.15)], LEAF_D, pid)
    ball(tx, ty, z - 0.05, 0.24, "#8A5A2B", pid)


palm(-7.6, -8.0, 0.5)
palm(6.4, -8.4, -0.4)
palm(-5.0, -8.9, 0.2)


for (r, f, s) in [(-8.2, 7.6, 1.0), (8.2, 7.8, 1.0), (-1.9, 11.0, 0.8), (2.2, 10.6, 0.75), (-8.0, -0.6, 0.9),
                  (8.1, 0.4, 0.9), (0.0, 14.6, 1.0), (-4.2, 14.8, 0.9), (4.4, 15.0, 0.9)]:
    pine(r, f, s)
for (r, f) in [(-2.2, 4.8), (2.4, 5.2), (-6.4, -2.6), (6.6, -2.2), (-2.6, -2.8), (2.6, -3.0), (-5.6, -6.4), (5.4, -6.0)]:
    ball(*P(r, f), 0.15, 0.5, random.choice([LEAF, LEAF_L]), squash=0.75)
for (r, f) in [(-3.4, -7.2), (6.8, -7.4), (-7.0, 9.4), (1.6, 12.2)]:
    ball(*P(r, f), 0.1, 0.35, STONE, squash=0.6)


def clear(r, f):
    for (br, bf, rad) in [(-4.1, ROW1, 2.6), (4.1, ROW1, 2.6), (-4.2, ROW2, 2.4), (4.2, ROW2, 2.6), (0, SHOP_F, 2.0), (0, CAMP_F, 2.0)]:
        if math.hypot(r - br, f - bf) < rad:
            return False
    return abs(r) > 1.1 and abs(f - ROW1) > 0.8 and abs(f - ROW2) > 0.8 and f > -7.2


n = 0
while n < 70:
    r, f = random.uniform(-8.5, 8.5), random.uniform(-7, 13)
    if clear(r, f):
        x, y = P(r, f)
        box(x, y, 0, 0.14, 0.14, 0.12, random.choice(["#FFFFFF", "#FFE15A", "#FF6F8A", "#B88CFF", GRASS_D, GRASS_D]))
        n += 1

# Fences along the top path and lanterns down the road.
for i in range(7):
    x, y = P(-6.6 + i * 0.75, ROW1 + 1.1)
    box(x, y, 0, 0.14, 0.14, 0.55, WOOD)
x0, y0 = P(-6.6, ROW1 + 1.1)
x1, y1 = P(-2.1, ROW1 + 1.1)
box((x0 + x1) / 2, (y0 + y1) / 2, 0.35, math.hypot(x1 - x0, y1 - y0), 0.08, 0.08, WOOD_D, rot=math.pi / 4)
for f in (ROW1 + 2.6, CAMP_F - 1.6, SHOP_F + 2.0):
    for side in (-1.25, 1.25):
        x, y = P(side, f)
        cyl(x, y, 0, 0.07, 1.1, WOOD_D, verts=6)
        box(x, y, 1.1, 0.26, 0.26, 0.28, GLOW, glow=True)

# ---------- detail: road edges, cobbles, window boxes, banners, a well, flower beds ----------
# Drawn last with their own random stream, so everything above lands exactly where it did before.
rng = random.Random(23)
ROAD_EDGE, ROAD_LIGHT = "#B98A50", "#EDD29C"
COBBLES = ["#D2A465", "#F2DCAA", "#F2DCAA"]  # warm tans close to the road, so they read as wear rather than grit


def edge_runs(lo, hi, gaps):
    """The parts of [lo, hi] outside each (centre, half width) gap, so an edge line stops where another road crosses."""
    cuts = sorted((c - w, c + w) for c, w in gaps)
    runs, at = [], lo
    for a, b in cuts:
        if a > at:
            runs.append((at, a))
        at = max(at, b)
    if at < hi:
        runs.append((at, hi))
    return runs


# Darker edges down the main road and along both cross roads.
for side in (-0.78, 0.78):
    for f0, f1 in edge_runs(-7.5, 16, [(ROW1, 0.66), (ROW2, 0.66)]):
        strip(side, f0, side, f1, 0.2, ROAD_EDGE, z=0.03)
for row in (ROW1, ROW2):
    for side in (-0.58, 0.58):
        for r0, r1 in edge_runs(-6.2, 6.2, [(0, 0.86)]):
            strip(r0, row + side, r1, row + side, 0.18, ROAD_EDGE, z=0.03)
# Worn cobbles in the road, kept off the campfire and the dock.
for _ in range(60):
    r, f = rng.uniform(-0.6, 0.6), rng.uniform(-7.8, 15.5)
    if abs(f - CAMP_F) < 1.4:
        continue
    x, y = P(r, f)
    box(x, y, 0.03, 0.3, 0.2, 0.012, rng.choice(COBBLES), pid=0, rot=math.pi / 4, ground=True)


def banner(r, f, cloth, trim):
    """A pole with a hanging cloth in the building's colour, so each one reads as its own team's."""
    pid = prop()
    x, y = P(r, f)
    cyl(x, y, 0, 0.07, 2.4, WOOD_D, pid, verts=6)
    ball(x, y, 2.45, 0.1, GOLD, pid)
    box(x + 0.25, y - 0.25, 2.2, 0.7, 0.06, 0.08, WOOD_D, pid, rot=math.pi / 4)
    box(x + 0.25, y - 0.25, 1.0, 0.65, 0.05, 1.2, cloth, pid, rot=math.pi / 4)
    box(x + 0.25, y - 0.25, 1.0, 0.67, 0.04, 0.14, trim, pid, rot=math.pi / 4)
    box(x + 0.25, y - 0.25, 1.95, 0.67, 0.04, 0.12, trim, pid, rot=math.pi / 4)


banner(-6.4, ROW1 - 0.6, TEAL, "#FFFFFF")
banner(6.5, ROW1 - 1.0, ORANGE, GOLD)
banner(-6.5, ROW2 - 0.9, BLUE, "#FFFFFF")
banner(6.6, ROW2 - 1.2, GOLD, "#B8402F")


# A stone well on the grass between the Scout and the Post.
def well(r, f):
    pid = prop()
    x, y = P(r, f)
    cyl(x, y, 0, 0.55, 0.55, STONE, pid, verts=10)
    cyl(x, y, 0.5, 0.42, 0.06, "#2B6FB8", pid, verts=10)
    for dx in (-0.45, 0.45):
        box(x + dx * 0.7, y - dx * 0.7, 0.5, 0.1, 0.1, 1.0, WOOD_D, pid)
    cone(x, y, 1.45, 0.75, 0.5, "#B8402F", pid)
    cyl(x + 0.1, y - 0.1, 0.9, 0.12, 0.2, WOOD, pid, verts=6)


well(-6.0, 4.4)


# Flower beds along the road between the lanterns: a few blooms on a darker green bed.
def bed(r, f, n=9):
    x, y = P(r, f)
    box(x, y, 0.0, 1.1, 0.6, 0.03, LEAF, pid=0, rot=math.pi / 4, ground=True)
    for _ in range(n):
        bx, by = P(r + rng.uniform(-0.45, 0.45), f + rng.uniform(-0.22, 0.22))
        box(bx, by, 0.03, 0.2, 0.2, 0.06, rng.choice([PINK, GOLD, RED, "#FFFFFF", "#B88CFF"]), pid=0, ground=True)


for (r, f) in [(-1.6, ROW1 + 1.6), (1.6, ROW1 + 1.8), (-1.7, CAMP_F + 2.0), (1.8, CAMP_F + 2.2), (-1.6, ROW2 - 1.6),
               (1.7, ROW2 - 1.9), (-1.6, ROW2 + 1.4), (1.7, ROW2 + 1.3)]:
    bed(r, f)

# The two lawns either side of the bottom road get a fence along the beach, a signpost and scattered flowers. They have
# their own random stream, so nothing drawn above moves. The bottom of the road stays clear for the Shop's layer.
rng2 = random.Random(31)
FENCE_F = -5.9


def fence(r0, r1):
    pid = prop()
    n = int(round((r1 - r0) / 0.55))
    for i in range(n + 1):
        x, y = P(r0 + (r1 - r0) * i / n, FENCE_F)
        box(x, y, 0, 0.14, 0.14, 0.62, WOOD, pid)
    for z in (0.22, 0.46):
        x, y = P((r0 + r1) / 2, FENCE_F)
        box(x, y, z, r1 - r0, 0.07, 0.08, WOOD_D, pid, rot=math.pi / 4)


def signpost(r, f):
    pid = prop()
    x, y = P(r, f)
    box(x, y, 0, 0.13, 0.13, 1.35, WOOD_D, pid)
    box(x + 0.12, y + 0.12, 1.05, 0.8, 0.06, 0.22, WOOD, pid, rot=math.pi / 4)
    box(x + 0.1, y - 0.1, 0.72, 0.7, 0.06, 0.2, WOOD, pid, rot=-math.pi / 4)


fence(-4.4, -2.4)
fence(2.7, 4.9)
signpost(-2.8, -3.4)
for (lo, hi) in ((-4.5, -2.3), (2.6, 5.2)):
    for _ in range(9):
        r, f = rng2.uniform(lo, hi), rng2.uniform(-5.4, -3.0)
        x, y = P(r, f)
        c = rng2.choice([PINK, GOLD, "#FFFFFF", "#B88CFF", RED])
        box(x, y, 0.01, 0.18, 0.18, 0.05, c, pid=0, ground=True)
        if rng2.random() < 0.6:
            x2, y2 = P(r + 0.2, f - 0.12)
            box(x2, y2, 0.01, 0.18, 0.18, 0.05, c, pid=0, ground=True)

# ---------- light, camera, render ----------
sun_data = bpy.data.lights.new("sun", "SUN")
sun_data.energy = 1.6
sun_data.angle = 0.0
sun = bpy.data.objects.new("sun", sun_data)
bpy.context.collection.objects.link(sun)
sun.rotation_euler = Vector((0.5, 0.35, -0.78)).to_track_quat('-Z', 'Y').to_euler()

world = bpy.data.worlds.new("sky")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = lin("#BFE3FF")
world.node_tree.nodes["Background"].inputs[1].default_value = 0.35
scene.world = world

cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.sensor_fit = "HORIZONTAL"
cam_data.ortho_scale = 17.2
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.collection.objects.link(cam)
elev = math.radians(40)
cam.rotation_euler = (math.pi / 2 - elev, 0, math.pi / 4)
fwd = Vector((-math.cos(elev) * math.sin(math.pi / 4), math.cos(elev) * math.cos(math.pi / 4), -math.sin(elev)))
tx, ty = P(0, 0.6)
cam.location = Vector((tx, ty, 1.2)) - fwd * 60
cam_data.clip_end = 200
scene.camera = cam

r = scene.render
r.engine = "BLENDER_EEVEE"
r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, 100
r.filter_size = 0.0
r.dither_intensity = 0.0
r.film_transparent = False
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGB"
scene.eevee.taa_render_samples = 1
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"



def shoot(name, shop_only):
    """Render the village without the Shop, or the Shop alone on a clear background. The app raises the Shop on the
    first sale, so it has to be its own layer."""
    for o in scene.objects:
        if o.type == "MESH":
            o.hide_render = (o.name in SHOP) != shop_only
    r.film_transparent = shop_only
    r.image_settings.color_mode = "RGBA" if shop_only else "RGB"
    r.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)


shoot("color.png", False)
shoot("shop_color.png", True)

# Second pass: every prop in one flat color, ground in black, so pixelate.py can outline props.
palette = {}
for o in scene.objects:
    if o.type != "MESH":
        continue
    pid = ROLE.get(o.name, 0)
    if o.name in GROUND or pid == 0:
        hexs = "#000000"
    else:
        if pid not in palette:
            palette[pid] = "#%02X%02X%02X" % (40 + (pid * 53) % 200, 40 + (pid * 97) % 200, 40 + (pid * 151) % 200)
        hexs = palette[pid]
    m = bpy.data.materials.new(f"id-{pid}")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = lin(hexs)
    nt.links.new(emit.outputs[0], out.inputs[0])
    o.data.materials.clear()
    o.data.materials.append(m)
shoot("id.png", False)
shoot("shop_id.png", True)

# Where labels and doors land on screen, 0..1 from the top left.
def screen(rf, z=0.0):
    x, y = P(*rf)
    v = world_to_camera_view(scene, cam, Vector((x, y, z)))
    return [round(v.x, 4), round(1 - v.y, 4)]


# Spots on the roads where agents stand and turn. The roads run straight across and down the screen.
SPOTS = {"scout": (-2.0, ROW1 - 0.5), "studio": (1.6, ROW1 - 0.5), "director": (2.4, ROW1 - 1.6), "post": (-1.8, ROW2 - 0.4),
         "vault": (1.9, ROW2 - 0.6),
         "x7": (0.0, ROW1), "x0": (0.0, ROW2), "campHi": (0.95, CAMP_F + 1.3), "campLo": (0.95, CAMP_F - 1.3),
         "shop": (-2.2, SHOP_F + 0.1), "shopVia": (-1.9, ROW2 - 2.0)}
json.dump({"buildings": {k: {"label": screen(a["label"]), "door": screen(a["door"])} for k, a in ANCHORS.items()},
           "spots": {k: screen(v) for k, v in SPOTS.items()}},
          open(os.path.join(OUT, "anchors.json"), "w"), indent=1)
print("rendered", OUT)
