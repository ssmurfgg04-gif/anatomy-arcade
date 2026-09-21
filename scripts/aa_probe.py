"""Probe: (a) is keyboard W reaching InputState? (b) what's on top at tutorial card coords? (c) pointer-lock available?"""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    page = browser.new_context(viewport={"width": 1280, "height": 720}).new_page()
    page.on("console", lambda m: print("CONSOLE:", m.text[:200]))
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_function("document.body.innerText.includes('PLAY')", timeout=30000)
    page.evaluate("window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_text("HEART ATTACK RESPONSE", exact=True).click()
    page.wait_for_function("document.body.innerText.includes('BEGIN MISSION')", timeout=8000)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("document.body.innerText.includes('TRAINING')", timeout=30000)
    time.sleep(1.0)

    # a) W key reach
    page.keyboard.down("KeyW")
    time.sleep(1.0)
    fwd = page.evaluate("window.__aaInput ? window.__aaInput.current.forward : 'NO __aaInput'")
    pos = page.evaluate("window.__aaRefs ? window.__aaRefs.player.pos.z : 'NO refs'")
    page.keyboard.up("KeyW")
    print("forward while W held:", fwd, "| player z:", pos)
    time.sleep(0.6)
    print("body has LOOK:", "LOOK" in page.inner_text("body"))

    # b) element on top at tutorial card center
    top = page.evaluate("""
      (() => {
        const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'SKIP');
        if (!el) return 'NO SKIP BUTTON';
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        const topEl = document.elementFromPoint(cx, cy);
        return JSON.stringify({ rect: {x: r.left, y: r.top, w: r.width, h: r.height},
          top: topEl ? topEl.tagName + '.' + (topEl.className||'').toString().slice(0,60) : 'null',
          isSkip: topEl === el });
      })()
    """)
    print("skip hit test:", top)

    # c) pointer lock availability
    lock = page.evaluate("""
      (() => {
        const c = document.querySelector('canvas');
        return 'requestPointerLock' in c ? 'supported' : 'missing';
      })()
    """)
    print("pointer lock:", lock)

    # d) what element is at screen center (reticle area)?
    center = page.evaluate("(() => { const e = document.elementFromPoint(640,360); return e ? e.tagName : 'null'; })()")
    print("center element:", center)

    browser.close()
