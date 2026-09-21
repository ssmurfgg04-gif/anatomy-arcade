"use client";
/**
 * Anatomical scan result (spec §21): holographic overlay, Qwen-powered with
 * guaranteed static fallback. Feels native to the game, never a chat window.
 */
import { useEffect, useState } from "react";
import { useGame } from "@/game/core/state";
import { staticExplain, type ExplainResponse } from "@/game/data/anatomy";

export function EducationPanel() {
  const activeScan = useGame((s) => s.activeScan);
  const closeScan = useGame((s) => s.closeScan);
  const addDiscovery = useGame((s) => s.addDiscovery);
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState(0); // typewriter reveal

  useEffect(() => {
    if (!activeScan) {
      setData(null);
      setLines(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setData(staticExplain(activeScan.id)); // instant static content first
    addDiscovery(activeScan);
    // AI enhancement in background; falls back silently
    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organ: activeScan.subtitle ? activeScan.id : activeScan.id,
        event: "player_scanned_structure",
        difficulty: "beginner",
        context: "heart_attack_response",
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: ExplainResponse) => {
        if (!cancelled && j && j.explanation) setData({ ...j, viaAI: j.viaAI ?? true });
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeScan, addDiscovery]);

  // typewriter reveal
  useEffect(() => {
    if (!data) return;
    setLines(0);
    const target = data.explanation.length;
    const id = setInterval(() => {
      setLines((n) => {
        if (n >= target) {
          clearInterval(id);
          return n;
        }
        return n + 3;
      });
    }, 16);
    return () => clearInterval(id);
  }, [data]);

  if (!activeScan || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-[max(env(safe-area-inset-bottom),20px)] sm:items-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
      <div className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-md border border-cyan-300/30 bg-[#040a10]/92 shadow-[0_0_60px_rgba(45,217,232,0.12)] backdrop-blur-md">
        {/* scan sweep line */}
        <div className="absolute left-0 right-0 top-0 h-px animate-[scanline_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <div className="px-5 pb-5 pt-6 sm:px-7">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.4em] text-cyan-200/80">ANATOMICAL SCAN</span>
            {data.viaAI && (
              <span className="rounded-sm border border-cyan-300/30 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.2em] text-cyan-200/70">
                AI ENHANCED
              </span>
            )}
          </div>
          <h2 className="font-mono text-xl font-semibold tracking-[0.14em] text-white">
            {data.title}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] tracking-wide text-cyan-100/70">{activeScan.subtitle}</p>

          <div className="my-4 h-px bg-gradient-to-r from-cyan-300/50 via-white/10 to-transparent" />

          <p className="min-h-16 text-[13.5px] leading-relaxed text-white/85">
            {data.explanation.slice(0, lines)}
            {lines < data.explanation.length && <span className="animate-pulse text-cyan-300">▌</span>}
          </p>

          <div className="mt-4 space-y-2.5">
            <div className="border-l-2 border-cyan-300/60 pl-3">
              <div className="font-mono text-[8px] tracking-[0.35em] text-cyan-200/70">WHY IT MATTERS</div>
              <div className="mt-0.5 text-xs leading-relaxed text-white/75">{data.missionTip}</div>
            </div>
            <div className="border-l-2 border-amber-300/50 pl-3">
              <div className="font-mono text-[8px] tracking-[0.35em] text-amber-200/70">DID YOU KNOW</div>
              <div className="mt-0.5 text-xs leading-relaxed text-white/75">{data.funFact}</div>
            </div>
          </div>

          {data.keywords?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {data.keywords.map((k) => (
                <span key={k} className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[9px] tracking-widest text-white/60">
                  {k.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.3em] text-cyan-300">+ DISCOVERED</span>
            <button
              className="rounded-sm border border-cyan-300/50 bg-cyan-400/10 px-5 py-2 font-mono text-[11px] tracking-[0.25em] text-cyan-100 transition hover:bg-cyan-300/25"
              onClick={closeScan}
            >
              RESUME [ESC]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
