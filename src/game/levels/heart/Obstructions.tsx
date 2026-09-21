"use client";
/**
 * Obstructions: plaque buildup + destructible clot segments + scan points
 * (spec §8 gameplay: target clot segments, progressive treatment).
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { offsetPoint } from "@/game/systems/vessel";
import { HEART_OBJECTIVE_ZONES } from "./vessel";

export interface ClotSegment {
  t: number;
  angle: number;
  size: number;
  hp: number; // 1..0 remaining
  ref: THREE.Mesh | null;
}

const _pos = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();

function blobGeometry(seed: number, detail = 1): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n =
      0.72 +
      0.28 * Math.abs(Math.sin(x * 5.1 + seed) * Math.cos(y * 4.3 - seed) * Math.sin(z * 5.7 + seed * 2));
    pos.setXYZ(i, x * n * 1.35, y * n * 0.95, z * n);
  }
  geo.computeVertexNormals();
  return geo;
}

interface Props {
  clotRef: React.MutableRefObject<ClotSegment[]>;
  flowRef: React.MutableRefObject<number>;
  beatRef: React.MutableRefObject<number>;
  lowTier?: boolean;
}

export function Obstructions({ clotRef, flowRef, beatRef, lowTier }: Props) {
  const plaqueGeos = useMemo(() => [blobGeometry(1.7), blobGeometry(4.2), blobGeometry(7.9)], []);
  const clotGeos = useMemo(() => [blobGeometry(11.3, 2), blobGeometry(15.8, 2), blobGeometry(19.4, 2), blobGeometry(23.1, 2)], []);
  const plaqueGroup = useRef<THREE.Group>(null);
  const initialized = useRef(false);

  // clot seeds: 4 segments across the clot zone, clustered on the wall
  const clotSeeds = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        t: HEART_OBJECTIVE_ZONES.clotT0 + 0.028 + i * 0.026,
        angle: 1.2 + i * 1.15,
        size: 0.55 + (i % 2) * 0.22,
      })),
    []
  );

  if (!initialized.current) {
    clotRef.current = clotSeeds.map((s) => ({ ...s, hp: 1, ref: null }));
    initialized.current = true;
  }

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const beat = beatRef.current;
    const flow = flowRef.current;

    // plaque cluster: rough inflations hugging the wall
    plaqueGroup.current?.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const seed = [0.52, 0.565, 0.6][i];
      const angle = 2.2 + i * 1.9;
      const shrink = flow > 0 ? 1 - Math.min(0.42, flow * 0.5) : 1;
      offsetPoint(seed, angle, 0.62, flow, _pos);
      _e.set(time * 0.05 + i, seed * 9, 0);
      _q.setFromEuler(_e);
      const base = [0.85, 1.0, 0.75][i] * shrink;
      _s.set(base, base * 0.8, base * 1.3);
      mesh.position.copy(_pos);
      mesh.quaternion.copy(_q);
      mesh.scale.copy(_s);
    });

    // clot segments: track hp, dissolve when destroyed
    for (const seg of clotRef.current) {
      if (!seg.ref) continue;
      const alive = seg.hp > 0.001;
      seg.ref.visible = alive;
      if (!alive) continue;
      offsetPoint(seg.t, seg.angle, 0.55, flow, _pos);
      const pulse = 1 + beat * 0.08 + Math.sin(time * 3.1 + seg.t * 40) * 0.03;
      _s.setScalar(seg.size * (0.5 + seg.hp * 0.5) * pulse);
      seg.ref.position.copy(_pos);
      seg.ref.scale.copy(_s);
      const mat = seg.ref.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.35 + (1 - seg.hp) * 1.1;
    }
  });

  return (
    <group>
      <group ref={plaqueGroup}>
        {plaqueGeos.map((g, i) => (
          <mesh key={i} geometry={g} castShadow={false}>
            {lowTier ? <meshLambertMaterial color="#9c8a42" emissive="#1a1404" /> : (
              <meshStandardMaterial
                color="#c9b24e"
                emissive="#2c2208"
                emissiveIntensity={0.28}
                roughness={0.85}
                metalness={0.05}
              />
            )}
          </mesh>
        ))}
      </group>
      {clotSeeds.map((s, i) => (
        <mesh
          key={i}
          geometry={clotGeos[i % clotGeos.length]}
          ref={(m) => {
            const seg = clotRef.current[i];
            if (seg) seg.ref = m;
          }}
        >
          {lowTier ? <meshLambertMaterial color="#6e1529" emissive="#3d0a14" /> : (
            <meshStandardMaterial
              color="#5c1020"
              emissive="#7a1226"
              emissiveIntensity={0.35}
              roughness={0.55}
              metalness={0.1}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}
