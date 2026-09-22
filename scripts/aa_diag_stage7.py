"""Reproduce viral stage-7 scan miss exactly as the E2E drives it, with instrumentation."""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    page = browser.new_context(viewport={"width": 1280, "height": 720}).new_page()
    page.on("pageerror", lambda e: print("PAGEERROR:", str(e)[:200]))
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_function("document.body.innerText.includes('PLAY')", timeout=25000)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name="02 VIRAL INVASION").click()
    page.wait_for_function("document.body.innerText.includes('MISSION BRIEFING')", timeout=8000)
    time.sleep(0.8)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(1.0)

    # stage 3-4
    page.evaluate("window.__aaTp && window.__aaTp(0.25, 0, 0.1)")
    time.sleep(1.5)
    page.evaluate("window.__aaTp && window.__aaTp(0.45, 0, 0.1)")
    time.sleep(1.5)

    # stage 5 calibrate scan (like E2E)
    page.evaluate("window.__aaTp && window.__aaTp(0.30, 0, 0.1)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.33, 0.8, 0.5)")
    time.sleep(1.0)
    page.keyboard.down("KeyQ"); time.sleep(0.4); page.keyboard.up("KeyQ")
    time.sleep(1.5)
    sid5 = page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().activeScan.id")
    print("STAGE5 sid:", sid5)
    # resume like E2E
    try:
        page.wait_for_function("!document.querySelector('.animate-pulse.text-cyan-300')", timeout=20000)
    except Exception:
        pass
    time.sleep(1.0)
    page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('RESUME'))?.click()")
    try:
        page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=5000)
    except Exception:
        page.evaluate("window.__aa.getState().closeScan()")
    time.sleep(0.6)

    # stage 6
    page.evaluate("window.__aaTp && window.__aaTp(0.58, 0, 0.1)")
    time.sleep(1.5)
    print("objs:", page.evaluate("window.__aa.getState().objectives.map(o=>o.done)"))

    # stage 7 exactly like E2E
    page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
    time.sleep(1.0)
    diag = page.evaluate("""(() => {
      const refs = window.__aaRefs;
      return {
        player: refs.player.pos.toArray().map(v=>+v.toFixed(2)),
        playerT: refs.player.t,
        targetCount: refs.scanTargets.current.length,
      };
    })()""")
    print("pre-scan diag:", diag)
    page.keyboard.down("KeyQ"); time.sleep(0.4); page.keyboard.up("KeyQ")
    time.sleep(1.6)
    st = page.evaluate("""(() => {
      const g = window.__aa.getState();
      return { phase: g.phase, sid: g.activeScan && g.activeScan.id, objs: g.objectives.map(o=>o.done) };
    })()""")
    print("STAGE7 result:", st)

    # if panel open, dump its title; try raycast manually from live camera
    ray = page.evaluate("""(() => {
      return "n/a";
    })()""")
    browser.close()
