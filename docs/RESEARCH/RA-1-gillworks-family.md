# RA-1 — Engineering lessons from the gillworks family + gods-eye-view

> Task ID: RA-1 · Research-only · No app code touched.
> Method: shallow clones into `/home/z/my-project/tmp-research/`, then Read/Grep on the actual
> source (not READMEs). Evidence paths below are `repo://` relative to that directory.
> Read order of the project brain first: `CONTEXT.md`, `worklog.md`.

---

## 1. gillworks/red-sands — procedural open-world western (three.js, WebGL2)

**Tech stack:** three r0.185, WebGL2, vanilla ES modules, Vite, Playwright tooling, Python metrics.
**Zero art assets** — every texture, mesh, rig and sound is generated procedurally at runtime.
**LOC scale:** ~69,000 lines of JS across 118 files (`src/` = 10 systems: core, materials, player,
render, sim, ui, world, audio).

### Finding 1.1 — Engine = system registry with per-system cost attribution
Evidence: `red-sands://src/core/Engine.js`

- Systems register with a `static id`, optional `initOrder`, and hooks `init() / update(dt) /
  lateUpdate(dt) / resize() / dispose()`. Registration order = update order; init is sorted
  separately (lines 90–118).
- Every system update is timed with a rolling EMA: `prof[id] = prof[id]*0.92 + ms*0.08`
  (lines 171–196). Header comment: *"Pass 3 regressed every shot over the frame budget and nobody
  could name the offender; an unattributed frame time is an unfixable one."*
- Whole-frame EMA `frameMs = frameMs*0.9 + ms*0.1` is exposed for an **adaptive quality governor**.
- Renderer facts: `antialias: false` (TAA/SMAA done in PostFX), `NoToneMapping` (PostFX applies
  AgX/ACES itself), DPR = `Math.min(quality.pixelRatio, devicePixelRatio)`, `dt` clamped to 0.1 s
  to survive tab stalls (line 159), physics runs a fixed 1/60 step with render interpolation.
- A failing system is disabled (`__failed`) rather than crashing the frame.

### Finding 1.2 — CameraRig: the most documented camera math we found anywhere
Evidence: `red-sands://src/player/CameraRig.js`

All smoothing is **frame-rate-independent exponential**: `a += (b-a) * (1 - exp(-rate*dt))`.

- **Pivot follow:** horizontal rate `8.2 - 2.4*speed01` (soft, gets softer at speed — *"that
  trailing is the single strongest heavy-camera cue"*), vertical rate 7.5 (lines 317–320).
- **Ground-height smoothing is constant in DISTANCE, not time:** `gRate = |gErr|>1.6 ? 16 :
  (3.6 + hspeed*1.15 + |gErr|*3.5)` — a fixed time constant is 0.3 m of ground at a walk but
  2.5 m at a gallop; scaling rate with ground speed smooths the same half-metre at every gait
  (lines 222–235). Without it the shot *"reads as amateur."*
- **Speed feel:** arm 4.05→5.25 m + speed term, FOV 48 + 6.5–9.5° at speed, shoulder offset opens
  +55% with speed (lines 305, 349–355). FOV widen is lazy (rate 2.2/1.4) but aim-narrow is fast
  (rate 9.0).
- **Look-ahead:** velocity * 0.13–0.10 s of travel, capped at 13 m/s, *"a tenth of a second reads
  as looking where you are going"* (lines 357–374). Lead-out fast (3.2), settle-back slow (1.5) —
  *"the lead should feel earned."*
- **Camera collision:** sphere-cast radius 0.45 along the arm; the result is only allowed to
  **shorten instantly and extend slowly** at rate `1.6 + 1.6*stillness` (lines 390–401); a
  smoothed floor-lift (rise rate 30, fall rate 3.2) keeps the lens out of the ground without a
  kink (lines 410–417).
- **Handheld life:** two incommensurate sines each axis, amplitudes 0.004–0.011 rad, scaled by
  `(0.7 + 0.5*stillness)`, plus a gait-coupled bob `amp = lerp(0.020, 0.042)*speed01`
  (lines 419–438). **Shake impulse:** `amp * k² * 0.12` with sin at 61.3 / 47.7 Hz (lines 440–447).
- **Look-authority latch:** mouse-look latches for 3.4 s (shortened up to 1.5 s by speed); recentre
  then eases in with the ramp *squared on top of a lowpass* so there is no step in the rate;
  standing still recentre never happens — *"look left at a halt and you keep looking left"*
  (lines 253–289).
- **`setFreeCamera(pos, look, fov)`** is a harness contract: a deterministic hard override so
  captures are reproducible (lines 122–139).

### Finding 1.3 — Movement constants are authored like a locomotion designer wrote them
Evidence: `red-sands://src/player/Player.js` (lines 114–124)

- Gait ladder: `WALK 1.62, JOG 3.95, SPRINT 6.60, BACKPEDAL 1.30` m/s.
- `ACCEL 8.2, DECEL 11.0, STOP 9.4, AIR_ACCEL 1.6` m/s² — comment: *"a man in a duster and boots,
  not a shopping trolley."*
- `SPRINT_WINDUP = 1.15` s of held Shift — *"run has a build to it instead of a switch."*
- Mode transitions (mount/dismount) are **scalars, not booleans**: a `mountBlend` 0..1 interpolates
  pivot height, arm length, FOV and yaw laziness across the 1.2 s animation, with scripted
  audio beats (`MOUNT_BEATS` at t=0.06/0.24/0.52/0.82/1.06 s firing named SFX at authored
  volume/pitch).

### Finding 1.4 — Quality presets are a frozen, explicit contract + coarse hardware detection
Evidence: `red-sands://src/core/Config.js`

- Four presets (`low/medium/high/ultra`) enumerate **every** expensive knob: pixelRatio
  (1 / 1 / 1 / 1.35), shadow cascades (2/3/4/4) and map size (1024→3072), ssao/ssr/volumetrics/
  taa/motionBlur/dof booleans, grass density (0.22→1.5) and draw distance (55→190 m),
  `particleBudget` (1500 / 5000 / 12000 / 24000), anisotropy, cloudSteps, terrainLodBias.
- `detectPreset()`: forced via `?quality=`, else `navigator.deviceMemory >= 8 && cores >= 8 →
  high; >= 4/4 → medium; else low` (lines 119–127).

### Finding 1.5 — Atmosphere on a budget is a measured colour pipeline, not vibes
Evidence: `red-sands://src/render/postfx/Grade.js`, `red-sands://src/render/particles/ParticleShaders.js`

- The tone curve is parameterized as `latitude` (stops AgX maps to display) + `toe`; stock AgX is
  16.5 stops, their house look uses 14.6 after measuring that 13.5 crushed shadows
  (p0.1 luma 0.150→0.078) and desaturated the set (CIELAB chroma dawn 12.1→9.0). Every change
  carries the measurement that justified it, inline.
- **Split-tone trap that applies directly to our crimson palette:** shadow tint weight is
  `(1-luma)²`, so it lands on the darkest pixels — a negative-red/positive-blue shadow tint
  *deleted* red that dark pixels barely had, turning damp earth into "electric navy"
  (measured rgb 0.035,0.065,0.105, saturation 0.80). The fix: coolness made of **blue added**,
  never red destroyed. Warmth lives in the **highlight tint** where sunlight actually is.
- Auto-exposure: 64×64 metering target, 3×3 tap grid spread across the destination tile (a naive
  4-tap read *"measures 4096 isolated pixels and calls that the scene average"*), sky excluded via
  depth-buffer test with a small residual weight; a separate dense 81-tap peak grid because the
  sparse meter read *"a white point set from noise."*
- Particles split in two cost classes: **`FIELD_*` stateless GPU particles** (rain/snow/motes) —
  position is an analytic function of seed+clock wrapped into a camera-following box, so the CPU
  never touches a vertex and the field is instantly full (no warm-up) — vs **`POOL_*` CPU pools**
  for discrete events (splashes, embers, dust). Shared: soft-particle depth fade + wrap-diffuse +
  Henyey-Greenstein forward scatter so particles are *lit by the scene*.

### Finding 1.6 — World = terrain derivatives × cluster mask; rendering = InstancedMesh + dithered LOD
Evidence: `red-sands://src/world/Scatter.js`, `red-sands://src/world/Vegetation.js`

- Placement is *"a function of the terrain's own derivatives, never uniform"*: slope, curvature,
  20 m neighbourhood relief, hydrology flow map, splat weights, all multiplied by a two-octave
  cluster mask so the world has thickets and clearings rather than an even sprinkle.
- Per-variant **InstancedMesh with 2–3 discrete LODs and a dithered cross-fade**; ring distances
  per class (outcrop 980 m, rock 820 m, tree 900 m); grass is four camera-following bands of
  cross-quad tufts placed entirely in the vertex shader.
- Determinism is a hard rule (see Finding 1.7): `rng(seed)` from `src/core/Context.js`, never
  `Math.random()`, so any frame is reproducible.

### Finding 1.7 — The visual QA loop: four instruments, and judges never grade their own work
Evidence: `red-sands://tools/capture.mjs`, `tools/metrics.py`, `tools/motion.py`, `tools/scout.mjs`,
`docs/CRITIC.md`, `docs/PROCESS.md`, `docs/CONTRACTS.md`

- `capture.mjs`: spins its **own Vite dev server on an ephemeral port** (parallel-safe), renders a
  canonical 10-shot list (each shot = fixed time-of-day + weather + camera pose via the
  `setFreeCamera` contract), settle-frames before capture, `--fast` mode ~4× cheaper for
  iteration ("use it for every intermediate look").
- `metrics.py`: numpy regression gates — *"Every gate below is a defect that was ONCE REAL in this
  project... This is the immune system."* Measures luma percentiles, saturation, horizon detection;
  non-zero exit code = build gate; supports baseline deltas.
- `motion.py`: temporal critique — static-camera shimmer heatmap, dolly filmstrip contact sheet,
  largest-frame-delta LOD-pop detector, camera-motion flicker gate. *"A perfect screenshot can come
  from a frame that boils."*
- `scout.mjs`: adversarial camera — walks the world with seeded random poses, cheap heuristic
  scores (blown out / crushed / chromatically dead / hard sky-terrain step) and surfaces the worst
  N frames for a critic, so the QA isn't overfitted to 10 canonical viewpoints.
- `PROCESS.md` loop: *"agents build, independent adversaries judge, and everything a judge ever
  found becomes an automated assertion."* Pass-1 agents self-scored 7–8 while critics scored 2.67;
  self-scores only calibrated after the gap was shown twice. **Never let the builder grade the
  build.**
- `CRITIC.md` finding format: every finding must name **shot + defect + the specific rendering
  technique that fixes it + owning system**. "Needs more detail" is rejected.
- `CONTRACTS.md` non-negotiables: own only your files; zero console errors; determinism; linear HDR
  authoring; **budget — at ultra the whole frame stays under ~2000 draw calls and ~16 ms on an
  M3 Pro; use InstancedMesh, merged geometry, LOD**; no placeholder art.

---

## 2. gillworks/golden-saucer — FF7-style pre-rendered 2.5D adventure (AI world pipeline)

**Tech stack:** Python/FastAPI backend (open-vocabulary segmentation + monocular depth → navmesh,
occluder masks, exits manifest) + TypeScript/Canvas2D frontend with a 3D-rendered character sprite;
Vite. Three r0.169 present but the shipped game loop is 2D canvas.
**LOC scale:** small and dense — frontend engine ~1,760 LOC TS, backend ~3,000 LOC Python; repo
weight is generated static assets (565 MB).

### Finding 2.1 — The "world designer" turns one sentence into a structured, connected graph
Evidence: `golden-saucer://backend/world/designer.py`, `backend/world/graph.py`

- An LLM call maps free text → a strict JSON plan of **5–7 scene nodes**, each with a paintable
  description ("from a fixed ground-level three-quarter camera"), kebab-case keys, and 3–6
  **occluders** the character can walk behind. The plan is ground truth; approve it and the world
  gets built.
- `graph.py` invariants worth stealing verbatim: *"A scene generated once is canon forever (nodes
  keep their bgId)"; "Unmapped doors lead nowhere — the graph never invents rooms";* every world is
  a human-readable JSON file under `data/world/` — debuggable, diffable, resettable.

### Finding 2.2 — Scene prefetch + "the FF swirl rule"
Evidence: `golden-saucer://frontend/src/world/WorldSession.ts` (header comment)

- Scenes are **prefetched the moment you arrive in a room**, so most transitions are instant; when
  generation is still running, the transition overlay carries the wait — *"the FF swirl rule."*
  Esc outside a travel wait = go back the way you came.

### Finding 2.3 — Depth-driven sprite scale, sampled at the feet, frame-rate independent
Evidence: `golden-saucer://frontend/src/engine/Game.ts` (lines 44–48, 189–205)

- `wantScale = scaleMin + (scaleMax-scaleMin) * pow(depth, scaleGamma)` with
  `scaleMin 0.7, scaleMax 1.25, scaleGamma 1.0`; depth sampled under the **feet**, and a comment
  pins the invariant: *"depth-driven scale changes can never slide the character on their own."*
- Depth occlusion: sprite pixels are hidden where the background depth map is nearer than the
  character (`Renderer.ts` line 128) — the classic pre-rendered-BG trick that fakes 3D cheaply.

### Finding 2.4 — Exit triggers are a full state machine, not a distance check
Evidence: `golden-saucer://frontend/src/engine/Game.ts` `checkExits()` (lines ~246–330)

- Trigger radius `max(58, spriteH*0.42)` measured to the **navmesh-snapped anchor** (the honest
  test; a bbox "only inflated the trigger zone").
- **Arming:** an exit can only fire after you have left its range and returned; on spawn, exits
  within `radius*1.5` are pre-armed so the door you arrived through cannot instantly fire you back.
- **Cooldown 2.0 s** after any exit fires; bottom-edge exit needs a 250 ms hold and then debounces
  −2000 ms. Escape key = go back when not busy.

### Finding 2.5 — Loop hygiene for hostile tabs and wall-slide fallback
Evidence: `golden-saucer://frontend/src/engine/Game.ts` (lines 153–177, 230–240)

- `dt = Math.min(1/15, (t-lastTime)/1000)` — below 15 FPS the sim slows down instead of
  teleporting; plus a `setInterval` watchdog that ticks the sim when rAF is throttled
  (`if (running && now-lastTime > 45) tick()`), keeping pace in background tabs.
- When the navmesh blocks most of a move, it retries **axis-separated** (`moveWithin` x-only, then
  y-only) — cheap wall-sliding so the character never sticks on corners.

### Finding 2.6 — Debug visualisation ships inside the game loop
Evidence: `golden-saucer://frontend/src/engine/Game.ts` `render()` (lines ~328–340)

- Depth overlay, occluder masks + bboxes, collision polys, navmesh, exit markers are toggles on the
  live frame. Every coordinate space (navmesh/depth/mask/exit) is kept 1:1 with the letterboxed
  background, so debug views are honest to gameplay.

---

## 3. ssmurfgg04-gif/gods-eye-view — the user's own repo (house style)

**Tech stack:** Cesium 1.124 + vanilla JS/ESM (no framework), Vite, Node ≥ 24, unit tests via a
custom runner, dependency-cruiser, Playwright QA harnesses.
**LOC scale:** ~171,000 lines of JS/mjs in `src/` (254 mjs + 179 js files), **191 colocated
`.test.mjs` files** — nearly every module ships with a unit test.
**Note:** Cesium, not R3F — the *patterns* transfer, the *APIs* mostly don't.

### Finding 3.1 — The idle render governor: ref-counted holds + frame-coalesced burst guard
Evidence: `gods-eye-view://src/renderGovernor.js`

- Problem statement: the default loop *"burned ~60% GPU + ~54% of a core with ZERO layers enabled
  and a parked camera."* Fix: flip to `requestRenderMode` (idle = render only on camera input, tile
  loads, or explicit one-shot requests) whenever zero holds are registered.
- Holds are an **identity-keyed Set of owner strings** ('flights', 'traffic', 'style-anim') — a
  module that double-holds cannot corrupt the mode; diagnostics read like a story. Governor is
  "O(1) passive: no per-frame work of its own, ever."
- Burst guard: the first `requestRender()` in a frame forwards synchronously; same-frame repeats
  (< 16 ms apart) collapse into one deferred flush — *"rapid multi-layer toggle bursts... cost at
  most two scene requests per frame instead of dozens."*

### Finding 3.2 — Adaptive quality with hysteresis and a low-end profile
Evidence: `gods-eye-view://src/quality/adaptiveQuality.js`

- Constants: `FPS_WINDOW_MS 2000`, `DEMOTE_WINDOWS 3`, `PROMOTE_WINDOWS 6`, `TIER_COOLDOWN_MS
  5000`, `FPS_FLOOR 34`, `FPS_CEILING 52` — demotion needs 3 consecutive bad 2-s windows, promotion
  needs 6 good ones, and a 5 s cooldown stops crossfades from oscillating the tier.
- Tiers touch only 3 knobs: `resolutionScale 1.0 / 0.85 / 0.75`, `msaaSamples 4/2/1`,
  `tileError 2/2/4`.
- `detectLowEndProfile()`: `?profile=low/high` URL override, `deviceMemory < 6 GB`, `cores <= 4`,
  or mobile UA regex `/Android|iPhone|Mobile/` — *"false negatives just mean adaptive tiering
  starts at 'high' and demotes on evidence."*
- Sampling rides `scene.postRender` so it pauses cleanly when the render governor idles.

### Finding 3.3 — eventBus + relevance: the spine and the budget brain
Evidence: `gods-eye-view://src/core/eventBus.js`, `src/core/relevance.js`

- eventBus: **synchronous** pub/sub (*"propagation cost is a loop over a Set, i.e. microseconds"*),
  bounded per-channel replay buffer (32) so lazily-loaded modules see history instead of a cold
  void, `coalesceKey` merges bursts in the buffer only (dispatch stays lossless), throwing
  listeners are isolated, channel naming `domain:subject:aspect`.
- relevance: *"the only honest question left is what gets cut."* Score = severity (power curve,
  exponent 1.5) × recency decay (exponential, half-life 6 h) × interaction boost for things the
  user touched; `selectWithinRelevanceBudget()` returns `null` (caller keeps legacy ordering) when
  no signals exist — *"relevance upgrades adopters; it never ambushes them."* Tie-breaks are
  deterministic (score desc, id asc) so a cohort cannot reshuffle frame-to-frame on sort
  instability.

### Finding 3.4 — Camera verbs: one motion at a time, layered shaping, reduced-motion aware
Evidence: `gods-eye-view://src/cameraVerbs.js`

- One motion slot: `once` = bounded eased nudge; `continuous` runs until stop, **ANY manual camera
  input cancels it** ("the cancelFlight reflex"), and navigation tools release the owner before
  mutating the camera.
- Verbs take *speed words*: `ORBIT_DEG_S {slow:2, normal:6, fast:15}`, `PAN_VIEW_FRACTION_S
  {0.08, 0.2, 0.45}`, `ONCE` nudges 30°/15°/0.9 s.
- Route dolly is built from four independent layers that each flatten to nothing: **trapezoid
  speed profile** (eases in/out over `ROUTE_RAMP_S 2.4`, capped at 35% of a short route), **banked
  roll** (`ROUTE_BANK_MAX_DEG 10`, 0.44° bank per °/s of turn, *two cascaded first-order filters*
  lead 2.2 / settle 1.6 for C¹ entry/exit — *"this is a map, not a flight sim"*), **altitude
  breathing** around 260 m AGL, **gaze lead** of `ROUTE_LOOKAHEAD_S 6.5` s (clamped 120–600 m) with
  exponential smoothing at 1.6/s. Pitch locked at −32° so framing doesn't change with the speed
  word. **Under `prefers-reduced-motion` the last three layers zero out** and the dolly is a plain
  eased track.

### Finding 3.5 — Never-vanish LOD discipline
Evidence: `gods-eye-view://src/data/aircraftRecession.js`, `src/data/trailRenderer.js`

- Distant billboards: limb-relative recession with **`scaleFloor 0.45`, `alphaFloor 0.35`**
  (combined alpha floor 0.20) — things shrink and dim toward the horizon but *"never edits that
  scalar, culls a contact, or allows alpha to reach zero"*; a write epsilon (0.005) avoids
  per-frame uniform spam. Globe-view blend happens over 3.5–4.5 Mm of camera height.
- Trails: one entity polyline using a depth-fail material — occluded segments draw **dimmed
  (alpha 0.4) instead of vanishing**; the owner directive was *"the line must ALWAYS be visible."*
  Glyph→3D-model swap happens on approach (`cockpitAirLod`, per-class models).

### Finding 3.6 — Automated gates everywhere, and measured perf baselines in-repo
Evidence: `gods-eye-view://scripts/check-bundle-budget.mjs`, `scripts/smoke-pr-gate.mjs`,
`depcruise.config.cjs`, `docs/PERFORMANCE.md`, `TESTING.md`

- **Bundle budget gate:** absolute gzip ceilings (initial JS 260 KB, eager total 320 KB, CSS 60 KB)
  plus a **delta budget vs committed baseline — a PR may not grow the initial chunk by more than
  `GROWTH_ALLOWANCE_KB = 50` gzip without re-baselining. "Growth is a deliberate act, not an
  accident."**
- **Smoke PR gate:** fast subset — critical module graph imports, lazy-layer manifest matches
  persistence registry, tool-schema contract validates, mock layer lifecycle round-trip.
- **depcruise forbidden rules:** boot-critical modules must not statically import the voice stack
  (the exact leak that dragged every layer into the eager graph — use `import()`); the layer
  manager stays layer-agnostic (layers register themselves); app code never imports a worker file;
  **no circular imports** (warn) — *"circular imports are a slow-motion architecture failure."*
- `main.js` lazily imports the heavy subsystems (`scenes/director.js`, `annotations/`, `voice/`)
  behind user intent.
- `docs/PERFORMANCE.md` records measured baselines (startup medians ~605 ms, per-layer cold
  activation seconds, stress-scene FPS, JS heap) with capture conditions — results, not vibes.
- `TESTING.md`: adversarial-review batches, headless `qa-*.mjs` harnesses with screenshots +
  JSON reports on a **deterministic virtual frame clock**; `--headful` removes SwiftShader flags
  for real-GPU sign-off.

---

## TOP LESSONS FOR ANATOMY ARCADE

Each lesson: (a) lesson, (b) evidence, (c) exact application to the heart mission / R3F app,
(d) mobile caveat.

**L1 — Replace every lerp with the frame-rate-independent form `a += (b-a)*(1-exp(-rate*dt))`.**
(b) `red-sands://src/player/CameraRig.js` (all 15+ filters) and `golden-saucer://frontend/src/engine/Game.ts` (dt clamp note).
(c) Our camera follow, vessel-drift, HUD pulse, FOV kick and damage-shake decays should all use
named rate constants (rad/s, 1/s) — never `lerp(a,b,0.1)` per frame, which changes feel with FPS.
(d) None — one `exp()` per property per frame is free on mobile.

**L2 — Smooth the world in DISTANCE, not TIME, when moving fast.**
(b) `red-sands://src/player/CameraRig.js:222–235` (`gRate = 3.6 + hspd*1.15 + |gErr|*3.5`).
(c) Our camera rides a spline through a tube at flight speed; a fixed time constant makes the view
swim over wall detail at high speed and go dead at low speed. Scale the camera-filter rate with
player velocity so the smoothing smooths the same *metres* at every speed.
(d) None.

**L3 — Author game feel as real-world constants with a windup, not as multipliers.**
(b) `red-sands://src/player/Player.js:114–124` (WALK 1.62 / JOG 3.95 / SPRINT 6.60 m/s; ACCEL 8.2 /
DECEL 11.0 / STOP 9.4 m/s²; SPRINT_WINDUP 1.15 s).
(c) Our nano-robot thrust should be m/s and m/s² against a stated vessel scale (1 unit = 1 mm or
whatever we canonize), with a hold-to-boost windup (~1 s) so "boost" has a build; document the
constants in one table like `Config.js` does.
(d) None — but touch input needs a bigger dead-zone gate, not different constants.

**L4 — Camera life: layered incommensurate sines + gait-coupled bob + k²-decaying shake impulse.**
(b) `red-sands://src/player/CameraRig.js:419–447` (amplitudes 0.004–0.011 rad at 0.51–1.61 Hz;
bob `lerp(0.020,0.042)*speed01`; shake `amp*k²*0.12` at 61.3/47.7 Hz).
(c) A sterile camera is the #1 "cheap demo" tell. Add a "probe hum" idle micro-sway (slightly
*more* at rest — `(0.7+0.5*still)`), a pulse-coupled bob synced to blood-flow phase, and one
`shake(0.5, 0.35)` impulse on plaque-contact damage that drives both camera and PostFX.
(d) Trivial cost; gate amplitude behind `prefers-reduced-motion` (see L12).

**L5 — Camera must never clip: shorten instantly, extend slowly; smoothed floor-lift, not a hard clamp.**
(b) `red-sands://src/player/CameraRig.js:390–417` (sphere-cast r=0.45; extend rate `1.6+1.6*still`; floor lift rise 30 / fall 3.2 + hard backstop).
(c) Our near-wall camera should raycast to the vessel wall and pull in instantly when blocked, let
out slowly when clear — running along the wall must not pump the camera. A smoothed "min distance
from wall" lift with a hard backstop prevents kinks when cresting plaque ridges.
(d) One raycast per frame vs wall SDF/spline is fine; avoid per-frame triangle casts on mobile.

**L6 — Mouse/touch look authority must LATCH against auto-follow, then ease recentre.**
(b) `red-sands://src/player/CameraRig.js:253–289` (3.4 s hold, squared-on-lowpass ramp, speed-scaled, suspended while aiming/at rest).
(c) Our auto-follow (objective direction) fights the player's look exactly the way the character
facing fought RDR2-style mouse-look. Latch: while the user is touching/looking, the rig points
where they chose; only after a hold expires does auto-recentre ease in, scaled by flight speed;
never recentre while a scan/aim is active.
(d) None; this is what makes touch look usable at all.

**L7 — Quality tiers = one frozen explicit table + coarse detect + FPS-driven governor with hysteresis.**
(b) `red-sands://src/core/Config.js` (presets + `deviceMemory/cores` detect) and
`gods-eye-view://src/quality/adaptiveQuality.js` (FPS_FLOOR 34 / CEILING 52, 3 bad / 6 good 2-s
windows, 5 s cooldown, resolutionScale 1.0/0.85/0.75).
(c) We already have LOW/MED/HIGH + AUTO; add (i) an explicit per-preset table listing *every*
knob (DPR cap, particle count, cell count, shader path, bloom on/off), (ii) an adaptive governor
with these exact hysteresis constants so a temporary dip doesn't flip quality mid-mission, and
(iii) `?profile=low/high` URL overrides for debugging.
(d) This is the mobile-viability core: demote before you drop frames, start low on
`deviceMemory < 6 GB` / `cores <= 4` / mobile UA, never promote without 12 s of good evidence.

**L8 — Stop rendering when nothing moves: ref-counted continuous-render holds.**
(b) `gods-eye-view://src/renderGovernor.js` (requestRenderMode, owner-id holds, 16 ms frame-coalesced burst guard; the 60%-GPU-parked-camera motivation).
(c) Menu scene, pause menu, education panel, and mission-complete screens don't need 60 fps rAF —
run R3F `frameloop="demand"` and invalidate only on interaction/data; every per-frame system
(blood flow, cell spin, HUD telemetry) registers a hold for its lifetime. Battery + thermal headroom
on phones is the whole mobile law.
(d) The biggest mobile win in this whole document; zero visual cost.

**L9 — Stateless GPU particles in a camera-wrapped box beat CPU pools for ambient fields.**
(b) `red-sands://src/render/particles/ParticleShaders.js` header (FIELD_* analytic seed+clock
positions, wrap box follows camera, *"instantly full... no warm-up"*; POOL_* for discrete events).
(c) Blood cells / plasma motes / debris = FIELD-style: instanced quads whose positions are an
analytic function of seed + time + vessel spline, wrapped into a box that follows the player —
zero per-frame CPU, no pop-in, identical logic for the viral/brain missions. Keep discrete event
bursts (plaque dissolve chunks) as small CPU pools with an authored budget from the quality table.
(d) Instancing is cheap on mobile; cap counts via `particleBudget`-style preset fields (red-sands
low = 1500; we should cap RBC instances ~800–1500 on LOW).

**L10 — Named colour grades with measured latitude/toe; never "fix" shadows by deleting red.**
(b) `red-sands://src/render/postfx/Grade.js` (latitude 16.5→14.6 with measured chroma/luma fallout; split-tone weight `(1-luma)²` lands on the darkest pixels).
(c) Our palette is crimson-on-near-black — exactly the failure shape: a cool or tinted shadow
operator that subtracts red will turn arterial shadow into "electric navy" mud. Put warmth in the
highlight tint, keep shadows neutral-dark by *adding* the complement, and fix `latitude/toe` (or
our AgX/LUT equivalent) from measured median-luma screenshots, not eyeballing. One grade pass at
low-res is all mobile needs.
(d) A single composite grade pass is mobile-fine; skip multi-pass colour tools on LOW tier.

**L11 — Deterministic capture harness + metric gates + temporal critique = the VLM-round immune system.**
(b) `red-sands://tools/capture.mjs` (own ephemeral Vite server, canonical SHOTS, settle frames,
free-camera contract), `tools/metrics.py` (*"every gate... was ONCE REAL... this is the immune
system"*, non-zero exit), `tools/motion.py` (shimmer/pop/flicker — *"a perfect screenshot can come
from a frame that boils"*), `tools/scout.mjs` (adversarial poses), `docs/CRITIC.md` + `docs/PROCESS.md`
(four instruments; builders never grade their own work; findings must name shot+defect+technique+system).
(c) Directly upgrades our 5 VLM rounds: seed all randomness (`rng(seed)`), add a `setFreeCamera`
equivalent to our camera rig, define ~8 canonical shots (menu, vessel cruise, plaque close-up, scan
panel, dissolve, flow-restored, results, mobile layout), settle before screenshot, keep every VLM
finding as a permanent assertion (metric gate or code comment + test), and shoot motion strips for
shimmer/LOD-pop before signing off.
(d) Use `--fast`-style reduced settings and SwiftShader-safe waits for sandbox runs (we already
know 8–12 s settle from P1-P3); mobile shots at DPR 1 and a low-tier preset.

**L12 — One-motion-at-a-time camera choreography with cancel-on-input and reduced-motion layers.**
(b) `gods-eye-view://src/cameraVerbs.js` (single motion slot, ORBIT_DEG_S speed words, dolly =
trapezoid + bank ≤10° via two cascaded filters + gaze lead 6.5 s + altitude breathing, all zeroed
under `prefers-reduced-motion`) and `src/scenes/director.js` (deterministic shot lists, ESC aborts).
(c) Our intro cinematic / flow-restore payoff should be *verbs*: one bounded eased move at a time,
any touch/WASD cancels immediately, flourish layers (roll, breathing, lead) each flattenable —
which gives us reduced-motion compliance for free.
(d) Zero-cost; reduced-motion support is both accessibility and a perf mode on weak phones.

**L13 — Trigger/objective events need arming + cooldown, not bare distance checks.**
(b) `golden-saucer://frontend/src/engine/Game.ts checkExits()` (radius to navmesh-snapped anchor;
arm on spawn; fire only after leaving range and returning; 2.0 s cooldown; 250 ms hold / −2000 ms
debounce for edge exits).
(c) Our arrive-at-clot, scan-zone and treatment-segment triggers should reuse this exact state
machine to prevent double-fires and "bouncing" objective banners when the player loiters at the
boundary; anchor distances to the spline, not to bounding boxes.
(d) None.

**L14 — House architecture: pure policy modules + colocated tests + enforced dependency rules + a bundle budget gate.**
(b) `gods-eye-view://src/core/eventBus.js`, `src/core/relevance.js` (191 colocated `.test.mjs`),
`depcruise.config.cjs` (no core→voice static imports; manager layer-agnostic; no worker imports;
no cycles), `scripts/check-bundle-budget.mjs` (50 KB gzip growth rule, ceilings 260/320/60 KB),
`docs/PERFORMANCE.md` (measured baselines in-repo).
(c) Split `src/game` so decisions are pure functions (objective gating, scan eligibility, rank
math, quality policy) with `.test.mjs` beside them, and R3F components stay thin renderers; add
depcruise rules (game core must not import UI; UI must not import three); gate the bundle: Qwen
panel + voice + heavy post FX behind `import()`, and a script that fails if initial JS grows >50 KB
gzip without re-baselining.
(d) Smaller eager bundle = faster first paint on mobile networks; lazy post-FX keeps low-end boot
snappy.

**L15 (bonus) — Perf data is a document, not a memory.**
(b) `gods-eye-view://docs/PERFORMANCE.md`; `red-sands://src/core/Engine.js` per-system EMA profiling.
(c) Add a `docs/PERF-BASELINES.md`: per-tier FPS on the sandbox GPU and a real phone, per-system
frame cost (expose an FPS/debug readout fed by an EMA like red-sands `prof[id]`), so tier changes
and shader rewrites are judged against numbers.
(d) None.

### What to copy structurally (one-paragraph answer)

From red-sands: the **system registry engine** (id/init/update/lateUpdate + per-system EMA cost
attribution + adaptive-governor hook), the **frozen quality preset contract**, the **capture/
metrics/motion/scout tooling**, and `CONTRACTS.md`-style agent rules (determinism, draw-call budget
~2000/16 ms, linear-HDR authoring). From golden-saucer: the **prefetch + transition-overlay rule**,
the **trigger state machine**, loop hygiene (`dt` clamp 1/15 + throttled-tab watchdog), and
debug overlays as first-class toggles. From gods-eye-view (house style): **colocated pure-policy
modules with tests**, the **eventBus** discipline (sync, bounded replay, coalescing, channel
naming), the **render governor**, **adaptive quality with hysteresis**, **never-vanish LOD floors**,
**depcruise boundaries**, the **50 KB bundle-growth rule**, and the culture of **measured baselines
and adversarial QA harnesses**.
