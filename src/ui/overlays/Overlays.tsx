"use client";
/**
 * Full-screen secondary overlays (spec §24/§31): HOW TO PLAY (real controls
 * only), JOURNAL (the BIODEX — discovered anatomy), CREDITS. Opened from main
 * menu, pause menu and results via useGame.uiOverlay.
 */
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useGame } from "@/game/core/state";
import { ANATOMY } from "@/game/data/anatomy";
// type-only import: erased at build time, does NOT pull the BodyMap chunk out of dynamic()
import type { BodyRegion } from "./BodyMap";

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

/**
 * BIODEX v2 (journal upgrade): the 3D body map + heart entry previews are
 * code-split client-only chunks — they must never mount on the main menu, only
 * inside the open Journal (dynamic + ssr:false + skeleton placeholders).
 */
const BodyMap = dynamic(() => import("./BodyMap"), {
  ssr: false,
  loading: () => <div className="h-[280px] w-full animate-pulse bg-cyan-400/5" />,
});
const EntryMesh = dynamic(() => import("./EntryMesh"), {
  ssr: false,
  loading: () => <div className="h-44 w-full animate-pulse bg-cyan-400/5" />,
});

/** Anatomy id -> body region for the journal filter (kept in sync with BodyMap markers). */
const ANATOMY_REGION: Record<string, BodyRegion | "other"> = {
  // heart — circulatory / coronary mission cluster
  coronaryArtery: "heart",
  heartChamber: "heart",
  thrombus: "heart",
  plaque: "heart",
  vesselWall: "heart",
  redBloodCell: "heart",
  platelet: "heart",
  // lungs — respiratory / viral mission cluster (immune responders live here too)
  alveolus: "lungs",
  alveolarSac: "lungs",
  airwayWall: "lungs",
  infectedCell: "lungs",
  virus: "lungs",
  macrophage: "lungs",
  whiteBloodCell: "lungs",
  // brain — neural / stroke mission cluster (cerebral vessel pathology included)
  neuron: "brain",
  axon: "brain",
  synapse: "brain",
  aneurysm: "brain",
  weakWall: "brain",
};

/** Entries that render the heart_hero.glb EntryMesh preview above their text (the two flagship cardiac entries). EntryMesh itself still accepts the wider heart id set defensively. */
const ENTRY_PREVIEW_IDS = new Set(["heartChamber", "coronaryArtery"]);

const REGION_FILTERS: { key: BodyRegion | null; label: string }[] = [
  { key: null, label: "ALL" },
  { key: "heart", label: "HEART" },
  { key: "lungs", label: "LUNGS" },
  { key: "brain", label: "BRAIN" },
];

export function HowToPlay() {
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const close = () => setUiOverlay(null);

  return (
    <OverlayShell title="HOW TO PLAY" onClose={close}>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        You pilot a medical nano-robot inside the human body. Follow the amber beacon to the
        blockage, dissolve it, and restore blood flow before the patient runs out of oxygen. Scan
        glowing markers to learn the anatomy as you fly.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="rounded-sm border border-white/12 bg-black/40 p-4">
          <div className="font-mono text-[9px] tracking-[0.4em] text-cyan-200/80">DESKTOP</div>
          <div className="mt-3 space-y-2.5">
            {[
              ["MOVE", "W A S D or Arrow keys"],
              ["LOOK", "Drag the mouse — or click once, then move it"],
              ["RISE / DIVE", "Space / C"],
              ["BOOST", "Hold Shift"],
              ["SCAN ANATOMY", "Q while aiming at a glowing marker"],
              ["DISSOLVE THE CLOT", "Hold E while the reticle is on the clot"],
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
              ["MOVE", "Left joystick (bottom left)"],
              ["LOOK", "Drag anywhere on the right half"],
              ["SCAN", "SCAN button (right side)"],
              ["DISSOLVE", "Hold the green ACT button on the clot"],
              ["BOOST", "BST button"],
              ["PAUSE", "Pause bar (top right)"],
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
        The amber beacon marks the blockage. The cyan beacon marks the stabilization zone. When
        your reticle turns amber, you are aimed at the clot: hold E (or ACT) to dissolve it.
      </div>
    </OverlayShell>
  );
}

export function Journal() {
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const discoveries = useGame((s) => s.discoveries);
  // lifted region state: BodyMap markers and the filter row drive the same value
  const [region, setRegion] = useState<BodyRegion | null>(null);
  const close = () => setUiOverlay(null);
  const found = new Set(discoveries.map((d) => d.id));
  const entries = Object.values(ANATOMY).filter(
    (a) => region === null || (ANATOMY_REGION[a.id] ?? "other") === region
  );

  return (
    <OverlayShell title="ANATOMY JOURNAL" onClose={close}>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="font-mono text-[9px] tracking-[0.4em] text-cyan-300/70">BIODEX v2 // BODY MAP</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Every structure you scan is recorded here. {discoveries.length} of {Object.keys(ANATOMY).length} discovered.
      </p>

      {/* 3D body map — tap a glowing organ marker to filter the journal */}
      <div className="mt-4 overflow-hidden rounded-sm border border-white/12 bg-black/40">
        <div className="h-[280px] w-full">
          <BodyMap selected={region} onSelect={setRegion} />
        </div>
      </div>

      {/* region filter row (ALL / HEART / LUNGS / BRAIN), driven by the map selection */}
      <div className="mt-3 flex flex-wrap gap-2">
        {REGION_FILTERS.map((f) => {
          const active = region === f.key;
          return (
            <button
              key={f.label}
              className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] transition ${
                active
                  ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-100"
                  : "border-white/15 text-white/50 hover:border-cyan-300/30 hover:text-cyan-100/80"
              }`}
              onClick={() => setRegion(f.key)}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 pb-10 sm:grid-cols-2">
        {entries.map((a) => {
          const known = found.has(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-sm border p-4 ${known ? "border-cyan-300/30 bg-cyan-400/5" : "border-white/10 bg-black/40"}`}
            >
              {known && ENTRY_PREVIEW_IDS.has(a.id) && (
                <div className="mb-3 overflow-hidden rounded-sm border border-white/10">
                  <EntryMesh id={a.id} />
                </div>
              )}
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
          <div className="font-mono text-[9px] tracking-[0.35em] text-cyan-200/70">3D MODELS</div>
          <p className="mt-1.5">
            Anatomical heart, coronary artery and body-silhouette meshes based on{" "}
            <span className="text-white/90">BodyParts3D</span>, © The Database Center for Life
            Science, licensed under CC BY 4.0 (used with modification and decimation).
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
