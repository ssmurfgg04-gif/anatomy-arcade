"use client";
/**
 * Menu 3D backdrop (spec §29): stylized translucent body silhouette with a
 * glowing circulatory overlay + orbiting nano-robot. Rotates slowly; reacts
 * to pointer. Procedural until the CC-BY body assets land (P4).
 *
 * P5 polish pass (landing rebuild):
 * - frameloop="demand" + in-canvas 30Hz invalidate pacer (24Hz on LOW tier)
 *   so the menu never burns GPU redrawing at refresh rate.
 * - brighter vessel emissive (#C21E3A ~1.6) + additive halo sprite behind
 *   the body + slightly stronger key light.
 * - slow vertical bob; pointer parallax via window events (the landing DOM
 *   covers the canvas) with frame-rate-independent damping:
 *   pos += (target - pos) * (1 - exp(-4 * dt)).
 * - all decorative motion freezes under the shared motion law
 *   (settings.motionReduced OR prefers-reduced-motion, see ui/landing/motion).
 * - LOW tier drops the expensive transmission material.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/game/core/state";
import { usePrefersReducedMotion } from "@/ui/landing/motion";

/** invalidate() pacer — the heartbeat of the demand-frameloop backdrop. */
function FramePacer() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // read once on mount: menu tier never changes while the menu is up
    const low = useGame.getState().qualityResolved === "LOW";
    const ms = 1000 / (low ? 24 : 30);
    const id = setInterval(() => invalidate(), ms);
    return () => clearInterval(id);
  }, [invalidate]);
  return null;
}

function Halo() {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(45, 217, 232, 0.55)");
      g.addColorStop(0.35, "rgba(28, 105, 135, 0.22)");
      g.addColorStop(0.7, "rgba(10, 38, 56, 0.08)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0.15, 0.75, -2.5]} scale={[10.5, 12.5, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function VesselLines({ reduced }: { reduced: boolean }) {
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
    if (reduced || !group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.12;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
  });

  return (
    <group ref={group}>
      {curves.map((c, i) => (
        <mesh key={i}>
          <tubeGeometry args={[c, 60, 0.022 + (i === 0 ? 0.012 : 0), 8, false]} />
          <meshStandardMaterial
            color="#C21E3A"
            emissive="#C21E3A"
            emissiveIntensity={1.6}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {/* heart node */}
      <mesh position={[0.05, 0.62, 0.02]}>
        <sphereGeometry args={[0.075, 16, 14]} />
        <meshStandardMaterial color="#C21E3A" emissive="#ff2e55" emissiveIntensity={2.1} />
      </mesh>
    </group>
  );
}

function BodySilhouette({ low, reduced }: { low: boolean; reduced: boolean }) {
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
    if (reduced || !group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.12;
  });
  return (
    <group ref={group}>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos as [number, number, number]}>
          <capsuleGeometry args={[p.r, p.h, low ? 4 : 6, low ? 10 : 14]} />
          {low ? (
            <meshStandardMaterial
              color="#101f2d"
              roughness={0.4}
              metalness={0.1}
              transparent
              opacity={0.55}
              emissive="#0d2937"
              emissiveIntensity={1.3}
            />
          ) : (
            <meshStandardMaterial
              color="#152838"
              roughness={0.38}
              metalness={0.15}
              transparent
              opacity={0.62}
              emissive="#0e2f40"
              emissiveIntensity={1.6}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}

function NanoOrbit({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (reduced || !ref.current) return;
    const t = state.clock.elapsedTime * 0.5;
    ref.current.position.set(Math.cos(t) * 0.85, 0.62 + Math.sin(t * 1.7) * 0.28, Math.sin(t) * 0.85);
    ref.current.lookAt(0, 0.62, 0);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.045, 14, 12]} />
        <meshStandardMaterial
          color="#e8f4f7"
          emissive="#bff4ff"
          emissiveIntensity={1.1}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.006, 8, 24]} />
        <meshStandardMaterial color="#2DD9E8" emissive="#2DD9E8" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}

/** Whole-body vertical bob (very slow, tiny amplitude). */
function BodyGroup({ reduced, low }: { reduced: boolean; low: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (reduced || !ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.05;
  });
  return (
    <group ref={ref}>
      <BodySilhouette low={low} reduced={reduced} />
      <VesselLines reduced={reduced} />
      <NanoOrbit reduced={reduced} />
    </group>
  );
}

function Rig({ reduced }: { reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  const target = useRef({ x: 0, y: 0 });

  // the landing DOM sits above the canvas, so listen on the window
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    if (reduced) {
      // settle back to the rest pose, no parallax
      const k = 1 - Math.exp(-4 * d);
      camera.position.x += (0 - camera.position.x) * k;
      camera.position.y += (1.1 - camera.position.y) * k;
    } else {
      // frame-rate independent exponential damping (rate 4 / s)
      const k = 1 - Math.exp(-4 * d);
      camera.position.x += (target.current.x * 0.6 - camera.position.x) * k;
      camera.position.y += (1.1 + target.current.y * 0.3 - camera.position.y) * k;
    }
    // body framed on the RIGHT third (reference layout) — lookAt shifted left
    camera.lookAt(-0.55, 0.55, 0);
  });
  return null;
}

export function MenuScene() {
  const reduced = usePrefersReducedMotion();
  // read the resolved tier once on mount (menu tier is fixed while mounted)
  const [low] = useState(() => useGame.getState().qualityResolved === "LOW");

  return (
    <div className="fixed inset-0 z-10 bg-[#04070c]">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.6]}
        camera={{ position: [0, 1.1, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      >
        <color attach="background" args={["#04070c"]} />
        <fog attach="fog" args={["#04070c", 4.5, 9]} />
        <ambientLight intensity={0.5} color="#0e1a26" />
        {/* key light, slightly hotter for the landing pass */}
        <pointLight position={[2, 3, 3]} intensity={3.0} color="#2DD9E8" />
        <pointLight position={[-2.5, 0.5, -2]} intensity={1.9} color="#C21E3A" />
        {/* rim/back lights: glow the body edges against the dark (reference look) */}
        <pointLight position={[0, 1.0, -2.8]} intensity={14} distance={18} color="#2DD9E8" />
        <pointLight position={[0.4, -0.7, -2.6]} intensity={8} distance={14} color="#7fd7e8" />
        <Halo />
        <BodyGroup reduced={reduced} low={low} />
        <Rig reduced={reduced} />
        <FramePacer />
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
