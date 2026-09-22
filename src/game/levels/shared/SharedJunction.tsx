"use client";
/**
 * Shared junction + beacon set (P7): parameterized clones of the heart
 * Junction / TargetBeacon. Each world supplies its spur curve, sign labels
 * and accent colors — the teaching soft-wall stays identical.
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGame } from "@/game/core/state";
import { buildTubeGeometry, TUBE_VERT, TUBE_FRAG_TEMPLATE } from "./SharedTube";
import { HEART_TUBE_THEME } from "./SharedTube";
import type { TubeWorld } from "./world";

/** Canvas-texture sign: mono uppercase label on a translucent medical panel. */
export function makeSignTexture(title: string, sub: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 512, 256);
  g.fillStyle = "rgba(6,10,16,0.72)";
  g.fillRect(8, 8, 496, 240);
  g.strokeStyle = accent;
  g.lineWidth = 6;
  g.strokeRect(8, 8, 496, 240);
  g.fillStyle = accent;
  g.font = "bold 92px monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(title, 256, 108);
  g.font = "34px monospace";
  g.fillStyle = "rgba(255,255,255,0.82)";
  g.fillText(sub, 256, 186);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 2;
  return tex;
}

interface JunctionProps {
  world: TubeWorld;
  spurCurve: THREE.CatmullRomCurve3;
  spurRadiusAt: (t: number) => number;
  spurBaseRadius: number;
  junctionT: number;
  mainSign: { title: string; sub: string; accent: string };
  spurSign: { title: string; sub: string; accent: string };
  capColor: string;
  arrowColor: string;
  lightColor: string;
  lowTier?: boolean;
}

export function SharedJunction({
  world,
  spurCurve,
  spurRadiusAt,
  spurBaseRadius,
  junctionT,
  mainSign,
  spurSign,
  capColor,
  arrowColor,
  lightColor,
  lowTier,
}: JunctionProps) {
  const spurGeo = useMemo(
    () =>
      buildTubeGeometry(
        spurCurve,
        lowTier ? 64 : 110,
        spurBaseRadius,
        spurRadiusAt,
        () => 0,
        lowTier ? 14 : 22
      ),
    [spurCurve, spurRadiusAt, spurBaseRadius, lowTier]
  );

  const layout = useMemo(() => {
    const anchor = world.curve.getPointAt(junctionT, new THREE.Vector3());
    const tan = world.curve.getTangentAt(junctionT, new THREE.Vector3());
    const up = new THREE.Vector3()
      .crossVectors(new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize(), tan)
      .normalize();
    const mainPos = anchor.clone().addScaledVector(tan, 8).addScaledVector(up, world.baseRadius * 0.18);
    const mainQuat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), tan, new THREE.Vector3(0, 1, 0))
    );
    const spurMouth = spurCurve.getPointAt(0.1);
    const spurTan = spurCurve.getTangentAt(0.1);
    const spurQuat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), spurTan, new THREE.Vector3(0, 1, 0))
    );
    const spurEnd = spurCurve.getPointAt(0.99);
    const spurEndTan = spurCurve.getTangentAt(0.99);
    const capQuat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), spurEndTan, new THREE.Vector3(0, 1, 0))
    );
    return { anchor, mainPos, mainQuat, spurMouth, spurQuat, spurEnd, capQuat };
  }, [world, spurCurve, junctionT]);

  const mainTex = useMemo(() => makeSignTexture(mainSign.title, mainSign.sub, mainSign.accent), [mainSign]);
  const spurTex = useMemo(() => makeSignTexture(spurSign.title, spurSign.sub, spurSign.accent), [spurSign]);

  return (
    <group>
      <mesh geometry={spurGeo} frustumCulled={false}>
        <shaderMaterial
          vertexShader={TUBE_VERT}
          fragmentShader={TUBE_FRAG_TEMPLATE(HEART_TUBE_THEME)}
          uniforms={useMemo(
            () => ({
              uTime: { value: 0 },
              uBeat: { value: 0 },
              uFlow: { value: 0.35 },
              uDamagePulse: { value: 0 },
            }),
            []
          )}
          defines={lowTier ? { LOW_TIER: "" } : undefined}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh position={layout.spurEnd} quaternion={layout.capQuat}>
        <circleGeometry args={[spurBaseRadius * 0.42, 20]} />
        <meshStandardMaterial color={capColor} roughness={0.9} />
      </mesh>

      <mesh position={layout.mainPos} quaternion={layout.mainQuat}>
        <planeGeometry args={[5.2, 2.6]} />
        <meshBasicMaterial map={mainTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={layout.spurMouth} quaternion={layout.spurQuat}>
        <planeGeometry args={[3.8, 1.9]} />
        <meshBasicMaterial map={spurTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      {!lowTier && <FlowArrows curve={world.curve} color={arrowColor} />}

      <pointLight position={layout.anchor} intensity={1.1} distance={16} color={lightColor} />
    </group>
  );
}

/** Small flow arrow made of emissive chevrons pointing into the main channel. */
function FlowArrows({ curve, count = 3, color }: { curve: THREE.CatmullRomCurve3; count?: number; color: string }) {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const phase = (time * 0.6 + i / count) % 1;
      const p = curve.getPointAt(0.12 + phase * 0.5);
      mesh.position.copy(p);
      const m = mats.current[i];
      if (m) m.opacity = 0.15 + 0.75 * Math.sin(phase * Math.PI);
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i}>
          <coneGeometry args={[0.34, 0.8, 4]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m;
            }}
            color={color}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Pulsing waypoint beacon anchored in the flow channel. */
export function SharedBeacon({
  world,
  t,
  color,
  visibleWhenObjective,
  flowRef,
}: {
  world: TubeWorld;
  t: number;
  color: string;
  visibleWhenObjective: number;
  flowRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const objectives = useGame((s) => s.objectives);
  const phase = useGame((s) => s.phase);

  const visible =
    phase === "PLAYING" || phase === "OBJECTIVE_COMPLETE" || phase === "EDUCATION_POPUP"
      ? objectives[visibleWhenObjective - 1].done && !objectives[visibleWhenObjective].done
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
    world.offsetPoint(t, 0, 0, flowRef.current, g.position);
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
