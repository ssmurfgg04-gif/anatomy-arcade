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
import { LoadingScreen, ObjectiveBanner, MissionComplete, MissionBriefing, MissionFailed, PauseMenu } from "@/ui/menus/Screens";
import { TutorialOverlay } from "@/ui/tutorial/TutorialOverlay";
import { HowToPlay, Journal, Credits } from "@/ui/overlays/Overlays";
import { unlockAudio, setMuted } from "@/audio/sfx";

export default function Home() {
  const phase = useGame((s) => s.phase);
  const setPhase = useGame((s) => s.setPhase);
  const uiOverlay = useGame((s) => s.uiOverlay);
  const setLoading = useGame((s) => s.setLoading);
  const settings = useGame((s) => s.settings);
  const setTutorialDone = useGame((s) => s.setTutorialDone);
  const [paused, setPaused] = useState(false);

  // restore persisted flags (tutorial seen, etc.)
  useEffect(() => {
    try {
      if (localStorage.getItem("aa_tutorial") === "done") setTutorialDone(true);
    } catch {}
  }, [setTutorialDone]);

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

  // resume from pause returns to PLAYING (GameCanvas listens for aa-resume)
  const resume = useCallback(() => {
    setPaused(false);
    setPhase("PLAYING");
    window.dispatchEvent(new CustomEvent("aa-resume"));
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
      // the blockage scan is a clinical READOUT, not just a discovery card
      const analyzing = detail.id === "thrombus" || detail.id === "plaque";
      const d: Discovery = {
        id: info.id,
        title: analyzing
          ? detail.id === "thrombus"
            ? "ANALYSIS — 92% OCCLUSION (LAD)"
            : "ANALYSIS — PLAQUE RUPTURE SITE (LAD)"
          : info.title,
        subtitle: info.subtitle,
        body: info.body,
        missionTip: info.missionTip,
        funFact: info.funFact,
        keywords: info.keywords,
        at: Date.now(),
      };
      g.openScan(d);
      // stage 05 CALIBRATE THE SCANNER — any successful scan teaches the tool
      if (!g.objectives[4].done) g.completeObjective(4);
      // stage 07 ANALYZE THE BLOCKAGE — scanning the obstruction returns the readout
      if (detail.id === "thrombus" || detail.id === "plaque") {
        if (!g.objectives[5].done) g.completeObjective(5);
        if (!g.objectives[6].done) g.completeObjective(6);
      }
    };
    window.addEventListener("aa-scan", onScan);
    return () => window.removeEventListener("aa-scan", onScan);
  }, []);

  // never let a scan panel survive past the mission end (spec: results are sacred)
  useEffect(() => {
    if (phase === "MISSION_COMPLETE" || phase === "MISSION_FAILED") {
      const st = useGame.getState();
      if (st.activeScan) st.closeScan();
    }
  }, [phase]);

  // mobile scroll lock during gameplay (spec §52)
  useEffect(() => {
    const inGame = phase === "MISSION_BRIEF" || phase === "PLAYING" || phase === "SCANNING" || phase === "INTERACTION" || phase === "MISSION_INTRO";
    document.body.style.overflow = inGame ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  const inMission =
    phase === "MISSION_BRIEF" ||
    phase === "MISSION_INTRO" ||
    phase === "PLAYING" ||
    phase === "SCANNING" ||
    phase === "INTERACTION" ||
    phase === "OBJECTIVE_COMPLETE" ||
    phase === "EDUCATION_POPUP" ||
    phase === "MISSION_COMPLETE" ||
    phase === "MISSION_FAILED";

  return (
    <main className="fixed inset-0 select-none overflow-hidden bg-[#04070c] text-white">
      {/* 3D layer */}
      {inMission ? <GameCanvas onOpenPause={openPause} /> : <MenuScene />}

      {/* UI layer */}
      {(phase === "MAIN_MENU" || phase === "MISSION_SELECT") && <MainMenu />}
      {phase === "MISSION_SELECT" && <MissionSelect />}
      {phase === "LOADING" && <LoadingScreen />}
      {inMission && <HUD onPause={openPause} />}
      <MissionBriefing />
      <ObjectiveBanner />
      <MissionComplete />
      <MissionFailed />
      <EducationPanel />
      {paused && <PauseMenu onResume={resume} />}
      {uiOverlay === "HOW_TO_PLAY" && <HowToPlay />}
      {uiOverlay === "JOURNAL" && <Journal />}
      {uiOverlay === "CREDITS" && <Credits />}
    </main>
  );
}
