"use client";
/**
 * VIRAL INVASION (P7, spec §25 arc): bronchiole → acinus tube world, viral
 * colonies, macrophage response, alveolar gas-exchange payoff. Clones the
 * proven 10-stage heart machine (same stage indices + guidance) on the shared
 * parameterized tube engine — mobile-safe by construction.
 */
import { useEffect as useEffectReact, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/game/core/state";
import type { InputState } from "@/game/controls/input";
import { createTubeWorld, resolveScanTarget } from "@/game/levels/shared/world";
import { SharedTube, VIRAL_TUBE_THEME } from "@/game/levels/shared/SharedTube";
import { SharedCells } from "@/game/levels/shared/SharedCells";
import { SharedPlayer, createSharedPlayerRefs } from "@/game/levels/shared/SharedPlayer";
import { SharedJunction, SharedBeacon } from "@/game/levels/shared/SharedJunction";
import {
  AIRWAY_POINTS,
  AIRWAY_ZONES,
  AIRWAY_BASE_RADIUS,
  airwayRadiusAt,
  airwayDamageAt,
  AIRWAY_OBJECTIVE_ZONES,
  spurCurve,
  SPUR_BASE_RADIUS,
  spurRadiusAt,
  JUNCTION_T,
} from "./airway";
import { playLockOn, playDissolveTick, playFlowRestored, playBlip } from "@/audio/sfx";

const RAY = new THREE.Raycaster();
RAY.far = 12;

export interface ColonySegment {
  t: number;
  angle: number;
  size: number;
  hp: number;
  ref: THREE.Mesh | null;
}

export interface ViralRefs {
  player: ReturnType<typeof createSharedPlayerRefs>;
  flow: React.MutableRefObject<number>;
  beat: React.MutableRefObject<number>;
  colony: React.MutableRefObject<ColonySegment[]>;
  hitWall: React.MutableRefObject<number>;
  particleCount: React.MutableRefObject<number>;
  scanTargets: React.MutableRefObject<THREE.Object3D[]>;
  introProgress: React.MutableRefObject<number>;
  introStart: React.MutableRefObject<number>;
  targetDist: React.MutableRefObject<number>;
  dissolved: React.MutableRefObject<boolean>;
}

export function createViralRefs(particleCount: number): ViralRefs {
  return {
    player: createSharedPlayerRefs(0.015),
    flow: { current: 0 },
    beat: { current: 0 },
    colony: { current: [] },
    hitWall: { current: 0 },
    particleCount: { current: particleCount },
    scanTargets: { current: [] },
    introProgress: { current: 0 },
    introStart: { current: -1 },
    targetDist: { current: -1 },
    dissolved: { current: false },
  };
}

export const viralWorld = createTubeWorld({
  points: AIRWAY_POINTS,
  baseRadius: AIRWAY_BASE_RADIUS,
  radiusAt: airwayRadiusAt,
  damageAt: airwayDamageAt,
});

const AIRWAY_LEN = viralWorld.length;
const COLONY_T = 0.68;
const STABILIZE_T = AIRWAY_OBJECTIVE_ZONES.stabilizeT;
const NAVIGATE_T = AIRWAY_OBJECTIVE_ZONES.navigateT;
const JUNCTION_END_T = AIRWAY_OBJECTIVE_ZONES.junctionEndT;
const CALIBRATE_T = AIRWAY_OBJECTIVE_ZONES.calibrateT;
const LOCATE_T = AIRWAY_OBJECTIVE_ZONES.locateT;

const SPUR_SAMPLES = Array.from({ length: 10 }, (_, i) => spurCurve.getPointAt(0.05 + (i / 9) * 0.9));

interface Props {
  refs: ViralRefs;
  input: React.MutableRefObject<InputState>;
  quality: "LOW" | "MEDIUM" | "HIGH";
}

export function ViralMission({ refs, input, quality }: Props) {
  const { camera } = useThree();
  const heartbeatT = useRef(0);
  const stabilizeHold = useRef(0);
  const scanCooldown = useRef(0);
  const interactLatch = useRef(false);
  const scanLatch = useRef(false);
  const scanTap = useRef(false);
  const aimColony = useRef(false);
  const dissolveTick = useRef(0);
  const wrongBranchAt = useRef(-10);

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

  // ---- "breath" driver: the airway wall flexes slowly with respiration ----
  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, quality === "LOW" ? 0.22 : 0.05);
    const g = useGame.getState();
    const time = state.clock.elapsedTime;

    if (input.current.suspended) return;

    // respiration model instead of heartbeat: slow airy swell (12/min)
    const flow = refs.flow.current;
    const breathRate = 0.2 + flow * 0.05;
    heartbeatT.current += (dt * breathRate * 60) / 60;
    const beat = Math.max(0, Math.sin((heartbeatT.current % 1) * Math.PI * 2)) ** 2;
    refs.beat.current = beat * 0.6;

    // intro cinematic: rail down the airway
    if (g.phase === "MISSION_INTRO") {
      if (refs.introStart.current < 0) refs.introStart.current = state.clock.elapsedTime;
      const t = Math.min(1, (state.clock.elapsedTime - refs.introStart.current) / 5.2);
      refs.introProgress.current = t;
      const railT = -0.004 + t * 0.028;
      const clamped = THREE.MathUtils.clamp(railT, 0, 1);
      const center = viralWorld.curve.getPointAt(clamped, new THREE.Vector3());
      const ahead = viralWorld.curve.getPointAt(THREE.MathUtils.clamp(clamped + 0.02, 0, 1), new THREE.Vector3());
      camera.position.copy(center);
      camera.position.y += Math.sin(t * Math.PI) * 1.2 * (1 - t);
      camera.lookAt(ahead);
      camera.rotateZ(Math.sin(t * Math.PI * 1.5) * 0.18);
      if (t >= 1) {
        g.setPhase("PLAYING");
        g.setCameraMode("POV");
        refs.player.pos.copy(center);
        refs.player.t = clamped;
        const dirV = new THREE.Vector3();
        camera.getWorldDirection(dirV);
        refs.player.yaw = Math.atan2(-dirV.x, -dirV.z);
        refs.player.pitch = 0;
        refs.player.vel.set(0, 0, 0);
        g.completeObjective(1); // 02 ENTER RESPIRATORY SYSTEM
        g.addScore(200);
      }
    }

    if (g.phase !== "PLAYING" && g.phase !== "OBJECTIVE_COMPLETE" && g.phase !== "EDUCATION_POPUP") {
      if (g.phase === "MISSION_COMPLETE") refs.hitWall.current = 0;
      return;
    }

    g.tick(dt);

    if (g.playerHealth <= 0) {
      g.failMission("RIG");
      return;
    }
    if (g.patientStatus <= 0) {
      g.failMission("PATIENT");
      return;
    }

    // ---- beacon distance guidance (same indices as heart) ----
    const t10 = refs.player.t;
    if (!g.objectives[2].done) {
      refs.targetDist.current = Math.max(0, (NAVIGATE_T - t10) * AIRWAY_LEN);
    } else if (!g.objectives[3].done) {
      refs.targetDist.current = Math.max(0, (JUNCTION_END_T - t10) * AIRWAY_LEN);
    } else if (!g.objectives[4].done) {
      refs.targetDist.current = Math.max(0, (CALIBRATE_T - t10) * AIRWAY_LEN);
    } else if (!g.objectives[9].done) {
      refs.targetDist.current =
        Math.max(0, (t10 < COLONY_T ? COLONY_T - t10 : 0) * AIRWAY_LEN) +
        (t10 >= STABILIZE_T ? 0 : Math.max(0, (STABILIZE_T - t10) * AIRWAY_LEN));
    } else {
      refs.targetDist.current = -1;
    }

    // ---- stage 02: NAVIGATE THE BRONCHIOLES ----
    if (!g.objectives[2].done) {
      g.setObjectiveProgress(2, Math.min(1, t10 / NAVIGATE_T));
      if (t10 >= NAVIGATE_T) g.completeObjective(2);
    }

    // ---- stage 03: IDENTIFY THE ACINUS (branch junction) ----
    if (!g.objectives[3].done) {
      if (t10 >= JUNCTION_END_T) {
        g.completeObjective(3);
        g.addScore(250);
      }
    }

    // ---- wrong-branch soft wall (left-lobe spur) ----
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
        const push = new THREE.Vector3().subVectors(refs.player.pos, nearest).normalize();
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

    // ---- aim-at-colony feedback ----
    const treatPhase = g.objectives[6].done && !g.objectives[7].done;
    if (treatPhase) {
      RAY.setFromCamera(new THREE.Vector2(0, 0), camera);
      let aiming = false;
      for (const seg of refs.colony.current) {
        if (seg.hp <= 0 || !seg.ref) continue;
        if (RAY.intersectObject(seg.ref, false).length > 0) {
          aiming = true;
          break;
        }
      }
      if (aiming !== aimColony.current) {
        aimColony.current = aiming;
        if (aiming) playLockOn();
        window.dispatchEvent(new CustomEvent("aa-aim-clot", { detail: { aiming } }));
      }
      if (aiming && (input.current.interact || input.current.tInteract)) {
        window.dispatchEvent(new CustomEvent("aa-dissolve-progress"));
      }
    } else if (aimColony.current) {
      aimColony.current = false;
      window.dispatchEvent(new CustomEvent("aa-aim-clot", { detail: { aiming: false } }));
    }

    // ---- stage 05: LOCATE THE INFECTION ----
    if (!g.objectives[5].done && t10 >= LOCATE_T) {
      g.completeObjective(5);
      g.addScore(150);
    }

    // ---- stage 07: NEUTRALIZE THE VIRUS (hold interact on a colony) ----
    if (g.objectives[6].done && !g.objectives[7].done) {
      const holding = input.current.interact || input.current.tInteract;
      if (holding) {
        let dissolvedThisFrame = 0;
        RAY.setFromCamera(new THREE.Vector2(0, 0), camera);
        for (const seg of refs.colony.current) {
          if (seg.hp <= 0) continue;
          const mesh = seg.ref;
          if (!mesh) continue;
          const hit = RAY.intersectObject(mesh, false);
          if (hit.length > 0) {
            seg.hp = Math.max(0, seg.hp - dt * 0.34);
            dissolvedThisFrame += dt * 0.34;
            g.setObjectiveProgress(7, 1 - refs.colony.current.reduce((a, s) => a + s.hp, 0) / refs.colony.current.length);
          }
        }
        if (dissolvedThisFrame > 0) {
          g.addScore(Math.round(dissolvedThisFrame * 90));
          const p = 1 - refs.colony.current.reduce((a, s) => a + s.hp, 0) / refs.colony.current.length;
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
      const allClear = refs.colony.current.every((s) => s.hp <= 0);
      if (allClear && !g.objectives[7].done) {
        dissolveTick.current = 0;
        g.completeObjective(7);
      }
    }

    // ---- stage 08: RESTORE OXYGEN EXCHANGE ----
    if (g.objectives[7].done && !g.objectives[8].done) {
      const f = Math.min(1, refs.flow.current + dt * 0.22);
      refs.flow.current = f;
      g.setFlowHealth(f);
      g.setPatientStatus(62 + f * 30);
      if (f >= 0.98) {
        playFlowRestored();
        g.completeObjective(8);
        g.addScore(800);
      }
    } else if (!g.objectives[7].done) {
      const dead = refs.colony.current.filter((s) => s.hp <= 0).length;
      const partial = (dead / refs.colony.current.length) * 0.28;
      refs.flow.current = Math.max(refs.flow.current, partial);
      g.setFlowHealth(refs.flow.current);
    }

    // ---- stage 09: STABILIZE THE PATIENT ----
    if (g.objectives[8].done && !g.objectives[9].done) {
      if (refs.player.t >= STABILIZE_T) {
        stabilizeHold.current += dt;
        g.setObjectiveProgress(9, stabilizeHold.current / 4);
        g.setPatientStatus(92 + (stabilizeHold.current / 4) * 8);
        if (stabilizeHold.current >= 4) {
          g.setPatientStatus(100);
          g.completeObjective(9);
          g.addScore(1200);
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
      scanTap.current = false;
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

    // ---- saturation drift while infection is active ----
    const liveG = useGame.getState();
    if (!liveG.objectives[8].done) {
      g.setPatientStatus(liveG.patientStatus - dt * 0.12);
    }
  });

  // scan points (mirror heart layout so the calibration trick works identically)
  const scanPoints = useMemo(
    () => [
      { t: 0.12, angle: 2.6, dist: 0.72, id: "airwayWall", organ: "airway wall" },
      { t: 0.33, angle: 0.8, dist: 0.5, id: "redBloodCell", organ: "red blood cell" },
      { t: 0.345, angle: 1.9, dist: 0.58, id: "alveolus", organ: "alveolus" },
      { t: 0.5, angle: -2.2, dist: 0.55, id: "macrophage", organ: "macrophage" },
      { t: 0.55, angle: 2.2, dist: 0.62, id: "infectedCell", organ: "infected cell" },
      { t: 0.68, angle: 1.2, dist: 0.5, id: "virus", organ: "viral particle" },
      { t: 0.88, angle: -0.6, dist: 0.6, id: "alveolarSac", organ: "alveolar sac" },
    ],
    []
  );

  const markers = useMemo(() => scanPoints.map((m) => ({ ...m, pos: new THREE.Vector3() })), [scanPoints]);

  // dev/test helpers (same contract as heart)
  useEffectReact(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__aaTp = (t: number, ang = 0, dist = 0.3) => {
      const pos = viralWorld.offsetPoint(t, ang, dist, 0);
      refs.player.pos.copy(pos);
      refs.player.t = t;
      refs.player.vel.set(0, 0, 0);
      refs.player.yaw = Math.PI;
      refs.player.pitch = 0;
    };
    w.__aaWarp = (x: number, y: number, z: number) => {
      refs.player.pos.set(x, y, z);
      refs.player.vel.set(0, 0, 0);
      refs.player.t = 0.31;
    };
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
    w.__aaAimHeart = () => {
      const end = viralWorld.curve.getPointAt(1, new THREE.Vector3());
      const tan = viralWorld.curve.getTangentAt(1, new THREE.Vector3());
      const p = end.addScaledVector(tan, 11).add(new THREE.Vector3(0, 0.5, 0));
      (w.__aaAimWorld as (x: number, y: number, z: number) => void)(p.x, p.y, p.z);
    };
    w.__aaAimAt = (t: number, ang: number, dist: number) => {
      const target = viralWorld.offsetPoint(t, ang, dist, 0);
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
      <fogExp2
        attach="fog"
        args={["#1c0f14", quality === "LOW" ? 0.013 : quality === "MEDIUM" ? 0.017 : 0.021]}
      />
      <SharedTube
        world={viralWorld}
        zones={AIRWAY_ZONES}
        theme={VIRAL_TUBE_THEME}
        segments={quality === "LOW" ? 200 : quality === "MEDIUM" ? 360 : 520}
        beatRef={refs.beat}
        flowRef={refs.flow}
        lowTier={quality === "LOW"}
      />
      <SharedJunction
        world={viralWorld}
        spurCurve={spurCurve}
        spurRadiusAt={spurRadiusAt}
        spurBaseRadius={SPUR_BASE_RADIUS}
        junctionT={JUNCTION_T}
        mainSign={{ title: "RLL", sub: "RIGHT LOWER LOBE — ACINUS 7", accent: "#2DD9E8" }}
        spurSign={{ title: "LLL", sub: "LEFT LOBE — CLEAR", accent: "#8a6a58" }}
        capColor="#2a1010"
        arrowColor="#7fd8e0"
        lightColor="#ffb090"
        lowTier={quality === "LOW"}
      />
      <SharedCells
        world={viralWorld}
        zones={AIRWAY_ZONES}
        theme={{
          rbc: "#a01616",
          rbcEmissive: "#420808",
          small: "#b09a72",
          smallEmissive: "#241c0e",
          big: "#d8d2c4",
          bigEmissive: "#2a2622",
          laneSpread: 1.1,
        }}
        countRef={particleCount}
        flowRef={refs.flow}
        playerPos={refs.player.pos}
        lowTier={quality === "LOW"}
        junctionBand={[0.29, 0.41]}
        bigRatio={0.035}
      />
      <ViralColonies colonyRef={refs.colony} flowRef={refs.flow} beatRef={refs.beat} lowTier={quality === "LOW"} />
      <DustMotes count={quality === "LOW" ? 0 : 36} flowRef={refs.flow} />
      <SharedPlayer
        world={viralWorld}
        player={refs.player}
        input={input}
        flowRef={refs.flow}
        beatRef={refs.beat}
        hitWallRef={refs.hitWall}
        quality={quality}
      />
      {markers.map((m, i) => {
        const pos = viralWorld.offsetPoint(m.t, m.angle, m.dist, 0);
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
              color={m.id === "infectedCell" || m.id === "virus" ? "#9fd62e" : "#2DD9E8"}
              emissive={m.id === "infectedCell" || m.id === "virus" ? "#9fd62e" : "#2DD9E8"}
              emissiveIntensity={1.6}
            />
          </mesh>
        );
      })}
      <ambientLight intensity={0.55} color="#3a1420" />
      <hemisphereLight args={["#20121a", "#180a0c", 0.35]} />
      <pointLight position={[0, 1.5, 8]} intensity={2.4 + refs.beat.current * 2.2} distance={34} color="#c26a5a" />
      <pointLight position={[0, 0, -70]} intensity={0.9} distance={40} color="#2DD9E8" />
      {quality !== "LOW" && (
        <pointLight
          position={viralWorld.curve.getPointAt(0.55, new THREE.Vector3()).toArray()}
          intensity={1.4}
          distance={18}
          color="#9fd62e"
        />
      )}
      <AlveolarSac flowRef={refs.flow} quality={quality} />
      <SharedBeacon world={viralWorld} t={NAVIGATE_T} color="#2DD9E8" visibleWhenObjective={2} flowRef={refs.flow} />
      <SharedBeacon world={viralWorld} t={JUNCTION_END_T} color="#2DD9E8" visibleWhenObjective={3} flowRef={refs.flow} />
      <SharedBeacon world={viralWorld} t={COLONY_T} color="#ffb020" visibleWhenObjective={5} flowRef={refs.flow} />
      <SharedBeacon world={viralWorld} t={COLONY_T} color="#ffb020" visibleWhenObjective={6} flowRef={refs.flow} />
      <SharedBeacon world={viralWorld} t={STABILIZE_T} color="#2DD9E8" visibleWhenObjective={9} flowRef={refs.flow} />
    </group>
  );
}

/** Viral colonies (treat targets): sickly spiky blobs hugging the inflamed wall. */
function ViralColonies({
  colonyRef,
  flowRef,
  beatRef,
  lowTier,
}: {
  colonyRef: React.MutableRefObject<ColonySegment[]>;
  flowRef: React.MutableRefObject<number>;
  beatRef: React.MutableRefObject<number>;
  lowTier?: boolean;
}) {
  const geos = useMemo(() => {
    const spike = (seed: number) => {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const n = 0.72 + 0.42 * Math.abs(Math.sin(x * 7.3 + seed) * Math.cos(y * 6.1 - seed) * Math.sin(z * 8.7 + seed * 2));
        pos.setXYZ(i, x * n * 1.2, y * n * 0.95, z * n);
      }
      geo.computeVertexNormals();
      return geo;
    };
    return [spike(3.7), spike(9.2), spike(14.6), spike(19.9)];
  }, []);
  const initialized = useRef(false);

  const seeds = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        t: AIRWAY_OBJECTIVE_ZONES.colonyT0 + 0.028 + i * 0.026,
        angle: 1.2 + i * 1.15,
        size: 0.55 + (i % 2) * 0.22,
      })),
    []
  );

  if (!initialized.current) {
    colonyRef.current = seeds.map((s) => ({ ...s, hp: 1, ref: null }));
    initialized.current = true;
  }

  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _e = useMemo(() => new THREE.Euler(), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _s = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const beat = beatRef.current;
    const flow = flowRef.current;
    for (const seg of colonyRef.current) {
      if (!seg.ref) continue;
      const alive = seg.hp > 0.001;
      seg.ref.visible = alive;
      if (!alive) continue;
      viralWorld.offsetPoint(seg.t, seg.angle, 0.55, flow, _pos);
      const pulse = 1 + beat * 0.08 + Math.sin(time * 3.1 + seg.t * 40) * 0.03;
      _s.setScalar(seg.size * (0.5 + seg.hp * 0.5) * pulse);
      seg.ref.position.copy(_pos);
      _e.set(time * 0.12 + seg.t * 9, seg.t * 7, 0);
      _q.setFromEuler(_e);
      seg.ref.quaternion.copy(_q);
      seg.ref.scale.copy(_s);
      const mat = seg.ref.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.35 + (1 - seg.hp) * 1.1;
    }
  });

  return (
    <group>
      {seeds.map((s, i) => (
        <mesh
          key={i}
          geometry={geos[i % geos.length]}
          ref={(m) => {
            const seg = colonyRef.current[i];
            if (seg) seg.ref = m;
          }}
        >
          {lowTier ? (
            <meshLambertMaterial color="#5e6e1e" emissive="#2c3a08" />
          ) : (
            <meshStandardMaterial
              color="#6a7a22"
              emissive="#4a5a10"
              emissiveIntensity={0.35}
              roughness={0.5}
              metalness={0.1}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}

/** Airborne particulates — the airway is not a clean room (cheap instancing). */
function DustMotes({ count, flowRef }: { count: number; flowRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    if (count <= 0) return [];
    const rng = (() => {
      let s = 777;
      return () => ((s = (s * 16807) % 2147483647) / 2147483647);
    })();
    return Array.from({ length: count }, () => ({
      t: 0.05 + rng() * 0.9,
      angle: rng() * Math.PI * 2,
      dist: 0.2 + rng() * 0.6,
      speed: 1.6 + rng() * 1.6,
      wobble: rng() * Math.PI * 2,
      scale: 0.02 + rng() * 0.03,
    }));
  }, [count]);

  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _mtx = useMemo(() => new THREE.Matrix4(), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, dt) => {
    if (!ref.current || seeds.length === 0) return;
    const time = state.clock.elapsedTime;
    const dtc = Math.min(dt, 0.05);
    seeds.forEach((s, i) => {
      s.t += (0.014 + flowRef.current * 0.05) * s.speed * dtc;
      if (s.t > 1) s.t -= 1;
      viralWorld.offsetPoint(s.t, s.angle + Math.sin(time * 0.8 + s.wobble) * 0.3, s.dist, 0, _pos);
      _q.setFromEuler(new THREE.Euler(time * 0.7 + s.wobble, time * 0.5, 0));
      _mtx.compose(_pos, _q, new THREE.Vector3(s.scale, s.scale, s.scale));
      ref.current!.setMatrixAt(i, _mtx);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  if (count <= 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#c9b8a0" transparent opacity={0.35} />
    </instancedMesh>
  );
}

/**
 * ALVEOLAR SAC — the mission payoff (the "hero heart" of mission 02): a
 * cluster of translucent alveoli glowing brighter as O2 exchange recovers,
 * with a capillary ring of orbiting RBCs outside.
 */
function AlveolarSac({ flowRef, quality }: { flowRef: React.MutableRefObject<number>; quality: "LOW" | "MEDIUM" | "HIGH" }) {
  const group = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const rbcRing = useRef<THREE.InstancedMesh>(null);

  const layout = useMemo(() => {
    const end = viralWorld.curve.getPointAt(1, new THREE.Vector3());
    const tan = viralWorld.curve.getTangentAt(1, new THREE.Vector3());
    const pos = end.clone().addScaledVector(tan, 11).add(new THREE.Vector3(0, 0.5, 0));
    const quat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), tan.clone().multiplyScalar(-1), new THREE.Vector3(0, 1, 0))
    );
    return { pos, quat };
  }, []);

  const sacs = useMemo(() => {
    const rng = (() => {
      let s = 4242;
      return () => ((s = (s * 16807) % 2147483647) / 2147483647);
    })();
    return Array.from({ length: 7 }, (_, i) => ({
      pos: [
        Math.cos((i / 7) * Math.PI * 2) * (2.2 + rng() * 1.4),
        Math.sin((i / 7) * Math.PI * 2 + rng()) * (1.6 + rng() * 1.2),
        (rng() - 0.5) * 3.4,
      ] as [number, number, number],
      r: 1.5 + rng() * 1.1,
      phase: rng() * Math.PI * 2,
    }));
  }, []);

  const ringSeeds = useMemo(
    () =>
      Array.from({ length: quality === "LOW" ? 10 : 18 }, (_, i) => ({
        a: (i / 18) * Math.PI * 2,
        r: 5.6 + (i % 3) * 0.5,
        speed: 0.25 + (i % 5) * 0.06,
        y: (i % 4) * 0.55 - 0.8,
      })),
    [quality]
  );

  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _mtx = useMemo(() => new THREE.Matrix4(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const flow = flowRef.current;
    const breathe = 1 + Math.sin(time * 1.1) * 0.025;
    group.current?.children.forEach((child, i) => {
      if (i >= sacs.length) return;
      const mesh = child as THREE.Mesh;
      const s = sacs[i];
      const swell = 1 + Math.sin(time * 1.1 + s.phase) * 0.03;
      mesh.scale.setScalar(s.r * breathe * swell);
    });
    if (matRef.current) {
      // dull/inflamed -> bright oxygen transfer as flow restores
      const e = 0.12 + flow * 0.85;
      matRef.current.emissiveIntensity = e;
      matRef.current.emissive.setRGB(0.25 * (0.4 + flow), 0.55 * (0.5 + flow * 0.8), 0.75 * (0.5 + flow * 0.9));
    }
    if (glowRef.current) {
      glowRef.current.intensity = 0.8 + flow * 2.6 + Math.sin(time * 1.1) * 0.2;
    }
    if (rbcRing.current) {
      ringSeeds.forEach((s, i) => {
        const a = s.a + time * s.speed * (0.4 + flow);
        _pos.set(Math.cos(a) * s.r, s.y, Math.sin(a) * s.r);
        _mtx.compose(_pos, new THREE.Quaternion(), new THREE.Vector3(0.24, 0.16, 0.24));
        rbcRing.current!.setMatrixAt(i, _mtx);
      });
      rbcRing.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={group} position={layout.pos} quaternion={layout.quat}>
      {sacs.map((s, i) => (
        <mesh key={i} position={s.pos} scale={s.r}>
          <sphereGeometry args={[1, quality === "LOW" ? 12 : 20, quality === "LOW" ? 10 : 16]} />
          <meshStandardMaterial
            ref={i === 0 ? matRef : undefined}
            color="#b8d8de"
            emissive="#5fb8c8"
            emissiveIntensity={0.3}
            roughness={0.35}
            metalness={0}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
      <pointLight ref={glowRef} intensity={1.2} distance={30} color="#8fe0ef" position={[0, 0, 2]} />
      <instancedMesh ref={rbcRing} args={[undefined, undefined, ringSeeds.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#a01616" emissive="#420808" emissiveIntensity={0.5} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}
