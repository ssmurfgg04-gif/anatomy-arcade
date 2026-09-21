"use client";
/**
 * Game HUD (spec §22): corner-anchored telemetry, center reticle, objective
 * panel, discovery toast, damage + heartbeat vignettes. Diegetic, no cards.
 */
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/core/state";
import { ANATOMY } from "@/game/data/anatomy";

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function HUD({ onPause }: { onPause: () => void }) {
  const phase = useGame((s) => s.phase);
  const missionTime = useGame((s) => s.missionTime);
  const patientStatus = useGame((s) => s.patientStatus);
  const playerHealth = useGame((s) => s.playerHealth);
  const objectives = useGame((s) => s.objectives);
  const currentObjective = useGame((s) => s.currentObjective);
  const toast = useGame((s) => s.discoveryToast);
  const dismissToast = useGame((s) => s.dismissToast);
  const beatRef = useRef<HTMLDivElement>(null);
  const damageRef = useRef<HTMLDivElement>(null);
  const lastHealth = useRef(100);

  // heartbeat vignette pulse (subtle, tied to BPM via CSS animation)
  useEffect(() => {
    const id = setInterval(() => {
      const el = beatRef.current;
      if (!el) return;
      el.style.opacity = "0.16";
      setTimeout(() => (el.style.opacity = "0.05"), 140);
    }, 780);
    return () => clearInterval(id);
  }, []);

  // damage flash
  useEffect(() => {
    if (playerHealth < lastHealth.current - 0.5 && damageRef.current) {
      damageRef.current.style.opacity = "0.55";
      setTimeout(() => {
        if (damageRef.current) damageRef.current.style.opacity = "0";
      }, 260);
    }
    lastHealth.current = playerHealth;
  }, [playerHealth]);

  // toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(dismissToast, 3600);
    return () => clearTimeout(id);
  }, [toast, dismissToast]);

  const inGame = phase === "PLAYING" || phase === "SCANNING" || phase === "INTERACTION" || phase === "OBJECTIVE_COMPLETE" || phase === "EDUCATION_POPUP";
  if (!inGame) return null;

  const cur = objectives[currentObjective];

  return (
    <div className="pointer-events-none fixed inset-0 z-30 font-sans text-white">
      {/* vignettes */}
      <div ref={beatRef} className="absolute inset-0 transition-opacity duration-300" style={{ opacity: 0.05, background: "radial-gradient(ellipse at center, transparent 55%, rgba(194,30,58,0.5) 100%)" }} />
      <div ref={damageRef} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(194,30,58,0.85) 100%)" }} />

      {/* top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between px-5 pt-[max(env(safe-area-inset-top),14px)] sm:px-8">
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-200/80">HEART RESPONSE</div>
          <div className="flex items-center gap-3 font-mono text-xs text-white/70">
            <span className="tabular-nums">{fmtTime(missionTime)}</span>
            <span className="text-cyan-300/60">|</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(194,30,58,0.9)]" />
              PATIENT {Math.round(patientStatus)}%
            </span>
            <span className="text-cyan-300/60">|</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(45,217,232,0.9)]" />
              RIG {Math.round(playerHealth)}%
            </span>
          </div>
        </div>
        <button
          className="pointer-events-auto rounded-sm border border-white/20 bg-black/30 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] text-white/70 backdrop-blur-sm transition hover:border-cyan-300/50 hover:text-cyan-100"
          onClick={onPause}
        >
          ESC
        </button>
      </div>

      {/* center reticle */}
      {phase === "PLAYING" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-8 w-8">
            <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/90 shadow-[0_0_8px_rgba(45,217,232,0.9)]" />
            <div className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-cyan-200/50" />
            <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-cyan-200/50" />
            <div className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-cyan-200/50" />
            <div className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-cyan-200/50" />
          </div>
        </div>
      )}

      {/* objective panel — right side */}
      <div className="absolute right-5 top-1/2 hidden w-56 -translate-y-1/2 sm:right-8 md:block">
        <div className="mb-2 font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">OBJECTIVE</div>
        <div className="font-mono text-[13px] leading-snug tracking-wide text-white/90">
          {cur ? cur.label : "MISSION COMPLETE"}
        </div>
        {cur && cur.progress > 0 && cur.progress < 1 && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(45,217,232,0.7)] transition-all" style={{ width: `${cur.progress * 100}%` }} />
          </div>
        )}
        <div className="mt-4 space-y-1.5">
          {objectives.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2 font-mono text-[9px] tracking-widest">
              <span className={`inline-block h-1 w-1 rounded-full ${o.done ? "bg-cyan-300" : i === currentObjective ? "bg-amber-300 animate-pulse" : "bg-white/20"}`} />
              <span className={o.done ? "text-white/35 line-through" : i === currentObjective ? "text-white/85" : "text-white/40"}>
                {String(i + 1).padStart(2, "0")} {o.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* bottom-left controls hint (desktop only) */}
      <div className="absolute bottom-6 left-8 hidden font-mono text-[9px] tracking-[0.25em] text-white/35 lg:block">
        WASD MOVE &nbsp;·&nbsp; SHIFT BOOST &nbsp;·&nbsp; Q SCAN &nbsp;·&nbsp; E TREAT
      </div>

      {/* discovery toast */}
      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 sm:bottom-16">
          <div className="flex items-center gap-3 rounded-sm border border-cyan-300/40 bg-black/60 px-4 py-2.5 backdrop-blur-md">
            <span className="inline-block h-2 w-2 rotate-45 bg-cyan-300 shadow-[0_0_10px_rgba(45,217,232,1)]" />
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-cyan-200/80">DISCOVERY</div>
              <div className="font-mono text-xs tracking-widest text-white/90">
                {ANATOMY[toast.id]?.title ?? toast.title}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
