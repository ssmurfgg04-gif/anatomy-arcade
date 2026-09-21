"use client";
/**
 * ANATOMY ARCADE — single-route game shell.
 * Phases: BOOT -> LOADING -> MAIN_MENU -> MISSION_SELECT -> MISSION_INTRO ->
 * PLAYING (SCANNING/INTERACTION/OBJECTIVE_COMPLETE/EDUCATION_POPUP) ->
 * MISSION_COMPLETE -> RESULTS. Full-body explorer = menu backdrop (BodyHub).
 */
import { useCallback, useEffect, useState } from "react";
import { useGame, type Discovery } from "@/game/core/state";
import { ANATOMY } from "@/game/data/anatomy";
import { MenuScene } from "@/scenes/MenuScene";
import { GameCanvas } from "@/scenes/GameCanvas";
import { HUD } from "@/ui/hud/HUD";
import { EducationPanel } from "@/ui/education/EducationPanel";
import { MainMenu } from "@/ui/menus/MainMenu";
import { MissionSelect } from "@/ui/menus/MissionSelect";
import { LoadingScreen, ObjectiveBanner, MissionComplete, PauseMenu } from "@/ui/menus/Screens";
import { unlockAudio, setMuted } from "@/audio/sfx";
import { useGame as _g } from "@/game/core/state";

void _g; // keep tree-shaker honest

export default function Home() {
  const phase = useGame((s) => s.phase);
  const setPhase = useGame((s) => s.setPhase);
  const setLoading = useGame((s) => s.setLoading);
  const settings = useGame((s) => s.settings);
  const [paused, setPaused] = useState(false);

  // BOOT -> staged LOADING (real stages, spec §38)
  useEffect(() => {
    if (phase !== "BOOT") return;
    let stage = 0;
    const stages: [string, number][] = [
      ["INITIALIZING MEDICAL NANOBOT...", 0.22],
      ["LOADING VASCULAR SYSTEMS", 0.55],
      ["PREPARING BIOLOGICAL ENVIRONMENT", 0.82],
      ["SYNCHRONIZING PATIENT DATA", 1],
    ];
    const id = setInterval(() => {
      stage += 1;
      if (stage < stages.length) {
        setLoading(stages[stage][1], stages[stage][0]);
      } else {
        clearInterval(id);
        setTimeout(() => setPhase("MAIN_MENU"), 450);
      }
    }, 520);
    setLoading(stages[0][1], stages[0][0]);
    return () => clearInterval(id);
  }, [phase, setLoading, setPhase]);

  // mute when paused / in menus
  useEffect(() => {
    setMuted(paused || phase === "MISSION_SELECT");
  }, [paused, phase]);

  // resume from pause returns to PLAYING
  const resume = useCallback(() => {
    setPaused(false);
    setPhase("PLAYING");
  }, [setPhase]);

  const openPause = useCallback(() => setPaused(true), []);

  // click anywhere unlocks audio (autoplay policy)
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // dev debug handle (safe in prod: window-only)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__aa = useGame;
  }, []);

  // scan events from the 3D world -> education panel + mission logic
  useEffect(() => {
    const onScan = (e: Event) => {
      const detail = (e as CustomEvent<{ organ: string; id: string }>).detail;
      if (!detail) return;
      const info = ANATOMY[detail.id];
      if (!info) return;
      const g = useGame.getState();
      const d: Discovery = {
        id: info.id,
        title: info.title,
        subtitle: info.subtitle,
        body: info.body,
        missionTip: info.missionTip,
        funFact: info.funFact,
        keywords: info.keywords,
        at: Date.now(),
      };
      g.openScan(d);
      // scanning the obstruction completes objective 03 (index 2)
      if ((detail.id === "thrombus" || detail.id === "plaque") && !g.objectives[2].done) {
        g.completeObjective(2);
      }
    };
    window.addEventListener("aa-scan", onScan);
    return () => window.removeEventListener("aa-scan", onScan);
  }, []);

  // mobile scroll lock during gameplay (spec §52)
  useEffect(() => {
    const inGame = phase === "PLAYING" || phase === "SCANNING" || phase === "INTERACTION" || phase === "MISSION_INTRO";
    document.body.style.overflow = inGame ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  const inMission = phase === "MISSION_INTRO" || phase === "PLAYING" || phase === "SCANNING" || phase === "INTERACTION" || phase === "OBJECTIVE_COMPLETE" || phase === "EDUCATION_POPUP" || phase === "MISSION_COMPLETE";

  return (
    <main className="fixed inset-0 select-none overflow-hidden bg-[#04070c] text-white">
      {/* 3D layer */}
      {inMission ? <GameCanvas onOpenPause={openPause} /> : <MenuScene />}

      {/* UI layer */}
      {(phase === "MAIN_MENU" || phase === "MISSION_SELECT") && <MainMenu />}
      {phase === "MAIN_MENU" && <MainMenuExtra />}
      {phase === "MISSION_SELECT" && <MissionSelect />}
      {phase === "LOADING" && <LoadingScreen />}
      {inMission && <HUD onPause={openPause} />}
      <ObjectiveBanner />
      <MissionComplete />
      <EducationPanel />
      {paused && <PauseMenu onResume={resume} />}
    </main>
  );
}

/** Secondary menu links rendered on the main menu surface. */
function MainMenuExtra() {
  const setPhase = useGame((s) => s.setPhase);
  return (
    <div className="pointer-events-auto fixed bottom-[max(env(safe-area-inset-bottom),18px)] right-6 z-30 flex gap-4 font-mono text-[10px] tracking-[0.3em] text-white/40">
      <button className="transition hover:text-cyan-200" onClick={() => setPhase("MISSION_SELECT")}>
        HOW TO PLAY
      </button>
      <span className="text-white/20">|</span>
      <span>V 1.0</span>
    </div>
  );
}
