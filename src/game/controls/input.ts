/**
 * Player + input rig (spec §12, §13, §34).
 * Keyboard state polled in the render loop; pointer-lock look; touch values fed
 * by TouchControls into the same store-shaped plain object (no rerenders).
 */
import { useEffect, useRef } from "react";

export interface InputState {
  forward: number; // -1..1 (W/S)
  strafe: number; // -1..1 (A/D)
  vertical: number; // -1..1 (Space/Ctrl or touch)
  boost: boolean; // Shift
  interact: boolean; // E or touch button
  scan: boolean; // Q or touch button
  lookDX: number; // accumulated since last frame (radians scale applied by consumer)
  lookDY: number;
  // touch mirrors
  tForward: number;
  tStrafe: number;
  tLookDX: number;
  tLookDY: number;
  tBoost: boolean;
  tInteract: boolean;
  tScan: boolean;
}

export function createInputState(): InputState {
  return {
    forward: 0, strafe: 0, vertical: 0, boost: false, interact: false, scan: false,
    lookDX: 0, lookDY: 0,
    tForward: 0, tStrafe: 0, tLookDX: 0, tLookDY: 0,
    tBoost: false, tInteract: false, tScan: false,
  };
}

const KEYS = {
  KeyW: "forward+", KeyS: "forward-",
  KeyA: "strafe-", KeyD: "strafe+",
  Space: "vertical+", ShiftLeft: "boost", ShiftRight: "boost",
  KeyE: "interact", KeyQ: "scan",
  ArrowUp: "forward+", ArrowDown: "forward-",
  ArrowLeft: "strafe-", ArrowRight: "strafe+",
  KeyC: "vertical-", ControlLeft: "vertical-",
} as const;

export function useKeyboardInput(input: React.MutableRefObject<InputState>) {
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const recompute = () => {
      const k = keys.current;
      let forward = 0, strafe = 0, vertical = 0, boost = false;
      if (k.has("KeyW") || k.has("ArrowUp")) forward += 1;
      if (k.has("KeyS") || k.has("ArrowDown")) forward -= 1;
      if (k.has("KeyD") || k.has("ArrowRight")) strafe += 1;
      if (k.has("KeyA") || k.has("ArrowLeft")) strafe -= 1;
      if (k.has("Space")) vertical += 1;
      if (k.has("KeyC") || k.has("ControlLeft")) vertical -= 1;
      if (k.has("ShiftLeft") || k.has("ShiftRight")) boost = true;
      input.current.forward = forward;
      input.current.strafe = strafe;
      input.current.vertical = vertical;
      input.current.boost = boost;
      input.current.interact = k.has("KeyE");
      input.current.scan = k.has("KeyQ");
    };

    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") e.preventDefault();
      if (e.repeat) return;
      keys.current.add(e.code);
      recompute();
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
      recompute();
    };
    const blur = () => {
      keys.current.clear();
      recompute();
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [input]);
}

/**
 * Desktop look: pointer-lock when available (click to capture), with a
 * drag-to-look fallback so the game stays fully playable in contexts where
 * pointer lock is denied (sandboxed iframes, some browsers). A short click
 * requests lock; a drag just looks without locking.
 */
export function usePointerLook(
  input: React.MutableRefObject<InputState>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    let locked = false;
    let dragging = false;
    let dragMoved = 0;
    let lastX = 0;
    let lastY = 0;

    const onMove = (e: MouseEvent) => {
      if (locked) {
        input.current.lookDX += e.movementX * 0.0022;
        input.current.lookDY += e.movementY * 0.0022;
      } else if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        input.current.lookDX += dx * 0.0034;
        input.current.lookDY += dy * 0.0034;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onDown = (e: MouseEvent) => {
      if (locked) return;
      dragging = true;
      dragMoved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      // short click (not a drag) = capture the pointer for free-look
      if (!locked && dragging && dragMoved < 8) {
        try {
          canvas.requestPointerLock?.();
        } catch {
          /* denied (iframe sandbox etc.) — drag-look still works */
        }
      }
      dragging = false;
    };
    const onLockChange = () => {
      locked = document.pointerLockElement === canvas;
      if (locked) dragging = false;
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
    };
  }, [input, enabled]);
}

/** Consume accumulated look delta (radians). Call once per frame. */
export function consumeLook(input: React.MutableRefObject<InputState>) {
  const dx = input.current.lookDX + input.current.tLookDX;
  const dy = input.current.lookDY + input.current.tLookDY;
  input.current.lookDX = 0;
  input.current.lookDY = 0;
  input.current.tLookDX = 0;
  input.current.tLookDY = 0;
  return { dx, dy };
}

export const movementInput = (input: React.MutableRefObject<InputState>) => ({
  forward: Math.max(-1, Math.min(1, input.current.forward + input.current.tForward)),
  strafe: Math.max(-1, Math.min(1, input.current.strafe + input.current.tStrafe)),
  vertical: input.current.vertical,
});
