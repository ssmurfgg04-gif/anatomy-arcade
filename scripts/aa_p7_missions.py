"""
ANATOMY ARCADE — P7 E2E: 10-stage arc for VIRAL INVASION + BRAIN MISSION.
Validates both cloned missions end-to-end: briefing -> entry -> navigate ->
junction identify (soft wall) -> calibration scan -> locate -> analysis readout
-> treatment -> restore -> stabilize -> results with THE BIOLOGY card.
Plus mobile ticker x/10 for each mission.
"""
import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = Path("/home/z/my-project/scripts/aa_shots")
OUT.mkdir(parents=True, exist_ok=True)
results = {"steps": [], "errors": []}

def step(name, ok, note=""):
    results["steps"].append({"step": name, "ok": bool(ok), "note": str(note)})
    print(("PASS " if ok else "FAIL ") + name + (" | " + note if note else ""))

def shot(page, name):
    page.screenshot(path=str(OUT / f"{name}.png"))

def wait_text(page, text, timeout=20000):
    page.wait_for_function(
        f"document.body && document.body.innerText.includes('{text}')", timeout=timeout
    )

def objs(page):
    return page.evaluate("window.__aa.getState().objectives.map(o=>o.done)")

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
        page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=5000)
    except Exception:
        page.evaluate("window.__aa.getState().closeScan()")
    time.sleep(0.6)

def run_mission(page, browser, locator_name, prefix, analysis_ids, lesson_terms, tag):
    """Full 10-stage run for one mission."""
    page.goto(BASE, wait_until="domcontentloaded")
    wait_text(page, "PLAY", 25000)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name=locator_name).click()
    wait_text(page, "MISSION BRIEFING", 8000)
    time.sleep(0.8)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    time.sleep(1.0)
    st0 = page.evaluate("window.__aa.getState().objectives[0].done")
    step(f"{tag}_stage1_brief_done", st0)
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(1.0)
    st = objs(page)
    step(f"{tag}_stage2_enter_done", st[1], f"{st}")
    body = page.inner_text("body")
    step(f"{tag}_hud_10_stage_counter", "OBJECTIVE 3/10" in body or "NAVIGATE" in body)
    shot(page, f"{prefix}_t01_spawn")

    # stage 3 navigate
    page.evaluate("window.__aaTp && window.__aaTp(0.25, 0, 0.1)")
    time.sleep(1.5)
    st = objs(page)
    step(f"{tag}_stage3_navigate_done", st[2], f"{st}")

    # stage 4 junction
    page.evaluate("window.__aaTp && window.__aaTp(0.27, 0, 0.1)")
    time.sleep(1.2)
    shot(page, f"{prefix}_t02_junction")
    page.evaluate("window.__aaTp && window.__aaTp(0.45, 0, 0.1)")
    time.sleep(1.5)
    st = objs(page)
    step(f"{tag}_stage4_identify_done", st[3], f"{st}")

    # stage 5 calibrate scan
    scanned = False
    for attempt in range(3):
        page.evaluate("window.__aaTp && window.__aaTp(0.30, 0, 0.1)")
        page.evaluate("window.__aaAimAt && window.__aaAimAt(0.33, 0.8, 0.5)")
        time.sleep(1.0)
        page.keyboard.down("KeyQ"); time.sleep(0.4); page.keyboard.up("KeyQ")
        time.sleep(1.5)
        if "ANATOMICAL SCAN" in page.inner_text("body"):
            scanned = True
            break
        page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().closeScan()")
    step(f"{tag}_stage5_scan_panel", scanned)
    shot(page, f"{prefix}_t03_scan")
    if scanned:
        click_resume(page)

    # stage 6 locate
    page.evaluate("window.__aaTp && window.__aaTp(0.58, 0, 0.1)")
    time.sleep(1.5)
    st = objs(page)
    step(f"{tag}_stage6_locate_done", st[5], f"{st}")
    shot(page, f"{prefix}_t04_threat_zone")

    # stage 7 analyze
    ok = False
    for attempt in range(4):
        page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
        page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
        time.sleep(1.0)
        page.keyboard.down("KeyQ"); time.sleep(0.4); page.keyboard.up("KeyQ")
        time.sleep(1.6)
        sid = page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().activeScan.id")
        if sid in analysis_ids:
            ok = True
            break
        page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().closeScan()")
    step(f"{tag}_stage7_analysis_panel", ok)
    if ok:
        body = page.inner_text("body").upper()
        step(f"{tag}_stage7_analysis_title", "ANALYSIS" in body)
        shot(page, f"{prefix}_t05_analysis")
        click_resume(page)

    # stage 8 treatment (4 segments, same seed layout as heart)
    segs = [(0.648, 1.2), (0.674, 2.35), (0.700, 3.5), (0.726, 4.65)]
    page.evaluate("window.__aaTp && window.__aaTp(0.66, 0, 0.15)")
    for attempt in range(10):
        st = objs(page)
        if st[7]:
            break
        t, ang = segs[attempt % 4]
        page.evaluate(f"window.__aaAimAt && window.__aaAimAt({t}, {ang}, 0.62)")
        page.keyboard.down("KeyE")
        time.sleep(6.0)
        page.keyboard.up("KeyE")
        time.sleep(0.4)
    st = objs(page)
    step(f"{tag}_stage8_treatment_done", st[7], f"{st}")
    shot(page, f"{prefix}_t06_treatment")

    # stage 9 restore
    page.evaluate("window.__aaTp && window.__aaTp(0.80, 0, 0.1)")
    try:
        page.wait_for_function("window.__aa.getState().objectives[8].done", timeout=30000)
        step(f"{tag}_stage9_restore", True)
    except Exception:
        step(f"{tag}_stage9_restore", False, f"{objs(page)}")
    flow = page.evaluate("window.__aa.getState().flowHealth")
    step(f"{tag}_stage9_flow_value", flow > 0.9, f"flow={flow:.2f}")
    shot(page, f"{prefix}_t07_restored")

    # payoff shot
    page.evaluate("window.__aaTp && window.__aaTp(0.90, 0, 0.1)")
    page.evaluate("window.__aaAimHeart && window.__aaAimHeart()")
    time.sleep(2.5)
    shot(page, f"{prefix}_t08_payoff")

    # stage 10 stabilize + results
    page.evaluate("window.__aaTp && window.__aaTp(0.94, 0, 0.1)")
    try:
        page.wait_for_function(
            "window.__aa.getState().objectives.every(o=>o.done)", timeout=40000
        )
        step(f"{tag}_stage10_stabilize", True)
    except Exception:
        step(f"{tag}_stage10_stabilize", False, f"{objs(page)}")
    try:
        page.wait_for_function(
            "document.body.innerText.includes('THE BIOLOGY')", timeout=30000
        )
        shot(page, f"{prefix}_t09_results")
        body = page.inner_text("body")
        ok = "THE BIOLOGY" in body and any(term in body.upper() for term in lesson_terms) and "BIO XP" in body
        step(f"{tag}_stage10_biology_card", ok)
    except Exception as e:
        shot(page, f"{prefix}_t09_results")
        step(f"{tag}_stage10_biology_card", False, str(e)[:120])

def mobile_check(browser, locator_name, tag):
    page2 = browser.new_context(
        viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True
    ).new_page()
    page2.goto(BASE, wait_until="domcontentloaded")
    wait_text(page2, "PLAY", 20000)
    page2.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page2.get_by_role("button", name=locator_name).click()
    wait_text(page2, "MISSION BRIEFING", 8000)
    page2.get_by_text("BEGIN MISSION", exact=True).click()
    page2.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.0)
    body = page2.inner_text("body")
    ok = "OBJECTIVE 3/10" in body or "OBJECTIVE 2/10" in body
    step(f"{tag}_mobile_ticker_x_of_10", ok)
    ok = page2.evaluate(
        "[...document.querySelectorAll('button')].some(b => /SCAN/i.test(b.textContent))"
    )
    step(f"{tag}_mobile_scan_button", ok)
    page2.close()

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    ctx = browser.new_context(viewport={"width": 1280, "height": 720})
    page = ctx.new_page()
    page.on("pageerror", lambda e: results["errors"].append(f"pageerror: {e}"))

    # ===== VIRAL INVASION =====
    run_mission(
        page, browser,
        "02 VIRAL INVASION", "v7", ["infectedCell", "virus"],
        ["ANTIGEN", "ANTIBODY"], "viral",
    )
    mobile_check(browser, "02 VIRAL INVASION", "viral")

    # ===== BRAIN MISSION =====
    run_mission(
        page, browser,
        "03 BRAIN MISSION", "b7", ["aneurysm", "weakWall"],
        ["ACTION POTENTIAL", "NEURON"], "brain",
    )
    mobile_check(browser, "03 BRAIN MISSION", "brain")

    browser.close()

print(json.dumps(results, indent=2))
fails = [s for s in results["steps"] if not s["ok"]]
print(f"\nSUMMARY: {len(results['steps']) - len(fails)}/{len(results['steps'])} PASS")
if results["errors"]:
    print("PAGE ERRORS:", results["errors"][:5])
