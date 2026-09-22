"use client";
/**
 * HEART ATTACK RESPONSE — the vertical slice (spec §8/§47).
 * Assembles vessel + cells + obstructions + player; drives objectives,
 * heartbeat, flow restoration, scan raycasting and the mission payoff.
 */
import { useEffect as useEffectReact, useMemo, useRef, Suspense } from "react";
import * as THREE from "three";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useGame } from "@/game/core/state";
import type { InputState } from "@/game/controls/input";
import { vesselCurve, offsetPoint } from "@/game/systems/vessel";
import { VesselTube } from "./VesselTube";
import { BloodCells } from "./BloodCells";
import { Obstructions, type ClotSegment } from "./Obstructions";
import { Junction } from "./Junction";
import { Player, createPlayerRefs } from "./Player";
import {
  HEART_OBJECTIVE_ZONES,
  vesselRadiusAt,
  VESSEL_BASE_RADIUS,
  spurCurve,
  SPUR_BASE_RADIUS,
} from "./vessel";
import { playLockOn, playDissolveTick, playFlowRestored, playBlip } from "@/audio/sfx";

const _center = new THREE.Vector3();
const _dir = new THREE.Vector3();
const RAY = new THREE.Raycaster();
RAY.far = 12;
// aim-assist scratch vectors (scan forgiveness cone)
const _vFwd = new THREE.Vector3();
const _vTo = new THREE.Vector3();

/**
 * Scan resolution: exact ray first, then a 20-degree aim-assist cone (nearest
 * angle wins). The drift of flight means a perfectly-aimed reticle still
 * wobbles — the assist keeps scanning fair without ever grabbing a target
 * behind the player or outside the cone.
 */
function resolveScanTarget(
  targets: THREE.Object3D[],
  camera: THREE.Camera
): { organ: string; id: string } | null {
  RAY.setFromCamera(new THREE.Vector2(0, 0), camera);
  for (const target of targets) {
    if (RAY.intersectObject(target, true).length > 0) {
      return { organ: target.userData.organ as string, id: target.userData.anatomyId as string };
    }
  }
  camera.getWorldDirection(_vFwd);
  let bestAng = 0.35;
  let best: THREE.Object3D | null = null;
  for (const target of targets) {
    _vTo.setFromMatrixPosition(target.matrixWorld).sub(camera.position);
    const dist = _vTo.length();
    if (dist < 0.2 || dist > 11) continue;
    _vTo.divideScalar(dist);
    const ang = Math.acos(THREE.MathUtils.clamp(_vTo.dot(_vFwd), -1, 1));
    if (ang < bestAng) {
      bestAng = ang;
      best = target;
    }
  }
  return best ? { organ: best.userData.organ as string, id: best.userData.anatomyId as string } : null;
}

export interface HeartRefs {
  player: ReturnType<typeof createPlayerRefs>;
  flow: React.MutableRefObject<number>;
  beat: React.MutableRefObject<number>;
  clot: React.MutableRefObject<ClotSegment[]>;
  hitWall: React.MutableRefObject<number>;
  particleCount: React.MutableRefObject<number>;
  scanTargets: React.MutableRefObject<THREE.Object3D[]>;
  introProgress: React.MutableRefObject<number>;
  introStart: React.MutableRefObject<number>;
  targetDist: React.MutableRefObject<number>; // meters along path to current objective beacon
  dissolved: React.MutableRefObject<boolean>; // first treatment tick happened
}

export function createHeartRefs(particleCount: number): HeartRefs {
  return {
    player: createPlayerRefs(),
    flow: { current: 0 },
    beat: { current: 0 },
    clot: { current: [] },
    hitWall: { current: 0 },
    particleCount: { current: particleCount },
    scanTargets: { current: [] },
    introProgress: { current: 0 },
    introStart: { current: -1 },
    targetDist: { current: -1 },
    dissolved: { current: false },
  };
}

/** Path-length of the vessel spline (for distance readouts). */
const VESSEL_LEN = vesselCurve.getLength();
const CLOT_T = 0.68;
const STABILIZE_T = 0.92;

// stage targets along t (HUD beacons + completion zones, spec §25 10-stage arc)
const NAVIGATE_T = HEART_OBJECTIVE_ZONES.navigateT;
const JUNCTION_END_T = HEART_OBJECTIVE_ZONES.junctionEndT;
const CALIBRATE_T = 0.33; // scanner calibration marker (red blood cell POI)
const LOCATE_T = HEART_OBJECTIVE_ZONES.locateT;

// spur dead-end sampling for the soft "wrong vessel" wall
const SPUR_SAMPLES = Array.from({ length: 10 }, (_, i) => spurCurve.getPointAt(0.05 + (i / 9) * 0.9));

interface Props {
  refs: HeartRefs;
  input: React.MutableRefObject<InputState>;
  quality: "LOW" | "MEDIUM" | "HIGH";
}

export function HeartMission({ refs, input, quality }: Props) {
  const { camera } = useThree();
  const heartbeatT = useRef(0);
  const stabilizeHold = useRef(0);
  const scanCooldown = useRef(0);
  const interactLatch = useRef(false);
  const scanLatch = useRef(false);
  const scanTap = useRef(false); // edge-triggered scan (never missed at low fps)
  const aimClot = useRef(false); // reticle currently on a clot segment
  const dissolveTick = useRef(0); // last played dissolve bucket (0..3)
  const wrongBranchAt = useRef(-10); // last wrong-branch warning time

  // scan taps arrive via keyboard events / touch button events, not polling
  useEffectReact(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyQ") scanTap.current = true;
    };
    const onTap = () => {
      scanTap.current = true;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("aa-scan-tap", onTap);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("aa-scan-tap", onTap);
    };
  }, []);

  const { particleCount } = refs;

  // ---- heartbeat model: irregular while blocked, strong and regular when restored ----
  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, quality === "LOW" ? 0.22 : 0.05);
    const g = useGame.getState();
    const time = state.clock.elapsedTime;

    // pause suspension (L16): freeze the entire mission sim, beat included
    if (input.current.suspended) return;
    // BPM: 108 arrhythmic -> 74 healthy
    const flow = refs.flow.current;
    const bpm = 108 - flow * 34;
    const arrhythmia = (1 - flow) * Math.sin(time * 2.3) * 0.18;
    heartbeatT.current += (dt * (bpm + arrhythmia * bpm)) / 60;
    const beatPhase = heartbeatT.current % 1;
    const beat = Math.max(0, Math.sin(beatPhase * Math.PI * 2)) ** 3;
    refs.beat.current = beat;

    // intro cinematic: camera rail into the vessel, then hand over control
    // (wall-clock based: immune to clamped dt on slow/software GL)
    if (g.phase === "MISSION_INTRO") {
      if (refs.introStart.current < 0) refs.introStart.current = state.clock.elapsedTime;
      const t = Math.min(1, (state.clock.elapsedTime - refs.introStart.current) / 5.2);
      refs.introProgress.current = t;
      const railT = -0.004 + t * 0.028;
      const clamped = THREE.MathUtils.clamp(railT, 0, 1);
      vesselCurve.getPointAt(clamped, _center);
      const ahead = THREE.MathUtils.clamp(clamped + 0.02, 0, 1);
      vesselCurve.getPointAt(ahead, _dir);
      camera.position.copy(_center);
      camera.position.y += Math.sin(t * Math.PI) * 1.2 * (1 - t);
      camera.lookAt(_dir);
      camera.rotateZ(Math.sin(t * Math.PI * 1.5) * 0.18);
      if (t >= 1) {
        g.setPhase("PLAYING");
        g.setCameraMode("POV");
        // snap player rig to rail end
        refs.player.pos.copy(_center);
        refs.player.t = clamped;
        const dirV = new THREE.Vector3();
        camera.getWorldDirection(dirV);
        refs.player.yaw = Math.atan2(-dirV.x, -dirV.z);
        refs.player.pitch = 0;
        refs.player.vel.set(0, 0, 0);
        g.completeObjective(1); // 02 ENTER CIRCULATORY SYSTEM
        g.addScore(200);
      }
    }

    if (g.phase !== "PLAYING" && g.phase !== "OBJECTIVE_COMPLETE" && g.phase !== "EDUCATION_POPUP") {
      if (g.phase === "MISSION_COMPLETE") refs.hitWall.current = 0;
      return;
    }

    g.tick(dt);

    // ---- failure states (spec §17): rig destroyed or patient oxygen starved ----
    if (g.playerHealth <= 0) {
      g.failMission("RIG");
      return;
    }
    if (g.patientStatus <= 0) {
      g.failMission("PATIENT");
      return;
    }

    // ---- target guidance: distance to the active beacon along the vessel path ----
    const t10 = refs.player.t;
    if (!g.objectives[2].done) {
      refs.targetDist.current = Math.max(0, (NAVIGATE_T - t10) * VESSEL_LEN);
    } else if (!g.objectives[3].done) {
      refs.targetDist.current = Math.max(0, (JUNCTION_END_T - t10) * VESSEL_LEN);
    } else if (!g.objectives[4].done) {
      refs.targetDist.current = Math.max(0, (CALIBRATE_T - t10) * VESSEL_LEN);
    } else if (!g.objectives[9].done) {
      refs.targetDist.current = Math.max(0, (t10 < CLOT_T ? CLOT_T - t10 : 0) * VESSEL_LEN + (t10 >= STABILIZE_T ? 0 : Math.max(0, (STABILIZE_T - t10) * VESSEL_LEN)));
    } else {
      refs.targetDist.current = -1;
    }

    // ---- stage 02: NAVIGATE THE BLOODSTREAM (first checkpoint) ----
    if (!g.objectives[2].done) {
      g.setObjectiveProgress(2, Math.min(1, t10 / NAVIGATE_T));
      if (t10 >= NAVIGATE_T) g.completeObjective(2);
    }

    // ---- stage 03: IDENTIFY THE CORONARY ARTERY (branch junction) ----
    if (!g.objectives[3].done) {
      if (t10 >= JUNCTION_END_T) {
        g.completeObjective(3);
        g.addScore(250);
      }
    }

    // ---- LCX spur soft wall: the branch is a dead end, nudge the player back ----
    {
      let minD = Infinity;
      let nearest: THREE.Vector3 | null = null;
      for (const p of SPUR_SAMPLES) {
        const d = p.distanceToSquared(refs.player.pos);
        if (d < minD) {
          minD = d;
          nearest = p;
        }
      }
      if (nearest && minD < (SPUR_BASE_RADIUS * 1.05) ** 2) {
        const push = _dir.subVectors(refs.player.pos, nearest).normalize();
        refs.player.pos.addScaledVector(push, 0.12);
        const inward = refs.player.vel.dot(push);
        if (inward < 0) refs.player.vel.addScaledVector(push, -inward * 1.4);
        const st = useGame.getState();
        if (st.phase === "PLAYING" && !st.objectives[3].done) {
          const now = state.clock.elapsedTime;
          if (now - wrongBranchAt.current > 3.2) {
            wrongBranchAt.current = now;
            playBlip(180, 0.2, 0.1);
            window.dispatchEvent(new CustomEvent("aa-wrong-branch"));
          }
        }
      }
    }

    // ---- stage 04: CALIBRATE THE SCANNER — completes in page.tsx on first scan ----

    // ---- aim-at-clot detection: spatial reticle feedback (cause <-> effect) ----
    const treatPhase = g.objectives[6].done && !g.objectives[7].done;
    if (treatPhase) {
      RAY.setFromCamera(new THREE.Vector2(0, 0), camera);
      let aiming = false;
      for (const seg of refs.clot.current) {
        if (seg.hp <= 0 || !seg.ref) continue;
        if (RAY.intersectObject(seg.ref, false).length > 0) {
          aiming = true;
          break;
        }
      }
      if (aiming !== aimClot.current) {
        aimClot.current = aiming;
        if (aiming) playLockOn(); // treatment lock-on acquired (L19)
        window.dispatchEvent(new CustomEvent("aa-aim-clot", { detail: { aiming } }));
      }
      if (aiming && (input.current.interact || input.current.tInteract)) {
        window.dispatchEvent(new CustomEvent("aa-dissolve-progress"));
      }
    } else if (aimClot.current) {
      aimClot.current = false;
      window.dispatchEvent(new CustomEvent("aa-aim-clot", { detail: { aiming: false } }));
    }

    // ---- objective 02→05 progression along the artery ----
    // stage 05 LOCATE THE PLAQUE — approach the damaged stretch
    if (!g.objectives[5].done && t10 >= LOCATE_T) {
      g.completeObjective(5);
      g.addScore(150);
    }

    // ---- stage 07: DISSOLVE THE CLOT (hold interact while reticle on clot) ----
    if (g.objectives[6].done && !g.objectives[7].done) {
      const holding = input.current.interact || input.current.tInteract;
      if (holding) {
        let dissolvedThisFrame = 0;
        RAY.setFromCamera(new THREE.Vector2(0, 0), camera);
        for (const seg of refs.clot.current) {
          if (seg.hp <= 0) continue;
          const mesh = seg.ref;
          if (!mesh) continue;
          const hit = RAY.intersectObject(mesh, false);
          if (hit.length > 0) {
            seg.hp = Math.max(0, seg.hp - dt * 0.34);
            dissolvedThisFrame += dt * 0.34;
            g.setObjectiveProgress(7, 1 - refs.clot.current.reduce((a, s) => a + s.hp, 0) / refs.clot.current.length);
          }
        }
        if (dissolvedThisFrame > 0) {
          g.addScore(Math.round(dissolvedThisFrame * 90));
          // rising per-segment dissolve chirps (L19): 4 buckets
          const p = 1 - refs.clot.current.reduce((a, s) => a + s.hp, 0) / refs.clot.current.length;
          const bucket = Math.min(3, Math.floor(p * 4));
          if (bucket > dissolveTick.current) {
            dissolveTick.current = bucket;
            playDissolveTick(bucket);
          }
          if (!refs.dissolved.current) {
            refs.dissolved.current = true;
            window.dispatchEvent(new CustomEvent("aa-dissolve"));
          }
        }
      }
      const allClear = refs.clot.current.every((s) => s.hp <= 0);
      if (allClear && !g.objectives[7].done) {
        dissolveTick.current = 0;
        g.completeObjective(7);
      }
    }

    // ---- stage 08: RESTORE BLOOD FLOW (ramps after clot cleared) ----
    if (g.objectives[7].done && !g.objectives[8].done) {
      const f = Math.min(1, refs.flow.current + dt * 0.22);
      refs.flow.current = f;
      g.setFlowHealth(f);
      g.setPatientStatus(62 + f * 30);
      if (f >= 0.98) {
        playFlowRestored(); // payoff arpeggio (L19)
        g.completeObjective(8);
        g.addScore(800);
      }
    } else if (!g.objectives[7].done) {
      // partial flow recovery as clot segments die
      const dead = refs.clot.current.filter((s) => s.hp <= 0).length;
      const partial = dead / refs.clot.current.length * 0.28;
      refs.flow.current = Math.max(refs.flow.current, partial);
      g.setFlowHealth(refs.flow.current);
    }

    // ---- stage 09: STABILIZE THE HEART (hold in the post zone) ----
    if (g.objectives[8].done && !g.objectives[9].done) {
      if (refs.player.t >= HEART_OBJECTIVE_ZONES.stabilizeT) {
        stabilizeHold.current += dt;
        g.setObjectiveProgress(9, stabilizeHold.current / 4);
        g.setPatientStatus(92 + stabilizeHold.current / 4 * 8);
        if (stabilizeHold.current >= 4) {
          g.setPatientStatus(100);
          g.completeObjective(9);
          g.addScore(1200);
          // mission complete lands after the banner (UI shell handles)
          setTimeout(() => {
            const st = useGame.getState();
            if (st.objectives.every((o) => o.done)) st.setPhase("MISSION_COMPLETE");
          }, 2200);
        }
      } else {
        stabilizeHold.current = Math.max(0, stabilizeHold.current - dt * 0.5);
        g.setObjectiveProgress(9, stabilizeHold.current / 4);
      }
    }

    // ---- scan action ----
    scanCooldown.current = Math.max(0, scanCooldown.current - dt);
    const scanPressed = input.current.scan || input.current.tScan || scanTap.current;
    if (scanPressed && !scanLatch.current && scanCooldown.current <= 0 && g.phase === "PLAYING") {
      scanTap.current = false; // consumed
      scanLatch.current = true;
      scanCooldown.current = 0.6;
      const hit = resolveScanTarget(refs.scanTargets.current, camera);
      if (hit) {
        window.dispatchEvent(new CustomEvent("aa-scan", { detail: { organ: hit.organ, id: hit.id } }));
      }
    }
    if (!scanPressed) {
      scanLatch.current = false;
      if (g.phase !== "PLAYING") scanTap.current = false;
    }

    // ambient patient drift while blocked (urgency, spec §24)
    // reads FRESH state: the restore ramp above mutates the store mid-frame,
    // and a stale snapshot here would overwrite the ramp's vitals every frame
    const liveG = useGame.getState();
    if (!liveG.objectives[8].done) {
      g.setPatientStatus(liveG.patientStatus - dt * 0.12);
    }
  });

  // scan targets: anatomical points of interest registered into refs
  const scanPoints = useMemo(
    () => [
      { t: 0.12, angle: 2.6, dist: 0.72, id: "vesselWall", organ: "artery wall" },
      { t: 0.33, angle: 0.8, dist: 0.5, id: "redBloodCell", organ: "red blood cell" },
      { t: 0.345, angle: 1.9, dist: 0.58, id: "coronaryArtery", organ: "coronary artery" },
      { t: 0.5, angle: -2.2, dist: 0.55, id: "platelet", organ: "platelet" },
      { t: 0.55, angle: 2.2, dist: 0.62, id: "plaque", organ: "cholesterol plaque" },
      { t: 0.68, angle: 1.2, dist: 0.5, id: "thrombus", organ: "blood clot" },
      { t: 0.88, angle: -0.6, dist: 0.6, id: "heartChamber", organ: "heart" },
    ],
    []
  );

  const markers = useMemo(() => {
    // place emissive markers (scan affordances) at scan points
    return scanPoints.map((m) => ({ ...m, pos: new THREE.Vector3() }));
  }, [scanPoints]);

  // dev/test helpers on window (harmless in prod)
  useEffectReact(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__aaTp = (t: number, ang = 0, dist = 0.3) => {
      const pos = offsetPoint(t, ang, dist, 0);
      refs.player.pos.copy(pos);
      refs.player.t = t;
      refs.player.vel.set(0, 0, 0);
      refs.player.yaw = Math.PI;
      refs.player.pitch = 0;
    };
    // warp to a raw world position (spur dead-end testing)
    w.__aaWarp = (x: number, y: number, z: number) => {
      refs.player.pos.set(x, y, z);
      refs.player.vel.set(0, 0, 0);
      refs.player.t = 0.31;
    };
    // aim at a raw world position (junction/heart visual QA)
    w.__aaAimWorld = (x: number, y: number, z: number) => {
      const target = new THREE.Vector3(x, y, z);
      const d = new THREE.Vector3().subVectors(target, refs.player.pos);
      const len = d.length();
      if (len < 0.001) return;
      refs.player.pitch = Math.asin(THREE.MathUtils.clamp(d.y / len, -1, 1));
      refs.player.yaw = Math.atan2(-d.x, -d.z);
      const inp = (window as unknown as { __aaInput?: { current: { lookDX: number; lookDY: number; tLookDX: number; tLookDY: number } } }).__aaInput?.current;
      if (inp) {
        inp.lookDX = 0;
        inp.lookDY = 0;
        inp.tLookDX = 0;
        inp.tLookDY = 0;
      }
    };
    // aim at the hero heart (end of artery payoff QA)
    w.__aaAimHeart = () => {
      const end = new THREE.Vector3();
      const tan = new THREE.Vector3();
      vesselCurve.getPointAt(1, end);
      vesselCurve.getTangentAt(1, tan);
      const p = end.addScaledVector(tan, 11).add(new THREE.Vector3(0, 0.5, 0));
      (w.__aaAimWorld as (x: number, y: number, z: number) => void)(p.x, p.y, p.z);
    };
    w.__aaAimAt = (t: number, ang: number, dist: number) => {
      const target = offsetPoint(t, ang, dist, 0);
      const d = new THREE.Vector3().subVectors(target, refs.player.pos);
      const len = d.length();
      if (len < 0.001) return;
      refs.player.pitch = Math.asin(THREE.MathUtils.clamp(d.y / len, -1, 1));
      refs.player.yaw = Math.atan2(-d.x, -d.z);
      // kill pending look deltas so the aim survives the next frame
      const inp = (window as unknown as { __aaInput?: { current: { lookDX: number; lookDY: number; tLookDX: number; tLookDY: number } } }).__aaInput?.current;
      if (inp) {
        inp.lookDX = 0;
        inp.lookDY = 0;
        inp.tLookDX = 0;
        inp.tLookDY = 0;
      }
    };
    return () => {
      delete w.__aaTp;
      delete w.__aaWarp;
      delete w.__aaAimWorld;
      delete w.__aaAimHeart;
      delete w.__aaAimAt;
    };
  }, [refs, camera]);

  return (
    <group>
      {/* depth fog: the bloodstream has distance (spec: lighting changes + depth) */}
      <fogExp2 attach="fog" args={["#160409", quality === "LOW" ? 0.013 : quality === "MEDIUM" ? 0.017 : 0.021]} />
      <VesselTube flowRef={refs.flow} beatRef={refs.beat} segments={quality === "LOW" ? 200 : quality === "MEDIUM" ? 360 : 520} lowTier={quality === "LOW"} />
      <Junction lowTier={quality === "LOW"} />
      <BloodCells count={particleCount.current} countRef={particleCount} flowRef={refs.flow} beatRef={refs.beat} playerPos={refs.player.pos} lowTier={quality === "LOW"} />
      <Obstructions clotRef={refs.clot} flowRef={refs.flow} beatRef={refs.beat} lowTier={quality === "LOW"} />
      <Player
        player={refs.player}
        input={input}
        flowRef={refs.flow}
        beatRef={refs.beat}
        hitWallRef={refs.hitWall}
        quality={quality}
      />
      {/* scan markers: small emissive diamonds, raycast targets */}
      {markers.map((m, i) => {
        // compute world position once via curve (static point, radius varies with flow)
        const pos = new THREE.Vector3();
        vesselCurve.getPointAt(m.t, pos);
        const t1 = new THREE.Vector3();
        vesselCurve.getTangentAt(m.t, t1);
        const right = new THREE.Vector3().crossVectors(t1, new THREE.Vector3(0, 1, 0)).normalize();
        const up = new THREE.Vector3().crossVectors(right, t1).normalize();
        const r = VESSEL_BASE_RADIUS * vesselRadiusAt(m.t, 0);
        pos.addScaledVector(right, Math.cos(m.angle) * m.dist * r);
        pos.addScaledVector(up, Math.sin(m.angle) * m.dist * r);
        return (
          <mesh
            key={i}
            position={pos}
            data-scan-id={m.id}
            userData={{ organ: m.organ, anatomyId: m.id }}
            ref={(mesh) => {
              if (mesh) refs.scanTargets.current[i] = mesh;
            }}
          >
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial
              color={m.id === "thrombus" || m.id === "plaque" ? "#C21E3A" : "#2DD9E8"}
              emissive={m.id === "thrombus" || m.id === "plaque" ? "#C21E3A" : "#2DD9E8"}
              emissiveIntensity={1.6}
            />
          </mesh>
        );
      })}
      {/* key lighting: dim ambience + heartbeat-driven warm pulse from ahead */}
      <ambientLight intensity={0.55} color="#4d1018" />
      <hemisphereLight args={["#12182a", "#1a0509", 0.35]} />
      <pointLight position={[0, 1.5, 8]} intensity={2.4 + refs.beat.current * 3.2} distance={34} color="#c21e3a" />
      <pointLight position={[0, 0, -70]} intensity={0.9} distance={40} color="#2DD9E8" />
      {quality !== "LOW" && (
        <pointLight
          position={(() => {
            const p = new THREE.Vector3();
            vesselCurve.getPointAt(0.55, p);
            return p.toArray();
          })()}
          intensity={1.4}
          distance={18}
          color="#ffb020"
        />
      )}
      {/* the hero heart: visible at the end of the artery — the thing you are saving */}
      <Suspense fallback={null}>
        <HeroHeart beatRef={refs.beat} quality={quality} />
      </Suspense>
      {/* objective beacons: diegetic navigation (spec §9/§33) — amber stands out in the red world */}
      <TargetBeacon t={NAVIGATE_T} color="#2DD9E8" visibleWhenObjective={2} flowRef={refs.flow} />
      <TargetBeacon t={JUNCTION_END_T} color="#2DD9E8" visibleWhenObjective={3} flowRef={refs.flow} />
      <TargetBeacon t={CLOT_T} color="#ffb020" visibleWhenObjective={5} flowRef={refs.flow} />
      <TargetBeacon t={CLOT_T} color="#ffb020" visibleWhenObjective={6} flowRef={refs.flow} />
      <TargetBeacon t={STABILIZE_T} color="#2DD9E8" visibleWhenObjective={9} flowRef={refs.flow} />
    </group>
  );
}

/** Pulsing waypoint beacon anchored in the vessel flow channel. */
function TargetBeacon({
  t,
  color,
  visibleUntilObjective,
  visibleWhenObjective,
  flowRef,
}: {
  t: number;
  color: string;
  visibleUntilObjective?: number;
  visibleWhenObjective?: number;
  flowRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const objectives = useGame((s) => s.objectives);
  const phase = useGame((s) => s.phase);

  const visible =
    phase === "PLAYING" || phase === "OBJECTIVE_COMPLETE" || phase === "EDUCATION_POPUP"
      ? visibleUntilObjective !== undefined
        ? !objectives[visibleUntilObjective].done
        : visibleWhenObjective !== undefined
          ? objectives[visibleWhenObjective - 1].done && !objectives[visibleWhenObjective].done
          : false
      : false;

  useFrame((state) => {
    const g = meshRef.current;
    if (!g) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 4.2) * 0.22;
    g.scale.setScalar(pulse);
    if (haloRef.current) {
      const hp = (state.clock.elapsedTime * 0.9) % 1;
      haloRef.current.scale.setScalar(0.5 + hp * 3.2);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - hp);
    }
    offsetPoint(t, 0, 0, flowRef.current, g.position);
  });

  return (
    <group ref={meshRef} visible={visible}>
      <mesh>
        <octahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <pointLight color={color} intensity={2.2} distance={9} />
    </group>
  );
}

/**
 * HERO HEART (ASSET: public/models/heart_hero.glb — BodyParts3D, CC BY 4.0,
 * see docs/ASSETS.md): the real anatomical heart visible at the end of the
 * artery. The vessel opens toward it; it beats with the global pulse. This is
 * the "I am inside a body" payoff — the player sees the organ they are saving.
 */
function HeroHeart({
  beatRef,
  quality,
}: {
  beatRef: React.MutableRefObject<number>;
  quality: "LOW" | "MEDIUM" | "HIGH";
}) {
  const gltf = useLoader(GLTFLoader, "/models/heart_hero.glb");
  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    // palette-controlled luminous myocardium — reads as living tissue through fog
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#8e2536"),
      emissive: new THREE.Color("#6b1220"),
      emissiveIntensity: 0.9,
      roughness: 0.62,
      metalness: 0.04,
    });
    s.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.frustumCulled = true;
        mesh.material = mat;
      }
    });
    return s;
  }, [gltf]);
  const group = useRef<THREE.Group>(null);

  const layout = useMemo(() => {
    const end = new THREE.Vector3();
    const tan = new THREE.Vector3();
    vesselCurve.getPointAt(1, end);
    vesselCurve.getTangentAt(1, tan);
    // close enough to read the anatomy, far enough to see the whole organ
    const pos = end.clone().addScaledVector(tan, 11).add(new THREE.Vector3(0, 0.5, 0));
    const quat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), tan.clone().multiplyScalar(-1), new THREE.Vector3(0, 1, 0))
    );
    return { pos, quat };
  }, []);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const beat = beatRef.current;
    // systole: the whole organ swells with each beat
    const s = 80 * (1 + beat * 0.05);
    g.scale.setScalar(s);
    g.rotation.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.16;
  });

  return (
    <group ref={group} position={layout.pos} quaternion={layout.quat}>
      <primitive object={scene} />
      <pointLight intensity={quality === "LOW" ? 1.0 : 1.5} distance={30} color="#c21e3a" position={[0, 0, 6]} />
      {/* rim separation: cool light from behind so the organ reads against the void (VLM round 1) */}
      <pointLight intensity={quality === "LOW" ? 1.4 : 2.2} distance={44} color="#7fd8e8" position={[0, 3, -10]} />
    </group>
  );
}
