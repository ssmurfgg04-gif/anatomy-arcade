"""Probe what intercepts the EducationPanel RESUME click."""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    page = browser.new_context(viewport={"width": 1280, "height": 720}).new_page()
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_function("document.body.innerText.includes('PLAY')", timeout=30000)
    page.evaluate("window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_text("HEART ATTACK RESPONSE", exact=True).click()
    page.wait_for_function("document.body.innerText.includes('BEGIN MISSION')", timeout=8000)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=30000)
    time.sleep(1.0)

    # open a scan panel directly
    page.evaluate("""
      const info = window.__ANATOMY_PROBE || null;
      window.__aa.getState().openScan({
        id: 'thrombus', title: 'THROMBUS', subtitle: 'A clot lodged in the flow channel.',
        body: 'test body', missionTip: 'tip', funFact: 'fact', keywords: ['x'], at: Date.now()
      });
    """)
    time.sleep(1.5)
    top = page.evaluate("""
      (() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('RESUME'));
        if (!btn) return 'NO RESUME BUTTON';
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        const el = document.elementFromPoint(cx, cy);
        const chain = [];
        let cur = el;
        while (cur && chain.length < 5) { chain.push(cur.tagName + '|' + (cur.className||'').toString().slice(0,50)); cur = cur.parentElement; }
        return JSON.stringify({rect: {x:r.left,y:r.top,w:r.width,h:r.height}, isResume: el === btn || btn.contains(el), chain});
      })()
    """)
    print("resume hit test:", top)
    browser.close()
