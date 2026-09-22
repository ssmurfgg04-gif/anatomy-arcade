"use client";
/**
 * Shared flow-particles (P7): parameterized clone of the heart BloodCells —
 * biconcave instanced RBCs + small passengers + large pale cells, theme-colored,
 * with per-mission turbulence zones. Mobile-safe: single instanced buffers,
 * governor-capped live count.
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { TubeWorld, TubeZone } from "./world";

const _pos = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mtx = new THREE.Matrix4();
const _t = new THREE.Vector3();
const _spin = new THREE.Quaternion();
const _upAxis = new THREE.Vector3(0, 1, 0);

export interface CellTheme {
  rbc: string;
  rbcEmissive: string;
  small: string;
  smallEmissive: string;
  big: string;
  bigEmissive: string;
  /** vertical wobble of the flow channel — air in lungs carries floaters wider */
  laneSpread?: number;
}

interface CellSeed {
  t: number;
  angle: number;
  dist: number;
  speed: number;
  scale: number;
  wobblePhase: number;
  spinSpeed: number;
  kind: 0 | 1 | 2; // rbc | small | big
}

function makeTurbulence(zones: TubeZone[], junctionBand: [number, number] | null) {
  return (t: number, cleared: number): number => {
    if (junctionBand && t >= junctionBand[0] && t <= junctionBand[1]) return Math.max(0.28, 0);
    for (const z of zones) {
      if (t >= z.t0 && t <= z.t1) {
        const local = (t - z.t0) / (z.t1 - z.t0);
        const bell = Math.sin(local * Math.PI);
        if (z.id === "damaged") return 1 - 0.7 * cleared;
        if (z.id === "threat") return 1 - cleared;
      }
    }
    return 0;
  };
}

interface Props {
  world: TubeWorld;
  zones: TubeZone[];
  theme: CellTheme;
  countRef: React.MutableRefObject<number>;
  flowRef: React.MutableRefObject<number>;
  playerPos?: THREE.Vector3;
  lowTier?: boolean;
  junctionBand?: [number, number] | null;
  /** fraction of big cells (WBC / macrophage) */
  bigRatio?: number;
}

export function SharedCells({
  world,
  zones,
  theme,
  countRef,
  flowRef,
  playerPos,
  lowTier,
  junctionBand = null,
  bigRatio = 0.022,
}: Props) {
  const rbcRef = useRef<THREE.InstancedMesh>(null);
  const smallRef = useRef<THREE.InstancedMesh>(null);
  const bigRef = useRef<THREE.InstancedMesh>(null);

  const turbulence = useMemo(() => makeTurbulence(zones, junctionBand), [zones, junctionBand]);

  const seeds = useMemo<CellSeed[]>(() => {
    const arr: CellSeed[] = [];
    const rng = (() => {
      let s = 1234567;
      return () => ((s = (s * 16807) % 2147483647) / 2147483647);
    })();
    for (let i = 0; i < countRef.current; i++) {
      const r = rng();
      const kind: 0 | 1 | 2 = r < 0.08 ? 1 : !lowTier && r < 0.08 + bigRatio ? 2 : 0;
      arr.push({
        // 0.06 head start keeps the spawn corridor clear; 0.86 cap keeps the
        // stabilize zone + payoff view calm (VLM round 2)
        t: 0.06 + rng() * 0.8,
        angle: rng() * Math.PI * 2,
        dist: 0.15 + rng() * 0.68,
        speed: 0.8 + rng() * 0.5,
        // size variety with a ceiling: RBCs 0.5-1.3, big cells 1.55-1.9 — the
        // size-difference lesson stays, but no screen-filling blobs
        scale: kind === 2 ? 1.55 + rng() * 0.35 : 0.5 + rng() * 0.8,
        wobblePhase: rng() * Math.PI * 2,
        spinSpeed: (rng() < 0.5 ? -1 : 1) * (0.6 + rng() * 1.8),
        kind,
      });
    }
    return arr;
  }, [countRef, lowTier, bigRatio]);

  const rbcGeo = useMemo(() => {
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

  const colorized = useRef(false);
  const paintInstances = (mesh: THREE.InstancedMesh | null, n: number, kind: "rbc" | "big") => {
    if (!mesh || colorized.current) return;
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      if (kind === "big") {
        const v = 0.85 + (((i * 40503) % 1000) / 1000) * 0.2;
        c.setRGB(0.78 * v, 0.74 * v, 0.68 * v);
      } else {
        const v = 0.82 + (((i * 2654435761) % 1000) / 1000) * 0.42;
        c.setRGB(Math.min(1, 0.63 * v + 0.08), 0.055 * v, 0.07 * v);
      }
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  useFrame((state, dt) => {
    const flow = flowRef.current;
    const baseSpeed = 0.012 + flow * 0.055;
    const time = state.clock.elapsedTime;
    const dtc = Math.min(dt, 0.05);

    let rbcIdx = 0;
    let smallIdx = 0;
    let bigIdx = 0;
    const live = Math.min(seeds.length, countRef.current);
    paintInstances(rbcRef.current, live, "rbc");
    paintInstances(bigRef.current, live, "big");
    const spread = theme.laneSpread ?? 1;
    for (let i = 0; i < live; i++) {
      const s = seeds[i];
      const turb = turbulence(s.t, flow);
      const localSpeed = baseSpeed * s.speed * (1 - 0.85 * turb) * (1 + 0.2 * Math.sin(time * 2 + s.wobblePhase));
      s.t += localSpeed * dtc;
      // recycle BEFORE the payoff corridor: cells never enter the stabilize /
      // cavern view (a seed-time cap cannot hold — flow carries them through)
      if (s.t > 0.86) s.t = 0.06 + (s.t - 0.86);

      const wobbleAmp = 0.05 + turb * 0.5;
      const angle = s.angle + Math.sin(time * (1.2 + turb * 3) + s.wobblePhase) * wobbleAmp;
      const dist = s.dist * spread * (1 + Math.sin(time * 2.4 + s.wobblePhase * 2) * (0.04 + turb * 0.22));

      world.offsetPoint(s.t, angle, dist, flow, _pos);
      world.curve.getTangentAt(s.t, _t);
      _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _t);
      _spin.setFromAxisAngle(_upAxis, time * s.spinSpeed);
      _q.multiply(_spin);

      _scale.setScalar(s.scale * (s.kind === 1 ? 0.38 : 1));

      if (playerPos) {
        const dx = _pos.x - playerPos.x;
        const dy = _pos.y - playerPos.y;
        const dz = _pos.z - playerPos.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        // near-camera smooth shrink: cells dissolve as they reach the rig
        // instead of filling the screen (VLM round 2 — screen-filling blobs)
        if (d2 < 0.9 && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const near = THREE.MathUtils.clamp((d - 0.3) / 0.65, 0, 1);
          const f = ((0.65 - d) / 0.65) * 0.5 * near;
          _pos.x += (dx / d) * f;
          _pos.y += (dy / d) * f;
          _pos.z += (dz / d) * f;
          _scale.multiplyScalar(0.15 + 0.85 * near);
        }
      }

      _mtx.compose(_pos, _q, _scale);
      if (s.kind === 2) {
        bigRef.current?.setMatrixAt(bigIdx++, _mtx);
      } else if (s.kind === 1) {
        smallRef.current?.setMatrixAt(smallIdx++, _mtx);
      } else {
        rbcRef.current?.setMatrixAt(rbcIdx++, _mtx);
      }
    }
    if (rbcRef.current) {
      rbcRef.current.count = rbcIdx;
      rbcRef.current.instanceMatrix.needsUpdate = true;
    }
    if (smallRef.current) {
      smallRef.current.count = smallIdx;
      smallRef.current.instanceMatrix.needsUpdate = true;
    }
    if (bigRef.current) {
      bigRef.current.count = bigIdx;
      bigRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={rbcRef} args={[rbcGeo, undefined, countRef.current]} frustumCulled={false}>
        {lowTier ? (
          <meshLambertMaterial color={theme.rbc} emissive={theme.rbcEmissive} />
        ) : (
          <meshStandardMaterial
            color={theme.rbc}
            emissive={theme.rbcEmissive}
            emissiveIntensity={0.55}
            roughness={0.42}
            metalness={0}
          />
        )}
      </instancedMesh>
      <instancedMesh ref={smallRef} args={[rbcGeo, undefined, countRef.current]} frustumCulled={false}>
        {lowTier ? (
          <meshLambertMaterial color={theme.small} emissive={theme.smallEmissive} />
        ) : (
          <meshStandardMaterial
            color={theme.small}
            emissive={theme.smallEmissive}
            emissiveIntensity={0.25}
            roughness={0.6}
            metalness={0}
          />
        )}
      </instancedMesh>
      {!lowTier && (
        <instancedMesh ref={bigRef} args={[rbcGeo, undefined, countRef.current]} frustumCulled={false}>
          <meshStandardMaterial color={theme.big} emissive={theme.bigEmissive} emissiveIntensity={0.3} roughness={0.5} metalness={0} />
        </instancedMesh>
      )}
    </group>
  );
}
