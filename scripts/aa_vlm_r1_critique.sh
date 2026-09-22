#!/bin/bash
# VLM ROUND 1 — aggressive critique per screenshot via z-ai vision CLI.
SHOTS=/home/z/my-project/scripts/aa_vlm_r1/shots
OUT=/home/z/my-project/scripts/aa_vlm_r1
mkdir -p "$OUT"

critique() {
  local img="$1" name="$2" ctx="$3"
  if [ -f "$OUT/${name}.json" ]; then echo "SKIP $name (exists)"; return; fi
  z-ai vision \
    -p "You are a brutal AAA game director + senior UI/UX critic reviewing ANATOMY ARCADE, a browser 3D biology game (nano-robot inside the human body, dark cinematic medical-thriller look). This screenshot is: ${ctx}. Tear it apart: (1) inventory what you actually see (text verbatim where readable), (2) list every visual/UX problem you can find — layout, hierarchy, contrast, readability, composition, dead space, clipping, off-palette colors, generic-AI-slop patterns, confusing affordances, mobile-safe font sizes, anything broken or ugly, (3) name the 3 highest-impact fixes. Be harsh and specific. No praise padding." \
    -i "$img" -o "$OUT/${name}.json" 2>&1 | tail -1
  echo "DONE $name"
}

critique "$SHOTS/r1_01_landing.png"            01_landing        "desktop 1440x900 landing page / main menu hero (3D body backdrop + nav + title)"
critique "$SHOTS/r1_02_landing_modes.png"      02_landing_modes  "desktop landing page scrolled to GAME MODES + FEATURES cards"
critique "$SHOTS/r1_03_mission_select.png"     03_mission_select "desktop mission select (3 mission cards)"
critique "$SHOTS/r1_04_briefing.png"           04_briefing       "desktop mission briefing modal"
critique "$SHOTS/r1_05_intro_cinematic.png"    05_intro          "desktop intro cinematic (camera rail into the vessel)"
critique "$SHOTS/r1_06_gameplay_spawn.png"     06_gameplay_spawn "desktop first-person gameplay inside a blood vessel, HUD visible, spawn corridor"
critique "$SHOTS/r1_07_junction.png"           07_junction       "desktop gameplay at an artery branch junction with holo signage (LAD vs LCX)"
critique "$SHOTS/r1_08_scan_panel.png"         08_scan_panel     "desktop anatomical scan education panel overlay"
critique "$SHOTS/r1_09_analysis_readout.png"   09_analysis       "desktop clinical analysis readout panel (92% occlusion)"
critique "$SHOTS/r1_10_treatment.png"          10_treatment      "desktop gameplay dissolving a clot with the treatment beam"
critique "$SHOTS/r1_11_hero_heart.png"         11_hero_heart     "desktop payoff shot: real anatomical heart at the end of the artery"
critique "$SHOTS/r1_12_results.png"            12_results        "desktop mission results screen with THE BIOLOGY lesson card"
critique "$SHOTS/r1_13_mobile_landing.png"     13_mobile_landing "mobile 390x844 landing page"
critique "$SHOTS/r1_14_mobile_mission_select.png" 14_mobile_select "mobile mission select"
critique "$SHOTS/r1_15_mobile_gameplay.png"    15_mobile_gameplay "mobile first-person gameplay with touch controls + objective ticker"
critique "$SHOTS/r1_16_mobile_journal.png"     16_mobile_journal "mobile anatomy journal (BioDex) overlay"
critique "$SHOTS/r1_17_journal.png"            17_journal        "desktop anatomy journal (BioDex) overlay"

echo "ALL CRITIQUES DONE"
