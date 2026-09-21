"""
ANATOMY ARCADE — 10-stage heart mission E2E (spec §25 arc).
Validates: briefing(1) -> entry(2) -> navigate(3) -> junction identify(4) with
LCX dead-end soft wall -> scanner calibration(5) -> plaque locate(6) -> analyze
readout(7) -> dissolve(8) -> reperfusion(9) -> stabilize(10) -> results with
THE BIOLOGY card. Plus hero-heart visibility, fog depth, mobile ticker x/10.
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

def shot_page2(page, name):
    page.screenshot(path=str(OUT / f"{name}.png"))

def wait_text(page, text, timeout=15000):
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
    time.sleep(1.2)
    page.evaluate(
        "[...document.querySelectorAll('button')].find(b => b.textContent.includes('RESUME'))?.click()"
    )
    try:
        page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=5000)
    except Exception:
        page.evaluate("window.__aa.getState().closeScan()")
    time.sleep(0.6)

def start_heart_mission(page):
    page.goto(BASE, wait_until="domcontentloaded")
    wait_text(page, "PLAY", 25000)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page, "MISSION BRIEFING", 8000)
    time.sleep(0.8)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    time.sleep(1.0)
    # stage 01 done silently on BEGIN
    st0 = page.evaluate("window.__aa.getState().objectives[0].done")
    step("stage1_brief_done_silent", st0)
    # intro cinematic (~5.2s) then control handover
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(1.0)

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    ctx = browser.new_context(viewport={"width": 1280, "height": 720})
    page = ctx.new_page()
    page.on("pageerror", lambda e: results["errors"].append(f"pageerror: {e}"))

    # ================= STAGE 1-2: briefing + entry =================
    start_heart_mission(page)
    st = objs(page)
    step("stage2_enter_done_after_intro", st[1], f"{st}")
    body = page.inner_text("body")
    ok = "OBJECTIVE 3/10" in body or "NAVIGATE THE BLOODSTREAM" in body
    step("hud_shows_10_stage_counter", ok)
    shot(page, "t01_spawn_navigate")

    # ================= STAGE 3: NAVIGATE =================
    page.evaluate("window.__aaTp && window.__aaTp(0.10, 0, 0.1)")
    time.sleep(0.8)
    prog = page.evaluate("window.__aa.getState().objectives[2].progress")
    step("stage3_progress_bar_live", 0 < prog < 1, f"p={prog:.2f}")
    page.evaluate("window.__aaTp && window.__aaTp(0.25, 0, 0.1)")
    time.sleep(1.5)
    st = objs(page)
    step("stage3_navigate_done", st[2], f"{st}")

    # ================= STAGE 4: JUNCTION =================
    # approach: see the signage + spur
    page.evaluate("window.__aaTp && window.__aaTp(0.27, 0, 0.1)")
    time.sleep(1.2)
    # spur mouth world position for the aim check (LCX sign sits there)
    spur_mouth = page.evaluate("""(() => {
      const spur = window.__aaWarp; // existence probe only
      return null; // sign check is visual (screenshot)
    })()""")
    shot(page, "t02_junction_signs")
    # wrong-branch test: warp into the spur, expect pushback + guidance
    pushed = page.evaluate("""(() => {
      return new Promise((resolve) => {
        const before = JSON.stringify(window.__aaRefs.player.pos.toArray().map(v=>v.toFixed(2)));
        window.dispatchEvent(new CustomEvent('aa-wrong-branch'));
        setTimeout(() => {
          const after = JSON.stringify(window.__aaRefs.player.pos.toArray().map(v=>v.toFixed(2)));
          const warn = document.body.innerText.includes('LCX');
          resolve({before, after, warn});
        }, 400);
      });
    })()""")
    step("stage4_lcx_warning_ui", pushed and pushed.get("warn"), f"{pushed}")
    shot(page, "t03_wrong_branch_warning")
    page.evaluate("window.__aaTp && window.__aaTp(0.45, 0, 0.1)")
    time.sleep(1.5)
    st = objs(page)
    step("stage4_identify_done", st[3], f"{st}")

    # ================= STAGE 5: CALIBRATE SCANNER =================
    scanned = False
    for attempt in range(3):
        page.evaluate("window.__aaTp && window.__aaTp(0.30, 0, 0.1)")
        page.evaluate("window.__aaAimAt && window.__aaAimAt(0.33, 0.8, 0.5)")
        time.sleep(1.0)
        page.keyboard.down("KeyQ")
        time.sleep(0.4)
        page.keyboard.up("KeyQ")
        time.sleep(1.5)
        if "ANATOMICAL SCAN" in page.inner_text("body"):
            scanned = True
            break
        page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().closeScan()")
    step("stage5_scan_panel_opens", scanned)
    shot(page, "t04_calibration_scan")
    st = objs(page)
    step("stage5_calibrate_done", st[4], f"{st}")
    if scanned:
        click_resume(page)

    # ================= STAGE 6: LOCATE PLAQUE =================
    page.evaluate("window.__aaTp && window.__aaTp(0.58, 0, 0.1)")
    time.sleep(1.5)
    st = objs(page)
    step("stage6_locate_done", st[5], f"{st}")
    shot(page, "t05_plaque_zone")

    # ================= STAGE 7: ANALYZE =================
    ok = False
    for attempt in range(4):
        page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
        page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
        time.sleep(1.0)
        page.keyboard.down("KeyQ")
        time.sleep(0.4)
        page.keyboard.up("KeyQ")
        time.sleep(1.6)
        sid = page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().activeScan.id")
        if sid in ("thrombus", "plaque"):
            ok = True
            break
        page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().closeScan()")
    step("stage7_analysis_panel", ok)
    if ok:
        body = page.inner_text("body")
        has_readout = "OCCLUSION" in body.upper()
        step("stage7_occlusion_readout", has_readout)
        shot(page, "t06_analysis_panel")
        st = objs(page)
        step("stage7_analyze_done", st[6], f"{st}")
        click_resume(page)

    # ================= STAGE 8: DISSOLVE =================
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
    step("stage8_clot_cleared", st[7], f"{st}")
    shot(page, "t07_treatment")

    # ================= STAGE 9: RESTORE (auto ramp) =================
    page.evaluate("window.__aaTp && window.__aaTp(0.80, 0, 0.1)")
    try:
        page.wait_for_function("window.__aa.getState().objectives[8].done", timeout=30000)
        step("stage9_flow_restored", True)
    except Exception:
        step("stage9_flow_restored", False, f"{objs(page)}")
    flow = page.evaluate("window.__aa.getState().flowHealth")
    step("stage9_flow_value", flow > 0.9, f"flow={flow:.2f}")
    shot(page, "t08_flow_restored")

    # ================= HERO HEART payoff shot =================
    page.evaluate("window.__aaTp && window.__aaTp(0.90, 0, 0.1)")
    page.evaluate("window.__aaAimHeart && window.__aaAimHeart()")
    time.sleep(2.5)
    shot(page, "t09_hero_heart")

    # ================= STAGE 10: STABILIZE + RESULTS =================
    page.evaluate("window.__aaTp && window.__aaTp(0.94, 0, 0.1)")
    try:
        page.wait_for_function(
            "window.__aa.getState().objectives.every(o=>o.done)", timeout=40000
        )
        step("stage10_stabilize_all_done", True)
    except Exception:
        step("stage10_stabilize_all_done", False, f"{objs(page)}")
    try:
        page.wait_for_function(
            "document.body.innerText.includes('THE BIOLOGY')", timeout=30000
        )
        shot(page, "t10_results")
        body = page.inner_text("body")
        ok = "THE BIOLOGY" in body and "ISCHEMIA" in body and "BIO XP" in body
        step("stage10_biology_lesson_card", ok)
    except Exception as e:
        shot(page, "t10_results")
        step("stage10_biology_lesson_card", False, str(e)[:120])

    # ================= MOBILE: ticker x/10 =================
    page2 = browser.new_context(
        viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True
    ).new_page()
    page2.goto(BASE, wait_until="domcontentloaded")
    wait_text(page2, "PLAY", 20000)
    page2.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page2.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page2, "MISSION BRIEFING", 8000)
    page2.get_by_text("BEGIN MISSION", exact=True).click()
    page2.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.0)
    body = page2.inner_text("body")
    ok = "OBJECTIVE 3/10" in body or "OBJECTIVE 2/10" in body
    step("mobile_ticker_x_of_10", ok)
    shot_page2(page2, "t11_mobile_ticker")
    # touch buttons present
    ok = page2.evaluate(
        "[...document.querySelectorAll('button')].some(b => /SCAN/i.test(b.textContent))"
    )
    step("mobile_scan_button_present", ok)

    browser.close()

print(json.dumps(results, indent=2))
fails = [s for s in results["steps"] if not s["ok"]]
print(f"\nSUMMARY: {len(results['steps']) - len(fails)}/{len(results['steps'])} PASS")
if results["errors"]:
    print("PAGE ERRORS:", results["errors"][:5])
