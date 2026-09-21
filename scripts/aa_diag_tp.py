"""Instrumented: what is player.t doing after tp? Is the heart visible?"""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = "/home/z/my-project/scripts/aa_shots"

STATE = """(() => {
  const g = window.__aa.getState();
  const p = window.__aaRefs ? window.__aaRefs.player : null;
  return {
    phase: g.phase,
    t: p ? +p.t.toFixed(3) : -1,
    pos: p ? p.pos.toArray().map(v=>+v.toFixed(1)) : [],
    cur: g.currentObjective,
    patient: Math.round(g.patientStatus),
    xp: g.score,
  };
})()"""

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    page = browser.new_context(viewport={"width": 1280, "height": 720}).new_page()
    page.on("pageerror", lambda e: print("PAGEERROR:", str(e)[:200]))
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_function("document.body && document.body.innerText.includes('PLAY')", timeout=25000)
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    page.wait_for_function("window.__aa.getState().phase === 'MISSION_BRIEF'", timeout=8000)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(0.6)
    page.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='SKIP')?.click()")
    time.sleep(0.5)
    print("helpers:", page.evaluate("({tp: !!window.__aaTp, aim: !!window.__aaAimAt, heart: !!window.__aaAimHeart, warp: !!window.__aaWarp})"))

    for label, tval in [("nav", 0.10), ("junc", 0.26), ("mid", 0.55), ("late", 0.90)]:
        page.evaluate(f"window.__aaTp && window.__aaTp({tval}, 0, 0.1)")
        for k in range(3):
            time.sleep(0.8)
            print(label, k, page.evaluate(STATE))
        page.screenshot(path=f"{OUT}/w_{label}.png")
    browser.close()
print("done")
