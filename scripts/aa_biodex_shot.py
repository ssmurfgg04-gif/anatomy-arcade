"""
ANATOMY ARCADE — Task 5 QA: BIODEX v2 body-map visual verification.

Desktop 1280x800 + mobile 390x844:
- opens http://localhost:3000, waits for MAIN_MENU, sets uiOverlay=JOURNAL
  via window.__aa.getState().setUiOverlay('JOURNAL')
- verifies a <canvas> exists inside the overlay (the R3F body map)
- pixel-samples the canvas region from the screenshot (PIL/numpy) and fails
  if that region is uniform/blank; also requires >=100 bright pixels (the
  glowing organ pins) and >=3 distinct bright clusters (BRAIN/LUNGS/HEART)
- desktop bonus: injects heartChamber + coronaryArtery discoveries, then
  verifies the two EntryMesh heart-preview canvases render non-blank
  (canonical undiscovered-state screenshots are taken BEFORE this)
- mobile: confirms the overlay scrolls and the body-map canvas fits the width
- screenshots: scripts/aa_biodex_shot.png + scripts/aa_biodex_shot_mobile.png

Run: python3 scripts/aa_biodex_shot.py
"""
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

try:
    from scipy import ndimage
except Exception:  # pragma: no cover - cluster check degrades gracefully
    ndimage = None

BASE = "http://localhost:3000"
HERE = Path(__file__).parent
SHOT_DESKTOP = HERE / "aa_biodex_shot.png"
SHOT_MOBILE = HERE / "aa_biodex_shot_mobile.png"
LAUNCH_ARGS = ["--enable-unsafe-swiftshader", "--use-gl=swiftshader"]

results = []


def step(name, ok, note=""):
    results.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + ((" | " + str(note)) if note else ""))


# JS: find the JOURNAL overlay root (fixed div containing the ANATOMY JOURNAL h2)
# and report its canvas info (count, first canvas rect in viewport px).
OVERLAY_CANVAS_JS = """
() => {
  const roots = [...document.querySelectorAll("div")].filter(
    (d) => getComputedStyle(d).position === "fixed" &&
           d.querySelector("h2") && d.querySelector("h2").textContent.includes("ANATOMY JOURNAL")
  );
  const root = roots[roots.length - 1];
  if (!root) return { found: false };
  const canvases = [...root.querySelectorAll("canvas")];
  const rect = canvases.length ? canvases[0].getBoundingClientRect() : null;
  const scroller = getComputedStyle(root).overflowY.includes("auto") || getComputedStyle(root).overflowY.includes("scroll")
    ? root
    : root.closest("div");
  return {
    found: true,
    canvasCount: canvases.length,
    rect: rect ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height } : null,
    scroll: scroller ? { sh: scroller.scrollHeight, ch: scroller.clientHeight } : null,
  };
}
"""


def read_overlay(page):
    return page.evaluate(OVERLAY_CANVAS_JS)


def canvas_stats(png_path, rect=None):
    """Pixel stats of the canvas region: (std, unique colors, bright px, big clusters)."""
    img = Image.open(png_path).convert("RGB")
    if rect:
        x, y = int(rect["x"]), int(rect["y"])
        w, h = int(rect["w"]), int(rect["h"])
        img = img.crop((x, y, x + w, y + h))
    crop = np.asarray(img, dtype=np.int16)
    lum = crop.mean(axis=2)
    std = float(crop.std(axis=(0, 1)).max())
    uniq = len(np.unique(crop.reshape(-1, 3), axis=0))
    bright = int((lum > 60).sum())
    clusters = 0
    if ndimage is not None:
        mask = lum > 60
        if mask.any():
            lab, n = ndimage.label(mask)
            if n:
                sizes = ndimage.sum(mask, lab, range(1, n + 1))
                clusters = int((sizes >= 20).sum())
    return std, uniq, bright, clusters


def open_journal(page):
    page.goto(BASE, wait_until="load", timeout=60000)
    # wait for the boot sequence to reach MAIN_MENU (debug handle __aa exists)
    page.wait_for_function(
        "() => window.__aa && window.__aa.getState().phase === 'MAIN_MENU'", timeout=60000
    )
    page.evaluate("window.__aa.getState().setUiOverlay('JOURNAL')")
    # dynamic chunk + GLB fetch + first demand frames (dev server may compile)
    deadline = time.time() + 45
    info = {}
    while time.time() < deadline:
        info = read_overlay(page)
        if info.get("found") and info.get("canvasCount", 0) > 0 and info.get("rect"):
            break
        time.sleep(0.5)
    # the canvas mounts at the 300x150 HTML default before R3F's ResizeObserver
    # sizes it to the wrapper — wait for the real layout to settle
    deadline = time.time() + 20
    while time.time() < deadline:
        info = read_overlay(page)
        rect = info.get("rect") or {}
        if rect.get("w", 0) >= 200 and rect.get("h", 0) >= 150:
            break
        time.sleep(0.5)
    time.sleep(4.0)  # let the demand loop paint a few frames of the rotating ghost
    info = read_overlay(page)  # fresh rect right before the screenshot
    return info





def run_desktop(browser):
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    info = open_journal(page)
    step("desktop: journal overlay present", info.get("found", False))
    step("desktop: body-map canvas mounted inside overlay", info.get("canvasCount", 0) >= 1, info.get("canvasCount"))
    page.screenshot(path=str(SHOT_DESKTOP))
    if info.get("rect"):
        std, uniq, bright, clusters = canvas_stats(SHOT_DESKTOP, info["rect"])
        step("desktop: canvas region non-uniform (rendered pixels)", std > 5.0 and uniq > 100, f"std={std:.2f} uniq={uniq}")
        step("desktop: ghost figure + glowing organ pins visible", bright >= 100 and clusters >= 3, f"bright>60={bright} clusters>=20px={clusters}")
    else:
        step("desktop: canvas region non-uniform", False, "no rect")
        step("desktop: ghost figure + glowing organ pins visible", False, "no rect")

    # Bonus: the two flagship cardiac entries must mount the EntryMesh heart
    # preview once discovered (canonical undiscovered shots were taken above).
    page.evaluate(
        """() => {
          const st = window.__aa.getState();
          const mk = (id) => ({ id, title: id, subtitle: "", body: "", missionTip: "", at: Date.now() });
          st.addDiscovery(mk("heartChamber"));
          st.addDiscovery(mk("coronaryArtery"));
        }"""
    )
    deadline = time.time() + 30
    count = 0
    while time.time() < deadline:
        count = page.evaluate(
            """() => {
              const roots = [...document.querySelectorAll("div")].filter(
                (d) => getComputedStyle(d).position === "fixed" &&
                       d.querySelector("h2") && d.querySelector("h2").textContent.includes("ANATOMY JOURNAL"));
              const root = roots[roots.length - 1];
              return root ? root.querySelectorAll("canvas").length : 0;
            }"""
        )
        if count >= 3:
            break
        time.sleep(0.5)
    step("desktop: entry previews mounted (3 canvases after discovery)", count >= 3, f"canvases={count}")
    # tag the overlay's own canvases (document-wide locator("canvas") would also
    # hit the landing MenuScene canvas behind the modal — must scope to the root)
    page.evaluate(
        """() => {
          const roots = [...document.querySelectorAll("div")].filter(
            (d) => getComputedStyle(d).position === "fixed" &&
                   d.querySelector("h2") && d.querySelector("h2").textContent.includes("ANATOMY JOURNAL"));
          const root = roots[roots.length - 1];
          [...root.querySelectorAll("canvas")].forEach((c, i) => c.setAttribute("data-aa-biodex-canvas", String(i)));
        }"""
    )
    for idx in (1, 2):
        path = HERE / f"aa_biodex_entry_preview_{idx}.png"
        try:
            page.locator(f'canvas[data-aa-biodex-canvas="{idx}"]').screenshot(path=str(path), timeout=15000)
            # NB: brightness varies with the preview's yaw phase (dark crimson
            # material), so non-blank is judged by contrast + color variety only
            std, uniq, bright, _ = canvas_stats(path)
            step(f"desktop: entry preview canvas #{idx} non-blank", std > 4.0 and uniq > 50, f"std={std:.2f} uniq={uniq} bright>60={bright}")
        except Exception as exc:  # pragma: no cover
            step(f"desktop: entry preview canvas #{idx} non-blank", False, repr(exc)[:120])
    page.close()


def run_mobile(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    info = open_journal(page)
    step("mobile: journal overlay present", info.get("found", False))
    step("mobile: body-map canvas mounted inside overlay", info.get("canvasCount", 0) >= 1, info.get("canvasCount"))
    rect = info.get("rect")
    if rect:
        step("mobile: canvas fits viewport width", 0 < rect["w"] <= 390, f"w={rect['w']:.0f}")
    else:
        step("mobile: canvas fits viewport width", False, "no rect")
    page.screenshot(path=str(SHOT_MOBILE))
    if rect:
        std, uniq, bright, clusters = canvas_stats(SHOT_MOBILE, rect)
        step("mobile: canvas region non-uniform (rendered pixels)", std > 5.0 and uniq > 100, f"std={std:.2f} uniq={uniq}")
        step("mobile: ghost figure + glowing organ pins visible", bright >= 100 and clusters >= 3, f"bright>60={bright} clusters>=20px={clusters}")
    sc = info.get("scroll") or {}
    tall = sc.get("sh", 0) > sc.get("ch", 0) + 10
    step("mobile: overlay content is scrollable", tall, f"scrollHeight={sc.get('sh')} clientHeight={sc.get('ch')}")
    if tall:
        page.evaluate(
            """() => {
              const roots = [...document.querySelectorAll("div")].filter(
                (d) => getComputedStyle(d).position === "fixed" && getComputedStyle(d).overflowY.includes("auto"));
              const el = roots.map(r => [r, r.scrollHeight - r.clientHeight]).sort((a, b) => b[1] - a[1])[0][0];
              el.scrollTop = 999999;
            }"""
        )
        time.sleep(0.6)
        moved = page.evaluate(
            """() => {
              const roots = [...document.querySelectorAll("div")].filter(
                (d) => getComputedStyle(d).position === "fixed" && getComputedStyle(d).overflowY.includes("auto"));
              return Math.max(...roots.map(r => r.scrollTop));
            }"""
        )
        step("mobile: overlay actually scrolls (scrollTop > 0)", moved > 100, f"scrollTop={moved}")
        page.screenshot(path=str(SHOT_MOBILE.with_name("aa_biodex_shot_mobile_scrolled.png")))
    page.close()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=LAUNCH_ARGS)
        try:
            run_desktop(browser)
            run_mobile(browser)
        finally:
            browser.close()
    ok = all(results)
    print("\nRESULT:", "PASS" if ok else "FAIL", f"({sum(results)}/{len(results)} checks)")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
