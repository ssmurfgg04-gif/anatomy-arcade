# TASTE DIRECTION — ANATOMY ARCADE (distilled from design-taste-frontend v2)

> Full skill: `skills/design-taste-frontend/SKILL.md` (read before UI work). This file is the binding adaptation for this game.

## Brief inference (Section 0)

- **Kind:** playable 3D game with cinematic menus (NOT a marketing landing page; landing-page rules apply to menus/HUD/credits surfaces).
- **Vibe:** "MICROSCOPIC SCI-FI MEDICAL THRILLER" — Awwwards-grade dark tech, cinematic, alive.
- **Audience:** hackathon judges + general players on desktop AND phones. Judge must "get it" in 5 seconds.

## Dials (locked)

```text
DESIGN_VARIANCE:   7–8   (distinct, authored, not experimental chaos)
MOTION_INTENSITY:  7–9   (cinematic, game-feel; reduced-motion fallback mandatory)
VISUAL_DENSITY:    4–6   (HUD readable at arm's length, menus breathe)
```

## Visual identity (original, not copied)

- **Theme lock:** DARK ONLY, whole app. Background near-black biological `#060A10` → `#0A121C` tints (never pure #000).
- **One accent system:** oxygen-cyan `#2DD9E8` (interface/scan) + deep crimson `#C21E3A` (blood/danger) as a *semantic pair* — cyan = machine, crimson = biology. No other hues except localized biology coding (venous deep red, neural violet kept subtle ≤10% saturation area).
- **Grays:** single cool family, tinted toward the cyan hue.
- **Texture:** subtle noise/grain + radial vignettes; never flat sterile black.
- **Typography:** display face with character (Geist/Outfit/Space Grotesk family — NOT Inter, NOT system default), mono for numerics/telemetry (`tabular-nums`), max 2 families. Headlines tight tracking, heavy presence.
- **Radius system:** one scale — `4px` controls / `8px` panels / `12px` overlays. Never mixed randomly.
- **Icons:** Phosphor or Tabler only. No hand-rolled SVG paths, no emoji UI.

## Hard bans (Section 9 AI-tells + spec §45)

- Zero em-dashes (`—`) in any UI string. Zero lorem ipsum, zero "coming soon", zero fake metrics/testimonials.
- No purple-blue AI gradient. No glassmorphism spam (one restrained scan-panel treatment max).
- No three-equal-card rows. No dashboard sidebar. No `h-screen` (use `min-h-[100dvh]`).
- No generic centered hero + 3 cards under it.
- Every animation justified in one sentence (hierarchy/storytelling/feedback/state). No GSAP-for-show. Reduced-motion wrap for everything.

## Game-specific adaptations

- HUD is diegetic-feeling: thin scanlines, corner-anchored telemetry, tabular numerics; NO rounded dashboard cards.
- Emissive cyan = scan/interact affordance; crimson = damage/objective. Color is NEVER the only signal (icon + text always accompany).
- Motion feel: exponential ease-out for UI (MOTION 7–9), spring for HUD state changes, camera FOV kick on boost — but never nauseating.
- Loading = real staged progress (INITIALIZING MEDICAL NANOBOT...), nano-robot animating, no fake stuck bars.

## Pre-flight (Section 14 matrix — run before any UI delivery)

Full matrix in the SKILL.md. Non-negotiables for this project: theme lock, accent consistency, WCAG AA contrast on all HUD text, hero/menu focal point + one primary action, CTA never wraps, reduced-motion, empty/loading/error states, mobile collapse explicit, icons from allowed library, motion motivated.
