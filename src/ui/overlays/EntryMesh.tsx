"use client";
/**
 * BIODEX entry mesh (journal v2): a tiny demand-loop canvas showing the real
 * anatomical heart (ASSET: public/models/heart_hero.glb — BodyParts3D, CC BY
 * 4.0, attribution lives in the CREDITS overlay, do not remove) for known
 * heart-region journal entries. Same palette-controlled luminous myocardium
 * material as the in-mission HeroHeart (color #8e2536, emissive #6b1220).
 *
 * Perf laws: frameloop="demand" + 24Hz invalidate pacer (stops when the tab is
 * hidden), dpr [1, 1.5], antialias, NO shadows. The component is dynamically
 * imported by the Journal, so the canvas and GLB never load outside the open
 * journal — returns null for unknown ids (defensive, callers also guard).
 */
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { usePrefersReducedMotion } from "@/ui/landing/motion";

/** Journal ids this component accepts (defensive guard; the Journal grid currently mounts it for the flagship cardiac entries heartChamber + coronaryArtery). */
export const ENTRY_MESH_IDS = new Set(["heartChamber", "coronaryArtery", "thrombus", "plaque", "vesselWall"]);

const HEART_URL = "/models/heart_hero.glb";
/** GLB is ~12 cm real scale; needs ~x9 to fill a 176px viewport. */
const HEART_SCALE = 9;

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

function HeartPreview({ reduced }: { reduced: boolean }) {
  const gltf = useGLTF(HEART_URL);
  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    // palette-controlled luminous myocardium (matches HeartMission HeroHeart)
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#8e2536"),
      emissive: new THREE.Color("#6b1220"),
      emissiveIntensity: 0.9,
      roughness: 0.62,
      metalness: 0.04,
    });
    s.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.material = mat;
    });
    return s;
  }, [gltf]);
  const yaw = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!reduced && yaw.current) yaw.current.rotation.y = state.clock.elapsedTime * 0.35;
  });
  return (
    <group rotation={[0.1, 0, -0.06]}>
      <group ref={yaw} scale={HEART_SCALE}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function HeartCanvas() {
  const reduced = usePrefersReducedMotion();
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0.12, 0.16, 2.0], fov: 32 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      gl={{ antialias: true, powerPreference: "low-power" }}
      style={{ touchAction: "pan-y", width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.6} color="#a8c4cc" />
      <pointLight position={[2, 2.2, 3]} intensity={2.0} color="#ff8296" />
      <pointLight position={[-2, 1, -2.2]} intensity={1.6} color="#7fd8e8" />
      <Suspense fallback={null}>
        <HeartPreview reduced={reduced} />
      </Suspense>
      <FramePacer />
    </Canvas>
  );
}

/** Renders the heart preview only for known ids; null otherwise (no canvas mount). */
export default function EntryMesh({ id }: { id: string }) {
  if (!ENTRY_MESH_IDS.has(id)) return null;
  return (
    <div className="h-44 w-full bg-[#04070c]">
      <HeartCanvas />
    </div>
  );
}

useGLTF.preload(HEART_URL);
