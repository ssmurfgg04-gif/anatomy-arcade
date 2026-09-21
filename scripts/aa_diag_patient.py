"""Focused diagnostic: what happens to patientStatus during/after dissolve."""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    page = browser.new_context(viewport={"width": 1280, "height": 720}).new_page()
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_function("document.body && document.body.innerText.includes('PLAY')", timeout=25000)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    page.wait_for_function("window.__aa.getState().phase === 'MISSION_BRIEF'", timeout=8000)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(0.5)
    # skip tutorial
    page.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='SKIP')?.click()")
    time.sleep(0.5)

    # fast-forward state to the dissolve stage like the real flow
    page.evaluate("""
      const g = window.__aa.getState();
      g.completeObjectiveSilent(0);
      g.completeObjective(1); g.completeObjective(2); g.completeObjective(3);
      g.completeObjective(4); g.completeObjective(5); g.completeObjective(6);
    """)
    time.sleep(1.0)
    page.evaluate("window.__aaTp && window.__aaTp(0.66, 0, 0.15)")
    segs = [(0.648, 1.2), (0.674, 2.35), (0.700, 3.5), (0.726, 4.65)]
    for attempt in range(12):
        done = page.evaluate("window.__aa.getState().objectives[7].done")
        if done:
            break
        t, ang = segs[attempt % 4]
        page.evaluate(f"window.__aaAimAt && window.__aaAimAt({t}, {ang}, 0.62)")
        page.keyboard.down("KeyE")
        time.sleep(3.2)
        page.keyboard.up("KeyE")
        time.sleep(0.3)
    for i in range(12):
        snap = page.evaluate("""(() => {
          const g = window.__aa.getState();
          return {
            phase: g.phase,
            patient: Math.round(g.patientStatus),
            flow: +g.flowHealth.toFixed(2),
            o7: g.objectives[7].done, o8: g.objectives[8].done, o9: g.objectives[9].done,
            liveFlow: +window.__aaRefs.flow.current.toFixed(2),
          };
        })()""")
        print(i, snap)
        time.sleep(1.0)
    browser.close()
