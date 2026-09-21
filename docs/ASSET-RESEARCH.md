# ANATOMY ARCADE — 3D ASSET RESEARCH (P4)

_Research date: 2026-09-21 • Agent: P4-research subagent • Data: Sketchfab public API (`api.sketchfab.com/v3`), verified per-model detail records._

## Selection criteria

- **License:** CC0 preferred, then CC-BY 4.0 (attribution required in `docs/ASSETS.md` + in-game credits). CC-BY-SA acceptable with copyleft note. **No NC/ND, no "Free Standard" Sketchfab-license downloads** (see restricted section).
- **Poly budget:** hero organ <150k tris; blood cells <5k tris (instanced ×100s); environment/system models 30–120k tris before Draco/meshopt.
- **Format:** must be GLB-convertible. All Sketchfab downloads below ship glTF/GLB via the authenticated download endpoint (`GET /v3/models/{uid}/download` → JSON with `glb.url`).
- **Quality bar:** clean topology, PBR or flat-shadeable materials, game-scale, no rig required (beat/breath cycles re-target or re-create in Three.js).
- **Method:** 30+ Sketchfab searches (CC0-filtered + unfiltered with per-model license bucketing), 63 detail-API verifications; plus reachability checks of Quaternius, Kenney, Poly Haven, CC0Models, poly.pizza and GitHub topic searches.

**Sketchfab API note:** the public search endpoint only accepts `license=cc0` as a license filter — `license=cc-by` / `cc-by-nc` return HTTP 400 ("not one of the available choices"). CC-BY and NC models were therefore found with unfiltered searches and bucketed locally by the `license.label` field.

## Legend

- `Verts / Tris` = Sketchfab `vertexCount` / `faceCount` (faces ≈ triangles). `+anim` = model ships with baked animation(s).
- Links point to the Sketchfab viewer page. UIDs are what the authenticated download pipeline needs.

## 1. Human heart (hero asset)

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| Realistic Human Heart | neshallads | CC-BY 4.0 | 11,281 / 22,562 | [`3f8072336ce9…`](https://sketchfab.com/3d-models/3f8072336ce94d18b3d0d055a1ece089) | TOP PICK — clean topology, PBR textures, ♥1649; 22.6k tris well under 150k hero budget |
| Human heart, realistic anatomical model | TinkerLane Studio | CC-BY 4.0 | 10,173 / 20,370 | [`adb2c91ec819…`](https://sketchfab.com/3d-models/adb2c91ec8194b24b7ba431aa573a906) | similar quality to top pick; good fallback if topology review fails |
| Beating Heart | JeremyW | CC-BY 4.0 | 2,018 / 2,016 +anim | [`5948873c2c1e…`](https://sketchfab.com/3d-models/5948873c2c1e4c6285e3f3d18a9b991c) | 2k-tri animated heartbeat — ideal gameplay/LOD asset, beat cycle baked |
| Beating-heart | jalmer | CC-BY 4.0 | 17,176 / 34,401 +anim | [`d9845afb1ee6…`](https://sketchfab.com/3d-models/d9845afb1ee64ad094adc96320c67d98) | animated, mid-poly; secondary LOD |
| Human Heart | sahilseth | CC-BY 4.0 | 7,580 / 14,979 | [`30f93d9dae49…`](https://sketchfab.com/3d-models/30f93d9dae4948fe85cd4d60ac40c23f) | 7.6k verts, compact |
| Heart Anatomy | Dr. Nathalie Morales Lachaume | CC-BY 4.0 | 323,405 / 646,858 | [`b26398139b2c…`](https://sketchfab.com/3d-models/b26398139b2c4875996b40017e28c31d) | coronary-detail clinical heart, over budget — decimate or borrow geometry only |
| Human heart | thunk3d.scanner | CC-BY 4.0 | 560,319 / 1,120,776 | [`94505ec969cf…`](https://sketchfab.com/3d-models/94505ec969cf468684d4393a3de99478) | 1.1M tris raw 3D scan — reference only, needs full retopo |

## 2. Red blood cell (single, for instancing)

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| Red Blood Cells (Erythrocytes) | _Bonehead14 | CC-BY 4.0 | 1,830 / 3,648 | [`657f7b34ab2e…`](https://sketchfab.com/3d-models/657f7b34ab2e43878c4f366e3e940ebd) | TOP PICK — built for educational VR; biconcave disc + normal map; single-cell budget <5k ✓ |
| RBC Morphology - Red Blood Cell | IMU University | CC-BY 4.0 | 1,058 / 2,112 | [`1a1bbd5e3cd7…`](https://sketchfab.com/3d-models/1a1bbd5e3cd746888232fefa46b3f7d1) | lightest single RBC (2.1k tris), morphology-accurate; alt pick |
| DL Beta Challenge C3 Red Blood Cell | Lily | CC-BY 4.0 | 1,730 / 3,456 | [`714fd0e53baf…`](https://sketchfab.com/3d-models/714fd0e53baf4976b2d1a2a8ee259b07) | single cell, game-jam origin, clean |
| Red Blood Cells | AK | CC-BY 4.0 | 32,030 / 63,986 | [`c3f0295dca62…`](https://sketchfab.com/3d-models/c3f0295dca6244e286a0b21999c2d0ce) | multi-cell scene; useful as arrangement reference for instancing layout |

## 3. White blood cell

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| White Blood Cells | Celena Ransil | CC-BY 4.0 | 1,156 / 1,792 | [`557451d5e6ca…`](https://sketchfab.com/3d-models/557451d5e6ca496d8c691e14b42edd93) | TOP PICK — two texture states (resting → activated) = free gameplay feedback; 1.8k tris ✓ |
| Neutrophil-Final | vickenstein | CC-BY 4.0 | 12,478 / 23,298 | [`829962af9e00…`](https://sketchfab.com/3d-models/829962af9e004626b7e9dbbb353013ae) | neutrophil w/ lobed nucleus, mid-poly single cell |
| Lympocyte | Vikrama Raghuraman | CC-BY 4.0 | 46,086 / 92,160 | [`f84f96cc9a98…`](https://sketchfab.com/3d-models/f84f96cc9a9847a18e6b469eb2a81fb8) | lymphocyte, heavier — decimate to <5k |
| Leukocytes | gelmi.com.br | CC-BY 4.0 | 68,430 / 136,864 | [`60234a65e033…`](https://sketchfab.com/3d-models/60234a65e0334b6ebc3507a68d5a69da) | multi-WBC scene, reference |
| Components of blood | arloopa | CC-BY 4.0 | 39,869 / 78,352 | [`3ae309d331a0…`](https://sketchfab.com/3d-models/3ae309d331a049918b5788718ee58f35) | BUNDLE: RBC+WBC+platelet+plasma in one model — useful whole-blood diorama |

## 4. Platelet

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| Platelet | andrewfrueh | CC-BY 4.0 | 467 / 926 | [`8780792dca1b…`](https://sketchfab.com/3d-models/8780792dca1b4a5fa225d9f9d679f48c) | TOP PICK — 926 tris, authored for education (andrewfrueh), perfect instancing unit |
| blood platelet / thrombocyte | i.isabelgordon | CC-BY 4.0 | 6,668 / 13,328 | [`08fed7ab5951…`](https://sketchfab.com/3d-models/08fed7ab59514804b07804e40a57ef33) | irregular activated form, 13.3k tris — hero variant |
| RMIT Platelet | keith.hibbert99 | CC-BY 4.0 | 8,622 / 17,032 | [`439d56eab71d…`](https://sketchfab.com/3d-models/439d56eab71d4188bcabcfe4376f23a7) | university course asset, mid-poly |

## 5. Cholesterol plaque / arterial blockage / thrombus

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| Thrombus Left Atrial Appendage | tl0615 | CC-BY 4.0 | 30,612 / 61,294 | [`d552d0f38eb7…`](https://sketchfab.com/3d-models/d552d0f38eb74e46837c718fede257f0) | TOP PICK — genuine CC-BY thrombus mass; use as boss-room set dressing, NOT for deforming gameplay plaque |
| Heart Mitral Stenosis | Edwin3dArtist | CC-BY 4.0 | 13,034 / 26,123 +anim | [`76b535535e05…`](https://sketchfab.com/3d-models/76b535535e054dc4a1b9ef64794428f2) | animated stenosis heart (valve narrowing) — mission-brief cutaway material |
| Abdominal Aortic Dissection Involving the SMA | tl0615 | CC-BY 4.0 | 15,466 / 31,094 | [`128b32c89e54…`](https://sketchfab.com/3d-models/128b32c89e5449278e0389c9bbf02efb) | aortic dissection pathology, mid-poly |
| Left Atrial Occlusion Clip | tl0615 | CC-BY 4.0 | 63,834 / 127,982 | [`5e77ed116d08…`](https://sketchfab.com/3d-models/5e77ed116d084bf0b7b6561563913aab) | occlusion clip hardware — could dress the post-intervention scene |
| Arteries | geek4life11 | CC-BY 4.0 | 523 / 1,012 | [`827a5bc8317d…`](https://sketchfab.com/3d-models/827a5bc8317d4b0f81240a0361c9d68a) | ultra-lowpoly artery tube (1k tris) — sanity-check scale for procedural vessels |

## 6. Virus particle (stylized OK)

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| Lowpoly Coronavirus (SARS-CoV-2) | tales | CC-BY 4.0 | 18,845 / 32,382 | [`81acdfb6457b…`](https://sketchfab.com/3d-models/81acdfb6457b471c9aa355f1925fe2b9) | TOP PICK — labeled spike proteins, stylized-clean, ♥147, 32k tris in budget |
| Simple Virus Concepts | Mad_Lobster_Workshop | CC-BY 4.0 | 42,220 / 84,420 | [`faf568025a33…`](https://sketchfab.com/3d-models/faf568025a3345c9b68c16e6a0753cbc) | stylized virus concept set (multiple variants) — good enemy roster source |
| Coronavirus | Teliri | CC-BY 4.0 | 36,621 / 70,644 | [`b28f63adc5f0…`](https://sketchfab.com/3d-models/b28f63adc5f04a2aab27e1d7293eba0b) | realistic corona, mid-poly |
| Corona Virus COVID-19 | Fantom Matter | CC-BY 4.0 | 92,959 / 185,940 | [`9b7910666612…`](https://sketchfab.com/3d-models/9b791066661241bfbf37327fa9cbd473) | studio-quality realistic corona, heavier |
| Virus 5 C Animated | Smack | CC-BY 4.0 | 119,042 / 238,080 +anim | [`e9e3441d19ac…`](https://sketchfab.com/3d-models/e9e3441d19ac47a79ec6cc97e6cacf3e) | animated virus (238k tris) — decimate or reference the motion only |
| Johann Wolfgang von Goethe COVID-19 | noe-3d.at | CC0 | 237,831 / 473,404 | [`99d6b24e3ccb…`](https://sketchfab.com/3d-models/99d6b24e3ccb40c8a86111f4f2acf855) | only CC0 virus found — heavy but no attribution needed |

## 7. Neuron (dendrites + axon)

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| High Poly Stylizezd Neuron - Free Download | Laurie Annis | CC-BY 4.0 | 13,501 / 26,998 | [`0dfd0cd08a1d…`](https://sketchfab.com/3d-models/0dfd0cd08a1d484d9a8ab02a4223b5b5) | TOP PICK — stylized hand-sculpted, 27k tris, matches art direction; instance 50–200× |
| Neuron | Versal | CC-BY 4.0 | 33,492 / 66,928 | [`d40557a1e415…`](https://sketchfab.com/3d-models/d40557a1e4154267b78117433bc51296) | realistic neuron, clean silhouette |
| Whole Alembic Neuron | VJ Anomolee | CC-BY 4.0 | 11,726 / 23,424 +anim | [`f8a572d25a89…`](https://sketchfab.com/3d-models/f8a572d25a894de688dee692d43d878f) | animated (alembic-baked) neuron — 23k tris |
| Neuron | Bapichu | CC-BY 4.0 | 70,675 / 141,350 | [`22fa9afe1472…`](https://sketchfab.com/3d-models/22fa9afe14724d9bbcffcc1160d6c447) | dense arbor, heavier |
| Hippocampus CA1 Pyramidal Cell | JustasB | CC-BY 4.0 | 91,660 / 186,912 | [`f4199d144003…`](https://sketchfab.com/3d-models/f4199d144003415690ad19eea6210e71) | science-grade CA1 pyramidal cell (NeuroMorpho-style) — education popup hero shot |

## 8. Translucent human body (full-body explorer)

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| Male Body | Alexander Antipov | CC-BY 4.0 | 10,384 / 20,764 | [`15a422001834…`](https://sketchfab.com/3d-models/15a422001834483c9750ce6117d59cc1) | TOP PICK (shell) — 10k-vert clean male basemesh, perfect for fresnel/x-ray translucency shader |
| Human Organs | Devin Eggleston | CC-BY 4.0 | 22,130 / 44,429 | [`74e22fd93f62…`](https://sketchfab.com/3d-models/74e22fd93f62468daf7a8955aa69cd76) | TOP PICK (contents) — organ set (heart/lungs/etc.) for per-system visibility toggles |
| Human Organs | mkhasant | CC-BY 4.0 | 7,071 / 14,122 | [`035316622877…`](https://sketchfab.com/3d-models/035316622877438cb62de673b8f19217) | lowpoly organ set alt |
| Circulatory System | brianj.seely | CC-BY 4.0 | 46,299 / 91,990 +anim | [`a46a7227a957…`](https://sketchfab.com/3d-models/a46a7227a957442da30486b97547eaf5) | animated circulatory system — blood-flow overview layer |
| Circulatory System | brianj.seely | CC-BY 4.0 | 43,070 / 85,536 | [`3584d5b2b975…`](https://sketchfab.com/3d-models/3584d5b2b97545cf965007c195899b7b) | static twin of the above (no anim, slightly lighter) |
| Respiratory System | brianj.seely | CC-BY 4.0 | 24,063 / 44,155 +anim | [`34ef811ecdd1…`](https://sketchfab.com/3d-models/34ef811ecdd14eb99433daf26fcb8061) | respiratory system layer (also listed under Lung) |
| digestive system | 7D production | CC-BY 4.0 | 9,531 / 19,024 +anim | [`f78ce703805f…`](https://sketchfab.com/3d-models/f78ce703805f49d3b732e37be5b93188) | digestive system layer, animated |
| Anatomical figure – écorché | Virtual Museums of Małopolska | CC0 | 150,266 / 299,954 | [`675678f1e3b3…`](https://sketchfab.com/3d-models/675678f1e3b3425dba685f5421f57cd4) | CC0 écorché (muscle figure) — free shell alternative, needs decimation |
| Human Anatomy: | mohamedhussien | CC-BY 4.0 | 499,511 / 999,366 | [`faf0f3eaec55…`](https://sketchfab.com/3d-models/faf0f3eaec554bcf854be2038993024f) | multi-system anatomy, ~1M tris — decimate or source-reference |

## 9. Lung / alveoli

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| Realistic Human Lungs | neshallads | CC-BY 4.0 | 31,997 / 63,974 | [`ce09f4099a68…`](https://sketchfab.com/3d-models/ce09f4099a68467880f46e61eb9a3531) | TOP PICK — same author/style as heart pick (neshallads) = visual consistency; 64k tris |
| Lungs | prasanth.k | CC-BY 4.0 | 18,829 / 37,282 | [`2706caba9679…`](https://sketchfab.com/3d-models/2706caba9679481bb809f141f87d7c14) | mid-poly lungs alt |
| Respiratory System | brianj.seely | CC-BY 4.0 | 24,063 / 44,155 +anim | [`34ef811ecdd1…`](https://sketchfab.com/3d-models/34ef811ecdd14eb99433daf26fcb8061) | full respiratory tract (nose→bronchi), animated breathing |
| Alveolo S374 | polisur | CC-BY 4.0 | 1,027 / 2,050 | [`7c7989ada154…`](https://sketchfab.com/3d-models/7c7989ada1544768877718ceeeff9dc5) | single lowpoly alveolus (2k tris) — instancing unit for alveolar sac |
| Alveoli Model | odesypt | CC-BY 4.0 | 308,702 / 617,942 | [`bb1526fdcd20…`](https://sketchfab.com/3d-models/bb1526fdcd204973ba5128b948eefc26) | full alveoli cluster, 618k tris — decimate or rebuild procedurally |

## 10. Brain / neural network

| Asset | Creator | License | Verts/Tris | UID/URL | Notes |
|---|---|---|---|---|---|
| Human brain, Cerebrum & Brainstem | FrankJohansson | CC-BY 4.0 | 22,650 / 45,296 | [`0aa0e33c5c85…`](https://sketchfab.com/3d-models/0aa0e33c5c854d1bab7bac9e1c7acaec) | TOP PICK — cerebrum+brainstem, PBR, annotated version exists; 45k tris |
| Brain Areas | Versal | CC-BY 4.0 | 47,383 / 94,716 | [`d64608a3978b…`](https://sketchfab.com/3d-models/d64608a3978b47d8a39c5a15795ca8c4) | color-coded functional regions — ideal for scan/education UI overlay |
| Human Brain | 3DRT STUDIOS | CC-BY 4.0 | 2,427 / 4,850 | [`7a27c17fd6c0…`](https://sketchfab.com/3d-models/7a27c17fd6c0488bb31ab093236a47fb) | 2.4k-vert lowpoly brain — LOD / far-shot |
| Brain | maheshshinde777 | CC-BY 4.0 | 4,766 / 9,528 | [`735ca31a3b22…`](https://sketchfab.com/3d-models/735ca31a3b22433281e6fa9606792faa) | lowpoly alt |
| Model of a human brain | Science Museum Group | CC0 | 372,341 / 743,676 | [`fc7ae7b989f9…`](https://sketchfab.com/3d-models/fc7ae7b989f94c80a50152e71f44e47c) | CC0 museum scan; public domain but 744k tris → decimate before use |

## TOP PICKS (one per category)

| # | Category | Pick | Creator | License | Tris | Rationale |
|---|---|---|---|---|---|---|
| 1 | Heart (hero) | Realistic Human Heart | neshallads | CC-BY 4.0 | 22,562 | Best-quality anatomical heart inside the hero budget; proven asset (♥1649), PBR-textured, clean silhouette for shader work. |
| 2 | Red blood cell | Red Blood Cells (Erythrocytes) | _Bonehead14 | CC-BY 4.0 | 3,648 | Purpose-built low-poly biconcave RBC for educational VR; under the 5k instancing budget. |
| 3 | White blood cell | White Blood Cells | Celena Ransil | CC-BY 4.0 | 1,792 | Game-ready with resting/activated texture states — instant infection-response gameplay feedback. |
| 4 | Platelet | Platelet | andrewfrueh | CC-BY 4.0 | 926 | Single low-poly platelet authored for education; cheapest instancing unit in the set. |
| 5 | Plaque/thrombus | Thrombus Left Atrial Appendage | tl0615 | CC-BY 4.0 | 61,294 | Only genuinely-free realistic thrombus mass found; use as set-dressing, build the deforming gameplay plaque procedurally. |
| 6 | Virus | Lowpoly Coronavirus (SARS-CoV-2) | tales | CC-BY 4.0 | 32,382 | Stylized-clean with labeled proteins; matches 'microscopic sci-fi' direction; in budget. |
| 7 | Neuron | High Poly Stylized Neuron | Laurie Annis | CC-BY 4.0 | 26,998 | Hand-sculpted stylized neuron that fits the art direction; instance it across the brain mission. |
| 8 | Translucent body | Male Body (shell) + Human Organs (contents) | Alexander Antipov / Devin Eggleston | CC-BY 4.0 / CC-BY 4.0 | 20,764 + 44,429 | Low-poly shell takes an x-ray/fresnel shader well; organ set drops inside for per-system visibility toggles. |
| 9 | Lung / alveoli | Realistic Human Lungs | neshallads | CC-BY 4.0 | 63,974 | Same author/style as the heart pick = hero-asset consistency; pair with instanced Alveolo S374. |
| 10 | Brain | Human brain, Cerebrum & Brainstem | FrankJohansson | CC-BY 4.0 | 45,296 | Clean annotated cerebrum+brainstem; Brain Areas (Versal) supplies color-coded regions for the scan overlay. |

All ten picks are CC-BY 4.0 → every one needs an attribution line in `docs/ASSETS.md` and the in-game credits panel. No CC0 equivalent exists for any organ-level asset; CC0 exists only for a heavy brain scan (fc7ae7b9) and a heavy COVID sculpture (99d6b24e).

## NC / RESTRICTED (do NOT use without written permission)

Tempting-but-restricted models that dominate the top of Sketchfab's anatomy search results. **Excluded from all picks.**

### CC BY-NC / NC-SA / NC-ND (no commercial use, some no-derivatives)

| Asset | Creator | License | Verts/Tris | UID/URL |
|---|---|---|---|---|
| Cardiac Anatomy: External view of human heart | HannahNewey | CC BY-NC-SA | 1,507,729 / 3,003,486 | [`a3f0ea20…`](https://sketchfab.com/3d-models/a3f0ea2030214a6bbaa97e7357eebd58) |
| Cardiac Anatomy: Coronary arteries of the heart | HannahNewey | CC BY-NC-SA | 1,379,850 / 2,747,730 | [`00b5f4ec…`](https://sketchfab.com/3d-models/00b5f4ec0b984325b453f8df07cd0cb5) |
| Cardiac Anatomy: external view | E-learning UMCG | CC BY-NC-SA | 124,449 / 248,695 | [`e8e8c668…`](https://sketchfab.com/3d-models/e8e8c6685e82474d8393693fd0646dc7) |
| Human anatomy: heart in thorax | E-learning UMCG | CC BY-NC-SA | 75,428 / 155,534 | [`22ebd4ab…`](https://sketchfab.com/3d-models/22ebd4abce9440639563807e72e5f8d1) |
| Anatomy of the airways | E-learning UMCG | CC BY-NC-SA | 119,884 / 237,131 | [`ad7d7e16…`](https://sketchfab.com/3d-models/ad7d7e16b98f421db0cda79f265fcc8d) |
| Anatomy of the airways (opaque lungs) | E-learning UMCG | CC BY-NC-SA | 76,987 / 152,533 | [`1cd55d26…`](https://sketchfab.com/3d-models/1cd55d26c1254ab7a5d0845fb9a207fe) |
| Healthy heart and lungs | E-learning UMCG | CC BY-NC-SA | 184,268 / 371,915 | [`5c62cd4d…`](https://sketchfab.com/3d-models/5c62cd4d4ba04243be1062d2263d3ef0) |
| Brain Model (Right) - General anatomy | Dr. Alex Cheroske | CC BY-NC | 524,997 / 1,050,014 | [`dfc9e4a0…`](https://sketchfab.com/3d-models/dfc9e4a0796b40c7893dd0dad8b25543) |
| Normal Neonatal Heart | (see model page) | CC BY-NC-SA | 88,605 / — | `9c0dcc64…` (search cache only) |
| Female Body | (see model page) | CC BY-NC | 204,640 / — | `918d4ea4…` (search cache only) |
| Generalized Human Body | (see model page) | CC BY-NC | 17,571 / — | `ff827a4f…` (search cache only) |
| Fresh Human Heart Organ Donation | (see model page) | CC BY-NC | 249,986 / 500,000 | `5a155b24…` (search cache only) |
| Digestive Organs | (see model page) | CC BY-NC | 19,834 / 40,000 | `cbee60d0…` (search cache only) |
| Adult E. granulosus tapeworm & attachment | (see model page) | CC BY-NC | 221,522 / 446,101 | `3fce1ea0…` (search cache only) |

### "Free Standard" (Sketchfab standard license — viewer-only terms, not an open license; no redistribution in our game)

| Asset | Creator | Verts/Tris | UID |
|---|---|---|---|
| Lungs Anatomy Model | saurabh.buradkar7 | 3,960 / 3,988 | `851dff4d…` |
| Struktur Paru-Paru Manusia 3D Model | Fadilah Putri P. | 55,352 / 110,316 | `648f6a92…` |
| Human Nervous System - Full Body 3D Model | (see model page) | 213,312 / 428,000 | `5d10d801…` |
| Human ecorche full body anatomy 3D model | (see model page) | 143,616 / 287,328 | `6a2b0faa…` |
| Human Kidneys - Detailed Organ Anatomy | (see model page) | 356,290 / 712,697 | `8fc7b534…` |

**Rule of thumb for future agents:** if a search result says *CC Attribution-NonCommercial\** or anything other than CC0/CC Attribution/CC Attribution-ShareAlike, it belongs in this section, not in a build.

## PROCEDURAL RECOMMENDED (build in Three.js, don't download)

Gameplay-critical geometry that must deform/react at runtime — better authored as code + shaders than as static GLBs:

1. **Blood vessel tubes** — `THREE.TubeGeometry` along `CatmullRomCurve3` splines with a custom endothelium shader (rim-lit crimson → cyan O2 gradient). The heart mission needs vessels that visually *restore* flow, i.e. live shader state, not baked mesh.
2. **Blood flow particles** — GPU-instanced RBCs/platelets advected along the same splines + curl-noise jitter; the downloaded RBC/platelet picks become the instanced geometry buffers.
3. **Plaque buildup** — procedural displacement/voronoi growth grafted onto the vessel tube (vertex-shader or runtime BufferGeometry merge) so it can shrink in real time as the player clears it; the CC-BY thrombus (d552d0f3) is only for fixed cutaway/boss dressing.
4. **Neural network** — instance the stylized neuron pick 50–200× over a hand-laid or Poisson-disc layout, connect with `Line2`/tube synapses that light up on signal passes; a downloaded 'neural network' mesh can't rewire per mission.
5. **Alveoli clusters** — instanced lowpoly alveolus (7c7989ad) or pure UV-sphere clusters with a translucent SSS-fake shader; O2/CO2 particle exchange is fully shader-driven.
6. **Capillary environment micro-geometry + plasma fog** — noise-driven volumetrics/fog planes, no download needed.
7. **Cholesterol crystals** — small convex-hull rock generator (randomized icosahedra, amber shader) for floating debris.

Free-library sweep result (checked, no anatomy content): **Quaternius** (CC0 — characters/props/nature, no organs), **Kenney** (CC0 — no biology), **Poly Haven** (CC0 — 521 models, only clinic set-dressing like `medical_box`, `wheelchair_01`, `vintage_crutches_01`; no anatomy), **CC0Models** (unreachable, DNS fail), **poly.pizza** (API requires key — note for later manual browsing). GitHub topic search: `pitfa19/anatomed-mcp` (CC-BY-SA-4.0, R3F anatomy — runtime-fetched models, no GLBs in repo), `10kScience/cochlea-generator` (CC-BY-4.0 procedural Blender generator — useful technique reference for procedural organs); everything else unlicensed. **Z-Anatomy** (github.com/LluisV/Z-Anatomy, ★390, project-licensed CC-BY-SA) is the strongest open full-body anatomy source if the explorer needs more systems later — copyleft applies to derived assets.

## DOWNLOAD QUEUE (authenticated pipeline — run in P4 asset phase)

Sketchfab download endpoints require an OAuth token. Format:

```bash
# 1) get the signed URL list (JSON: gltf.url / glb.url / usdz.url / source.url)
curl -s -H "Authorization: Token $SKETCHFAB_API_TOKEN" \
     "https://api.sketchfab.com/v3/models/{UID}/download"
# 2) pull the GLB and store it
curl -s -o public/assets/models/<slug>.glb "$(…/download response → .glb.url)"
# 3) optimize: gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp
```

| Priority | Category | Model | UID | Viewer URL | Formats available |
|---|---|---|---|---|---|
| P0 | heart | Realistic Human Heart | `3f8072336ce94d18b3d0d055a1ece089` | https://sketchfab.com/3d-models/3f8072336ce94d18b3d0d055a1ece089 | glTF/GLB (usdz/usd also offered) |
| P0 | rbc | Red Blood Cells (Erythrocytes) | `657f7b34ab2e43878c4f366e3e940ebd` | https://sketchfab.com/3d-models/657f7b34ab2e43878c4f366e3e940ebd | glTF/GLB (usdz/usd also offered) |
| P0 | platelet | Platelet | `8780792dca1b4a5fa225d9f9d679f48c` | https://sketchfab.com/3d-models/8780792dca1b4a5fa225d9f9d679f48c | glTF/GLB (usdz/usd also offered) |
| P0 | plaque | Thrombus Left Atrial Appendage | `d552d0f38eb74e46837c718fede257f0` | https://sketchfab.com/3d-models/d552d0f38eb74e46837c718fede257f0 | glTF/GLB (usdz/usd also offered) |
| P1 | heart | Beating Heart (animated LOD) | `5948873c2c1e4c6285e3f3d18a9b991c` | https://sketchfab.com/3d-models/5948873c2c1e4c6285e3f3d18a9b991c | glTF/GLB (usdz/usd also offered) |
| P1 | wbc | White Blood Cells | `557451d5e6ca496d8c691e14b42edd93` | https://sketchfab.com/3d-models/557451d5e6ca496d8c691e14b42edd93 | glTF/GLB (usdz/usd also offered) |
| P1 | virus | Lowpoly Coronavirus (SARS-CoV-2) | `81acdfb6457b471c9aa355f1925fe2b9` | https://sketchfab.com/3d-models/81acdfb6457b471c9aa355f1925fe2b9 | glTF/GLB (usdz/usd also offered) |
| P1 | lung | Realistic Human Lungs | `ce09f4099a68467880f46e61eb9a3531` | https://sketchfab.com/3d-models/ce09f4099a68467880f46e61eb9a3531 | glTF/GLB (usdz/usd also offered) |
| P1 | body | Male Body (shell) | `15a422001834483c9750ce6117d59cc1` | https://sketchfab.com/3d-models/15a422001834483c9750ce6117d59cc1 | glTF/GLB (usdz/usd also offered) |
| P1 | body | Human Organs (contents) | `74e22fd93f62468daf7a8955aa69cd76` | https://sketchfab.com/3d-models/74e22fd93f62468daf7a8955aa69cd76 | glTF/GLB (usdz/usd also offered) |
| P2 | body | Circulatory System (animated layer) | `a46a7227a957442da30486b97547eaf5` | https://sketchfab.com/3d-models/a46a7227a957442da30486b97547eaf5 | glTF/GLB (usdz/usd also offered) |
| P2 | brain | Human brain, Cerebrum & Brainstem | `0aa0e33c5c854d1bab7bac9e1c7acaec` | https://sketchfab.com/3d-models/0aa0e33c5c854d1bab7bac9e1c7acaec | glTF/GLB (usdz/usd also offered) |
| P2 | brain | Brain Areas (region overlay) | `d64608a3978b47d8a39c5a15795ca8c4` | https://sketchfab.com/3d-models/d64608a3978b47d8a39c5a15795ca8c4 | glTF/GLB (usdz/usd also offered) |
| P2 | neuron | High Poly Stylized Neuron | `0dfd0cd08a1d484d9a8ab02a4223b5b5` | https://sketchfab.com/3d-models/0dfd0cd08a1d484d9a8ab02a4223b5b5 | glTF/GLB (usdz/usd also offered) |
| P2 | lung | Alveolo S374 (instancing unit) | `7c7989ada1544768877718ceeeff9dc5` | https://sketchfab.com/3d-models/7c7989ada1544768877718ceeeff9dc5 | glTF/GLB (usdz/usd also offered) |
| P3 | wbc | Neutrophil-Final | `829962af9e004626b7e9dbbb353013ae` | https://sketchfab.com/3d-models/829962af9e004626b7e9dbbb353013ae | glTF/GLB (usdz/usd also offered) |
| P3 | platelet | blood platelet / thrombocyte (activated) | `08fed7ab59514804b07804e40a57ef33` | https://sketchfab.com/3d-models/08fed7ab59514804b07804e40a57ef33 | glTF/GLB (usdz/usd also offered) |
| P3 | heart | Heart Mitral Stenosis (animated cutaway) | `76b535535e054dc4a1b9ef64794428f2` | https://sketchfab.com/3d-models/76b535535e054dc4a1b9ef64794428f2 | glTF/GLB (usdz/usd also offered) |
| P3 | virus | Simple Virus Concepts (enemy variants) | `faf568025a3345c9b68c16e6a0753cbc` | https://sketchfab.com/3d-models/faf568025a3345c9b68c16e6a0753cbc | glTF/GLB (usdz/usd also offered) |
| P3 | neuron | Hippocampus CA1 Pyramidal Cell (edu shot) | `f4199d144003415690ad19eea6210e71` | https://sketchfab.com/3d-models/f4199d144003415690ad19eea6210e71 | glTF/GLB (usdz/usd also offered) |

**Attribution step (mandatory for CC-BY):** on each download, append a row to `docs/ASSETS.md` with creator, license, URL, and modifications (decimate/retexture/compress). Top-pick creator credits: neshallads, _Bonehead14, Celena Ransil, andrewfrueh, tl0615, tales, Laurie Annis, Alexander Antipov, Devin Eggleston, FrankJohansson, brianj.seely, Versal, polisur.

## Open risks / follow-ups

- Topology of every pick must be eyeballed in the Sketchfab viewer before the P4 download phase (search metadata can't show ngons/interiors). 15-minute check each.
- Tri-count column is Sketchfab's reported value; Draco-optimized sizes will land far lower, but retopo stays likely for the heart hero if interior chambers are needed (most free hearts are closed-surface exterior).
- If a CC0 mandate is later imposed (spec §3 prefers CC0 first), the fallback is heavier decimation of the CC0 brain/virus scans + more procedural work — flag in `docs/DECISIONS.md` before switching.
- poly.pizza and CC0Models were not fully swept (API key / DNS). Low expected yield for anatomy, revisit only if a category has no acceptable pick after viewer review.
