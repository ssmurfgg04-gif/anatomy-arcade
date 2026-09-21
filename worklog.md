# ANATOMY ARCADE — WORKLOG (APPEND-ONLY)

Format per entry:

```text
---
Task ID: <id>
Agent: <main | subagent-name>
Task: <what you were asked>

Work Log:
- <steps>

Stage Summary:
- <results / decisions / artifacts>
```

---
Task ID: P0
Agent: main
Task: Bootstrap Anatomy Arcade — project MD, context system, GitHub.

Work Log:
- Read full 66-section spec from user upload; stored verbatim as PROJECT.md.
- Created README.md, CONTEXT.md (living state), docs/{ASSETS,VLM-CRITIQUE,DECISIONS}.md.
- Created GitHub repo ssmurfgg04-gif/anatomy-arcade via API, pushed milestone 1.
- Installed cortexm (pip); stored project facts; exported facts into context-m repo and pushed.

Stage Summary:
- P0 complete. Project + context system durable on GitHub in two repos.
- Next: P1 scaffold (Next.js + R3F), taste-skill install per spec §0.
---
Task ID: P4-research
Agent: subagent
Task: Research openly-licensed 3D anatomy assets for WebGL biology game; produce docs/ASSET-RESEARCH.md (candidates report, no app code changes).

Work Log:
- Read CONTEXT.md + worklog.md for background; anatomy-arcade-history.md not present in sandbox.
- Queried Sketchfab public API (no auth): 30+ searches across 10 categories (heart, RBC, WBC, platelet, plaque/thrombus, virus, neuron, brain, body, lung/alveoli); learned `license` filter only accepts cc0 → bucketed CC-BY/NC locally from license.label in unfiltered results; 644 unique models collected.
- Fetched /v3/models/{uid} details for 63 shortlisted candidates (author, license, vertex/face counts, animationCount, description).
- Checked free libraries: Quaternius (CC0, no anatomy), Kenney (CC0, no biology), Poly Haven models API (521 models, only clinic set-dressing), CC0Models (DNS unreachable), poly.pizza (API key required). GitHub: anatomed-mcp (CC-BY-SA-4.0), cochlea-generator (CC-BY-4.0 procedural ref), Z-Anatomy (LluisV, ★390, CC-BY-SA full-body source).
- Wrote docs/ASSET-RESEARCH.md: criteria header, 10 category tables (56 candidates), TOP PICKS (1/category), NC RESTRICTED (14 NC + 5 "Free Standard"), PROCEDURAL RECOMMENDED (7 items), DOWNLOAD QUEUE (20 UIDs, P0–P3, authenticated download endpoint format), open risks.

Stage Summary:
- All 10 categories have a viable CC-BY 4.0 top pick (no CC0 organ-level assets exist; CC0 only for heavy brain/virus scans).
- Hero heart: Realistic Human Heart by neshallads (CC-BY, 22.5k tris). Cells all <5k tris. NC list recorded so nobody grabs E-learning UMCG / HannahNewey models by accident.
- Vessels/flow/plaque/neural-net/alveoli clusters to be built procedurally in Three.js (documented with techniques).
- Next: P4 download phase needs $SKETCHFAB_API_TOKEN for /v3/models/{uid}/download (GLB), then Draco/meshopt + ASSETS.md attribution rows.

---
Task ID: P1-P3
Agent: main
Task: Build playable heart-mission vertical slice (scaffold, engine, level, UI, Qwen).

Work Log:
- Installed three/@react-three/fiber/@react-three/drei/maath; merged scaffold into anatomy-arcade repo history.
- Built src/game (core state machine, quality tiers, controls incl. touch, vessel spline system, heart level: vessel tube shader + instanced blood cells + plaque/clot + player rig), src/ui (HUD, menus, education panel), src/scenes (GameCanvas, MenuScene), src/audio (procedural WebAudio SFX), /api/explain (Qwen + validated fallback).
- Browser-verified golden path end-to-end via agent-browser incl. Qwen AI-enhanced scan panel; fixed: Euler passed to getWorldDirection (objective 01 never completing), phase stomp of EDUCATION_POPUP, scan ray far 7->12, SwiftShader LOW-tier fast path (software GL detect), wall-clock intro.

Stage Summary:
- Heart mission fully playable E2E; S-rank results screen live; Qwen integration verified with AI ENHANCED badge.
- Known polish debt: menu backdrop dark, RBC sphere-ish, vessel banding close-up, plaque blowout close-up (VLM round 1 targets).
- Sketchfab downloads blocked on API token (asset queue ready in docs/ASSET-RESEARCH.md).
