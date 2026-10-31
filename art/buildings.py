"""T2 · ရပ်ကွက် (yangon) hero အဆောက်အအုံ ၃ ခု → art/home.glb · art/teashop.glb · art/stalls.glb
yangon/set.js က code နဲ့ ဆောက်ထားတဲ့ ပုံ (stand-in) ကို အရင်ပြ၊ ဒီ .glb ရောက်မှ world.js hero() က လဲ (await မလုပ်)

Run:   blender -b -P art/buildings.py            or   python art/buildings.py   (pip install bpy — Python 3.11)
ဆိုင်းဘုတ် စာ = art/signs/sign-*.png (art/signs.html — Blender text က ဗမာစာ မပေါင်းနိုင်လို့)

ဘောင် — 1 unit = 1 m · origin = set.js ထဲက ဒီအဆောက်အအုံ နေရာ (ground ပေါ်) · Blender −Y = three +Z (ရှေ့)
အရွယ် — set.js ရဲ့ stand-in နဲ့ အတိအကျ တူအောင် (solid() collision မပြောင်းရ)
"""
import math
import os
import sys

import bpy
import bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import building  # noqa: E402  (camlab shop: hexcol / mat / box helpers)
from building import box, hexcol  # noqa: E402

SIGNS = os.path.join(HERE, "signs")
PAL = dict(cream="#f4e6c8", mint="#bfd9c4", pink="#f1c2b8", ochre="#e2b45a", teal="#8fb5b0", brick="#c8553d", zinc="#7a6a5a",
           window="#5b6c9a", frame="#fff7ea", plank="#a8744a", dark="#3b2a24", wood="#8a5a3a", rust="#9a4a3a")


def m(name, colour=None, image=None, rough=.9):
    return building.mat(name, colour, image, rough)


def board(name, w, h, loc, facing):
    """a sign board with its PNG, facing one of '+x' '-x' '+y' '-y' (Blender axes)"""
    rz = {"-y": 0, "+y": math.pi, "+x": math.pi / 2, "-x": -math.pi / 2}[facing]
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=(math.pi / 2, 0, rz))
    o = bpy.context.active_object
    o.name = f"sign-{name}-{facing}"
    o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True, rotation=False)
    o.data.materials.append(m(f"sign-{name}", image=os.path.join(SIGNS, f"sign-{name}.png"), rough=.7))
    return o


def prism(name, length, half_depth, z0, rise, material, overhang=0.0):
    """a gable roof: two slopes, ridge along X"""
    bm = bmesh.new()
    x, y = length / 2, half_depth + overhang
    v = [bm.verts.new(p) for p in [(-x, -y, z0), (x, -y, z0), (x, 0, z0 + rise), (-x, 0, z0 + rise), (-x, y, z0), (x, y, z0)]]
    bm.faces.new([v[0], v[1], v[2], v[3]])
    bm.faces.new([v[3], v[2], v[5], v[4]])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    o.modifiers.new("thick", "SOLIDIFY").thickness = .06
    return o


def gable_ends(name, length, half_depth, z0, rise, material):
    bm = bmesh.new()
    for s in (-1, 1):
        bm.faces.new([bm.verts.new((s * length / 2, -half_depth, z0)), bm.verts.new((s * length / 2, half_depth, z0)), bm.verts.new((s * length / 2, 0, z0 + rise))])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    o.modifiers.new("thick", "SOLIDIFY").thickness = .08


def windows_round(w, d, z, every=1.5, size=(.5, .5), skip_front=False, shutters=None):
    """plain windows on all four walls of a w × d block at height z (front = −Y)"""
    win, fr = m("window", PAL["window"]), m("frame", PAL["frame"])
    for face, n, length in (("-y", max(1, round(w / every)), w), ("+y", max(1, round(w / every)), w), ("-x", max(1, round(d / every)), d), ("+x", max(1, round(d / every)), d)):
        if face == "-y" and skip_front:
            continue
        for i in range(n):
            t = -length / 2 + (i + .5) * length / n
            if face in ("-y", "+y"):
                y = -d / 2 - .03 if face == "-y" else d / 2 + .03
                box(f"win{face}{i}{z}", (size[0], .05, size[1]), (t, y, z), win)
                box(f"sill{face}{i}{z}", (size[0] + .12, .1, .06), (t, y * 1.01, z - size[1] / 2 - .03), fr)
                if shutters:
                    for s in (-1, 1):
                        box(f"sh{face}{i}{z}{s}", (size[0] * .5, .05, size[1]), (t + s * size[0] * .78, y, z), shutters)
            else:
                x = -w / 2 - .03 if face == "-x" else w / 2 + .03
                box(f"win{face}{i}{z}", (.05, size[0], size[1]), (x, t, z), win)
                box(f"sill{face}{i}{z}", (.1, size[0] + .12, .06), (x * 1.01, t, z - size[1] / 2 - .03), fr)


# ---------------------------------------------------------------- ① home: two-storey timber house, zinc gable, porch (set.js X 5.6, Z −6.5)
def home():
    W_, D_ = 5.2, 3.2
    box("ground", (W_, D_, 1.4), (0, 0, .02 + .7), m("wall", PAL["cream"]))
    box("skirt", (W_ + .02, D_ + .02, .5), (0, 0, .02 + .25), m("skirt", PAL["teal"]))
    box("upper", (5.5, 3.5, 1.3), (0, 0, 2.08), m("plank", PAL["plank"]))
    for k in range(6):  # plank seams
        z = 1.5 + k * .21
        for y in (-1.76, 1.76):
            box(f"seam{k}{y}", (5.52, .02, .025), (0, y, z), m("seam", "#7a5038"))
    prism("roof", 6.0, 2.0, 2.73, 1.05, m("zinc", PAL["rust"], rough=.6), overhang=.15)
    gable_ends("gables", 5.5, 1.75, 2.73, .95, m("plank", PAL["plank"]))
    dark = m("dark", PAL["dark"])
    box("door", (.9, .07, 1.05), (-1.2, -1.63, .14 + .52), dark)
    box("door-frame", (1.0, .06, 1.15), (-1.2, -1.62, .14 + .57), m("doorframe", "#6b4a32"))
    teal, tan = m("shutter-teal", PAL["teal"]), m("shutter-tan", "#d9b98f")
    for wx in (.6, 1.8):
        box(f"gwin{wx}", (.6, .06, .55), (wx, -1.63, .55 + .27), dark)
        for s in (-1, 1):
            box(f"gsh{wx}{s}", (.3, .05, .55), (wx + s * .48, -1.68, .55 + .27), teal)
    for wx in (-1.6, 0, 1.6):
        box(f"uwin{wx}", (.7, .06, .6), (wx, -1.78, 1.82 + .3), dark)
        for s in (-1, 1):
            box(f"ush{wx}{s}", (.34, .05, .6), (wx + s * .53, -1.82, 1.82 + .3), tan)
    windows_round(W_, D_, .9, every=1.6, size=(.5, .5), skip_front=True)          # the other three walls, ground floor
    windows_round(5.5, 3.5, 2.12, every=1.6, size=(.55, .55), skip_front=True, shutters=tan)  # and upstairs
    wood = m("wood", PAL["wood"])
    box("porch", (5.2, .9, .3), (0, -2.05, .02 + .15), wood)
    box("step", (1.2, .4, .14), (-1.2, -2.65, .02 + .07), wood)
    for x in (-2.5, 2.5):
        box(f"post{x}", (.1, .1, 1.35), (x, -2.42, .32 + .67), wood)
    box("porch-beam", (5.2, .12, .1), (0, -2.42, 1.42), wood)
    box("bench", (1.4, .36, .38), (1.4, -1.95, .3 + .19), m("bench", "#7a5038"))
    board("home-no", .9, .3, (.2, -1.66, 1.1), "-y")
    box("pipe", (.08, .08, 2.7), (2.5, 1.62, 1.37), m("pipe", "#8f8794"))


# ---------------------------------------------------------------- ③ the big tea shop: the shell only (tables stay code-built) — set.js cx 6.1, cz 33
def teashop():
    w, d, H = 7.4, 5.6, 2.7
    wall, green = m("wall", "#f3ead8"), m("green", "#7fae9a")
    # walls on the west (−X) and the south (three +Z = Blender −Y); open to the market (Blender +Y) and the street (+X)
    box("south", (w, .2, H), (0, -(d / 2 - .1), .02 + H / 2), wall)
    box("south-green", (w, .22, 1.0), (0, -(d / 2 - .1), .02 + .5), green)
    box("west", (.2, d, H), (-(w / 2 - .1), 0, .02 + H / 2), wall)
    box("west-green", (.22, d, 1.0), (-(w / 2 - .1), 0, .02 + .5), green)
    box("floor", (w - .4, d - .2, .06), (0, 0, .06), m("floor", "#9a948c"))
    dim = m("dim", "#4a3c3a")  # the dim inside beyond the front tables
    box("dim1", (w - 1.9, .06, 2.2), (-.75, d / 2 - 1.5, .08 + 1.1), dim)
    box("dim2", (.06, d - 1.6, 2.2), (w / 2 - 1.5, -.75, .08 + 1.1), dim)
    col = m("column", "#e9e1d2")
    for x in (-w / 2 + .2, -1.2, 1.2, w / 2 - .1):
        box(f"col-n{x}", (.16, .16, H), (x, d / 2 - .1, .02 + H / 2), col)
    for y in (0, -(d / 2 - .2)):
        box(f"col-e{y}", (.16, .16, H), (w / 2 - .1, y, .02 + H / 2), col)
    box("slab", (w + .3, d + .5, .14), (0, 0, H + .02 + .07), m("slab", "#bdb6ae"))
    prism("roof", w + .3, (d + .5) / 2, H + .16, d * .62 * .42, m("zinc", PAL["rust"], rough=.6))
    gable_ends("gables", w + .3, (d + .5) / 2, H + .16, d * .62 * .42, wall)
    windows_round(w, d, 1.6, every=1.8, size=(.6, .5), skip_front=True)  # (only the walled sides get any — the open ones are columns)
    for name, h, z in (("tea-name", .62, H - .2), ("tea-menu", .34, H - .72)):
        board(name, w - .2, h, (0, d / 2 + .02, z), "+y")          # market side
        board(name, d - .2, h, (w / 2 + .02, 0, z), "+x")          # street side
        board(name, w - .2, h, (0, -(d / 2 + .02), z), "-y")       # the back, over the lane


# ---------------------------------------------------------------- ③ mohinga + vegetable stalls side by side (set.js 9.4, 14.2 — the pot and tables stay code-built)
def stalls():
    wood, zinc = m("post", PAL["wood"]), m("zinc-grey", PAL["zinc"])
    for i, (x, name, roof) in enumerate(((-1.15, "mohinga", "#e0843f"), (1.15, "veg", "#4f8f5a"))):
        for px in (x - 1.1, x + 1.1):
            for py in (-.75, .75):
                box(f"post{i}{px}{py}", (.08, .08, 2.1), (px, py, .02 + 1.05), wood)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 2.18), rotation=(-.12, 0, 0))  # a sloped tin roof, painted
        r = bpy.context.active_object
        r.name = f"roof-{name}"
        r.scale = (2.35, 1.75, .05)
        bpy.ops.object.transform_apply(scale=True)
        r.data.materials.append(m(f"roof-{name}", roof, rough=.6))
        board(name, 1.6, .5, (x, .78, 1.7), "+y")    # facing the market (three −Z… the stand-in's sign faced +Z: keep both)
        board(name, 1.6, .5, (x, -.78, 1.7), "-y")
        box(f"valance{i}", (2.3, .04, .18), (x, -.86, 1.98), zinc)
    # the vegetable side: a slatted shelf at the back with baskets of greens, chillies, onions
    box("shelf", (2.0, .32, .06), (1.15, .62, .55), wood)
    for k, c in enumerate(("#6a9f58", "#86b96d", "#e0574f", "#7a4a9a", "#6a9f58", "#f2c14e")):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=.13, location=(.4 + k * .3, .62, .7), segments=10, ring_count=6)
        s = bpy.context.active_object
        s.scale = (1, .9, .6)
        s.data.materials.append(m(f"veg{k}", c))
        box(f"basket{k}", (.28, .28, .1), (.4 + k * .3, .62, .63), m("basket", "#c99a5b"))


def export(name, fn):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    building._mats.clear()  # the factory reset dropped the old materials
    fn()
    out = os.path.join(HERE, f"{name}.glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True)
    print("wrote", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    export("home", home)
    export("teashop", teashop)
    export("stalls", stalls)
