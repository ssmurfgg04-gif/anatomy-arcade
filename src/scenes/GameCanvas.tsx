"use client";
/**
 * GameCanvas (spec §17): R3F canvas hosting the active mission. React owns UI;
 * the 3D world stays imperative (refs) — no per-frame React rerenders.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/game/core/state";
import { QUALITY_PROFILES, detectQualityTier, type QualityTier } from "@/game/core/quality";
import { createInputState, useKeyboardInput, usePointerLook } from "@/game/controls/input";
import { TouchControls } from "@/game/controls/TouchControls";
import { TutorialOverlay } from "@/ui/tutorial/TutorialOverlay";
import { createHeartRefs, HeartMission, type HeartRefs } from "@/game/levels/heart/HeartMission";
import { updateHum, startHum, playImpact, playHeartbeat, startAmbience, setAudioVolume } from "@/audio/sfx";

function BeatDriver({ refs }: { refs: HeartRefs }) {
  const { camera } = useThree();
  const lastBeat = useRef(0);
  useFrame((state) => {
    // audio heartbeat on beat rise
    if (refs.beat.current > 0.7 && lastBeat.current <= 0.7) {
      const g = useGame.getState();
      if (g.phase === "PLAYING" || g.phase === "OBJECTIVE_COMPLETE") {
        playHeartbeat(0.5 + (1 - refs.flow.current) * 0.5);
      }
    }
    lastBeat.current = refs.beat.current;
    // propulsion hum follows speed
    updateHum(refs.player.speed, refs.player.boosting);
    // wall impact sfx
    if (refs.hitWall.current > 0) {
      playImpact();
      refs.hitWall.current = 0;
    }
    // subtle camera roll during shake
    if (refs.player.shake > 0.01) {
      camera.rotateZ(Math.sin(state.clock.elapsedTime * 40) * refs.player.shake * 0.02);
    }
  });
  return null;
}

export function GameCanvas({ onOpenPause }: { onOpenPause: () => void }) {
  const qualityPref = useGame((s) => s.settings.quality);
  const qualityResolvedStore = useGame((s) => s.qualityResolved);
  const setQualityResolved = useGame((s) => s.setQualityResolved);
  const audioMaster = useGame((s) => s.settings.audioMaster);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const [tier, setTier] = useState<QualityTier>("MEDIUM");
  useEffect(() => {
    const t = qualityPref === "AUTO" ? detectQualityTier() : qualityPref;
    setTier(t);
    if (qualityResolvedStore !== t) setQualityResolved(t);
  }, [qualityPref, qualityResolvedStore, setQualityResolved]);

  useEffect(() => setAudioVolume(audioMaster), [audioMaster]);

  const input = useMemo(() => ({ current: createInputState() }), []);
  const [heartRefs] = useState(() => createHeartRefs(QUALITY_PROFILES[tier].particleCount));

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__aaRefs = heartRefs;
    (window as unknown as Record<string, unknown>).__aaInput = input;
  }, [heartRefs, input]);

  useKeyboardInput(input);
  usePointerLook(input, true);

  // Esc pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        const g = useGame.getState();
        if (g.phase === "PLAYING") {
          onOpenPause();
          if (document.pointerLockElement) document.exitPointerLock?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenPause]);

  // start audio on first interaction
  useEffect(() => {
    const unlock = () => {
      startAmbience();
      startHum();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const profile = QUALITY_PROFILES[tier];

  return (
    <div ref={canvasWrapRef} className="fixed inset-0 z-10 bg-[#04070c]">
      <Canvas
        dpr={profile.dpr}
        camera={{ position: [0, -2, -88], fov: 78, near: 0.05, far: 160 }}
        gl={{ antialias: tier !== "LOW", alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <color attach="background" args={["#05080e"]} />
        <fog attach="fog" args={["#0b0507", 12, 72]} />
        <HeartMission refs={heartRefs} input={input} quality={tier} />
        <BeatDriver refs={heartRefs} />
      </Canvas>
      <TouchControls input={input} onPause={onOpenPause} />
      <TutorialOverlay input={input} />
    </div>
  );
}
