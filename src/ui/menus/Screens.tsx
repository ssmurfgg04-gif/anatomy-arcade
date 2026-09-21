"use client";
/**
 * Loading, mission briefing, pause, objective banner, results, mission-complete
 * payoff, failure screens. Every screen answers WHO/WHAT/WHY/WHAT-NEXT.
 */
import { useEffect, useState } from "react";
import { useGame, OBJECTIVE_WHY } from "@/game/core/state";
import { playChime, playSuccess, playBlip } from "@/audio/sfx";
import type { MissionId } from "@/game/core/state";

export function LoadingScreen() {
  const progress = useGame((s) => s.loadingProgress);
  const stage = useGame((s) => s.loadingStage);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#04070c] px-8">
      <div className="mb-10 flex flex-col items-center">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border border-cyan-300/25" />
          <div className="absolute inset-0 animate-spin rounded-full border-t-2 border-cyan-300 shadow-[0_0_24px_rgba(45,217,232,0.4)]" style={{ animationDuration: "1.6s" }} />
          <div className="absolute inset-[30%] rounded-full bg-cyan-300/80 shadow-[0_0_18px_rgba(45,217,232,0.9)]" />
        </div>
        <div className="mt-6 font-mono text-[11px] tracking-[0.4em] text-white/80">{stage}</div>
      </div>
      <div className="h-1 w-64 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(45,217,232,0.8)] transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className="mt-3 font-mono text-[10px] tabular-nums tracking-[0.3em] text-white/40">{Math.round(progress * 100)}%</div>
    </div>
  );
}

const BRIEFS: Record<
  MissionId,
  { num: string; name: string; system: string; threat: string; situation: string; objective: string; difficulty: number; accent: string }
> = {
  heart: {
    num: "01",
    name: "HEART ATTACK RESPONSE",
    system: "CARDIOVASCULAR",
    threat: "CORONARY ARTERY BLOCKAGE",
    situation:
      "A clot is restricting blood flow in a coronary artery. The heart muscle downstream is losing oxygen every second.",
    objective: "Reach the blockage and restore blood flow before the patient crashes.",
    difficulty: 2,
    accent: "#C21E3A",
  },
  viral: {
    num: "02",
    name: "VIRAL INVASION",
    system: "RESPIRATORY / IMMUNE",
    threat: "VIRAL INFECTION IN THE ALVEOLI",
    situation: "Infected cells detected in the lung's air sacs. The immune response needs support.",
    objective: "Identify infected cells and assist the immune response.",
    difficulty: 3,
    accent: "#2DD9E8",
  },
  brain: {
    num: "03",
    name: "BRAIN MISSION",
    system: "NEURAL NETWORK",
    threat: "DISRUPTED NEURAL PATHWAY",
    situation: "A simulated neural pathway has lost its signal. The network needs rewiring.",
    objective: "Reconnect the pathway and restore the signal.",
    difficulty: 3,
    accent: "#8f6fd8",
  },
};

export function MissionBriefing() {
  const phase = useGame((s) => s.phase);
  const mission = useGame((s) => s.mission);
  const setPhase = useGame((s) => s.setPhase);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (phase !== "MISSION_BRIEF") return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [phase]);

  if (phase !== "MISSION_BRIEF") return null;
  const b = BRIEFS[mission];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#04070c]/72 px-5 backdrop-blur-[3px]">
      <div
        className={`w-full max-w-xl transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
      >
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-4xl font-bold text-white/12">{b.num}</span>
          <div>
            <div className="font-mono text-[10px] tracking-[0.45em] text-cyan-200/80">MISSION BRIEFING</div>
            <h2 className="font-mono text-xl font-bold tracking-[0.12em] text-white sm:text-2xl">{b.name}</h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/12 bg-white/10">
          {[
            ["SYSTEM", b.system],
            ["THREAT", b.threat],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#060a12]/90 px-4 py-3">
              <div className="font-mono text-[8px] tracking-[0.35em] text-cyan-200/60">{k}</div>
              <div className="mt-1 font-mono text-[11px] tracking-widest text-white/90">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 rounded-sm border border-white/12 bg-black/55 px-4 py-4">
          <div>
            <div className="font-mono text-[8px] tracking-[0.35em] text-cyan-200/60">YOUR ROLE</div>
            <div className="mt-1 text-[13px] leading-relaxed text-white/85">
              You are a medical nano-robot — a machine smaller than a grain of sand, piloted inside the human bloodstream.
            </div>
          </div>
          <div>
            <div className="font-mono text-[8px] tracking-[0.35em] text-rose-300/70">SITUATION</div>
            <div className="mt-1 text-[13px] leading-relaxed text-white/85">{b.situation}</div>
          </div>
          <div>
            <div className="font-mono text-[8px] tracking-[0.35em] text-cyan-200/60">OBJECTIVE</div>
            <div className="mt-1 text-[13px] font-semibold leading-relaxed text-cyan-100">{b.objective}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.25em] text-white/55">
          <span>
            DIFFICULTY{" "}
            <span className="text-amber-300">
              {"\u2605".repeat(b.difficulty)}
              <span className="text-white/20">{"\u2605".repeat(5 - b.difficulty)}</span>
            </span>
          </span>
          <span className="hidden sm:inline">WASD MOVE &nbsp;·&nbsp; MOUSE LOOK &nbsp;·&nbsp; Q SCAN &nbsp;·&nbsp; E TREAT</span>
          <span className="sm:hidden">STICK MOVE &nbsp;·&nbsp; SWIPE LOOK</span>
        </div>

        <button
          className="group relative mt-5 w-full overflow-hidden rounded-sm border border-cyan-300/60 bg-cyan-400/10 py-4 font-mono text-sm tracking-[0.35em] text-cyan-100 transition-all duration-300 hover:bg-cyan-300/25 hover:shadow-[0_0_40px_rgba(45,217,232,0.35)]"
          onClick={() => setPhase("MISSION_INTRO")}
        >
          <span className="relative z-10">BEGIN MISSION</span>
          <span className="absolute inset-y-0 left-0 w-1 bg-cyan-300 shadow-[0_0_12px_rgba(45,217,232,1)] transition-all duration-300 group-hover:w-1.5" />
        </button>
        <div className="mt-2 text-center font-mono text-[9px] tracking-[0.3em] text-white/35">
          Follow the red beacon. The HUD will guide you step by step.
        </div>
      </div>
    </div>
  );
}

export function ObjectiveBanner() {
  const phase = useGame((s) => s.phase);
  const setPhase = useGame((s) => s.setPhase);
  const objectives = useGame((s) => s.objectives);
  const currentObjective = useGame((s) => s.currentObjective);
  const done = objectives[currentObjective - 1];
  const next = objectives[currentObjective];
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (phase !== "OBJECTIVE_COMPLETE") return;
    playChime();
    setShow(true);
    const id = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        const st = useGame.getState();
        if (st.phase === "OBJECTIVE_COMPLETE") {
          const all = st.objectives.every((o) => o.done);
          st.setPhase(all ? "MISSION_COMPLETE" : "PLAYING");
        }
      }, 350);
    }, 1900);
    return () => clearTimeout(id);
  }, [phase, setPhase]);

  if (phase !== "OBJECTIVE_COMPLETE" || !show || !done) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div className="animate-in fade-in duration-300 text-center">
        <div className="font-mono text-[10px] tracking-[0.5em] text-cyan-200/80">OBJECTIVE COMPLETE</div>
        <div className="mt-2 font-mono text-xl font-semibold tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(45,217,232,0.4)]">
          {done.label}
        </div>
        {next && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="font-mono text-[9px] tracking-[0.4em] text-amber-200/80">NEXT</div>
            <div className="mt-1 font-mono text-sm tracking-[0.25em] text-white/85">{next.label}</div>
            {OBJECTIVE_WHY[next.id] && (
              <div className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-white/50">{OBJECTIVE_WHY[next.id]}</div>
            )}
          </div>
        )}
        <div className="mx-auto mt-4 h-px w-40 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
      </div>
    </div>
  );
}

export function MissionComplete() {
  const phase = useGame((s) => s.phase);
  const [showPayoff, setShowPayoff] = useState(false);
  useEffect(() => {
    if (phase !== "MISSION_COMPLETE") return;
    playSuccess();
    const id = setTimeout(() => setShowPayoff(true), 2400);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase !== "MISSION_COMPLETE") return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      {!showPayoff ? (
        <div className="text-center">
          <div className="animate-pulse font-mono text-3xl font-bold tracking-[0.35em] text-white drop-shadow-[0_0_30px_rgba(45,217,232,0.6)]">
            FLOW RESTORED
          </div>
          <div className="mx-auto mt-6 h-px w-64 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
        </div>
      ) : (
        <Results />
      )}
    </div>
  );
}

/** Mission failure (spec §17/§18): clear reason, instant retry, no punishment maze. */
export function MissionFailed() {
  const phase = useGame((s) => s.phase);
  const failReason = useGame((s) => s.failReason);
  const patientStatus = useGame((s) => s.patientStatus);
  const setPhase = useGame((s) => s.setPhase);
  const resetMission = useGame((s) => s.resetMission);

  useEffect(() => {
    if (phase !== "MISSION_FAILED") return;
    playBlip(220, 0.35, 0.12);
  }, [phase]);

  if (phase !== "MISSION_FAILED") return null;

  const reason = failReason === "RIG"
    ? {
        title: "NANO-RIG DISABLED",
        body: "Collisions with the vessel wall overwhelmed the rig. Fly gently: wall scrapes damage your machine.",
      }
    : {
        title: "PATIENT LOST",
        body: "The heart muscle did not receive enough oxygen in time. Speed matters: follow the red beacon directly to the blockage.",
      };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#0a0406]/88 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="font-mono text-[10px] tracking-[0.5em] text-rose-300/90">MISSION FAILED</div>
        <h2 className="mt-1 font-mono text-2xl font-bold tracking-[0.15em] text-white">{reason.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-white/70">{reason.body}</p>
        <div className="mt-4 rounded-sm border border-white/12 bg-black/50 px-4 py-3 font-mono text-[11px] leading-relaxed text-white/60">
          TIP: boost (SHIFT) down open stretches, ease off near the walls, and keep the red beacon in view.
        </div>
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-sm border border-rose-300/60 bg-rose-400/10 py-3 font-mono text-xs tracking-[0.3em] text-rose-100 transition hover:bg-rose-300/25"
            onClick={() => {
              resetMission();
              setPhase("MISSION_INTRO");
            }}
          >
            TRY AGAIN
          </button>
          <button
            className="flex-1 rounded-sm border border-white/25 py-3 font-mono text-xs tracking-[0.3em] text-white/75 transition hover:border-white/50 hover:text-white"
            onClick={() => setPhase("MISSION_SELECT")}
          >
            MISSIONS
          </button>
        </div>
        <div className="mt-3 text-center font-mono text-[9px] tracking-[0.3em] text-white/30">
          PATIENT STATUS AT FAILURE: {Math.round(patientStatus)}%
        </div>
      </div>
    </div>
  );
}

export function Results() {
  const missionTime = useGame((s) => s.missionTime);
  const patientStatus = useGame((s) => s.patientStatus);
  const playerHealth = useGame((s) => s.playerHealth);
  const score = useGame((s) => s.score);
  const discoveries = useGame((s) => s.discoveries);
  const setPhase = useGame((s) => s.setPhase);
  const resetMission = useGame((s) => s.resetMission);
  const setUiOverlay = useGame((s) => s.setUiOverlay);

  const accuracy = Math.max(0, Math.round(playerHealth));
  const rank = score > 4200 ? "S" : score > 3400 ? "A" : score > 2600 ? "B" : "C";
  const lessons = discoveries.slice(0, 3);

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#04070c]/88 px-6 py-8 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <div className="font-mono text-[10px] tracking-[0.45em] text-cyan-200/80">MISSION COMPLETE</div>
        <div className="mt-1 flex items-baseline gap-4">
          <h2 className="font-mono text-2xl font-bold tracking-[0.15em] text-white">HEART RESPONSE</h2>
          <span className="font-mono text-4xl font-bold text-cyan-300 drop-shadow-[0_0_18px_rgba(45,217,232,0.6)]">{rank}</span>
        </div>

        <div className="mt-4 rounded-sm border border-cyan-300/30 bg-cyan-400/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.35em] text-cyan-200/80">BIO XP EARNED</span>
            <span className="font-mono text-2xl font-bold tabular-nums text-cyan-200 drop-shadow-[0_0_14px_rgba(45,217,232,0.5)]">+{score}</span>
          </div>
        </div>

        {lessons.length > 0 && (
          <div className="mt-5">
            <div className="font-mono text-[9px] tracking-[0.4em] text-cyan-200/70">TODAY YOU LEARNED</div>
            <div className="mt-2 space-y-2">
              {lessons.map((d, i) => (
                <div key={d.id} className="flex gap-3 border-l-2 border-cyan-300/40 pl-3">
                  <span className="font-mono text-[10px] tabular-nums text-cyan-300/70">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="font-mono text-[11px] tracking-widest text-white/85">{d.title}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-white/55">{d.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2.5 font-mono text-xs">
          {[
            ["PATIENT STATUS", `${Math.round(patientStatus)}%`],
            ["MISSION TIME", `${Math.floor(missionTime / 60)}m ${Math.floor(missionTime % 60)}s`],
            ["RIG INTEGRITY", `${accuracy}%`],
            ["DISCOVERIES", `${discoveries.length}`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-white/8 pb-2">
              <span className="tracking-[0.25em] text-white/55">{k}</span>
              <span className="tabular-nums text-white">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            className="rounded-sm border border-cyan-300/60 bg-cyan-400/10 py-3 font-mono text-xs tracking-[0.3em] text-cyan-100 transition hover:bg-cyan-300/25"
            onClick={() => {
              resetMission();
              setPhase("MISSION_INTRO");
            }}
          >
            REPLAY
          </button>
          <button
            className="rounded-sm border border-white/25 py-3 font-mono text-xs tracking-[0.3em] text-white/75 transition hover:border-white/50 hover:text-white"
            onClick={() => setPhase("MISSION_SELECT")}
          >
            MISSIONS
          </button>
          <button
            className="col-span-2 rounded-sm border border-white/15 py-2.5 font-mono text-[10px] tracking-[0.3em] text-white/55 transition hover:border-cyan-300/40 hover:text-cyan-100"
            onClick={() => setUiOverlay("JOURNAL")}
          >
            EXPLORE IN JOURNAL
          </button>
        </div>
      </div>
    </div>
  );
}

export function PauseMenu({ onResume }: { onResume: () => void }) {
  const setPhase = useGame((s) => s.setPhase);
  const resetMission = useGame((s) => s.resetMission);
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#04070c]/88 px-6 py-8 backdrop-blur-md">
      <div className="w-full max-w-sm">
        <h2 className="font-mono text-lg tracking-[0.4em] text-white">PAUSED</h2>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            className="rounded-sm border border-cyan-300/50 bg-cyan-400/10 py-3 font-mono text-xs tracking-[0.3em] text-cyan-100 transition hover:bg-cyan-300/25"
            onClick={onResume}
          >
            RESUME
          </button>
          <button
            className="rounded-sm border border-white/20 py-3 font-mono text-xs tracking-[0.3em] text-white/70 transition hover:border-white/50 hover:text-white"
            onClick={() => {
              resetMission();
              setPhase("MISSION_INTRO");
            }}
          >
            RESTART MISSION
          </button>
          <button
            className="rounded-sm border border-white/20 py-3 font-mono text-xs tracking-[0.3em] text-white/70 transition hover:border-white/50 hover:text-white"
            onClick={() => setUiOverlay("HOW_TO_PLAY")}
          >
            CONTROLS
          </button>
          <button
            className="rounded-sm border border-white/20 py-3 font-mono text-xs tracking-[0.3em] text-white/70 transition hover:border-white/50 hover:text-white"
            onClick={() => setUiOverlay("JOURNAL")}
          >
            JOURNAL
          </button>
          <button
            className="rounded-sm border border-white/20 py-3 font-mono text-xs tracking-[0.3em] text-white/70 transition hover:border-white/50 hover:text-white"
            onClick={() => setPhase("MAIN_MENU")}
          >
            ABORT TO MENU
          </button>
        </div>

        <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
          <div>
            <div className="mb-1.5 font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">QUALITY</div>
            <div className="flex gap-2">
              {(["AUTO", "LOW", "MEDIUM", "HIGH"] as const).map((q) => (
                <button
                  key={q}
                  className={`flex-1 rounded-sm border py-1.5 font-mono text-[9px] tracking-widest transition ${
                    settings.quality === q ? "border-cyan-300/70 text-cyan-100" : "border-white/15 text-white/50 hover:border-white/40"
                  }`}
                  onClick={() => setSettings({ quality: q })}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">MOTION</div>
            <div className="flex gap-2">
              {[
                { label: "FULL", v: false },
                { label: "REDUCED", v: true },
              ].map((o) => (
                <button
                  key={o.label}
                  className={`flex-1 rounded-sm border py-1.5 font-mono text-[9px] tracking-widest transition ${
                    settings.motionReduced === o.v ? "border-cyan-300/70 text-cyan-100" : "border-white/15 text-white/50 hover:border-white/40"
                  }`}
                  onClick={() => setSettings({ motionReduced: o.v })}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">
              <span>AUDIO</span>
              <span className="tabular-nums text-white/50">{Math.round(settings.audioMaster * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.audioMaster}
              className="w-full accent-cyan-300"
              onChange={(e) => setSettings({ audioMaster: parseFloat(e.target.value) })}
              aria-label="Audio volume"
            />
          </div>
        </div>

        <button
          className="mt-4 w-full rounded-sm border border-white/10 py-2 font-mono text-[9px] tracking-[0.3em] text-white/40 transition hover:border-white/30 hover:text-white/70"
          onClick={() => setUiOverlay("CREDITS")}
        >
          ASSET CREDITS
        </button>
      </div>
    </div>
  );
}
