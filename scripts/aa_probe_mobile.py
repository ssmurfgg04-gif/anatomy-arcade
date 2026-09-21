"""Mobile emulation probe: touch controls visible? ticker placement OK?"""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        has_touch=True,
        is_mobile=True,
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    )
    page = ctx.new_page()
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_function("document.body.innerText.includes('PLAY')", timeout=30000)
    page.evaluate("localStorage.setItem('aa_tutorial','done'); window.__aa.getState().setTutorialDone(true)")
    page.evaluate("window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.6)
    page.get_by_text("HEART ATTACK RESPONSE", exact=True).click()
    page.wait_for_function("document.body.innerText.includes('BEGIN MISSION')", timeout=8000)
    page.screenshot(path="/home/z/my-project/scripts/aa_shots/m1_brief.png")
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=30000)
    time.sleep(2.5)
    page.screenshot(path="/home/z/my-project/scripts/aa_shots/m2_gameplay_touch.png")
    vis = page.evaluate("""
      (() => {
        const stick = document.querySelector('[aria-label="Movement joystick"]');
        const scan = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'SCAN');
        const pause = document.querySelector('[aria-label="Pause"]');
        return JSON.stringify({
          stick: !!stick && stick.getBoundingClientRect().width > 0,
          scan: !!scan && scan.getBoundingClientRect().width > 0,
          pause: !!pause,
        });
      })()
    """)
    print("touch controls visible:", vis)
    browser.close()
