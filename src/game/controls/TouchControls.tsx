"use client";
/**
 * Touch controls (spec §13/§14): left joystick = movement, right region = look,
 * action buttons. Writes into the shared InputState ref; zero React state churn.
 */
import { useEffect, useRef, useState } from "react";
import type { InputState } from "./input";

interface Props {
  input: React.MutableRefObject<InputState>;
  onPause: () => void;
}

export function TouchControls({ input, onPause }: Props) {
  const stickRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const stickActive = useRef(false);
  const stickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });
  const [showTouch, setShowTouch] = useState(false);

  useEffect(() => {
    setShowTouch(
      "ontouchstart" in window ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
    );
  }, []);

  useEffect(() => {
    const stick = stickRef.current;
    const thumb = thumbRef.current;
    if (!stick || !thumb || !showTouch) return;

    const R = 56; // joystick travel radius px

    const setThumb = (dx: number, dy: number) => {
      thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const onStickStart = (e: PointerEvent) => {
      stickActive.current = true;
      stickId.current = e.pointerId;
      stick.setPointerCapture(e.pointerId);
    };
    const onStickMove = (e: PointerEvent) => {
      if (!stickActive.current || e.pointerId !== stickId.current) return;
      const rect = stick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > R) {
        dx = (dx / len) * R;
        dy = (dy / len) * R;
      }
      setThumb(dx, dy);
      input.current.tForward = (-dy / R) * 1.0;
      input.current.tStrafe = (dx / R) * 1.0;
    };
    const onStickEnd = (e: PointerEvent) => {
      if (e.pointerId !== stickId.current) return;
      stickActive.current = false;
      stickId.current = null;
      setThumb(0, 0);
      input.current.tForward = 0;
      input.current.tStrafe = 0;
    };

    const onLookStart = (e: PointerEvent) => {
      if (lookId.current !== null) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-ui]")) return; // never steal button touches
      lookId.current = e.pointerId;
      lookLast.current = { x: e.clientX, y: e.clientY };
    };
    const onLookMove = (e: PointerEvent) => {
      if (e.pointerId !== lookId.current) return;
      input.current.tLookDX += (e.clientX - lookLast.current.x) * 0.004;
      input.current.tLookDY += (e.clientY - lookLast.current.y) * 0.004;
      lookLast.current = { x: e.clientX, y: e.clientY };
    };
    const onLookEnd = (e: PointerEvent) => {
      if (e.pointerId === lookId.current) lookId.current = null;
    };

    stick.addEventListener("pointerdown", onStickStart);
    stick.addEventListener("pointermove", onStickMove);
    stick.addEventListener("pointerup", onStickEnd);
    stick.addEventListener("pointercancel", onStickEnd);
    window.addEventListener("pointerdown", onLookStart);
    window.addEventListener("pointermove", onLookMove);
    window.addEventListener("pointerup", onLookEnd);
    window.addEventListener("pointercancel", onLookEnd);
    return () => {
      stick.removeEventListener("pointerdown", onStickStart);
      stick.removeEventListener("pointermove", onStickMove);
      stick.removeEventListener("pointerup", onStickEnd);
      stick.removeEventListener("pointercancel", onStickEnd);
      window.removeEventListener("pointerdown", onLookStart);
      window.removeEventListener("pointermove", onLookMove);
      window.removeEventListener("pointerup", onLookEnd);
      window.removeEventListener("pointercancel", onLookEnd);
    };
  }, [input, showTouch]);

  if (!showTouch) return null;

  const hold = (key: "tBoost" | "tInteract" | "tScan", value: boolean) => () => {
    input.current[key] = value;
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none" data-ui>
      {/* left joystick */}
      <div
        ref={stickRef}
        className="pointer-events-auto absolute bottom-6 left-6 flex h-36 w-36 touch-none items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/5 backdrop-blur-[2px]"
        style={{ WebkitTapHighlightColor: "transparent" }}
        aria-label="Movement joystick"
      >
        <div
          ref={thumbRef}
          className="h-16 w-16 rounded-full border border-cyan-200/50 bg-cyan-300/15 shadow-[0_0_18px_rgba(45,217,232,0.25)]"
        />
      </div>

      {/* right action cluster */}
      <div className="pointer-events-auto absolute bottom-6 right-5 grid grid-cols-2 gap-3 touch-none">
        <button
          className="h-16 w-16 rounded-full border border-cyan-300/40 bg-cyan-400/10 font-mono text-[10px] tracking-widest text-cyan-100 active:bg-cyan-300/30"
          onPointerDown={hold("tScan", true)}
          onPointerUp={hold("tScan", false)}
          onPointerLeave={hold("tScan", false)}
        >
          SCAN
        </button>
        <button
          className="h-16 w-16 rounded-full border border-emerald-300/40 bg-emerald-400/10 font-mono text-[10px] tracking-widest text-emerald-100 active:bg-emerald-300/30"
          onPointerDown={hold("tInteract", true)}
          onPointerUp={hold("tInteract", false)}
          onPointerLeave={hold("tInteract", false)}
        >
          ACT
        </button>
        <button
          className="col-span-2 mx-auto h-14 w-14 rounded-full border border-rose-300/40 bg-rose-400/10 font-mono text-[10px] tracking-widest text-rose-100 active:bg-rose-300/30"
          onPointerDown={hold("tBoost", true)}
          onPointerUp={hold("tBoost", false)}
          onPointerLeave={hold("tBoost", false)}
        >
          BST
        </button>
      </div>

      {/* pause */}
      <button
        className="pointer-events-auto absolute right-5 top-16 h-10 w-10 rounded-full border border-white/25 bg-white/5 font-mono text-xs text-white/80 active:bg-white/20"
        onClick={onPause}
        aria-label="Pause"
      >
        II
      </button>
    </div>
  );
}
