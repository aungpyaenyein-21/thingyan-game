"""ဆိုင်အိမ် ၁ လုံး (၄ ဘက်လုံး ဆိုင်းဘုတ်) → art/shop.glb   ·   camlab.html က GLTFLoader နဲ့ ဖတ်

Run:   blender -b -P art/building.py
  or   python art/building.py          (pip install bpy — Blender ကို module အဖြစ်; Python 3.11)

ဆိုင်းဘုတ် စာ — Blender ရဲ့ text object က ဗမာစာ ပေါင်းစပ်ပုံ (shaping) မမှန်လို့ browser မှာ ဆွဲထားတဲ့
art/signs/sign-*.png ကို texture အဖြစ် ကပ်တာ (art/signs.html နဲ့ ထုတ်)။

တိုင်းတာ — 1 unit = 1 m (ဂိမ်းထဲ chibi ကလေး ~1.1)။ အောက်ခြေ အလယ် = origin။ မျက်နှာစာ = Blender -Y = three +Z။
Material — Principled BSDF (base colour + roughness) ပဲ သုံး → glTF metallicRoughness အဖြစ် တိုက်ရိုက် ထွက်။
"""
import math
import os

import bpy
import bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "shop.glb")
SIGNS = os.path.join(HERE, "signs")

W, D, H = 3.2, 3.0, 2.5          # walls: width (x), depth (y), height
ROOF_H, EAVE = 0.9, 0.35         # gable rise, overhang
SIGN_W, SIGN_H, SIGN_Z = 2.5, 0.78, 2.05


def hexcol(h, a=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]  # Blender colours are linear
    return (*lin, a)


_mats = {}


def mat(name, colour=None, image=None, rough=0.9):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = 0.0
    if colour:
        bsdf.inputs["Base Color"].default_value = hexcol(colour)
    if image:
        tex = m.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(image)
        m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    _mats[name] = m
    return m


def box(name, size, loc, material, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    return o


def sign(side, loc, rot_z):
    """a board with the PNG on its outward face (plane UVs 0..1 map the whole image)"""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=(math.pi / 2, 0, rot_z))
    o = bpy.context.active_object
    o.name = f"sign-{side}"
    o.scale = (SIGN_W, SIGN_H, 1)
    bpy.ops.object.transform_apply(scale=True, rotation=False)
    o.data.materials.append(mat(f"sign-{side}", image=os.path.join(SIGNS, f"sign-{side}.png"), rough=0.7))
    # wooden frame behind the board
    fx = -math.sin(rot_z) * 0.04
    fy = math.cos(rot_z) * 0.04
    box(f"frame-{side}", (SIGN_W + 0.12, 0.05, SIGN_H + 0.12), (loc[0] + fx, loc[1] + fy, loc[2]), mat("wood", "#6b4a33"), rot=(0, 0, rot_z))
    return o


def gable_roof():
    """two zinc slopes over the long side, red-painted like the ward's shophouses"""
    bm = bmesh.new()
    x, y, z0, z1 = W / 2 + EAVE, D / 2 + EAVE, H, H + ROOF_H
    v = [bm.verts.new(p) for p in [(-x, -y, z0 - 0.15), (x, -y, z0 - 0.15), (x, 0, z1), (-x, 0, z1),
                                   (-x, y, z0 - 0.15), (x, y, z0 - 0.15)]]
    bm.faces.new([v[0], v[1], v[2], v[3]])
    bm.faces.new([v[3], v[2], v[5], v[4]])
    me = bpy.data.meshes.new("roof")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("roof", me)
    bpy.context.collection.objects.link(o)
    me.materials.append(mat("zinc", "#b8463a", rough=0.6))
    sol = o.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.06
    # gable ends (triangles) in wall colour
    bm = bmesh.new()
    for s in (-1, 1):
        a, b, c = (s * W / 2, -D / 2, H), (s * W / 2, D / 2, H), (s * W / 2, 0, H + ROOF_H - 0.12)
        bm.faces.new([bm.verts.new(a), bm.verts.new(b), bm.verts.new(c)])
    me2 = bpy.data.meshes.new("gables")
    bm.to_mesh(me2)
    bm.free()
    g = bpy.data.objects.new("gables", me2)
    bpy.context.collection.objects.link(g)
    me2.materials.append(mat("wall", "#f3dcc0"))
    g.modifiers.new("thick", "SOLIDIFY").thickness = 0.08
    return o


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    wall, trim, dark = mat("wall", "#f3dcc0"), mat("trim", "#3f7a5a"), mat("dark", "#4a3428")

    box("walls", (W, D, H), (0, 0, H / 2), wall)
    box("plinth", (W + 0.12, D + 0.12, 0.18), (0, 0, 0.09), mat("plinth", "#a99a8a"))
    # front: open shop counter (dark recess) + a striped awning
    box("opening", (W * 0.72, 0.06, 1.45), (0, -D / 2 - 0.01, 0.95), dark)
    box("counter", (W * 0.74, 0.35, 0.8), (0, -D / 2 - 0.15, 0.4), mat("counter", "#c98b55"))
    for i in range(6):
        box(f"awning-{i}", (W / 6, 0.75, 0.04), (-W / 2 + W / 12 + i * W / 6, -D / 2 - 0.36, 1.68), mat("awnA" if i % 2 else "awnB", "#fff6ea" if i % 2 else "#e0574f"), rot=(-0.35, 0, 0))
    # sides and back: windows with green shutters
    for sx in (-1, 1):
        box(f"window-{sx}", (0.06, 0.9, 0.8), (sx * (W / 2 + 0.01), 0.3, 1.1), dark)
        for k in (-1, 1):
            box(f"shutter-{sx}-{k}", (0.05, 0.42, 0.85), (sx * (W / 2 + 0.04), 0.3 + k * 0.67, 1.1), trim)
    box("back-door", (0.9, 0.06, 1.7), (0.6, D / 2 + 0.01, 0.85), trim)
    gable_roof()
    # four signs, one per side, just under the eaves
    off = 0.06
    sign("front", (0, -D / 2 - off, SIGN_Z), 0)
    sign("back", (0, D / 2 + off, SIGN_Z), math.pi)
    sign("right", (W / 2 + off, 0, SIGN_Z), math.pi / 2)
    sign("left", (-W / 2 - off, 0, SIGN_Z), -math.pi / 2)

    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    build()
