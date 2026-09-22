"use client";
/**
 * GameCanvas (spec §17): R3F canvas hosting the active mission. React owns UI;
 * the 3D world stays imperative (refs) — no per-frame React rerenders.
 * Research law L5/L6/L16: adaptive quality governor drives render scale +
 * tier hysteresis; pause suspends the sim via the shared input flag.
 * P7: mounts the active mission (heart | viral | brain) — one world at a time.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/game/core/state";
import { QUALITY_PROFILES, detectQualityTier, type QualityTier } from "@/game/core/quality";
import { QualityGovernor } from "@/game/quality/governor";
import { createInputState, clearHeldInput, useKeyboardInput, usePointerLook, type InputState } from "@/game/controls/input";
import { TouchControls } from "@/game/controls/TouchControls";
import { TutorialOverlay } from "@/ui/tutorial/TutorialOverlay";
import { createHeartRefs, HeartMission } from "@/game/levels/heart/HeartMission";
import { createViralRefs, ViralMission } from "@/game/levels/viral/ViralMission";
import { createBrainRefs, BrainMission } from "@/game/levels/brain/BrainMission";
import { updateHum, startHum, playImpact, playHeartbeat, startAmbience, setAudioVolume } from "@/audio/sfx";

const TIER_ORDER: QualityTier[] = ["LOW", "MEDIUM", "HIGH"];

function BeatDriver({ refs }: { refs: { beat: React.MutableRefObject<number>; flow: React.MutableRefObject<number>; hitWall: React.MutableRefObject<number>; player: { speed: number; boosting: boolean; shake: number } } }) {
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

/** Feeds the governor every frame; applies render-scale changes sparingly. */
function GovernorDriver({
  governor,
  onScale,
}: {
  governor: QualityGovernor;
  onScale: (s: number) => void;
}) {
  const applied = useRef(1);
  const onScaleRef = useRef(onScale);
  useEffect(() => {
    onScaleRef.current = onScale;
  }, [onScale]);
  useFrame((_, delta) => {
    governor.update(delta * 1000);
    const s = governor.renderScale;
    if (Math.abs(s - applied.current) > 0.02) {
      applied.current = s;
      onScaleRef.current(s);
    }
  });
  return null;
}

export function GameCanvas({ onOpenPause }: { onOpenPause: () => void }) {
  const qualityPref = useGame((s) => s.settings.quality);
  const qualityResolvedStore = useGame((s) => s.qualityResolved);
  const setQualityResolved = useGame((s) => s.setQualityResolved);
  const audioMaster = useGame((s) => s.settings.audioMaster);
  const mission = useGame((s) => s.mission);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const [tier, setTier] = useState<QualityTier>("MEDIUM");
  const tierRef = useRef<QualityTier>("MEDIUM");
  tierRef.current = tier;
  const maxTier = useRef<QualityTier>("MEDIUM");

  useEffect(() => {
    const t = qualityPref === "AUTO" ? detectQualityTier() : qualityPref;
    setTier(t);
    maxTier.current = t;
    if (qualityResolvedStore !== t) setQualityResolved(t);
  }, [qualityPref, qualityResolvedStore, setQualityResolved]);

  // adaptive quality governor (L5): scale hunts first, tier moves only after
  // the scale bottoms out / tops out with hysteresis — oscillation impossible
  const governor = useMemo(
    () =>
      new QualityGovernor({
        onDemote: () => {
          const i = TIER_ORDER.indexOf(tierRef.current);
          if (i > 0) setTier(TIER_ORDER[i - 1]);
        },
        onPromote: () => {
          const i = TIER_ORDER.indexOf(tierRef.current);
          if (i >= 0 && i + 1 <= TIER_ORDER.indexOf(maxTier.current)) setTier(TIER_ORDER[i + 1]);
        },
      }),
    []
  );

  useEffect(() => setAudioVolume(audioMaster), [audioMaster]);

  const input = useMemo(() => ({ current: createInputState() }), []);
  const [heartRefs] = useState(() => createHeartRefs(QUALITY_PROFILES[tier].particleCount));
  const [viralRefs] = useState(() => createViralRefs(QUALITY_PROFILES[tier].particleCount));
  const [brainRefs] = useState(() => createBrainRefs(QUALITY_PROFILES[tier].particleCount));

  // keep live particle budget synced to the active tier (L6: particles = big dial)
  useEffect(() => {
    const count = QUALITY_PROFILES[tier].particleCount;
    heartRefs.particleCount.current = count;
    viralRefs.particleCount.current = count;
    brainRefs.particleCount.current = count;
  }, [tier, heartRefs, viralRefs, brainRefs]);

  // expose the ACTIVE mission's refs to probes/HUD (same window contract)
  const activeRefs = mission === "viral" ? viralRefs : mission === "brain" ? brainRefs : heartRefs;
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__aaRefs = activeRefs;
    (window as unknown as Record<string, unknown>).__aaInput = input;
  }, [activeRefs, input]);

  // pause suspension (L16): freeze movement + mission sim, kill held inputs
  const handlePause = useCallback(() => {
    input.current.suspended = true;
    clearHeldInput(input);
    onOpenPause();
  }, [input, onOpenPause]);

  useEffect(() => {
    input.current.suspended = false;
    const onResume = () => {
      input.current.suspended = false;
    };
    window.addEventListener("aa-resume", onResume);
    return () => {
      window.removeEventListener("aa-resume", onResume);
      input.current.suspended = false;
    };
  }, [input]);

  useKeyboardInput(input);
  usePointerLook(input, true);

  // Esc pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        const g = useGame.getState();
        if (g.phase === "PLAYING") {
          handlePause();
          if (document.pointerLockElement) document.exitPointerLock?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePause]);

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

  // base DPR from device, clamped to the tier window; governor scales it live
  const baseDpr = useMemo(() => {
    const raw = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return Math.min(Math.max(raw, profile.dpr[0]), profile.dpr[1]);
  }, [profile]);
  const [dpr, setDpr] = useState(baseDpr);
  useEffect(() => {
    setDpr(baseDpr * governor.renderScale);
  }, [baseDpr, governor]);

  const onScale = useCallback(
    (s: number) => setDpr(baseDpr * s),
    [baseDpr]
  );

  return (
    <div ref={canvasWrapRef} className="fixed inset-0 z-10 bg-[#04070c]">
      <Canvas
        dpr={dpr}
        camera={{ position: [0, -2, -88], fov: 78, near: 0.05, far: 160 }}
        gl={{ antialias: tier !== "LOW", alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <color attach="background" args={["#05080e"]} />
        <fog attach="fog" args={["#0b0507", 12, 72]} />
        {mission === "heart" && <HeartMission key="heart" refs={heartRefs} input={input} quality={tier} />}
        {mission === "viral" && <ViralMission key="viral" refs={viralRefs} input={input} quality={tier} />}
        {mission === "brain" && <BrainMission key="brain" refs={brainRefs} input={input} quality={tier} />}
        <BeatDriver refs={activeRefs} />
        <GovernorDriver governor={governor} onScale={onScale} />
      </Canvas>
      <TouchControls input={input} onPause={handlePause} />
      <TutorialOverlay input={input} />
    </div>
  );
}
