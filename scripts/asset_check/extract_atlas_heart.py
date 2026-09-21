"""Extract per-structure meshes from human-atlas (BodyParts3D 4.0, CC BY 4.0) binary chunks."""
import json, os, struct, sys
import numpy as np

ATLAS = "/home/z/tmp-assework/atlas/public/models"
ATLAS = "/home/z/tmp-assetwork/atlas/public/models"

def load_manifest():
    with open(os.path.join(ATLAS, "atlas.json")) as f:
        return json.load(f)

_cache = {}
def chunk_bin(chunk):
    if chunk not in _cache:
        with open(os.path.join(ATLAS, f"body-{chunk}.bin"), "rb") as f:
            _cache[chunk] = f.read()
    return _cache[chunk]

def build_mesh(manifest, part_ids, name="mesh"):
    pm = {p["id"]: p for p in manifest["parts"]}
    missing = [i for i in part_ids if i not in pm]
    if missing:
        print(f"  WARN missing ids: {missing[:5]}")
    verts, faces, off = [], [], 0
    for pid in part_ids:
        p = pm.get(pid)
        if not p:
            continue
        data = chunk_bin(p["chunk"])
        n = p["vertexCount"]
        pos = np.frombuffer(data, dtype="<f4", count=n * 3, offset=p["positions"]).reshape(n, 3).copy()
        ic = p["indexCount"]
        idx = np.frombuffer(data, dtype="<u4", count=ic, offset=p["indices"]).copy()
        verts.append(pos)
        faces.append(idx.reshape(-1, 3) + off)
        off += n
    V = np.vstack(verts)
    F = np.vstack(faces)
    print(f"  {name}: parts={len(part_ids)} verts={len(V)} tris={len(F)}")
    return V, F

if __name__ == "__main__":
    import trimesh
    m = load_manifest()
    pm = {p["id"]: p for p in m["parts"]}
    concepts = {c["id"]: c for c in m["concepts"]}

    def el(concept_id):
        return concepts[concept_id]["elements"]

    out = "/home/z/my-project/public/models"
    os.makedirs(out, exist_ok=True)

    def export(v, f, path, target=None, center=True):
        mesh = trimesh.Trimesh(vertices=v, faces=f, process=True)
        if center:
            mesh.apply_translation(-(mesh.bounds[0] + mesh.bounds[1]) / 2.0)
        tris = len(mesh.faces)
        if target and tris > target:
            try:
                import fast_simplification
                print(f"  simplify {path} {tris} -> {target}")
                pts, fc = fast_simplification.simplify(mesh.vertices.astype(np.float32), mesh.faces.astype(np.int64), target_count=target)
                mesh = trimesh.Trimesh(vertices=pts, faces=fc, process=True)
            except Exception as e:
                print("  SIMPLIFY FAILED:", e)
        mesh.export(path)
        r = trimesh.load(path)
        if isinstance(r, trimesh.Scene):
            r = r.to_mesh()
        print(f"  EXPORTED {path}: tris={len(r.faces)} verts={len(r.vertices)} ext={r.extents.round(4)} file={os.path.getsize(path)}B")
        return mesh

    print("== HERO HEART (FMA7088 heart + aortic root + pulmonary trunk + SVC)")
    heart_ids = el("FMA7088")
    # great vessel stubs for silhouette
    extra = [p["id"] for p in m["parts"] if p["name"] in ("Ascending aorta", "Pulmonary trunk", "Superior vena cava")]
    print("  vessel stubs:", [(i, pm[i]["name"]) for i in extra])
    v, f = build_mesh(m, heart_ids + extra, "heart")
    export(v, f, f"{out}/heart_hero.glb", target=80000)

    print("== CORONARY ARTERY tree (FMA49893)")
    v, f = build_mesh(m, el("FMA49893"), "coronary")
    export(v, f, f"{out}/coronary_artery.glb", target=30000)

    print("== BODY (all 2234 parts, decimated)")
    v, f = build_mesh(m, [p["id"] for p in m["parts"]], "body")
    export(v, f, f"{out}/body_silhouette.glb", target=30000)
