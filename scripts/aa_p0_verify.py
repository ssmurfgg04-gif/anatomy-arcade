"""
ANATOMY ARCADE — P0 playability E2E verification (golden path + failure state).
Walks: menu -> journal/howto overlays -> mission select -> briefing -> intro ->
tutorial steps -> scan panel -> clot treatment -> flow restore -> stabilize ->
mission complete -> results; then a fresh run forces a failure screen.
Screenshots land in scripts/aa_shots/.
"""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = Path("/home/z/my-project/scripts/aa_shots")
OUT.mkdir(parents=True, exist_ok=True)
results = {"steps": [], "errors": []}

def step(name, ok, note=""):
    results["steps"].append({"step": name, "ok": bool(ok), "note": note})
    print(("PASS " if ok else "FAIL ") + name + (" | " + note if note else ""))

def click_resume(page):
    """Close the scan panel deterministically (React onClick via JS dispatch)."""
    try:
        page.wait_for_function(
            "!document.querySelector('.animate-pulse.text-cyan-300')", timeout=20000
        )
    except Exception:
        pass
    time.sleep(1.2)
    page.evaluate(
        "[...document.querySelectorAll('button')].find(b => b.textContent.includes('RESUME'))?.click()"
    )
    try:
        page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=5000)
    except Exception:
        page.evaluate("window.__aa.getState().closeScan()")
    time.sleep(0.6)

def shot(page, name):
    page.screenshot(path=str(OUT / f"{name}.png"))

def wait_text(page, text, timeout=15000):
    page.wait_for_function(
        f"document.body && document.body.innerText.includes('{text}')",
        timeout=timeout,
    )

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    ctx = browser.new_context(viewport={"width": 1280, "height": 720})
    page = ctx.new_page()
    page.on("pageerror", lambda e: results["errors"].append(f"pageerror: {e}"))

    # ---- 1. landing -> main menu
    page.goto(BASE, wait_until="domcontentloaded")
    wait_text(page, "ANATOMY", 30000)
    wait_text(page, "PLAY", 15000)
    time.sleep(2.5)
    shot(page, "01_menu")
    step("menu_renders", True)

    # ---- 1b. landing structure: nav, game modes, features (new P5 landing)
    body = page.inner_text("body")
    ok = (
        "GAME MODES" in body.upper()
        and "HEART ATTACK RESPONSE" in body.upper()
        and "VIRAL INVASION" in body.upper()
        and "COMING SOON" in body.upper()
        and "BIODEX" in body.upper()
    )
    step("landing_structure", ok)

    # ---- 2. how-to-play overlay (MEET THE SCIENCE on the new landing)
    page.get_by_text("MEET THE SCIENCE", exact=True).click()
    wait_text(page, "DESKTOP", 5000)
    time.sleep(0.6)
    shot(page, "02_howtoplay")
    ok = "DISSOLVE THE CLOT" in page.inner_text("body")
    step("howtoplay_overlay", ok)
    page.get_by_text("CLOSE", exact=True).click()
    time.sleep(0.4)

    # ---- 3. journal overlay (BIODEX nav opens the journal)
    page.get_by_text("BIODEX", exact=True).first.click()
    wait_text(page, "ANATOMY JOURNAL", 5000)
    time.sleep(0.6)
    shot(page, "03_journal")
    ok = "UNDISCOVERED" in page.inner_text("body")
    step("journal_overlay", ok)
    page.get_by_text("CLOSE", exact=True).click()
    time.sleep(0.4)

    # ---- 4. mission select (viral/brain must be COMING SOON)
    page.get_by_text("PLAY", exact=True).click()
    wait_text(page, "SELECT MISSION", 8000)
    time.sleep(0.6)
    shot(page, "04_mission_select")
    body = page.inner_text("body")
    ok = "COMING SOON" in body and "HEART ATTACK RESPONSE" in body
    step("mission_select_honest", ok)

    # ---- 5. briefing
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page, "MISSION BRIEFING", 8000)
    time.sleep(1.0)
    shot(page, "05_briefing")
    body = page.inner_text("body")
    ok = "nano-robot" in body and "BEGIN MISSION" in body and "CARDIOVASCULAR" in body
    step("briefing_content", ok)

    # ---- 6. begin -> intro cinematic -> gameplay + tutorial
    page.get_by_text("BEGIN MISSION", exact=True).click()
    time.sleep(2.0)
    shot(page, "06_intro_cinematic")
    wait_text(page, "TRAINING", 25000)  # tutorial appears when control handover
    time.sleep(0.8)
    shot(page, "07_tutorial_move")
    body = page.inner_text("body")
    ok = "MOVE" in body and ("Hold W" in body)
    step("tutorial_step1_move", ok)

    # ---- 7. MOVE step: hold W until LOOK card appears (polling, fps-agnostic)
    page.keyboard.down("KeyW")
    try:
        page.wait_for_function("document.body.innerText.includes('LOOK')", timeout=30000)
        moved_ok = True
    except Exception:
        moved_ok = False
    page.keyboard.up("KeyW")
    step("tutorial_step2_move_to_look", moved_ok)
    shot(page, "08_tutorial_look")

    # ---- 8. LOOK step: drag-look until SCAN card appears
    page.mouse.move(500, 380)
    page.mouse.down()
    try:
        for k in range(60):
            page.mouse.move(500 + (k % 20) * 26, 380 - (k % 10) * 8, steps=2)
            if page.evaluate("document.body.innerText.includes('glowing diamond')"):
                break
            time.sleep(0.05)
        look_done = page.evaluate("document.body.innerText.includes('glowing diamond')")
    finally:
        page.mouse.up()
    time.sleep(0.5)
    step("tutorial_step3_scan", look_done, "" if look_done else "look step did not complete")
    shot(page, "09_tutorial_scan")

    if not look_done:
        page.get_by_text("SKIP", exact=True).click()
        time.sleep(1.0)

    # ---- 9. scan: teleport near first marker, aim, press Q (retry — aim race)
    scanned = False
    for attempt in range(3):
        page.evaluate("window.__aaTp && window.__aaTp(0.09, 0, 0.1)")
        page.evaluate("window.__aaAimAt && window.__aaAimAt(0.12, 2.6, 0.72)")
        time.sleep(1.0 if attempt == 0 else 0.7)
        page.keyboard.down("KeyQ")
        time.sleep(0.4)
        page.keyboard.up("KeyQ")
        time.sleep(1.5)
        if "ANATOMICAL SCAN" in page.inner_text("body"):
            scanned = True
            break
        page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().closeScan()")
    step("scan_panel_opens", scanned)
    shot(page, "10_scan_panel")
    if scanned:
        click_resume(page)

    # ---- 10. jump to locate zone -> objective progress; scan the THROMBUS (objective 03)
    page.evaluate("window.__aaTp && window.__aaTp(0.40, 0, 0.1)")
    time.sleep(1.2)
    page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
    time.sleep(1.0)
    ok = False
    for attempt in range(4):
        page.keyboard.down("KeyQ")
        time.sleep(0.4)
        page.keyboard.up("KeyQ")
        time.sleep(1.6)
        sid = page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().activeScan.id")
        if sid == "thrombus":
            ok = True
            break
        # re-aim and retry (aim may have drifted or scan hit nothing)
        page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().closeScan()")
        page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
        page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
        time.sleep(1.2)
    step("thrombus_scan_completes_objective", ok)
    obj2 = page.evaluate("window.__aa.getState().objectives[2].done")
    step("objective2_registered", obj2, f"obj2={obj2}")
    shot(page, "10b_thrombus_scan")
    if ok:
        click_resume(page)

    # ---- 11. clot treatment: rotate aim across segments, hold E until cleared
    segs = [(0.648, 1.2), (0.674, 2.35), (0.700, 3.5), (0.726, 4.65)]
    page.evaluate("window.__aaTp && window.__aaTp(0.66, 0, 0.15)")
    for attempt in range(8):
        done3 = page.evaluate("window.__aa.getState().objectives[3].done")
        if done3:
            break
        t, ang = segs[attempt % 4]
        page.evaluate(f"window.__aaAimAt && window.__aaAimAt({t}, {ang}, 0.62)")
        page.keyboard.down("KeyE")
        time.sleep(6.0)
        page.keyboard.up("KeyE")
        time.sleep(0.4)
    st = page.evaluate("window.__aa.getState().objectives.map(o=>o.done)")
    step("clot_cleared_objectives", all(st[:4]), f"objectives={st}")
    shot(page, "11_treatment")

    # ---- 12. flow restore ramps automatically -> stabilize zone
    page.evaluate("window.__aaTp && window.__aaTp(0.94, 0, 0.1)")
    try:
        page.wait_for_function(
            "window.__aa.getState().objectives.every(o=>o.done)", timeout=45000
        )
        step("restore_and_stabilize", True)
    except Exception:
        st = page.evaluate("window.__aa.getState().objectives.map(o=>o.done)")
        step("restore_and_stabilize", False, f"objectives={st}")
    shot(page, "12_flow_restored")
    try:
        wait_text(page, "MISSION COMPLETE", 25000)
        time.sleep(3.0)
        shot(page, "13_results")
        body = page.inner_text("body")
        ok = "BIO XP" in body and "TODAY YOU LEARNED" in body
        step("results_recap", ok)
        # journal accessible from results (JS dispatch: deterministic)
        page.evaluate(
            "[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'EXPLORE IN JOURNAL')?.click()"
        )
        time.sleep(1.0)
        body = page.inner_text("body")
        step("journal_from_results", "LOGGED" in body and "ANATOMY JOURNAL" in body)
        shot(page, "14_journal_filled")
        page.evaluate(
            "[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'CLOSE')?.click()"
        )
        time.sleep(0.4)
    except Exception as e:
        step("results_recap", False, str(e)[:120])

    # ---- 13. failure state: fresh mission, drain patient
    page.goto(BASE, wait_until="domcontentloaded")
    wait_text(page, "PLAY", 20000)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page, "MISSION BRIEFING", 8000)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    time.sleep(7.0)  # let intro finish
    page.evaluate("window.__aa && window.__aa.getState().setPatientStatus(0)")
    time.sleep(1.5)
    body = page.inner_text("body")
    ok = "MISSION FAILED" in body and "PATIENT LOST" in body
    step("failure_screen", ok)
    shot(page, "15_failed")
    # quick retry loop: one click back into action
    if ok:
        page.get_by_text("TRY AGAIN", exact=True).click()
        time.sleep(2.5)
        phase2 = page.evaluate("window.__aa.getState().phase")
        step("quick_retry", phase2 in ("MISSION_INTRO", "PLAYING"), f"phase={phase2}")

    # ---- 13b. pause suspension: E-hold frozen while paused (L16)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page, "MISSION BRIEFING", 8000)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    time.sleep(7.0)  # let intro finish
    # intro end fires OBJECTIVE_COMPLETE briefly (banner) — wait for control handover
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=20000)
    page.keyboard.down("KeyW")
    time.sleep(0.5)
    page.keyboard.press("Escape")
    time.sleep(0.5)
    suspended = page.evaluate("window.__aaInput && window.__aaInput.current.suspended")
    step("pause_suspends_input", bool(suspended), f"suspended={suspended}")
    shot(page, "15b_paused")
    page.get_by_text("RESUME", exact=True).first.click()
    time.sleep(0.8)
    resumed = page.evaluate("window.__aaInput && !window.__aaInput.current.suspended")
    step("resume_unfreezes_input", bool(resumed))

    # ---- 14. pause menu on mobile viewport + ticker
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(BASE, wait_until="domcontentloaded")
    wait_text(page, "PLAY", 20000)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page, "MISSION BRIEFING", 8000)
    shot(page, "16_mobile_briefing")
    page.get_by_text("BEGIN MISSION", exact=True).click()
    time.sleep(7.5)
    body = page.inner_text("body")
    ok = "OBJECTIVE" in body
    step("mobile_objective_ticker", ok)
    shot(page, "17_mobile_gameplay")

    browser.close()

print(json.dumps(results, indent=2))
fails = [s for s in results["steps"] if not s["ok"]]
print(f"\nSUMMARY: {len(results['steps']) - len(fails)}/{len(results['steps'])} passed, {len(fails)} failed, {len(results['errors'])} page errors")
sys.exit(0)
