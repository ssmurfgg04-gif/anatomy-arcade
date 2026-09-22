#!/usr/bin/env python3
"""Probe WebGL2 availability across launch variants."""
import json
from playwright.sync_api import sync_playwright

VARIANTS = [
    ("angle-swiftshader", ["--use-gl=angle", "--use-angle=swiftshader",
                           "--enable-unsafe-swiftshader", "--no-sandbox",
                           "--disable-dev-shm-usage"]),
    ("gl-swiftshader", ["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                        "--no-sandbox", "--disable-dev-shm-usage",
                        "--ignore-gpu-blocklist"]),
    ("no-flag", ["--no-sandbox", "--disable-dev-shm-usage"]),
]

JS = """() => {
  try {
    const c = document.createElement('canvas');
    const g = c.getContext('webgl2');
    if (!g) return {webgl2: false};
    const dbg = g.getExtension('WEBGL_debug_renderer_info');
    return {webgl2: true,
            renderer: dbg ? g.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)};
  } catch (e) { return {webgl2: false, err: String(e)}; }
}"""

with sync_playwright() as p:
    for name, args in VARIANTS:
        for channel in (None, "chromium"):
            try:
                kw = dict(headless=True, args=args)
                if channel:
                    kw["channel"] = channel
                b = p.chromium.launch(**kw)
                pg = b.new_page()
                pg.goto("about:blank")
                r = pg.evaluate(JS)
                print(f"{name:20s} channel={channel!s:10s} -> {json.dumps(r)}", flush=True)
                b.close()
            except Exception as e:
                print(f"{name:20s} channel={channel!s:10s} -> LAUNCH FAIL: {str(e)[:120]}", flush=True)
