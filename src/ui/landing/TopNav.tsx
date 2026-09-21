"use client";
/**
 * LANDING TOP NAV (P5): translucent dark fixed bar — logo mark + wordmark,
 * center anchor links (HOME/MISSIONS scroll, BIODEX/LEARN/ABOUT open store
 * overlays), sound toggle, settings popover, "Play on Mobile" modal.
 * <lg collapses links into a hamburger slide-down panel. Safe-area aware.
 */
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Heart,
  Menu,
  Settings as SettingsIcon,
  Smartphone,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useGame } from "@/game/core/state";

type NavTarget = { kind: "anchor"; id: string; label: string } | { kind: "overlay"; id: "JOURNAL" | "HOW_TO_PLAY" | "CREDITS"; label: string };

const NAV_LINKS: NavTarget[] = [
  { kind: "anchor", id: "aa-home", label: "HOME" },
  { kind: "anchor", id: "aa-missions", label: "MISSIONS" },
  { kind: "overlay", id: "JOURNAL", label: "BIODEX" },
  { kind: "overlay", id: "HOW_TO_PLAY", label: "LEARN" },
  { kind: "overlay", id: "CREDITS", label: "ABOUT" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD9E8]/70 focus-visible:ring-offset-0";

function LogoMark() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#C21E3A]/60 bg-gradient-to-b from-[#d92446] to-[#7c0d24] shadow-[0_0_18px_rgba(194,30,58,0.55)]"
      aria-hidden="true"
    >
      <Heart className="h-4 w-4 text-white" fill="currentColor" strokeWidth={1} />
    </span>
  );
}

export function TopNav({ onNavigate }: { onNavigate: (anchorId: string) => void }) {
  const setUiOverlay = useGame((s) => s.setUiOverlay);
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  const prevVolume = useRef(settings.audioMaster > 0 ? settings.audioMaster : 0.8);
  const copyTimer = useRef<number | null>(null);
  const gearWrapRef = useRef<HTMLDivElement>(null);

  const muted = settings.audioMaster === 0;

  const toggleMute = () => {
    if (settings.audioMaster > 0) {
      prevVolume.current = settings.audioMaster;
      setSettings({ audioMaster: 0 });
    } else {
      setSettings({ audioMaster: prevVolume.current > 0 ? prevVolume.current : 0.8 });
    }
  };

  // popover escape hatches: Escape, or pointer-down outside (the popover sits
  // inside a backdrop-blurred bar, so a DOM close-layer would be mis-contained)
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setSettingsOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (gearWrapRef.current && !gearWrapRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [settingsOpen]);

  // Play-on-Mobile modal: Escape closes
  useEffect(() => {
    if (!mobileModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setMobileModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileModalOpen]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("ok");
    } catch {
      setCopyState("fail");
    }
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState("idle"), 2000);
  };

  const handleLink = (t: NavTarget) => {
    setMobileNavOpen(false);
    if (t.kind === "anchor") onNavigate(t.id);
    else setUiOverlay(t.id);
  };

  const soundIcon = muted ? (
    <VolumeX className="h-[18px] w-[18px]" aria-hidden="true" />
  ) : (
    <Volume2 className="h-[18px] w-[18px]" aria-hidden="true" />
  );

  return (
    <header className="pointer-events-auto fixed inset-x-0 top-0 z-50">
      <div
        className="relative border-b border-white/5 bg-[#050b16]/75 backdrop-blur-md"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0px)",
          paddingLeft: "max(env(safe-area-inset-left), 0px)",
          paddingRight: "max(env(safe-area-inset-right), 0px)",
        }}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          {/* logo */}
          <a
            href="#aa-home"
            onClick={(e) => {
              e.preventDefault();
              handleLink(NAV_LINKS[0]);
            }}
            className={`flex items-center gap-2.5 rounded-lg pr-1 ${focusRing}`}
            aria-label="ANATOMY ARCADE — home"
          >
            <LogoMark />
            <span className="flex flex-col italic leading-[1.05]">
              <span className="font-sans text-[13px] font-black tracking-[0.04em] text-white">ANATOMY</span>
              <span
                className="font-sans text-[13px] font-black tracking-[0.04em] text-[#2DD9E8]"
                style={{ textShadow: `0 0 14px rgba(45,217,232,0.5)` }}
              >
                ARCADE
              </span>
            </span>
          </a>

          {/* center links (lg+) */}
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((t) => {
              const active = t.kind === "anchor" && t.id === "aa-home";
              return (
                <button
                  key={t.label}
                  onClick={() => handleLink(t)}
                  aria-current={active ? "page" : undefined}
                  className={`group relative min-h-11 py-1 font-mono text-[10px] tracking-[0.28em] transition-colors ${focusRing} ${
                    active ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  {t.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-0.5 mx-auto h-[2px] rounded-full transition-all duration-300 ${
                      active
                        ? "w-full bg-[#2DD9E8] shadow-[0_0_10px_rgba(45,217,232,0.8)]"
                        : "w-0 bg-[#2DD9E8]/70 group-hover:w-full"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* right cluster */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              aria-pressed={muted}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#2DD9E8]/40 hover:text-[#2DD9E8] ${focusRing}`}
            >
              {soundIcon}
            </button>

            <div className="relative" ref={gearWrapRef}>
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                aria-label="Open settings"
                aria-expanded={settingsOpen}
                aria-haspopup="dialog"
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#2DD9E8]/40 hover:text-[#2DD9E8] ${focusRing} ${
                  settingsOpen ? "border-[#2DD9E8]/50 text-[#2DD9E8]" : ""
                }`}
              >
                <SettingsIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              {settingsOpen && (
                <div
                  role="dialog"
                  aria-label="Settings"
                  className="absolute right-0 top-full z-50 mt-3 w-[272px] animate-in fade-in zoom-in-95 rounded-xl border border-white/10 bg-[#0a121e]/95 p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-md duration-150"
                >
                <p className="font-mono text-[9px] tracking-[0.4em] text-[#2DD9E8]/90">SETTINGS</p>

                <label className="mt-4 block">
                  <span className="mb-1.5 block font-mono text-[9px] tracking-[0.3em] text-white/45">
                    QUALITY
                  </span>
                  <select
                    value={settings.quality}
                    onChange={(e) => setSettings({ quality: e.target.value as typeof settings.quality })}
                    className={`w-full rounded-lg border border-white/15 bg-[#060c15] px-3 py-2 text-xs text-white transition focus:border-[#2DD9E8]/60 ${focusRing}`}
                  >
                    {(["AUTO", "LOW", "MEDIUM", "HIGH"] as const).map((q) => (
                      <option key={q} value={q} className="bg-[#0a121e]">
                        {q}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 block">
                  <span className="mb-1.5 flex items-center justify-between font-mono text-[9px] tracking-[0.3em] text-white/45">
                    VOLUME
                    <span className="text-[#2DD9E8]/80">{Math.round(settings.audioMaster * 100)}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.audioMaster}
                    onChange={(e) => setSettings({ audioMaster: Number(e.target.value) })}
                    aria-label="Master volume"
                    className={`w-full ${focusRing}`}
                  />
                </label>

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-[0.3em] text-white/45">REDUCED MOTION</span>
                  <button
                    role="switch"
                    aria-checked={settings.motionReduced}
                    aria-label="Reduced motion"
                    onClick={() => setSettings({ motionReduced: !settings.motionReduced })}
                    className={`relative h-6 w-11 shrink-0 rounded-full border transition ${focusRing} ${
                      settings.motionReduced
                        ? "border-[#2DD9E8]/70 bg-[#2DD9E8]/25"
                        : "border-white/20 bg-white/10"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-200 ${
                        settings.motionReduced ? "left-[22px] bg-[#2DD9E8]" : "left-[3px] bg-white/60"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
            </div>

            <button
              onClick={() => setMobileModalOpen(true)}
              className={`ml-1 hidden h-11 items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 font-sans text-xs font-semibold tracking-[0.06em] text-white/85 transition hover:border-[#2DD9E8]/60 hover:text-[#2DD9E8] lg:inline-flex ${focusRing}`}
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              Play on Mobile
            </button>

            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 transition hover:border-[#2DD9E8]/40 hover:text-[#2DD9E8] lg:hidden ${focusRing}`}
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* hamburger slide-down panel (<lg) */}
        {mobileNavOpen && (
          <div className="absolute inset-x-0 top-full z-40 animate-in fade-in slide-in-from-top-2 overflow-hidden border-b border-white/10 bg-[#050b16]/95 backdrop-blur-md duration-200 lg:hidden">
            <nav aria-label="Mobile" className="flex flex-col px-4 pb-2 pt-1 sm:px-6">
              {NAV_LINKS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => handleLink(t)}
                  className={`flex min-h-11 items-center border-b border-white/5 text-left font-mono text-[11px] tracking-[0.3em] text-white/70 transition hover:text-[#2DD9E8] last:border-b-0 ${focusRing}`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="px-4 pb-5 pt-3 sm:px-6">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  setMobileModalOpen(true);
                }}
                className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] font-sans text-xs font-semibold tracking-[0.06em] text-white/85 transition hover:border-[#2DD9E8]/60 hover:text-[#2DD9E8] ${focusRing}`}
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Play on Mobile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Play on Mobile modal */}
      {mobileModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setMobileModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Play on mobile"
            className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-xl border border-white/10 bg-[#0a121e] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)] duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2DD9E8]/30 bg-[#2DD9E8]/10"
                aria-hidden="true"
              >
                <Smartphone className="h-5 w-5 text-[#2DD9E8]" />
              </span>
              <button
                onClick={() => setMobileModalOpen(false)}
                aria-label="Close dialog"
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white ${focusRing}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <h2 className="mt-4 font-mono text-xs font-bold tracking-[0.35em] text-white">PLAY ON MOBILE</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {"Open this site in your phone's browser and tap PLAY."}
            </p>

            <code className="mt-4 block truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-white/50">
              {typeof window !== "undefined" ? window.location.href : ""}
            </code>

            <button
              onClick={copyLink}
              className={`mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border font-mono text-[10px] tracking-[0.3em] transition ${focusRing} ${
                copyState === "ok"
                  ? "border-[#2DD9E8]/70 bg-[#2DD9E8]/15 text-[#2DD9E8]"
                  : "border-white/20 bg-white/[0.04] text-white/85 hover:border-[#2DD9E8]/60 hover:text-[#2DD9E8]"
              }`}
            >
              {copyState === "ok" ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" /> LINK COPIED
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  {copyState === "fail" ? "COPY FAILED — TRY AGAIN" : "COPY LINK"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
