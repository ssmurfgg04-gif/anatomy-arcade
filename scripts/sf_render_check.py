#!/usr/bin/env python3
"""Serve viewer.html + model.glb locally and screenshot the render."""
import http.server, threading, os, functools
from playwright.sync_api import sync_playwright

ROOT = "/home/z/my-project/scripts/sf_rip"
PORT = 8931

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
print(f"serving {ROOT} on {PORT}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=[
        '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        '--no-sandbox', '--disable-dev-shm-usage'])
    ctx = browser.new_context(viewport={'width': 1200, 'height': 800})
    page = ctx.new_page()
    page.on('console', lambda m: print('[console]', m.text[:200]))
    page.on('pageerror', lambda e: print('[pageerror]', str(e)[:300]))
    page.goto(f'http://127.0.0.1:{PORT}/viewer.html', timeout=60000)
    for i in range(40):
        page.wait_for_timeout(2000)
        loaded = page.evaluate('window.__loaded || false')
        err = page.evaluate('window.__error || null')
        if err:
            print('ERROR:', err)
            break
        if loaded:
            page.wait_for_timeout(3000)
            page.screenshot(path=f'{ROOT}/render_check.png')
            print('render saved')
            break
    else:
        print('timeout waiting for load')
        page.screenshot(path=f'{ROOT}/render_timeout.png')
    browser.close()
httpd.shutdown()
