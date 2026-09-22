#!/usr/bin/env python3
"""Sketchfab capture v6: in-browser interception of decoded model data.
Hooks JSON.parse/TextDecoder (scene graph) + bufferData (geometry) + captures CDN textures."""
import json, os, re, base64, hashlib
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

UID = "22e53200b774420eb55c54c29fd6cd1c"
OUT = "/home/z/my-project/scripts/sf_rip/capture"
os.makedirs(OUT, exist_ok=True)

manifest = {"uid": UID, "responses": {}}
texcount = [0]

SKIP_SAVE_RE = re.compile(r'\.(js|css|mjs|html|woff2?|ttf|svg)(\?|$)', re.I)
TEX_URL_RE = re.compile(r'/textures/|/thumbnails/|/fallbacks/', re.I)


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
            fn = f"tex__{h}__{re.sub(r'[^A-Za-z0-9._-]', '_', base)[:120]}"
            with open(os.path.join(OUT, fn), 'wb') as f:
                f.write(body)
            texcount[0] += 1
            manifest['responses'][url] = {"size": len(body), "file": fn}
            if texcount[0] % 5 == 0:
                save_manifest()
            print(f"[tex] {len(body):>9d} {fn}", flush=True)
    except Exception:
        pass


HOOKS = """(() => {
if (window.__capReady) return;
window.__capReady = true;
window.__capJson = [];
window.__capBuf = [];
window.__bufSeq = 0;
window.__draws = 0;
window.__dec = [];

const origJP = JSON.parse;
JSON.parse = function(text, reviver) {
  const r = origJP.call(this, text, reviver);
  try {
    if (r && typeof r === 'object' && window.__capJson.length < 40) {
      const s = JSON.stringify(r);
      if (s.length > 4000 && (s.indexOf('osg') !== -1 || s.indexOf('VertexAttribute') !== -1 ||
          s.indexOf('StateSet') !== -1 || s.indexOf('PrimitiveSet') !== -1)) {
        window.__capJson.push({len: s.length, s: s});
        console.warn('[cap] JSON captured ' + s.length);
      }
    }
  } catch (e) {}
  return r;
};

try {
  const oDec = TextDecoder.prototype.decode;
  TextDecoder.prototype.decode = function(buf) {
    const r = oDec.call(this, buf);
    try {
      if (r && r.length > 4000 && r.indexOf('{') !== -1 && window.__dec.length < 20) {
        window.__dec.push({len: r.length, s: r});
        console.warn('[cap] TextDecoder captured ' + r.length);
      }
    } catch (e) {}
    return r;
  };
} catch (e) {}

function hookBuf(proto) {
  if (!proto || !proto.bufferData) return;
  const orig = proto.bufferData;
  proto.bufferData = function(target, src, usage) {
    try {
      if (src && (src instanceof ArrayBuffer || ArrayBuffer.isView(src)) && window.__capBuf.length < 300) {
        const u8 = src instanceof ArrayBuffer ? new Uint8Array(src)
          : new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
        if (u8.length > 128) {
          let s = '';
          const CH = 0x8000;
          for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
          window.__capBuf.push({seq: window.__bufSeq++, target: String(target), len: u8.length, b64: btoa(s)});
        }
      }
    } catch (e) {}
    return orig.call(this, target, src, usage);
  };
}
hookBuf(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
hookBuf(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);

[window.WebGLRenderingContext, window.WebGL2RenderingContext].forEach(P => {
  if (!P) return;
  ['drawElements', 'drawArrays'].forEach(fn => {
    const o = P.prototype[fn];
    if (!o) return;
    P.prototype[fn] = function() { window.__draws++; return o.apply(this, arguments); };
  });
});
console.warn('[cap] hooks installed');
})();"""


def pull_data(page):
    n_json = page.evaluate('window.__capJson.length')
    n_dec = page.evaluate('window.__dec.length')
    n_buf = page.evaluate('window.__capBuf.length')
    draws = page.evaluate('window.__draws')
    print(f'[pull] json={n_json} dec={n_dec} bufs={n_buf} draws={draws}', flush=True)
    for i in range(n_json):
        item = page.evaluate(f'window.__capJson[{i}]')
        with open(os.path.join(OUT, f'graph_{i}.json'), 'w') as f:
            f.write(item['s'])
        print(f'  saved graph_{i}.json ({item["len"]})', flush=True)
    for i in range(n_dec):
        item = page.evaluate(f'window.__dec[{i}]')
        with open(os.path.join(OUT, f'dec_{i}.txt'), 'w') as f:
            f.write(item['s'])
        print(f'  saved dec_{i}.txt ({item["len"]})', flush=True)
    total = 0
    for i in range(n_buf):
        meta = page.evaluate(f'(() => {{ const x = window.__capBuf[{i}]; return {{seq:x.seq,target:x.target,len:x.len}}; }})()')
        b64 = page.evaluate(f'window.__capBuf[{i}].b64')
        data = base64.b64decode(b64)
        fn = f'buffer_{meta["seq"]:03d}_{meta["len"]}.bin'
        with open(os.path.join(OUT, fn), 'wb') as f:
            f.write(data)
        total += meta['len']
        print(f'  saved {fn} (target={meta["target"]})', flush=True)
    print(f'[pull] total buffer bytes: {total}', flush=True)


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
        ctx.add_init_script("""(() => { window.sketchfabWebGLSupport = true; })()""")
        page = ctx.new_page()
        page.add_init_script(HOOKS)
        page.on('response', on_response)
        page.on('console', lambda m: print(f"[c:{m.type}] {m.text[:160]}", flush=True)
                if ('[cap]' in m.text or m.type == 'error') else None)
        page.on('pageerror', lambda e: print(f"[pageerror] {str(e)[:200]}", flush=True))
        url = (f'https://sketchfab.com/models/{UID}/embed?autostart=1&preload=1'
               f'&ui_stop=0&ui_hint=0&ui_infos=0&ui_watermark=0&ui_theme=dark&transparent=0&dnt=1')
        page.goto(url, timeout=90000, wait_until='domcontentloaded')
        print('[nav] loaded', flush=True)
        elapsed = 0
        while elapsed < 150:
            page.wait_for_timeout(5000)
            elapsed += 5
            try:
                draws = page.evaluate('window.__draws')
                nb = page.evaluate('window.__capBuf.length')
                if elapsed % 15 == 0:
                    print(f'[t={elapsed}s] draws={draws} bufs={nb} tex={texcount[0]}', flush=True)
                if draws > 50 and elapsed >= 45 and nb > 0:
                    # give textures time, then pull
                    page.wait_for_timeout(8000)
                    elapsed += 8
                    break
            except Exception:
                pass
        try:
            page.screenshot(path=os.path.join(OUT, 'v6_final.png'))
        except Exception:
            pass
        pull_data(page)
        save_manifest()
        browser.close()


if __name__ == '__main__':
    main()
