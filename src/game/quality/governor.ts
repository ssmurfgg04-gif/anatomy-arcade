/**
 * ADAPTIVE QUALITY GOVERNOR (research law L5/L6 — murmur src/core/perf.ts port).
 * Pure TS, no React. Feed frameMs each frame; read renderScale; listen for
 * tier demote/promote requests via callbacks. Hysteresis makes oscillation
 * impossible: scale hunts first, tier only moves after scale bottoms out.
 *
 *   renderScale: -0.06 per 0.35 s when frameMs > budget*1.18
 *                +0.03 per 0.7  s when frameMs < budget*0.72
 *   tier demote: scale at MIN sustained 2.2 s (cooldown 4 s)
 *   tier promote: scale full + headroom 8 s   (cooldown 10 s)
 */
import { QUALITY } from "@/game/config";

export interface GovernorHooks {
  onDemote?: () => void;
  onPromote?: () => void;
}

export class QualityGovernor {
  private ewma = 16.7;
  private budget = 16.7;
  private scale = 1;
  private dropAcc = 0;
  private riseAcc = 0;
  private starved = 0; // sustained seconds at min scale over budget
  private comfortable = 0; // sustained seconds at full scale under budget
  private cooldown = 0;
  private hooks: GovernorHooks;

  constructor(hooks: GovernorHooks = {}) {
    this.hooks = hooks;
    if (typeof window !== "undefined") {
      // budget from measured refresh where available; never chase >120 fps
      const refresh =
        (window as unknown as { __aaRefreshHz?: number }).__aaRefreshHz ||
        (typeof screen !== "undefined" && (screen as unknown as { refreshRate?: number }).refreshRate) ||
        60;
      this.budget = 1000 / Math.min(Math.max(refresh, 30), 120);
    }
  }

  /** Report render scale externally (e.g. restored from a previous session). */
  setScale(s: number) {
    this.scale = Math.min(1, Math.max(QUALITY.MIN_SCALE, s));
  }

  get renderScale() {
    return this.scale;
  }

  get frameMs() {
    return this.ewma;
  }

  get overBudget() {
    return this.ewma > this.budget * QUALITY.OVER_BUDGET_FACTOR;
  }

  /** Call once per rendered frame with the real frame delta in ms. */
  update(dtMs: number) {
    // EWMA smoothing (L5: alpha 0.08)
    this.ewma += (dtMs - this.ewma) * QUALITY.FRAME_EWMA;
    const dt = Math.min(dtMs, 100) / 1000;
    this.cooldown = Math.max(0, this.cooldown - dt);

    const over = this.overBudget;
    const under = this.ewma < this.budget * QUALITY.UNDER_BUDGET_FACTOR;

    if (over) {
      this.dropAcc += dt;
      this.riseAcc = 0;
      this.comfortable = 0;
      if (this.dropAcc >= QUALITY.SCALE_DROP_INTERVAL) {
        this.dropAcc = 0;
        this.scale = Math.max(QUALITY.MIN_SCALE, this.scale - QUALITY.SCALE_DROP);
      }
    } else if (under) {
      this.riseAcc += dt;
      this.dropAcc = 0;
      if (this.riseAcc >= QUALITY.SCALE_RISE_INTERVAL) {
        this.riseAcc = 0;
        this.scale = Math.min(1, this.scale + QUALITY.SCALE_RISE);
      }
    } else {
      this.dropAcc = 0;
      this.riseAcc = 0;
      this.comfortable = 0;
    }

    // tier hysteresis (only when scale has bottomed out / is full)
    if (this.scale <= QUALITY.MIN_SCALE + 1e-4 && over) {
      this.starved += dt;
    } else {
      this.starved = 0;
    }
    if (this.scale >= 1 - 1e-4 && under) {
      this.comfortable += dt;
    } else {
      this.comfortable = 0;
    }

    if (this.cooldown <= 0) {
      if (this.starved >= QUALITY.DEMOTE_SUSTAIN) {
        this.starved = 0;
        this.cooldown = QUALITY.DEMOTE_COOLDOWN;
        this.hooks.onDemote?.();
      } else if (this.comfortable >= QUALITY.PROMOTE_SUSTAIN) {
        this.comfortable = 0;
        this.cooldown = QUALITY.PROMOTE_COOLDOWN;
        this.hooks.onPromote?.();
      }
    }
  }
}
