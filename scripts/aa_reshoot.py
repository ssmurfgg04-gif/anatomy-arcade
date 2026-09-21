"""Mini re-shoot: junction signs + hero heart payoff after polish fixes."""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = "/home/z/my-project/scripts/aa_shots"

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
    time.sleep(0.6)
    page.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='SKIP')?.click()")

    # junction view: stand before the split, look straight ahead
    page.evaluate("window.__aaTp && window.__aaTp(0.24, 0, 0.05)")
    time.sleep(2.0)
    page.screenshot(path=f"{OUT}/v02_junction.png")

    # look INTO the spur (LCX opening)
    page.evaluate("""(async () => {
      // spur mouth approx: junction anchor + up-right; use aim world toward spur interior
      const g = window.__aa.getState();
      window.__aaAimWorld && window.__aaAimWorld(2.2, 2.2, -46);
    })()""")
    time.sleep(1.0)
    page.screenshot(path=f"{OUT}/v03_spur_mouth.png")

    # hero heart payoff
    page.evaluate("window.__aaTp && window.__aaTp(0.90, 0, 0.1)")
    page.evaluate("window.__aaAimHeart && window.__aaAimHeart()")
    time.sleep(2.5)
    page.screenshot(path=f"{OUT}/v04_hero_heart.png")
    browser.close()
print("done")
