"use client";
/**
 * Full-screen secondary overlays (spec §24/§31): HOW TO PLAY (real controls
 * only), JOURNAL (the BIODEX — discovered anatomy), CREDITS. Opened from main
 * menu, pause menu and results via useGame.uiOverlay.
 */
import { useEffect } from "react";
import { useGame } from "@/game/core/state";
import { ANATOMY } from "@/game/data/anatomy";

function OverlayShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  // Esc closes any overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#04070c]/94 px-5 py-[max(env(safe-area-inset-top),6vh)] backdrop-blur-md">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm tracking-[0.45em] text-cyan-200/90">{title}</h2>
          <button
            className="rounded-sm border border-white/20 px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] text-white/70 transition hover:border-cyan-300/50 hover:text-cyan-100"
            onClick={onClose}
          >
            CLOSE
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function HowToPlay() {
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const close = () => setUiOverlay(null);

  return (
    <OverlayShell title="HOW TO PLAY" onClose={close}>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        You pilot a medical nano-robot inside the human body. Follow the glowing beacon to the
        objective, scan anatomy to learn, and complete the mission before the patient runs out of
        oxygen.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="rounded-sm border border-white/12 bg-black/40 p-4">
          <div className="font-mono text-[9px] tracking-[0.4em] text-cyan-200/80">DESKTOP</div>
          <div className="mt-3 space-y-2.5">
            {[
              ["MOVE", "W A S D or Arrow keys"],
              ["LOOK", "Mouse (click the screen once to capture it)"],
              ["RISE / DIVE", "Space / C"],
              ["BOOST", "Hold Shift"],
              ["SCAN ANATOMY", "Q while aiming at a glowing marker"],
              ["TREAT THE CLOT", "Hold E while aiming at it"],
              ["PAUSE", "Esc"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3">
                <span className="shrink-0 font-mono text-[10px] tracking-[0.25em] text-white/85">{k}</span>
                <span className="text-right text-xs text-white/55">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-sm border border-white/12 bg-black/40 p-4">
          <div className="font-mono text-[9px] tracking-[0.4em] text-cyan-200/80">MOBILE / TOUCH</div>
          <div className="mt-3 space-y-2.5">
            {[
              ["MOVE", "Left joystick"],
              ["LOOK", "Drag anywhere on the right"],
              ["SCAN", "SCAN button"],
              ["TREAT", "Hold ACT on the clot"],
              ["BOOST", "BST button"],
              ["PAUSE", "II button (top right)"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3">
                <span className="shrink-0 font-mono text-[10px] tracking-[0.25em] text-white/85">{k}</span>
                <span className="text-right text-xs text-white/55">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-sm border border-cyan-300/25 bg-cyan-400/5 px-4 py-3 text-xs leading-relaxed text-cyan-100/80">
        The red beacon marks the blockage. The cyan beacon marks the stabilization zone. Your HUD
        objective line updates as you progress — if you are ever unsure, follow the beacons.
      </div>
    </OverlayShell>
  );
}

export function Journal() {
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const discoveries = useGame((s) => s.discoveries);
  const close = () => setUiOverlay(null);
  const found = new Set(discoveries.map((d) => d.id));

  return (
    <OverlayShell title="ANATOMY JOURNAL" onClose={close}>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Every structure you scan is recorded here. {discoveries.length} of {Object.keys(ANATOMY).length} discovered.
      </p>
      <div className="mt-5 grid gap-3 pb-10 sm:grid-cols-2">
        {Object.values(ANATOMY).map((a) => {
          const known = found.has(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-sm border p-4 ${known ? "border-cyan-300/30 bg-cyan-400/5" : "border-white/10 bg-black/40"}`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs font-semibold tracking-[0.2em] ${known ? "text-cyan-100" : "text-white/35"}`}>
                  {known ? a.title : "??? UNDISCOVERED"}
                </span>
                {known && <span className="font-mono text-[8px] tracking-[0.3em] text-cyan-300/70">LOGGED</span>}
              </div>
              <div className="mt-1 font-mono text-[10px] tracking-widest text-white/45">
                {known ? a.subtitle : `Region hint: ${a.organ.toUpperCase()}`}
              </div>
              {known && (
                <>
                  <div className="mt-2.5 text-xs leading-relaxed text-white/75">{a.body}</div>
                  <div className="mt-2.5 border-l-2 border-amber-300/50 pl-2.5">
                    <div className="font-mono text-[8px] tracking-[0.3em] text-amber-200/70">DID YOU KNOW</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-white/65">{a.funFact}</div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </OverlayShell>
  );
}

export function Credits() {
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const close = () => setUiOverlay(null);
  return (
    <OverlayShell title="CREDITS" onClose={close}>
      <div className="mt-4 space-y-4 rounded-sm border border-white/12 bg-black/40 p-5 text-sm leading-relaxed text-white/70">
        <div>
          <div className="font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">ANATOMY ARCADE</div>
          <p className="mt-1.5">
            A playable biology game. Vessel world, blood cells, clot system and nano-robot built
            procedurally for this project.
          </p>
        </div>
        <div>
          <div className="font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">EDUCATION</div>
          <p className="mt-1.5">
            All anatomical explanations are reviewed against public medical education material and
            stored in a verified knowledge base. The in-game biologist explains verified facts.
          </p>
        </div>
        <div>
          <div className="font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">AUDIO</div>
          <p className="mt-1.5">Heartbeat, ambience and interface sounds synthesized in-game.</p>
        </div>
      </div>
    </OverlayShell>
  );
}
