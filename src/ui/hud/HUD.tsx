"use client";
/**
 * Game HUD (spec §22 + playability law): corner telemetry, center reticle,
 * objective panel (desktop) + always-visible mobile ticker, distance to
 * target, contextual action hints taught at the moment of need, discovery
 * toast, micro-facts, damage + heartbeat vignettes.
 */
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/core/state";
import { ANATOMY, MICRO_FACTS } from "@/game/data/anatomy";
import type { HeartRefs } from "@/game/levels/heart/HeartMission";
import { useIsMobile } from "@/hooks/use-mobile";

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Spec §34 progress tech: `██████░░░░ 60%` block bar. */
function BlockBar({ p, className = "" }: { p: number; className?: string }) {
  const cells = 10;
  const filled = Math.round(Math.min(1, Math.max(0, p)) * cells);
  return (
    <span className={`font-mono tabular-nums ${className}`} aria-label={`${Math.round(p * 100)}%`}>
      <span className="text-cyan-300">{"\u2588".repeat(filled)}</span>
      <span className="text-white/25">{"\u2591".repeat(cells - filled)}</span>
      <span className="ml-1.5 text-white/70">{Math.round(p * 100)}%</span>
    </span>
  );
}

/** Polls the live distance-to-beacon ref (kept out of zustand: no per-frame rerenders). */
function useTargetDist(active: boolean) {
  const [dist, setDist] = useState(-1);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const refs = (window as unknown as { __aaRefs?: { current: HeartRefs } }).__aaRefs?.current;
      if (refs) setDist(refs.targetDist.current);
    }, 240);
    return () => clearInterval(id);
  }, [active]);
  return dist;
}

/** Occasional verified micro-facts (spec §46): one every ~50s, never over panels. */
function MicroFact({ quiet }: { quiet: boolean }) {
  const phase = useGame((s) => s.phase);
  const [fact, setFact] = useState<string | null>(null);
  const nextAt = useRef(28);

  useEffect(() => {
    if (phase !== "PLAYING") return;
    const id = setInterval(() => {
      if (quiet) return;
      const t = useGame.getState().missionTime;
      if (t >= nextAt.current) {
        nextAt.current = t + 52;
        setFact(MICRO_FACTS[Math.floor(Math.random() * MICRO_FACTS.length)]);
        setTimeout(() => setFact(null), 6500);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, quiet]);

  if (!fact) return null;
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 animate-in fade-in duration-500 sm:bottom-20">
      <div className="flex max-w-[86vw] items-start gap-2.5 rounded-sm border border-amber-200/20 bg-black/55 px-3.5 py-2 backdrop-blur-sm">
        <span className="mt-0.5 font-mono text-[8px] tracking-[0.3em] text-amber-200/70">DID YOU KNOW</span>
        <span className="text-[11px] leading-snug text-white/70">{fact}</span>
      </div>
    </div>
  );
}

export function HUD({ onPause }: { onPause: () => void }) {
  const phase = useGame((s) => s.phase);
  const missionTime = useGame((s) => s.missionTime);
  const patientStatus = useGame((s) => s.patientStatus);
  const playerHealth = useGame((s) => s.playerHealth);
  const score = useGame((s) => s.score);
  const objectives = useGame((s) => s.objectives);
  const currentObjective = useGame((s) => s.currentObjective);
  const toast = useGame((s) => s.discoveryToast);
  const dismissToast = useGame((s) => s.dismissToast);
  const isMobile = useIsMobile();
  const beatRef = useRef<HTMLDivElement>(null);
  const damageRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const branchWarnRef = useRef<HTMLDivElement>(null);
  const lastHealth = useRef(100);

  // wrong-branch guidance (stage 04): the LCX spur teaches by nudging, not punishing
  useEffect(() => {
    const onWrong = () => {
      const el = branchWarnRef.current;
      if (!el) return;
      el.style.opacity = "1";
      el.style.transform = "translate(-50%, 0)";
      setTimeout(() => {
        if (el) {
          el.style.opacity = "0";
          el.style.transform = "translate(-50%, -6px)";
        }
      }, 3200);
    };
    window.addEventListener("aa-wrong-branch", onWrong);
    return () => window.removeEventListener("aa-wrong-branch", onWrong);
  }, []);

  // reticle treatment feedback: amber when aimed at clot, pulse while dissolving
  useEffect(() => {
    const onAim = (e: Event) => {
      const aiming = !!(e as CustomEvent).detail?.aiming;
      const el = reticleRef.current;
      if (!el) return;
      el.style.setProperty("--reticle-c", aiming ? "251,191,36" : "45,217,232");
      el.dataset.aiming = aiming ? "1" : "0";
    };
    const onProgress = () => {
      const el = reticleRef.current;
      if (!el) return;
      el.style.transform = "scale(1.35)";
      setTimeout(() => {
        if (el) el.style.transform = "scale(1)";
      }, 90);
    };
    window.addEventListener("aa-aim-clot", onAim);
    window.addEventListener("aa-dissolve-progress", onProgress);
    return () => {
      window.removeEventListener("aa-aim-clot", onAim);
      window.removeEventListener("aa-dissolve-progress", onProgress);
    };
  }, []);

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

  const cur = objectives[currentObjective];
  const dist = useTargetDist(
    !!cur && ["navigate", "identify", "scan", "locate", "analyze", "clear", "stabilize"].includes(cur.id)
  );

  if (!inGame) return null;

  const distLabel = dist >= 0 ? `${Math.max(0, Math.round(dist))}m` : null;

  // contextual action hint: the exact input needed for the current objective
  // (desktop shows the key, mobile names the button — spec §35)
  let actionHint: string | null = null;
  if (cur) {
    if (cur.id === "navigate") actionHint = "FOLLOW THE FLOW — REACH THE CYAN BEACON";
    else if (cur.id === "identify") actionHint = "BRANCH AHEAD — TAKE THE LAD CHANNEL";
    else if (cur.id === "scan")
      actionHint = isMobile ? "AIM AT A GLOWING MARKER — TAP SCAN" : "AIM AT A GLOWING MARKER — PRESS [Q] TO SCAN";
    else if (cur.id === "locate") actionHint = "THE PLAQUE ZONE IS AHEAD — FOLLOW THE AMBER BEACON";
    else if (cur.id === "analyze")
      actionHint = isMobile ? "AIM AT THE CLOT — TAP SCAN TO ANALYZE" : "AIM AT THE CLOT — PRESS [Q] TO ANALYZE";
    else if (cur.id === "clear")
      actionHint = isMobile ? "HOLD TREAT ON THE CLOT TO DISSOLVE IT" : "HOLD [E] ON THE CLOT TO DISSOLVE IT";
    else if (cur.id === "stabilize") actionHint = "HOLD POSITION INSIDE THE CYAN RING";
  }

  // micro-facts are for traversal moments only — never mid-combat
  const combat = cur?.id === "clear" || cur?.id === "restore" || cur?.id === "stabilize";

  return (
    <div className="pointer-events-none fixed inset-0 z-30 font-sans text-white">
      {/* vignettes */}
      <div ref={beatRef} className="absolute inset-0 transition-opacity duration-300" style={{ opacity: 0.05, background: "radial-gradient(ellipse at center, transparent 55%, rgba(194,30,58,0.5) 100%)" }} />
      <div ref={damageRef} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(194,30,58,0.85) 100%)" }} />

      {/* top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between px-5 pt-[max(env(safe-area-inset-top),14px)] sm:px-8">
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-200/80">HEART RESPONSE</div>
          <div className="flex items-center gap-2.5 font-mono text-xs text-white/70 sm:gap-3">
            <span className="tabular-nums" title="Mission time">T+{fmtTime(missionTime)}</span>
            <span className="text-cyan-300/60">|</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_6px_rgba(194,30,58,0.9)] ${
                  patientStatus < 45 ? "animate-pulse bg-rose-500" : patientStatus < 70 ? "bg-amber-400" : "bg-rose-400"
                }`}
              />
              <span className={patientStatus < 45 ? "text-rose-300" : patientStatus < 70 ? "text-amber-200" : "text-white/70"}>
                PATIENT {Math.round(patientStatus)}%
              </span>
            </span>
            <span className="hidden text-cyan-300/60 sm:inline">|</span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(45,217,232,0.9)]" />
              RIG {Math.round(playerHealth)}%
            </span>
            <span className="text-cyan-300/60">|</span>
            <span className="tabular-nums text-cyan-200/90">+{score} XP</span>
          </div>
        </div>
        <button
          className="pointer-events-auto rounded-sm border border-white/20 bg-black/30 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] text-white/70 backdrop-blur-sm transition hover:border-cyan-300/50 hover:text-cyan-100"
          onClick={onPause}
        >
          ESC
        </button>
      </div>

      {/* mobile objective ticker — objectives are ALWAYS visible (playability law) */}
      <div className="absolute left-1/2 top-[calc(max(env(safe-area-inset-top),14px)+46px)] w-[min(70vw,20rem)] -translate-x-1/2 md:hidden">
        <div className="rounded-sm border border-white/12 bg-black/50 px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] tracking-[0.3em] text-cyan-200/80">
              OBJECTIVE {currentObjective + 1}/{objectives.length}
            </span>
            {distLabel && <span className="font-mono text-[9px] tabular-nums text-amber-200/90">{distLabel}</span>}
          </div>
          <div className="mt-0.5 font-mono text-[11px] leading-tight tracking-wide text-white/90">
            {cur ? cur.label : "MISSION COMPLETE"}
          </div>
          {cur && cur.progress > 0 && cur.progress < 1 && (
            <div className="mt-1.5 text-[10px]">
              <BlockBar p={cur.progress} />
            </div>
          )}
        </div>
      </div>

      {/* wrong-branch guidance (stage 04) */}
      <div
        ref={branchWarnRef}
        className="absolute left-1/2 top-[38%] -translate-x-1/2 opacity-0 transition-all duration-300"
        style={{ transform: "translate(-50%, -6px)" }}
      >
        <div className="rounded-sm border border-rose-300/50 bg-[#1a040a]/85 px-4 py-2 text-center backdrop-blur-sm">
          <div className="font-mono text-[10px] tracking-[0.3em] text-rose-300">LCX — LEFT CIRCUMFLEX</div>
          <div className="mt-0.5 font-mono text-[11px] tracking-widest text-white/85">
            THIS VESSEL IS CLEAR. THE BLOCKAGE IS IN THE LAD — TURN BACK.
          </div>
        </div>
      </div>

      {/* center reticle — cyan normally, amber when aimed at the clot */}
      {phase === "PLAYING" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            ref={reticleRef}
            className="relative h-8 w-8 transition-transform duration-100"
            style={{ transform: "scale(1)" }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_8px_rgba(45,217,232,0.9)]"
              style={{ background: "rgb(var(--reticle-c, 45,217,232))" }}
            />
            <div className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2" style={{ background: "rgba(var(--reticle-c, 45,217,232), 0.55)" }} />
            <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2" style={{ background: "rgba(var(--reticle-c, 45,217,232), 0.55)" }} />
            <div className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2" style={{ background: "rgba(var(--reticle-c, 45,217,232), 0.55)" }} />
            <div className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2" style={{ background: "rgba(var(--reticle-c, 45,217,232), 0.55)" }} />
          </div>
        </div>
      )}

      {/* objective panel — right side (desktop) */}
      <div className="absolute right-5 top-1/2 hidden w-60 -translate-y-1/2 sm:right-8 md:block">
        <div className="mb-2 font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">
          OBJECTIVE {currentObjective + 1}/{objectives.length}
        </div>
        <div className="font-mono text-[13px] leading-snug tracking-wide text-white/90">
          {cur ? cur.label : "MISSION COMPLETE"}
        </div>
        {distLabel && (
          <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] tabular-nums tracking-[0.2em] text-amber-200/90">
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]" />
            BEACON {distLabel}
          </div>
        )}
        {cur && cur.progress > 0 && cur.progress < 1 && (
          <div className="mt-2 text-[11px]">
            <BlockBar p={cur.progress} />
          </div>
        )}
        <div className="mt-4 space-y-1.5">
          {objectives.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2 font-mono text-[9px] tracking-widest">
              <span
                className={`inline-block ${
                  o.done
                    ? "text-[9px] leading-none text-cyan-300"
                    : i === currentObjective
                      ? "h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]"
                      : "h-1 w-1 rounded-full bg-white/20"
                }`}
              >
                {o.done ? "\u2713" : ""}
              </span>
              <span className={o.done ? "text-white/35 line-through" : i === currentObjective ? "text-white/95" : "text-white/40"}>
                {String(i + 1).padStart(2, "0")} {o.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* contextual action hint — teaches the input at the exact moment of need */}
      {actionHint && phase === "PLAYING" && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 sm:bottom-24">
          <div className="animate-pulse rounded-sm border border-cyan-300/40 bg-black/65 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-cyan-100 backdrop-blur-sm sm:text-[11px]">
            {actionHint}
          </div>
        </div>
      )}

      {/* bottom-left controls hint (desktop only) */}
      <div className="absolute bottom-6 left-8 hidden font-mono text-[9px] tracking-[0.25em] text-white/35 lg:block">
        WASD MOVE &nbsp;·&nbsp; SHIFT BOOST &nbsp;·&nbsp; Q SCAN &nbsp;·&nbsp; E TREAT
      </div>

      {/* discovery toast — BioDex reward language (spec §36) */}
      {toast && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 sm:bottom-36">
          <div className="flex items-center gap-3 rounded-sm border border-cyan-300/40 bg-black/60 px-4 py-2.5 backdrop-blur-md">
            <span className="inline-block h-2 w-2 rotate-45 bg-cyan-300 shadow-[0_0_10px_rgba(45,217,232,1)]" />
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-cyan-200/80">NEW BIODex ENTRY · +150 BIO XP</div>
              <div className="font-mono text-xs tracking-widest text-white/90">
                {ANATOMY[toast.id]?.title ?? toast.title}
              </div>
            </div>
          </div>
        </div>
      )}

      <MicroFact quiet={!!toast || !!actionHint || combat} />
    </div>
  );
}
