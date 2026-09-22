#!/usr/bin/env python3
"""Capture Sketchfab viewer network data - v2 (no host filter, log everything).
Saves model-relevant payloads (binz/glb/gltf/bin/textures/json), logs all requests.
"""
import json, os, re, hashlib
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

UID = "22e53200b774420eb55c54c29fd6cd1c"
OUT = "/home/z/my-project/scripts/sf_rip/capture"
os.makedirs(OUT, exist_ok=True)

saved = {}
reqlog = []
manifest = {"uid": UID, "responses": {}, "requests": []}

SKIP_SAVE_RE = re.compile(r'\.(js|css|mjs|html|woff2?|ttf|svg)(\?|$)', re.I)
MODEL_EXT_RE = re.compile(r'\.(binz|bin|glb|gltf|ktx2|basis|dds|pk)(\?|$)', re.I)


def save_manifest():
    try:
        with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
            json.dump(manifest, f, indent=1)
    except Exception:
        pass


def on_request(req):
    try:
        reqlog.append(req.url)
        manifest['requests'].append(req.url)
        if len(manifest['requests']) % 40 == 0:
            save_manifest()
    except Exception:
        pass


def on_response(resp):
    url = resp.url
    try:
        ct = resp.headers.get('content-type', '')
        path = urlparse(url).path
        low = os.path.basename(path).lower()

        # decide whether to save the body
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

        print(f"[res] {ct:24s} {resp.status} {url[:150]}", flush=True)

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


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=[
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
            '--no-sandbox', '--disable-dev-shm-usage'])
        ctx = browser.new_context(
            user_agent=('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                        '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'),
            viewport={'width': 1400, 'height': 900}, locale='en-US')
        page = ctx.new_page()
        page.on('response', on_response)
        page.on('request', on_request)
        page.on('console', lambda m: print(f"[console] {m.type}: {m.text[:180]}", flush=True)
                if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: print(f"[pageerror] {str(e)[:200]}", flush=True))
        url = (f'https://sketchfab.com/models/{UID}/embed?autostart=1&preload=1'
               f'&ui_stop=0&ui_hint=0&ui_infos=0&ui_watermark=0&ui_theme=dark&transparent=0&dnt=1')
        try:
            page.goto(url, timeout=90000, wait_until='domcontentloaded')
            print('[nav] embed page loaded', flush=True)
        except Exception as e:
            print('goto warning:', e, flush=True)
        quiet = 0
        total = 0
        last_n = 0
        clicks = 0
        while total < 300:
            page.wait_for_timeout(3000)
            total += 3
            n = len(manifest['requests'])
            if n == 0 and total >= 40 and clicks < 3:
                try:
                    page.mouse.click(700, 450)
                    print('[ui] center click', flush=True)
                except Exception:
                    pass
                clicks += 1
            if n > 0 and n == last_n:
                quiet += 3
                if quiet >= 45:
                    break
            else:
                quiet = 0
            last_n = n
        print(f'DONE. {len(saved)} bodies saved, {len(manifest["requests"])} requests in {total}s', flush=True)
        save_manifest()
        browser.close()


if __name__ == '__main__':
    main()
