"""VLM ROUND 2 capture — full build: 3 missions + BioDex v2 + new HUD."""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = Path("/home/z/my-project/scripts/aa_vlm_r2/shots")
OUT.mkdir(parents=True, exist_ok=True)

def wait_text(page, text, timeout=25000):
    page.wait_for_function(f"document.body && document.body.innerText.includes('{text}')", timeout=timeout)

def shot(page, name):
    page.screenshot(path=str(OUT / f"{name}.png"))
    print("SHOT", name)

def click_resume(page):
    try:
        page.wait_for_function("!document.querySelector('.animate-pulse.text-cyan-300')", timeout=20000)
    except Exception:
        pass
    time.sleep(1.0)
    page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('RESUME'))?.click()")
    try:
        page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=6000)
    except Exception:
        page.evaluate("window.__aa.getState().closeScan()")
    time.sleep(0.6)

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-gl=swiftshader"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    # landing (post-fix)
    page.goto(BASE, wait_until="domcontentloaded")
    wait_text(page, "PLAY", 30000)
    time.sleep(4.0)
    shot(page, "r2_01_landing")

    # HEART: new HUD panel + hint pill + junction
    page.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(1.0)
    shot(page, "r2_02_mission_select")
    page.get_by_role("button", name="01 HEART ATTACK RESPONSE").click()
    wait_text(page, "MISSION BRIEFING", 10000)
    time.sleep(1.2)
    shot(page, "r2_03_briefing")
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.0)
    page.evaluate("window.__aaTp && window.__aaTp(0.27, 0, 0.1)")
    time.sleep(2.2)
    shot(page, "r2_04_heart_junction_hud")
    # heart analysis panel (post-fix layout)
    page.evaluate("window.__aaTp && window.__aaTp(0.62, 0, 0.12)")
    page.evaluate("window.__aaAimAt && window.__aaAimAt(0.68, 1.2, 0.5)")
    time.sleep(1.0)
    page.keyboard.down("KeyQ"); time.sleep(0.4); page.keyboard.up("KeyQ")
    time.sleep(1.8)
    sid = page.evaluate("window.__aa.getState().activeScan && window.__aa.getState().activeScan.id")
    if sid in ("thrombus", "plaque"):
        shot(page, "r2_05_analysis_panel_v2")
    page.evaluate("window.__aa.getState().closeScan()")
    # hero heart with rim light
    page.evaluate("window.__aaTp && window.__aaTp(0.90, 0, 0.1)")
    page.evaluate("window.__aaAimHeart && window.__aaAimHeart()")
    time.sleep(2.5)
    shot(page, "r2_06_hero_heart_rim")

    # VIRAL: gameplay, junction, colonies, sac payoff
    page.evaluate("window.__aa.getState().resetMission()")
    page.evaluate("window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.8)
    page.get_by_role("button", name="02 VIRAL INVASION").click()
    wait_text(page, "MISSION BRIEFING", 10000)
    time.sleep(1.0)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.0)
    shot(page, "r2_07_viral_spawn")
    page.evaluate("window.__aaTp && window.__aaTp(0.27, 0, 0.1)")
    time.sleep(2.0)
    shot(page, "r2_08_viral_junction")
    page.evaluate("window.__aaTp && window.__aaTp(0.66, 0, 0.15)")
    time.sleep(1.5)
    shot(page, "r2_09_viral_colonies")
    page.evaluate("window.__aaTp && window.__aaTp(0.90, 0, 0.1)")
    page.evaluate("window.__aaAimHeart && window.__aaAimHeart()")
    time.sleep(2.5)
    shot(page, "r2_10_viral_sac")

    # BRAIN: gameplay, aneurysm, web pulses, cavern
    page.evaluate("window.__aa.getState().resetMission()")
    page.evaluate("window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.8)
    page.get_by_role("button", name="03 BRAIN MISSION").click()
    wait_text(page, "MISSION BRIEFING", 10000)
    time.sleep(1.0)
    page.get_by_text("BEGIN MISSION", exact=True).click()
    page.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.0)
    shot(page, "r2_11_brain_spawn")
    page.evaluate("window.__aaTp && window.__aaTp(0.66, 0, 0.15)")
    time.sleep(1.5)
    shot(page, "r2_12_brain_aneurysm")
    page.evaluate("window.__aaTp && window.__aaTp(0.90, 0, 0.1)")
    page.evaluate("window.__aaAimHeart && window.__aaAimHeart()")
    time.sleep(2.5)
    shot(page, "r2_13_brain_cavern")

    # BioDex with discoveries injected
    page.evaluate("window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.8)
    page.evaluate("""(() => {
      const g = window.__aa.getState();
      const ids = ["heartChamber", "coronaryArtery", "thrombus", "neuron", "alveolus"];
      ids.forEach((id, i) => {
        const info = { id, title: id.toUpperCase(), subtitle: "Injected for QA", body: "Body", missionTip: "Tip", funFact: "Fact", keywords: [], at: Date.now() + i };
        g.openScan(info); g.closeScan();
      });
    })()""")
    time.sleep(0.5)
    page.evaluate("window.__aa.getState().setUiOverlay('JOURNAL')")
    time.sleep(4.0)
    shot(page, "r2_14_biodex_filled")
    page.evaluate("window.__aa.getState().setUiOverlay(null)")

    # MOBILE: viral + brain gameplay
    page2 = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True).new_page()
    page2.goto(BASE, wait_until="domcontentloaded")
    wait_text(page2, "PLAY", 25000)
    page2.evaluate("window.__aa && window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.8)
    page2.get_by_role("button", name="02 VIRAL INVASION").click()
    wait_text(page2, "MISSION BRIEFING", 10000)
    page2.get_by_text("BEGIN MISSION", exact=True).click()
    page2.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.5)
    shot(page2, "r2_15_mobile_viral")
    page2.evaluate("window.__aa.getState().setPhase('MISSION_SELECT')")
    time.sleep(0.8)
    page2.get_by_role("button", name="03 BRAIN MISSION").click()
    wait_text(page2, "MISSION BRIEFING", 10000)
    page2.get_by_text("BEGIN MISSION", exact=True).click()
    page2.wait_for_function("window.__aa.getState().phase === 'PLAYING'", timeout=25000)
    time.sleep(2.5)
    shot(page2, "r2_16_mobile_brain")

    browser.close()

print("CAPTURE DONE")
