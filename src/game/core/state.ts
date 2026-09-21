/**
 * ANATOMY ARCADE — game state machine (spec §18).
 * React owns UI/screens; this store owns authoritative game state.
 * The 3D scene reads via getState() (no rerenders) and writes via set().
 */
import { create } from "zustand";

export type Phase =
  | "BOOT"
  | "LOADING"
  | "MAIN_MENU"
  | "MISSION_SELECT"
  | "MISSION_BRIEF"
  | "MISSION_INTRO"
  | "PLAYING"
  | "SCANNING"
  | "INTERACTION"
  | "OBJECTIVE_COMPLETE"
  | "EDUCATION_POPUP"
  | "MISSION_COMPLETE"
  | "MISSION_FAILED"
  | "RESULTS";

/** Secondary full-screen overlays (how-to-play, journal, credits) — can sit on top of menus or pause. */
export type UiOverlay = "HOW_TO_PLAY" | "JOURNAL" | "CREDITS" | null;

export type FailReason = "RIG" | "PATIENT" | null;

export type MissionId = "heart" | "viral" | "brain";

export interface ObjectiveState {
  id: string;
  label: string;
  done: boolean;
  progress: number; // 0..1
}

export interface Discovery {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  missionTip: string;
  funFact?: string;
  keywords?: string[];
  viaAI?: boolean;
  at: number;
}

export type CameraMode = "POV" | "CHASE" | "CINEMATIC" | "BODY_OVERVIEW";

export interface Settings {
  quality: "AUTO" | "LOW" | "MEDIUM" | "HIGH";
  motionReduced: boolean;
  audioMaster: number; // 0..1
  showTelemetry: boolean; // dev perf monitor
}

interface GameState {
  phase: Phase;
  prevPhase: Phase | null;
  mission: MissionId;
  cameraMode: CameraMode;

  // meta / UX
  uiOverlay: UiOverlay;
  tutorialDone: boolean; // persisted to localStorage by the shell
  failReason: FailReason;

  // vitals / progress
  patientStatus: number; // 0..100
  playerHealth: number; // nano-robot integrity 0..100
  missionTime: number; // seconds, ticking in PLAYING
  score: number;
  flowHealth: number; // 0..1 — blood flow normalization

  // objectives
  objectives: ObjectiveState[];
  currentObjective: number;

  // education
  discoveries: Discovery[];
  activeScan: Discovery | null;
  discoveryToast: Discovery | null;

  // settings / meta
  settings: Settings;
  qualityResolved: "LOW" | "MEDIUM" | "HIGH";
  loadingProgress: number; // 0..1
  loadingStage: string;

  // actions
  setPhase: (p: Phase) => void;
  startMission: (m: MissionId) => void;
  setObjectiveProgress: (index: number, progress: number) => void;
  completeObjective: (index: number) => void;
  setFlowHealth: (v: number) => void;
  setPatientStatus: (v: number) => void;
  damagePlayer: (amount: number) => void;
  addScore: (n: number) => void;
  tick: (dt: number) => void;
  openScan: (d: Discovery) => void;
  closeScan: () => void;
  addDiscovery: (d: Discovery) => void;
  dismissToast: () => void;
  setCameraMode: (m: CameraMode) => void;
  setSettings: (s: Partial<Settings>) => void;
  setQualityResolved: (q: "LOW" | "MEDIUM" | "HIGH") => void;
  setLoading: (progress: number, stage: string) => void;
  resetMission: () => void;
  setUiOverlay: (o: UiOverlay) => void;
  setTutorialDone: (v: boolean) => void;
  failMission: (reason: Exclude<FailReason, null>) => void;
}

/** Human-facing situation line under each objective (the WHY, spec §45). */
export const OBJECTIVE_WHY: Record<string, string> = {
  enter: "The nano-robot has been injected into the coronary artery.",
  locate: "Turbulence ahead means something is obstructing the channel.",
  scan: "Identify the obstruction before attempting treatment.",
  clear: "The clot is starving heart muscle of oxygen. Dissolve it.",
  restore: "Blood must reach the tissue downstream of the clot.",
  stabilize: "Hold position while the heart rhythm normalizes.",
};

const MISSION_OBJECTIVES: Record<MissionId, { id: string; label: string }[]> = {
  heart: [
    { id: "enter", label: "ENTER VASCULAR SYSTEM" },
    { id: "locate", label: "LOCATE FLOW ANOMALY" },
    { id: "scan", label: "SCAN THE BLOCKAGE" },
    { id: "clear", label: "BREAK DOWN THE CLOT" },
    { id: "restore", label: "RESTORE BLOOD FLOW" },
    { id: "stabilize", label: "STABILIZE THE HEART" },
  ],
  viral: [
    { id: "enter", label: "ENTER ALVEOLAR REGION" },
    { id: "locate", label: "LOCATE INFECTED CELLS" },
    { id: "scan", label: "SCAN INFECTION SITE" },
    { id: "clear", label: "ASSIST IMMUNE RESPONSE" },
    { id: "restore", label: "RESTORE OXYGEN EXCHANGE" },
  ],
  brain: [
    { id: "enter", label: "ENTER NEURAL NETWORK" },
    { id: "locate", label: "LOCATE DAMAGED PATHWAY" },
    { id: "scan", label: "SCAN NEURON JUNCTION" },
    { id: "clear", label: "RECONNECT PATHWAY" },
    { id: "restore", label: "RESTORE SIGNAL FLOW" },
  ],
};

const freshObjectives = (m: MissionId): ObjectiveState[] =>
  MISSION_OBJECTIVES[m].map((o) => ({ ...o, done: false, progress: 0 }));

export const useGame = create<GameState>((set, get) => ({
  phase: "BOOT",
  prevPhase: null,
  mission: "heart",
  cameraMode: "POV",

  patientStatus: 62,
  playerHealth: 100,
  missionTime: 0,
  score: 0,
  flowHealth: 0,

  objectives: freshObjectives("heart"),
  currentObjective: 0,

  discoveries: [],
  activeScan: null,
  discoveryToast: null,

  uiOverlay: null,
  tutorialDone: false,
  failReason: null,

  settings: {
    quality: "AUTO",
    motionReduced: false,
    audioMaster: 0.8,
    showTelemetry: false,
  },
  qualityResolved: "MEDIUM",
  loadingProgress: 0,
  loadingStage: "INITIALIZING MEDICAL NANOBOT...",

  setPhase: (p) => set((s) => ({ phase: p, prevPhase: s.phase })),

  startMission: (m) =>
    set({
      mission: m,
      objectives: freshObjectives(m),
      currentObjective: 0,
      patientStatus: 62,
      playerHealth: 100,
      missionTime: 0,
      score: 0,
      flowHealth: 0,
      discoveries: [],
      activeScan: null,
      discoveryToast: null,
      failReason: null,
      phase: "MISSION_BRIEF",
      prevPhase: "MISSION_SELECT",
      cameraMode: "CINEMATIC",
    }),

  setObjectiveProgress: (index, progress) =>
    set((s) => ({
      objectives: s.objectives.map((o, i) =>
        i === index ? { ...o, progress: Math.min(1, Math.max(0, progress)) } : o
      ),
    })),

  completeObjective: (index) => {
    const s = get();
    if (s.objectives[index]?.done) return;
    const objectives = s.objectives.map((o, i) =>
      i === index ? { ...o, done: true, progress: 1 } : o
    );
    const nextIdx = objectives.findIndex((o) => !o.done);
    set({
      objectives,
      currentObjective: nextIdx === -1 ? objectives.length : nextIdx,
      score: s.score + 500,
      patientStatus: Math.min(100, s.patientStatus + 6),
      // never stomp an open education panel (spec 21: scans are sacred)
      phase: s.phase === "EDUCATION_POPUP" ? "EDUCATION_POPUP" : "OBJECTIVE_COMPLETE",
    });
  },

  setFlowHealth: (v) => set({ flowHealth: Math.min(1, Math.max(0, v)) }),
  setPatientStatus: (v) => set({ patientStatus: Math.min(100, Math.max(0, v)) }),

  damagePlayer: (amount) =>
    set((s) => {
      const playerHealth = Math.max(0, s.playerHealth - amount);
      const patientStatus = Math.max(0, s.patientStatus - amount * 0.15);
      return { playerHealth, patientStatus, score: Math.max(0, s.score - 25) };
    }),

  addScore: (n) => set((s) => ({ score: s.score + n })),

  tick: (dt) => set((s) => ({ missionTime: s.missionTime + dt })),

  openScan: (d) =>
    set((s) => ({
      activeScan: d,
      prevPhase: s.phase === "EDUCATION_POPUP" ? s.prevPhase : s.phase,
      phase: "EDUCATION_POPUP",
      score: s.discoveries.find((x) => x.id === d.id) ? s.score : s.score + 150,
    })),

  closeScan: () =>
    set((s) => ({
      activeScan: null,
      phase: "PLAYING",
    })),

  addDiscovery: (d) =>
    set((s) =>
      s.discoveries.find((x) => x.id === d.id)
        ? {}
        : {
            discoveries: [...s.discoveries, d],
            discoveryToast: d,
            score: s.score + 100,
          }
    ),

  dismissToast: () => set({ discoveryToast: null }),

  setCameraMode: (m) => set({ cameraMode: m }),

  setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
  setQualityResolved: (q) => set({ qualityResolved: q }),
  setLoading: (progress, stage) => set({ loadingProgress: progress, loadingStage: stage }),

  resetMission: () => {
    const s = get();
    set({
      objectives: freshObjectives(s.mission),
      currentObjective: 0,
      patientStatus: 62,
      playerHealth: 100,
      missionTime: 0,
      score: 0,
      flowHealth: 0,
      activeScan: null,
      discoveryToast: null,
      failReason: null,
    });
  },

  setUiOverlay: (o) => set({ uiOverlay: o }),
  setTutorialDone: (v) => set({ tutorialDone: v }),

  failMission: (reason) =>
    set((s) =>
      s.phase === "MISSION_FAILED" ? {} : { phase: "MISSION_FAILED", failReason: reason }
    ),
}));

export const objectiveId = (m: MissionId, i: number) => MISSION_OBJECTIVES[m][i]?.id ?? "";
