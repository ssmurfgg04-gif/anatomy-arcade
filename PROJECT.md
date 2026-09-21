# BUILD ANATOMY ARCADE — A PREMIUM 3D BIOLOGY GAME, NOT A GENERIC 3D WEBSITE

You are the principal engineer, game designer, 3D technical artist, frontend designer, UX designer, performance engineer, QA engineer, and visual art director for this project.

Your job is to build a **beautiful, genuinely playable, educational 3D game called “Anatomy Arcade.”**

The goal is NOT to make a dashboard with a 3D model sitting in the middle.

The goal is NOT to make a science website with some animations.

The goal is to make something that feels like a **small polished sci-fi game**, where the player becomes a microscopic nano-robot travelling through the human body, solving biological emergencies while learning what is happening.

The experience should make a judge instinctively want to touch the screen, move around, discover something, and keep playing.

---

# 0. MANDATORY FIRST ACTION — INSTALL AND READ TASTE SKILL

Before writing application code:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Then locate and read the installed `SKILL.md`.

Treat the Taste Skill as a mandatory design constraint, not optional inspiration.

Also inspect whether the installed package contains relevant redesign/output/soft skills and use the appropriate ones where available.

The current Taste Skill exists specifically to prevent generic AI frontend output and includes guidance for visual hierarchy, spacing, motion, redesigning existing work, and avoiding repetitive/template-looking interfaces.

Before touching the UI, establish a visual direction from the Taste Skill and then adapt it specifically to a **premium futuristic biological game**.

Recommended direction:

* DESIGN_VARIANCE: 7–8
* MOTION_INTENSITY: 7–9
* VISUAL_DENSITY: 4–6

Do not blindly copy a Taste Skill example.

Use its principles to create an original visual identity for Anatomy Arcade.

---

# 1. FIRST: INSPECT WHAT ALREADY EXISTS

DO NOT immediately rebuild the project from scratch.

First inspect:

* repository structure
* package.json
* existing framework
* existing routing
* existing components
* existing styles
* existing 3D scene
* existing assets
* existing shaders
* existing utilities
* existing API integrations
* existing environment variables
* existing build configuration
* existing deployment configuration
* existing mobile behavior
* existing dependencies

Determine what can be reused.

Preserve good existing work.

Only replace something when there is a clear technical or visual reason.

The philosophy is:

**reuse → improve → integrate → replace only when necessary.**

Do not create duplicate components or competing design systems.

---

# 2. DEEP WEB RESEARCH BEFORE BUILDING

Before implementing the final visual experience, conduct substantial web research.

You are explicitly authorized to research the web deeply for:

### 3D anatomy assets

Search:

* Sketchfab
* free/Creative Commons 3D anatomy libraries
* open-source anatomy datasets
* NIH/open medical visual resources
* educational 3D assets
* Blender repositories
* GitHub
* Poly Haven
* ambientCG
* Quaternius
* Kenney where useful
* other high-quality openly licensed repositories
* community repositories containing optimized GLB/glTF assets

### Game/UI inspiration

Research:

* premium sci-fi game HUDs
* microscopic visualization interfaces
* medical visualization
* space exploration interfaces
* game onboarding
* mobile joystick interfaces
* interactive anatomy websites
* educational games
* WebGL experiences
* Three.js showcases
* React Three Fiber showcases

### Procedural generation

Research:

* Blender Geometry Nodes
* procedural blood vessels
* procedural neural pathways
* procedural particle systems
* procedural organ/environment detail
* Three.js procedural geometry
* shader-based biological effects

### Asset optimization

Research current best practices for:

* GLB
* glTF
* Draco
* Meshopt
* KTX2/Basis texture compression
* WebP
* AVIF
* texture atlases
* GPU instancing
* LOD
* frustum culling
* lazy loading
* progressive loading
* mobile WebGL performance

Do NOT simply search for the first model you see and use it.

---

# 3. ASSET-FIRST PHILOSOPHY

Do not waste development time manually creating assets that already exist at high quality.

Use the web as an asset library.

However:

**Never blindly copy an asset into the project.**

For every external asset:

1. Identify source.
2. Identify exact model URL.
3. Identify license.
4. Identify whether modification is permitted.
5. Identify whether the license permits the intended use.
6. Record author/creator.
7. Record attribution requirements.
8. Record original URL.
9. Record any required license notice.
10. Optimize the asset for the web.
11. Store the information in an asset manifest.

Create:

```text
/docs/ASSETS.md
```

with a table:

| Asset | Source | Creator | License | URL | Attribution Required | Modifications | Local File |
| ----- | ------ | ------- | ------- | --- | -------------------- | ------------- | ---------- |

Do not use copyrighted/paywalled models by pretending they are free.

Do not scrape assets in violation of the source website's terms.

Do not use a “free preview” when the actual downloadable asset is paid.

Prefer:

* CC0
* appropriate Creative Commons licenses
* genuinely free assets
* open-source assets
* assets specifically released for reuse

Pay special attention to CC BY, CC BY-SA, CC BY-NC and ND restrictions.

For Sketchfab, inspect the actual individual model's license rather than assuming “free” means unrestricted.

Keep attribution accessible in an in-game “Credits / Asset Credits” panel.

---

# 4. USE SKETCHFAB STRATEGICALLY

Search Sketchfab aggressively for high-quality:

* human heart
* human circulatory system
* arteries
* veins
* lungs
* brain
* neurons
* blood cells
* red blood cells
* white blood cells
* viruses
* platelets
* cholesterol plaques
* thrombus/blood clot
* cardiac anatomy
* lung anatomy
* brain anatomy
* neurons
* blood vessel interiors

Prefer models that:

* have clean topology
* have sensible materials
* are visually impressive
* can be converted to GLB/glTF
* can be optimized
* look good at close camera distances
* are legally reusable

Do NOT load an enormous desktop-quality model directly into mobile Chrome.

Optimize aggressively.

---

# 5. USE MESHY WHERE PROCEDURAL/ORIGINAL ASSETS ARE BETTER

Use Meshy as an asset-generation and refinement tool when appropriate.

Do not attempt to generate the entire human body through Meshy.

Use it selectively for things like:

* nano-robot
* medical probes
* futuristic UI props
* sci-fi micro-machines
* biological debris
* stylized virus particles
* microscopic machinery
* collectible objects
* environmental props
* visual variations
* decorative biological structures

Pipeline:

```text
Concept
→ generate
→ inspect
→ remesh
→ texture
→ optimize
→ export GLB
→ import to Three.js/R3F
→ test mobile performance
```

Prefer GLB for web delivery.

Use PBR materials carefully.

Do not generate five different assets when one modular asset system can produce twenty variations.

---

# 6. BUILD A COHESIVE ART DIRECTION

Everything must feel like the same game.

Visual concept:

## “MICROSCOPIC SCI-FI MEDICAL THRILLER”

Imagine:

* AAA sci-fi game
* microscopic exploration
* medical visualization
* glowing biological structures
* dark cinematic environments
* readable game HUD
* scientific credibility
* controlled neon accents
* organic movement
* dramatic lighting
* high contrast
* elegant typography

Avoid:

* generic purple AI gradients
* generic glassmorphism
* boring Tailwind cards everywhere
* dashboard layouts
* excessive rounded rectangles
* stock illustrations
* cheap-looking icons
* emoji as primary UI
* random neon colors
* excessive particle spam
* cluttered HUDs

The design should feel intentional.

Use a restrained palette.

For example:

* near-black biological background
* deep crimson arterial cues
* oxygen/vascular highlights
* cool cyan interface elements
* subtle white typography
* occasional danger states
* localized color coding for biological systems

Do not turn the entire screen into RGB neon.

---

# 7. CORE PRODUCT CONCEPT

Name:

**ANATOMY ARCADE**

Tagline:

**ENTER THE BODY. SAVE THE PATIENT. LEARN HOW IT WORKS.**

Player fantasy:

> You are a microscopic medical nano-robot deployed inside the human body to respond to biological emergencies.

The game combines:

* exploration
* navigation
* reaction
* environmental storytelling
* biological puzzles
* educational explanations
* light action
* discovery
* progression

The educational content should emerge naturally from gameplay.

---

# 8. FIRST-CLASS GAME MODES

Implement three game modes.

## MODE 1 — HEART ATTACK RESPONSE

This is the most important level.

It must be the primary polished demo.

Scenario:

A patient is experiencing an acute cardiovascular emergency.

The nano-robot enters the vascular system.

The player travels through:

```text
arterial system
→ narrowing blood vessel
→ plaque region
→ blockage
→ clot
→ ischemic danger zone
```

Gameplay:

1. Navigate the blood vessel.
2. Avoid damaging obstacles.
3. Identify abnormal tissue.
4. Locate blockage.
5. Interact with plaque/clot.
6. Perform a biological intervention.
7. Restore flow.
8. Watch blood flow normalize.
9. Receive concise explanation of what happened.

Do NOT make this simply:

“walk to glowing object and click it.”

Introduce actual gameplay.

Examples:

### Blood-flow navigation

Blood cells move past the player.

The player must avoid:

* platelet clusters
* plaque debris
* turbulent flow
* narrowing vessel walls

### Clot clearing

Use a simple interactive mechanic:

* target clot segments
* charge nano-tool
* align reticle
* trigger treatment
* break clot progressively

### Biological feedback

When the blockage improves:

* blood velocity increases
* environment brightens
* red blood cells begin flowing normally
* particles become more organized
* warning indicators disappear
* patient status improves

Create a satisfying audiovisual reward.

---

# 9. MODE 2 — VIRAL INVASION

The player enters the lungs.

Scenario:

A viral infection has compromised lung tissue.

Gameplay:

* navigate alveolar structures
* identify infected cells
* interact with infected areas
* avoid harmful viral particles
* assist immune response
* learn how immune cells detect threats

The player can encounter a white blood cell.

A white blood cell may become a temporary ally.

Provide contextual explanations about:

* alveoli
* gas exchange
* immune response
* viral infection

Do not overclaim disease-specific medical facts.

The game should be educational rather than medical advice.

---

# 10. MODE 3 — BRAIN MISSION

The player enters a 3D neural environment.

Scenario:

Neural pathways are becoming disrupted.

Gameplay:

* navigate neurons
* identify broken pathways
* reconnect damaged neural pathways
* restore signal flow
* learn about neurons and synapses

Visual effect:

A successful connection sends a luminous electrical impulse down the neural pathway.

Make the success visually beautiful.

Use:

* electrical pulses
* particle trails
* synaptic sparks
* subtle volumetric lighting
* controlled bloom

---

# 11. THE FULL-BODY “WOW MOMENT”

Create a full-body presentation screen.

The user sees a stylized translucent human body.

Systems are selectively visible:

* circulatory
* respiratory
* nervous
* skeletal
* muscular if performance allows

Allow the player to rotate the body.

Create an elegant system selector.

Example:

```text
BODY SYSTEMS

○ Circulatory
○ Respiratory
○ Nervous
○ Skeletal
○ All Systems
```

Selecting a system should:

* emphasize that system
* dim other systems
* display a small information panel
* allow camera rotation
* reveal major organs

This is the time-lapse/demo visual.

Create a polished automatic rotation mode as well.

---

# 12. PLAYER CHARACTER — NANO-ROBOT

Create a tiny medical nano-robot.

The player should feel like an actual character, not an invisible camera.

Camera can be:

### PRIMARY

First-person / POV.

### SECONDARY

Third-person chase camera.

### MOBILE

First-person touch navigation must work especially well.

Nano-robot visual concept:

* small futuristic medical machine
* circular or semi-spherical body
* tiny propulsion system
* biological scanning lights
* medical instrumentation
* subtle emissive materials
* readable silhouette
* no unnecessary mechanical complexity

Create animation states:

* idle
* propulsion
* boost
* scanning
* interaction
* damaged
* objective complete

---

# 13. POV CONTROLS

POV mode must be a first-class experience.

Desktop:

```text
WASD = movement
Mouse = look
Shift = boost
Space = vertical movement / special action
E = interact
Esc = pause
```

Mobile:

* left virtual joystick = movement
* right swipe region = camera look
* dedicated boost button
* interact button
* ability button
* pause button

Optional:

Gyroscope look can be added where reliable.

Do not make gyro mandatory.

The player must be able to play entirely through touch.

No hover-dependent critical information.

No tiny desktop-only controls.

---

# 14. MOBILE IS NOT AN AFTERTHOUGHT

The entire game must work on a modern phone browser.

Test at minimum conceptual layouts for:

* 360×800
* 390×844
* 430×932
* tablet portrait
* tablet landscape
* desktop 1280+
* desktop 1920+

Mobile priorities:

1. Stable controls.
2. Fast loading.
3. Good readability.
4. No accidental scrolling.
5. No UI blocking the action.
6. No huge downloads.
7. No overheating from unnecessary rendering.
8. Maintain visual spectacle.

Use responsive layouts.

The game should detect mobile capability and adjust:

* render resolution
* shadows
* particle count
* texture resolution
* post-processing
* view distance
* LOD
* effects

Create quality tiers:

```text
AUTO
LOW
MEDIUM
HIGH
```

AUTO chooses based on device capability.

---

# 15. WEB 3D FILE FORMAT STRATEGY

Prefer:

### 3D geometry

```text
GLB / glTF
```

### Texture compression

Use:

```text
KTX2 / Basis Universal
```

where practical.

### UI/background imagery

Use:

```text
WebP
AVIF
```

with appropriate fallbacks.

Do NOT convert every file to WebP indiscriminately.

A 3D mesh is not an image.

Use:

```text
GLB = 3D models
KTX2 = GPU texture compression
WebP/AVIF = UI/background/raster imagery
SVG = vector UI icons/logos where appropriate
```

Textures should not unnecessarily be 4096×4096 on mobile.

Use different texture tiers.

---

# 16. PERFORMANCE ARCHITECTURE

The experience should target approximately:

### Desktop

60 FPS target.

### Modern mobile

30–60 FPS depending on device.

Avoid expensive effects that provide negligible visual value.

Use:

* instancing
* LOD
* frustum culling
* lazy loading
* asset preloading
* compressed textures
* mesh compression
* efficient materials
* limited dynamic lights
* pooled particles
* deterministic particle systems where possible
* shared geometries
* shared materials
* low-frequency physics
* lightweight collision primitives

Never create thousands of independent React components for particle objects.

The 3D scene should remain primarily imperative where appropriate.

---

# 17. REACT THREE FIBER / THREE.JS ARCHITECTURE

Use:

```text
React
React Three Fiber
Three.js
Drei
```

where appropriate.

Keep React responsible for:

* UI
* state
* screens
* HUD
* menus
* educational panels
* progression

Keep the Three.js world responsible for:

* 3D entities
* animation
* movement
* physics/collision
* particles
* shaders
* camera
* scene management

Avoid unnecessary React rerenders every frame.

Use a clean separation such as:

```text
src/
  app/
  components/
  game/
    core/
    entities/
    systems/
    physics/
    cameras/
    controls/
    levels/
  scenes/
    heart/
    lungs/
    brain/
    full-body/
  ui/
    hud/
    menus/
    overlays/
    education/
  data/
    anatomy/
    missions/
    assets/
  hooks/
  shaders/
  audio/
  lib/
```

Adapt to the existing project rather than blindly imposing this structure.

---

# 18. GAME STATE

Create a clear game state model.

Example:

```text
BOOT
→ LOADING
→ MAIN_MENU
→ MISSION_SELECT
→ MISSION_INTRO
→ PLAYING
→ SCANNING
→ INTERACTION
→ OBJECTIVE_COMPLETE
→ EDUCATION_POPUP
→ MISSION_COMPLETE
→ RESULTS
```

Track:

* current mission
* player position
* objective state
* health
* time
* biological status
* score
* educational discoveries
* completion percentage

Do not allow the UI state and 3D state to drift apart.

---

# 19. EDUCATIONAL LAYER

The game needs actual educational value.

When the player touches/scans an anatomical structure, show a concise information panel.

For example:

```text
CORONARY ARTERY

This blood vessel supplies oxygen-rich blood
to the heart muscle.

MISSION NOTE

A blockage can restrict blood flow and damage
heart tissue.
```

Keep the information:

* short
* readable
* contextual
* scientifically responsible

Do not dump textbook paragraphs into gameplay.

---

# 20. QWEN AI INTEGRATION

Integrate Qwen for dynamic in-game explanations.

Architecture:

```text
Game event
   ↓
Educational context
   ↓
Server-side Qwen request
   ↓
Structured response
   ↓
UI explanation
```

Never expose a secret API key in client-side JavaScript.

Create a server/API abstraction.

Example request:

```json
{
  "organ": "coronary artery",
  "event": "player_scanned_blockage",
  "difficulty": "beginner",
  "context": "heart_attack_response"
}
```

Desired output structure:

```json
{
  "title": "Coronary Artery",
  "explanation": "...",
  "funFact": "...",
  "missionTip": "...",
  "keywords": ["oxygen", "heart", "blood flow"]
}
```

Do not trust free-form model output blindly.

Validate the response.

Have a static fallback if the AI endpoint fails.

The game must remain playable without Qwen.

Qwen is an enhancement, not a single point of failure.

---

# 21. MAKE AI EXPLANATIONS FEEL PART OF THE GAME

Do not display an ordinary chatbot window.

Instead use a “Scan Result” interaction.

Example:

The player scans an artery.

A holographic anatomical overlay appears.

Then:

```text
ANATOMICAL SCAN

CORONARY ARTERY

Blood supply route to the heart muscle.

WHY IT MATTERS
A blockage can reduce oxygen delivery.

+ DISCOVERED
```

The AI explanation appears as a small contextual panel.

Animate:

* scan pulse
* data lines
* holographic highlight
* typing/reveal
* organ outline
* subtle sound

Keep it fast.

---

# 22. GAME HUD

The HUD should communicate information without dominating the screen.

Possible elements:

Top:

```text
HEART RESPONSE          03:42
PATIENT STATUS          72%
```

Center:

crosshair / scanner.

Bottom:

```text
MOVE   BOOST   SCAN   ABILITY
```

Right/side:

mission objective.

Example:

```text
OBJECTIVE
Locate the obstruction

███░░  2/5
```

The HUD should visually integrate with the world.

Do not use generic rectangular dashboard cards.

---

# 23. MISSION OBJECTIVES

Use a small number of meaningful objectives.

Example Heart Mission:

```text
01 ENTER VASCULAR SYSTEM
02 LOCATE FLOW ANOMALY
03 SCAN THE BLOCKAGE
04 BREAK DOWN THE CLOT
05 RESTORE BLOOD FLOW
06 STABILIZE THE HEART
```

Each completion should change the environment.

---

# 24. ENVIRONMENTAL STORYTELLING

The world itself should communicate biology.

Healthy vessel:

* organized blood flow
* smooth walls
* stable lighting
* normal particles

Damaged vessel:

* turbulent movement
* irregular plaque
* debris
* darker lighting
* warning pulses
* disrupted blood cells

After treatment:

* cleaner environment
* normalized flow
* brighter ambience
* positive audio cue

This creates a visual before/after that judges can immediately understand.

---

# 25. PROCEDURAL BIOLOGICAL WORLDS

Where assets alone are insufficient, build procedural systems.

Examples:

### Blood vessel

Generate configurable tube geometry.

Parameters:

```text
radius
curvature
branching
wall thickness
length
damage zones
```

### Neural network

Generate:

```text
nodes
branches
connections
signal paths
```

### Blood cells

Use instanced geometry rather than hundreds/thousands of unique meshes.

Vary:

* scale
* rotation
* velocity
* color tone
* depth
* trajectory

### Biological particles

Use GPU-friendly particle systems where practical.

---

# 26. WATER / GEL / ORGANIC SHADERS

Create subtle materials for:

* blood vessel walls
* tissue
* translucent organs
* mucus/alveolar surfaces
* fluid
* biological membranes

Avoid turning every surface into shiny plastic.

Use physically plausible roughness.

Reserve emissive materials for:

* scan targets
* neural signals
* nano-robot equipment
* danger indicators
* mission feedback

---

# 27. LIGHTING

Use lighting as gameplay feedback.

Do not flood the scene with dozens of lights.

Have:

* ambient/base illumination
* key directional/area lighting
* localized emissive effects
* carefully used bloom

For mobile, simplify aggressively.

The scene should still look cinematic on lower settings.

---

# 28. AUDIO

Do not ship a silent prototype.

Add at minimum:

* movement/propulsion sound
* scan sound
* interaction sound
* warning sound
* objective completion
* mission complete
* subtle biological ambience
* low-volume background music

Audio should enhance interaction.

Do not loop an annoying sci-fi sound every second.

---

# 29. MAIN MENU

The main menu should immediately sell the concept.

Visual:

Rotating translucent human body.

Circulatory system subtly glowing.

Tiny nano-robot visible moving through it.

Title:

```text
ANATOMY
ARCADE
```

Subtitle:

```text
ENTER THE BODY.
SAVE THE PATIENT.
```

Primary action:

```text
START MISSION
```

Secondary:

```text
EXPLORE BODY
```

Other:

```text
HOW TO PLAY
CREDITS
SETTINGS
```

Use cinematic motion.

Do not create a generic centered hero section with three cards underneath.

---

# 30. MISSION SELECT

Mission cards should feel like game mission nodes.

Example:

```text
01
HEART ATTACK RESPONSE
STATUS: READY
```

```text
02
VIRAL INVASION
STATUS: LOCKED / READY
```

```text
03
BRAIN MISSION
STATUS: LOCKED / READY
```

Use 3D previews where possible.

---

# 31. ONBOARDING

Keep onboarding under approximately 30 seconds.

Teach through interaction.

Example:

```text
MOVE
Drag to navigate
```

Then:

```text
LOOK
Swipe the right side
```

Then:

```text
SCAN
Tap SCAN to inspect anatomy
```

Then immediately put the player inside the heart.

Do not present a giant wall of instructions.

---

# 32. COLLISION AND PHYSICS

Use lightweight collision detection.

The game does not need advanced physics.

Use:

* spheres
* capsules
* boxes
* simplified vessel boundaries
* trigger volumes

for most gameplay.

Do not run expensive mesh-mesh collision every frame.

Use spatial partitioning where useful.

---

# 33. CAMERA SYSTEM

Create multiple camera modes:

```text
POV
CHASE
CINEMATIC
BODY_OVERVIEW
```

POV:

* tight first-person
* responsive look
* subtle movement
* no excessive camera shake

CHASE:

* slightly behind nano-robot
* cinematic view

CINEMATIC:

Used for:

* mission start
* mission completion
* full-body reveal
* major discoveries

BODY_OVERVIEW:

* orbit controls
* clean system visualization

---

# 34. PLAYER FEEL

The nano-robot must be satisfying to control.

Movement should feel:

* responsive
* smooth
* slightly floaty
* intentional
* futuristic

Add acceleration/deceleration but avoid sluggishness.

Boost should feel meaningful.

When boosting:

* slight FOV increase
* particles intensify
* propulsion animation changes
* audio rises
* subtle screen effect

Never make the camera nauseating.

---

# 35. DISCOVERY SYSTEM

Reward curiosity.

When players find special anatomy:

```text
DISCOVERY UNLOCKED

MITRAL VALVE
```

or:

```text
DISCOVERY

Platelet
```

Store discoveries.

Create a simple Anatomy Journal.

Example:

```text
ANATOMY JOURNAL

● Coronary Artery
● Platelet
● Red Blood Cell
○ Aorta
○ Mitral Valve
```

The journal should remain lightweight and elegant.

---

# 36. SCORING

Use gameplay-oriented scoring.

Potential metrics:

```text
MISSION TIME
PATIENT STATUS
ACCURACY
DISCOVERIES
DAMAGE TAKEN
```

Avoid turning the educational material into a competitive academic test.

The player should feel rewarded for:

* exploration
* efficient actions
* learning
* successful intervention

---

# 37. ACCESSIBILITY

Include:

* readable typography
* sufficient contrast
* motion reduction option
* audio volume controls
* subtitles/text equivalents for important audio
* touch-friendly controls
* non-color-only indicators
* scalable text where reasonable

Never communicate a critical objective only through color.

---

# 38. LOADING EXPERIENCE

3D applications often look broken while loading.

Create an elegant loading screen.

Example:

```text
INITIALIZING MEDICAL NANOBOT...

Loading vascular systems
██████████████░░

Preparing biological environment
█████████░░░░░░

Synchronizing patient data
███████████████
```

Animate the nano-robot during loading.

Use real loading stages where possible.

Do not fake a progress bar that sits at 73% for ten seconds.

---

# 39. ASSET LOADING

Use progressive loading.

Initial load:

* main menu assets
* nano-robot
* tiny amount of environment

Upon starting Heart Mission:

* load heart/vessel assets
* load nearby effects
* preload next required assets

Do not download every mission's assets on first page load.

---

# 40. 3D ASSET BUDGETS

Treat mobile as a first-class target.

Approximate targets:

### Mobile

Characters / important objects:

3k–5k triangles where possible.

Props:

500–2k where practical.

Environment pieces:

1k–5k depending on importance.

Important hero anatomy can exceed these numbers if compensated with LOD, culling and careful scene design.

Do not optimize purely by polygon count.

Also inspect:

* texture sizes
* material count
* draw calls
* shader complexity
* transparency
* overdraw

---

# 41. TEXTURE STRATEGY

Use a small number of materials.

Prefer:

```text
Base Color
Normal
Roughness
Metallic
Emission
```

only where needed.

Avoid dozens of unique 4K textures.

Create mobile variants.

Example:

```text
heart_high.glb
heart_medium.glb
heart_mobile.glb
```

where practical.

---

# 42. VISUAL HIERARCHY

Every screen needs:

1. A clear focal point.
2. A clear primary action.
3. Strong hierarchy.
4. Breathing room.
5. Motion with purpose.

Do not put every UI component into a border.

Do not use cards simply because a frontend framework makes cards easy.

---

# 43. TYPOGRAPHY

Choose a distinctive modern type system.

Use:

* expressive display face for title
* extremely readable UI face
* consistent numeric style

Do not use five fonts.

Typography should make the app feel like a premium game interface.

---

# 44. MICRO-INTERACTIONS

Include polished interaction details:

* buttons respond immediately
* scan target pulses
* discovered anatomy gets a subtle confirmation
* objectives animate when updated
* transitions have momentum
* menus do not simply appear/disappear
* mission completion has a payoff

Every animation must have a reason.

---

# 45. NO “AI SLOP” RULE

Reject the following:

* generic gradient blobs
* huge meaningless hero text
* excessive glass cards
* random floating shapes
* fake testimonials
* fake metrics
* irrelevant dashboards
* generic stock medical illustrations
* excessive rounded rectangles
* inconsistent icon styles
* placeholder text
* lorem ipsum
* “coming soon” everywhere
* buttons that do nothing
* decorative complexity with no gameplay purpose

If something looks like it came from a generic AI landing-page generator, redesign it.

---

# 46. REAL GAMEPLAY OVER MOCK UI

A judge must be able to:

1. Enter the game.
2. Move the nano-robot.
3. Look around.
4. Encounter biology.
5. Scan anatomy.
6. Get an educational explanation.
7. Complete at least one meaningful objective.
8. See the environment react.
9. Finish the mission.

No fake demo interactions.

No UI pretending something happened when no underlying state changed.

---

# 47. THE HEART LEVEL IS THE VERTICAL SLICE

Prioritize quality in this order:

```text
1. Heart Attack Response
2. Main Menu
3. Full Body Explorer
4. Viral Invasion
5. Brain Mission
```

A spectacular Heart mission is more valuable than three unfinished levels.

The minimum demo must be exceptional.

---

# 48. JUDGE DEMO FLOW

Design a “golden path” that takes approximately 2–4 minutes.

Example:

```text
MAIN MENU
↓
START MISSION
↓
CINEMATIC DEPLOYMENT
↓
ENTER BLOOD VESSEL
↓
MOVE THROUGH BLOODSTREAM
↓
SCAN CORONARY ARTERY
↓
QWEN EXPLANATION
↓
LOCATE BLOCKAGE
↓
INTERACT WITH CLOT
↓
CLEAR BLOCKAGE
↓
BLOOD FLOW RECOVERS
↓
MISSION COMPLETE
↓
FULL-BODY SYSTEM VISUALIZATION
```

This must work reliably from a fresh load.

---

# 49. “WOW” MOMENT

Engineer one undeniable visual moment.

Recommended:

After the player clears the blockage:

The clot breaks apart.

Blood flow accelerates.

Hundreds of red blood cells stream through the repaired vessel.

The camera pulls backward.

The vessel opens into a dramatic view of the heart.

A pulse travels through the heart.

The patient status indicator rises.

Then:

```text
FLOW RESTORED
```

followed by:

```text
ANATOMY DISCOVERED

CORONARY ARTERY
```

This is the screenshot/video moment.

---

# 50. FULL BODY PRESENTATION

After completing the heart mission, transition elegantly to:

```text
PATIENT SYSTEM MAP
```

A translucent body rotates slowly.

The cardiovascular system lights up.

Then other systems become visible.

The player can rotate/zoom the body.

This should visually prove that the game isn't just a single organ demo.

---

# 51. RESPONSIVE GAME UI

Desktop HUD:

More breathing room.

Mobile HUD:

Compact.

Use large touch targets.

Avoid placing buttons where accidental thumb movement can occur.

The game viewport must respect:

* browser address bars
* safe areas
* notches
* landscape orientation
* portrait orientation

Support:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)
```

where appropriate.

---

# 52. PREVENT MOBILE SCROLLING

During gameplay:

* prevent unwanted page scrolling
* handle touch events deliberately
* preserve gestures for camera movement
* don't interfere with browser gestures unnecessarily
* handle orientation changes gracefully

Gameplay should feel like an app, even though it runs in a browser.

---

# 53. PERFORMANCE TELEMETRY

Add a development-only performance monitor.

Track:

* FPS
* frame time
* draw calls
* triangles
* texture memory where available
* active objects
* load time

Do not expose this in the production judge presentation unless useful.

---

# 54. ERROR HANDLING

3D assets fail.

APIs fail.

WebGL fails.

Mobile devices differ.

Handle these gracefully.

Examples:

If WebGL capability is insufficient:

```text
This experience requires WebGL.
Please try a modern browser or desktop device.
```

If Qwen fails:

Show a static educational explanation.

If an optional asset fails:

Use a fallback.

Never render an empty black page.

---

# 55. TESTING

Test:

### Functional

* menu works
* mission loads
* player moves
* camera works
* scanning works
* objective updates
* collision works
* mission completes
* Qwen response works
* fallback works
* settings work
* restart works

### Mobile

* touch joystick works
* swipe look works
* buttons work
* no page scrolling
* orientation works
* small screens work

### Visual

* no clipping
* no missing textures
* no broken models
* no z-fighting
* no inaccessible buttons
* no unreadable text
* no UI overlap

---

# 56. MANDATORY FIVE VLM CRITICISM ROUNDS

This is a HARD REQUIREMENT.

Do not claim the design is finished until you have completed **five separate visual critique rounds**.

For each round:

### Step 1

Run the app.

### Step 2

Capture screenshots at:

```text
desktop main menu
desktop gameplay
desktop educational overlay
mobile main menu
mobile gameplay
mobile educational overlay
```

Also capture a short gameplay recording or representative frames if tooling supports it.

### Step 3

Pass the screenshots to a vision-capable model/VLM.

Use an available high-quality VLM such as Qwen-VL or another capable vision model available in the environment.

### Step 4

Ask the VLM to aggressively criticize:

* visual hierarchy
* composition
* typography
* UI density
* button placement
* gameplay readability
* 3D composition
* lighting
* material quality
* asset quality
* mobile usability
* animation quality
* visual consistency
* performance symptoms
* generic/AI-looking design
* whether it actually feels like a game
* whether a judge would immediately understand what to do
* whether the experience looks impressive in screenshots

Do NOT prompt the VLM merely with:

> “Does this look good?”

Instead ask it to find problems.

---

## VLM ROUND 1 — STRUCTURE

Critique:

* layout
* navigation
* first impression
* hierarchy
* usability
* information architecture

Fix all high-impact problems.

---

## VLM ROUND 2 — VISUAL QUALITY

Critique:

* typography
* color
* spacing
* composition
* 3D art
* lighting
* materials
* asset consistency

Fix the major problems.

---

## VLM ROUND 3 — GAME FEEL

Critique:

* whether it feels like a game
* interaction clarity
* gameplay feedback
* rewards
* motion
* camera
* HUD
* objective clarity

Fix all major issues.

---

## VLM ROUND 4 — MOBILE

Critique only mobile:

* touch targets
* joystick
* camera control
* safe areas
* text size
* HUD collision
* viewport
* performance
* loading

Fix all serious issues.

---

## VLM ROUND 5 — JUDGE / RED-TEAM

Tell the VLM:

> “You are a brutally critical hackathon judge. Assume competing projects are visually impressive. Identify every reason this project could be forgotten, misunderstood, or perceived as a generic AI-generated 3D website. Prioritize issues that would affect live demo impact.”

Fix every high-value problem that can reasonably be fixed within the project scope.

Do not simply collect criticism.

**Actually modify the implementation after every round.**

---

# 57. VLM CRITIQUE LOG

Create:

```text
/docs/VLM-CRITIQUE.md
```

For every round record:

```text
ROUND
DATE
SCREENSHOTS REVIEWED
CRITIQUE
PRIORITY
ACTION TAKEN
RESULT
```

Example:

```text
ROUND 3

Problem:
HUD dominates mobile gameplay.

Severity:
HIGH

Fix:
Reduced objective panel footprint by 35%.
Moved interaction prompt closer to center-bottom.
Adjusted joystick size.

Result:
Improved gameplay visibility and thumb reach.
```

This is evidence that visual QA actually happened.

---

# 58. FINAL VISUAL AUDIT

After all five VLM rounds:

Ask another visual-capable model to compare:

```text
FIRST VERSION
vs
FINAL VERSION
```

Look for:

* improvements
* regressions
* inconsistencies
* remaining obvious flaws

Do one final human-style visual pass yourself.

---

# 59. ASSET QUALITY BAR

Do not settle for:

* ugly anatomy models
* obvious low-poly placeholders
* broken textures
* mismatched art styles
* giant meshes
* floating parts
* anatomically nonsensical intersections

When a better free asset exists, use the better one.

Search deeply.

Spend more time finding one exceptional heart model than five mediocre models.

---

# 60. MEDICAL VISUALIZATION BALANCE

The game should be visually dramatic while retaining recognizable anatomy.

Do not sacrifice all biological accuracy for sci-fi aesthetics.

Stylize the presentation, not the fundamental educational concepts.

When accuracy is uncertain, research from credible sources rather than inventing anatomy.

Keep educational descriptions understandable for a general audience.

---

# 61. DEVELOPMENT PRIORITY

When time is limited, use:

```text
MUST HAVE
    ↓
Heart mission
Nano-robot POV
Touch controls
Beautiful 3D environment
Scanning
Qwen explanation
Objective system
Mission completion
Mobile support
Asset credits

SHOULD HAVE
    ↓
Viral mission
Brain mission
Full-body explorer
Audio polish
Anatomy journal

NICE TO HAVE
    ↓
Gyroscope
Advanced shaders
More missions
Extra collectibles
Advanced analytics
```

Never sacrifice the working heart mission to add another half-finished feature.

---

# 62. DO NOT OVERENGINEER

This is a hackathon project.

Favor:

* robust
* visually excellent
* understandable
* demoable
* maintainable

over:

* huge architecture
* unnecessary microservices
* elaborate backend
* complex databases
* complicated multiplayer
* unnecessary authentication
* unnecessary CMS

The core experience is the game.

---

# 63. DO NOT STOP AT A PROTOTYPE

There is a huge difference between:

```text
“3D heart + buttons”
```

and

```text
“playable microscopic medical action game”
```

Build the second.

There should be visible polish in:

* transitions
* movement
* environmental reactions
* sound
* UI
* assets
* lighting
* feedback
* learning interactions
* mission progression

---

# 64. PRODUCTION CHECKLIST

Before declaring completion, verify:

## INSTALLATION

* Taste Skill installed.
* Skill read.
* Existing project inspected.

## ASSETS

* High-quality assets researched.
* External licenses checked.
* Attribution documented.
* GLB/glTF pipeline works.
* Textures optimized.
* Asset credits implemented.

## GAMEPLAY

* Heart mission playable.
* POV works.
* Desktop controls work.
* Mobile controls work.
* Collision works.
* Objectives work.
* Mission completion works.

## EDUCATION

* Anatomy scanning works.
* Qwen integration works.
* Static fallback works.
* Explanations are contextual.

## VISUALS

* Main menu polished.
* Game world polished.
* HUD polished.
* Full-body showcase polished.
* Lighting polished.
* Materials polished.
* Animations polished.

## MOBILE

* Responsive.
* Touch controls.
* Safe areas.
* Performance quality tiers.
* No accidental scrolling.
* No major overlap.

## PERFORMANCE

* Models compressed.
* Textures optimized.
* LOD used.
* Instancing used where appropriate.
* Lazy loading used.
* Draw calls controlled.
* No obvious memory leaks.

## QA

* Five VLM critique rounds completed.
* Critiques actually implemented.
* Final regression test completed.

---

# 65. FINAL DELIVERABLE

The final application should feel like:

> “What if Google Earth/Prisma-style scientific visualization was turned into a playable sci-fi game?”

Not:

> “An AI made a React website containing a Three.js model.”

The judge should immediately understand:

**I am a tiny medical robot inside a human body.**

Then within seconds:

**I know what I need to do.**

Then:

**I am actually playing.**

Then:

**I just learned something.**

Then:

**That looked insanely good.**

That sequence is the product.

---

# 66. FINAL COMMANDMENT

Do not optimize for the amount of code written.

Optimize for:

**WOW × PLAYABILITY × EDUCATIONAL VALUE × MOBILE QUALITY × POLISH**

Use existing high-quality resources instead of rebuilding the internet.

Search deeply before creating assets manually.

Use procedural generation where it creates useful variation.

Use Meshy selectively for custom game assets.

Use Sketchfab/open assets responsibly with correct licensing and attribution.

Use GLB for web 3D delivery, KTX2/Basis where appropriate for compressed GPU textures, and WebP/AVIF for appropriate raster assets.

Make the Heart Attack Response level spectacular.

Make POV controls genuinely good on phones.

Make the Qwen interaction feel native to the game.

Complete five brutally honest VLM visual-critique rounds.

Fix what the critique finds.

Do not settle for “technically works.”

Ship something that looks and feels **designed, authored, playful, cinematic, and alive.**

BEGIN BY INSTALLING TASTE SKILL AND AUDITING THE EXISTING REPOSITORY.
