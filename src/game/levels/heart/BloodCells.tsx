"use client";
/**
 * Blood cells — GPU-instanced erythrocytes + platelets flowing along the vessel
 * (spec §25: instancing, variation, flow-health driven behavior).
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { vesselCurve, offsetPoint } from "@/game/systems/vessel";
import { HEART_VESSEL_ZONES } from "./vessel";

const _pos = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mtx = new THREE.Matrix4();
const _t = new THREE.Vector3();
const _spin = new THREE.Quaternion();
const _upAxis = new THREE.Vector3(0, 1, 0);

interface CellSeed {
  t: number;
  angle: number;
  dist: number; // 0..1 fraction of local radius
  speed: number; // multiplier
  scale: number;
  tumble: THREE.Euler;
  isPlatelet: boolean;
  wobblePhase: number;
  spinSpeed: number; // constant per-instance roll rate (L27 wind law)
}

function turbulenceAt(t: number, cleared: number): number {
  for (const z of HEART_VESSEL_ZONES) {
    if (t >= z.t0 && t <= z.t1) {
      const local = (t - z.t0) / (z.t1 - z.t0);
      const bell = Math.sin(local * Math.PI);
      if (z.id === "plaque") return 1 - 0.7 * cleared;
      if (z.id === "clot") return 1 - cleared;
    }
  }
  return 0;
}

export function BloodCells({
  countRef,
  flowRef,
  beatRef,
  playerPos,
  lowTier,
}: {
  count: number;
  countRef: React.MutableRefObject<number>;
  flowRef: React.MutableRefObject<number>;
  beatRef: React.MutableRefObject<number>;
  playerPos?: THREE.Vector3;
  lowTier?: boolean;
}) {
  const rbcRef = useRef<THREE.InstancedMesh>(null);
  const pltRef = useRef<THREE.InstancedMesh>(null);

  const seeds = useMemo<CellSeed[]>(() => {
    const arr: CellSeed[] = [];
    const rng = (() => {
      let s = 1234567;
      return () => ((s = (s * 16807) % 2147483647) / 2147483647);
    })();
    for (let i = 0; i < countRef.current; i++) {
      const isPlatelet = rng() < 0.08;
      // keep the spawn corridor (t < 0.06) clear so the first view is open vessel
      arr.push({
        t: 0.06 + rng() * 0.94,
        angle: rng() * Math.PI * 2,
        dist: 0.15 + rng() * 0.68,
        speed: 0.8 + rng() * 0.5,
        scale: 0.8 + rng() * 0.5,
        tumble: new THREE.Euler(rng() * 6.3, rng() * 6.3, rng() * 6.3),
        isPlatelet,
        wobblePhase: rng() * Math.PI * 2,
        spinSpeed: (rng() < 0.5 ? -1 : 1) * (0.6 + rng() * 1.8),
      });
    }
    return arr;
  }, [countRef]);

  const rbcGeo = useMemo(() => {
    // TRUE biconcave disc (L25): thick rim, dimpled center — the RBC silhouette
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.0, -0.05),
      new THREE.Vector2(0.18, -0.062),
      new THREE.Vector2(0.34, -0.075),
      new THREE.Vector2(0.46, -0.045),
      new THREE.Vector2(0.5, 0.0),
      new THREE.Vector2(0.46, 0.045),
      new THREE.Vector2(0.34, 0.075),
      new THREE.Vector2(0.18, 0.062),
      new THREE.Vector2(0.0, 0.05),
    ];
    return new THREE.LatheGeometry(pts, lowTier ? 10 : 14);
  }, [lowTier]);

  // one-time per-instance color variance (deep-red spread, zero per-frame cost)
  const colorized = useRef(false);
  const paintInstances = (mesh: THREE.InstancedMesh | null, n: number) => {
    if (!mesh || colorized.current) return;
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const v = 0.82 + ((i * 2654435761) % 1000) / 1000 * 0.42; // deterministic hash
      c.setRGB(Math.min(1, 0.63 * v + 0.08), 0.055 * v, 0.07 * v);
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  useFrame((state, dt) => {
    const flow = flowRef.current;
    const baseSpeed = 0.012 + flow * 0.055; // t units/sec
    const time = state.clock.elapsedTime;
    const dtc = Math.min(dt, 0.05);

    let rbcIdx = 0;
    let pltIdx = 0;
    // governor count cap (L6): instance buffer may exceed the live count
    const live = Math.min(seeds.length, countRef.current);
    paintInstances(rbcRef.current, live);
    for (let i = 0; i < live; i++) {
      const s = seeds[i];
      // flow velocity: slowed + recirculating near obstructions until cleared
      const turb = turbulenceAt(s.t, flow);
      const localSpeed = baseSpeed * s.speed * (1 - 0.85 * turb) * (1 + 0.2 * Math.sin(time * 2 + s.wobblePhase));
      s.t += localSpeed * dtc;
      if (s.t > 1) s.t -= 1;

      // wobble: strong where turbulent (before treatment), gentle when healthy
      const wobbleAmp = 0.05 + turb * 0.5;
      const angle = s.angle + Math.sin(time * (1.2 + turb * 3) + s.wobblePhase) * wobbleAmp;
      const dist = s.dist * (1 + Math.sin(time * 2.4 + s.wobblePhase * 2) * (0.04 + turb * 0.22));

      offsetPoint(s.t, angle, dist, flow, _pos);
      vesselCurve.getTangentAt(s.t, _t);
      _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _t);
      // constant-rate roll around the flow axis (L25/L27 — cells tumble as they travel)
      _spin.setFromAxisAngle(_upAxis, time * s.spinSpeed);
      _q.multiply(_spin);

      // player wake (L25 SDF wake): cells part and swirl around the robot
      if (playerPos) {
        const dx = _pos.x - playerPos.x;
        const dy = _pos.y - playerPos.y;
        const dz = _pos.z - playerPos.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.42 && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const f = ((0.65 - d) / 0.65) * 0.5;
          _pos.x += (dx / d) * f;
          _pos.y += (dy / d) * f;
          _pos.z += (dz / d) * f;
        }
      }

      _scale.setScalar(s.scale * (s.isPlatelet ? 0.38 : 1));
      _mtx.compose(_pos, _q, _scale);
      if (s.isPlatelet) {
        pltRef.current?.setMatrixAt(pltIdx++, _mtx);
      } else {
        rbcRef.current?.setMatrixAt(rbcIdx++, _mtx);
      }
    }
    if (rbcRef.current) {
      rbcRef.current.count = rbcIdx;
      rbcRef.current.instanceMatrix.needsUpdate = true;
    }
    if (pltRef.current) {
      pltRef.current.count = pltIdx;
      pltRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* red blood cells */}
      <instancedMesh ref={rbcRef} args={[rbcGeo, undefined, countRef.current]} frustumCulled={false}>
        {lowTier ? (
          <meshLambertMaterial color="#b32020" emissive="#2a0505" />
        ) : (
          <meshStandardMaterial
            color="#a01616"
            emissive="#420808"
            emissiveIntensity={0.55}
            roughness={0.42}
            metalness={0}
          />
        )}
      </instancedMesh>
      {/* platelets */}
      <instancedMesh ref={pltRef} args={[rbcGeo, undefined, countRef.current]} frustumCulled={false}>
        {lowTier ? (
          <meshLambertMaterial color="#c4a06a" emissive="#201408" />
        ) : (
          <meshStandardMaterial
            color="#a67c4e"
            emissive="#2e1d0c"
            emissiveIntensity={0.25}
            roughness={0.6}
            metalness={0}
          />
        )}
      </instancedMesh>
    </group>
  );
}
