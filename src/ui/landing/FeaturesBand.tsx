"use client";
/**
 * LANDING FEATURES BAND (P5): four value props with circular icon chips plus
 * the handwritten-style sign-off note. Grid collapses 4 -> 2 -> 1.
 */
import { Boxes, BrainCircuit, Gamepad2, Smartphone } from "lucide-react";

const CYAN = "#2DD9E8";

const FEATURES = [
  {
    icon: Boxes,
    title: "3D Interactive World",
    copy: "Explore stunning, accurate anatomy models.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Learning",
    copy: "Get real-time explanations with Qwen AI.",
  },
  {
    icon: Smartphone,
    title: "Play Anywhere",
    copy: "Full mobile support. On your phone or desktop.",
  },
  {
    icon: Gamepad2,
    title: "Fun & Educational",
    copy: "Because saving lives is an adventure.",
  },
] as const;

export function FeaturesBand() {
  return (
    <section aria-label="Why Anatomy Arcade" className="relative px-5 pb-24 pt-4 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-start gap-4">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2DD9E8]/25 bg-[#2DD9E8]/[0.06] shadow-[0_0_22px_rgba(45,217,232,0.1)]"
                aria-hidden="true"
              >
                <f.icon className="h-5 w-5" style={{ color: CYAN }} />
              </span>
              <div>
                <h3 className="font-sans text-sm font-bold tracking-[0.02em] text-white">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{f.copy}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-end pr-1 sm:pr-4">
          <p
            className="font-serif text-lg italic tracking-wide text-[#9fe9f1]/85 sm:text-xl"
            style={{ transform: "rotate(-2.5deg)", textShadow: "0 0 22px rgba(45,217,232,0.18)" }}
          >
            Small robot. Big impact.
          </p>
        </div>
      </div>
    </section>
  );
}
