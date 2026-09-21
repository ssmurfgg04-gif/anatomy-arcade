# RA-3 — Procedural WebGPU family: LAAS / threejs-world / Turbo Kart Rush / Murmur / Fable Lite / World of Light

> Research-only deliverable for ANATOMY ARCADE (heart mission, R3F/Three.js, **mobile-first hard law**).
> All repos cloned shallow into `/home/z/my-project/tmp-research/` for study. No app code touched.
> Scope: extract what **transfers to WebGL/R3F on mobile**; flag what is **desktop-only WebGPU luxury**.

## Repo identification (GitHub search results, 2026)

| Codename | Repo | Stars | Pushed | Evidence it's the right one |
|---|---|---|---|---|
| LAAS | `Vodkadav/minecraft3d` | 0 | 2026-09-07 | desc: "PROJECT LAAS — a fully procedural open world generated in the browser with WebGPU"; 4×4 km, TSL + WGSL compute, 131k particles (README + src) |
| LAAS (demo clone) | `mrlin728/fable5-world-demo` | 4 | 2026-08-17 | desc "LAAS WebGPU procedural world demo"; same `PROJECT_LAAS_v2.md` brief, v1-era snapshot |
| threejs-world | **NOT FOUND** | — | — | 7 query variants tried, see §2 |
| Turbo Kart Rush | `bridge-mind/turbo-kart-rush` | 37 | 2026-09-01 | "Arcade kart racer… Three.js. 100% procedural assets. Built by five Claude Fable 5.1 sub-agents from one prompt" |
| Murmur | `anhduc88vn/murmur` | 0 | 2026-07-27 | "one-input WebGPU flight game built with three.js… single prompt" — has adaptive quality governor (`src/core/perf.ts`) |
| Fable Lite | `wass08/fable-lite` | 8 | 2026-06-14 | "Three.js WebGPU action-RPG… wizard punting chickens" (Wawa Sensei) |
| World of Light | `teuzowebdeveloper9/world-light` | 1 | 2026-07-16 | "Infinite procedural 3D world — React Three Fiber, Rapier, Web Workers and god rays. Built with Claude Fable 5" |

---

## 1. LAAS (`Vodkadav/minecraft3d`) — fully procedural 4×4 km WebGPU open world

**Stack:** three.js `WebGPURenderer` + TSL materials + raw WGSL compute, TypeScript strict, Vite. **No WebGL fallback by design**; mobile gets a "use a computer" notice. ~21k LOC.

**Scale:** 4096² heightfield (1 m/texel), 2048² erosion sim, CDLOD quadtree + far-shell out to 14 km, 6 biomes, ~190k trees + 450k understory via GPU clustered-Poisson scatter, ~1M grass blades, 131,072 GPU particles, 4-cascade CSM + PCSS, Hillaire LUT atmosphere, raymarched clouds, froxel volumetrics, TRAA.

**Key findings:**

- **Quality presets = smaller grids, never fewer systems** (`src/world/WorldConst.ts:47-68`): `low|mobile|high|ultra` change only `heightRes` (2048 vs 4096), `simRes` (1024 vs 2048), `erosionIters` (400–900), `tileVerts` (49–81). Every visual system stays on; resolution/detail is the sacrifice. Mobile preset ≈ low with fewer erosion iterations.
- **GPU particles** (`src/gpu/passes/Particles.ts`): 131,072 particles in a **toroidal box around the camera (±36 m horizontal, ±24 m vertical)**; a compute kernel integrates positions against the same global wind field the vegetation uses; particles that leave the box re-roll *and re-roll their TYPE from the environment* (snow over snowy biome, leaves under canopy) — "populations follow the world without any CPU work". Rendered as **one instanced draw of camera-facing quads**, lit (MeshStandardNodeMaterial), not basic.
- **Atmosphere** (`src/sky/Atmosphere.ts`): Hillaire-style LUTs — transmittance 256×64, multiple-scattering 32×32, sky-view 192×108 storage textures, baked/re-baked on GPU; sky, aerial perspective and light color all sample the LUTs. This is the "expensive but once-baked" tier.
- **Wind** (`src/render/Wind.ts` — densest game-feel doc in all 6 repos): one global wind field (uniform dir + two advected fbm gust octaves: 85 m fronts + 17 m detail, advected at 10.5 m/s). Laws worth stealing verbatim:
  - "Strong wind makes everything deflect MORE, never oscillate faster": mean lean ∝ strength², per-instance natural frequency 0.15–0.45 Hz · 1/√scale is CONSTANT in time.
  - Explicit bug warning: never multiply `time` by a time-varying frequency — `phase = t·f(t)` slews by `t·Δf` and "explodes into chaotic fast jitter exactly where gust variance is highest".
  - Branches lag the gust by sampling the field 5.5 m downwind ("the front that hit the trunk ~½ s ago") — lag = skeletal feel.
  - Leaf flutter is aperiodic (advected fbm gradient, zero-mean), never sines.
- **Caustics** (`src/render/Caustics.ts`): 512² tile re-baked per frame by compute (analytic 7-wave gravity field → small-angle refraction → caustic intensity = **inverse Jacobian determinant** of surface→bed projection; det→0 at folds = bright filaments). Cost stated: ~0.05 ms GPU. Pattern lives at the surface entry point with depth-dependent parallax; caustics multiplied into ALBEDO so CSM shadows kill them for free.
- **Perf debugging example** (`STATUS.md`): terrain splat material was ~52 ms of a 73.5 ms GPU frame (35 live noise octaves); fixed by baking noise to textures, GTAO samples 16→8, clouds half-res RTT, CSM maxFar 3200 → **19–23 ms GPU @1080p**. Principle: bake per-octave noise into textures; halve raymarch steps before cutting features.
- **QA:** self-QA loop — Playwright headless Chromium with WebGPU/Metal adapter, screenshot + pixel sampling + frame-aligned determinism diff + per-pass GPU profiling; STATUS.md as durable model memory. Playwright WebGPU traps recorded: secure context required (probe on localhost, not about:blank); default headless is GPU-less.
- **Camera:** walk mode + free-fly (V), wheel = fly speed, 9 bookmarks `?shot=1..9`, 90 s flythrough, `?cam=x,y,z,yaw,pitch,fov` pose serialization (we can reuse pose-string format for cinematic keyframes).

---

## 2. threejs-world — NOT FOUND

Queries tried (GitHub repo search API): `threejs-world`, `threejs-world in:name`, `threejs-world webgpu`, `caustics 131k particles`, `built on LAAS procedural`, `world threejs atmospheric scattering clouds water`, `threejs world volumetric clouds water particles procedural`. All either 0 results or noise (237 unrelated `threejs-world`-named tutorials). No repo matching "atmospheric LUTs + volumetric clouds + 131k GPU particles + walk/free-fly + cinematic flythroughs" was identifiable; it may be unlisted, renamed, or only hosted as a demo page. **Note:** `mrlin728/fable5-world-demo` ("LAAS WebGPU procedural world demo", same brief) is the closest thing found and may be what the lead remembered; it adds nothing over LAAS itself. Moved on per task instructions — every other study item is answered by the other five repos.

---

## 3. Turbo Kart Rush (`bridge-mind/turbo-kart-rush`) — complete kart racer, 5 sub-agents, WebGL2

**Stack:** three.js (plain WebGL renderer), Vite, zero assets. **Runs on WebGL2 in every browser** — the closest cousin to our stack in this family.

**Architecture worth copying:** orchestrator wrote `CONTRACT.md` first (world conventions + module APIs + game flow + quality bar), froze `src/core` (types/constants/math/event bus), then 5 sub-agents owned disjoint slices (`game/ui`, `kart`, `track`, `items/ai`, `audio/fx`) with a typed event bus between them. No sub-agent edited another's files.

**Game-feel findings (all in WebGL terms):**

- **Chase camera** (`src/game/FollowCamera.ts`) — every number is calibrated:
  - FOV 68→80: `targetFov = lerp(68, 80, clamp01(speedNorm² · 0.7 + boost · 0.5))`, damped at λ=4.
  - Yaw damping is slower **while drifting** (λ 3.4 vs 6) and the yaw target is offset by `DRIFT_OFFSET = 12°` opposite the drift — so the kart visibly slides across frame instead of camera gluing to heading.
  - Chase distance grows with speed (+0.9) and boost (+0.45); height +0.2. Position lerp λ=16, look λ=16·1.4 (look leads position).
  - Look-target uses the kart's **real heading, not the damped camera yaw** — same "slide across frame" trick.
  - Roll from steer+drift-lean, max 0.045 rad, damped λ=5; look-back is a smooth 0→1 blend (λ=9) that also un-leans roll.
  - Shake: amplitude-per-event (`impulse·0.05` clamped 0.06–0.45; nearby explosions shake ∝ `0.5 − d/(radius·8)`), layered sines at ~60 Hz phases (1.3/1.7/2.1/3.7/4.3), decay λ=5.5.
  - Ground clamp: camera never below `groundY + 0.6` via track surface query.
  - **Cinematic swoop**: `setCinematic(fromPos, fromLook, duration, fromFov=50)` eases into the chase with smoothstep + extra hermite `k·k·(3−2k)` — exactly our intro-cinematic → gameplay handoff pattern.
- **PostFX** (`src/fx/PostFX.ts`): ONE composite ShaderPass does speed lines + radial blur + chromatic aberration + vignette + hit tint + flash + grain over RenderPass → UnrealBloomPass (0.35/0.35/0.9) → OutputPass. Grain is linear-light 1.2% at rest + 0.8% at full boost. Single-pass = mobile-cheap. Fails soft to `renderer.render()` if composer construction throws.
- **Particles** (`src/fx/ParticleSystem.ts`): two fixed pools — 6144 additive + 4096 alpha — drawn as `THREE.Points` with a custom ShaderMaterial and an atlas texture; **CPU ring-buffer writes attributes** (position/velocity/age), never reallocates. This is the WebGL-safe gameplay-FX pattern (drift sparks, boost flames, smoke, dust, speed streaks).
- **Audio** (`src/audio/engine.ts`, `music.ts`): per-kart engine = sawtooth + detuned square + sub sine → lowpass whose cutoff tracks rpm → tanh soft-clip (shared `WaveShaper` curve) → gain; weight classes have base freqs 96/78/62 Hz; non-player voices get a `PannerNode`; turbo whistle + filtered-noise skid are optional layers that only automate when active. Music = lookahead step sequencer (`setInterval` tick, `stepDur = 60/bpm/4`): race 152 bpm (final lap **bpm × 1.1** — cheap tempo juice), menu 100 bpm, results 112, star jingle 170.

---

## 4. Murmur (`anhduc88vn/murmur`) — one-input WebGPU flight game; THE adaptive-quality reference

**Stack:** three.js WebGPU with **automatic WebGL2 fallback** (`?webgl` to force), Vite/Bun. Zero assets. Fixed 240 Hz physics decoupled from display, render interpolates between sim states.

### 4a. Adaptive quality — the single most important artifact (`src/core/perf.ts`)

**Two independent knobs:**

1. **Render scale** — "fast, continuous, invisible", reacts in ~0.4 s.
2. **Quality tier** — "slow, discrete, visible", reacts over seconds with hysteresis + cooldown so it can never oscillate.

**4 tier profiles** (LOW/MEDIUM/HIGH/ULTRA), each a plain data object (`QualityProfile`): `maxPixelRatio` (1 / 1.25 / 1.6 / 2), `flockMotes` (**1024 / 3072 / 8192 / 20480**), `ambient` particles (**6000 / 20000 / 55000 / 120000**), bloom on always (strength 0.55→1, radius 0.22→0.45), chromatic/grain off-on, godrays off/on (samples 0/24/40), dof ULTRA-only, shadows off→1024→2048, `geometryDetail` 0.35→1 (fed to procedural geometry generators), `propDensity` 0.3→1, trailSegments 12→40, drawDistance 120→260, parallax layers 2→5. **Design law in comments: "preserve the intended experience: silhouette, colour, pacing and audio survive at every tier; only density and post-processing luxury are traded away."**

**Governor.update(dt, frameMs)** exact mechanism:

- Budget from measured refresh: `setRefresh(hz)` snaps to 60/75/120/144/240, **caps at 120 fps** ("never chase >120 fps — costs battery for nothing"), `budgetMs = 1000/target`.
- Warmup 1.6 s after any tier change (no decisions during shader compile humps).
- `over = frameMs > budget·1.18`, `under = frameMs < budget·0.72` (deadband in between = no thrash).
- Fast knob: if over and scale > minScale → `renderScale -= 0.06`, cooldown 0.35 s; if under and scale < 1 → `renderScale += 0.03`, cooldown 0.7 s (asymmetric — drops faster than it climbs). `minScale = 0.5` on coarse pointer, 0.6 desktop.
- Slow knob (only when tier unpinned): accumulators `overTime`/`underTime`; **tier drops only once render scale has bottomed out** ("resolution is the cheaper sacrifice") after `overTime > 2.2 s` AND `sinceChange > 4 s`; on drop, `renderScale` is re-inflated +0.2 (new tier is cheaper). Tier up requires `underTime > 8 s` AND scale ≥ 0.995 AND `sinceChange > 10 s`.
- Initial guess `guessTier()`: mobile (coarse pointer or UA) → tier 1 if `deviceMemory ≥ 6 && cores ≥ 8` else 0; desktop → 3 if mem ≥ 8, 2 if mem ≥ 4, else 1.

**frameMs measurement** (`src/core/loop.ts`): EWMA `frameMs += (clamped − frameMs) · 0.08`; refreshHz from median of an interval sample buffer. Fixed-timestep loop with `maxSubSteps` and interpolation alpha.

**Application** (`src/render/Stage.ts:285-290`): `pixelRatio = min(dpr, profile.maxPixelRatio) · renderScale` → `renderer.setPixelRatio(pr)` — one line to bind the governor to R3F's `gl`. On tier change `applyProfile()` toggles shadowMap, and **rebuilds the GPU particle buffers at the new capacity while carrying over `activeCount`** (no hard reset of the live scene).

### 4b. Other findings

- **Compute flock** (`src/render/flock.ts`): 20,480 motes max in a persistent storage buffer following the player's **actual past flight path** — a ring buffer of the last 5 s sampled on a fixed clock is uploaded each frame; curl-ish turbulence + per-mote banking + repulsion field so the flock parts around the player.
- **Sky** (`src/render/sky.ts`): "the sky is the largest storytelling surface — it is most of every frame." ONE shader with six blendable behaviours; a movement change **rewrites** the sky rather than tinting it (state-driven uniforms over one material).
- **Post** (`src/render/post.ts`): radial speed smear is **masked out around the mote** — "a blur that hides the thing you have to react to is just damage." Speed FX must never obscure the player/target.
- **Audio** (`src/audio/`): 100% synthesized. Bus topology documented in `AudioDirector.ts`: voice→channel→dry + reverb send (predelay → generated IR, A/B crossfade) + ping-pong delay → musicBus/sfxBus → masterGain → DC block → **limiter** → analyser. `VOICE_CAP = 56` with measured rationale ("fullest arrangement settles at ~34 concurrent voices; burst adds ~12"); overflow **steals lowest-priority voices with a 30 ms fade**. Reverb IRs generated in code (`noise.ts:createImpulseResponse`: mulberry32-seeded early-reflection pattern + decaying filtered noise tail, cached per space profile). Lookahead scheduler at 25 ms. Music/SFX each own their reverb return so music-at-0 still leaves dry SFX with room. Bed-ducking on hits: `duckBeds(t, amount, hold)` with amounts 0.06 (minor) → 0.85 (death, 3 s hold).
- **Accessibility as design**: reduced motion/flash, shake amount slider, quality tier pinnable, `prefers-reduced-motion` honored on first run.

---

## 5. Fable Lite (`wass08/fable-lite`) — WebGPU action-RPG, WebGL2 fallback, works on phones

**Stack:** three.js `WebGPURenderer` + TSL, plain JS in `src/`, **auto-falls back to WebGL2** (`renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2 (fallback)'`), mobile joystick + tap-to-cast implemented.

**Findings (mobile-relevant):**

- **DPR policy** (`src/main.js:20`): `renderer.setPixelRatio(min(devicePixelRatio, IS_MOBILE ? 1.5 : 2))`; `IS_MOBILE = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window`. No runtime governor — static tier + fallback, the cheap version of the problem.
- **No-hitch pipeline discipline** (README "Tech"): **fixed pool of 8 point lights** (adding/removing lights forces shader rebuilds = hitch), **pooled scorch decals/shockwaves**, and — the best trick — **every FX pipeline pre-warmed at load with silent casts below the map** so the first real cast never compiles shaders mid-fight.
- **Game feel**: trauma-based camera shake (squared falloff: `t2 = trauma²`, decay 1.5/s, positional + roll), hit-stop on impacts, slow-mo on multi-kills, squash & stretch on kick, white hit-flash, dust puffs, floating combat text.
- **Instancing discipline**: 220+ trees from 5 ez-tree procedural variants fully instanced into ~10 draw calls; 12,000 instanced grass blades with TSL `positionNode` two-frequency wind and per-instance hue from `instanceIndex`; BVH (three-mesh-bvh) for collisions/raycast.
- Note: **no dynamic quality governor here** — the "ADAPTIVE" billing in the task belongs to Murmur; fable-lite contributes the static mobile cap + no-hitch patterns instead.

---

## 6. World of Light (`teuzowebdeveloper9/world-light`) — R3F + Rapier + Web Workers + Playwright QA

**Stack:** Vite · React 19 · R3F 9 · drei · @react-three/rapier · @react-three/postprocessing · simplex-noise · Zustand · Web Worker. Desktop-gated (touch devices see a notice — the opposite of our law; flag).

### 6a. The Playwright QA loop we want to copy (`scripts/screenshots.mjs`, `scripts/verify-npcs.mjs`)

- Spawn `npx vite --port <fixed> --strictPort` detached, poll `fetch(BASE)` up to 60×500 ms.
- `chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })` — WebGL via SwiftShader headless.
- Collect `page.on('pageerror')` → **non-zero exit code if any JS error** during the session (CI-usable).
- Drive *real gameplay*: keyboard down/up (`KeyW`, `ShiftLeft`, `Space`), mouse-drag camera leveling, staged `waitForTimeout` calls with the explicit comment that SwiftShader FPS is low and clamped dt (0.05) stretches wall-clock — timeouts are generous.
- **DEV-only state hooks** on `window` (`__playerState`, `__npcState`, `__cameraRig`, `__spawnBiome`…) let the script assert on game state, not pixels: NPC verification warps the camera via `__cameraRig.yaw = Math.atan2(...)` to walk at targets, un-sticks the player by jumping+turning, and shortens triggers via query params (`?sageAt=6&wolfAt=40`).
- Retry-reload loop until a random session variable hits the wanted value (biome 0) for deterministic screenshots.

### 6b. R3F architecture

- **Web Worker chunk generation** (`src/workers/chunkWorker.ts` + `chunkWorkerClient.ts`): worker computes heightmap/normals/vertex-colors/decoration lists into `Float32Array`s and `postMessage`s **with transferables**; main thread only builds meshes. Client = priority queue, `MAX_IN_FLIGHT = 2`, priority re-written on re-request (`min`), dedupe by chunk key.
- Chunk params (`chunkTypes.ts`): `CHUNK_SIZE 96`, `CHUNK_RES 40` (+3 skirt ring), `SKIRT_DEPTH 10` ("saia" — edge ring duplicates border and drops it to hide seams between chunks), `ACTIVE_RADIUS 3`, `UNLOAD_RADIUS 5`; far chunks disposed via R3F unmount.
- **"Guaranteed ground"**: the *same analytic terrain sampler* used by the generator is sampled at the player position every frame — collider can never disagree with visuals, player can never fall through. Physics capsule has zero friction; movement velocity is 100% code-driven.
- **Game feel** (`Player.tsx`, `cameraRig.ts`): fixed physics timestep; asymmetric gravity (falls faster); variable jump height (release cuts jump); **coyote time + jump buffering 0.12 s**; terminal fall velocity; slope limit 45°→56° smooth; **landing squash & stretch: `squash = max(squash, 0.08 + impact·0.2)`, applied `scale.set(1 + s·0.5, 1 − s, 1 + s·0.5)`, relaxed at damp λ=9**; footstep SFX cadence follows actual physics speed. Camera: sprint **FOV kick** (damped λ=5, only near max speed), cinematic diving entrance, terrain-aware never-clips.
- **Atmosphere on a budget** (`src/visuals/SkyAtmosphere.tsx`): ONE backside sphere (r=1400, follows camera, `renderOrder −10`, `depthWrite false`) with a hand-written GLSL: 3-stop vertical gradient (horizon/mid/zenith, day↔night uniform crossfade), sun glow via `pow(dot(dir,sun),7)` + `pow(...,48)` core, moon halos, hash-grid stars, **two silhouette mountain-ridge layers baked into the shader** (sum of 4 sines in azimuth) with fog swallowing the horizon — "depth infinity at zero cost". Day/night: sun+moon dirs, directional + hemisphere light, fog color and sky uniforms all driven from one `dayNight` module (10 min day / 3 min night).
- **Particles** (`FloatingParticles.tsx`): **1,200** golden dust points in a 240×90×240 box that **wraps around the camera in the vertex shader** (toroidal re-centering), additive blending, `gl_PointSize = (2.2 + seed·3.4) · 170/dist`, twinkle per seed, near+far smoothstep fades, `frustumCulled = false`. Zero per-frame CPU. Color (1.4, 1.15, 0.75) is >1.0 so bloom picks it up.
- **Post** (`PostProcessing.tsx`): `EffectComposer multisampling={0}` (SwiftShader-safe) → GodRays from sun mesh → Bloom (selective: only HDR materials — sun, obelisks, particles — exceed threshold) → Vignette(0.22/0.55) → ACES.
- Characters modeled **procedurally in headless Blender** (`blender/*.py` → GLB): no-rig, baked object-transform `Walk`/`Fly` clips, crossfaded from real physics state (grounded+speed → Walk; >0.2 s airborne → Fly). Cute + cheap.
- Procedural WebAudio SFX (footsteps synced to walk cycle, jump, landing, chimes) — zero audio assets.

---

## TOP LESSONS FOR ANATOMY ARCADE

Format: (a) lesson · (b) evidence path · (c) exact R3F/WebGL-mobile application · (d) transfer verdict.

1. **Two-knob adaptive quality: continuous render-scale + discrete tier with hysteresis.** (a) Resolution is the cheap invisible sacrifice; tier changes are slow, deadbanded and cooldown-protected so they can never oscillate; tier only drops after render-scale bottoms out. (b) `tmp-research/murmur/src/core/perf.ts` (Governor, ~130 LOC), loop EWMA in `src/core/loop.ts:128` (`frameMs += (clamped−frameMs)·0.08`). (c) Port `Governor` verbatim into `src/game/quality/` (it's pure TS, zero deps): `over = frameMs > budget·1.18`, `under = < budget·0.72`; scale steps −0.06/+0.03 with 0.35/0.7 s cooldowns; `minScale 0.5` on touch; tier down after 2.2 s over + 4 s cooldown, up after 8 s under + 10 s cooldown; bind via `gl.setPixelRatio(min(dpr, profile.maxPixelRatio) · renderScale)` in `useFrame`. Replace/augment our static LOW/MED/HIGH with it. (d) **WEBGL-OK** — single biggest win for the mobile hard law.
2. **Tier profiles are data, and particles are the biggest knob.** (a) LOW→ULTRA = 1024→20480 flock motes, 6k→120k ambient, geometryDetail 0.35→1, drawDistance 120→260, post toggles; silhouette/pacing survive, density is traded. (b) `murmur/src/core/perf.ts:48-145` (PROFILES). (c) Encode our tiers as one `QualityProfile` object (cell counts, RBC density, bloom on/off, shadow size, fog ray steps, draw distance in the vessel) and rebuild instanced buffers on tier change carrying the live count (see `murmur/src/render/Stage.ts:308` applyProfile). (d) **WEBGL-OK**.
3. **Mobile-safe particle count is 3 orders of magnitude below the WebGPU showcases.** (a) LAAS/Murmur use 120k–131k GPU-compute particles; the WebGL games use 1.2k ambient shader points (WoL) and 6144+4096 CPU ring-buffer pools (kart). (b) `LAAS/src/gpu/passes/Particles.ts:53`, `murmur/src/core/perf.ts`, `world-of-light/src/visuals/FloatingParticles.tsx:11`, `turbo-kart-rush/src/fx/ParticleSystem.ts:27-28`. (c) Blood cells/debris = `THREE.Points` + custom ShaderMaterial, motion computed IN the vertex shader from time+seed (zero CPU), toroidal box around camera; gameplay FX (scan sparks, plaque burst) = fixed pooled Points with CPU ring buffer; mobile counts 1–6k ambient / ≤8k FX. (d) **WEBGL-OK** (compute-driven 100k versions = DESKTOP-ONLY).
4. **Toroidal wrap box around the camera = infinite particles from a fixed buffer.** (a) Particles live in a fixed box that re-centers on the camera and wraps in the shader; LAAS re-rolls particle TYPE from the environment on wrap so populations follow the world with no CPU. (b) `LAAS/src/gpu/passes/Particles.ts:6-17`, `world-of-light/src/visuals/FloatingParticles.tsx` (uCenter uniform + wrap). (c) Our RBC/platelet/plasma-mote field: wrap position `mod(p − cam + half, size) − half + cam` in the vertex shader; on wrap, read a tiny "zone uniform" (artery/venule/capillary) to switch tint/size/speed. (d) **WEBGL-OK**.
5. **The cheap-90% atmosphere is one backside sphere with a gradient + glow + baked silhouettes.** (a) WoL gets its whole mood from one 48×32-segment sphere: 3-stop gradient, `pow(dot,7)`/`pow(,48)` sun glow, hash stars, 2 sine-sum mountain ridges, horizon fog; LAAS's Hillaire LUTs (256×64 + 32×32 + 192×108) are the desktop tier. (b) `world-of-light/src/visuals/SkyAtmosphere.tsx` (full shader, 141 lines), `LAAS/src/sky/Atmosphere.ts:1-10`. (c) Our glowing-biology backdrop: one shader sphere/cylinder with crimson↔near-black gradient stops, tissue-glow `pow` falloff toward light sources, depth fog toward horizon color; state-driven uniforms (healthy ↔ ischemic) rewrite it like Murmur's six sky behaviours. (d) **ADAPT-THIS-WAY** (LUT/volumetrics = DESKTOP-ONLY; gradient dome = WEBGL-OK).
6. **One composite post pass beats five addon passes on mobile.** (a) Kart's single ShaderPass does speed lines + radial blur + CA + vignette + hit tint + flash + grain (1.2% rest, +0.8% boost); WoL sets `multisampling={0}` for SwiftShader. (b) `turbo-kart-rush/src/fx/PostFX.ts:1-33`, `world-of-light/src/visuals/PostProcessing.tsx:25`. (c) Merge our boost/bloom-adjacent effects into one custom ShaderPass after Bloom; keep `multisampling 0`; bloom threshold ~0.9 with HDR-only emitters (color >1) so only glowing biology blooms. (d) **WEBGL-OK**.
7. **Mask speed effects around the thing the player must react to.** (a) Murmur's radial speed smear is deliberately masked out around the player mote: "a blur that hides the thing you have to react to is just damage." (b) `murmur/src/render/post.ts:16-24`. (c) Our speed lines/flow-streak shader masks a radius around the rig and around the current objective (clot) — velocity reads, target stays readable. (d) **WEBGL-OK**.
8. **Camera feel lives in ~12 constants.** (a) Kart chase: FOV 68→80 ∝ speed²·0.7+boost·0.5, yaw λ 6 normal / 3.4 while drifting with 12° offset so the body slides in frame, chase dist +0.9 with speed, roll ≤ 0.045 rad, shake decay 5.5, ground clamp +0.6, smoothstep cinematic swoop into chase. Murmur side-scroller: partial follow (0.32×), asymmetric damp (climb 4.2 / fall 3.2), FOV +5.2·speedNorm, death dolly, 2° micro-roll, fbm idle drift. (b) `turbo-kart-rush/src/game/FollowCamera.ts:11-27`, `murmur/src/render/cameraRig.ts`. (c) Re-tune our follow cam with partial-look + slower yaw during scan/aim, FOV kick on boost, micro-roll from turn input, cinematic intro = `setCinematic(fromPos, fromLook, dur)` ease into chase (already the kart pattern). (d) **WEBGL-OK**.
9. **Juice formulas: landing squash, trauma shake, hit-stop, bpm ramp.** (a) WoL squash `max(0.08+impact·0.2)` → `scale(1+0.5s, 1−s, 1+0.5s)` relax λ=9; fable-lite trauma² shake decay 1.5/s + hit-stop + slow-mo; kart final-lap music at bpm×1.1; coyote+buffer 0.12 s. (b) `world-of-light/src/player/Player.tsx:357-419`, `fable-lite/src/main.js:36-47,518-519`, `turbo-kart-rush/src/audio/music.ts:549`. (c) Blood-flow surge: FOV+stretch on rig on boost, trauma shake on collision (we have some), slow-mo + duck on clot blowout, heartbeat music tempo ∝ patient stability. (d) **WEBGL-OK**.
10. **Procedural audio = buses + voice cap + generated IRs + lookahead scheduler.** (a) Murmur: music/sfx buses → master → DC-block → limiter; VOICE_CAP 56 with 30 ms fade-steal; convolver IRs synthesized from seeded noise; 25 ms lookahead; hit-ducking amounts 0.06–0.85 with holds. Kart: engine voice = saw + detuned square + sub → rpm-tracked lowpass → tanh softclip → PannerNode. (b) `murmur/src/audio/AudioDirector.ts:1-60`, `murmur/src/audio/noise.ts:116`, `turbo-kart-rush/src/audio/engine.ts:1-15`. (c) Our soundscape: heartbeat = sub sine + filtered thump voice whose rate tracks patient state; flow ambience = filtered noise + slow LFO; scan UI ducked under VO; add a limiter + voice cap so mobile AudioContext never degrades. (d) **WEBGL-OK** — pure WebAudio, zero assets.
11. **The Playwright QA loop is copy-paste ready.** (a) WoL's script spawns vite on a fixed port, launches SwiftShader Chrome (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`), fails on any `pageerror`, drives real gameplay, and asserts through DEV-only `window.__*` state hooks; NPC verifier even re-aims the camera by setting `__cameraRig.yaw`. (b) `world-of-light/scripts/screenshots.mjs`, `scripts/verify-npcs.mjs:1-90`. (c) Add `scripts/screenshots.mjs` + a mission verifier for our golden path (menu → flight → scan → treatment → results), exposing `__gameState`/`__objective` in DEV only; generous timeouts (SwiftShader dt-clamp 0.05 stretches wall clock). (d) **WEBGL-OK** — directly fills our VLM-critique screenshot pipeline need.
12. **Chunked procedural world in a Web Worker with transferables + priority queue.** (a) WoL: worker computes positions/normals/colors as Float32Arrays, `postMessage(..., transfer)`; client keeps `MAX_IN_FLIGHT=2`, re-prioritizes on re-request; ACTIVE_RADIUS 3 / UNLOAD 5; skirt ring (depth 10) hides seams; the same analytic sampler guarantees ground under the player. (b) `world-of-light/src/workers/chunkWorker.ts:1-30`, `chunkWorkerClient.ts:18-72`, `chunkTypes.ts:9-29`. (c) For the full-body explorer/viral+brain levels: generate vessel-branch geometry + cell scatter in a worker off the render thread; keep one analytic `heightAt`-style function as ground truth for collision. (d) **WEBGL-OK**.
13. **LAAS wind laws apply directly to blood-flow turbulence.** (a) Deflect MORE under strong force, never oscillate faster: per-instance constant natural frequency (0.15–0.45 Hz · 1/√scale), lean ∝ strength², aperiodic flutter from advected noise, downstream lag (5.5 m ≈ 0.5 s) for the skeletal feel; explicit warning never to use time-varying frequency (phase slew explodes). (b) `LAAS/src/render/Wind.ts:1-40`. (c) RBC tumbling + vessel-wall cilia + grass-analog (endothelium): drive amplitude from our flow-strength uniform, keep frequencies constant per instance, add lagged noise sample for wake feel. (d) **ADAPT-THIS-WAY**.
14. **No-hitch discipline + boot gates.** (a) fable-lite: fixed pool of 8 point lights (adding lights = shader recompile hitch), pooled decals/shockwaves, all FX pipelines pre-warmed at load with silent casts below the map; dpr capped 1.5 mobile / 2 desktop. LAAS fails loudly with diagnostics when requirements are absent instead of half-working. (b) `fable-lite/src/main.js:18-27` + README "No-hitch FX", `LAAS/src/core/BrowserGate.ts`. (c) Pre-warm every shader/pipeline during our loading screen (cast one of each effect off-camera); fixed light pool; cap mobile dpr 1.5; keep our quality-AUTO SwiftShader detection as a loud, communicative gate. (d) **WEBGL-OK**.
15. *(Bonus)* **Preset philosophy: "smaller grids, never fewer systems" + bake per-octave noise.** (a) LAAS presets shrink heightRes/simRes/verts but never remove a system; their 52 ms→19-23 ms GPU recovery came from baking 35 live noise octaves into textures, halving GTAO samples, half-res cloud RTT. (b) `LAAS/src/world/WorldConst.ts:47-68`, `LAAS/STATUS.md:131-135`. (c) Our vessel shader noise: bake flow/noise octaves to textures at boot (or use fewer octaves on LOW) instead of dropping the effect; every system stays visible on every tier. (d) **ADAPT-THIS-WAY**.

---

## Not-found & honesty notes

- **threejs-world**: not located after 7 query variants (see §2). If the lead can supply an author name or URL, a follow-up pass can extract its LUT-atmosphere specifics — though LAAS (same brief lineage) already documents the Hillaire LUT approach.
- **Fable Lite** has *no* dynamic quality governor — its "adaptive" reputation reduces to a static mobile DPR cap + WebGL2 fallback; the true adaptive-quality source is Murmur (§4a).
- **World of Light is desktop-gated** (touch devices blocked) — its value here is the QA loop + worker architecture + cheap sky, NOT mobile policy. Do the opposite of its `isDesktopExperience()` for our game.
