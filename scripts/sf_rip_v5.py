#!/usr/bin/env python3
"""Sketchfab capture v5: bypass WebGL detection by pre-setting sketchfabWebGLSupport=true.
Their check short-circuits on the cached global -> viewer boots the real 3D pipeline.
Captures all model data (json/binz/glb/textures)."""
import json, os, re, hashlib
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

UID = "22e53200b774420eb55c54c29fd6cd1c"
OUT = "/home/z/my-project/scripts/sf_rip/capture"
os.makedirs(OUT, exist_ok=True)

saved = {}
manifest = {"uid": UID, "responses": {}, "requests": []}
SKIP_SAVE_RE = re.compile(r'\.(js|css|mjs|html|woff2?|ttf|svg)(\?|$)', re.I)
MODEL_EXT_RE = re.compile(r'\.(binz|bin|glb|gltf|ktx2|basis|dds|pk)(\?|$)', re.I)


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
        path = urlparse(url).path
        low = os.path.basename(path).lower()
        keep = False
        if MODEL_EXT_RE.search(low) or 'binz' in low:
            keep = True
        elif ct.startswith('image/') and not url.startswith('https://static.sketchfab.com/static/builds'):
            keep = True
        elif ct == 'application/json' and 'static/builds' not in url:
            keep = True
        elif ct == 'application/octet-stream':
            keep = True
        if SKIP_SAVE_RE.search(low) or 'javascript' in ct:
            keep = False
        if not url.startswith('https://static.sketchfab.com/static/builds') and 'sentry' not in url:
            print(f"[res] {ct[:24]:24s} {resp.status} {url[:150]}", flush=True)
        if keep:
            body = resp.body()
            base = os.path.basename(path) or 'index'
            safe = re.sub(r'[^A-Za-z0-9._-]', '_', base)[-140:]
            h = hashlib.md5(url.encode()).hexdigest()[:10]
            fn = f"{h}__{safe}"
            with open(os.path.join(OUT, fn), 'wb') as f:
                f.write(body)
            saved[url] = fn
            manifest['responses'][url] = {"size": len(body), "ct": ct, "file": fn}
            save_manifest()
    except Exception as e:
        print(f"[err] {url[:110]} {str(e)[:90]}", flush=True)


STEALTH = """(() => {
if (window.__sfPatched) return;
window.__sfPatched = true;
try {
  window.sketchfabWebGLSupport = true;
  Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
  window.chrome = {runtime: {}};
} catch (e) {}
})();"""

PROBE = """() => ({
  support: String(window.sketchfabWebGLSupport),
  stats: JSON.stringify(window.sketchfabViewerStats || {}).slice(0, 250),
  canvases: [...document.querySelectorAll('canvas')].map(c => c.width + 'x' + c.height).join(','),
  perf: performance.getEntriesByType('resource').length
})"""


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
        ctx.add_init_script(STEALTH)
        page = ctx.new_page()
        page.on('response', on_response)
        page.on('request', lambda r: manifest['requests'].append(r.url))
        page.on('console', lambda m: print(f"[console:{m.type}] {m.text[:200]}", flush=True)
                if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: print(f"[pageerror] {str(e)[:250]}", flush=True))
        url = (f'https://sketchfab.com/models/{UID}/embed?autostart=1&preload=1'
               f'&ui_stop=0&ui_hint=0&ui_infos=0&ui_watermark=0&ui_theme=dark&transparent=0&dnt=1')
        try:
            page.goto(url, timeout=90000, wait_until='domcontentloaded')
            print('[nav] loaded', flush=True)
        except Exception as e:
            print('goto warning:', e, flush=True)
        elapsed = 0
        quiet = 0
        last_req = 0
        while elapsed < 240:
            page.wait_for_timeout(4000)
            elapsed += 4
            n = len(manifest['requests'])
            if n == last_req:
                quiet += 4
            else:
                quiet = 0
            last_req = n
            if elapsed % 24 == 0:
                try:
                    info = page.evaluate(PROBE)
                    print(f"[probe @{elapsed}s] {info}", flush=True)
                except Exception as e:
                    print(f"[probe @{elapsed}s] FAIL {str(e)[:120]}", flush=True)
            if quiet >= 40 and n > 10:
                break
        print(f'DONE. {len(saved)} bodies saved, {len(manifest["requests"])} requests', flush=True)
        try:
            page.screenshot(path=os.path.join(OUT, 'v5_final.png'))
        except Exception:
            pass
        save_manifest()
        browser.close()


if __name__ == '__main__':
    main()
