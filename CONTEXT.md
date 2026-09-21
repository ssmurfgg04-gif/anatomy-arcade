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
| P1 | Scaffold Next.js + R3F + game folder structure | IN PROGRESS |
| P2 | Core game engine: state machine, controls (WASD/mouse + touch joystick), camera modes, player feel | PENDING |
| P3 | HEART MISSION vertical slice: vessel world, blood flow, plaque/clot, intervention, flow-restored payoff | PENDING |
| P4 | Assets: research + download (Sketchfab CC / procedural / Meshy-selective), optimize (Draco/meshopt), ASSETS.md | PENDING |
| P5 | Main menu + mission select + full-body explorer | PENDING |
| P6 | Educational layer + Qwen scan integration (server route, validated, static fallback) | PENDING |
| P7 | Viral Invasion + Brain Mission | PENDING |
| P8 | Audio, polish, performance tiers, mobile hardening | PENDING |
| P9 | 5× VLM critique rounds (logged + fixes applied) + final audit | PENDING |

## Priority law (spec §47/§61)

1. Heart Attack Response  2. Main Menu  3. Full-Body Explorer  4. Viral  5. Brain.
Never sacrifice the working heart mission for another half-finished feature.

## Key decisions log

- D1 (P0): Project repo = `anatomy-arcade`; spec stored verbatim as `PROJECT.md`.
- D2 (P0): Context durability = 3 layers: GitHub pushes (milestones) + `CONTEXT.md`/`worklog.md` in-repo + cortexm facts exported into `context-m` repo.
- D3 (P0): Parallel agents must append `worklog.md` + update `CONTEXT.md` + push. Never force-push shared branches.

## Environment notes

- Sandbox wipes: ALWAYS verify disk state first (`ls /home/z/my-project/`); recover by cloning from GitHub with token before rebuilding.
- GitHub auth: user provides the PAT token at runtime (kept out of repo files per push protection). Remote URLs embed it only transiently in git config.
- Bun is the package manager; never npm-install inside repo (breaks bun lockfile).
- SwiftShader/Playwright screenshots need 8–12s waits; check `free -m` before heavy visual runs (dev server can OOM).

## Next actions (pick up here)

1. Finish P1 scaffold (game folder structure per spec §17).
2. P2 core engine: Zustand game state machine (BOOT→LOADING→MAIN_MENU→MISSION_SELECT→MISSION_INTRO→PLAYING→SCANNING→INTERACTION→OBJECTIVE_COMPLETE→EDUCATION_POPUP→MISSION_COMPLETE→RESULTS).
3. Heart mission is the vertical slice — pour quality there first.
