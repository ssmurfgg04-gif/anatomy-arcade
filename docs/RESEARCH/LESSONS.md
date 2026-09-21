# RESEARCH SYNTHESIS — ENGINEERING LAW FOR ANATOMY ARCADE

> Distilled from 4 parallel research reports (RA-1..RA-4, same directory) covering 19 repos:
> red-sands, golden-saucer, gods-eye-view, ai-browser-game-demos, fable-cities, threejs-game-studio,
> LAAS, turbo-kart-rush, murmur, fable-lite, world-of-light, voxelcraft, roller-rink-3d,
> antigravity-pool, three-game-engine, prairie-adventure, san-verde, pigeon-world (+grass/Fire comps).
> Each lesson below: source → exact application. Full evidence in RA-1..RA-4 reports.

## A. FRAME-RATE-INDEPENDENT FEEL (adopt everywhere)

- **L1 — Exp damping law.** `a += (b-a) * (1 - exp(-rate*dt))` with NAMED rate constants, never `lerp(0.1)` per frame.
  [red-sands CameraRig.js — 15+ filters, all commented] → Replace every frame-rate-dependent lerp/damp in our camera/controls/HUD fades.
- **L2 — Smooth camera in DISTANCE when moving fast.** `gRate = 3.6 + hspd*1.15 + |err|*3.5` — fixed time-constant lags 2.5 m at speed. [red-sands CameraRig.js:222-235] → Vessel-flight camera swim fix.
- **L3 — Feel constants authored, not grown.** WALK 1.62 / JOG 3.95 / SPRINT 6.60 m/s, ACCEL 8.2 / DECEL 11.0 m/s², SPRINT_WINDUP 1.15 s; transitions are 0→1 blends, not mode flags. [red-sands Player.js:114-124] → `src/game/config.ts` freeze table.
- **L4 — Chase cam = 12 calibrated constants.** FOV 68→80 ∝ speed², yaw damp λ6 (λ3.4 + offset while "drifting"), dist +0.9 w/ speed, roll ≤0.045 rad, shake decay 5.5; cinematic = smoothstep swoop into chase. [turbo-kart-rush FollowCamera.ts; murmur adds partial-follow 0.32×, asymmetric climb 4.2/fall 3.2, 2° micro-roll] → Intro→gameplay handoff + flight camera.

## B. ADAPTIVE QUALITY / MOBILE LAW (P8 core)

- **L5 — Port murmur's Governor.** renderScale −0.06/0.35 s when `frameMs > budget*1.18`, +0.03/0.7 s under `budget*0.72`, minScale 0.5 touch; tier changes only after scale bottoms out (2.2 s sustained + 4 s cooldown; rise: 8 s headroom + 10 s cooldown). EWMA α=0.08; budget = 1000/min(refresh,120). [murmur src/core/perf.ts, 130 lines pure TS] → `src/game/quality/governor.ts` wrapped around existing tiers.
- **L6 — Tiers are data objects; PARTICLES ARE THE BIGGEST DIAL.** LOW→ULTRA: particles 1k→20k+, geometryDetail 0.35→1, drawDistance, maxPixelRatio 1→2. "Silhouette, colour, pacing, audio survive; only density and post luxury are traded." [murmur PROFILES] → Refactor our quality tiers to one QualityProfile object.
- **L7 — Mobile particle reality: 1.2k–10k.** Shader-driven Points wrapped toroidally around camera (vertex shader positions from seed+clock — zero CPU per frame, no warm-up). [WoL FloatingParticles.tsx 1,200 pts; red-sands stateless GPU particles; LAAS 131k is design-not-count] → Blood cells + plasma motes.
- **L8 — Mobile = different shader + resolution, not fewer features.** touch → 8 vs 10 bounces, DPR 0.75 vs 1.0; San Verde caps DPR 0.9; AA off, DPR ≤1.5. [antigravity, san-verde, voxelcraft] → LOW tier fast path stays; add renderScale knob.
- **L9 — Render governor:** pause/blur/menu = `frameloop="demand"` + ref-counted continuous-render holds; fixed 20 Hz sim + clamped dt ≤ 0.05 with ≤4 catch-up steps; camera/render free-run. [gods-eye-view renderGovernor.js, voxelcraft L4413] → Menu/pause/results stop burning GPU.
- **L10 — No-hitch discipline:** fixed pool of 8 point lights (adding lights = shader recompile stutter), pre-warm FX at load, bake noise into textures, "smaller grids, never fewer systems". [fable-lite main.js; LAAS 73.5→20 ms] → Scan/treatment glow lights pre-allocated.

## C. GAMEPLAY MECHANICS

- **L11 — Trigger state machine, not distance checks.** arm-on-spawn, fire only after leave-and-return, 2.0 s cooldown, hold/debounce guards. [golden-saucer Game.ts checkExits] → Scan/treatment/waypoint triggers.
- **L12 — Movement feel:** yaw-projected input + `approach()` accel/friction + per-axis wall slide (zero only the hit axis, keep tangential speed); damage = contact ticks + 0.45 s i-frames. [ai-browser-demos player.js:72-145; voxelcraft sweep] → Vessel collision keeps flow speed on scrape.
- **L13 — Momentum-preserving steering:** turning rotates the velocity vector (2D rotation matrix) — banking feel. Convert per-frame constants to dt-based. [roller-rink physics.js:246-256] → Nano-robot flight model.
- **L14 — Phase tables + one-shot latch on every "complete" event.** Missing latch = per-frame score inflation (their documented bug, same class as our EDUCATION_POPUP stomp). [ai-browser-demos waves.js] → Heart phases already table-driven; audit every latch.
- **L15 — Implicit tube collision, zero raycasts.** `(x²/a² + z²/b²) > 1 → project back ×0.999/√cc` + event. [roller-rink physics.js:270-298] → We already do distance-to-spline; adopt their projection+event pattern.
- **L16 — Pause/blur must clear held inputs; pause/restart consume-once flags.** [ai-browser-demos main.js:297-318] → E-hold cancels on pause; kill stuck input on tab-hide.
- **L17 — Joystick:** radius 0.42×element width, clamp len 1, merge kb+touch then normalize, knob 38 px, handle pointercancel. [threejs-game-studio InputController.ts:64-93] → Audit our touch joystick.

## C2. FIRST 30 SECONDS / ONBOARDING

- **L18 — First 30 s must contain a real decision.** fable-cities' own critic scored its onboarding 5.5/10 for "minutes before anything happens". → First plaque visual within ~10 s of flight; tutorial compressed; touch-glyph prompt variants.

## D. FEEDBACK / JUICE (target ~10 channels per event, all pooled)

- **L19 — ~10 feedback channels per event.** Tracer fade 0.08 s, sparks gravity 18, counts 14/6/3, recoil 0.07 s, 220 ms pickup flash, banners for phase beats. [ai-browser-demos world.js/gun.js; tgs Hud.ts] → Scan lock-on = line + sparks + chirp + toast + banner; dissolve per-segment rising chirps; flow-restored arpeggio 659/784/988 Hz.
- **L20 — Juice formulas:** squash `max(0.08+impact*0.2)` → scale(1+0.5s,1−s,1+0.5s) relax λ9; trauma² shake decay 1.5/s + hit-stop + slow-mo; coyote+buffer 0.12 s; final-beat music ×1.1. [WoL Player.tsx:357-419; fable-lite main.js:518; kart music.ts:549] → Collision impact + treatment completion.
- **L21 — Audio architecture:** buses→limiter, VOICE_CAP 56 w/ 30 ms steal, seeded-noise reverb IRs, 25 ms lookahead, ducking 0.06–0.85; engine voice = saw+detuned square+sub → rpm-tracked lowpass → tanh softclip. [murmur AudioDirector.ts; kart audio/engine.ts] → Heartbeat/flow soundscape + speed-tracked flow noise.
- **L22 — One composite post pass beats five addons.** Single ShaderPass: speed lines + radial blur + CA + vignette + hit tint + flash + grain (+0.8–1.2%), bloom 0.35/0.35/0.9, multisampling 0 for SwiftShader; NEVER blur the thing you must react to (mask radial smear around player + target). [kart PostFX.ts; murmur post.ts:16-24] → If/when we add post: one pass, masked.

## E. VISUAL SYSTEM

- **L23 — Grading law:** shadow-tint weight `(1-luma)²`; coolness = blue ADDED in shadows, warmth lives in highlights; a red-subtracting cool shadow turned dark ground "electric navy" — watch our crimson palette. [red-sands Grade.js] → Color grading choices for vessel depth zones.
- **L24 — Cheap-90% atmosphere:** one backside sphere shader — 3-stop gradient, pow(dot,7)+pow(,48) glow, hash stars, 2 sine-sum ridges, horizon fog, uniform crossfade for state change. [WoL SkyAtmosphere.tsx 141 lines] → Vessel depth-fog gradient + distant atrium skybox vibe, palette-swapped crimson/near-black.
- **L25 — RBC upgrade: instanced biconcave discs, shader-deformed.** ~64-tri disc + per-instance phase/tumble attributes, same 1 draw call, MORE RBC-like than spheres; root-as-instanced-attribute sway (bend ∝ height, 3 noise octaves) → endothelium cilia pulse; SDF player-wake field (falloff 0.68, strength 0.58, age decay) → RBCs part around the robot. [grass/Fire comp lessons, voxelcraft greedy mesh "emit exactly what's visible"] → BloodStream component v2.
- **L26 — Clot-dissolve shader (steal verbatim):** 20 raymarch steps × 3-octave abs-simplex (lacunarity 2.0, gain 0.5), scrolling seed, pre-baked gradient tex, `alpha=col.r`, depthWrite:false. [THREE.Fire FireShader.js] → Plaque dissolve FX.
- **L27 — Wind law for flow:** deflect MORE under force, never oscillate faster (constant per-instance frequency; time-varying frequency = phase-slew jitter). [LAAS Wind.ts] → Cell tumble + wall cilia.
- **L28 — Vessel lighting variation:** keyframe light states at "hours" with smoothstep [roller-rink lighting.js]; chase-cam inertia 0.35/frame, lookAt head+1.2 [roller-rink camera.js:103-130] → Zone-based lighting along spline.

## F. ARCHITECTURE + QA (process law)

- **L29 — One frozen config module.** All tuning constants side-effect-free in `src/game/config.ts` [ai-browser-demos block-fps/config.js; gods-eye-view house style: policy modules + colocated tests, eventBus w/ bounded replay, depcruise no-cycles, 50 KB bundle-growth rule, prefers-reduced-motion zeroes flourish layers].
- **L30 — QA as immune system.** Deterministic seeded captures + settle frames; every past defect becomes an automated metric gate with non-zero exit; measured JSON critiques (severity + pixel-rect + luminance + draw calls, persisted); bot-playtest signals (score-delta, first-score step, softlock windows, time-to-first-fail); written 0–3 anchored scale (premium = all ≥2, avg ≥2.3); mobile captures mandatory; "never let the builder grade the build"; fresh-eyes reviewer takes the lower score. [red-sands tools/*, CRITIC.md, PROCESS.md; tgs quality-scorecard.md; fable-cities blind A/B — honest 0–4 losses] → P9 VLM rounds adopt this protocol; Playwright harness from WoL (fail on pageerror, DEV-only `window.__*` hooks, drive real input).
- **L31 — HUD state-specific, never stat-cards.** "Mostly rectangular stat cards" = auto-fail. Safe-area insets mandatory. [tgs Hud.ts quality-scorecard] → Audit before each VLM round.
- **L32 — Rapier verdict:** overkill for tube flight (custom analytic ≈ 0 KB vs WASM payload); justified only for future multi-body debris. [three-game-engine kinematic-controller middle path] → Keep custom collision.

## IMPLEMENTATION ORDER (this wave)

1. `src/game/config.ts` — frozen feel/quality constants (L3, L29).
2. Governor port → `src/game/quality/governor.ts`, QualityProfile object (L5, L6), frameloop demand on menus (L9).
3. Camera rig rework: exp-damped distance-smoothed follow, speed FOV, micro-roll, cinematic swoop (L1, L2, L4).
4. Controls: momentum steering + wall-slide keep-tangential, i-frames 0.45 s, pause clears holds, joystick audit (L12, L13, L16, L17).
5. BloodStream v2: instanced biconcave discs, shader tumble, camera-wrapped field, player wake (L7, L25, L27).
6. Feedback: scan lock-on channel bundle, dissolve chirps, flow arpeggio, trauma shake (L19, L20).
7. Landing redesign per user's UI image (P5) — DOM-first, zero-GPU hero, existing R3F reserved for missions.
8. QA: Playwright E2E + screenshots desktop/mobile, metric gates from past defects (L30).
