"use client";
/**
 * BIODEX body map (spec §19 journal v2): compact demand-loop R3F canvas that
 * renders the real BodyParts3D body silhouette (CC BY 4.0 — attribution lives
 * in the CREDITS overlay, do not remove) as a translucent ghost figure with
 * glowing organ markers for the three mission systems.
 *
 * Perf laws (mobile-first, see CONTEXT):
 * - frameloop="demand" + a 24Hz invalidate pacer via setInterval. The pacer
 *   stops when document.visibilityState === "hidden" (and on unmount).
 * - dpr capped at [1, 1.5], antialias on, NO shadows, no pointLight-heavy rig.
 * - touchAction "pan-y" so vertical swipes still scroll the journal overlay.
 */
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { usePrefersReducedMotion } from "@/ui/landing/motion";

export type BodyRegion = "heart" | "lungs" | "brain";

const BODY_URL = "/models/body_silhouette.glb";
/** GLB is centered at the origin on every axis (Y spans -0.864..0.865); lift so the figure spans y 0..1.73 m. */
const BODY_Y_OFFSET = 0.865;

/**
 * Marker pins per mission system (positions in body space, feet at y=0):
 * BRAIN = head, LUNGS = chest (nudged off-midline), HEART = chest, slightly
 * forward + a hair right (anatomical left) so the two chest pins stay
 * separately tappable. Palette: cyan / amber / crimson — the same three
 * accents the HUD already uses.
 */
const MARKERS: {
  region: BodyRegion;
  label: string;
  position: [number, number, number];
  color: string;
  emissive: string;
}[] = [
  { region: "brain", label: "BRAIN", position: [0, 1.55, 0], color: "#2DD9E8", emissive: "#2DD9E8" },
  { region: "lungs", label: "LUNGS", position: [-0.06, 1.26, 0.02], color: "#ffc86b", emissive: "#ffb13d" },
  { region: "heart", label: "HEART", position: [0.03, 1.32, 0.08], color: "#C21E3A", emissive: "#C21E3A" },
];

/** 24Hz invalidate pacer — the demand-frameloop heartbeat; pauses when the tab is hidden. */
function FramePacer() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id == null) id = setInterval(() => invalidate(), 1000 / 24);
    };
    const stop = () => {
      if (id != null) {
        clearInterval(id);
        id = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [invalidate]);
  return null;
}

/** Translucent ghost figure — every mesh material overridden. depthWrite stays OFF
 * so the organ pins sitting inside the body volume are never depth-occluded by the
 * shell; the ghost blends over them instead (x-ray look). A slight same-family
 * emissive keeps the figure readable under ACES tone mapping on every GPU tier. */
function GhostBody() {
  const gltf = useGLTF(BODY_URL);
  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#16303a"),
      emissive: new THREE.Color("#1b4a56"),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.28,
      roughness: 0.6,
      metalness: 0.05,
      depthWrite: false,
    });
    s.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.material = mat;
    });
    return s;
  }, [gltf]);
  return <primitive object={scene} position={[0, BODY_Y_OFFSET, 0]} />;
}

/**
 * Glowing organ pin: a small emissive sphere (no pointLight — emissive only)
 * plus an invisible fatter hit-sphere so the pin is tappable on phones while
 * staying visually restrained. Selected pin scales 1.6x; the others dim.
 */
function OrganMarker({
  region,
  position,
  color,
  emissive,
  selected,
  onSelect,
}: {
  region: BodyRegion;
  position: [number, number, number];
  color: string;
  emissive: string;
  selected: BodyRegion | null;
  onSelect: (r: BodyRegion | null) => void;
}) {
  const isSel = selected === region;
  const dimmed = selected != null && !isSel;
  return (
    <group
      position={position}
      scale={isSel ? 1.6 : 1}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSel ? null : region);
      }}
    >
      <mesh>
        <sphereGeometry args={[0.032, 16, 14]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={dimmed ? 0.55 : isSel ? 2.2 : 1.6}
          transparent
          opacity={dimmed ? 0.35 : 1}
          roughness={0.35}
          metalness={0}
        />
      </mesh>
      {/* fat invisible tap target (~24px on screen) */}
      <mesh>
        <sphereGeometry args={[0.085, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Body + markers, slow yaw ~0.15 rad/s (frozen under the shared motion law). */
function BodyRig({
  selected,
  onSelect,
  reduced,
}: {
  selected: BodyRegion | null;
  onSelect: (r: BodyRegion | null) => void;
  reduced: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!reduced && ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.15;
  });
  return (
    <group ref={ref}>
      <Suspense fallback={null}>
        <GhostBody />
      </Suspense>
      {MARKERS.map((m) => (
        <OrganMarker key={m.region} region={m.region} position={m.position} color={m.color} emissive={m.emissive} selected={selected} onSelect={onSelect} />
      ))}
    </group>
  );
}

export default function BodyMap({
  selected,
  onSelect,
}: {
  selected: BodyRegion | null;
  onSelect: (r: BodyRegion | null) => void;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.88, 3.15], fov: 34 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.86, 0)}
      gl={{ antialias: true, powerPreference: "low-power" }}
      style={{ touchAction: "pan-y", width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} color="#8fb8c4" />
      <pointLight position={[1.8, 2.4, 2.6]} intensity={2.4} color="#2DD9E8" />
      <pointLight position={[-2.2, 0.4, -1.8]} intensity={1.4} color="#C21E3A" />
      <BodyRig selected={selected} onSelect={onSelect} reduced={reduced} />
      <FramePacer />
    </Canvas>
  );
}

useGLTF.preload(BODY_URL);
