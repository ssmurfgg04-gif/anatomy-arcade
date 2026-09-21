"use client";
/**
 * Menu 3D backdrop (spec §29): stylized translucent body silhouette with a
 * glowing circulatory overlay + orbiting nano-robot. Rotates slowly; reacts
 * to pointer. Procedural until the CC-BY body assets land (P4).
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

function VesselLines() {
  const group = useRef<THREE.Group>(null);
  const curves = useMemo(() => {
    const mk = (pts: [number, number, number][]) =>
      new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    return [
      // aorta arc
      mk([[0, 1.35, 0], [0.32, 1.15, 0.14], [0.18, 0.82, 0.1], [-0.14, 0.55, 0], [-0.1, 0.1, -0.05], [0.02, -0.6, 0]]),
      // pulmonary
      mk([[-0.3, 1.0, 0.05], [-0.05, 0.72, -0.12], [0.28, 0.55, 0.06], [0.2, 0.28, 0]]),
      // femoral pair
      mk([[-0.22, 0.1, 0], [-0.3, -0.5, 0.05], [-0.26, -1.1, 0], [-0.3, -1.6, 0]]),
      mk([[0.22, 0.1, 0], [0.3, -0.5, 0.05], [0.26, -1.1, 0], [0.3, -1.6, 0]]),
      // carotids
      mk([[-0.12, 1.0, 0.06], [-0.1, 1.35, 0.1], [-0.08, 1.68, 0.08]]),
      mk([[0.12, 1.0, 0.06], [0.1, 1.35, 0.1], [0.08, 1.68, 0.08]]),
      // brachial pair
      mk([[-0.62, 0.9, 0.05], [-0.85, 0.45, 0.1], [-0.95, 0.05, 0.12]]),
      mk([[0.62, 0.9, 0.05], [0.85, 0.45, 0.1], [0.95, 0.05, 0.12]]),
    ];
  }, []);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.12;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
    }
  });

  return (
    <group ref={group}>
      {curves.map((c, i) => (
        <mesh key={i}>
          <tubeGeometry args={[c, 60, 0.016 + (i === 0 ? 0.012 : 0), 8, false]} />
          <meshStandardMaterial
            color="#C21E3A"
            emissive="#C21E3A"
            emissiveIntensity={0.9}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {/* heart node */}
      <mesh position={[0.05, 0.62, 0.02]}>
        <sphereGeometry args={[0.075, 16, 14]} />
        <meshStandardMaterial color="#C21E3A" emissive="#ff2e55" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

function BodySilhouette() {
  // capsule-stack approximation of a human figure, translucent
  const parts = useMemo(
    () => [
      { pos: [0, 1.62, 0], r: 0.17, h: 0.26 }, // head
      { pos: [0, 1.18, 0], r: 0.30, h: 0.5 }, // chest
      { pos: [0, 0.55, 0], r: 0.27, h: 0.5 }, // abdomen
      { pos: [0, 0.05, 0], r: 0.25, h: 0.3 }, // pelvis
      { pos: [-0.16, -0.75, 0], r: 0.09, h: 1.15 }, // legs
      { pos: [0.16, -0.75, 0], r: 0.09, h: 1.15 },
      { pos: [-0.72, 0.85, 0], r: 0.07, h: 0.8 }, // arms
      { pos: [0.72, 0.85, 0], r: 0.07, h: 0.8 },
    ],
    []
  );
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });
  return (
    <group ref={group}>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos as [number, number, number]}>
          <capsuleGeometry args={[p.r, p.h, 6, 14]} />
          <meshPhysicalMaterial
            color="#0c1622"
            transmission={0.55}
            thickness={0.8}
            roughness={0.35}
            transparent
            opacity={0.35}
            emissive="#0a1a26"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

function NanoOrbit() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * 0.5;
    ref.current.position.set(Math.cos(t) * 0.85, 0.62 + Math.sin(t * 1.7) * 0.28, Math.sin(t) * 0.85);
    ref.current.lookAt(0, 0.62, 0);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.045, 14, 12]} />
        <meshStandardMaterial color="#e8f4f7" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.006, 8, 24]} />
        <meshStandardMaterial color="#2DD9E8" emissive="#2DD9E8" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}

function Rig() {
  const { camera, pointer } = useThree();
  useFrame(() => {
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.03;
    camera.position.y += (1.1 + pointer.y * 0.3 - camera.position.y) * 0.03;
    camera.lookAt(0, 0.5, 0);
  });
  return null;
}

export function MenuScene() {
  return (
    <div className="fixed inset-0 z-10 bg-[#04070c]">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 1.1, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      >
        <color attach="background" args={["#04070c"]} />
        <fog attach="fog" args={["#04070c", 4.5, 9]} />
        <ambientLight intensity={0.5} color="#0e1a26" />
        <pointLight position={[2, 3, 3]} intensity={2.2} color="#2DD9E8" />
        <pointLight position={[-2.5, 0.5, -2]} intensity={1.6} color="#C21E3A" />
        <BodySilhouette />
        <VesselLines />
        <NanoOrbit />
        <Rig />
      </Canvas>
      {/* bottom gradient into menus */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#04070c] via-[#04070c]/55 to-transparent" />
      {/* grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
