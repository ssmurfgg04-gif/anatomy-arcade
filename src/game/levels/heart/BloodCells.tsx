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

interface CellSeed {
  t: number;
  angle: number;
  dist: number; // 0..1 fraction of local radius
  speed: number; // multiplier
  scale: number;
  tumble: THREE.Euler;
  isPlatelet: boolean;
  wobblePhase: number;
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
  lowTier,
}: {
  count: number;
  countRef: React.MutableRefObject<number>;
  flowRef: React.MutableRefObject<number>;
  beatRef: React.MutableRefObject<number>;
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
      });
    }
    return arr;
  }, [countRef]);

  const rbcGeo = useMemo(() => {
    // biconcave-ish disc via lathe — cheap, readable silhouette
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI;
      pts.push(new THREE.Vector2(Math.sin(a) * 0.5, Math.cos(a) * 0.16 - 0.02));
    }
    return new THREE.LatheGeometry(pts.reverse(), 14);
  }, []);

  useFrame((state, dt) => {
    const flow = flowRef.current;
    const baseSpeed = 0.012 + flow * 0.055; // t units/sec
    const time = state.clock.elapsedTime;
    const dtc = Math.min(dt, 0.05);

    let rbcIdx = 0;
    let pltIdx = 0;
    for (const s of seeds) {
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
