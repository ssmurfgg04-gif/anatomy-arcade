"use client";
/**
 * MISSION SELECT (spec §28/§30): three mission nodes with honest status —
 * production-ready missions are READY, the rest are COMING SOON, never fake.
 */
import { useGame, type MissionId } from "@/game/core/state";

const MISSIONS: {
  id: MissionId;
  num: string;
  name: string;
  desc: string;
  status: "READY" | "SOON";
  accent: string;
}[] = [
  { id: "heart", num: "01", name: "HEART ATTACK RESPONSE", desc: "Coronary vessel. Locate the obstruction. Restore the flow.", status: "READY", accent: "#C21E3A" },
  { id: "viral", num: "02", name: "VIRAL INVASION", desc: "Bronchioles to the acinus. Neutralize the colonies. Restore O₂ exchange.", status: "READY", accent: "#2DD9E8" },
  { id: "brain", num: "03", name: "BRAIN MISSION", desc: "Cerebral vessel. Reinforce the aneurysm. Restore the signal.", status: "READY", accent: "#8f6fd8" },
];

export function MissionSelect() {
  const startMission = useGame((s) => s.startMission);
  const setPhase = useGame((s) => s.setPhase);
  const setUiOverlay = useGame((s) => s.setUiOverlay);

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-center overflow-y-auto bg-gradient-to-b from-[#04070c]/80 via-[#060a12]/60 to-[#04070c]/90 px-6 py-[max(env(safe-area-inset-top),5vh)] sm:px-12">
      <div className="mx-auto w-full max-w-3xl">
        <button
          className="mb-6 font-mono text-[10px] tracking-[0.35em] text-white/50 transition hover:text-cyan-200"
          onClick={() => setPhase("MAIN_MENU")}
        >
          &larr; BACK
        </button>
        <h2 className="font-mono text-sm font-semibold tracking-[0.45em] text-cyan-100">SELECT MISSION</h2>
        <div className="mt-6 flex flex-col gap-4">
          {MISSIONS.map((m) => (
            <button
              key={m.id}
              disabled={m.status === "SOON"}
              onClick={() => startMission(m.id)}
              className={`group relative flex items-stretch gap-0 overflow-hidden rounded-sm border border-white/12 bg-black/45 text-left backdrop-blur-sm transition-all duration-300 ${
                m.status === "READY"
                  ? "hover:border-white/35 hover:bg-black/65 hover:shadow-[0_0_36px_rgba(45,217,232,0.08)]"
                  : "cursor-not-allowed opacity-45"
              }`}
            >
              <span className="w-1 shrink-0 transition-all duration-300 group-hover:w-1.5" style={{ background: m.accent, boxShadow: `0 0 14px ${m.accent}` }} />
              <span className="flex items-center px-5 font-mono text-3xl font-bold text-white/15 transition group-hover:text-white/30">
                {m.num}
              </span>
              <span className="flex flex-1 flex-col justify-center gap-1 py-5 pr-5">
                <span className="font-mono text-[15px] font-bold tracking-[0.18em] text-white">{m.name}</span>
                <span className="text-xs leading-relaxed text-white/60">{m.desc}</span>
              </span>
              <span className="flex items-center pr-5 font-mono text-[9px] tracking-[0.3em]" style={{ color: m.status === "READY" ? "#2DD9E8" : "rgba(255,255,255,0.35)" }}>
                {m.status === "READY" ? "▸ READY" : "COMING SOON"}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-5 border-t border-white/10 pb-8 pt-5 font-mono text-[10px] tracking-[0.3em] text-white/45">
          <button className="transition hover:text-cyan-200" onClick={() => setUiOverlay("HOW_TO_PLAY")}>
            FULL CONTROLS
          </button>
          <button className="transition hover:text-cyan-200" onClick={() => setUiOverlay("JOURNAL")}>
            JOURNAL
          </button>
        </div>
      </div>
    </div>
  );
}
