"use client";
/**
 * Shared landing motion law (spec §52): every decorative animation is gated by
 * BOTH the in-game "reduced motion" setting AND the OS prefers-reduced-motion
 * preference. One hook, used by the landing chrome and the MenuScene rig.
 */
import { useEffect, useState } from "react";
import { useGame } from "@/game/core/state";

export function usePrefersReducedMotion(): boolean {
  const setting = useGame((s) => s.settings.motionReduced);
  const [os, setOs] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setOs(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return setting || os;
}
