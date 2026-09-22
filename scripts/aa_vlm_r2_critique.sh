#!/bin/bash
# VLM ROUND 2 — visual quality pass on the post-fix build incl. new missions + BioDex.
SHOTS=/home/z/my-project/scripts/aa_vlm_r2/shots
OUT=/home/z/my-project/scripts/aa_vlm_r2
mkdir -p "$OUT"

critique() {
  local img="$1" name="$2" ctx="$3"
  if [ -f "$OUT/${name}.json" ]; then echo "SKIP $name"; return; fi
  z-ai vision \
    -p "You are a brutal AAA game director reviewing ANATOMY ARCADE (browser 3D biology game, dark cinematic medical-thriller). This is ROUND 2 — a previous round's fixes were applied. Screenshot: ${ctx}. Score /10 for visual quality, then list remaining problems (max 5, ranked by impact) and the single highest-impact fix. Note anything FIXED vs typical round-1 issues (HUD clutter, bottom-center tutorial boxes blocking view, screen-filling cell blobs, unreadable panels). Be specific and harsh but fair." \
    -i "$img" -o "$OUT/${name}.json" 2>&1 | tail -1
  echo "DONE $name"
}

critique "$SHOTS/r2_01_landing.png"          v2_01_landing      "desktop landing hero (title size reduced, shadows added)"
critique "$SHOTS/r2_02_mission_select.png"   v2_02_select       "desktop mission select (controls legend removed, 3 missions READY)"
critique "$SHOTS/r2_03_briefing.png"         v2_03_briefing     "desktop mission briefing (wider, corner brackets, red threat / amber objective)"
critique "$SHOTS/r2_04_heart_junction_hud.png" v2_04_hud        "desktop gameplay at artery junction w/ redesigned HUD objective panel (collapsed completed) + reticle-anchored hint pill"
critique "$SHOTS/r2_05_analysis_panel_v2.png"  v2_05_analysis   "desktop analysis readout panel (tightened layout, header badges)"
critique "$SHOTS/r2_06c_hero_heart.png"      v2_06_heart        "desktop hero-heart payoff (cells recycled away, rim light)"
critique "$SHOTS/r2_07b_viral_spawn.png"     v2_07_viral        "desktop VIRAL INVASION spawn: coral airway tube, RLL sign, open corridor"
critique "$SHOTS/r2_09_viral_colonies.png"   v2_09_colonies     "desktop viral colonies (treat targets) in infected zone"
critique "$SHOTS/r2_13d_brain_cavern.png"    v2_13_cavern       "desktop BRAIN MISSION payoff: neuron soma + nucleus + dendrites in the dark"
critique "$SHOTS/r2_14_biodex_filled.png"    v2_14_biodex       "desktop BioDex v2: 3D translucent body map w/ organ pins + region filters + entry cards w/ heart mesh previews"
critique "$SHOTS/r2_15_mobile_viral.png"     v2_15_mobile_viral "mobile 390x844 viral gameplay w/ touch controls"
critique "$SHOTS/r2_16_mobile_brain.png"     v2_16_mobile_brain "mobile brain gameplay w/ touch controls"

echo "ROUND 2 CRITIQUES DONE"
