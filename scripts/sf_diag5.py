#!/usr/bin/env python3
"""diag5: replicate Sketchfab's WebGL check step-by-step in their embed page."""
import json, os
from playwright.sync_api import sync_playwright

OUT = "/home/z/my-project/scripts/sf_rip/capture"
SHADERS_JS = open("/home/z/my-project/scripts/sf_shaders.js").read()

STEALTH = """(() => {
if (window.__sfPatched) return;
window.__sfPatched = true;
try {
Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
window.chrome = {runtime: {}};
const FAKE_GPU = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti (0x2489), NVIDIA GeForce RTX 3060 Ti, 31.0.15.3623)';
function wrapProto(proto) {
  if (!proto) return;
  const orig = proto.getParameter;
  proto.getParameter = function(p) {
    if (p === 0x9245 || p === 0x1F01) return FAKE_GPU;
    return orig.call(this, p);
  };
}
wrapProto(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
wrapProto(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
const origGet = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, attrs) {
  const ctx = origGet.call(this, type, attrs);
  if (ctx && /webgl/i.test(String(type))) return ctx;
  return ctx;
};
if (window.OffscreenCanvas) {
  const origOff = OffscreenCanvas.prototype.getContext;
  OffscreenCanvas.prototype.getContext = function(type, attrs) {
    return origOff.call(this, type, attrs);
  };
}
} catch (e) { window.__sfPatchErr = String(e); }
})();"""

CHECK = """() => {
  const out = {};
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', {antialias: false});
    out.ctxOk = !!gl;
    if (!gl) return out;
    out.maxVarying = gl.getParameter(gl.MAX_VARYING_VECTORS);
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    out.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '(no dbg ext)';
    // their test shaders (array injected as window.__sfShaders)
    const shaders = window.__sfShaders;
    out.nShaders = shaders.length;
    out.shaders = [];
    for (const s of shaders) {
      const sh = gl.createShader(gl[s.type]);
      gl.shaderSource(sh, s.text);
      gl.compileShader(sh);
      const ok = gl.getShaderParameter(sh, gl.COMPILE_STATUS);
      out.shaders.push({type: s.type, ok: ok, log: ok ? '' : String(gl.getShaderInfoLog(sh)).slice(0, 300)});
    }
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  } catch (e) { out.err = String(e); }
  return out;
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=[
        '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        '--no-sandbox', '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'])
    ctx = browser.new_context(
        user_agent=('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                    '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'),
        viewport={'width': 1400, 'height': 900}, locale='en-US')
    ctx.add_init_script(STEALTH)
    page = ctx.new_page()
    page.goto(f'https://sketchfab.com/models/22e53200b774420eb55c54c29fd6cd1c/embed?autostart=1&preload=1&ui_stop=0&ui_hint=0&ui_infos=0&ui_watermark=0&dnt=1',
              timeout=90000, wait_until='domcontentloaded')
    page.wait_for_timeout(3000)
    page.evaluate(f'window.__sfShaders = (function(){{ {SHADERS_JS} return a; }})()')
    res = page.evaluate(CHECK)
    print(json.dumps(res, indent=1))
    # also check their global verdict + confirm our wrapper is what THEIR canvas saw
    verdict = page.evaluate("""() => ({
      g: String(window.sketchfabWebGLSupport),
      probe: (() => { const c=document.createElement('canvas');
        const g=c.getContext('webgl',{antialias:false});
        const d=g.getExtension('WEBGL_debug_renderer_info');
        return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'nodbg'; })()
    })""")
    print('verdict:', json.dumps(verdict))
    browser.close()
