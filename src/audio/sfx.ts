"use client";
/**
 * Procedural SFX (spec §28): WebAudio synth — no asset downloads, tiny, instant.
 * heartbeat thump, propulsion hum, boost rise, scan blip, treatment beam,
 * objective chime, mission-complete sting, ambient bloodstream wash.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let humOsc: OscillatorNode | null = null;
let humGain: GainNode | null = null;
let ambienceStarted = false;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function setAudioVolume(v: number) {
  if (master) master.gain.value = muted ? 0 : v * 0.8;
}

export function setMuted(m: boolean) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.4;
}

export function unlockAudio() {
  ac();
}

/**
 * Haptic punctuation (P8 mobile hardening): tiny navigator.vibrate patterns
 * on the same moments the sfx fire. Silent no-op where unsupported. Patterns
 * are deliberately short — feedback, not buzz.
 */
export function haptic(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      (navigator as Navigator & { vibrate: (p: number | number[]) => boolean }).vibrate(pattern);
    }
  } catch {}
}

export function startAmbience() {
  const a = ac();
  if (!a || ambienceStarted) return;
  ambienceStarted = true;
  // low bloodstream wash: filtered noise via periodic thump + airy pad
  const pad = a.createOscillator();
  pad.type = "sine";
  pad.frequency.value = 54;
  const padGain = a.createGain();
  padGain.gain.value = 0.016;
  pad.connect(padGain).connect(master!);
  pad.start();
  // slow LFO on pad
  const lfo = a.createOscillator();
  lfo.frequency.value = 0.11;
  const lfoGain = a.createGain();
  lfoGain.gain.value = 0.008;
  lfo.connect(lfoGain).connect(padGain.gain);
  lfo.start();
}

export function startHum() {
  const a = ac();
  if (!a || humOsc) return;
  humOsc = a.createOscillator();
  humOsc.type = "triangle";
  humOsc.frequency.value = 68;
  humGain = a.createGain();
  humGain.gain.value = 0.0;
  const filter = a.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  humOsc.connect(filter).connect(humGain).connect(master!);
  humOsc.start();
}

export function updateHum(speed: number, boosting: boolean) {
  if (!humGain || !humOsc || !ctx) return;
  const t = ctx.currentTime;
  humGain.gain.setTargetAtTime(muted ? 0 : Math.min(0.05, speed * 0.012), t, 0.12);
  humOsc.frequency.setTargetAtTime(64 + speed * 7 + (boosting ? 46 : 0), t, 0.16);
}

export function stopHum() {
  if (humOsc) {
    try { humOsc.stop(); } catch { /* already stopped */ }
    humOsc = null;
    humGain = null;
  }
}

export function playScan() {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(620, t);
  o.frequency.exponentialRampToValueAtTime(1240, t + 0.18);
  const g = a.createGain();
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + 0.36);
}

export function playBlip(freq = 880, dur = 0.08, vol = 0.07) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = "square";
  o.frequency.value = freq;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function playChime() {
  // objective complete: rising major triad
  [523, 659, 784].forEach((f, i) => setTimeout(() => playBlip(f, 0.22, 0.09), i * 90));
}

export function playSuccess() {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  [392, 523, 659, 784, 1046].forEach((f, i) => {
    const o = a.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.12);
    g.gain.exponentialRampToValueAtTime(0.1, t + i * 0.12 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.8);
    o.connect(g).connect(master!);
    o.start(t + i * 0.12);
    o.stop(t + i * 0.12 + 0.9);
  });
}

export function playImpact() {
  haptic(30);
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.22);
  const g = a.createGain();
  g.gain.setValueAtTime(0.16, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + 0.26);
}

export function playHeartbeat(intensity = 1) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(64, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.12);
  const g = a.createGain();
  g.gain.setValueAtTime(0.11 * intensity, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + 0.18);
}

/** treatment lock-on acquired: crisp two-tone confirm (L19) */
export function playLockOn() {
  haptic(12);
  playBlip(740, 0.07, 0.08);
  setTimeout(() => playBlip(1108, 0.09, 0.08), 70);
}

/** per-segment dissolve tick — rises as the clot breaks down (L19/L20) */
export function playDissolveTick(step: number) {
  haptic(10 + step * 4);
  const f = 420 + step * 120;
  playBlip(f, 0.06, 0.05);
  setTimeout(() => playBlip(f * 1.5, 0.05, 0.04), 40);
}

/** flow restored payoff: ascending arpeggio 659/784/988 (L19) */
export function playFlowRestored() {
  haptic([20, 60, 40]);
  [659, 784, 988].forEach((f, i) => setTimeout(() => playBlip(f, 0.3, 0.1), i * 110));
}
