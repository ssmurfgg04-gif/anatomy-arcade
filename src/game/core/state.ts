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
  failProgress: number; // clot-dissolve progress retained at fail time (0..1, -1 n/a)

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
  completeObjectiveSilent: (index: number) => void;
}

/**
 * Human-facing situation line under each objective (the WHY, spec §45).
 * Keyed by `${mission}:${objectiveId}` with a shared `${id}` fallback.
 */
export const OBJECTIVE_WHY: Record<string, string> = {
  // ---- shared defaults ----
  brief: "Know the patient, the threat and your tools before the clock starts.",
  scan: "Identify the threat before attempting treatment.",
  analyze: "A scanner readout tells you what you are dealing with — and how bad it is.",
  stabilize: "Hold position while the patient's vitals normalize.",
  // ---- heart ----
  "heart:enter": "The nano-robot has been injected into the coronary artery.",
  "heart:navigate": "Follow the flow — healthy channels carry cells at speed.",
  "heart:identify": "Coronary arteries feed the heart muscle itself. The LAD runs down the front wall.",
  "heart:locate": "The beacon marks where the flow signal goes dark.",
  "heart:clear": "The clot is starving heart muscle of oxygen. Dissolve it.",
  "heart:restore": "Blood must reach the tissue downstream of the clot.",
  "heart:stabilize": "Hold position while the heart rhythm normalizes.",
  // ---- viral ----
  "viral:enter": "The nano-robot rides the airflow in through the trachea.",
  "viral:navigate": "Airways branch sixteen times before the alveoli — follow the flow of air.",
  "viral:identify": "The acinus is the gas-exchange cluster at the end of a bronchiole. Infections hide here.",
  "viral:locate": "Infected cells glow irregularly — the beacon marks the cluster.",
  "viral:clear": "Neutralize the viral colonies so the immune system can finish the job.",
  "viral:restore": "Oxygen must cross the alveolar wall into the blood again.",
  "viral:stabilize": "Hold position while oxygen saturation recovers.",
  // ---- brain ----
  "brain:enter": "The nano-robot has been injected into the cerebral circulation.",
  "brain:navigate": "Follow the vessel as it branches through the neural web.",
  "brain:identify": "The MCA feeds the lateral brain — most strokes happen right here.",
  "brain:locate": "The beacon marks where the vessel wall balloons outward.",
  "brain:clear": "Reinforce the weakened wall before it ruptures — stroke prevention in real time.",
  "brain:restore": "Neurons downstream need perfusion to fire again.",
  "brain:stabilize": "Hold position while neural activity normalizes.",
};

/** WHY-line for an objective in a mission (mission key first, shared id fallback). */
export const objectiveWhy = (mission: MissionId, id: string): string | undefined =>
  OBJECTIVE_WHY[`${mission}:${id}`] ?? OBJECTIVE_WHY[id];

/**
 * Per-mission HUD/briefing chrome (title strip, branch-warning copy,
 * contextual action hints, completion payoff). Keeps the heart slice untouched
 * while missions 02/03 clone the 10-stage arc.
 */
export interface MissionUI {
  title: string;
  payoff: string;
  branchWarn: { title: string; body: string };
  hints: Record<string, { desktop: string; mobile: string }>;
}

export const MISSION_UI: Record<MissionId, MissionUI> = {
  heart: {
    title: "HEART RESPONSE",
    payoff: "FLOW RESTORED",
    branchWarn: {
      title: "LCX — LEFT CIRCUMFLEX",
      body: "THIS VESSEL IS CLEAR. THE BLOCKAGE IS IN THE LAD — TURN BACK.",
    },
    hints: {
      navigate: { desktop: "FOLLOW THE FLOW — REACH THE CYAN BEACON", mobile: "FOLLOW THE FLOW — REACH THE CYAN BEACON" },
      identify: { desktop: "BRANCH AHEAD — TAKE THE LAD CHANNEL", mobile: "BRANCH AHEAD — TAKE THE LAD CHANNEL" },
      scan: { desktop: "AIM AT A GLOWING MARKER — PRESS [Q] TO SCAN", mobile: "AIM AT A GLOWING MARKER — TAP SCAN" },
      locate: { desktop: "THE PLAQUE ZONE IS AHEAD — FOLLOW THE AMBER BEACON", mobile: "THE PLAQUE ZONE IS AHEAD — FOLLOW THE AMBER BEACON" },
      analyze: { desktop: "AIM AT THE CLOT — PRESS [Q] TO ANALYZE", mobile: "AIM AT THE CLOT — TAP SCAN TO ANALYZE" },
      clear: { desktop: "HOLD [E] ON THE CLOT TO DISSOLVE IT", mobile: "HOLD TREAT ON THE CLOT TO DISSOLVE IT" },
      stabilize: { desktop: "HOLD POSITION INSIDE THE CYAN RING", mobile: "HOLD POSITION INSIDE THE CYAN RING" },
    },
  },
  viral: {
    title: "VIRAL RESPONSE",
    payoff: "OXYGEN RESTORED",
    branchWarn: {
      title: "LEFT BRONCHIAL TREE",
      body: "THIS BRANCH IS HEALTHY. THE INFECTION IS IN THE RIGHT LOWER LOBE — TURN BACK.",
    },
    hints: {
      navigate: { desktop: "FOLLOW THE AIRFLOW — REACH THE CYAN BEACON", mobile: "FOLLOW THE AIRFLOW — REACH THE CYAN BEACON" },
      identify: { desktop: "BRANCH AHEAD — TAKE THE ACINUS CHANNEL", mobile: "BRANCH AHEAD — TAKE THE ACINUS CHANNEL" },
      scan: { desktop: "AIM AT A GLOWING MARKER — PRESS [Q] TO SCAN", mobile: "AIM AT A GLOWING MARKER — TAP SCAN" },
      locate: { desktop: "THE INFECTED CLUSTER IS AHEAD — FOLLOW THE AMBER BEACON", mobile: "THE INFECTED CLUSTER IS AHEAD — FOLLOW THE AMBER BEACON" },
      analyze: { desktop: "AIM AT THE INFECTED CELLS — PRESS [Q] TO ANALYZE", mobile: "AIM AT THE INFECTED CELLS — TAP SCAN TO ANALYZE" },
      clear: { desktop: "HOLD [E] ON A VIRAL COLONY TO NEUTRALIZE IT", mobile: "HOLD TREAT ON A VIRAL COLONY TO NEUTRALIZE IT" },
      stabilize: { desktop: "HOLD POSITION INSIDE THE CYAN RING", mobile: "HOLD POSITION INSIDE THE CYAN RING" },
    },
  },
  brain: {
    title: "STROKE RESPONSE",
    payoff: "SIGNAL RESTORED",
    branchWarn: {
      title: "ACA — ANTERIOR CEREBRAL",
      body: "THIS BRANCH IS HEALTHY. THE ANEURYSM IS ON THE MCA — TURN BACK.",
    },
    hints: {
      navigate: { desktop: "FOLLOW THE VESSEL — REACH THE CYAN BEACON", mobile: "FOLLOW THE VESSEL — REACH THE CYAN BEACON" },
      identify: { desktop: "BRANCH AHEAD — TAKE THE MCA CHANNEL", mobile: "BRANCH AHEAD — TAKE THE MCA CHANNEL" },
      scan: { desktop: "AIM AT A GLOWING MARKER — PRESS [Q] TO SCAN", mobile: "AIM AT A GLOWING MARKER — TAP SCAN" },
      locate: { desktop: "THE ANEURYSM ZONE IS AHEAD — FOLLOW THE AMBER BEACON", mobile: "THE ANEURYSM ZONE IS AHEAD — FOLLOW THE AMBER BEACON" },
      analyze: { desktop: "AIM AT THE ANEURYSM — PRESS [Q] TO ANALYZE", mobile: "AIM AT THE ANEURYSM — TAP SCAN TO ANALYZE" },
      clear: { desktop: "HOLD [E] ON THE WALL TO DEPLOY THE REINFORCEMENT MATRIX", mobile: "HOLD TREAT ON THE WALL TO REINFORCE IT" },
      stabilize: { desktop: "HOLD POSITION INSIDE THE CYAN RING", mobile: "HOLD POSITION INSIDE THE CYAN RING" },
    },
  },
};

/** Scan ids whose readout is a clinical ANALYSIS (not a discovery card). */
export const MISSION_ANALYSIS_IDS: Record<MissionId, string[]> = {
  heart: ["thrombus", "plaque"],
  viral: ["infectedCell", "virus"],
  brain: ["aneurysm", "weakWall"],
};

/** Analysis readout title per scan id (spec §25 stage 07 feedback). */
export const ANALYSIS_TITLES: Record<string, string> = {
  thrombus: "ANALYSIS — 92% OCCLUSION (LAD)",
  plaque: "ANALYSIS — PLAQUE RUPTURE SITE (LAD)",
  infectedCell: "ANALYSIS — 84% VIRAL LOAD (RIGHT LOWER LOBE)",
  virus: "ANALYSIS — ACTIVE VIRION SWARM (ACINUS 7)",
  aneurysm: "ANALYSIS — 6.2MM ANEURYSM (MCA BIFURCATION)",
  weakWall: "ANALYSIS — VESSEL WALL DEGRADATION (MCA)",
};

/**
 * All missions follow the spec §25 ten-stage arc (brief → entry → navigation →
 * branch identification → scanner calibration → locate → analysis → treatment
 * → restoration → stabilization). Each stage is one objective row; the stage
 * INDICES are shared, which keeps page.tsx scan handling and failProgress
 * mission-agnostic.
 */
const MISSION_OBJECTIVES: Record<MissionId, { id: string; label: string }[]> = {
  heart: [
    { id: "brief", label: "REVIEW PATIENT VITALS" },
    { id: "enter", label: "ENTER CIRCULATORY SYSTEM" },
    { id: "navigate", label: "NAVIGATE THE BLOODSTREAM" },
    { id: "identify", label: "IDENTIFY THE CORONARY ARTERY" },
    { id: "scan", label: "CALIBRATE THE SCANNER" },
    { id: "locate", label: "LOCATE THE PLAQUE" },
    { id: "analyze", label: "ANALYZE THE BLOCKAGE" },
    { id: "clear", label: "DISSOLVE THE CLOT" },
    { id: "restore", label: "RESTORE BLOOD FLOW" },
    { id: "stabilize", label: "STABILIZE THE HEART" },
  ],
  viral: [
    { id: "brief", label: "REVIEW PATIENT VITALS" },
    { id: "enter", label: "ENTER RESPIRATORY SYSTEM" },
    { id: "navigate", label: "NAVIGATE THE BRONCHIOLES" },
    { id: "identify", label: "IDENTIFY THE ACINUS" },
    { id: "scan", label: "CALIBRATE THE SCANNER" },
    { id: "locate", label: "LOCATE THE INFECTION" },
    { id: "analyze", label: "ANALYZE THE VIRAL LOAD" },
    { id: "clear", label: "NEUTRALIZE THE VIRUS" },
    { id: "restore", label: "RESTORE OXYGEN EXCHANGE" },
    { id: "stabilize", label: "STABILIZE THE PATIENT" },
  ],
  brain: [
    { id: "brief", label: "REVIEW PATIENT VITALS" },
    { id: "enter", label: "ENTER NEURAL PATHWAY" },
    { id: "navigate", label: "NAVIGATE THE NEURAL NETWORK" },
    { id: "identify", label: "IDENTIFY THE ARTERY BRANCH" },
    { id: "scan", label: "CALIBRATE THE SCANNER" },
    { id: "locate", label: "LOCATE THE ANEURYSM" },
    { id: "analyze", label: "ANALYZE THE RUPTURE RISK" },
    { id: "clear", label: "REINFORCE THE VESSEL WALL" },
    { id: "restore", label: "RESTORE SIGNAL FLOW" },
    { id: "stabilize", label: "STABILIZE NEURAL ACTIVITY" },
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
  failProgress: -1,

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
      failProgress: -1,
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

/** Marks an objective done with zero side effects (no banner, no score). */
  completeObjectiveSilent: (index) =>
    set((s) =>
      s.objectives[index]?.done
        ? {}
        : {
            objectives: s.objectives.map((o, i) =>
              i === index ? { ...o, done: true, progress: 1 } : o
            ),
          }
    ),

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
      failProgress: -1,
    });
  },

  setUiOverlay: (o) => set({ uiOverlay: o }),
  setTutorialDone: (v) => set({ tutorialDone: v }),

  failMission: (reason) =>
    set((s) =>
      s.phase === "MISSION_FAILED"
        ? {}
        : {
            phase: "MISSION_FAILED",
            failReason: reason,
            // how close the player got: keeps failure instructive, not punishing
            failProgress:
              s.objectives[7]?.progress != null && s.objectives[7].progress > 0
                ? s.objectives[7].progress
                : -1,
          }
    ),
}));

export const objectiveId = (m: MissionId, i: number) => MISSION_OBJECTIVES[m][i]?.id ?? "";
