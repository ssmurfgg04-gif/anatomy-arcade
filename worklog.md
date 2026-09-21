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

---
Task ID: RA-4
Agent: Explore subagent
Task: Locate + study Voxelcraft, Roller Rink 3D, AntiGravity Pool, Red Reddington demos, Rapier engine, Prairie Adventure, San Verde, PigeonWorld; extract technique lessons.

Work Log:
- Read CONTEXT.md + worklog.md; searched GitHub API with multiple query variants per target repo.
- Found + shallow-cloned 8 repos into tmp-research/: bridge-mind/voxelcraft (★13), ClaudiaCornacchia/Roller-Rink-3D, erichlof/AntiGravity-Pool (★21), WesUnwin/three-game-engine (★113), digitizdat/prairie-adventure, ryanfitzpatrickio/san_verde, PeerPigeon/PigeonWorld; Red Reddington Web Demos NOT FOUND after 6 queries + user lookups → compensated with matthew-kissinger/threejs-field-grass + mattatz/THREE.Fire (same technique list).
- Read source with line-anchored evidence: voxelcraft greedy mesher/chunk budgets/AABB sweeps/fixed-tick loop/persistence; Roller Rink implicit-ellipse collision, momentum steering, chase-cam lerp, day/night keyframes; AntiGravity mobile-vs-desktop shader tiers, Oimo 1/60 fixed step, uniform-array ball sync (zero meshes), 0.75 DPR mobile; three-game-engine Rapier integration + kinematic/dynamic character controllers + axis input abstraction; prairie heightfield slope math (engine removed); san_verde WebGPURenderer w/ WebGL fallback, chunk-grid 900/2200 radii + scheduler.yield bakes, DPR cap 0.9; PigeonWorld seeded hash-noise worldgen, FogExp2 edge hiding, P2P interpolation 120ms/200ms.
- Wrote docs/RESEARCH/RA-4-physics-techniques.md (8 repo sections + 14 lessons with evidence paths, heart-mission applications, mobile caveats).

Stage Summary:
- Best steals: time-budgeted streaming (6ms/frame, nearest-first, +1-ring hysteresis) for 30+ vessel segments; implicit tube collision via projection+event (no raycasts); axis-separated clamped sweeps for wall sliding; fixed-tick sim + clamped render dt; momentum-rotating steering; ontouchstart-driven dual-shader/DPR/FOV tiers (AntiGravity pattern); THREE.Fire 20-step/3-octave formula for clot dissolve; grass-sway instanced-root math for vessel wall pulse/cilia; SDF player-wake field for readable fluid interaction; instanced shader-deformed biconcave discs to replace RBC spheres; keyframed smoothstep lighting for vessel zones; follow-cam 0.35 lerp + lookAt-head; delta+seed persistence with quota handling.
- Rapier verdict: overkill for tube flight (~0 KB custom wins); justified only for future multi-body debris; kinematic-controller middle path documented.
- No app code modified; token never written to any file.

---
Task ID: RA-3
Agent: Explore subagent
Task: Locate + study LAAS, threejs-world, Turbo Kart Rush, Murmur, Fable Lite, World of Light; extract mobile-transferable lessons.

Work Log:
- Read CONTEXT.md + worklog.md (heart mission playable, mobile-first hard law, quality AUTO tiers exist).
- GitHub search API located 5 of 6 targets: Vodkadav/minecraft3d (=PROJECT LAAS, 4x4km WebGPU world), mrlin728/fable5-world-demo (LAAS demo snapshot), bridge-mind/turbo-kart-rush (37★ WebGL2 kart racer), anhduc88vn/murmur (one-input WebGPU flight game), wass08/fable-lite (8★ WebGPU/WebGL2 action-RPG), teuzowebdeveloper9/world-light (R3F+Rapier+Workers+god rays). threejs-world NOT FOUND after 7 query variants (threejs-world, in:name, +webgpu, caustics/131k particles, built-on-LAAS, atmospheric-scattering variants) — recorded as not found, moved on.
- Shallow-cloned all 6 into /home/z/my-project/tmp-research/ (LAAS 365M, LAAS-demo 348M, kart 3.3M, murmur 1.7M, fable-lite 13M, WoL 98M); token never written to any file.
- Deep-read adaptive quality: murmur/src/core/perf.ts Governor (two knobs: renderScale continuous ±0.06/+0.03 with cooldowns, tier discrete 4 profiles with 2.2s/8s hysteresis + 4s/10s cooldowns, budget = 1000/min(refresh,120), over >1.18x / under <0.72x, minScale 0.5 touch; frameMs EWMA 0.08 in core/loop.ts; applyProfile rebuilds particle buffers carrying activeCount — Stage.ts:308).
- Deep-read particles: LAAS 131,072 compute particles in camera toroidal box (±36m) with env-based type re-roll; WoL 1,200 shader Points wrapping around camera (zero CPU); kart 6144+4096 CPU ring-buffer Points pools for gameplay FX.
- Deep-read atmosphere: WoL one-sphere GLSL gradient+pow glow+hash stars+2 baked ridges (cheap 90%); LAAS Hillaire LUT trio (256x64/32x32/192x108) + froxel volumetrics (desktop tier).
- Deep-read audio: murmur AudioDirector bus topology (limiter, VOICE_CAP 56 with 30ms steal, generated IRs, 25ms lookahead, duck 0.06–0.85); kart EngineVoice saw+square+sub→rpm lowpass→tanh→PannerNode; step-sequencer music (152bpm, final-lap ×1.1).
- Deep-read game feel/camera: kart FollowCamera (FOV 68→80, drift yaw-lag 3.4 + 12° offset, roll ≤0.045, shake decay 5.5, ground clamp, cinematic swoop), murmur cameraRig (partial follow 0.32, asymmetric damp 4.2/3.2, FOV +5.2, micro-roll, fbm drift), WoL squash formula + FOV kick, fable-lite trauma² shake + hit-stop + pre-warmed pipelines + 8-light pool.
- Deep-read WoL engineering: Playwright QA loop (SwiftShader args, pageerror→fail, real input driving, DEV __* state hooks, verify-npcs.mjs camera-warp assertions), chunk Web Worker (transferables, MAX_IN_FLIGHT 2 priority queue, skirts, ACTIVE_RADIUS 3), same-analytic-sampler guaranteed ground.
- Deep-read LAAS extras: Wind.ts laws (deflect more, never oscillate faster; constant per-instance frequency; downstream lag 5.5m), caustics via inverse-Jacobian 512² rebake ~0.05ms, STATUS.md perf pass 73.5→19-23ms GPU (bake noise octaves, GTAO 16→8, half-res clouds), quality presets "smaller grids, never fewer systems".
- Wrote docs/RESEARCH/RA-3-webgpu-procedural.md: per-repo sections with code evidence + 15 numbered lessons with transfer verdicts.

Stage Summary:
- 5/6 repos found and studied; threejs-world not found (documented with queries tried; mrlin728/fable5-world-demo is the nearest LAAS-lineage match).
- Murmur's perf.ts Governor identified as a direct-port (pure TS, zero-dep) upgrade path for our quality AUTO tiers — the single most valuable artifact for the mobile hard law.
- Mobile-safe particle recipe established: Points + shader-side toroidal wrap (ambient, 1–6k) + fixed CPU ring-buffer pools (FX, ≤8k); 100k+ compute particles flagged DESKTOP-ONLY.
- Cheap-90% atmosphere = one backside sphere gradient shader (WoL, 141 lines) with state-driven uniforms; Hillaire LUTs/volumetrics flagged DESKTOP-ONLY.
- Playwright QA loop from world-light/scripts/ is copy-paste ready for our VLM-critique screenshot pipeline (SwiftShader args + pageerror fail + DEV state hooks).
- Artifacts: docs/RESEARCH/RA-3-webgpu-procedural.md; clones retained in tmp-research/ for follow-up greps.

---
Task ID: RA-1
Agent: Explore subagent
Task: Study gillworks/red-sands, gillworks/golden-saucer, ssmurfgg04-gif/gods-eye-view; distill engineering lessons.

Work Log:
- Read CONTEXT.md + worklog.md; shallow-cloned all three repos into tmp-research/ (all clones succeeded, no token written to any file).
- red-sands (~69k LOC JS, three r0.185, 100% procedural): read Engine.js (system registry, per-system EMA cost attribution, adaptive-governor frameMs, DPR min-cap, NoToneMapping+AgX-in-PostFX, dt clamp 0.1s), CameraRig.js (exp smoothing rates, distance-constant ground filter, sphere-cast arm shorten-fast/extend-slow, handheld sines + k² shake, 3.4s look-authority latch, setFreeCamera harness contract), Player.js (gait ladder 1.62/3.95/6.60 m/s, ACCEL 8.2/DECEL 11.0, SPRINT_WINDUP 1.15s, mount beat timeline), Config.js (frozen 4-preset contract + deviceMemory/cores detect), Grade.js (latitude/toe measured grades; shadow-tint red-deletion trap), ParticleShaders.js (FIELD_* stateless GPU vs POOL_* CPU), Scatter.js/Vegetation.js (terrain-derivative placement, InstancedMesh + 2-3 LODs + dithered crossfade), tools/{capture.mjs,metrics.py,motion.py,scout.mjs} + docs/{CRITIC,PROCESS,CONTRACTS}.md (4-instrument critique loop, builders never self-grade, ~2000 draw calls/16ms budget, determinism law).
- golden-saucer (FastAPI AI-world pipeline + ~1.8k LOC TS canvas engine): backend/world/designer.py (LLM plan → 5-7 node scene graph schema), graph.py ("generated once is canon forever", "unmapped doors lead nowhere", JSON worlds), WorldSession.ts (prefetch on arrival + FF-swirl overlay rule), Game.ts (depth-driven feet-sampled sprite scale 0.7–1.25, exit trigger state machine: arming + 2.0s cooldown + spawn-arm + 250ms/−2000ms debounces, dt clamp 1/15 + 45ms throttled-tab watchdog, axis-separated navmesh wall-slide, built-in debug overlays).
- gods-eye-view (~171k LOC JS, 191 colocated .test.mjs, Cesium): renderGovernor.js (ref-counted idle requestRenderMode holds, 16ms frame-coalesced burst guard, 60% GPU idle burn fixed), quality/adaptiveQuality.js (FPS_FLOOR 34/CEILING 52, 3 bad/6 good 2-s windows, 5s cooldown, resolutionScale 1.0/0.85/0.75, low-end detect deviceMemory<6GB/cores≤4/mobile UA), core/eventBus.js (sync pub/sub, bounded replay 32, coalesceKey, listener isolation), core/relevance.js (severity×recency decay half-life 6h, budget selection, deterministic tie-breaks), cameraVerbs.js (one-motion slot, cancel-on-input, dolly = trapezoid + bank≤10° cascaded filters + 6.5s gaze lead + altitude breathing, prefers-reduced-motion zeroes flourish), aircraftRecession.js (never-vanish floors scale 0.45/alpha 0.35), trailRenderer.js (depth-fail dimmed-not-vanished), scripts/check-bundle-budget.mjs (50KB gzip growth rule), smoke-pr-gate.mjs, depcruise.config.cjs (no cycles, no core→voice static imports, manager layer-agnostic), docs/PERFORMANCE.md (measured baselines culture), TESTING.md (adversarial field tests + deterministic virtual frame clock harnesses).
- Wrote docs/RESEARCH/RA-1-gillworks-family.md: per-repo sections (stack, LOC scale, 6 code-level findings each with evidence paths) + "TOP LESSONS FOR ANATOMY ARCADE" (14 numbered lessons + 1 bonus, each with evidence / exact heart-mission application / mobile caveat) + structural copy-list.

Stage Summary:
- Report delivered: docs/RESEARCH/RA-1-gillworks-family.md. No app code modified; only new file under docs/RESEARCH/ + this append.
- Highest-leverage transfers for the heart mission: (1) frame-rate-independent exp smoothing with named rate constants everywhere; (2) distance-constant camera filtering scaled by flight speed; (3) FPS-governed adaptive quality with hysteresis (34/52 fps, 3/6 windows, 5s cooldown, resolutionScale steps) on top of our existing tiers; (4) idle render governor (frameloop="demand") for menu/pause/results — biggest battery win on mobile; (5) stateless GPU particles in camera-wrapped box for blood cells; (6) look-authority latch so auto-follow never fights touch/mouse; (7) deterministic capture harness + metric gates to make VLM critique rounds cumulative ("immune system"); (8) trigger arming+cooldown state machine for objective zones; (9) never-delete-red-from-shadows grading rule for the crimson palette; (10) pure-policy modules + colocated tests + depcruise boundaries + 50KB bundle-growth gate as house architecture.

---
Task ID: RA-2
Agent: Explore subagent
Task: Study balbonits/ai-browser-game-demos, rawprogress/fable-cities, chrislaupama/threejs-game-studio; distill gameplay/method lessons.

Work Log:
- Read CONTEXT.md + worklog.md; shallow-cloned all three repos to tmp-research/ (no 404s, no search-API fallback needed; token never written to any file).
- ai-browser-game-demos: read block-fps in full (config/player/gun/enemies/waves/world/audio/main, 1785 LOC) + docs (testing.md 4-tier test doctrine + __gameTest hook, journal.md autonomy contract, games/block-fps.md incl. "no mobile support" admission).
- fable-cities: read PROMPT.md (agent-team method), ARCHITECTURE.md (module contract, perf budget, light-budget 60→9.5fps trap), src/core (CameraController, Input, Engine loop, Config quality tiers), shared/math.js damp(), docs/critique/*.json + STATUS.json measured-critic format.
- threejs-game-studio: read SKILL.md control plane, scaffold code (Loop.ts fixed-step, InputController joystick constants, Game.ts tuning/state/context-lost, CameraRig, Hud), references (game-design player promise, game-feel hitstop/shake numbers, quality-scorecard 0–3 anchors + auto-failures, ui.md touch/safe-area, bot-playtesting signals), evals/golden-tasks.md.
- Wrote docs/RESEARCH/RA-2-ai-built-method.md: 3 repo sections (stack/scale/findings with file-path evidence), 5 "games vs tech demos" mechanisms, 12 numbered lessons each with (a) lesson (b) code evidence (c) exact heart-mission application (d) mobile caveat, plus evidence-path appendix. No application code touched.

Stage Summary:
- Report at docs/RESEARCH/RA-2-ai-built-method.md. Highest-value imports: (1) one-shot latch on phase-complete events (aibgd waves.js — same class as our EDUCATION_POPUP stomp bug); (2) approach()-based movement + axis-slide collision + i-frames/contact-rate damage rhythm (aibgd player.js/enemies.js); (3) damp(lambda) camera smoothing + dynamic near plane (fable-cities); (4) joystick radius = 0.42×element width, merged-then-normalized input, pointercancel reset (tgs InputController); (5) fable-cities critic format (severity + pixel-rect + measured luminance + persisted STATUS.json) and tgs 0–3 anchored scorecard with mobile-capture auto-failures — direct upgrade to our P9 VLM rounds; (6) bot-playtest signals (score-delta, softlock windows, time-to-first-fail) for our agent-browser golden path; (7) block-fps self-reported "no mobile support" = the exact dead end our touch-first law avoids.
- tmp-research clones left in place for follow-up greps (sandbox-local, not committed).

---
Task ID: P5-landing
Agent: frontend-styling-expert
Task: Landing page rebuild per user's UI reference image + MenuScene polish/30fps throttle.

Work Log:
- Read CONTEXT.md + worklog tail; read reference image via VLM (glm-5v-turbo; one 429 retry after cooldown) and extracted layout/palette/hierarchy; confirmed against the written P5 spec (spec wins on exact hex/text).
- Verified contract surfaces: src/game/core/state.ts (setPhase/setUiOverlay/startMission/settings/discoveries/qualityResolved), src/app/page.tsx (MainMenu mounts at MAIN_MENU + MISSION_SELECT; MissionSelect overlays it; MenuScene renders when !inMission), src/app/globals.css (aa-cyan/aa-crimson vars, range styling), layout.tsx (Geist sans/mono). lucide-react 0.525 present in package.json — used real lucide icons (no inline fallbacks needed).
- Created src/ui/landing/motion.ts: usePrefersReducedMotion() = settings.motionReduced OR matchMedia("(prefers-reduced-motion: reduce)"), shared by landing chrome and MenuScene.
- Created src/ui/landing/TopNav.tsx: fixed translucent dark bar (safe-area top/left/right), logo mark (crimson gradient rounded square + glowing lucide Heart) + stacked italic ANATOMY/ARCADE wordmark; center links HOME (active, glowing cyan underline)/MISSIONS (anchor-scroll) + BIODEX→JOURNAL, LEARN→HOW_TO_PLAY, ABOUT→CREDITS overlays; Volume2/VolumeX mute toggle (prev volume kept in ref, restore on unmute); gear popover (native quality select AUTO/LOW/MEDIUM/HIGH, audioMaster range slider + %, reduced-motion role="switch") with Escape + window pointerdown-outside close (popover lives inside backdrop-blurred bar, so a DOM close-layer would be mis-contained — backdrop-filter creates a fixed containing block); "Play on Mobile" pill → modal (exact copy "Open this site in your phone's browser and tap PLAY", URL preview, COPY LINK via navigator.clipboard with ok/fail states, Escape + backdrop close); <lg hamburger slide-down panel with same links + mobile CTA. All targets ≥44px, focus-visible rings everywhere.
- Created src/ui/landing/Hero.tsx: min-h-[88svh], lg 2-col grid; eyebrow "THE HUMAN BODY. YOUR MISSION." (mono, cyan, letterspaced); H1 ANATOMY (white) / ARCADE (#2DD9E8 + soft glow), font-black italic, clamp(3.1rem,11.5vw,7.5rem); exact paragraph; PLAY cyan filled pill (lucide Play, dark text for WCAG contrast on #2DD9E8) → setPhase("MISSION_SELECT"); MEET THE SCIENCE outlined pill → HOW_TO_PLAY; progress line (JOURNAL: N DISCOVERY/DISCOVERIES LOGGED — smart-plural deviation from literal spec; else "MISSION 01 AVAILABLE — NO EXPERIENCE REQUIRED"). Right column: floating organ chips HEART (HeartPulse, left-of-center, "Pumps 100,000 times every day"), BRAIN (Brain, upper right, "Your control center"), LUNGS (Wind, mid right, "Keep you breathing") — circular icon chip + name + subtext + pulsing gradient connector line, staggered CSS float, hidden <lg, aria-hidden, pointer-events-none.
- Created src/ui/landing/GameModes.tsx: section eyebrow CHOOSE YOUR MISSION / H2 Game Modes / right kicker REAL BIOLOGY / INTERACTIVE GAMEPLAY / LEARN & EXPLORE (hidden <md); 3 cards (1-col mobile → 3-col lg), 16:10 procedural media, rounded-xl on rgba(10,18,30,0.6): Card 1 HEART ATTACK RESPONSE active (cyan border + outer glow + "1 / 3" chip; CSS/SVG art: crimson vessel tube, biconcave RBC ellipses, pale plaque mass, nano-robot dot, scanlines/vignette; copy exact; Clock 10–15 min + CSS difficulty bars Beginner + BookOpen Learn + Play; whole card is a button → startMission("heart") with hover ArrowRight circle); Cards 2/3 VIRAL INVASION / BRAIN MISSION (COMING SOON chips, teal/violet lung+virus specks art, blue/violet SVG neural web art; Lock meta replaces enabled state; greyed arrow button fires inline COMING SOON toast, fixed bottom pill, auto-hide 1.8s, no alert()).
- Created src/ui/landing/FeaturesBand.tsx: 4 items (Boxes/BrainCircuit/Smartphone/Gamepad2 in circular cyan chips) with exact copy; handwritten-style note "Small robot. Big impact." rotated ~-2.5deg in cyan tint (font-serif italic — system serif stack, no font import; flagged as deviation from sans/mono-only law).
- Created src/ui/landing/Landing.tsx: composition + slim footer (exact tagline line + CREDITS link) with safe-area bottom/left/right; lower sections sit on #04070c→#050b16→#030509 gradient panel with a cyan hairline seam; keyframes (aa-float/aa-conn-pulse) declared in-file with @media (prefers-reduced-motion) + [data-motion="off"] gates; page is its own scroll container (fixed inset-0 z-30 overflow-y-auto) since page.tsx <main> is fixed+overflow-hidden — R3F backdrop stays fixed behind; nav renders only on MAIN_MENU phase so it never covers MissionSelect's BACK control.
- Rewrote src/ui/menus/MainMenu.tsx as thin shell-compatible re-export of Landing (page.tsx unchanged).
- Upgraded src/scenes/MenuScene.tsx: frameloop="demand" + in-canvas FramePacer (30Hz invalidate; 24Hz when useGame.getState().qualityResolved==="LOW", read once on mount); vessel emissive #C21E3A 0.9→1.6, heart node →2.1; additive canvas-texture halo sprite (radial cyan gradient plane, 8.5×10.5, behind body); key light 2.2→3.0 (+crimson fill 1.6→1.9); slow whole-body vertical bob; pointer parallax now driven by window pointermove (landing DOM covers canvas so R3F pointer would be dead) with frame-rate-independent damping pos += (target-pos)*(1-exp(-4*dt)); all decorative motion frozen under shared motion law; LOW tier swaps expensive transmission physical material for cheap standard material + lower capsule segments.
- Verified: `bun x tsc --noEmit` → zero errors under src/ (only pre-existing errors in agents' tmp-research clones, outside app); `bunx eslint src/ui/landing src/ui/menus/MainMenu.tsx src/scenes/MenuScene.tsx` → clean. Full read-back of all written files: safe-area insets on nav+footer, no fixed-px widths that break 360px (clamp-based H1, fluid grids, w-[272px] popover fits 360px), apostrophes only inside JS strings ("phone's", Alzheimer's in TS data), status chip text-width audited.

Stage Summary:
- MainMenu is now a full scrollable landing page (nav / hero+organ chips / game modes / features / footer) matching the reference image; MenuScene is a demand-framed, throttled backdrop.
- Files created: src/ui/landing/{motion.ts, TopNav.tsx, Hero.tsx, GameModes.tsx, FeaturesBand.tsx, Landing.tsx}. Files modified: src/ui/menus/MainMenu.tsx (re-export), src/scenes/MenuScene.tsx (polish + perf).
- Contract notes for integrator: page.tsx needs NO changes — MainMenu still mounts at MAIN_MENU|MISSION_SELECT and PLAY→setPhase("MISSION_SELECT") shows MissionSelect on top (landing auto-hides its nav during MISSION_SELECT so the z-50 bar can't cover MissionSelect's BACK). BIODEX/LEARN/ABOUT + footer CREDITS open via setUiOverlay as before (overlays z-[60] sit above nav z-50). startMission("heart") goes straight to MISSION_BRIEF. Settings popover writes settings.quality/audioMaster/motionReduced via setSettings (muted = audioMaster===0). MenuScene GPU law: demand frameloop + 30/24Hz pacer + window-pointer parallax — do not re-add R3F-event pointer reads while the landing covers the canvas.
- Known gaps/ deviations: (1) difficulty bars + heart chip connector are CSS approximations of the image; (2) PLAY pill uses dark text on cyan for contrast instead of the image's white-on-cyan; (3) "Small robot. Big impact." uses system serif italic (no bundled script font allowed); (4) journal line smart-pluralizes DISCOVERY/DISCOVERIES; (5) organ chip float uses CSS keyframes declared in Landing.tsx (globals.css untouchable); (6) real-device mobile pass + VLM screenshot round still pending (P9).

---
Task ID: P4-research+P5 (main)
Agent: main
Task: Deep-research wave (4 parallel agents, 19 repos) -> engineering law; landing rebuild per user UI image; engine feel/perf pass; E2E verify; push.

Work Log:
- Launched 4 parallel Explore agents: RA-1 (red-sands/golden-saucer/gods-eye-view), RA-2 (ai-browser-game-demos/fable-cities/threejs-game-studio), RA-3 (LAAS/kart-rush/murmur/fable-lite/world-of-light), RA-4 (voxelcraft/roller-rink/antigravity/rapier-engine/prairie/san-verde/pigeon). Reports in docs/RESEARCH/RA-*.md; synthesized docs/RESEARCH/LESSONS.md (32 law items).
- Engine pass: src/game/config.ts (frozen feel constants); src/game/quality/governor.ts (murmur port: renderScale hunt, tier demote/promote hysteresis) wired via GovernorDriver -> dynamic Canvas dpr; Player.tsx (config-driven accel/drag, distance-smoothed chase rate, speed FOV, micro-roll from yaw vel, 0.45s i-frames, slide collision keeps tangential speed); BloodCells.tsx v2 (true biconcave lathe, constant-rate per-cell spin, player-wake displacement, instance color variance, governor count cap); input.ts (clearHeldInput + visibilitychange + suspended flag); HeartMission (pause freezes sim, playLockOn/playDissolveTick/playFlowRestored); page.tsx aa-resume event.
- Landing: P5-landing subagent rebuilt MainMenu as full landing (TopNav/Hero/GameModes/FeaturesBand/Landing) per user's image; MenuScene demand-loop 30Hz + brighter scene. Main-agent visual QA: body brightness (rim lights, emissive up, standard material), composition right-third (lookAt -0.55), organ chips re-anchored (BRAIN head/LUNGS chest), vessel radius up, NanoOrbit glow, devIndicators off.
- E2E aa_p0_verify.py updated for landing (landing_structure step, MEET THE SCIENCE/BIODEX, role-based mission locator, pause-suspension test) -> 21/21 PASS, 0 page errors. Visual probes: desktop hero, game modes cards, mobile 390px all match reference.

Stage Summary:
- P5 landing live + research law encoded; mobile perf core (governor) in.
- Key numbers: chase rate 8+0.9*speed+2*err; FOV 78+0.4*speed+10 boost; i-frames 0.45s; governor budget 1.18x/0.72x, scale steps -0.06/0.35s +0.03/0.7s, demote 2.2s/4s cd, promote 8s/10s cd.
- Next: VLM critique round 1 (P9 protocol w/ red-sands QA gates), P6 scan journal/polish, P7 missions, Sketchfab token still owed.
