"use client";
/**
 * LANDING HERO (P5): left text column (eyebrow / heavy italic title / copy /
 * PLAY + MEET THE SCIENCE / journal progress line) over the full-bleed
 * MenuScene backdrop. Right side hosts floating organ label chips with
 * connector lines (lg+ only, decorative, motion-law gated).
 */
import { BookOpen, Brain, HeartPulse, Play, Wind, type LucideIcon } from "lucide-react";
import { useGame } from "@/game/core/state";
import { usePrefersReducedMotion } from "./motion";

const CYAN = "#2DD9E8";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD9E8]/70 focus-visible:ring-offset-0";

function OrganChip({
  icon: Icon,
  name,
  blurb,
  position,
  floatClass,
  lineClass,
}: {
  icon: LucideIcon;
  name: string;
  blurb: string;
  position: string;
  floatClass: string;
  lineClass: string;
}) {
  return (
    <div className={`pointer-events-none absolute z-10 hidden items-center gap-3 lg:flex ${position}`}>
      <span
        className={`aa-float flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[rgba(10,18,30,0.8)] shadow-[0_0_26px_rgba(45,217,232,0.14)] backdrop-blur-sm ${floatClass}`}
      >
        <Icon className="h-5 w-5" style={{ color: CYAN }} aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-white">{name}</span>
        <span className="text-[11px] leading-snug text-white/55">{blurb}</span>
      </span>
      <span aria-hidden="true" className={`aa-conn absolute h-px w-24 bg-gradient-to-r from-[#2DD9E8]/70 to-transparent ${lineClass}`} />
    </div>
  );
}

export function Hero() {
  const setPhase = useGame((s) => s.setPhase);
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const discoveries = useGame((s) => s.discoveries);

  return (
    <section
      id="aa-home"
      aria-label="Anatomy Arcade introduction"
      className="relative flex min-h-[88svh] scroll-mt-16 items-center px-5 pb-20 pt-28 sm:px-8 lg:px-14"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,47%)_minmax(0,53%)]">
        {/* left column */}
        <div className="max-w-xl">
          <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.42em] text-[#2DD9E8] sm:text-[11px]">
            <span aria-hidden="true" className="inline-block h-px w-8 bg-[#2DD9E8]/70" />
            THE HUMAN BODY. YOUR MISSION.
          </p>

          <h1
            className="mt-5 font-sans text-[clamp(2.5rem,9.2vw,6.2rem)] font-black italic leading-[0.94] tracking-[-0.035em] text-white"
            style={{ textShadow: "0 4px 24px rgba(0,0,0,0.85)" }}
          >
            ANATOMY
            <br />
            <span
              className="text-[#2DD9E8]"
              style={{ textShadow: "0 0 34px rgba(45,217,232,0.4), 0 4px 18px rgba(0,0,0,0.9)" }}
            >
              ARCADE
            </span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/70 sm:text-base">
            Become a nano-robot, enter the human body, and complete medical missions while learning
            how your body works.
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <button
              onClick={() => setPhase("MISSION_SELECT")}
              className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[#2DD9E8] px-9 font-sans text-sm font-extrabold tracking-[0.2em] text-[#04222b] transition-all duration-300 hover:bg-[#54e7f4] hover:shadow-[0_0_40px_rgba(45,217,232,0.45)] ${focusRing}`}
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              PLAY
            </button>
            <button
              onClick={() => setUiOverlay("HOW_TO_PLAY")}
              className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-white/20 bg-[rgba(10,18,30,0.45)] px-8 font-sans text-sm font-bold tracking-[0.2em] text-white/85 transition-all duration-300 hover:border-[#2DD9E8]/60 hover:text-[#2DD9E8] ${focusRing}`}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              MEET THE SCIENCE
            </button>
          </div>

          <p className="mt-7 font-mono text-[10px] tracking-[0.3em] text-white/45">
            {discoveries.length > 0
              ? `JOURNAL: ${discoveries.length} ${discoveries.length === 1 ? "DISCOVERY" : "DISCOVERIES"} LOGGED`
              : "MISSION 01 AVAILABLE — NO EXPERIENCE REQUIRED"}
          </p>
        </div>

        {/* right column: floating organ labels over the 3D body backdrop */}
        <div aria-hidden="true" className="relative hidden h-full min-h-[420px] lg:block">
          <OrganChip
            icon={Brain}
            name="BRAIN"
            blurb="Your control center"
            position="right-[10%] top-[8%]"
            floatClass="aa-float-a"
            lineClass="left-[10%] top-[92%] origin-top-left rotate-[148deg]"
          />
          <OrganChip
            icon={Wind}
            name="LUNGS"
            blurb="Keep you breathing"
            position="right-[22%] top-[40%]"
            floatClass="aa-float-b"
            lineClass="left-[8%] top-[88%] origin-top-left rotate-[128deg]"
          />
          <OrganChip
            icon={HeartPulse}
            name="HEART"
            blurb="Pumps 100,000 times every day"
            position="left-0 top-[58%]"
            floatClass="aa-float-c"
            lineClass="left-[108px] top-[55%] w-16 origin-left rotate-[24deg]"
          />
        </div>
      </div>
    </section>
  );
}
