# RA-4 — PHYSICS & TECHNIQUE RESEARCH (browser game repos → Anatomy Arcade)

> Research-only. Repos shallow-cloned to `tmp-research/` (delete freely). No app code touched.
> Method: GitHub API search (multiple query variants), clone, read source with line-anchored evidence.
> Filter applied throughout: what transfers to R3F/Three.js WebGL on MOBILE for a nano-robot flying through a vessel tube.

## Repo disposition (8 targets)

| # | Target | Found as | ★ | Last push | Verdict |
|---|--------|----------|---|-----------|---------|
| 1 | Voxelcraft | `bridge-mind/voxelcraft` | 13 | 2026-09-01 | FOUND — single-file Three.js voxel engine, ideal study |
| 2 | Roller Rink 3D | `ClaudiaCornacchia/Roller-Rink-3D` | small | 2026-07-23 | FOUND — exact description match (custom physics, day/night, procedural anim) |
| 3 | AntiGravity Pool | `erichlof/AntiGravity-Pool` | 21 | 2026-07-07 | FOUND — "first real-time pathtraced game for desktop and mobile using WebGL" |
| 4 | Red Reddington Web Demos | — | — | — | **NOT FOUND** (6 query variants + user lookups, see below) → compensated with 2 repos covering the same technique list |
| 5 | Three.js engine + Rapier | `WesUnwin/three-game-engine` | 113 | 2026-01-15 | FOUND — "Simple light-weight game engine using Three.js, three-mesh-ui, rapier" |
| 6 | Prairie Adventure | `digitizdat/prairie-adventure` | 0 | 2025-09-15 | FOUND — jeep on procedural prairie, heightfield physics |
| 7 | San Verde | `ryanfitzpatrickio/san_verde` | 2 | 2026-03-27 | FOUND — "WebGPU-powered open-world driving game built with Three.js" |
| 8 | PigeonWorld | `PeerPigeon/PigeonWorld` | 0 | 2025-12-18 | FOUND — "decently open world game built on PeerPigeon" (P2P) |

### Repo 4 not-found record
Queries tried: `reddington demos`, `red reddington`, `reddington web demos`, `reddington three`, `reddington threejs`, `"web-demos" three.js grass`, plus GitHub user lookups (`Reddington`, `joereddington` — no graphics repos). No match for the described demos collection (grass physics, boats, SDF rocks, volumetric fire, ripples). Per instructions, recorded and moved on.
**Compensation** (same techniques, findable sources): `matthew-kissinger/threejs-field-grass` (interactive TSL grass + body wakes) and `mattatz/THREE.Fire` (★166, volumetric fire) — both studied below.

---

## 1. Voxelcraft — `tmp-research/voxelcraft/index.html` (4,465-line single file, Three.js, no build)

**Chunk streaming with per-frame TIME BUDGET (the single best pattern here).**
- `ChunkManager.update(px, pz, budgetMs)` (L2354–2389): work is time-sliced with `performance.now()` against a millisecond budget. **40 ms budget during loading screen, 6 ms per frame in-game** (L4403, L4412). Three queues — generate (ring RD+2), light (RD+1, needs 8 generated neighbours), mesh (RD, needs 8 lit neighbours for correct cross-chunk smooth lighting) — all sorted **nearest-first** by `dist2`.
- Hysteresis unload: chunks disposed at `rd+3` while loaded at `rd+2` (L2329) → no thrash at the boundary. Dirty-marking propagates to neighbours when an edit touches a border (L2310–2316).
- Ready-gate + progress: `ChunkManager.isReady()` requires the player's 3×3 chunk block meshed before gameplay starts (L2391–2395); `progress()` drives a loading bar (L2397–2402).
- **→ Anatomy Arcade:** our 30+ vessel segments are exactly "chunks": build/advance nearest-first inside a 6 ms/frame budget, unload behind the player with +1 ring hysteresis, gate mission start on the first N segments being ready.

**Greedy meshing with composite quad keys (L2088–2157).**
- Per face-direction, builds a 2D mask where each cell carries a merge key `(tile, AO composite k1, light k2, tint k3)`; runs are grown first in width `while mT[m+w] === t && mK1[m+w] === k1…`, then height, emitting one quad for the whole run. Hidden faces are culled first via `faceVisible()` with `cullSame` semantics (L2035).
- Lesson shape: merging is only valid when **every interpolated attribute matches** — that's why AO/light are packed into the key, not just the texture.
- **→ RBC lesson (see Lessons #10):** for our instanced blood cells, the equivalent win isn't greedy meshing (cells are discrete) but the *underlying principle*: one instanced draw of a cheap deformed-in-shader primitive beats many small unique meshes, and per-instance variation must live in attributes the shader reads, not geometry.

**Custom AABB physics — axis-separated sweeps (L2410–2487).**
- Entities are `{x,y,z(feet),w(half),h}`. `Physics.move()` collects nearby solid boxes (with 1.0 pad), then sweeps **Y first, then X, then Z**, clamping each axis delta to the nearest surface ± `EPS=1e-4` (L2435–2450). Sets `onGround/hitX/hitZ` flags; velocity component zeroed only on the axis that hit.
- **Step-up retry** (L2463–2474): if a horizontal move hit, retry the whole move from `stepHeight` higher; keep it only if the retried horizontal distance `gained > before` — elegant, tiny, no physics engine.
- Edge guard for sneaking (L2476–2481): before allowing a move that leaves `onGround`, verify ground exists under the new position, else revert.
- Fail-safe: **unloaded terrain is treated as solid** (L2421) so you can never fall out of an un-streamed world.
- Constants: `GRAVITY 32, TERMINAL 78, JUMP_VEL 8.4`.
- Voxel DDA raycast (L2722) instead of THREE.Raycaster — grid walk, O(cells) not O(triangles).
- **→ Anatomy Arcade:** if we replace/augment mesh-based vessel collision: per-axis clamped sweep = slide along the wall instead of dead-stop; the "retry from offset" trick generalizes to "try the move again pushed off the wall by the surface normal"; fail-solid for un-streamed segments.

**Loop architecture (L4397–4436).**
- Variable `dt` for view/cosmetics, clamped: `dt = Math.min(0.05, (now-last)/1000)`.
- **Fixed-tick simulation**: `TICK_RATE = 20` (TICK_DT = 1/20), accumulator with `while (tickAccum >= TICK_DT && n++ < 4)` catch-up cap (L4413–4414). Deterministic world simulation at 20 Hz, buttery camera/particles at render rate.
- Camera FOV lerp: `fov += (target-fov) * min(1, dt*8)` (L4427) — sprint FOV kick.

**Persistence (L4206–4231, L196).**
- Save = **only modified chunks serialized**; the rest regenerates from the world seed. Payload deflated with JSZip → base64 → localStorage (~5 MB quota handled with a friendly message + "Export JSON" fallback). Autosave every 60 s; `beforeunload` sync save (L4443).
- **→ our saves:** today `tutorialDone/BioXP/discoveries` are tiny; the principle "store deltas + seed, regenerate the rest" is what scales when we persist mission state/runs.

**Renderer + mobile posture.**
- `new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })`, `setPixelRatio(min(devicePixelRatio, 1.5))` (L4316–4317).
- **No touch controls at all** (pointer-lock desktop only) — cautionary: great engine, mobile afterthought.

---

## 2. Roller Rink 3D — `tmp-research/Roller-Rink-3D/src/` (Three.js + Tween.js)

**Implicit-boundary collision via ellipse projection — the closest match to our tube problem.**
- `logic/physics.js` L270–298: the rink wall is not geometry; it's the implicit ellipse `cc = (x²/35.5² + z²/23.5²)`. If `cc > 1.0`, the position is projected back inside with `scale = 0.999/sqrt(cc)` and a semantic event fires (`triggerWallBounce()` or, mid-jump, `triggerFallAndGetUp()`). Penalty scoring debounced at 1 s.
- **→ vessel tube:** our spline tube can do the same: distance-to-axis vs local radius → if `d > R−r_player`, project back to `R−r_player` (0.999 softening) and emit scrape event/damage. No raycasts, no colliders, O(1) per frame.

**Momentum-preserving steering (L246–256).**
- Turning **rotates the existing velocity vector** with a 2D rotation matrix (cos/sin) instead of resetting direction — you keep your speed through the turn. Brake multiplies velocity by 0.85. Per-frame constants: `ACCEL 0.0055`, `FRICTION 0.972` (0.996 mid-air), `MAX_SPEED` clamp with renormalized direction.
- **→ nano-robot feel:** rotate momentum on steering input; different drag in "plasma" vs "wall scrape" states.

**Follow camera (logic/camera.js).**
- Chase mode (L103–130): target = `player.position − facingDir·offsetDistance + offsetHeight`; then `camera.position += (target − camera.position) * 0.35` per frame (explicitly commented "simulate camera inertia"), `lookAt(player + 1.2 head height)`.
- Idle orbit mode with boundary containment: if camera origin leaves the rink ellipse, scale it back inside; y clamped 0.4–9.5 (L86–99). Stands mode lerps 0.05 to a fixed seat. Intro = TWEEN'd matrix interpolation from drone shot to gameplay cam.
- **→ our follow cam:** 0.35/frame inertia + lookAt above the robot's axis = readable obstacle avoidance (you see what's ahead of the robot, not at it).

**Day/night = keyframe sampling + smoothstep (objects/lighting.js).**
- Sky color keyframes at hours `[0,6,8,17,19,20,24]` (night→day→sunset→night), interpolated with a C1 smoothstep `t*t*(3-2t)` between keyframes (L151–175). Sun/moon: `sunAngle = ((time-8)/12)·π`; `sun.intensity = max(0, sin(sunAngle))·1.2`; hemi `0.5 + 0.4·sunHeight`; at night sun swaps to moon (intensity 0.05, color `0xcbd6ff`) and arena bulbs switch on. Shadow map 1024², `bias −0.0002, normalBias 0.02`.
- **→ vessel lighting variation:** drive our vessel light color/intensity by zone keyframes (healthy oxygenated = warm/cyan, past clot = dim/deep crimson, near heart = pulse) — same sampler, ~30 lines.

**Procedural hierarchical animation (objects/skater.js + logic/animations.js).**
- Limb geometry is **translated so its local origin coincides with the joint pivot** (L122 comment), pose tables per state (`hipLx 0.5 / kneeLx 0.1 / ankleLx 0.2` mid-air etc.), gait swing scaled by `speedMag`. Wheel roll: `rotSpeed = speedMag / 0.045` (pure rolling, v = ω·r).
- **→ robot rig:** pivots-at-origins + speed-driven swing phases for our nano-robot's thruster limbs/scanner arm, and spin rate derived from speed for debris.

**Cautionary:** physics constants are **per-frame** (`FRICTION 0.972`) while the loop computes `dt` — frame-rate dependent feel on 120 Hz phones. Don't copy that part.

---

## 3. AntiGravity Pool — `tmp-research/AntiGravity-Pool/` (real-time path tracing, desktop AND mobile)

**How it does path tracing on mobile: tiered shaders, not tiered features.**
- Device detect: `'ontouchstart' in window` → `mouseControl = false` (InitCommon.js L378–383). Different **fragment shader file per tier**: desktop `AntiGravityPool_Fragment.glsl` = **10-bounce** loop (L401), mobile `AntiGravityPool_Fragment_Mobile.glsl` = **8-bounce** (L396), same scene.
- Resolution: `pixelRatio = mouseControl ? 1.0 : 0.75` (AntiGravityPool.js L80) — render at 75% and upscale. FOV 40 desktop / 30 mobile. Pinch-FOV/pinch-aperture gestures disabled on mobile (L703–705).
- Dynamic-scene accumulation (InitCommon.js L1121–1163): since the scene moves every frame, `sampleCounter` resets to **1 spp/frame**; accumulation ping-pongs through `screenCopyRenderTarget` and is tone-mapped/gamma'd in a final ScreenOutput pass; camera motion resets accumulation and tracks `uOneOverSampleCounter` weights. Blue-noise texture (`BlueNoise_R_128.png`) decorrelates sampling.
- **→ Anatomy Arcade:** the architecture "same world, per-tier shader + per-tier internal resolution" is exactly our quality-tier law, taken to its extreme. One raymarched effect pass (clot dissolve / plasma glow) at 0.75 DPR on mobile is feasible; full-screen multi-effect is not.

**Analytic geometry instead of meshes.**
- Physics runs CPU-side in Oimo.js: `new OIMO.World({ timestep: 1/60 })` — **fixed 60 Hz**, `gravity (0,0,0)` (L98–99). Ball states sync to the GPU as a uniform array: `pathTracingUniforms.uBallPositions = { value: ballPositions }` (24× Vector3, L165); the path tracer intersects spheres analytically from those uniforms. There are **no meshes at all** — geometry = math. `EPS_intersect = 0.001`.
- **→:** for LOW tier, a handful of hero objects (clot blob, valve) could be raymarched SDF/primitives in one fullscreen pass — AntiGravity proves phones do this at 60 fps when the analytic set is small and closed-form.

**Other mobile learnings.**
- Input abstraction: pointer-lock drag on desktop vs `MobileJoystickControls.js` (815-line standalone touch joystick class) on mobile — game logic reads the same "camera delta" either way.
- WebAudio unlocked on first user gesture for iOS/macOS (L937–947) — we already do procedural audio; keep the gesture-unlock.
- Contact events → WebAudio positional sounds (ball clicks, rail, pocket) driven from the physics side, not the renderer.

---

## 4. Red Reddington Web Demos — NOT FOUND → compensated

**a) `matthew-kissinger/threejs-field-grass` (TSL grass, wind + interactive wakes) — `tmp-research/threejs-field-grass/src/three/`**
- Wind (grassMaterial.ts): **3 octaves of scrolling noise** (broad/middle/fine), shared wind frame travels at `windSpeed 3.8 m/s`; sway amplitude **0.13–0.25 m on a 0.44 m blade** (≈30–57% of height); `windReach 0.34`; per-octave direction jitter so bands don't resolve into straight sine waves.
- The key trick (file comment L8–11): the **blade root is an instanced attribute, not the vertex's world position** — all blades of one tuft share it, so the tuft sways as a body instead of shearing; **bend ∝ only "how far up the blade the vertex is"**; a bent blade is shortened to keep its arc isometric.
- Interaction (interactionField.ts + core/recovery): bodies deposit **SDF footprint wakes** (footprints `halfLength 1.16–1.68, halfWidth 0.48–0.6, falloff 0.68, strength 0.58`); a new wake is emitted only after the body moved a min distance; response ramps in over a birth duration and decays with age. Grid-field evaluation, not particles.
- One `InstancedMesh`, `frustumCulled = false` (grassLayer.ts L78) — single draw call.
- **→ bloodstream mapping:** (1) vessel-wall endothelium/cilia = same instanced-blade sway driven by flow direction instead of wind; (2) wall pulse = height-ramped vertex displacement; (3) **player wake** = our robot deposits a decaying SDF field that pushes RBCs aside — extremely readable "you are moving through fluid".

**b) `mattatz/THREE.Fire` (★166, volumetric fire) — `tmp-research/THREE.Fire/FireShader.js`**
- Object-space raymarch: **ITERATIONS = 20 steps**, `rayLen = 0.0288·scale` per step (L17, L187–199). Per step: convert to **cylindrical coords** `st = vec2(sqrt(dot(p.xz,p.xz)), p.y)` → radial flame profile; 3-octave **abs-simplex turbulence** (`OCTIVES 3, lacunarity 2.0, gain 0.5`); noise field scrolls upward (`p.y -= (seed+time)·scale.w`); sample a **pre-baked 2D fire gradient texture** (no color math); accumulate `col += sample`; `col.a = col.r`; material `transparent, depthWrite:false`.
- Cost: 20 taps × 3 octaves of one snoise = a few hundred ALU ops/pixel — cheap enough for a small screen region on mobile.
- **→ clot dissolve:** same shader but plasma-colored gradient + radial coordinates around the clot; debris sprites spawned at the "burn" boundary. Also plasma shimmer ribbons near the wall.

---

## 5. three-game-engine (WesUnwin) — `tmp-research/three-game-engine/` (Three.js + Rapier + three-mesh-ui, ★113)

- Integration shape (Scene.ts L181–186): `advancePhysics() { rapierWorld.step(); forEachGameObject(g => g.syncWithRigidBody()); }` — one step per frame (Rapier's own fixed default dt), then a sync pass. Character controllers in `src/util/`:
  - `DynamicCharacterController.ts`: capsule collider (halfHeight 0.45, radius 0.4, density 500), **rotations locked except yaw**, movement applied as `applyImpulse(desiredVector·400·dt)` — dt-scaled impulses, engine does the rest.
  - `KinematicCharacterController.ts`: Rapier `KinematicPositionBased` + `computeColliderMovement()` + `setNextKinematicTranslation()` — the "I want walls and slopes but not forces" pattern.
- Input abstraction (`input/InputManager.ts`): `readVerticalAxis()/readHorizontalAxis()` return **−1..1** merging keyboard (WASD/arrows) and gamepad; controllers never see raw events.
- 3D UI = `three-mesh-ui` in-world panels (`ui/UIHelpers.ts`, `components/UserInterfaceComponent.ts`) — device-agnostic HUD (no DOM overlay), plus jest tests with `__mocks__/three` for engine testability.
- **When Rapier is justified vs overkill (study question):** justified when many bodies interact (stacked debris, ragdolls, vehicles with suspension, concave level colliders) and you want CCD/contacts/events maintained for you. Overkill for Anatomy Arcade's core loop: one flying player vs an analytic tube + instanced cells — Voxelcraft's sweeps and Roller Rink's implicit projection solve that in ~150 lines with zero WASM payload (rapier3d-compat is a WASM download + async init; oimo.min.js used by AntiGravity is 152 KB JS — sanity reference for "engine cost"). If we later want physical clot debris chunks the player nudges, a kinematic-controller (not dynamic) player + a few dynamic bodies is the middle path.

---

## 6. Prairie Adventure — `tmp-research/prairie-adventure/game.js` (809 lines)

- **They deleted the physics engine** (comment at setupScene: "Removed physics setup - using simple position-based movement") — cannon-es appears only as a CDN fetch leftover. Everything is analytic heightfield math:
  - Terrain: `PlaneGeometry(200×200, 63×63 segs)`, height `= sin(x·0.05)·3 + cos(z·0.03)·2`, cached into a `heightData[gridX][gridZ]` array at build time; `getTerrainHeight(x,z)` maps world→grid with clamped indices (L133+).
  - **Slope via central differences**: sample ±1.0 unit in x and z, `slopeZ = (front−back)/2`, `slopeX = (right−left)/2`, project onto movement direction (L28–48). Slope·30 becomes acceleration; uphill/downhill speed caps applied by slope sign.
  - Ground attachment: `vehiclePosition.y = terrainHeight + 0.75` hard snap (L770); rotation.y only (no pitch/roll — feels flat on hills).
- Camera is the cautionary tale: rigid offset `(+0, +10, +15)` + lookAt every frame (L777–782) — no smoothing; jarring on bumps. Contrast with Roller Rink's 0.35 lerp.
- Linear `THREE.Fog(0x87ceeb, 100, 1000)` hides the terrain edge.
- **→:** slope-projection math is exactly what we want for "robot should feel the vessel's curvature" (speed modulation near bends); the heightData cache = cache our spline samples, don't evaluate per frame; and it reconfirms: analytic > physics-engine for a vehicle/player on a known surface.

---

## 7. San Verde — `tmp-research/san_verde/src/` (WebGPU open-world driving)

- **WebGPU with automatic fallback** (`runtime/bootstrap-runtime.js` L15–20): `new THREE.WebGPURenderer({ forceWebGL: param === 'webgl' })`; `main.js` L251–256 reports `renderer.backend.isWebGLBackend` → "WebGL2 fallback" vs "WebGPU ready". Production pattern: try WebGPU, degrade silently, expose a `?forceWebGL=1` escape hatch.
- Global resolution cap: `MODEL_CONFIG.renderPixelRatioCap = 0.9`; `renderer.setPixelRatio(Math.min(devicePixelRatio, cap))` (main.js L1081). `touchAction = 'none'` on the canvas.
- **Chunked baked statics with two radii** (`game/chunk-grid.js`): cells of 800 units; **detailRadius 900** (full detail visible) vs **massRadius 2200** (merged silhouette "mass" geometry). Baking buckets geometries by material (`mergeGeometries`) per chunk; `yieldToMain()` via `scheduler.yield()` (setTimeout fallback) so bakes never stall a frame; explicit `dispose()` of geometries on chunk unload; a separate `buildSkylineMesh()` for the far silhouette.
- Building LOD (`game/catalog-lod.js` + `LOD-PLAN.md`): `BUILDING_LOD_DISTANCES = { lod1: 0, lod0: 50 }` — procedural boxes ≥ 50 m, GLB models < 50 m, with `SimplifyModifier` tiers (high/medium/low) cached in `MODEL_SIMPLIFIED_TEMPLATE_CACHE`.
- Vehicle physics is **custom arcade lerp math** (`game/bounce-physics.js`, 2,224 lines, no engine): upright slerp 0.1–0.35, lean smoothing 0.10–0.12 with max lean lerp 0.06→0.50 by steering-speed blend, speed-dependent steering factor, landing/ground follow lerps. NPC traffic with lane-change collision avoidance on a road graph JSON.
- **→ vessel segments:** near segments = full shader detail, far = merged low-cost silhouette (one mesh per material); bake ahead with a main-thread yield budget; a vessel "skyline" equivalent is the next-3-segments' faint glow silhouette.

---

## 8. PigeonWorld — `tmp-research/PigeonWorld/src/` (P2P procedural world)

- Deterministic seeded world (`world/WorldGenerator.js`): hash noise `n = Math.sin(x·12.9898 + y·78.233 + seed)·43758.5453` (L24), `fractalNoise` 4 octaves (L56), **biomes chosen by height thresholds** (L75–81), per-biome entity spawn probabilities (0.985–0.988 rolls, L146–203). Same seed ⇒ same world on every client — that's how P2P peers share a world without sending it.
- Streaming (`game/GameEngine.js`): `viewDistance = 8` chunks; re-stream **only when the player's chunk coordinate changes** (`lastStreamChunkX/Z` guard, L843–853); geometries and materials explicitly disposed on unload (L1851–1853). Fog is the streaming edge concealer: `scene.fog = new THREE.FogExp2(0x87CEEB, 0.006)` — comment L244: "Exponential fog is key for hiding the 'square' boundary."
- Physics: `gravity 30 u/s²`, `jumpSpeed 8` — ground clamp only, no engine.
- P2P smoothing (`NetworkManager.js`/`GameEngine.js` L107–110): remote avatars rendered **120 ms behind** (`remoteInterpolationDelayMs`) with **200 ms max extrapolation**; stale peers pruned with distance-based timeouts and a 120 s disconnect grace.
- **→:** seed-determinism = our missions can be "seeded runs" (share a seed ⇒ identical clot placement for speedruns/replays); FogExp2 for segment-edge hiding; interpolation delay+cap if we ever add co-op/ghost replays.

---

# TOP LESSONS FOR ANATOMY ARCADE

1. **Budget world-building in milliseconds, not items.** Time-slice segment generation/meshing with `performance.now()` — 40 ms while loading, **6 ms per frame in play**, nearest-first queue. Evidence: `voxelcraft/index.html` L2354–2389, L4403/L4412. Application: our 30+ vessel segments stream with zero hitches; mission start gated on first segments ready (`isReady()`/`progress()` pattern). Mobile caveat: 6 ms assumes a fast CPU; make the budget a quality-tier constant (LOW: 3 ms, HIGH: 8 ms).

2. **Implicit analytic collision beats mesh collision for tube flight.** Roller Rink's ellipse test `(x²/a²+z²/b²)>1 → project back by 0.999/√cc` + event. Evidence: `Roller-Rink-3D/src/logic/physics.js` L270–298. Application: vessel collision = distance-to-spline-axis vs local radius; clamp to `R−r_robot`, fire scrape/damage events, zero raycasts. Mobile caveat: none — it's O(1) ALU; strictly cheaper than raycasts.

3. **Slide, don't stop: axis-separated clamped sweeps + a step-up/retry trick.** Voxelcraft `Physics.move/sweep` (Y→X→Z, clamp to surface ±1e-4, zero only the hit axis; retry offset moves and keep them only if they made progress). Evidence: `voxelcraft/index.html` L2435–2474. Application: scraping along the clot or valve should preserve tangential speed and only kill the normal component; the "retry from offset" generalizes to "re-attempt the move nudged along the wall normal". Mobile caveat: keep the collected-box count small (we collect from the spline, so it's constant).

4. **Fixed-tick simulation + clamped variable render dt.** Voxelcraft: 20 Hz ticks via accumulator (max 4 catch-up), `dt = min(0.05, Δt)` for cosmetics; AntiGravity: Oimo fixed `1/60`; three-game-engine: Rapier's fixed step + sync pass. Evidence: `voxelcraft/index.html` L4413–4414; `AntiGravity-Pool/js/AntiGravityPool.js` L98; `three-game-engine/src/Scene.ts` L181–186. Application: keep our gameplay sim (collision damage, flow phase, treatment progress) fixed-rate and reproducible; camera/shader FX free-run. Mobile caveat: cap catch-up iterations (4) so backgrounded tabs don't fast-forward.

5. **Momentum-preserving steering = the flying feel we want.** Rotate the velocity vector by the turn angle (2D rotation matrix) instead of re-aiming speed; per-state drag (0.972 ground / 0.996 air). Evidence: `Roller-Rink-3D/src/logic/physics.js` L246–262. Application: nano-robot banking through bends keeps speed; heavier drag when "scratching" the wall. Mobile caveat: none; ensure per-frame constants are converted to dt-based (`pow(0.972, dt·60)`) — Roller Rink itself is frame-rate dependent (cautionary).

6. **One codebase, two rendering tiers — decided by `ontouchstart`.** AntiGravity: mobile gets a separate fragment shader (8 vs 10 bounces), `pixelRatio 0.75 vs 1.0`, FOV 30 vs 40, joystick class swap; San Verde caps DPR at 0.9; Voxelcraft disables AA + caps DPR 1.5. Evidence: `AntiGravity-Pool/js/AntiGravityPool.js` L66–88, `js/InitCommon.js` L378–383; `san_verde/src/app-shell.js` MODEL_CONFIG; `voxelcraft/index.html` L4316–4317. Application: our AUTO quality tier should switch shader complexity (vessel shader fast path) AND internal resolution together, not one or the other. Mobile caveat: detect once, allow override; never re-detect on orientation change.

7. **Path-traced/raymarched FX are viable on mobile only when geometry is analytic and small.** AntiGravity ships zero meshes: Oimo positions → `uBallPositions` uniform array → analytic sphere intersection; 1 spp/frame for dynamic scenes with ping-pong accumulation. Evidence: `AntiGravityPool.js` L165/L98, `InitCommon.js` L1121–1163. Application: LOW tier can afford ONE full-screen raymarched pass (e.g., plasma glow or clot dissolve) if the primitive set is closed-form and small; never two. Mobile caveat: 0.75 DPR mandatory; thermal throttling after ~3 min — consider 0.66.

8. **Cheap volumetric fire formula (steal directly for clot dissolve).** 20-step object-space raymarch × 3-octave abs-simplex turbulence (lacunarity 2.0, gain 0.5), upward-scrolling seed, cylindrical radial coords, pre-baked 2D gradient texture, `alpha = col.r`, `transparent + depthWrite:false`. Evidence: `THREE.Fire/FireShader.js` L17–18, L151–204, `Fire.js` L14–15. Application: clot-dissolve plume with a crimson→amber gradient; plasma shimmer ribbons near walls (scroll along flow instead of up). Mobile caveat: render into a small viewport region or half-res target; 20 steps is the ceiling, drop to 12 on LOW.

9. **Instanced-blade sway math = vessel wall life.** Bend ∝ height up the blade; **root as instanced attribute** so clumps move as bodies; 3 wind octaves at 3.8 m/s with 0.13–0.25 m amplitude on 0.44 m blades; per-octave jitter to kill sine-band artifacts. Evidence: `threejs-field-grass/src/three/grassMaterial.ts` L8–11, L87–99, L306–332. Application: endothelium cilia/wall fringe swaying with flow direction; wall pulse = low-frequency octave added to the same ramp. Mobile caveat: instanced planes with alpha-cut edges (not alpha-blend) to avoid sorting; one draw call.

10. **RBC upgrade path: instanced shader-deformed discs, not displaced spheres.** Principle from two repos: per-instance variation lives in instanced attributes read by the shader (grass roots/tufts), and a purpose-built primitive beats a generic one (greedy mesher emits exactly what's visible). Evidence: `threejs-field-grass/src/three/grassMaterial.ts` L294–332; `voxelcraft/index.html` L2088–2157. Application: replace instanced spheres with a ~64-tri biconcave disc (lathe profile) + per-instance `phase/scale/tumble` attributes; vertex-shader biconcavity (dent ∝ cos of rim distance) gives the true RBC silhouette; flow streaking = stretch along velocity in the same vertex shader. Cost: same 1 draw call, better look. Mobile caveat: keep instance count tiered (e.g. 400 HIGH / 150 LOW) and half-float attributes.

11. **Player-wake SDF field for readable fluid interaction.** Bodies deposit footprint wakes (halfLength 1.16–1.68, falloff 0.68, strength 0.58) that birth-in and decay with age; blades bend by field sample. Evidence: `threejs-field-grass/src/three/interactionField.ts` L36–68, L190–216. Application: our robot deposits a decaying radial field; RBCs/cells near the field push out and swirl — makes speed and direction FELT, and doubles as a scanning-dish indicator. Mobile caveat: a 32×32 field texture updated at 10 Hz is enough; don't evaluate per-cell on CPU.

12. **Keyframed lighting cycles with smoothstep, not sine hacks.** Sky/light keyframes over 24 h sampled with C1 smoothstep; sun intensity `max(0, sin(sunAngle))·1.2`, hemi `0.5+0.4·h`, night fixture swap. Evidence: `Roller-Rink-3D/src/objects/lighting.js` L130–238. Application: vessel lighting variation by segment zone (healthy warm-cyan → ischemic deep crimson near clot → post-treatment brightening) using the same sampler with our palette; zero shader cost. Mobile caveat: keep directional shadow off (mobile) — intensity/color only.

13. **Follow-camera inertia + lookAt-head = obstacle readability.** Chase target `pos − dir·offset + height`, then `camera.position += (target−camera.position)·0.35/frame`, lookAt head+1.2; boundary-constrained orbit cam. Evidence: `Roller-Rink-3D/src/logic/camera.js` L103–130. Application: our follow cam gets 0.35/frame inertia (dt-corrected ≈ `1−0.65^(60·dt)`) and looks slightly above the robot's flight axis so upcoming plaque reads early; banking lean lerp 0.10–0.12 from San Verde (`bounce-physics.js` L731–734). Mobile caveat: shorten follow distance on narrow FOV (mobile FOV 30 in AntiGravity) so the robot stays visible.

14. **Persistence: store deltas + seed, deflate, autosave, quota-escape.** Only modified chunks serialized; rest regenerates from seed; JSZip-deflate→base64→localStorage; autosave 60 s + `beforeunload` sync save; friendly QuotaExceededError UI. Evidence: `voxelcraft/index.html` L4206–4231, L4421, L4443, L196. Application: keep `tutorialDone/BioXP/discoveries` as-is, but when we save mission progress (clot %, flow state), save a seed + delta list, not world state; add the quota-error toast pattern. PigeonWorld's seeded determinism (`Math.sin(x·12.9898+y·78.233+seed)·43758.5453`) doubles as replay/speedrun infrastructure. Mobile caveat: iOS Safari evicts localStorage aggressively — mirror saves on visibilitychange, not just beforeunload (beforeunload is unreliable on mobile).

**Bonus (streaming polish):** FogExp2(0x87CEEB, 0.006) hides square chunk edges (PigeonWorld `GameEngine.js` L244–245); San Verde's two-radius chunking (detail 900 / mass 2200 units, material-bucketed merges, `scheduler.yield()` bake) is the pattern for far vessel silhouettes (`san_verde/src/game/chunk-grid.js` L6–7, L63–72).

**Rapier verdict (study question):** full Rapier (WASM, async init) is justified only if/when we add many interacting dynamic bodies (debris piles, physics puzzles); our flying-player-in-tube loop is served by Voxelcraft-style sweeps + Roller-Rink-style analytic projection at ~0 KB. Middle path if needed: Rapier *kinematic* character controller + a few dynamic props (`three-game-engine/src/util/KinematicCharacterController.ts` L149–161).
