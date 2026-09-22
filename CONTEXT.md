# ANATOMY ARCADE — AGENT CONTEXT (LIVING DOCUMENT)

> Single source of truth for every agent (main or parallel subagent).
> Update this file when phases complete. Append raw history to `worklog.md`.
> Persistent memory additionally stored via **cortexm** (repo: `ssmurfgg04-gif/context-m`).

## Project identity

- **Name:** ANATOMY ARCADE
- **Tagline:** ENTER THE BODY. SAVE THE PATIENT. LEARN HOW IT WORKS.
- **One-liner:** Premium playable 3D biology game — microscopic nano-robot inside the human body solving biological emergencies.
- **Stack:** Next.js (App Router) + React + React Three Fiber + Three.js + Drei + Zustand (game state) + Tailwind (UI chrome) + Qwen (server-side educational explanations, z-ai-web-dev-sdk).
- **GitHub:** https://github.com/ssmurfgg04-gif/anatomy-arcade (token auth, push at every milestone)
- **Canonical spec:** `PROJECT.md` (66 sections — always obey; key mandates: taste-skill first, asset-first with licenses in docs/ASSETS.md, 5 VLM critique rounds logged in docs/VLM-CRITIQUE.md, heart mission = vertical slice, mobile = first-class).

## Visual direction

- **Concept:** "MICROSCOPIC SCI-FI MEDICAL THRILLER" — AAA sci-fi + medical visualization + glowing biology + dark cinematic + restrained neon.
- **Palette (restrained):** near-black biological background (#05070B range), deep crimson arterial (#8B0F2B→#C21E3A), oxygen cyan interface (#2DD9E8 range), subtle white type, danger amber/red states.
- **Type:** distinctive display face for title + highly readable UI face + consistent numerics (max 2 families).
- **Forbidden:** generic purple AI gradients, glassmorphism spam, dashboard cards, emoji UI, RGB neon soup, lorem ipsum, fake metrics, "AI slop" (spec §45).
- **Taste Skill settings:** DESIGN_VARIANCE 7–8, MOTION_INTENSITY 7–9, VISUAL_DENSITY 4–6.

## Build phases

| Phase | Scope | Status |
|-------|-------|--------|
| P0 | Repo + context system + taste skill install | ✅ DONE |
| P1 | Scaffold Next.js + R3F + game folder structure | ✅ DONE |
| P2 | Core game engine: state machine, controls (WASD/mouse + touch joystick), camera modes, player feel | ✅ DONE |
| P3 | HEART MISSION vertical slice: vessel world, blood flow, plaque/clot, intervention, flow-restored payoff | ✅ PLAYABLE E2E (browser-verified) |
| P4 | Assets: research DONE (docs/ASSET-RESEARCH.md); repo-lessons DONE (docs/RESEARCH, 19 repos); **downloads DONE without Sketchfab** — BodyParts3D 4.0 via ashemag/human-atlas (CC BY 4.0): heart_hero.glb 57.8k tris + coronary_artery.glb + body_silhouette.glb; hero heart WIRED into mission finale; credit in CREDITS overlay | ✅ DONE (no token needed) |
| P5 | Landing page per user's UI reference image (nav/hero/organ labels/game modes/features) + MenuScene polish + 30Hz demand-loop | ✅ DONE (E2E verified) |
| P5.5 | Engine feel/perf pass: config.ts frozen constants, murmur QualityGovernor (renderScale + tier hysteresis), distance-smoothed chase cam + speed FOV + micro-roll, i-frames + slide collision, biconcave spinning RBCs + player wake, pause suspension, lock-on/dissolve/flow sfx | ✅ DONE |
| P5.7 | **10-stage heart mission rework (spec §25-40)**: briefing→entry→navigate→LAD/LCX junction (spur + soft wall + signage)→scanner calibration→plaque→analysis readout (92% occlusion)→dissolve→reperfusion→stabilize + THE BIOLOGY lesson card; living bloodstream (depth fog, WBCs, RBC size variety, junction turbulence, zone lights); HUD OBJECTIVE x/10 + ████░░ block bars + desktop/mobile prompts + NEW BIODex ENTRY toast; patient-vitals stale-snapshot bug fixed | ✅ DONE (E2E 20/20) |
| P6 | Educational layer + Qwen scan integration (server route, validated, static fallback); BioDex v2 = 3D body map (body_silhouette.glb ghost + organ pins + region filters) + heart_hero.glb entry previews + scan journal | ✅ DONE (subagent-built, QA 14/14) |
| P7 | Viral Invasion + Brain Mission — 10-stage arc cloned onto shared parameterized tube engine (levels/shared: world/SharedTube/SharedCells/SharedPlayer/SharedJunction); viral = bronchiole→acinus w/ colonies + alveolar-sac payoff; brain = cerebral artery w/ aneurysm bulge + neural web signal pulses + synapse cavern; all three missions READY | ✅ DONE (E2E 32/32) |
| P8 | Audio, polish, performance tiers, mobile hardening — haptics (scan/lock/dissolve/impact/payoff), motionReduced gates in-game shake+roll, viewport already hardened, spotlight blowout fix (110/90→72/58), per-mission bg=fog color, cell flow-recycle law. REMAINING: real-device pass (spec §39) | ✅ SANDBOX SCOPE DONE (real-device pass pending) |
| P9 | 5× VLM critique rounds: ROUND 1 structure (17 shots, 8 findings fixed) + ROUND 2 visual quality (16 shots, mobile whiteout + cell blobs + void fixed) logged in docs/VLM-CRITIQUE.md. REMAINING: rounds 3-5 (game feel / mobile / red-team) | 🔶 ROUNDS 1-2 DONE |

## Priority law (spec §47/§61)

1. Heart Attack Response  2. Main Menu  3. Full-Body Explorer  4. Viral  5. Brain.
Never sacrifice the working heart mission for another half-finished feature.

## Key decisions log

- D1 (P0): Project repo = `anatomy-arcade`; spec stored verbatim as `PROJECT.md`.
- D2 (P0): Context durability = 3 layers: GitHub pushes (milestones) + `CONTEXT.md`/`worklog.md` in-repo + cortexm facts exported into `context-m` repo.
- D3 (P0): Parallel agents must append `worklog.md` + update `CONTEXT.md` + push. Never force-push shared branches.
- D4 (P4c): Sketchfab is DEAD as a source (no token, login broken). Open no-auth pipeline = GitHub mirrors of open data. BodyParts3D 4.0 via ashemag/human-atlas (MIT code + CC BY 4.0 data) is the anatomy asset backbone; extract script `scripts/asset_check/extract_atlas_heart.py`.
- D5 (P5.7): Heart mission = the spec §25 10-stage arc; objectives are 10 rows (`brief..stabilize`). Brief completes silently on BEGIN (no banner before the intro cinematic). Analysis completes on scan of thrombus/plaque (panel = the feedback). LCX spur is a soft-wall dead end that teaches, never damages.
- D6 (P5.7): VITALS LAW — never read a frame-stale `getState()` snapshot for values another branch of the same useFrame mutated (the drift line was zeroing the restore ramp's patientStatus every frame). Mid-frame store writers must re-read fresh state.
- D7 (P5.7): QA helpers on window (`__aaTp`, `__aaWarp`, `__aaAimWorld`, `__aaAimHeart`, `__aaAimAt`) are load-bearing for E2E; keep them in sync with layout constants. Probe-side globals: `__aaRefs` is the ACTIVE mission's refs object (NO `.current`) — GameCanvas swaps it per mission; refs share the player/flow/beat/hitWall/particleCount/scanTargets/introProgress/introStart/targetDist/dissolved contract across missions.
- D8 (P7): NEW MISSIONS CLONE THE HEART ARC — do not refactor heart files to "share"; the shared engine lives in src/game/levels/shared/ and heart keeps its own proven copies. Stage INDICES are identical across missions (brief=0 … stabilize=9), which page.tsx + failProgress rely on.
- D9 (P7): SCAN AIM-ASSIST LAW — resolveScanTarget (shared/world.ts): exact raycast first, then 20° cone, nearest angle wins. Flight drift makes pure raycasts flaky (~4° wobble vs 2.6° marker).
- D10 (P9 R2): CELL FLOW-RECYCLE LAW — cells wrap at t=0.86 (never reach 1.0) so stabilize + payoff corridors stay clear; near-camera smooth shrink inside 0.95 u; player spotlight 72/58 (110/90 blew out mobile close-ups).

## Environment notes

- Sandbox wipes: ALWAYS verify disk state first (`ls /home/z/my-project/`); recover by cloning from GitHub with token before rebuilding.
- GitHub auth: user provides the PAT token at runtime (kept out of repo files per push protection). Remote URLs embed it only transiently in git config.
- Bun is the package manager; never npm-install inside repo (breaks bun lockfile).
- SwiftShader/Playwright screenshots need 8–12s waits; check `free -m` before heavy visual runs (dev server can OOM).

## Next actions (pick up here)

1. P9 rounds 3-5: GAME FEEL round (record input-to-photon feel, camera handoffs), MOBILE round (real-device pass per spec §39 — haptics + touch + governor on real hardware), RED-TEAM round (adversarial: try to break missions, exploit soft walls, fail states).
2. Real-device mobile pass: verify touch controls + haptics + governor on actual phones; spec §39.
3. Qwen route: verify latency + caching on prod; scan history persistence (localStorage) as P6 polish.
4. Optional niceties: scan-panel typewriter skip on tap; BioDex entry deep-link from results screen; mission select rank badges per mission (persist best score).

## Verified working (browser, 2026-09-22)

- HEART 10-stage E2E: 20/20 PASS (aa_p6_ten_stages.py) — re-verified after every P7/P8 change.
- VIRAL 10-stage E2E: 16/16 PASS incl. mobile ticker + touch buttons (aa_p7_missions.py).
- BRAIN 10-stage E2E: 16/16 PASS incl. mobile (aa_p7_missions.py) — aneurysm bulge geometry + aim-assist.
- BioDex v2: body map renders (desktop + mobile QA 14/14), region filters, entry mesh previews.
- Qwen /api/explain returns AI-enhanced validated JSON; static fallback guaranteed.
- Golden path unchanged: menu → mission select → cinematic intro → flight → scan → treat → restore → stabilize → results (S-rank path intact).
