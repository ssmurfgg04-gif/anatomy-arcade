# RA-2 — AI-Built Web Games: Methodology & Game Design Research

> Research only. Sources shallow-cloned to `/home/z/my-project/tmp-research/` (2026-09 session).
> Scope: how AI-built browser games structure gameplay, controls, feedback, cameras, architecture,
> and the AI dev workflow — distilled for ANATOMY ARCADE's heart mission (R3F/Three.js, mobile-first).
> All paths below are relative to the cloned repo unless prefixed `fable-cities/`, `aibgd/` (= ai-browser-game-demos), `tgs/` (= threejs-game-studio).

---

## 1. balbonits/ai-browser-game-demos — "Block Arena" FPS + 5 Canvas2D games

**Stack:** Landing shell = React 19 + TS + Vite + Tailwind 4. Games = fully self-contained static
folders under `public/games/<slug>/` (vanilla JS/Canvas2D; `block-fps` = Three.js via esm.sh CDN,
**no build step**). All SFX/music synthesized at runtime with Web Audio — zero audio files committed.

**Scale:** block-fps is **1,785 LOC across 9 files** (`main.js` 437, `world.js` 245, `audio.js` 228,
`enemies.js` 213, `gun.js` 192, `player.js` 168, `config.js` 124, `waves.js` 89, `index.html` 89).
Proof that a *complete, replayable 3D game* fits in <2k lines when everything is config-driven.

### Key findings (with evidence)

**G1. One frozen config module owns every tuning number.**
`aibgd/public/games/block-fps/config.js` — arena ±24, `PLAYER_SPEED 7.0`, `PLAYER_ACCEL 50`,
`PLAYER_FRICTION 12`, `PLAYER_RADIUS 0.35`, `HIT_INVULN 0.45`, `GUN_RATE 0.13` (≈7.7 RPS),
`GUN_DAMAGE 28`, `GUN_SPREAD 0.005 rad`, enemy table `{hp, speed, dmg, size, score, contactRate}`.
The header comment: *"Importing this module has no side effects."* Also exports reusable
`TMP_VEC`/`TMP_VEC2` to avoid per-frame allocations — same discipline our vessel code needs.

**G2. Wave system = pacing engine.** `waves.js` + `WAVES` in config: each wave is
`{ count, spawnEvery, kinds (weighted pool), max (concurrent cap) }`; 8 hand-tuned waves ramp
`spawnEvery 1.6s → 0.55s` and `max 4 → 12`; endless mode past wave 8 applies `hp +20%/wave`,
`count +10%/wave` (`endlessMultipliers`). Wave-clear requires budget exhausted **AND** field empty,
with a one-shot `cleared` flag — `main.js` line ~390 comments a real bug where the guard was missing
and the clear event fired every frame, inflating score and enemy HP. **Lesson: any "mission phase
complete" event needs a consume-once latch.**

**G3. Player feel via approach(), not instant velocity.** `player.js`: WASD projected onto
**yaw-only** camera forward (pitch never lifts you), normalized, then
`velocity = approach(velocity, want, PLAYER_ACCEL*dt)`; friction `12` when idle. Collision is
axis-by-axis AABB resolution so you **slide** along walls instead of sticking — exactly the feel our
nano-robot needs against vessel walls. Shift = walk (×0.5 speed). Fixed eye height 1.65, FOV 75.

**G4. Damage must have rhythm.** `damagePlayer()` returns bool; contact damage gated by per-enemy
`contactRate` (0.45–1.0s) **plus** global `HIT_INVULN 0.45s` i-frames, plus knockback of both
parties (0.4 units, `enemies.js` line ~150). Wall collision in our vessel should do the same:
tick-based drain, not continuous.

**G5. Feedback = 10+ channels per event, all event-driven.**
- Tracer: `THREE.Line` muzzle→hit, fades 0.08s (`world.js` spawnTracer).
- Sparks: pooled box particles, gravity 18, tumble, count 14 on kill / 6 on hit / 3 on wall, life 0.45–0.6s.
- Muzzle flash: single reused cone, `opacity = life/0.06`, scale jitter `1.6+rand*0.4` — one mesh toggled, not spawned.
- Recoil: `RECOIL_DUR 0.07s`, kick back 0.08 + muzzle climb −0.18 rad (`gun.js updateGun`).
- SFX: every event has a synthesized voice (`audio.js` — fire = 180 Hz square thump + noise crack; distinct waveStart/waveClear/defeat jingles; music = 78 BPM drone pad at gain 0.10 under SFX gain 0.55). Lazy `AudioContext` init on first gesture + `resume()` on every interaction.
- HUD: HP bar width %, WAVE/SCORE/KILLS counters, banner text system (`setBanner('WAVE CLEAR · +50', 1.6)`), hint line that changes with pointer-lock state.
- Enemies spin `1.6 rad/s` "so they read as active rather than static cubes" (`enemies.js` ~line 140) + `EdgesGeometry` outlines per kind color.
- Death → `GRID OVERRUN` overlay with run stats + "new best!" detection; best wave/score/mute persist to localStorage (`STORAGE` map in config).

**G6. State machine is 4 states and pause rides the pointer-lock event.** `STATE = {INTRO, PLAYING, PAUSED, DEAD}` (frozen in config). `controls.addEventListener('unlock')` → auto-pause + `clearKeys()` — a subtle but critical detail: **release all inputs on any pause/blur**, else keys stick.

**G7. Methodology artifacts worth copying.**
- `docs/testing.md`: four test tiers (unit / **replay** = fixed seed + input list → snapshot / **property** = fast-check invariants "score never negative" / e2e Playwright). Test hook `window.__gameTest` gated by `?test=1`, **read-only, returns copies not live refs**, lives in main.js. Roles: orchestrator owns spec, `tester` agent writes tests FIRST and cannot be edited by `dev` agent, husky pre-push hook runs `npm test` as "the court that doesn't read prose."
- `docs/journal.md`: append-only journal with typed entries (`[Bug] [Decision] [Discovery] [Learning] [Process] [Project]`) + a written **autonomy contract** (auto vs always-ask lists).
- `docs/games/<slug>.md`: per-game spec = concept, controls table, mechanics with constants, known issues/deferred, changelog.
- `CLAUDE.md` two-layer rule: games stay framework-free/portable; shell never leaks into games.

**G8. Mobile cautionary tale (self-reported).** `docs/games/block-fps.md` → "Known issues / deferred:
**No mobile support.** Touch + mobile pointer events don't translate cleanly to mouse-look + click-fire."
Pointer-lock FPS controls are the dead end; all Canvas2D games (running-man, neon-blocks) do support tap
input (`pointerdown` on canvas/window).

---

## 2. rawprogress/fable-cities — Three.js r185 city builder built by agent team

**Stack:** Three.js r185 + Vite, plain ES modules, no TS. ~16 modules under `src/modules/*`,
core in `src/core/*` (Engine, Config, World, Input, CameraController, AssetLoader, EventBus,
DebugAPI). ~160 MB first load. Desktop-recommended.

**Scale:** Engine.js ~700+ lines (CSM shadows, post stack, quality tiers); full ARCHITECTURE.md
contract; tools/ verification harnesses; `docs/critique/*.json` = 20+ machine-generated critic reports.

### Key findings

**F1. The method (PROMPT.md) — the single most transferable artifact in all three repos.**
One instruction, six steps: (1) **architecture first** (module contract, shared world model, units,
determinism, perf budget, asset policy); (2) **build the verification loop before the game**
(headless-Chrome screenshot tool writing PNG + JSON log of console errors/fps/draw calls — *"No agent
may claim anything it hasn't screenshotted and looked at"*); (3) **fan out one builder per module
folder in dependency waves**, single integrator owns core; (4) **separate critic agent** (a "brutal
AAA art director who writes no code") scores 0–10 on an anchored scale, pass ≥8.5, up to 4 rounds;
(5) **blind final gate** — judges see only screenshots labelled A/B vs the real game, order shuffled;
(6) **persist scores to docs/STATUS.json and resume each iteration at the weakest module.**
Its own honest postmortem: *no module ever cleared 8.5*; blind judging lost 0–4 three times (gap
3.4→2.5); a first-session critic scored the new-player experience **5.5/10 — "no in-game tutorial,
and a fresh city takes a couple of minutes before anything visibly grows."** That is precisely the
failure mode Anatomy Arcade's tutorial must avoid.

**F2. Critiques are measured, not vibes.** `docs/critique/buildings_p4.json`: score 7.0, fail, with
issues carrying severity (blocker/major), pixel-rect evidence regions, and *measured luminance*
("mullion Y=0.0000, typical pane Y=0.0010, bright pane Y=0.1937 — a 200:1 jump"), draw-call counts,
and per-timesday screenshots. STATUS.json holds every round's score/summary so nothing is re-derived.

**F3. Orbit camera math worth borrowing.** `src/core/CameraController.js`: desired-state pattern +
frame-rate-independent `damp()` (see below) with `smoothing = 12`; pan speed scales with distance
(`panSpeed 1.1 × distance × dt` — far = fast, near = precise); zoom-towards-cursor via
`exp(wheelDelta × 0.0011)` and shifting the target toward the ground point by `1 - ratio`;
`minHeightAboveGround 1.8` terrain clamp; **dynamic near plane** `clamp(distance*0.004, 0.2, 6)` to
kill z-fighting at both macro and micro range.

**F4. `damp()` — the one smoothing function to standardize on.** `src/shared/math.js` line 15:
`damp(current, target, lambda, dt) = lerp(current, target, 1 - exp(-lambda*dt))`, with `dampAngle`
for yaw wrap. Doc comment: *"lambda ~8–15 feels snappy, 3–5 feels floaty."* Replaces every ad-hoc
lerp-with-frame-dependent-alpha.

**F5. Engine loop & error isolation.** `src/core/Engine.js _tick()`: `dt = Math.min(dt, 0.1) * timeScale`
(hard clamp), `renderer.setAnimationLoop`, per-callback try/catch with **deduplicated** error keys so
one broken module logs once and the game keeps running; `stats()` reports draw calls / triangles /
programs / fps; draw-call budget counted **across all passes** (shadow cascades + AO + reflections +
main). Quality tiers `low/medium/high/ultra` in `Config.js` each define ~12 knobs (pixelRatio,
shadowMapSize, cascades, gtao, bloom, smaa, anisotropy, drawDistance, density, particles,
textureSize, lightBudget).

**F6. Input: frame-staged, claimable, harness-injectable.** `src/core/Input.js`: `keys` Set +
`justPressed`/`justReleased` sets cleared in `endFrame()`; drag threshold **4 px** before a drag is
"active"; wheel delta accumulated then delivered per-frame; `claimKey('r')` lets a tool steal a key
from the camera for one frame; `pointerOverUI` gates camera control; and `injectClick(ndc)` dispatches
*real synthetic PointerEvents* so the headless harness drives the same code path as a human.

**F7. The light-budget trap (measured).** ARCHITECTURE.md §3: *"Never toggle `light.visible` or
add/remove lights at runtime — three re-derives `NUM_POINT_LIGHTS` and recompiles every registered
material (measured: 60 → 9.5 fps). Allocate the pool in `init()` and idle unused lights at
`intensity = 0`."* Directly relevant to our plaque-scan highlight / treatment glow effects: preallocate.

**F8. Determinism as contract.** All procedural generation through `makeRng(seed)` +
`world.rng.fork(salt)` — never `Math.random()` — so every screenshot URL `?seed=7&time=17.5` is
reproducible. Their whole critic pipeline depends on it. (Our scans/Qwen fallbacks and VLM critique
rounds get the same benefit from a seeded RNG in gameplay code.)

**F9. Module contract.** ARCHITECTURE.md §2: `export const name; export async function init(ctx);
export function update(dt, elapsed); export function dispose()`. `ctx` is a fixed bag
(engine/renderer/scene/camera/world/events/assets/input/cameraController/config/modules/uiRoot).
Modules emit named events (`roads:changed`, `sim:tick`, `notification`) — UI listens, modules never
import each other. `?showcase=<module>` loads each module's self-staged representative scene.

---

## 3. chrislaupama/threejs-game-studio — the methodology-as-skill repo

**Stack:** A Claude Code skill package: `SKILL.md` (495-line control plane) + 40+ `references/*.md`
manuals + a complete Vite+TS scaffold (`assets/threejs-vite-game/`, Three.js r185 baseline) + 3 genre
overlays (runner/shooter/platformer, each with a `genre-contract.md`) + evals + audit scripts.

**Scale:** scaffold game `Game.ts` 509 LOC + systems; references are short doctrine files dense with
copy-pasteable code and constants.

### Key findings

**T1. The anti-tech-demo doctrine.** SKILL.md "Common Failure Modes" — reject: *"A rendered scene or
camera orbit presented as a game (no verb, objective, or retry)"*; *"Architecture, material libraries,
or post stacks before one playable loop works"*; *"Glow, bloom, fog, or particles used to hide weak
forms"*; *"Quality or 'done' claims without real browser evidence (build alone is not enough)."*

**T2. The player-promise formula.** `references/game-design.md` line 39:
*"Player does [verb] to achieve [objective] while [pressure] creates risk; success gives
[reward/progression], failure causes [cost/retry]."* Line 24: **"Core loop: what the player repeats
every 5–30 seconds."** Failure modes list includes *"The first 30 seconds lack a real decision"* and
*"The objective is unclear without reading source code or instructions."* Genre contracts instantiate
this — `assets/genre-overlays/runner/docs/genre-contract.md`: verb = lateral steer, objective =
"reach 120 m", pressure = recycled barriers, HUD = distance/time/pace/boost, retry copy specified.

**T3. Fixed-step loop with interpolation.** `src/core/Loop.ts`: `FIXED_STEP_SECONDS = 1/60`,
`MAX_FRAME_DELTA_SECONDS = 0.1`, `MAX_STEPS_PER_FRAME = ceil(0.1·60) = 6`, accumulator pattern,
update returns "discontinuity" bool to flush accumulator, render receives
`alpha = accumulator/step` for interpolated presentation (`InterpolatedTransform` + `CameraRig.present(alpha)`).
Uses `THREE.Timer` + `renderer.setAnimationLoop` (SKILL.md guardrails: Clock is deprecated).

**T4. Touch joystick with exact constants.** `src/core/InputController.ts`: stick radius =
`rect.width * 0.42`; pointer delta normalized to that radius then clamped to length 1; keyboard
vector **added** to joystick vector then re-normalized if `lengthSq > 1` (keyboard and touch never
fight); knob visual travel **38 px**; `touch-action` handled by CSS; `pointercancel` +
`lostpointercapture` both reset the stick; window `blur` + `visibilitychange` → `clearHeldInput()`;
keyboard listener ignores keys when focus is in any interactive element (button/a/input/[role=...])
so UI buttons never double-fire. Pause/restart are **consume-once** edge flags, not polls.

**T5. Feel constants.** `references/game-feel.md`: *"primary verb must produce a visible response
within ~100 ms"*; trauma-based shake — add trauma on events, shake = **trauma²**, `MAX_OFFSET 0.55`
world units, `MAX_ROLL 0.1 rad`, decay linear, noise driven from game time (deterministic); hitstop
recommended **60–90 ms at timeScale 0.05 on heavy hits only**, and the feedback manager must keep
updating with *real* delta during hitstop; readability rule: *"feedback must clarify game state,
never obscure the next decision."* Scaffold `Game.ts` tuning: `speed 5.8, dashMultiplier 1.75,
acceleration 13, cameraLag 0.16, exposure 1.05, maxDpr 1.5` — camera lag 0.16 s as the smoothing
constant (`factor = 1 - exp(-delta/lag)`), offset (0, 9.5, 9.5) with look-target offsets (+0.4y snap,
+0.35y/−1.2z follow).

**T6. Game-complete scaffold includes production-grade recovery.** `Game.ts`: WebGL context-lost →
`event.preventDefault()`, stop loop, suspend input+audio, show human message, resume on restore;
`reducedMotion` flag; `pausedForScreenshot`; seeded RNG; `publishDiagnostics` for tests; HUD shows
score/target/`mm:ss` timer/state panel with retry button, plus `flashPickup()` — a 220 ms Web
Animations API border flash as pickup feedback (DOM feedback channel, zero render cost).

**T7. The scorecard — anchored 0–3 visual quality scale with automatic failures.**
`references/quality-scorecard.md`: 10 categories (art direction, hero, obstacles, rewards, world,
materials, lighting/render, VFX/motion, UI/HUD, performance evidence), each with written anchors
(0 placeholder … 2 premium stylized … 3 showcase). **Premium gate: every category ≥2 and average
≥2.3. Showcase: ≥6 categories at 3, none below 2, avg ≥2.7.** Automatic failures include
*"HUD is mostly rectangular stat/debug cards"*, *"Fog, darkness, bloom, or particles hide missing
authored geometry"*, *"UI overlaps the play path, clips text, or fails mobile safe areas"*,
*"No active-play screenshot was captured"*. **Fresh-eyes review:** a reviewer subagent receives ONLY
screenshots + scorecard + metrics JSON (no build context, no prior scores) and must get the COMPLETE
capture set — "reconcile by taking the lower score per category." If no subagent: adversarial
self-review ("write the strongest case that the score is a 1" before assigning).

**T8. Bot playtesting = mechanical proof of game-ness.** `references/bot-playtesting.md`: scripted
input runs measure `scoreAfter - scoreBefore` and `stepOfFirstScore` (is the objective reachable by a
naive player?), `softlockWindows` (frames advanced while held input produced neither motion nor
progress), and **time-to-first-fail** — a scripted reckless run must trigger the fail state and the
retry path must restore play: *"a game that cannot be failed has no pressure, and a fail state that
cannot be retried is a release blocker."*

**T9. Scope/quality gates as named overlays.** SKILL.md: focused vs broad-production; premium =
broad + premium overlay + measured scorecard; release gate exercises production build + preview +
browser/mobile/accessibility evidence and **"report every unrun check"** (honesty contract).
`evals/golden-tasks.md`: each task lists required refs, **forbidden shortcuts**, pass evidence;
forward-tested in a fresh agent context.

**T10. Architecture invariants.** SKILL.md: one owner for renderer/camera/loop/timer/state/resize/
audio/teardown; canonical update order `sample devices → player/AI intents → fixed movement +
collision → game rules/events → animation/VFX → camera → UI/audio bridge → render`; *"Convert device
events into intents. Never make simulation depend directly on DOM event timing"*; seeded randomness;
separate authoritative state / collision proxies / visual meshes; every resource has a teardown path.

**T11. UI/mobile doctrine.** `references/ui.md`: safe-area insets via `env(safe-area-inset-*)`,
touch targets ≥ **44 px**, `touch-action: none` only on control regions, "test a real touch sequence
including cancel"; HUD zones — bottom corners reserved for touch controls, canvas behind overlay.

---

## 4. What makes these feel like GAMES, not tech demos — 5 concrete mechanisms

1. **A stated player promise** (verb → objective → pressure → consequence) rendered as copy:
   "Collect relays · avoid sweepers" status line (`tgs` Hud.ts), "reach 120 m" contract, "GRID OVERRUN /
   click or press SPACE to retry" (`aibgd` main.js `showOverlay`). The objective is always readable
   without instructions.
2. **A pacing engine on a clock**: waves with `spawnEvery`/`max` caps and a one-shot clear latch
   (`aibgd` waves.js), sim ticks per game minute (fable-cities), 5–30 s core loop doctrine (tgs
   game-design.md). Something *happens* every few seconds even if the player idles.
3. **Loss + sub-second retry + best-score persistence**: DEAD state → overlay → Space/click restarts
   (`aibgd`), retry button + "beat your time" copy (`tgs`), `localStorage` best wave/score/mute
   (`aibgd` config STORAGE). The loop closes even in failure.
4. **Multi-channel feedback on every semantic event**: a hit = tracer + sparks + recoil + SFX + banner
   (`aibgd`); a pickup = sound + score bump + 220 ms HUD flash (`tgs`); a state change = synthesized
   jingle (`aibgd` audio.js waveStart/waveClear). Channels are wired to *events*, not frames.
5. **Verification of playability, not of code**: screenshots are mandatory evidence (fable-cities
   "nothing counts until it has been seen"; tgs "no active-play screenshot → automatic failure") and
   bots measure whether the objective is actually reachable and fail/retry actually works.

---

## 5. TOP LESSONS FOR ANATOMY ARCADE (12)

Each lesson: (a) lesson · (b) code evidence · (c) application to the heart mission · (d) mobile caveat.

**1. Freeze every tuning number in one side-effect-free config module.**
(a) All constants live in one importable, frozen object; agents tune one file.
(b) `aibgd/public/games/block-fps/config.js` (entire file, incl. `WAVES` table + `endlessMultipliers`) and `tgs` Game.ts `tuning {speed 5.8, dashMultiplier 1.75, acceleration 13, cameraLag 0.16, maxDpr 1.5}`.
(c) Move remaining magic numbers in `src/game/*` (flow-rate 0→1 ramp, hold-E 4-segment treatment timing, scan ray 12, collision damage tick) into `src/game/config.ts` with units in comments; mission phases and difficulty become data, enabling VLM-tunable polish without touching logic.
(d) Add per-tier config (LOW tier = same constants, cheaper effects) instead of scattering device checks — mirrors `fable-cities` QUALITY tiers.

**2. Define the mission as a wave/phase table, and latch every phase-complete event.**
(a) Pacing is data: `{count, spawnEvery, kinds, max}` per wave; the "cleared" condition is guarded by a one-shot flag because the naive version fired every frame and corrupted state.
(b) `aibgd/.../waves.js` (`wave.cleared`, `markWaveCleared()`) + `aibgd/.../main.js` update() comment about the wave-clear bug.
(c) Heart phases (NAVIGATE → LOCATE → SCAN → TREAT(4 segments) → STABILIZE → COMPLETE) become a `PHASES` table with per-phase entry/exit conditions, timeout, banner text, and a `consumed` latch; the EDUCATION_POPUP phase-stomp bug we already fixed is this exact class of bug.
(d) On mobile, phase timers must use game-time (clamped dt), never wall-clock, so a throttled 30 fps device doesn't skip phases.

**3. Movement feel = yaw-projected input + approach() acceleration + axis-sliding collision.**
(a) Desired velocity from input projected on yaw-only forward, `approach(cur, target, ACCEL*dt)` with FRICTION when idle; resolve X then Z separately so the player slides along walls; per-entity contact rate + i-frames for damage.
(b) `aibgd/.../player.js` `updatePlayer()` lines 72–139, `approach()` line 141; `HIT_INVULN 0.45`.
(c) Match our nano-rig: keep vessel-wall damage tick-based (contactRate + i-frames) rather than continuous; verify slide-along-wall behavior in the spline tube (tangential resolution), and damp speed changes with ACCEL/FRICTION constants instead of instant velocity writes.
(d) Touch joystick vector must feed the same approach() pipeline (see lesson 7) — identical feel, different input source.

**4. Ship a 10-channel feedback stack per game event, each channel cheap and pooled.**
(a) Every event fires: particle burst + short-lived mesh + viewmodel kick + synthesized SFX + HUD/banner text + score bump. One-shot visuals reuse a single mesh with opacity/scale animation (muzzle flash), particles share geometry (`sparkGeo`) and dispose only materials.
(b) `aibgd/.../world.js` spawnTracer (fade 0.08 s), spawnSparks (gravity 18, count 14/6/3), muzzle flash (`life/0.06`, scale 1.6–2.0); `gun.js` recoil (0.07 s, kick 0.08, climb −0.18 rad); `audio.js` per-event voices.
(c) Our scan lock-on = tracer-style line from rig to plaque (fade ~0.1 s) + sparks on segment dissolve + procedural SFX per segment + HUD discovery toast + banner "SEGMENT 2/4 CLEAR"; hold-to-dissolve gets a reusable mesh whose opacity = holdProgress (muzzle-flash pattern) instead of spawning geometry per frame.
(d) Cap concurrent particles per event on LOW tier (e.g. 14→6) like `aibgd` scales counts; single reused mesh costs nothing on mobile.

**5. Audio: synthesized, lazy-unlocked, event-driven, with separate music/SFX gains.**
(a) AudioContext created on first gesture, `resume()` called in EVERY input handler, master/music/sfx gain split (0.10 music under 0.55 SFX), each SFX a 1–2 oscillator + noise function with attack/release envelopes; mute persisted.
(b) `aibgd/.../audio.js` init()/resume() lines 19–38, `_note`/`_noise` primitives, `STORAGE.MUTED`.
(c) Extend our procedural WebAudio with distinct voices for: scan-beep (lock acquisition), per-segment dissolve chirp (rising pitch 1→4), flow-restored arpeggio (waveClear pattern 659/784/988 Hz), patient-crash alarm (playerHit pattern). Resume hook must live in our touch handlers too.
(d) iOS requires resume inside the actual touch handler (not setTimeout) — `aibgd` calling `audio.resume()` in every keydown/mousedown/click is the pattern; do the same for `pointerdown`/`touchstart`.

**6. Pause/blur must clear all held inputs and consume edge presses.**
(a) On pointer-unlock → auto-pause + `clearKeys()`; blur/visibilitychange → clearHeldInput(); pause/restart are consume-once flags, not polled booleans; keyboard events ignored when focus is in a UI control.
(b) `aibgd/.../main.js` controls 'unlock' listener (lines 309–318) + `clearKeys()`; `tgs` InputController `onWindowBlur`/`onVisibilityChange`/`consumePausePressed()` and `ownsKeyboardInteraction()` guard (lines 11–22, 129–135).
(c) Our pause menu + ObjectiveBanner auto-resume should also zero joystick/keys on pause and on tab-hide; E-hold must cancel (not resume mid-hold) after pause; verify no stuck movement after iOS background/return.
(d) Mobile: also listen for `visibilitychange` (backgrounded tab) — the most common stuck-input source on phones.

**7. Touch joystick: normalize by 0.42×stick width, clamp length 1, merge with keyboard before normalizing.**
(a) The joystick radius is relative to the element (not hardcoded px), pointer delta/radius → clamped unit vector; knob visual travel 38 px; keyboard vector + joystick vector summed then clamped — one input pipeline; `pointercancel` + `lostpointercapture` both reset.
(b) `tgs/assets/threejs-vite-game/src/core/InputController.ts` lines 64–93 (`onStickDown`: `radius = rect.width * 0.42`), 222–228 (`updatePointer` clamp), 230–233 (knob 38 px), 163–173 (`readMovement` merge).
(c) Audit our touch joystick against these: relative radius (works on all screen sizes), combined normalize so WASD+touch can't exceed speed 1, and cancel-handlers; drive the same intent vector our keyboard path produces.
(d) This IS the mobile path — set `touch-action: none` only on the joystick/act regions (tgs ui.md line 122), and size the stick ≥ 44 px visual + generous hit area.

**8. Camera smoothing: one exponential damp with named lambda; camera lag 0.12–0.2; dynamic near plane.**
(a) `damp(cur, target, lambda, dt) = lerp(cur, target, 1 - exp(-lambda·dt))` (8–15 snappy, 3–5 floaty); chase cam uses `factor = 1 - exp(-delta/lag)` with lag 0.16; near plane `clamp(distance*0.004, 0.2, 6)` prevents z-fighting across zoom range.
(b) `fable-cities/src/shared/math.js` line 14–20; `fable-cities/src/core/CameraController.js` lines 145–158, 173–177; `tgs` CameraRig.ts `update()` lines 30–39.
(c) Replace any frame-dependent `lerp(a,b,0.1)` in our chase/scan cameras with `damp()` at a documented lambda (feel target: 10); during the intro cinematic, drive `desired` state and let the same damp land the camera (fable-cities `setView(immediate=false)` pattern) — one code path for cinematic and gameplay.
(d) Exponential damp is frame-rate independent — mandatory on mobile where fps swings 30–60; verify no jitter at 30 fps.

**9. HUD: genre-specific state, not stat cards; banner text system for objective beats.**
(a) Scorecard auto-fails "HUD is mostly rectangular stat/debug cards" and "UI overlaps the play path or fails mobile safe areas"; good HUDs show objective progress, timer, and a status line; transient banners (`setBanner(text, 1.4–1.6 s)`) mark phase beats; pickup feedback = 220 ms border flash.
(b) `tgs/references/quality-scorecard.md` Automatic Failures; `tgs` Hud.ts (status line "Collect relays · avoid sweepers", state panel copy per state, `flashPickup()` 220 ms); `aibgd` main.js `setBanner`.
(c) Our HUD: objective progress ("SCAN LOCK 68%"), patient-stability meter, and phase banners already fit — add per-state results copy ("All relays linked. Run it again and beat your time." tone) and the flash-tick on each treatment segment; audit against the auto-failure list before each VLM round.
(d) Respect `env(safe-area-inset-*)` in HUD layout (tgs ui.md lines 143–146) and keep HUD out of the thumb arcs.

**10. Tutorial = the first 30 seconds must contain a real decision; teach by gated prompts, not walls of text.**
(a) Fable-cities' own critic scored its new-player experience 5.5/10 — "no in-game tutorial, and a fresh city takes a couple of minutes before anything visibly grows"; tgs lists "first 30 seconds lack a real decision" as a design failure; block-fps teaches with a one-line hint that changes with state.
(b) `fable-cities/README.md` "Current state" + `docs/critique/`; `tgs/references/game-design.md` failure list lines 163–167; `aibgd` main.js hint lines 307/317.
(c) Heart mission open: patient crisis banner + immediate forward flight with a marker beacon at the first plaque within ~10 s, hint line cycling "hold [E] to scan" only when in range; make the first clot trivially reachable so the first decision (approach angle) happens instantly; results screen invites retry ("beat your time").
(d) Mobile: first decision must be joystick-only (no keyboard assumption in onboarding copy); show touch glyph variants of prompts.

**11. Adopt the two-key verification rituals: screenshots-or-it-didn't-happen + bot-playtest signals.**
(a) Fable-cities: "No agent may claim anything it hasn't screenshotted and looked at" + critic JSON with measured evidence + STATUS.json resuming at weakest module; tgs: scorecard automatic failures + fresh-eyes reviewer given ONLY captures; bot-playtesting measures score-delta, first-score step, softlock windows, time-to-first-fail.
(b) `fable-cities/PROMPT.md` step 2/4/6 + `docs/critique/buildings_p4.json` (measured luminance/draw calls); `tgs/references/quality-scorecard.md` Fresh-Eyes Review; `tgs/references/bot-playtesting.md` lines 48–50.
(c) Upgrade our VLM critique rounds (P9) with the fable-cities format: per-round JSON with severity-ranked issues + pixel-region evidence + a persisted score file we resume from; add an agent-browser scripted golden-path run that asserts phase transitions + fail/retry works (collision-death path) — exactly our existing Playwright-style harness.
(d) Capture mobile-viewport (and reduced-motion) screenshots as a REQUIRED set member — "only a canvas crop… used to claim full-shell quality" is an automatic failure.

**12. Anchor visual quality on a written 0–3 scale with numeric thresholds, and never let the builder grade alone.**
(a) Fable-cities' anchored 0–10 critic scale (pass ≥8.5) + blind A/B gate; tgs' 0–3 scorecard with per-category anchors and thresholds (premium: all ≥2, avg ≥2.3; showcase: ≥6 categories at 3, avg ≥2.7) + reconcile by taking the lower score; both report failures honestly ("no module ever cleared the bar").
(b) `fable-cities/PROMPT.md` "The bar" table + README "Current state"; `tgs/references/quality-scorecard.md` Scoring Scale + Thresholds.
(c) Define our own anchors for the five P9 critique rounds: e.g. "1 = default R3F primitives + fog", "2 = authored vessel/plaque/materials, readable states, HUD coherent", "3 = AAA microscopic sci-fi with disciplined neon" — score desktop AND mobile captures per round, log both score sets, fix to the lowest category first.
(d) Mobile capture set is part of the gate; LOW-tier fast-shader path (our SwiftShader fallback) must be scored too, not exempted.

**Bonus (method, zero-cost): standardize the update order and intent conversion.**
(a) Canonical order: devices → intents → fixed movement/collision → rules/events → VFX → camera → UI/audio → render; never let simulation read DOM timing; every resource has a dispose owner.
(b) `tgs/SKILL.md` "Architecture Invariants" + `tgs/src/core/Loop.ts` (fixed 1/60 step, max 6 steps/frame, interpolation alpha).
(c) Document this order in our game engine module and audit `src/game` against it (our Zustand store = authoritative state; ensure visual meshes are derived, collision proxies separate); adopt the alpha-interpolated presentation only if we move to fixed-step.
(d) Fixed-step with clamped accumulator protects slow Android devices from spiral-of-death (max 6 steps = max 100 ms catch-up).

---

## Appendix: file-path evidence index

| Claim | Path |
|---|---|
| Wave table + endless multipliers | aibgd/public/games/block-fps/config.js (WAVES, endlessMultipliers) |
| One-shot wave-clear latch | aibgd/public/games/block-fps/waves.js (cleared flag, markWaveCleared) |
| Wave-clear per-frame bug note | aibgd/public/games/block-fps/main.js (~line 390) |
| approach() movement + axis slide | aibgd/public/games/block-fps/player.js (72–145) |
| i-frames + contact-rate damage | aibgd/.../config.js (HIT_INVULN), enemies.js (145–155) |
| Tracer/spark/muzzle-flash channels | aibgd/.../world.js (109–245) |
| Recoil constants | aibgd/.../gun.js (22–24, 160–173) |
| Synth audio + unlock pattern | aibgd/.../audio.js (19–48, 106–165) |
| Pause-on-unlock + clearKeys | aibgd/.../main.js (297–318) |
| Test tiers + __gameTest hook | aibgd/docs/testing.md |
| Journal + autonomy contract | aibgd/docs/journal.md |
| Mobile non-support admission | aibgd/docs/games/block-fps.md ("Known issues / deferred") |
| Method (architecture-first, critics, blind gate) | fable-cities/PROMPT.md |
| Module contract + perf budget + light trap | fable-cities/ARCHITECTURE.md (§2, §3) |
| damp()/dampAngle math | fable-cities/src/shared/math.js (14–20) |
| Orbit camera + zoom-to-cursor + near plane | fable-cities/src/core/CameraController.js |
| Frame-staged input + claimKey + injectClick | fable-cities/src/core/Input.js |
| Loop clamp + error isolation + stats | fable-cities/src/core/Engine.js (_tick, _reportError, stats) |
| Quality tiers | fable-cities/src/core/Config.js (QUALITY) |
| Measured critique example | fable-cities/docs/critique/buildings_p4.json; docs/STATUS.json |
| Anti-tech-demo failure modes | tgs/SKILL.md (Common Failure Modes) |
| Player promise + 5–30 s loop | tgs/references/game-design.md (22–49, 163–167) |
| Fixed-step loop constants | tgs/assets/threejs-vite-game/src/core/Loop.ts (3–9) |
| Joystick constants | tgs/.../src/core/InputController.ts (64–93, 163–173, 222–233) |
| Feel: 100 ms, trauma², hitstop 60–90 ms | tgs/references/game-feel.md (14, 76–154) |
| Scorecard anchors/thresholds/auto-fails | tgs/references/quality-scorecard.md |
| Bot-playtest signals | tgs/references/bot-playtesting.md (48–50) |
| Touch UI + safe areas | tgs/references/ui.md (111–160, 268–282) |
| Genre contract example | tgs/assets/genre-overlays/runner/docs/genre-contract.md |
