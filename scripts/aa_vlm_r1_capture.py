"""
ANATOMY ARCADE — VLM ROUND 1 capture (structure pass).
Captures the curated screen set of the current build (desktop + mobile)
into scripts/aa_vlm_r1/shots/ for the z-ai vision critique loop.
"""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = Path("/home/z/my-project/scripts/aa_vlm_r1/shots")
OUT.mkdir(parents=True, exist_ok=True)

def wait_text(page, text, timeout=25000):
    page.wait_for_function(
        f"document.body && document.body.innerText.includes('{text}')", timeout=timeout
    )

def shot(page, name):
    page.screenshot(path=str(OUT / f"{name}.png"))
    print("SHOT", name)

def click_resume(page):
    try:
        page.wait_for_function(
            "!document.querySelector('.animate-pulse.text-cyan-300')", timeout=20000
        )
    except Exception:
        pass
    time.sleep(1.0)
    page.evaluate(
        "[...document.querySelectorAll('button')].find(b => b.textContent.includes('RESUME'))?.click()"
    )
    try:
        page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=6000)
    except Exception:
        page.evaluate("window.__aa.getState().closeScan()")
    time.sleep(0.6)

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    # ---- landing ----
    page.goto(BASE, wait_until="domcontentloaded")
    wait_text(page, "PLAY", 30000)
    time.sleep(4.0)
    shot(page, "r1_01_landing")

    # scroll landing to game modes
    page.mouse.wheel(0, 1400)
    time.sleep(1.5)
    shot(page, "r1_02_landing_modes")
    page.mouse.wheel(0, -2200)
    time.sleep(1.0)

    # ---- mission select ----
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(1.2)
    shot(page, "r1_03_mission_select")

    # ---- heart mission run ----
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page, "MISSION BRIEFING", 10000)
    time.sleep(1.2)
    shot(page, "r1_04_briefing")
    page.get_by_text("BEGIN MISSION", exact=True).click()
    time.sleep(2.0)
    shot(page, "r1_05_intro_cinematic")
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.5)
    shot(page, "r1_06_gameplay_spawn")

    # junction
    page.evaluate("window.__aaTp && window.__aaTp(0.27, 0, 0.1)")
    time.sleep(2.2)
    shot(page, "r1_07_junction")

    # calibration scan
    page.evaluate("window.__aaTp && window.__aaTp(0.30, 0, 0.1)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.33, 0.8, 0.5)")
    time.sleep(1.0)
    page.keyboard.down("KeyQ"); time.sleep(0.4); page.keyboard.up("KeyQ")
    time.sleep(1.8)
    if "ANATOMICAL SCAN" in page.inner_text("body"):
        shot(page, "r1_08_scan_panel")
        click_resume(page)
    else:
        page.evaluate("window.__aa.getState().closeScan()")

    # analysis readout
    page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
    time.sleep(1.0)
    page.keyboard.down("KeyQ"); time.sleep(0.4); page.keyboard.up("KeyQ")
    time.sleep(1.8)
    sid = page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().activeScan.id")
    if sid in ("thrombus", "plaque"):
        shot(page, "r1_09_analysis_readout")
        click_resume(page)
    else:
        page.evaluate("window.__aa.getState().closeScan()")

    # treatment hold
    page.evaluate("window.__aaTp && window.__aaTp(0.66, 0, 0.15)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.674, 2.35, 0.62)")
    time.sleep(0.6)
    page.keyboard.down("KeyE")
    time.sleep(2.2)
    shot(page, "r1_10_treatment")
    page.keyboard.up("KeyE")

    # hero heart payoff
    page.evaluate("window.__aaTp && window.__aaTp(0.90, 0, 0.1)")
    page.evaluate("window.__aaAimHeart && window.__aaAimHeart()")
    time.sleep(2.5)
    shot(page, "r1_11_hero_heart")

    # results: fast-forward stabilize
    page.evaluate("window.__aaTp && window.__aaTp(0.94, 0, 0.1)")
    try:
        page.wait_for_function("window.__aa.getState().objectives.every(o=>o.done)", timeout=45000)
    except Exception:
        pass
    try:
        page.wait_for_function("document.body.innerText.includes('THE BIOLOGY')", timeout=30000)
    except Exception:
        pass
    time.sleep(1.5)
    shot(page, "r1_12_results")

    # ---- mobile pass ----
    page2 = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True).new_page()
    page2.goto(BASE, wait_until="domcontentloaded")
    wait_text(page2, "PLAY", 25000)
    time.sleep(4.0)
    shot(page2, "r1_13_mobile_landing")
    page2.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(1.0)
    shot(page2, "r1_14_mobile_mission_select")
    page2.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page2, "MISSION BRIEFING", 10000)
    page2.get_by_text("BEGIN MISSION", exact=True).click()
    page2.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.5)
    shot(page2, "r1_15_mobile_gameplay")
    # journal (BioDex) mobile
    page2.evaluate("window.__aa.getState().setUiOverlay('JOURNAL')")
    time.sleep(1.5)
    shot(page2, "r1_16_mobile_journal")
    page2.evaluate("window.__aa.getState().setUiOverlay(null)")

    # ---- desktop journal (BioDex) ----
    page.evaluate("window.__aa.getState().setUiOverlay('JOURNAL')")
    time.sleep(1.5)
    shot(page, "r1_17_journal")

    browser.close()

print("CAPTURE DONE")
