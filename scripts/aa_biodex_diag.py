"""One-off diagnostic #3: full mesh dump + GPU readPixels at marker NDC positions."""
import time
from playwright.sync_api import sync_playwright

JS = """
() => {
  const d = window.__bmDebug;
  if (!d) return { ready: false };
  const { camera, gl, scene } = d;
  const out = { ready: true, meshes: [] };
  scene.traverse((o) => {
    if (o.isMesh) {
      const m = o.material;
      const e = o.matrixWorld.elements;
      out.meshes.push({
        geo: o.geometry && o.geometry.type,
        wx: +e[12].toFixed(3), wy: +e[13].toFixed(3), wz: +e[14].toFixed(3),
        transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite, depthTest: m.depthTest,
        color: "#" + m.color.getHexString(),
        emissive: m.emissive ? "#" + m.emissive.getHexString() : null,
        ei: m.emissiveIntensity != null ? m.emissiveIntensity : null,
        vis: o.visible, parentVis: o.parent ? o.parent.visible : null,
        count: o.geometry && o.geometry.index ? o.geometry.index.count : null,
      });
    }
  });
  const NDC = { brain: { x: 0.5, y: 0.859 }, lungs: { x: 0.487, y: 0.709 }, heart: { x: 0.507, y: 0.745 } };
  const w = gl.domElement.width, h = gl.domElement.height;
  gl.render(scene, camera); // fresh frame in this same JS tick so the buffer is readable
  const gl_render_ctx = gl.getContext();
  const px = {};
  const buf = new Uint8Array(4);
  for (const [k, v] of Object.entries(NDC)) {
    const cx = Math.floor(v.x * w), cy = Math.floor((1 - v.y) * h);
    // read a small neighborhood, report the max-brightness pixel
    let best = null;
    for (let dy = -6; dy <= 6; dy += 3) for (let dx = -6; dx <= 6; dx += 3) {
      gl_render_ctx.readPixels(cx + dx, cy + dy, 1, 1, gl_render_ctx.RGBA, gl_render_ctx.UNSIGNED_BYTE, buf);
      const s = buf[0] + buf[1] + buf[2];
      if (!best || s > best.s) best = { s, r: buf[0], g: buf[1], b: buf[2], a: buf[3] };
    }
    px[k] = { at: [cx, cy], bufSize: [w, h], best };
  }
  out.pixels = px;
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    pg.goto("http://localhost:3000", wait_until="load")
    pg.wait_for_function("() => window.__aa && window.__aa.getState().phase === 'MAIN_MENU'", timeout=60000)
    pg.evaluate("window.__aa.getState().setSettings({motionReduced: true})")
    pg.evaluate("window.__aa.getState().setUiOverlay('JOURNAL')")
    for _ in range(90):
        if pg.evaluate("!!window.__bmDebug"):
            break
        time.sleep(0.5)
    time.sleep(3)
    info = pg.evaluate(JS)
    for m in info["meshes"]:
        print(m)
    print(json.dumps(info["pixels"], indent=1))
    b.close()
