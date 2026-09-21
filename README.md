# ANATOMY ARCADE

> **ENTER THE BODY. SAVE THE PATIENT. LEARN HOW IT WORKS.**

A premium, genuinely playable 3D biology game. You are a microscopic medical nano-robot deployed inside the human body, responding to biological emergencies while learning how the body works.

Built with **React + React Three Fiber + Three.js + Drei**. Mobile-first, WebGL, Qwen-powered educational scans.

## Missions

| # | Mission | Status |
|---|---------|--------|
| 01 | HEART ATTACK RESPONSE — navigate the bloodstream, locate and clear the blockage, restore flow | Primary vertical slice |
| 02 | VIRAL INVASION — alveolar exploration, identify infected cells, assist immune response | Locked / Ready |
| 03 | BRAIN MISSION — reconnect damaged neural pathways, restore signal flow | Locked / Ready |
| — | FULL-BODY EXPLORER — translucent body, system selector, organ reveals | Hub / showcase |

## Development

```bash
bun install
bun run dev      # dev server
bun run build    # production build
```

## Repo map

- `PROJECT.md` — the master build specification (66 sections, canonical).
- `CONTEXT.md` — living agent context: current phase, decisions, next steps. **Every agent updates this.**
- `worklog.md` — append-only per-agent work log (parallel-agent safe).
- `docs/ASSETS.md` — asset manifest with license/attribution for every external asset.
- `docs/VLM-CRITIQUE.md` — the 5 mandatory VLM critique rounds log.
- `docs/DECISIONS.md` — architecture & design decision records.

## Agent protocol (parallel runs)

1. Read `CONTEXT.md` + `worklog.md` before working.
2. Append your entry to `worklog.md` (Task ID, what you did, results).
3. Update `CONTEXT.md` status fields when you complete a phase.
4. Commit + push at every milestone (sandbox wipes happen).
