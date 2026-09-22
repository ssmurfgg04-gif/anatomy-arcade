#!/usr/bin/env python3
"""Rebuild a GLB from captured Sketchfab viewer data (timeline + buffers + scene graph)."""
import json, os, re, struct, struct as S, math, sys
import numpy as np

CAP = "/home/z/my-project/scripts/sf_rip/capture"
OUT = "/home/z/my-project/scripts/sf_rip"
UID = "22e53200b774420eb55c54c29fd6cd1c"
MEDIA = f"https://media.sketchfab.com/models/{UID}"

# ---------------------------------------------------------------- load capture
scene = json.load(open(f"{CAP}/graph_0.json"))
timeline = json.load(open(f"{CAP}/timeline.json"))
shdata = json.load(open(f"{CAP}/shaders.json"))
shader_src = shdata["shaderSrc"]          # sid -> src
prog_shaders = shdata["progShaders"]      # pid -> [sid]

buffers = {}                              # id -> bytes
for fn in os.listdir(CAP):
    m = re.match(r"buffer_\d+_([A-Za-z0-9]+)_(\d+)\.bin", fn)
    if m:
        buffers[m.group(1)] = open(f"{CAP}/{fn}", "rb").read()
print(f"buffers loaded: {len(buffers)}")

# ---------------------------------------------------------------- parse scene
def find_all(o, key, out=None):
    if out is None: out = []
    if isinstance(o, dict):
        for k, v in o.items():
            if k == key: out.append(v)
            find_all(v, key, out)
    elif isinstance(o, list):
        for v in o: find_all(v, key, out)
    return out

def ud_values(node):
    return {v["Name"]: v["Value"] for v in node.get("UserDataContainer", {}).get("Values", [])}

root = scene["osg.Node"]
matrices = find_all(root, "Matrix")
scene_geoms = []
def walk(node, parent_names):
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "osg.Geometry":
                scene_geoms.append((list(parent_names), v))
            elif k in ("osg.Node", "osg.MatrixTransform", "osg.Group"):
                name = v.get("Name", "")
                walk(v, parent_names + [name])
            else:
                walk(v, parent_names)
    elif isinstance(node, list):
        for v in node:
            walk(v, parent_names)
walk(root, [])
strip_geoms = []
for names, geo in scene_geoms:
    ps = geo.get("PrimitiveSetList", [])
    if not ps: continue
    prim = list(ps[0].values())[0]
    mode = prim.get("Mode", "")
    if "STRIP" not in mode and mode != "TRIANGLES":
        continue
    ss = geo.get("StateSet", {}).get("osg.StateSet", {})
    ud = ud_values(ss)
    texud = ud_values(geo)
    tal = ss.get("TextureAttributeList", [])
    tex_slots = {}
    for i, slot in enumerate(tal):
        if slot:
            t = slot[0].get("osg.Texture", {})
            tex_slots[str(i)] = t.get("File")
    mat = None
    for a in ss.get("AttributeList", []):
        if "osg.Material" in a:
            mat = a["osg.Material"]
    strip_geoms.append({
        "names": names, "mode": mode,
        "bbl": (float(texud["vtx_bbl_x"]), float(texud["vtx_bbl_y"]), float(texud["vtx_bbl_z"])),
        "material_ud": ud, "material": mat, "tex_slots": tex_slots,
    })
print(f"scene strip geometries: {len(strip_geoms)}")

# ---------------------------------------------------------------- program -> K
K_RE = re.compile(r"uQVS\s*(?P<op>[*/])\s*vec3\(([^)]+)\)\.(?P<swz>\w+)")
def program_K(pid):
    for sid in prog_shaders.get(str(pid), []):
        src = shader_src.get(sid, "")
        if "gl_Position" not in src:  # vertex shader only
            continue
        m = K_RE.search(src)
        if m:
            vals = [float(x.strip()) for x in m.group(2).split(",")]
            swz = m.group("swz")
            idx = {"x": 0, "y": 1, "z": 2}
            order = [idx[c] for c in swz[:3]]
            return (m.group("op"), [vals[i] for i in order])
    return None

# ---------------------------------------------------------------- replay timeline
# collect ALL quantized-looking draws, grouped by geometry translate (uQVT)
# uniforms are PER-PROGRAM state in WebGL -> track per program
state = {}                                 # pid -> {uQVS, uQVT, uQUV1}
prims = {}                                 # uQVT tuple -> [draw, ...]
for e in timeline:
    tag = e[0]
    if tag == "u":
        _, fn, pid, name, vals = e
        if name in ("uQVS", "uQVT", "uQUV1"):
            st = state.setdefault(pid, {})
            st[name] = (pid, vals)
    elif tag == "d":
        _, mode, count, typ, offset, eb, prog, attribs = e
        st = state.get(prog)
        if not st or "uQVT" not in st or "uQVS" not in st or "uQUV1" not in st:
            continue
        a = attribs
        if "Vertex" not in a or int(a["Vertex"]["type"]) != 5123:
            continue
        vkey = tuple(round(x, 3) for x in st["uQVT"][1][:3])
        prims.setdefault(vkey, []).append({
            "eb": eb, "prog": prog, "count": count, "type": int(typ),
            "attribs": a, "uQVS": st["uQVS"], "uQVT": st["uQVT"], "uQUV1": st["uQUV1"],
        })
# select best draw per geometry: richest attribute set (main PBR pass)
prims_best = {}
for vkey, lst in prims.items():
    def richness(d):
        return (len(d["attribs"]) + (2 if "TexCoord1" in d["attribs"] else 0)
                + (1 if "Normal" in d["attribs"] else 0) + (4 if "Tangent" in d["attribs"] else 0))
    best = max(lst, key=richness)
    if "TexCoord1" in best["attribs"] and best["uQVS"] and best["uQUV1"]:
        prims_best[vkey] = best
print(f"geometry keys seen: {len(prims)}, with main-pass draw: {len(prims_best)}")

# ---------------------------------------------------------------- match & dequant
def dequant_primitive(p):
    a = p["attribs"]
    # position
    vb = buffers[a["Vertex"]["buf"]]
    nv = len(vb) // 8
    V = np.frombuffer(vb, dtype="<u2").reshape(nv, 4).astype(np.float64) / 65535.0
    K = program_K(p["prog"])
    uQVS = np.array(p["uQVS"][1][:3], dtype=np.float64)
    if K is not None:
        op, kv = K
        scale = uQVS * np.array(kv) if op == "*" else uQVS / np.array(kv)
    else:
        scale = uQVS
    uQVT = np.array(p["uQVT"][1][:3], dtype=np.float64)
    pos = (V[:, :3] + V[:, 3:4]) * scale + uQVT
    # normals (octahedral, SNORM16)
    out = {"pos": pos, "normal": None, "uv": None, "idx": None, "nv": nv}
    if "Normal" in a and a["Normal"]["buf"] in buffers:
        nb = buffers[a["Normal"]["buf"]]
        nn = len(nb) // 4
        N = np.frombuffer(nb, dtype="<i2").reshape(nn, 2).astype(np.float64)
        N = np.maximum(N, -32767) / 32767.0
        z = N[:, 0] ** 2 + N[:, 1] ** 2
        nz = 1.0 - 2.0 * z
        r = np.sqrt(np.maximum(1.0 - z, 0.0))
        nrm = np.stack([2.0 * N[:, 0] * r, 2.0 * N[:, 1] * r, nz], axis=1)
        ln = np.linalg.norm(nrm, axis=1, keepdims=True)
        ln[ln == 0] = 1.0
        out["normal"] = nrm / ln
    # uv
    if "TexCoord1" in a and a["TexCoord1"]["buf"] in buffers:
        tb = buffers[a["TexCoord1"]["buf"]]
        nt = len(tb) // 4
        T = np.frombuffer(tb, dtype="<u2").reshape(nt, 2).astype(np.float64) / 65535.0
        if p["uQUV1"] is not None:
            q = p["uQUV1"][1]
            uv = T * np.array(q[2:4]) + np.array(q[0:2])
        else:
            uv = T
        out["uv"] = uv
    # indices
    if p["eb"] in buffers:
        ib = buffers[p["eb"]]
        esz = 2 if p["type"] == 5123 else (4 if p["type"] == 5125 else 1)
        cnt = len(ib) // esz
        if esz == 2:
            idx = np.frombuffer(ib, dtype="<u2").astype(np.uint32)
        elif esz == 4:
            idx = np.frombuffer(ib, dtype="<u4")
        else:
            idx = np.frombuffer(ib, dtype=np.uint8).astype(np.uint32)
        # strip -> list
        if p.get("strip", True) and cnt >= 3:
            i0 = idx[:-2]
            i1 = idx[1:-1]
            i2 = idx[2:]
            k = np.arange(len(i0))
            flip = (k % 2) == 1
            tri = np.stack([np.where(flip, i1, i0), np.where(flip, i0, i1), i2], axis=1)
            out["idx"] = tri.reshape(-1)
        else:
            out["idx"] = idx
    return out

matched = []
used_keys = set()
for gi, sg in enumerate(strip_geoms):
    p = None
    for vkey, cand in prims_best.items():
        if vkey in used_keys:
            continue
        if all(abs(a - b) < 1.1e-3 for a, b in zip(vkey, sg["bbl"])):
            if p is None or cand["count"] > p["count"]:
                p = cand
    if p is None:
        print(f"  geom {gi} ({sg['names'][-1] if sg['names'] else '?'}) unmatched")
        continue
    used_keys.add(tuple(round(x, 3) for x in p["uQVT"][1][:3]))
    p["strip"] = "STRIP" in sg["mode"]
    data = dequant_primitive(p)
    data["scene"] = sg
    data["p"] = p
    matched.append((gi, data))
    sg["matched"] = True
print(f"matched primitives: {len(matched)} (scene geoms without draw: {len(strip_geoms)-len(matched)})")

# ---------------------------------------------------------------- build GLB
import struct as _s

bin_chunks = []
def add_bin(data: bytes, align=4):
    off = sum(len(c) for c in bin_chunks)
    while off % align:
        bin_chunks.append(b"\x00")
        off += 1
    bin_chunks.append(data)
    return off

accessors = []
buffer_views = []
images = []
textures = []
materials = []
meshes = []
nodes = []

# map tex_uid -> captured real texture file (the optimized variant the viewer used)
manifest = json.load(open(f"{CAP}/manifest.json"))
texuid_map = {}
for url, info in manifest.get("responses", {}).items():
    m2 = re.search(r"/textures/([0-9a-f]{32})/", url)
    if m2 and os.path.getsize(f"{CAP}/{info['file']}") > 1024:
        texuid_map.setdefault(m2.group(1), f"{CAP}/{info['file']}")

import io as _io
def _noise_ratio(p):
    try:
        from PIL import Image
        import numpy as _np
        im = Image.open(p).convert('L')
        a = _np.asarray(im, dtype=_np.float32)
        if a.shape[0] < 8 or a.shape[1] < 8:
            return 0.0
        d1 = _np.abs(a[:, :-1] - a[:, 1:]).mean()
        dd = _np.abs(a[:-1, :-1] - a[1:, 1:]).mean()
        return dd / max(d1, 1e-6)
    except Exception:
        return 0.0

MAT_COLORS = {
    'WC_TEAM_WINDOWS': ([0.05, 0.05, 0.06, 1.0], 0.08, 0.0),
    'WC_TEAM_BODY2': ([0.055, 0.055, 0.06, 1.0], 0.4, 0.1),
    'GT3RS_INTERIOR': ([0.12, 0.12, 0.13, 1.0], 0.85, 0.0),
    'SEAT': ([0.04, 0.04, 0.045, 1.0], 0.9, 0.0),
    'STEERINGWHEEL': ([0.06, 0.06, 0.065, 1.0], 0.7, 0.0),
    'YKPOR300_WHEEL_STYLE3_PA': ([0.85, 0.85, 0.85, 1.0], 0.45, 0.1),
    'YKPOR300_WHEEL_STYLE3_FL': ([0.8, 0.8, 0.8, 1.0], 0.5, 0.1),
    'YKPOR300_WHEEL_STYLE3_TY': ([0.07, 0.07, 0.075, 1.0], 0.85, 0.0),
    'RIM_BLUR': ([0.5, 0.5, 0.52, 0.35], 0.6, 0.0),
    'INT_DECALS': ([0.3, 0.3, 0.31, 1.0], 0.7, 0.0),
    'INT_RETRO': ([0.02, 0.03, 0.02, 1.0], 0.3, 0.0),
}
def mat_override(name):
    n = name.upper()
    for pref, v in MAT_COLORS.items():
        if n.startswith(pref):
            return v
    return None

def _is_image(p):
    try:
        with open(p, "rb") as _f:
            m = _f.read(4)
        return m.startswith(b"\x89PNG") or m.startswith(b"\xff\xd8")
    except Exception:
        return False

tex_cache = {}
tex_noise = {}
def add_texture(file_path):
    if file_path in tex_cache:
        return tex_cache[file_path]
    tex_uid = file_path.split("/")[1] if "/" in file_path else ""
    fn = texuid_map.get(tex_uid)
    if not (fn and os.path.exists(fn) and _is_image(fn)):
        fn = f"{CAP}/tex__" + os.path.basename(file_path)
        if not (os.path.exists(fn) and _is_image(fn)):
            ver = "6bfb1f0821b74a3aa2c7a32eff74112e"
            url = f"{MEDIA}/{ver}/{file_path}"
            os.system(f'curl -s -m 60 "{url}" -o "{fn}"')
            if not (os.path.exists(fn) and _is_image(fn)):
                print("  !! missing texture:", file_path)
                return None
    nr = _noise_ratio(fn)
    if nr >= 1.6:
        print(f"  noisy texture dropped: {os.path.basename(file_path)} ratio={nr:.2f}")
        return None
    data = open(fn, "rb").read()
    bv = {"buffer": 0, "byteOffset": add_bin(data), "byteLength": len(data)}
    buffer_views.append(bv)
    bvidx = len(buffer_views) - 1
    with open(fn, "rb") as _f:
        magic2 = _f.read(4)
    mime = "image/png" if magic2.startswith(b"\x89PNG") else "image/jpeg"
    img_idx = len(images)
    images.append({"bufferView": bvidx, "mimeType": mime})
    tex_idx = len(textures)
    textures.append({"source": img_idx})
    tex_cache[file_path] = tex_idx
    return tex_idx

mat_cache = {}
def add_material(sg):
    ud = sg["material_ud"]
    key = ud.get("UniqueID", sg["names"][-1] if sg["names"] else "m")
    if key in mat_cache:
        return mat_cache[key]
    dc = json.loads(ud.get("DiffuseColor", "[1,1,1,1]"))
    df = float(ud.get("DiffuseFactor", "1"))
    ec = json.loads(ud.get("EmissiveColor", "[0,0,0]"))
    ef = float(ud.get("EmissiveFactor", "1"))
    m = {
        "name": sg["material"]["Name"] if sg["material"] else f"mat_{key}",
        "pbrMetallicRoughness": {
            "baseColorFactor": [dc[0]*df, dc[1]*df, dc[2]*df, dc[3]*df],
            "metallicFactor": float(ud.get("MetallicFactor", "0")),
            "roughnessFactor": float(ud.get("RoughnessFactor", "0.5")),
        },
        "emissiveFactor": [ec[0]*ef, ec[1]*ef, ec[2]*ef],
        "doubleSided": ud.get("doubleSided", "true") == "true",
    }
    am = ud.get("alphaMode", "OPAQUE")
    if am == "BLEND":
        m["alphaMode"] = "BLEND"
    elif am == "MASK":
        m["alphaMode"] = "MASK"
        m["alphaCutoff"] = float(ud.get("alphaCutoff", "0.5"))
    name_l = m["name"].upper()
    # Body shell: CDN livery atlas is corrupted-noise; use clean livery gold instead
    if name_l.startswith("WC_TEAM_BODY1_PA") or name_l.startswith("HGLOB"):
        m["pbrMetallicRoughness"]["baseColorFactor"] = [0.7412, 0.6392, 0.3255, 1.0]
        m["pbrMetallicRoughness"]["roughnessFactor"] = 0.35
    elif name_l.startswith(("GLOB", "HGLOW")):
        m["pbrMetallicRoughness"]["baseColorFactor"] = [0.05, 0.05, 0.05, 1.0]
        m["pbrMetallicRoughness"]["roughnessFactor"] = 0.8
    elif name_l.startswith("MIRROR"):
        m["pbrMetallicRoughness"]["baseColorFactor"] = [0.35, 0.35, 0.38, 1.0]
        m["pbrMetallicRoughness"]["metallicFactor"] = 0.9
        m["pbrMetallicRoughness"]["roughnessFactor"] = 0.25
    t = sg["tex_slots"].get(ud.get("sDiffuse", "1"))
    ov = mat_override(m["name"])
    if name_l.startswith(("WC_TEAM_BODY1_PA", "WC_TEAM_BODY1_FL", "HGLOB", "GLOB", "HGLOW")):
        if not name_l.startswith(("GLOB", "HGLOW")):
            m["pbrMetallicRoughness"]["baseColorFactor"] = [0.7412, 0.6392, 0.3255, 1.0]
            m["pbrMetallicRoughness"]["roughnessFactor"] = 0.35
        pass
    elif t:
        ti = add_texture(t)
        if ti is not None:
            m["pbrMetallicRoughness"]["baseColorTexture"] = {"index": ti}
        elif ov:
            m["pbrMetallicRoughness"]["baseColorFactor"] = ov[0]
            m["pbrMetallicRoughness"]["roughnessFactor"] = ov[1]
            m["pbrMetallicRoughness"]["metallicFactor"] = ov[2]
    elif ov:
        m["pbrMetallicRoughness"]["baseColorFactor"] = ov[0]
        m["pbrMetallicRoughness"]["roughnessFactor"] = ov[1]
        m["pbrMetallicRoughness"]["metallicFactor"] = ov[2]
    if m["name"].upper().startswith("RIM_BLUR"):
        m["alphaMode"] = "BLEND"
    if "sNormalMap" in ud and float(ud.get("NormalFactor", "1")) != 0:
        t = sg["tex_slots"].get(ud["sNormalMap"])
        if t:
            ti = add_texture(t)
            if ti is not None:
                m["normalTexture"] = {"index": ti, "scale": float(ud.get("NormalFactor", "1")) or 1.0}
    mat_cache[key] = len(materials)
    materials.append(m)
    return mat_cache[key]

total_verts = 0
total_tris = 0
for gi, data in sorted(matched):
    sg = data["scene"]
    pos = data["pos"].astype("<f4")
    if data["uv"] is None or data["idx"] is None or len(pos) == 0 or len(data["idx"]) == 0:
        print(f"  skipping primitive {gi} (missing uv/idx)")
        continue
    nv = len(pos)
    # accessors
    def add_acc(arr, comp, typ, count=None):
        b = arr.tobytes()
        off = add_bin(b)
        bv = {"buffer": 0, "byteOffset": off, "byteLength": len(b)}
        buffer_views.append(bv)
        acc = {"bufferView": len(buffer_views)-1, "componentType": comp, "count": count or len(arr),
               "type": typ}
        if typ == "VEC3" and comp == 5126 and arr.shape[1] == 3:
            mn = arr.min(axis=0); mx = arr.max(axis=0)
            acc["min"] = [float(x) for x in mn]
            acc["max"] = [float(x) for x in mx]
        accessors.append(acc)
        return len(accessors)-1
    pa = add_acc(pos, 5126, "VEC3")
    na = add_acc(data["normal"].astype("<f4"), 5126, "VEC3") if data["normal"] is not None else None
    uv = data["uv"].astype("<f4")
    ua = add_acc(uv, 5126, "VEC2")
    idx = data["idx"].astype("<u4")
    ia = add_acc(idx, 5125, "SCALAR")
    mat_idx = add_material(sg)
    prim = {"attributes": {"POSITION": pa, "TEXCOORD_0": ua}, "indices": ia, "material": mat_idx, "mode": 4}
    if na is not None:
        prim["attributes"]["NORMAL"] = na
    mesh = {"primitives": [prim], "name": (sg["material"]["Name"] if sg["material"] else f"mesh{gi}")}
    meshes.append(mesh)
    node = {"mesh": len(meshes)-1, "name": mesh["name"]}
    nodes.append(node)
    total_verts += nv
    total_tris += len(idx) // 3

# root node with osg transform (row-major -> column-major transpose)
root_node = {"name": "GLTF_SceneRootNode", "children": list(range(len(nodes)))}
if matrices:
    M = matrices[0]
    # use the osg array directly as glTF column-major (matches viewer GLSL semantics)
    if M != [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]:
        root_node["matrix"] = M

nodes.append(root_node)
scene_json = {
    "asset": {"version": "2.0", "generator": "sketchfab-viewer-capture"},
    "scene": 0,
    "scenes": [{"nodes": [len(nodes)-1]}],
    "nodes": nodes,
    "meshes": meshes,
    "materials": materials,
    "accessors": accessors,
    "bufferViews": buffer_views,
    "buffers": [{"byteLength": sum(len(c) for c in bin_chunks)}],
}
if images: scene_json["images"] = images
if textures: scene_json["textures"] = textures
if not scene_json["buffers"][0]["byteLength"]:
    scene_json["buffers"][0]["byteLength"] = 1

js = json.dumps(scene_json, separators=(",", ":")).encode()
pad = (4 - len(js) % 4) % 4
js += b" " * pad
bin_data = b"".join(bin_chunks)
bpad = (4 - len(bin_data) % 4) % 4
bin_data += b"\x00" * bpad
total = 12 + 8 + len(js) + 8 + len(bin_data)
glb = _s.pack("<III", 0x46546C67, 2, total)
glb += _s.pack("<II", len(js), 0x4E4F534A) + js
glb += _s.pack("<II", len(bin_data), 0x004E4942) + bin_data
out_path = f"{OUT}/porsche_996_gt300.glb"
open(out_path, "wb").write(glb)
print(f"GLB written: {out_path} ({len(glb)/1e6:.2f} MB)")
print(f"verts: {total_verts}, tris: {total_tris}, materials: {len(materials)}, textures: {len(textures)}")
