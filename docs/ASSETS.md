# ASSET MANIFEST

> Every external asset gets a row here BEFORE integration (spec §3).
> In-game "Credits / Asset Credits" panel is generated from this table.

| Asset | Source | Creator | License | URL | Attribution Required | Modifications | Local File |
|-------|--------|---------|---------|-----|----------------------|---------------|------------|
| (none yet — asset research phase P4 pending) | | | | | | | |

## P4b — no-token asset acquisition (Task ID: 2, agent asset-hunter, 2026-09-21)

**HERO HEART: YES — `public/models/heart_hero.glb`, 57,830 tris, CC BY 4.0 (BodyParts3D 4.0 © Database Center for Life Science).**
Recognizable anatomical 4-chamber heart: myocardial chambers, atrial walls, valves + papillary muscles (interior detail), full coronary artery/vein tree on surface, plus aortic root / pulmonary trunk / SVC stubs. Real-world scale (~11.6 × 13.5 × 10.6 cm), centered at origin, Y-up, meters. Verified: parses in trimesh, loads in three.js GLTFLoader, rendered + screenshot-checked (`scripts/asset_check/shot_heart_hero.png`).

| Asset | Source | Creator | License | URL | Attribution Required | Modifications | Local File |
|-------|--------|---------|---------|-----|----------------------|---------------|------------|
| heart_hero.glb | human-atlas (BodyParts3D 4.0) | © The Database Center for Life Science; extraction/repack: ashemag/human-atlas (MIT code); extraction script: this repo | CC BY 4.0 (data) — https://creativecommons.org/licenses/by/4.0/; official license page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27; supersedes legacy CC BY-SA 2.1 JP text) | https://github.com/ashemag/human-atlas (data: BodyParts3D 4.0, https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) | YES — keep "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0" in credits | Extracted 86 heart-concept structures (FMA7088) + Ascending aorta + Pulmonary trunk + Superior vena cava from packed binary chunks; merged 36,571 verts / 57,830 tris; re-centered to origin; recomputed normals; exported GLB (1.04 MB). No decimation needed (≤80k budget). Commercial use allowed, modification allowed | public/models/heart_hero.glb |
| coronary_artery.glb | human-atlas (BodyParts3D 4.0) | © The Database Center for Life Science; as above | CC BY 4.0 (data) — same terms as above | https://github.com/ashemag/human-atlas | YES — same notice | Extracted 56 structures (FMA49893 coronary artery concept: LAD/diagonals/circumflex/RCA marginals/PDA); merged 13,372 verts / 18,164 tris; centered; GLB (329 KB). No decimation | public/models/coronary_artery.glb |
| body_silhouette.glb | human-atlas (BodyParts3D 4.0) | © The Database Center for Life Science; as above | CC BY 4.0 (data) — same terms as above | https://github.com/ashemag/human-atlas | YES — same notice | Merged ALL 2,234 BP3D structures (2,288,268 tris) → decimated to 30,000 tris with fast-simplification (quadric); centered; GLB (569 KB); full figure 1.73 m tall (skeleton+muscles+organs — use translucent/ghosted for BioDex body-map) | public/models/body_silhouette.glb |

Notes:
- Source repo `ashemag/human-atlas` is MIT (code) + CC BY 4.0 (anatomy data, documented in its `public/ATTRIBUTION.md`): axes mm/Z-up → m/Y-up, simplified per-structure (meshoptimizer, 0.2% error), packed into 15 binary chunks + `atlas.json` manifest; we decoded the manifest and recovered the original per-structure meshes.
- Credit line to include in the in-game Credits panel: "Anatomical meshes: BodyParts3D, © The Database Center for Life Science, CC BY 4.0 (via ashemag/human-atlas adaptations)."
- RBC: no open 3D RBC obtained — keep procedural biconcave lathe RBCs (P5.5, in-house, no license row needed).

### Failed sources (do not retry blindly)

- **NIH 3D Print Exchange (3d.nih.gov)** — `/api/v1/entries?search=…` and `/entries?search=…` both return 404 (site is a Next.js SPA; no public API found in homepage HTML). Skipped after 2 attempts.
- **Wikimedia Commons** — API search worked once (found candidates `File:3D model of a human heart.stl`, `File:Vh-m-heart.stl`, `File:Vh-f-heart.stl` — BodyParts3D derivatives) but all subsequent requests hit 429/403 rate limits (shared sandbox IP); downloads did not complete. Retry from a different IP if a standalone heart STL is ever needed (current hero heart supersedes these).
- **Smithsonian Open Access 3D** — API requires an api_key; skipped per instructions.
- **Z-Anatomy GitHub** — releases endpoint 404 (no release assets); only .blend sources otherwise (no Blender in sandbox). Skipped.
- **GitHub code search** — requires auth even unauthenticated for /search/code; repo search rate-limited (shared IP) after ~6 queries. Unlicensed heart.glb repos (sohrabzia/GlbHeart, 36villages/heart-model, Pratik-Satpute7/Heart-3D-.GLB-Model, SAJIL-NAIR/HEART_AR) rejected — no license = all rights reserved.
- **Thingiverse/Printables/poly.pizza** — API tokens / login walls; not attempted beyond policy skip.

## Rules

1. Prefer CC0 → CC BY → CC BY-SA → other genuinely-free licenses. No paywalled/"free preview" assets.
2. Sketchfab: check each model's individual license; note CC BY-NC / ND restrictions explicitly.
3. Record author, source URL, required notice, and every modification applied (remesh, retexture, compression).
4. Procedural in-house geometry (vessels, neurons, particles) = no license row needed; note shader/technique references in `docs/DECISIONS.md`.

## Integration status (P4c — main agent, this wave)

- heart_hero.glb → WIRED: `<HeroHeart>` in src/game/levels/heart/HeartMission.tsx — the
  anatomical heart visible at the end of the LAD; beats with the global pulse; material
  overridden to the game's crimson myocardium palette (emissive #6b1220). ASSET-RESEARCH
  Sketchfab download queue is now OPTIONAL (no token needed anymore).
- coronary_artery.glb / body_silhouette.glb → staged for BioDex / body-map (P7 missions).
- Credit line added to the in-game CREDITS overlay (Overlays.tsx) and required attribution
  documented above.
