"""Probe: which anatomy does the thrombus scan hit, and does objective 2 complete?"""
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    page = browser.new_context(viewport={"width": 1280, "height": 720}).new_page()
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_function("document.body.innerText.includes('PLAY')", timeout=30000)
    # returning player: skip tutorial
    page.evaluate("localStorage.setItem('aa_tutorial','done'); window.__aa.getState().setTutorialDone(true)")
    page.evaluate("window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.5)
    page.get_by_text("HEART ATTACK RESPONSE", exact=True).click()
    page.wait_for_function("document.body.innerText.includes('BEGIN MISSION')", timeout=8000)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=30000)
    time.sleep(1.0)

    page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
    time.sleep(1.5)
    page.keyboard.press("KeyQ")
    time.sleep(2.5)
    scan = page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().activeScan.id")
    obj2 = page.evaluate("window.__aa.getState().objectives[2].done")
    phase = page.evaluate("window.__aa.getState().phase")
    print("activeScan.id:", scan, "| objective2 done:", obj2, "| phase:", phase)

    if scan:
        page.evaluate("window.__aa.getState().closeScan()")
        time.sleep(0.8)
    obj2 = page.evaluate("window.__aa.getState().objectives[2].done")
    print("objective2 after close:", obj2)

    # now try treatment
    page.evaluate("window.__aaTp && window.__aaTp(0.66, 0, 0.15)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.648, 1.2, 0.62)")
    page.keyboard.down("KeyE")
    time.sleep(6.0)
    page.keyboard.up("KeyE")
    prog = page.evaluate("window.__aa.getState().objectives[3].progress")
    done3 = page.evaluate("window.__aa.getState().objectives[3].done")
    print("treatment progress:", prog, "done:", done3)
    browser.close()
