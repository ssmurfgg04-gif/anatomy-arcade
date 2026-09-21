"use client";
/**
 * MAIN MENU (spec §29): one clear sentence that explains the game, one primary
 * action, honest secondary actions. Cinematic 3D backdrop handled by MenuScene.
 */
import { useEffect, useState } from "react";
import { useGame } from "@/game/core/state";

export function MainMenu() {
  const setPhase = useGame((s) => s.setPhase);
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const discoveries = useGame((s) => s.discoveries);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col">
      {/* top-right small links */}
      <div className="pointer-events-auto absolute right-6 top-[max(env(safe-area-inset-top),18px)] flex gap-4 font-mono text-[10px] tracking-[0.3em] text-white/50">
        <button className="transition hover:text-cyan-200" onClick={() => setUiOverlay("JOURNAL")}>
          JOURNAL
        </button>
        <button className="transition hover:text-cyan-200" onClick={() => setUiOverlay("CREDITS")}>
          CREDITS
        </button>
      </div>

      {/* title block — lower-left anchored, cinematic */}
      <div className="mt-auto w-full px-6 pb-[max(env(safe-area-inset-bottom),8vh)] sm:px-12">
        <div
          className={`transition-all duration-1000 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-cyan-300/70" />
            <span className="font-mono text-[10px] tracking-[0.45em] text-cyan-200/90">
              MEDICAL NANOBOT PROGRAM
            </span>
          </div>
          <h1 className="font-sans text-[13vw] font-bold leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-8xl">
            ANATOMY
            <br />
            <span className="text-cyan-300 drop-shadow-[0_0_28px_rgba(45,217,232,0.45)]">ARCADE</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Become a nano-robot, enter the human body, and complete medical missions while learning
            how your body works.
          </p>
          <p className="mt-1.5 font-mono text-[10px] tracking-[0.3em] text-cyan-200/60">
            ENTER THE BODY. SAVE THE PATIENT. LEARN HOW IT WORKS.
          </p>

          <div className="pointer-events-auto mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="group relative overflow-hidden rounded-sm border border-cyan-300/60 bg-cyan-400/10 px-10 py-4 font-mono text-sm tracking-[0.35em] text-cyan-100 transition-all duration-300 hover:bg-cyan-300/25 hover:shadow-[0_0_40px_rgba(45,217,232,0.35)]"
              onClick={() => setPhase("MISSION_SELECT")}
            >
              <span className="relative z-10">PLAY</span>
              <span className="absolute inset-y-0 left-0 w-1 bg-cyan-300 shadow-[0_0_12px_rgba(45,217,232,1)] transition-all duration-300 group-hover:w-1.5" />
            </button>
            <button
              className="rounded-sm border border-white/20 px-7 py-4 font-mono text-sm tracking-[0.3em] text-white/75 transition hover:border-white/50 hover:text-white"
              onClick={() => setUiOverlay("HOW_TO_PLAY")}
            >
              HOW TO PLAY
            </button>
          </div>

          <p className="mt-6 font-mono text-[10px] tracking-[0.25em] text-white/40">
            {discoveries.length > 0
              ? `JOURNAL: ${discoveries.length} DISCOVER${discoveries.length === 1 ? "Y" : "IES"} LOGGED`
              : "MISSION 01 AVAILABLE — NO EXPERIENCE REQUIRED"}
          </p>
        </div>
      </div>
    </div>
  );
}
