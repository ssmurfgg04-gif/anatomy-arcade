"use client";
/**
 * Loading, pause, objective banner, results, mission-complete payoff screens.
 */
import { useEffect, useState } from "react";
import { useGame } from "@/game/core/state";
import { playChime, playSuccess } from "@/audio/sfx";

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

export function ObjectiveBanner() {
  const phase = useGame((s) => s.phase);
  const setPhase = useGame((s) => s.setPhase);
  const objectives = useGame((s) => s.objectives);
  const currentObjective = useGame((s) => s.currentObjective);
  const done = objectives[currentObjective - 1];
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

export function Results() {
  const missionTime = useGame((s) => s.missionTime);
  const patientStatus = useGame((s) => s.patientStatus);
  const playerHealth = useGame((s) => s.playerHealth);
  const score = useGame((s) => s.score);
  const discoveries = useGame((s) => s.discoveries);
  const setPhase = useGame((s) => s.setPhase);
  const resetMission = useGame((s) => s.resetMission);

  const accuracy = Math.max(0, Math.round(playerHealth));
  const rank = score > 4200 ? "S" : score > 3400 ? "A" : score > 2600 ? "B" : "C";

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#04070c]/85 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <div className="font-mono text-[10px] tracking-[0.45em] text-cyan-200/80">MISSION COMPLETE</div>
        <div className="mt-1 flex items-baseline gap-4">
          <h2 className="font-mono text-2xl font-bold tracking-[0.15em] text-white">HEART RESPONSE</h2>
          <span className="font-mono text-4xl font-bold text-cyan-300 drop-shadow-[0_0_18px_rgba(45,217,232,0.6)]">{rank}</span>
        </div>
        <div className="mt-6 space-y-2.5 font-mono text-xs">
          {[
            ["PATIENT STATUS", `${Math.round(patientStatus)}%`],
            ["MISSION TIME", `${Math.floor(missionTime / 60)}m ${Math.floor(missionTime % 60)}s`],
            ["RIG INTEGRITY", `${accuracy}%`],
            ["DISCOVERIES", `${discoveries.length}`],
            ["SCORE", `${score}`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-white/8 pb-2">
              <span className="tracking-[0.25em] text-white/55">{k}</span>
              <span className="tabular-nums text-white">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <button
            className="flex-1 rounded-sm border border-cyan-300/60 bg-cyan-400/10 py-3 font-mono text-xs tracking-[0.3em] text-cyan-100 transition hover:bg-cyan-300/25"
            onClick={() => {
              resetMission();
              setPhase("MISSION_INTRO");
            }}
          >
            RETRY
          </button>
          <button
            className="flex-1 rounded-sm border border-white/25 py-3 font-mono text-xs tracking-[0.3em] text-white/75 transition hover:border-white/50 hover:text-white"
            onClick={() => {
              resetMission();
              setPhase("MISSION_SELECT");
            }}
          >
            MISSIONS
          </button>
        </div>
      </div>
    </div>
  );
}

export function PauseMenu({ onResume }: { onResume: () => void }) {
  const setPhase = useGame((s) => s.setPhase);
  const resetMission = useGame((s) => s.resetMission);
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  const [showCredits, setShowCredits] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070c]/88 px-6 backdrop-blur-md">
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
            onClick={() => setPhase("MAIN_MENU")}
          >
            ABORT TO MENU
          </button>
          <button
            className="rounded-sm border border-white/20 py-3 font-mono text-xs tracking-[0.3em] text-white/70 transition hover:border-white/50 hover:text-white"
            onClick={() => setShowCredits((v) => !v)}
          >
            CREDITS
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

        {showCredits && (
          <div className="mt-5 rounded-sm border border-white/12 bg-black/50 p-4 font-mono text-[10px] leading-relaxed text-white/60">
            <div className="mb-2 tracking-[0.3em] text-white/80">ASSET CREDITS</div>
            Procedural vessel, cells, clot and nano-robot built in-house for Anatomy Arcade.
            Educational content reviewed against public medical education material.
            3D anatomical assets (upcoming): CC-BY Sketchfab authors, credited in docs/ASSETS.md.
          </div>
        )}
      </div>
    </div>
  );
}
