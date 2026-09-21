"""Fast menu-visual probe: desktop + mobile landing screenshots."""
import sys, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = "/home/z/my-project/scripts/aa_shots"

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    for name, vp in [("probe_menu_desktop", {"width": 1280, "height": 720}), ("probe_menu_mobile", {"width": 390, "height": 844})]:
        ctx = browser.new_context(viewport=vp)
        page = ctx.new_page()
        page.goto(BASE, wait_until="domcontentloaded")
        page.wait_for_function("document.body && document.body.innerText.includes('ANATOMY')", timeout=30000)
        time.sleep(4.5)
        page.screenshot(path=f"{OUT}/{name}.png")
        # game modes section shot (desktop only)
        if "desktop" in name:
            page.evaluate("document.querySelector('#aa-missions')?.scrollIntoView({behavior:'instant', block:'start'})")
            time.sleep(1.2)
            page.screenshot(path=f"{OUT}/probe_game_modes.png")
        ctx.close()
    browser.close()
print("probe done")
