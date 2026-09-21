"use client";
/**
 * LANDING GAME MODES (P5): the mission-select section of the landing page.
 * Three cards — Heart Attack Response (active, cyan glow, launches the heart
 * mission), Viral Invasion + Brain Mission (honest COMING SOON state with an
 * inline toast, never alert()). Card media is procedural CSS/SVG art only.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Clock, Lock } from "lucide-react";
import { useGame } from "@/game/core/state";

const CYAN = "#2DD9E8";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD9E8]/70 focus-visible:ring-offset-0";

/* ------------------------------------------------------------------ */
/* Procedural card art — pure CSS gradients + SVG, no external assets */
/* ------------------------------------------------------------------ */

function VesselArt() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* deep tissue base */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_28%_18%,#420a15_0%,#1c040a_52%,#070203_100%)]" />
      {/* vessel tube */}
      <div
        className="absolute left-[-8%] top-[30%] h-[40%] w-[116%] rounded-[999px]"
        style={{
          background: "linear-gradient(180deg,#4c0b19 0%,#2b060e 62%,#16030a 100%)",
          boxShadow:
            "inset 0 14px 30px rgba(0,0,0,0.8), inset 0 -8px 22px rgba(194,30,58,0.4), 0 0 46px rgba(194,30,58,0.28)",
        }}
      />
      {/* endothelium highlight */}
      <div className="absolute left-[-8%] top-[33.5%] h-[6%] w-[116%] rounded-[999px] bg-gradient-to-b from-[#e0405c]/25 to-transparent blur-[2px]" />
      {/* red blood cells (biconcave discs) */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="aa-rbc" cx="35%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#8d1128" />
            <stop offset="55%" stopColor="#b3172f" />
            <stop offset="82%" stopColor="#e0304c" />
            <stop offset="100%" stopColor="#6f0c1e" />
          </radialGradient>
          <radialGradient id="aa-plaque" cx="40%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#f0e6c8" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#cdbd92" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#93855f" stopOpacity="0.8" />
          </radialGradient>
        </defs>
        <ellipse cx="52" cy="108" rx="17" ry="12" fill="url(#aa-rbc)" opacity="0.5" />
        <ellipse cx="106" cy="122" rx="20" ry="14" fill="url(#aa-rbc)" opacity="0.75" />
        <ellipse cx="150" cy="100" rx="16" ry="11" fill="url(#aa-rbc)" />
        <ellipse cx="205" cy="120" rx="21" ry="14" fill="url(#aa-rbc)" opacity="0.9" />
        <ellipse cx="96" cy="86" rx="12" ry="9" fill="url(#aa-rbc)" opacity="0.55" />
        {/* pale plaque mass narrowing the vessel */}
        <g>
          <ellipse cx="258" cy="112" rx="34" ry="30" fill="url(#aa-plaque)" opacity="0.9" />
          <ellipse cx="238" cy="128" rx="20" ry="16" fill="url(#aa-plaque)" opacity="0.75" />
          <ellipse cx="278" cy="92" rx="16" ry="13" fill="url(#aa-plaque)" opacity="0.7" />
        </g>
        {/* nano-robot approaching the blockage */}
        <circle cx="176" cy="112" r="6.5" fill="#0b1620" stroke={CYAN} strokeWidth="1.4" />
        <circle cx="176" cy="112" r="2.2" fill={CYAN} />
        <circle cx="166" cy="112" r="1.4" fill={CYAN} opacity="0.7" />
        <circle cx="158" cy="111" r="1" fill={CYAN} opacity="0.4" />
      </svg>
      {/* vignette + scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_50%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_4px)]" />
    </div>
  );
}

function LungArt() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_18%,#0d2a3a_0%,#081522_55%,#05090f_100%)]" />
      {/* trachea + bronchi */}
      <div className="absolute left-1/2 top-[14%] h-[24%] w-[3.5%] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#2DD9E8]/45 to-[#155a6e]/25" />
      <div className="absolute left-[41%] top-[34%] h-[4%] w-[13%] origin-right -rotate-[28deg] rounded-full bg-gradient-to-l from-[#2DD9E8]/35 to-transparent" />
      <div className="absolute left-[46%] top-[34%] h-[4%] w-[13%] origin-left rotate-[28deg] rounded-full bg-gradient-to-r from-[#2DD9E8]/35 to-transparent" />
      {/* lungs */}
      <div
        className="absolute left-[17%] top-[30%] h-[52%] w-[27%]"
        style={{
          borderRadius: "62% 38% 52% 48% / 66% 66% 34% 34%",
          background: "linear-gradient(155deg, rgba(45,217,232,0.32) 0%, rgba(23,92,112,0.16) 55%, rgba(8,18,28,0.06) 100%)",
          border: "1px solid rgba(45,217,232,0.3)",
          boxShadow: "inset 0 0 34px rgba(45,217,232,0.18), 0 0 30px rgba(45,217,232,0.08)",
        }}
      />
      <div
        className="absolute right-[17%] top-[30%] h-[52%] w-[27%]"
        style={{
          borderRadius: "38% 62% 48% 52% / 66% 66% 34% 34%",
          background: "linear-gradient(205deg, rgba(45,217,232,0.32) 0%, rgba(23,92,112,0.16) 55%, rgba(8,18,28,0.06) 100%)",
          border: "1px solid rgba(45,217,232,0.3)",
          boxShadow: "inset 0 0 34px rgba(45,217,232,0.18), 0 0 30px rgba(45,217,232,0.08)",
        }}
      />
      {/* virus specks */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
        <g fill="#8f6fd8">
          <circle cx="118" cy="74" r="6" opacity="0.9" />
          <circle cx="204" cy="94" r="4.5" opacity="0.8" />
          <circle cx="158" cy="128" r="7.5" opacity="0.95" />
          <circle cx="94" cy="142" r="3.5" opacity="0.6" />
          <circle cx="242" cy="60" r="3" opacity="0.55" />
          <circle cx="262" cy="128" r="5.5" opacity="0.8" />
          <circle cx="70" cy="58" r="4" opacity="0.5" />
          <circle cx="180" cy="52" r="2.5" opacity="0.45" />
        </g>
        <g stroke="#8f6fd8" strokeWidth="1" opacity="0.6">
          <line x1="118" y1="74" x2="126" y2="66" />
          <line x1="118" y1="74" x2="110" y2="66" />
          <line x1="158" y1="128" x2="166" y2="121" />
          <line x1="158" y1="128" x2="151" y2="120" />
          <line x1="204" y1="94" x2="211" y2="88" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_50%,transparent_55%,rgba(0,0,0,0.5)_100%)]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_4px)]" />
    </div>
  );
}

function NeuralArt() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(120%_130%_at_30%_20%,#131c40_0%,#0a0f24_55%,#05070f_100%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
        <g strokeWidth="1">
          <line x1="46" y1="52" x2="112" y2="84" stroke="rgba(45,217,232,0.3)" />
          <line x1="112" y1="84" x2="88" y2="146" stroke="rgba(45,217,232,0.22)" />
          <line x1="112" y1="84" x2="176" y2="58" stroke="rgba(143,111,216,0.35)" />
          <line x1="176" y1="58" x2="238" y2="96" stroke="rgba(45,217,232,0.28)" />
          <line x1="88" y1="146" x2="158" y2="160" stroke="rgba(143,111,216,0.3)" />
          <line x1="158" y1="160" x2="238" y2="96" stroke="rgba(45,217,232,0.22)" />
          <line x1="238" y1="96" x2="286" y2="52" stroke="rgba(143,111,216,0.3)" />
          <line x1="238" y1="96" x2="272" y2="150" stroke="rgba(45,217,232,0.24)" />
          <line x1="158" y1="160" x2="272" y2="150" stroke="rgba(143,111,216,0.22)" />
          <line x1="46" y1="52" x2="30" y2="120" stroke="rgba(143,111,216,0.24)" />
          <line x1="30" y1="120" x2="88" y2="146" stroke="rgba(45,217,232,0.2)" />
          <line x1="176" y1="58" x2="196" y2="26" stroke="rgba(45,217,232,0.26)" />
          <line x1="196" y1="26" x2="286" y2="52" stroke="rgba(143,111,216,0.24)" />
          <line x1="112" y1="84" x2="158" y2="160" stroke="rgba(45,217,232,0.14)" />
        </g>
        <g>
          {[
            [46, 52], [112, 84], [88, 146], [176, 58], [238, 96], [158, 160],
            [286, 52], [272, 150], [30, 120], [196, 26],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="9" fill={i % 2 === 0 ? CYAN : "#8f6fd8"} opacity="0.1" />
              <circle cx={x} cy={y} r="2.6" fill={i % 2 === 0 ? CYAN : "#8f6fd8"} opacity="0.95" />
            </g>
          ))}
          {/* signal hot-spots */}
          <circle cx="176" cy="58" r="16" fill="#8f6fd8" opacity="0.1" />
          <circle cx="112" cy="84" r="16" fill={CYAN} opacity="0.1" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_50%,transparent_55%,rgba(0,0,0,0.5)_100%)]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_4px)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DifficultyBars({ level }: { level: number }) {
  return (
    <span className="flex items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-[1px] ${i < level ? "bg-[#2DD9E8]" : "bg-white/20"}`}
          style={{ height: `${4 + i * 3}px` }}
        />
      ))}
    </span>
  );
}

type ModeCard = {
  id: string;
  title: string;
  copy: string;
  active: boolean;
  chip: string;
  difficulty: { label: string; level: number };
  art: ReactNode;
};

const CARDS: ModeCard[] = [
  {
    id: "heart",
    title: "HEART ATTACK RESPONSE",
    copy: "Navigate the circulatory system, clear a blockage, and learn about cardiovascular health.",
    active: true,
    chip: "1 / 3",
    difficulty: { label: "Beginner", level: 1 },
    art: <VesselArt />,
  },
  {
    id: "viral",
    title: "VIRAL INVASION",
    copy: "Play as a white blood cell fighting COVID-19 in 3D lungs.",
    active: false,
    chip: "COMING SOON",
    difficulty: { label: "Intermediate", level: 2 },
    art: <LungArt />,
  },
  {
    id: "brain",
    title: "BRAIN MISSION",
    copy: "Restore neural pathways in a 3D brain to cure Alzheimer's.",
    active: false,
    chip: "COMING SOON",
    difficulty: { label: "Advanced", level: 3 },
    art: <NeuralArt />,
  },
];

function MetaItem({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] tracking-wide text-white/50">{children}</span>
  );
}

function ModeCardView({
  card,
  onLaunch,
  onLocked,
}: {
  card: ModeCard;
  onLaunch: () => void;
  onLocked: () => void;
}) {
  const statusChip = (
    <span
      className={`absolute left-3 top-3 z-10 rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.25em] backdrop-blur-sm ${
        card.active
          ? "border-[#2DD9E8]/50 bg-black/55 text-[#2DD9E8]"
          : "border-white/15 bg-black/55 text-white/50"
      }`}
    >
      {card.chip}
    </span>
  );

  const meta = (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      {card.active ? (
        <MetaItem>
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> 10–15 min
        </MetaItem>
      ) : (
        <MetaItem>
          <Lock className="h-3.5 w-3.5" aria-hidden="true" /> COMING SOON
        </MetaItem>
      )}
      <MetaItem>
        <DifficultyBars level={card.difficulty.level} /> {card.difficulty.label}
      </MetaItem>
      <MetaItem>
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Learn + Play
      </MetaItem>
    </div>
  );

  const shell = `group relative overflow-hidden rounded-xl border text-left transition-all duration-300 ${
    card.active
      ? "border-[#2DD9E8]/60 bg-[rgba(10,18,30,0.62)] shadow-[0_0_36px_rgba(45,217,232,0.16)] hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(45,217,232,0.28)]"
      : "border-white/10 bg-[rgba(10,18,30,0.5)] hover:border-white/25"
  }`;

  const arrowRow = (
    <div className="mt-4 flex items-center justify-end">
      {card.active ? (
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2DD9E8]/50 bg-[#2DD9E8]/10 text-[#2DD9E8] transition-all duration-300 group-hover:bg-[#2DD9E8] group-hover:text-[#04222b] group-hover:shadow-[0_0_24px_rgba(45,217,232,0.55)]"
        >
          <ArrowRight className="h-[18px] w-[18px]" />
        </span>
      ) : (
        <button
          onClick={onLocked}
          aria-label={`${card.title} — coming soon`}
          className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/35 transition hover:border-white/30 hover:text-white/60 ${focusRing}`}
        >
          <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  if (card.active) {
    return (
      <button onClick={onLaunch} aria-label={`${card.title} — play now`} className={`block w-full cursor-pointer ${shell} ${focusRing}`}>
        {statusChip}
        <div className="relative aspect-[16/10]">{card.art}</div>
        <div className="relative p-5">
          <h3 className="font-sans text-[15px] font-extrabold tracking-[0.04em] text-white">{card.title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-white/60">{card.copy}</p>
          {meta}
          {arrowRow}
        </div>
      </button>
    );
  }

  return (
    <div className={`${shell} group`}>
      {statusChip}
      <div className="relative aspect-[16/10]">{card.art}</div>
      <div className="relative p-5">
        <h3 className="font-sans text-[15px] font-extrabold tracking-[0.04em] text-white">{card.title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-white/60">{card.copy}</p>
        {meta}
        {arrowRow}
      </div>
    </div>
  );
}

export function GameModes() {
  const startMission = useGame((s) => s.startMission);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const announceLocked = () => {
    setToastVisible(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastVisible(false), 1800);
  };

  return (
    <section id="aa-missions" aria-label="Game modes" className="relative scroll-mt-20 px-5 py-20 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.42em] text-[#2DD9E8] sm:text-[11px]">
              <span aria-hidden="true" className="inline-block h-px w-8 bg-[#2DD9E8]/70" />
              CHOOSE YOUR MISSION
            </p>
            <h2 className="mt-4 font-sans text-3xl font-black tracking-tight text-white sm:text-4xl">
              Game Modes
            </h2>
          </div>
          <p className="hidden text-right font-mono text-[9px] leading-relaxed tracking-[0.3em] text-white/40 md:block">
            REAL BIOLOGY / INTERACTIVE GAMEPLAY / LEARN &amp; EXPLORE
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {CARDS.map((card) => (
            <ModeCardView
              key={card.id}
              card={card}
              onLaunch={() => startMission("heart")}
              onLocked={announceLocked}
            />
          ))}
        </div>
      </div>

      {toastVisible && (
        <div
          role="status"
          className="fixed bottom-[max(env(safe-area-inset-bottom),24px)] left-1/2 z-[65] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#2DD9E8]/30 bg-[rgba(10,18,30,0.95)] px-5 py-3 font-mono text-[10px] tracking-[0.35em] text-[#2DD9E8] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            COMING SOON
          </span>
        </div>
      )}
    </section>
  );
}
