"""Diagnose brain mission stage-7 scan miss: inspect scanTargets + ray hits."""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    page = browser.new_context(viewport={"width": 1280, "height": 720}).new_page()
    page.on("console", lambda m: print("CONSOLE:", m.text[:200]))
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_function("document.body.innerText.includes('PLAY')", timeout=25000)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name="03 BRAIN MISSION").click()
    page.wait_for_function("document.body.innerText.includes('MISSION BRIEFING')", timeout=8000)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(1.5)

    # force-complete early stages
    page.evaluate("""(() => {
      const g = window.__aa.getState();
      [2,3,4,5,6].forEach(i => { if (!g.objectives[i].done) g.completeObjectiveSilent(i); });
    })()""")
    page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
    time.sleep(1.0)

    diag = page.evaluate("""(() => {
      const refs = window.__aaRefs;
      const out = { targetCount: refs.scanTargets.current.length, targets: [] };
      refs.scanTargets.current.forEach((t, i) => {
        out.targets.push({
          i,
          id: t.userData.anatomyId,
          pos: t.position.toArray().map(v => +v.toFixed(1)),
          visible: t.visible,
          inScene: !!t.parent,
        });
      });
      out.player = refs.player.pos.toArray().map(v => +v.toFixed(1));
      out.playerT = refs.player.t;
      return out;
    })()""")
    print("DIAG:", diag)

    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
    time.sleep(0.8)
    page.keyboard.down("KeyQ"); time.sleep(0.4); page.keyboard.up("KeyQ")
    time.sleep(1.8)
    sid = page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().activeScan.id")
    phase = page.evaluate("window.__aa.getState().phase")
    print("SCAN RESULT:", sid, "phase:", phase)

    # manual raycast from the browser
    ray = page.evaluate("""(() => {
      return "manual-ray-check-skipped";
    })()""")
    browser.close()
