"use client";
/**
 * BRAIN MISSION (P7, spec §25 arc): cerebral artery through a living neural
 * web. 10-stage stroke-response arc — locate the aneurysm, reinforce the
 * wall, restore neural signal flow. Shared parameterized tube engine.
 */
import { useEffect as useEffectReact, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/game/core/state";
import type { InputState } from "@/game/controls/input";
import { createTubeWorld, resolveScanTarget } from "@/game/levels/shared/world";
import { SharedTube, BRAIN_TUBE_THEME } from "@/game/levels/shared/SharedTube";
import { SharedCells } from "@/game/levels/shared/SharedCells";
import { SharedPlayer, createSharedPlayerRefs } from "@/game/levels/shared/SharedPlayer";
import { SharedJunction, SharedBeacon } from "@/game/levels/shared/SharedJunction";
import {
  NEURAL_POINTS,
  NEURAL_ZONES,
  NEURAL_BASE_RADIUS,
  neuralRadiusAt,
  neuralDamageAt,
  NEURAL_OBJECTIVE_ZONES,
  spurCurve,
  SPUR_BASE_RADIUS,
  spurRadiusAt,
  JUNCTION_T,
} from "./pathway";
import { playLockOn, playDissolveTick, playFlowRestored, playBlip } from "@/audio/sfx";

const RAY = new THREE.Raycaster();
RAY.far = 12;

export interface CoilSegment {
  t: number;
  angle: number;
  size: number;
  hp: number;
  ref: THREE.Mesh | null;
}

export interface BrainRefs {
  player: ReturnType<typeof createSharedPlayerRefs>;
  flow: React.MutableRefObject<number>;
  beat: React.MutableRefObject<number>;
  coil: React.MutableRefObject<CoilSegment[]>;
  hitWall: React.MutableRefObject<number>;
  particleCount: React.MutableRefObject<number>;
  scanTargets: React.MutableRefObject<THREE.Object3D[]>;
  introProgress: React.MutableRefObject<number>;
  introStart: React.MutableRefObject<number>;
  targetDist: React.MutableRefObject<number>;
  dissolved: React.MutableRefObject<boolean>;
}

export function createBrainRefs(particleCount: number): BrainRefs {
  return {
    player: createSharedPlayerRefs(0.015),
    flow: { current: 0 },
    beat: { current: 0 },
    coil: { current: [] },
    hitWall: { current: 0 },
    particleCount: { current: particleCount },
    scanTargets: { current: [] },
    introProgress: { current: 0 },
    introStart: { current: -1 },
    targetDist: { current: -1 },
    dissolved: { current: false },
  };
}

export const neuralWorld = createTubeWorld({
  points: NEURAL_POINTS,
  baseRadius: NEURAL_BASE_RADIUS,
  radiusAt: neuralRadiusAt,
  damageAt: neuralDamageAt,
});

const NEURAL_LEN = neuralWorld.length;
const ANEURYSM_T = 0.68;
const STABILIZE_T = NEURAL_OBJECTIVE_ZONES.stabilizeT;
const NAVIGATE_T = NEURAL_OBJECTIVE_ZONES.navigateT;
const JUNCTION_END_T = NEURAL_OBJECTIVE_ZONES.junctionEndT;
const CALIBRATE_T = NEURAL_OBJECTIVE_ZONES.calibrateT;
const LOCATE_T = NEURAL_OBJECTIVE_ZONES.locateT;

const SPUR_SAMPLES = Array.from({ length: 10 }, (_, i) => spurCurve.getPointAt(0.05 + (i / 9) * 0.9));

interface Props {
  refs: BrainRefs;
  input: React.MutableRefObject<InputState>;
  quality: "LOW" | "MEDIUM" | "HIGH";
}

export function BrainMission({ refs, input, quality }: Props) {
  const { camera } = useThree();
  const heartbeatT = useRef(0);
  const stabilizeHold = useRef(0);
  const scanCooldown = useRef(0);
  const scanLatch = useRef(false);
  const scanTap = useRef(false);
  const aimCoil = useRef(false);
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

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, quality === "LOW" ? 0.22 : 0.05);
    const g = useGame.getState();
    const time = state.clock.elapsedTime;

    if (input.current.suspended) return;

    // neural "pulse" driver: a slow theta-rhythm swell (brainwave, not heartbeat)
    const flow = refs.flow.current;
    const rhythmRate = 0.14 + flow * 0.08;
    heartbeatT.current += (dt * rhythmRate * 60) / 60;
    const beat = Math.max(0, Math.sin((heartbeatT.current % 1) * Math.PI * 2)) ** 3;
    refs.beat.current = beat * 0.5;

    // intro cinematic: rail into the cerebral vessel
    if (g.phase === "MISSION_INTRO") {
      if (refs.introStart.current < 0) refs.introStart.current = state.clock.elapsedTime;
      const t = Math.min(1, (state.clock.elapsedTime - refs.introStart.current) / 5.2);
      refs.introProgress.current = t;
      const railT = -0.004 + t * 0.028;
      const clamped = THREE.MathUtils.clamp(railT, 0, 1);
      const center = neuralWorld.curve.getPointAt(clamped, new THREE.Vector3());
      const ahead = neuralWorld.curve.getPointAt(THREE.MathUtils.clamp(clamped + 0.02, 0, 1), new THREE.Vector3());
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
        g.completeObjective(1); // 02 ENTER NEURAL PATHWAY
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

    const t10 = refs.player.t;
    if (!g.objectives[2].done) {
      refs.targetDist.current = Math.max(0, (NAVIGATE_T - t10) * NEURAL_LEN);
    } else if (!g.objectives[3].done) {
      refs.targetDist.current = Math.max(0, (JUNCTION_END_T - t10) * NEURAL_LEN);
    } else if (!g.objectives[4].done) {
      refs.targetDist.current = Math.max(0, (CALIBRATE_T - t10) * NEURAL_LEN);
    } else if (!g.objectives[9].done) {
      refs.targetDist.current =
        Math.max(0, (t10 < ANEURYSM_T ? ANEURYSM_T - t10 : 0) * NEURAL_LEN) +
        (t10 >= STABILIZE_T ? 0 : Math.max(0, (STABILIZE_T - t10) * NEURAL_LEN));
    } else {
      refs.targetDist.current = -1;
    }

    // ---- stage 02: NAVIGATE THE NEURAL NETWORK ----
    if (!g.objectives[2].done) {
      g.setObjectiveProgress(2, Math.min(1, t10 / NAVIGATE_T));
      if (t10 >= NAVIGATE_T) g.completeObjective(2);
    }

    // ---- stage 03: IDENTIFY THE ARTERY BRANCH ----
    if (!g.objectives[3].done) {
      if (t10 >= JUNCTION_END_T) {
        g.completeObjective(3);
        g.addScore(250);
      }
    }

    // ---- ACA spur soft wall ----
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

    // ---- aim-at-wall feedback ----
    const treatPhase = g.objectives[6].done && !g.objectives[7].done;
    if (treatPhase) {
      RAY.setFromCamera(new THREE.Vector2(0, 0), camera);
      let aiming = false;
      for (const seg of refs.coil.current) {
        if (seg.hp <= 0 || !seg.ref) continue;
        if (RAY.intersectObject(seg.ref, false).length > 0) {
          aiming = true;
          break;
        }
      }
      if (aiming !== aimCoil.current) {
        aimCoil.current = aiming;
        if (aiming) playLockOn();
        window.dispatchEvent(new CustomEvent("aa-aim-clot", { detail: { aiming } }));
      }
      if (aiming && (input.current.interact || input.current.tInteract)) {
        window.dispatchEvent(new CustomEvent("aa-dissolve-progress"));
      }
    } else if (aimCoil.current) {
      aimCoil.current = false;
      window.dispatchEvent(new CustomEvent("aa-aim-clot", { detail: { aiming: false } }));
    }

    // ---- stage 05: LOCATE THE ANEURYSM ----
    if (!g.objectives[5].done && t10 >= LOCATE_T) {
      g.completeObjective(5);
      g.addScore(150);
    }

    // ---- stage 07: REINFORCE THE VESSEL WALL ----
    if (g.objectives[6].done && !g.objectives[7].done) {
      const holding = input.current.interact || input.current.tInteract;
      if (holding) {
        let dissolvedThisFrame = 0;
        RAY.setFromCamera(new THREE.Vector2(0, 0), camera);
        for (const seg of refs.coil.current) {
          if (seg.hp <= 0) continue;
          const mesh = seg.ref;
          if (!mesh) continue;
          const hit = RAY.intersectObject(mesh, false);
          if (hit.length > 0) {
            seg.hp = Math.max(0, seg.hp - dt * 0.34);
            dissolvedThisFrame += dt * 0.34;
            g.setObjectiveProgress(7, 1 - refs.coil.current.reduce((a, s) => a + s.hp, 0) / refs.coil.current.length);
          }
        }
        if (dissolvedThisFrame > 0) {
          g.addScore(Math.round(dissolvedThisFrame * 90));
          const p = 1 - refs.coil.current.reduce((a, s) => a + s.hp, 0) / refs.coil.current.length;
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
      const allClear = refs.coil.current.every((s) => s.hp <= 0);
      if (allClear && !g.objectives[7].done) {
        dissolveTick.current = 0;
        g.completeObjective(7);
      }
    }

    // ---- stage 08: RESTORE SIGNAL FLOW ----
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
      const dead = refs.coil.current.filter((s) => s.hp <= 0).length;
      const partial = (dead / refs.coil.current.length) * 0.28;
      refs.flow.current = Math.max(refs.flow.current, partial);
      g.setFlowHealth(refs.flow.current);
    }

    // ---- stage 09: STABILIZE NEURAL ACTIVITY ----
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

    // ---- perfusion drift while the aneurysm threatens ----
    const liveG = useGame.getState();
    if (!liveG.objectives[8].done) {
      g.setPatientStatus(liveG.patientStatus - dt * 0.12);
    }
  });

  const scanPoints = useMemo(
    () => [
      { t: 0.12, angle: 2.6, dist: 0.72, id: "vesselWall", organ: "artery wall" },
      { t: 0.33, angle: 0.8, dist: 0.5, id: "redBloodCell", organ: "red blood cell" },
      { t: 0.345, angle: 1.9, dist: 0.58, id: "neuron", organ: "neuron" },
      { t: 0.5, angle: -2.2, dist: 0.55, id: "axon", organ: "axon fiber" },
      { t: 0.55, angle: 2.2, dist: 0.62, id: "weakWall", organ: "weakened wall" },
      { t: 0.68, angle: 1.2, dist: 0.5, id: "aneurysm", organ: "aneurysm" },
      { t: 0.88, angle: -0.6, dist: 0.6, id: "synapse", organ: "synaptic terminal" },
    ],
    []
  );

  const markers = useMemo(() => scanPoints.map((m) => ({ ...m, pos: new THREE.Vector3() })), [scanPoints]);

  useEffectReact(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__aaTp = (t: number, ang = 0, dist = 0.3) => {
      const pos = neuralWorld.offsetPoint(t, ang, dist, 0);
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
      const end = neuralWorld.curve.getPointAt(1, new THREE.Vector3());
      const tan = neuralWorld.curve.getTangentAt(1, new THREE.Vector3());
      const p = end.addScaledVector(tan, 11).add(new THREE.Vector3(0, 0.5, 0));
      (w.__aaAimWorld as (x: number, y: number, z: number) => void)(p.x, p.y, p.z);
    };
    w.__aaAimAt = (t: number, ang: number, dist: number) => {
      const target = neuralWorld.offsetPoint(t, ang, dist, 0);
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
        args={["#0a0a18", quality === "LOW" ? 0.013 : quality === "MEDIUM" ? 0.017 : 0.021]}
      />
      <SharedTube
        world={neuralWorld}
        zones={NEURAL_ZONES}
        theme={BRAIN_TUBE_THEME}
        segments={quality === "LOW" ? 200 : quality === "MEDIUM" ? 360 : 520}
        beatRef={refs.beat}
        flowRef={refs.flow}
        lowTier={quality === "LOW"}
      />
      <SharedJunction
        world={neuralWorld}
        spurCurve={spurCurve}
        spurRadiusAt={spurRadiusAt}
        spurBaseRadius={SPUR_BASE_RADIUS}
        junctionT={JUNCTION_T}
        mainSign={{ title: "MCA", sub: "MIDDLE CEREBRAL — DISTAL BRANCH", accent: "#2DD9E8" }}
        spurSign={{ title: "ACA", sub: "ANTERIOR CEREBRAL — CLEAR", accent: "#6a5a8a" }}
        capColor="#140b22"
        arrowColor="#8f8fe8"
        lightColor="#8f6fd8"
        lowTier={quality === "LOW"}
      />
      <SharedCells
        world={neuralWorld}
        zones={NEURAL_ZONES}
        theme={{
          rbc: "#8e1420",
          rbcEmissive: "#30060a",
          small: "#9a8ec2",
          smallEmissive: "#1e1836",
          big: "#c9c2b6",
          bigEmissive: "#26222c",
        }}
        countRef={particleCount}
        flowRef={refs.flow}
        playerPos={refs.player.pos}
        lowTier={quality === "LOW"}
        junctionBand={[0.29, 0.41]}
        bigRatio={0.012}
      />
      <NeuralWeb flowRef={refs.flow} quality={quality} />
      <WeakWall coilRef={refs.coil} flowRef={refs.flow} beatRef={refs.beat} lowTier={quality === "LOW"} />
      <SharedPlayer
        world={neuralWorld}
        player={refs.player}
        input={input}
        flowRef={refs.flow}
        beatRef={refs.beat}
        hitWallRef={refs.hitWall}
        quality={quality}
      />
      {markers.map((m, i) => {
        const pos = neuralWorld.offsetPoint(m.t, m.angle, m.dist, 0);
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
              color={m.id === "aneurysm" || m.id === "weakWall" ? "#ff4a5e" : "#2DD9E8"}
              emissive={m.id === "aneurysm" || m.id === "weakWall" ? "#ff4a5e" : "#2DD9E8"}
              emissiveIntensity={1.6}
            />
          </mesh>
        );
      })}
      <ambientLight intensity={0.5} color="#181230" />
      <hemisphereLight args={["#141031", "#0a0614", 0.4]} />
      <pointLight position={[0, 1.5, 8]} intensity={2.2 + refs.beat.current * 2.4} distance={34} color="#7a5ae0" />
      <pointLight position={[0, 0, -70]} intensity={0.9} distance={40} color="#2DD9E8" />
      {quality !== "LOW" && (
        <pointLight
          position={neuralWorld.curve.getPointAt(0.55, new THREE.Vector3()).toArray()}
          intensity={1.4}
          distance={18}
          color="#ff4a5e"
        />
      )}
      <SynapseCavern flowRef={refs.flow} quality={quality} />
      <SharedBeacon world={neuralWorld} t={NAVIGATE_T} color="#2DD9E8" visibleWhenObjective={2} flowRef={refs.flow} />
      <SharedBeacon world={neuralWorld} t={JUNCTION_END_T} color="#2DD9E8" visibleWhenObjective={3} flowRef={refs.flow} />
      <SharedBeacon world={neuralWorld} t={ANEURYSM_T} color="#ffb020" visibleWhenObjective={5} flowRef={refs.flow} />
      <SharedBeacon world={neuralWorld} t={ANEURYSM_T} color="#ffb020" visibleWhenObjective={6} flowRef={refs.flow} />
      <SharedBeacon world={neuralWorld} t={STABILIZE_T} color="#2DD9E8" visibleWhenObjective={9} flowRef={refs.flow} />
    </group>
  );
}

/**
 * NEURAL WEB — the living brain around the vessel: emissive axon strands
 * running parallel outside the tube, with traveling signal pulses whose speed
 * and brightness follow flow health (stage 08 payoff: you SEE the signal
 * return). LOW tier: fewer strands, dimmer pulses.
 */
function NeuralWeb({ flowRef, quality }: { flowRef: React.MutableRefObject<number>; quality: "LOW" | "MEDIUM" | "HIGH" }) {
  const strandCount = quality === "LOW" ? 5 : 9;
  const pulsesPer = quality === "LOW" ? 2 : 3;

  const strands = useMemo(() => {
    const arr: { curve: THREE.CatmullRomCurve3; geo: THREE.TubeGeometry; angle: number; offset: number; wave: number }[] = [];
    for (let i = 0; i < strandCount; i++) {
      const angle = (i / strandCount) * Math.PI * 2 + 0.35;
      const offset = 3.2 + (i % 3) * 1.5;
      const wave = 0.5 + (i % 4) * 0.3;
      const pts: THREE.Vector3[] = [];
      const n = 14;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const base = neuralWorld.curve.getPointAt(t, new THREE.Vector3());
        const tan = neuralWorld.curve.getTangentAt(t, new THREE.Vector3());
        const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
        if (right.lengthSq() < 0.01) right.set(1, 0, 0);
        const up = new THREE.Vector3().crossVectors(right, tan).normalize();
        const wob = Math.sin(t * 9 + i * 1.7) * wave * 0.4;
        base.addScaledVector(right, Math.cos(angle) * (offset + wob));
        base.addScaledVector(up, Math.sin(angle) * (offset + wob));
        pts.push(base);
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      arr.push({ curve, geo: new THREE.TubeGeometry(curve, 48, 0.055, 5, false), angle, offset, wave });
    }
    return arr;
  }, [strandCount]);

  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pulseSeeds = useMemo(() => {
    const arr: { strand: number; phase: number; speed: number }[] = [];
    strands.forEach((_, si) => {
      for (let p = 0; p < pulsesPer; p++) {
        arr.push({ strand: si, phase: (p / pulsesPer + si * 0.13) % 1, speed: 0.05 + ((si + p) % 4) * 0.015 });
      }
    });
    return arr;
  }, [strands, pulsesPer]);

  const pulseMats = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame((_, dt) => {
    const flow = flowRef.current;
    const dtc = Math.min(dt, 0.05);
    pulseSeeds.forEach((s, i) => {
      const mesh = pulseRefs.current[i];
      if (!mesh) return;
      s.phase += s.speed * (0.25 + flow * 1.5) * dtc;
      if (s.phase > 1) s.phase -= 1;
      const strand = strands[s.strand];
      strand.curve.getPointAt(s.phase, mesh.position);
      const m = pulseMats.current[i];
      if (m) {
        // dark before treatment; bright traveling signal after
        const target = 0.12 + flow * 0.88;
        m.opacity += (target - m.opacity) * Math.min(1, dtc * 3);
      }
    });
  });

  return (
    <group>
      {strands.map((s, i) => (
        <mesh key={i} geometry={s.geo}>
          <meshBasicMaterial color="#3d2e70" transparent opacity={0.55} toneMapped={false} />
        </mesh>
      ))}
      {pulseSeeds.map((s, i) => (
        <mesh
          key={`p${i}`}
          ref={(m) => {
            pulseRefs.current[i] = m;
          }}
        >
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) pulseMats.current[i] = m;
            }}
            color="#7ee0f0"
            transparent
            opacity={0.12}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Weak-wall segments (treat targets): inflamed bulge patches inside the aneurysm. */
function WeakWall({
  coilRef,
  flowRef,
  beatRef,
  lowTier,
}: {
  coilRef: React.MutableRefObject<CoilSegment[]>;
  flowRef: React.MutableRefObject<number>;
  beatRef: React.MutableRefObject<number>;
  lowTier?: boolean;
}) {
  const geos = useMemo(() => {
    const patch = (seed: number) => {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const n = 0.8 + 0.3 * Math.abs(Math.sin(x * 6.1 + seed) * Math.cos(y * 5.3 - seed) * Math.sin(z * 6.7 + seed * 2));
        pos.setXYZ(i, x * n, y * n * 0.85, z * n);
      }
      geo.computeVertexNormals();
      return geo;
    };
    return [patch(2.9), patch(8.4), patch(12.7), patch(17.3)];
  }, []);
  const initialized = useRef(false);

  const seeds = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        t: NEURAL_OBJECTIVE_ZONES.aneurysmT0 + 0.028 + i * 0.026,
        angle: 1.2 + i * 1.15,
        // larger than heart/viral targets: the bulge inflates the wall they sit on
        size: 0.72 + (i % 2) * 0.22,
      })),
    []
  );

  if (!initialized.current) {
    coilRef.current = seeds.map((s) => ({ ...s, hp: 1, ref: null }));
    initialized.current = true;
  }

  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _s = useMemo(() => new THREE.Vector3(), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _e = useMemo(() => new THREE.Euler(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const beat = beatRef.current;
    const flow = flowRef.current;
    for (const seg of coilRef.current) {
      if (!seg.ref) continue;
      const alive = seg.hp > 0.001;
      seg.ref.visible = alive;
      if (!alive) continue;
      // patches sit on the 0.62 aim convention (matches beacon/aim math);
      // they tuck toward the wall as the reinforcement matrix takes hold
      neuralWorld.offsetPoint(seg.t, seg.angle, 0.62 - 0.12 * flow, flow, _pos);
      const pulse = 1 + beat * 0.08 + Math.sin(time * 3.1 + seg.t * 40) * 0.03;
      _s.setScalar(seg.size * (0.5 + seg.hp * 0.5) * pulse);
      seg.ref.position.copy(_pos);
      _e.set(time * 0.05 + seg.t * 9, seg.t * 7, 0);
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
            const seg = coilRef.current[i];
            if (seg) seg.ref = m;
          }}
        >
          {lowTier ? (
            <meshLambertMaterial color="#701826" emissive="#3c0a14" />
          ) : (
            <meshStandardMaterial
              color="#6e1529"
              emissive="#8a1230"
              emissiveIntensity={0.4}
              roughness={0.55}
              metalness={0.1}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}

/**
 * SYNAPSE CAVERN — the brain mission payoff (the "hero heart" of mission 03):
 * a glowing neuron soma with radiating dendrites; a signal ring fires across
 * it once flow restores.
 */
function SynapseCavern({ flowRef, quality }: { flowRef: React.MutableRefObject<number>; quality: "LOW" | "MEDIUM" | "HIGH" }) {
  const group = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const layout = useMemo(() => {
    const end = neuralWorld.curve.getPointAt(1, new THREE.Vector3());
    const tan = neuralWorld.curve.getTangentAt(1, new THREE.Vector3());
    const pos = end.clone().addScaledVector(tan, 11).add(new THREE.Vector3(0, 0.5, 0));
    const quat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), tan.clone().multiplyScalar(-1), new THREE.Vector3(0, 1, 0))
    );
    return { pos, quat };
  }, []);

  const dendrites = useMemo(() => {
    const arr: THREE.TubeGeometry[] = [];
    const n = quality === "LOW" ? 5 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const r = t * 6.5;
        pts.push(
          new THREE.Vector3(
            Math.cos(a + Math.sin(t * 4 + i) * 0.4) * r,
            Math.sin(a * 1.3 + t * 2.2) * 2.2 * t,
            Math.sin(a + Math.sin(t * 3 + i) * 0.5) * r
          )
        );
      }
      arr.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.14 - t0safe(i), 5, false));
    }
    return arr;
    function t0safe(i: number) {
      return i * 0.004;
    }
  }, [quality]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const flow = flowRef.current;
    if (nucleusRef.current) {
      const s = 1 + Math.sin(time * 1.4) * 0.05 * (0.4 + flow);
      nucleusRef.current.scale.setScalar(s);
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      ringRef.current.visible = flow > 0.15;
      const phase = (time * (0.2 + flow * 0.8)) % 1;
      ringRef.current.scale.setScalar(1.5 + phase * 7);
      mat.opacity = 0.55 * (1 - phase) * Math.min(1, flow * 1.6);
    }
    if (glowRef.current) {
      glowRef.current.intensity = 0.9 + flow * 2.2;
    }
  });

  return (
    <group ref={group} position={layout.pos} quaternion={layout.quat}>
      {/* soma */}
      <mesh>
        <sphereGeometry args={[3.2, quality === "LOW" ? 14 : 24, quality === "LOW" ? 12 : 20]} />
        <meshStandardMaterial color="#4a3a80" emissive="#2a1a55" emissiveIntensity={0.85} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* nucleus */}
      <mesh ref={nucleusRef}>
        <sphereGeometry args={[1.1, 14, 12]} />
        <meshStandardMaterial color="#7ee0f0" emissive="#2fa8c0" emissiveIntensity={1.2} roughness={0.3} />
      </mesh>
      {dendrites.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#41307a" emissive="#2c2070" emissiveIntensity={0.95} roughness={0.5} />
        </mesh>
      ))}
      {/* expanding signal ring — fires when the pathway is perfused */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 40]} />
        <meshBasicMaterial color="#7ee0f0" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight ref={glowRef} intensity={1.4} distance={34} color="#9a7ef0" position={[0, 1, 3]} />
      <pointLight intensity={1.1} distance={26} color="#5a4ab0" position={[0, -2, -4]} />
    </group>
  );
}
