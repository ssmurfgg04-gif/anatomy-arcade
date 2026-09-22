#!/usr/bin/env python3
"""Sketchfab capture v7: full GL trace (bufferData + vertexAttribPointer + draws)
plus JSON.parse scene graph + CDN textures. Everything needed to rebuild a GLB offline."""
import json, os, re, base64, hashlib
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

UID = "22e53200b774420eb55c54c29fd6cd1c"
OUT = "/home/z/my-project/scripts/sf_rip/capture"
os.makedirs(OUT, exist_ok=True)

manifest = {"uid": UID, "responses": {}}
texcount = [0]
TEX_URL_RE = re.compile(r'/textures/', re.I)


def save_manifest():
    try:
        with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
            json.dump(manifest, f, indent=1)
    except Exception:
        pass


def on_response(resp):
    url = resp.url
    try:
        ct = resp.headers.get('content-type', '')
        if ct.startswith('image/') and TEX_URL_RE.search(url):
            body = resp.body()
            base = os.path.basename(urlparse(url).path)
            h = hashlib.md5(url.encode()).hexdigest()[:8]
            fn = f"tex__{base}" if base else f"tex__{h}.bin"
            p = os.path.join(OUT, fn)
            if not os.path.exists(p):
                with open(p, 'wb') as f:
                    f.write(body)
                texcount[0] += 1
            manifest['responses'][url] = {"size": len(body), "file": fn}
            save_manifest()
    except Exception:
        pass


HOOKS = r"""(() => {
if (window.__capReady) return;
window.__capReady = true;
window.__capJson = [];
window.__capBuf = [];
window.__capDraws = [];
window.__capShaders = [];
window.__capUniforms = [];
window.__capTL = [];
window.__bufSeq = 0;
window.__idSeq = 1;
const _ids = new WeakMap();
function oid(o, kind) {
  if (!o) return 0;
  if (!_ids.has(o)) _ids.set(o, window.__idSeq++);
  return (kind||'') + _ids.get(o);
}
const curBuf = {34962: 0, 34963: 0, 34964: 0};
let curProg = 0;
const progAttribs = {};
const progUniforms = {};
const attribState = {};
const enabled = {};

const origJP = JSON.parse;
JSON.parse = function(text, reviver) {
  const r = origJP.call(this, text, reviver);
  try {
    if (r && typeof r === 'object' && window.__capJson.length < 20) {
      const s = JSON.stringify(r);
      if (s.length > 4000 && s.indexOf('osg.Geometry') !== -1) {
        window.__capJson.push({len: s.length, s: s});
      }
    }
  } catch (e) {}
  return r;
};

function hook(P) {
  if (!P) return;
  const pr = P.prototype;

  const obd = pr.bufferData;
  pr.bufferData = function(target, src, usage) {
    try {
      if (src && (src instanceof ArrayBuffer || ArrayBuffer.isView(src)) && window.__capBuf.length < 900) {
        const u8 = src instanceof ArrayBuffer ? new Uint8Array(src)
          : new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
        if (u8.length >= 16) {
          let s = '';
          const CH = 0x8000;
          for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
          window.__capBuf.push({seq: window.__bufSeq++, id: curBuf[target] || oid(this, 'C'), target: String(target), len: u8.length, b64: btoa(s)});
          if (window.__capTL.length < 120000) window.__capTL.push(['bd', String(target), curBuf[target], u8.length]);
        }
      }
    } catch (e) {}
    return obd.call(this, target, src, usage);
  };

  const obb = pr.bindBuffer;
  pr.bindBuffer = function(target, buf) {
    try {
      curBuf[target] = oid(buf, 'B');
      if (window.__capTL.length < 120000) window.__capTL.push(['b', String(target), curBuf[target]]);
    } catch (e) {}
    return obb.call(this, target, buf);
  };

  const ovap = pr.vertexAttribPointer;
  pr.vertexAttribPointer = function(index, size, type, normalized, stride, offset) {
    try { attribState[index] = {buf: curBuf[34962], size, type, normalized: !!normalized, stride, offset}; } catch (e) {}
    return ovap.call(this, index, size, type, normalized, stride, offset);
  };

  const oeva = pr.enableVertexAttribArray;
  pr.enableVertexAttribArray = function(i) { try { enabled[i] = true; } catch (e) {} return oeva.call(this, i); };
  const odva = pr.disableVertexAttribArray;
  pr.disableVertexAttribArray = function(i) { try { delete enabled[i]; } catch (e) {} return odva.call(this, i); };

  const oup = pr.useProgram;
  pr.useProgram = function(prog) {
    try { curProg = oid(prog, 'P'); } catch (e) {}
    return oup.call(this, prog);
  };

  const locNames = new Map();
  const progShaders = {};

  const oas = pr.attachShader;
  if (oas) pr.attachShader = function(prog, shader) {
    try {
      const pid = oid(prog, 'P');
      const sid = oid(shader, 'S');
      if (!progShaders[pid]) progShaders[pid] = [];
      if (progShaders[pid].indexOf(sid) === -1) progShaders[pid].push(sid);
      window.__progShaders = progShaders;
    } catch (e) {}
    return oas.call(this, prog, shader);
  };

  const oss = pr.shaderSource;
  pr.shaderSource = function(shader, src) {
    try {
      if (typeof src === 'string') {
        const sid = oid(shader, 'S');
        window.__shaderSrc = window.__shaderSrc || {};
        window.__shaderSrc[sid] = src;
        if (window.__capShaders.length < 80) window.__capShaders.push({sid: sid, src: src});
      }
    } catch (e) {}
    return oss.call(this, shader, src);
  };

const ogul = pr.getUniformLocation;
  pr.getUniformLocation = function(prog, name) {
    try {
      const loc = ogul.call(this, prog, name);
      if (loc) locNames.set(loc, {p: oid(prog, 'P'), n: String(name)});
      return loc;
    } catch (e) { return ogul.call(this, prog, name); }
  };

  ['uniform1i', 'uniform1iv', 'uniform1f', 'uniform2f', 'uniform3f', 'uniform4f',
   'uniform1fv', 'uniform2fv', 'uniform3fv', 'uniform4fv', 'uniformMatrix4fv'].forEach(fn => {
    const o = pr[fn];
    if (!o) return;
    pr[fn] = function(loc) {
      try {
        if (window.__capTL.length < 120000) {
          const info = locNames.get(loc);
          const name = info ? info.n : ('uloc?');
          const pid = info ? info.p : curProg;
          const args = [];
          for (let k = 1; k < arguments.length; k++) args.push(arguments[k]);
          const vals = (typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null)
            ? Array.from(args[args.length - 1]).slice(0, 16) : args.slice(-4);
          window.__capTL.push(['u', fn, pid, name, vals]);
        }
      } catch (e) {}
      return o.apply(this, arguments);
    };
  });

  const ogal = pr.getAttribLocation;
  pr.getAttribLocation = function(prog, name) {
    try {
      const pid = oid(prog, 'P');
      const loc = ogal.call(this, prog, name);
      if (loc >= 0) {
        if (!progAttribs[pid]) progAttribs[pid] = {};
        progAttribs[pid][String(loc)] = name;
      }
      return loc;
    } catch (e) { return ogal.call(this, prog, name); }
  };

  function snapshotAttribs() {
    const snap = {};
    for (const i in enabled) {
      const st = attribState[i];
      if (!st) continue;
      const name = (progAttribs[curProg] && progAttribs[curProg][String(i)]) || ('loc' + i);
      snap[name] = st;
    }
    return snap;
  }

  const ode = pr.drawElements;
  pr.drawElements = function(mode, count, type, offset) {
    try {
      if (window.__capTL.length < 120000)
        window.__capTL.push(['d', String(mode), count, String(type), offset, curBuf[34963], curProg, snapshotAttribs()]);
    } catch (e) {}
    return ode.call(this, mode, count, type, offset);
  };

  const oda = pr.drawArrays;
  pr.drawArrays = function(mode, first, count) {
    try {
      if (window.__capTL.length < 120000)
        window.__capTL.push(['da', String(mode), first, count, curBuf[34962], curProg, snapshotAttribs()]);
    } catch (e) {}
    return oda.call(this, mode, first, count);
  };

  const omde = pr.multiDrawElements;
  if (omde) pr.multiDrawElements = function(mode, counts, type, offsets) {
    try {
      for (let k = 0; k < counts.length && window.__capDraws.length < 4000; k++)
        window.__capDraws.push({m: String(mode), c: counts[k], t: String(type), o: offsets[k],
                                eb: curBuf[34963], prog: curProg, a: snapshotAttribs()});
    } catch (e) {}
    return omde.call(this, mode, counts, type, offsets);
  };
}
hook(window.WebGLRenderingContext);
hook(window.WebGL2RenderingContext);
console.warn('[cap] v7 hooks installed');
})();"""


def pull(page):
    n_json = page.evaluate('window.__capJson.length')
    n_sh = page.evaluate('window.__capShaders.length')
    n_tl = page.evaluate('window.__capTL.length')
    print(f'[pull] shaders={n_sh} timeline={n_tl}', flush=True)
    shaders = page.evaluate('window.__capShaders')
    prog_shaders = page.evaluate('window.__progShaders || {}')
    shader_src = page.evaluate('window.__shaderSrc || {}')
    with open(os.path.join(OUT, 'shaders.json'), 'w') as f:
        json.dump({'shaders': shaders, 'progShaders': prog_shaders, 'shaderSrc': shader_src}, f)
    tl = page.evaluate('window.__capTL')
    with open(os.path.join(OUT, 'timeline.json'), 'w') as f:
        json.dump(tl, f)
    print(f'[pull] timeline entries: {len(tl)}', flush=True)
    n_buf = page.evaluate('window.__capBuf.length')
    n_draws = page.evaluate('window.__capDraws.length')
    print(f'[pull] graphs={n_json} bufs={n_buf} draws={n_draws}', flush=True)
    for i in range(n_json):
        item = page.evaluate(f'window.__capJson[{i}]')
        with open(os.path.join(OUT, f'graph_{i}.json'), 'w') as f:
            f.write(item['s'])
    # pulls in chunks to keep evaluate payloads sane
    bufs = page.evaluate('(function(){ const out=[]; for (let i=0;i<window.__capBuf.length;i++) out.push({seq:window.__capBuf[i].seq, id:window.__capBuf[i].id, target:window.__capBuf[i].target, len:window.__capBuf[i].len}); return out; })()')
    for meta in bufs:
        b64 = page.evaluate(f'window.__capBuf[{meta["seq"]}].b64')
        data = base64.b64decode(b64)
        with open(os.path.join(OUT, f'buffer_{meta["seq"]:03d}_{meta["id"]}_{meta["len"]}.bin'), 'wb') as f:
            f.write(data)
    with open(os.path.join(OUT, 'draws.json'), 'w') as f:
        json.dump(page.evaluate('window.__capDraws'), f)
    print('[pull] done', flush=True)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=[
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
            '--no-sandbox', '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled'])
        ctx = browser.new_context(
            user_agent=('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                        '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'),
            viewport={'width': 1400, 'height': 900}, locale='en-US')
        ctx.add_init_script("(() => { window.sketchfabWebGLSupport = true; })()")
        page = ctx.new_page()
        page.add_init_script(HOOKS)
        page.on('response', on_response)
        page.goto((f'https://sketchfab.com/models/{UID}/embed?autostart=1&preload=1'
                   f'&ui_stop=0&ui_hint=0&ui_infos=0&ui_watermark=0&ui_theme=dark&transparent=0&dnt=1'),
                  timeout=90000, wait_until='domcontentloaded')
        print('[nav] loaded', flush=True)
        elapsed = 0
        stable = 0
        last = (-1, -1)
        while elapsed < 160:
            page.wait_for_timeout(5000)
            elapsed += 5
            try:
                nb = page.evaluate('window.__capBuf.length')
                nd = page.evaluate('window.__capDraws.length')
                nt = len(manifest['responses'])
                print(f'[t={elapsed}s] bufs={nb} draws={nd} tex={nt}', flush=True)
                if (nb, nd) == last:
                    stable += 5
                    if stable >= 20 and nb > 50 and nt >= 20:
                        break
                else:
                    stable = 0
                last = (nb, nd)
            except Exception:
                pass
        try:
            page.screenshot(path=os.path.join(OUT, 'v7_final.png'))
        except Exception:
            pass
        pull(page)
        save_manifest()
        browser.close()


if __name__ == '__main__':
    main()
