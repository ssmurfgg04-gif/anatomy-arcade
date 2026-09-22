#!/usr/bin/env python3
"""Sketchfab viewer diagnostics v3: stealth, console, screenshots, in-page probes."""
import json, os, re, hashlib, base64
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


STEALTH = """
Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3,4,5]});
window.chrome = {runtime: {}};
"""

PROBE = """() => {
  const canvases = [...document.querySelectorAll('canvas')].map(c => ({
    w: c.width, h: c.height, cls: c.className.slice(0,60)}));
  const iframes = [...document.querySelectorAll('iframe')].map(f => f.src.slice(0,80));
  const globals = Object.keys(window).filter(k => /sketchfab|viewer|api|uid/i.test(k)).slice(0,20);
  return {canvases, iframes, globals,
          perf: performance.getEntriesByType('resource').length,
          title: document.title.slice(0,60)};
}"""


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
        page.on('request', lambda r: (manifest['requests'].append(r.url),
                                      print(f"[req] {r.resource_type:8s} {r.url[:150]}", flush=True)))
        page.on('console', lambda m: print(f"[console:{m.type}] {m.text[:200]}", flush=True))
        page.on('pageerror', lambda e: print(f"[pageerror] {str(e)[:250]}", flush=True))
        url = (f'https://sketchfab.com/models/{UID}/embed?autostart=1&preload=1'
               f'&ui_stop=0&ui_hint=0&ui_infos=0&ui_watermark=0&ui_theme=dark&transparent=0&dnt=1')
        try:
            page.goto(url, timeout=90000, wait_until='domcontentloaded')
            print('[nav] loaded', flush=True)
        except Exception as e:
            print('goto warning:', e, flush=True)
        elapsed = 0
        marks = {20: 's20', 50: 's50', 95: 's95'}
        while elapsed < 100:
            page.wait_for_timeout(5000)
            elapsed += 5
            if elapsed in marks:
                name = marks[elapsed]
                try:
                    page.screenshot(path=os.path.join(OUT, f'{name}.png'))
                    info = page.evaluate(PROBE)
                    print(f"[probe @{elapsed}s] {json.dumps(info)[:400]}", flush=True)
                except Exception as e:
                    print(f"[probe @{elapsed}s] FAIL {str(e)[:150]}", flush=True)
        print(f'DONE. {len(saved)} bodies saved, {len(manifest["requests"])} requests', flush=True)
        save_manifest()
        browser.close()


if __name__ == '__main__':
    main()
