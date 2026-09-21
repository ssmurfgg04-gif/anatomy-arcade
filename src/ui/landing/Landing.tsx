"use client";
/**
 * LANDING (P5) — the full main-menu landing page per the reference image:
 * fixed top nav / hero over the MenuScene backdrop / game-mode cards /
 * features band / slim footer. The page lives in its own scroll container
 * (page.tsx <main> is fixed + overflow-hidden), so the R3F backdrop stays
 * fixed behind it while content scrolls.
 *
 * Keyframes are declared here (not in globals.css) to keep this feature
 * self-contained; all are gated by the motion law (settings.motionReduced or
 * prefers-reduced-motion) via the [data-motion] switch on the root.
 */
import { useCallback, useRef } from "react";
import { useGame } from "@/game/core/state";
import { usePrefersReducedMotion } from "./motion";
import { TopNav } from "./TopNav";
import { Hero } from "./Hero";
import { GameModes } from "./GameModes";
import { FeaturesBand } from "./FeaturesBand";

const MOTION_CSS = `
@keyframes aa-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes aa-conn-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
.aa-float-a { animation: aa-float 6s ease-in-out infinite; }
.aa-float-b { animation: aa-float 7.5s ease-in-out 0.9s infinite; }
.aa-float-c { animation: aa-float 6.8s ease-in-out 0.45s infinite; }
.aa-conn { animation: aa-conn-pulse 4.5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .aa-float-a, .aa-float-b, .aa-float-c, .aa-conn { animation: none !important; }
}
[data-motion="off"] .aa-float-a,
[data-motion="off"] .aa-float-b,
[data-motion="off"] .aa-float-c,
[data-motion="off"] .aa-conn { animation: none !important; }
`;

export function Landing() {
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const phase = useGame((s) => s.phase);
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (anchorId: string) => {
      const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
      if (anchorId === "aa-home") {
        rootRef.current?.scrollTo({ top: 0, behavior });
        return;
      }
      const el = document.getElementById(anchorId);
      el?.scrollIntoView({ behavior, block: "start" });
    },
    [reduced]
  );

  return (
    <div
      ref={rootRef}
      data-motion={reduced ? "off" : "on"}
      className="fixed inset-0 z-30 overflow-y-auto overflow-x-hidden overscroll-contain text-white"
    >
      <style>{MOTION_CSS}</style>

      {/* nav only on the menu phase — MissionSelect overlays this page and
          brings its own back control; the z-50 bar must not cover it */}
      {phase === "MAIN_MENU" && <TopNav onNavigate={navigate} />}

      <main>
        <Hero />

        {/* everything below the hero sits on its own quiet gradient panel */}
        <div className="relative border-t border-white/5 bg-gradient-to-b from-[#04070c] via-[#050b16] to-[#030509]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2DD9E8]/40 to-transparent"
          />
          <GameModes />
          <FeaturesBand />

          <footer
            className="border-t border-white/5"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)",
              paddingLeft: "max(env(safe-area-inset-left), 0px)",
              paddingRight: "max(env(safe-area-inset-right), 0px)",
            }}
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-5 pt-6 sm:flex-row sm:px-8 lg:px-14">
              <p className="text-center font-mono text-[9px] tracking-[0.3em] text-white/35 sm:text-left">
                ANATOMY ARCADE — ENTER THE BODY. SAVE THE PATIENT. LEARN HOW IT WORKS.
              </p>
              <button
                onClick={() => setUiOverlay("CREDITS")}
                className="min-h-11 rounded-md px-2 font-mono text-[9px] tracking-[0.3em] text-white/35 underline decoration-white/20 underline-offset-4 transition hover:text-[#2DD9E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD9E8]/70"
              >
                CREDITS
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
