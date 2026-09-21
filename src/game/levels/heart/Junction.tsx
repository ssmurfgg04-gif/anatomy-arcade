"use client";
/**
 * Branch junction (spec: living bloodstream — vessels BRANCH; and the 10-stage
 * arc stage 04 "IDENTIFY THE CORONARY ARTERY"). The main tube is the LAD; this
 * renders the LCX spur (a tapering dead-end) plus diegetic arterial signage so
 * the player reads the choice in-world, not in a menu.
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { vesselCurve } from "@/game/systems/vessel";
import { spurCurve, spurRadiusAt, SPUR_BASE_RADIUS, JUNCTION_T } from "./vessel";
import { buildTubeGeometry, TUBE_VERT, TUBE_FRAG } from "./VesselTube";
import { VESSEL_BASE_RADIUS } from "./vessel";

/** Canvas-texture sign: mono uppercase label on a translucent medical panel. */
function makeSignTexture(title: string, sub: string, accent: string): THREE.CanvasTexture {
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

/** Small flow arrow made of emissive chevrons pointing into a branch. */
function FlowArrows({ curve, count = 3 }: { curve: THREE.CatmullRomCurve3; count?: number }) {
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
            color="#ff5a6e"
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Junction({ lowTier }: { lowTier?: boolean }) {
  const spurGeo = useMemo(
    () => buildTubeGeometry(spurCurve, lowTier ? 64 : 110, spurRadiusAt, () => 0, SPUR_BASE_RADIUS, lowTier ? 14 : 22),
    [lowTier]
  );

  // junction anchor + tangent basis for sign placement
  const layout = useMemo(() => {
    const anchor = new THREE.Vector3();
    const tan = new THREE.Vector3();
    vesselCurve.getPointAt(JUNCTION_T, anchor);
    vesselCurve.getTangentAt(JUNCTION_T, tan);
    const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, tan).normalize();
    const radius = VESSEL_BASE_RADIUS;
    // main (correct) sign: holo-style, floating IN the flow channel ahead
    const ladPos = anchor.clone().addScaledVector(tan, 8).addScaledVector(up, radius * 0.18);
    const ladQuat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), tan, new THREE.Vector3(0, 1, 0))
    );
    // spur sign: just inside the spur opening, facing back at the player
    const spurMouth = spurCurve.getPointAt(0.1);
    const spurTan = spurCurve.getTangentAt(0.1);
    const lcxQuat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), spurTan, new THREE.Vector3(0, 1, 0))
    );
    // dead-end cap disc
    const spurEnd = spurCurve.getPointAt(0.99);
    const spurEndTan = spurCurve.getTangentAt(0.99);
    const capQuat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), spurEndTan, new THREE.Vector3(0, 1, 0))
    );
    return { anchor, ladPos, ladQuat, spurMouth, lcxQuat, spurEnd, capQuat };
  }, []);

  const ladTex = useMemo(() => makeSignTexture("LAD", "LEFT ANTERIOR DESCENDING", "#2DD9E8"), []);
  const lcxTex = useMemo(() => makeSignTexture("LCX", "CIRCUMFLEX — CLEAR", "#8a5460"), []);

  return (
    <group>
      {/* LCX spur tube — renders from inside like the main vessel */}
      <mesh geometry={spurGeo} frustumCulled={false}>
        <shaderMaterial
          vertexShader={TUBE_VERT}
          fragmentShader={TUBE_FRAG}
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

      {/* dead-end cap (endothelium closure) */}
      <mesh position={layout.spurEnd} quaternion={layout.capQuat}>
        <circleGeometry args={[SPUR_BASE_RADIUS * 0.42, 20]} />
        <meshStandardMaterial color="#2a0a10" roughness={0.9} />
      </mesh>

      {/* signage — oversized holo-panels so cells never fully hide them */}
      <mesh position={layout.ladPos} quaternion={layout.ladQuat}>
        <planeGeometry args={[5.2, 2.6]} />
        <meshBasicMaterial map={ladTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={layout.spurMouth} quaternion={layout.lcxQuat}>
        <planeGeometry args={[3.8, 1.9]} />
        <meshBasicMaterial map={lcxTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      {/* flow arrows guide the eye down the LAD */}
      {!lowTier && <FlowArrows curve={vesselCurve} />}

      {/* junction mixing light (cool tint — oxygenated blood mixes here) */}
      <pointLight position={layout.anchor} intensity={1.1} distance={16} color="#2DD9E8" />
    </group>
  );
}
