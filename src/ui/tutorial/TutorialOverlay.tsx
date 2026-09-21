"use client";
/**
 * First-run interactive tutorial (spec §4/§5/§32).
 * Teaches by doing, in the live world: MOVE -> LOOK -> SCAN. Never a wall of
 * text. Touch devices get touch wording. Skippable; never shown again once
 * completed (localStorage persisted by the shell).
 */
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/core/state";
import type { InputState } from "@/game/controls/input";
import type { HeartRefs } from "@/game/levels/heart/HeartMission";

interface Step {
  key: "MOVE" | "LOOK" | "SCAN";
  title: string;
  desktop: string;
  touch: string;
}

const STEPS: Step[] = [
  {
    key: "MOVE",
    title: "MOVE",
    desktop: "Hold W to fly forward",
    touch: "Drag the LEFT STICK up to fly forward",
  },
  {
    key: "LOOK",
    title: "LOOK",
    desktop: "Drag the mouse to look around. Or click once, then move it",
    touch: "Swipe the RIGHT side of the screen to look",
  },
  {
    key: "SCAN",
    title: "SCAN",
    desktop: "Fly to the glowing diamond, aim the dot on it, press Q",
    touch: "Fly to the glowing diamond, aim the dot, tap SCAN",
  },
];

export function TutorialOverlay({ input }: { input: React.MutableRefObject<InputState> }) {
  const phase = useGame((s) => s.phase);
  const mission = useGame((s) => s.mission);
  const tutorialDone = useGame((s) => s.tutorialDone);
  const setTutorialDone = useGame((s) => s.setTutorialDone);
  const [isTouch, setIsTouch] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [misses, setMisses] = useState(0);

  const forwardTime = useRef(0);
  const lookAmount = useRef(0);
  const lastYaw = useRef(0);
  const lastPitch = useRef(0);
  const scanLatch = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    setIsTouch(
      "ontouchstart" in window || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
    );
  }, []);

  const complete = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishing(true);
    try {
      localStorage.setItem("aa_tutorial", "done");
    } catch {}
    setTimeout(() => setTutorialDone(true), 2600);
  };

  // step 3 completion: a successful anatomical scan
  useEffect(() => {
    if (stepIdx !== 2 || finishing) return;
    const onScan = () => complete();
    window.addEventListener("aa-scan", onScan);
    return () => window.removeEventListener("aa-scan", onScan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, finishing]);

  // progress polling (movement + look deltas from the live rig)
  useEffect(() => {
    if (phase !== "PLAYING" || tutorialDone || finishing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      // generous clamp: input-duration measuring must track wall-clock even at low fps
      const dt = Math.min(0.3, (now - last) / 1000);
      last = now;
      const inp = input.current;
      const w = window as unknown as {
        __aaRefs?: HeartRefs;
        __aaInput?: { current: InputState };
      };
      const refs = w.__aaRefs;
      const inp2 = w.__aaInput?.current ?? inp;

      if (stepIdx === 0) {
        const fwd = Math.max(0, inp2.forward) + Math.max(0, inp2.tForward);
        if (fwd > 0.25) forwardTime.current += dt;
        if (forwardTime.current > 0.9) setStepIdx(1);
      } else if (stepIdx === 1 && refs) {
        const dYaw = Math.abs(refs.player.yaw - lastYaw.current);
        const dPitch = Math.abs(refs.player.pitch - lastPitch.current);
        lastYaw.current = refs.player.yaw;
        lastPitch.current = refs.player.pitch;
        lookAmount.current += dYaw + dPitch;
        if (lookAmount.current > 0.6) setStepIdx(2);
      } else if (stepIdx === 2) {
        // count scan attempts for the "aim closer" nudge
        const pressing = inp2.scan || inp2.tScan;
        if (pressing && !scanLatch.current) {
          scanLatch.current = true;
          setMisses((m) => m + 1);
        }
        if (!pressing) scanLatch.current = false;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, tutorialDone, finishing, stepIdx, input]);

  if (mission !== "heart" || tutorialDone || phase !== "PLAYING") return null;

  if (finishing) {
    return (
      <div className="pointer-events-none fixed inset-0 z-40 flex items-end justify-center pb-32 sm:items-center sm:pb-0">
        <div className="animate-in fade-in duration-500 text-center">
          <div className="font-mono text-[10px] tracking-[0.5em] text-cyan-200/80">TRAINING COMPLETE</div>
          <div className="mt-2 font-mono text-lg font-semibold tracking-[0.2em] text-white">
            Follow the red beacon, nanobot.
          </div>
        </div>
      </div>
    );
  }

  const step = STEPS[stepIdx];
  if (!step) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* step cards bottom-center (above joystick reach, below reticle) */}
      <div className="absolute bottom-40 left-1/2 w-[min(92vw,26rem)] -translate-x-1/2 sm:bottom-24">
        <div className="animate-in fade-in slide-in-from-bottom-3 pointer-events-auto duration-300 rounded-sm border border-cyan-300/35 bg-black/75 px-4 py-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.4em] text-cyan-200/80">
              TRAINING {stepIdx + 1}/{STEPS.length}
            </span>
            <button
              className="pointer-events-auto font-mono text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white/80"
              onClick={complete}
            >
              SKIP
            </button>
          </div>
          <div className="mt-1.5 font-mono text-sm font-semibold tracking-[0.25em] text-white">{step.title}</div>
          <div className="mt-1 text-[13px] leading-relaxed text-white/80">{isTouch ? step.touch : step.desktop}</div>
          {step.key === "SCAN" && misses >= 3 && (
            <div className="mt-1.5 text-xs leading-relaxed text-amber-200/90">
              Tip: get closer and keep the glowing diamond centered in the reticle.
            </div>
          )}
          <div className="mt-2.5 flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i < stepIdx ? "bg-cyan-300" : i === stepIdx ? "bg-cyan-300/50" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
