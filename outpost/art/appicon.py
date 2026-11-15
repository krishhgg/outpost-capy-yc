# Renders the app icon's scene in Blender: the Studio on a small sand and grass island, lit like the Base village.
# Just the house, a tree and two bushes: anything smaller turns to noise at home-screen size.
# Run: blender -b -P outpost/art/appicon.py -- <out dir>
# Writes color.png (the lit island on a clear background) and id.png (one flat color per prop, for outlines).
# appicon_png.py turns those into the icon and the splash image.
import ast
import math
import os
import random

# The village script builds its scene as it runs, so take only what the icon needs from it: everything above the
# village ground (palette, materials, shape helpers) and the Studio, window and tree builders.
VILLAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "village.py")
src = open(VILLAGE).read()
g = {"__name__": "village", "__file__": VILLAGE}
exec(compile(src[:src.index("# ---------- ground ----------")], VILLAGE, "exec"), g)
for node in ast.parse(src).body:
    if isinstance(node, ast.FunctionDef) and node.name in ("anchor", "window", "studio", "tree"):
        exec(compile(ast.Module([node], type_ignores=[]), VILLAGE, "exec"), g)
g["ANCHORS"] = {}
bpy, Vector, P, OUT = g["bpy"], g["Vector"], g["P"], g["OUT"]
cyl, ball, lin, scene = g["cyl"], g["ball"], g["lin"], g["scene"]
SIZE = 64  # art pixels a side; appicon_png.py scales each one up 16 times for the 1024 px icon
random.seed(5)

# ---------- island ----------
# Sand under grass, both ground so no outline runs between them. appicon_png.py outlines the island's edge.
cx, cy = P(0, 0)
cyl(cx, cy, -0.4, 4.05, 0.4, g["SAND"], pid=0, verts=40)
cyl(cx, cy, -0.35, 3.45, 0.4, g["GRASS"], pid=0, verts=40)
for o in list(bpy.data.objects):
    g["GROUND"].add(o.name)
g["studio"](0.45, 0.75)
g["tree"](-2.75, 1.0, 0.8)
for (r, f) in [(1.9, -2.2), (-2.6, -0.4)]:
    ball(*P(r, f), 0.12, 0.42, random.choice([g["LEAF"], g["LEAF_L"]]), squash=0.75)

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
cam_data.ortho_scale = 10.2
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.collection.objects.link(cam)
elev = math.radians(40)
cam.rotation_euler = (math.pi / 2 - elev, 0, math.pi / 4)
fwd = Vector((-math.cos(elev) * math.sin(math.pi / 4), math.cos(elev) * math.cos(math.pi / 4), -math.sin(elev)))
tx, ty = P(0, 0.3)
cam.location = Vector((tx, ty, 1.5)) - fwd * 60
cam_data.clip_end = 200
scene.camera = cam

r = scene.render
r.engine = "BLENDER_EEVEE"
r.resolution_x = r.resolution_y = SIZE
r.resolution_percentage = 100
r.filter_size = 0.0
r.dither_intensity = 0.0
r.film_transparent = True
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
scene.eevee.taa_render_samples = 1
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
r.filepath = os.path.join(OUT, "color.png")
bpy.ops.render.render(write_still=True)

# Second pass: every prop in one flat color, ground in black, so the pixel step can outline props.
palette = {}
for o in scene.objects:
    if o.type != "MESH":
        continue
    pid = g["ROLE"].get(o.name, 0)
    if o.name in g["GROUND"] or pid == 0:
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
r.filepath = os.path.join(OUT, "id.png")
bpy.ops.render.render(write_still=True)
print("rendered", OUT)
