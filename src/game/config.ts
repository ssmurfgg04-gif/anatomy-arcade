/**
 * FROZEN FEEL CONFIG (research law L3/L29 — docs/RESEARCH/LESSONS.md).
 * Every tuning constant lives here, side-effect free, named with intent.
 * Feel values are authored, not grown. Changing feel = changing this file.
 */

export const FLIGHT = {
  /** forward acceleration, units/s^2 (normal / boost) */
  ACCEL: 17,
  ACCEL_BOOST: 30,
  /** exponential drag rate (1/s) — vel *= 1/(1+drag*dt) */
  DRAG: 3.0,
  DRAG_BOOST: 2.2,
  /** max speed cap, units/s (soft via drag, hard cap safety) */
  MAX_SPEED: 14,
  /** organic bloodstream drift amplitude */
  DRIFT: 0.05,
  DRIFT_X_FREQ: 1.7,
  DRIFT_Y_FREQ: 2.1,
} as const;

export const CAMERA = {
  /** POV base FOV and speed/boost additions */
  FOV_BASE: 78,
  FOV_SPEED: 0.4, // deg per unit/s
  FOV_SPEED_MAX: 6,
  FOV_BOOST: 10,
  FOV_RATE: 6, // exp damp rate for fov
  /** chase follow: rate grows with speed (distance-smoothing, L2) */
  CHASE_RATE_BASE: 8,
  CHASE_RATE_SPEED: 0.9,
  CHASE_OFFSET: { x: 0, y: 0.55, z: 1.6 } as const,
  CHASE_LEAD: 6, // meters look-ahead
  /** micro-roll from yaw velocity, radians max (L4) */
  ROLL_MAX: 0.035,
  ROLL_RATE: 0.05,
  /** shake */
  SHAKE_DECAY: 1.4,
  SHAKE_AMP: 0.05,
} as const;

export const COMBAT = {
  /** wall impact threshold (units/s outward) above which damage applies */
  IMPACT_MIN: 2.2,
  IMPACT_DAMAGE: 1.4, // damage = outward * this, capped
  IMPACT_CAP: 9,
  /** invulnerability window after taking wall damage (L12) */
  IFRAMES: 0.45,
  /** wall bounce restitution on outward velocity */
  BOUNCE: 1.15,
  WALL_MARGIN: 0.18,
} as const;

export const QUALITY = {
  /** murmur-derived governor (L5): render-scale hunt + tier hysteresis */
  FRAME_EWMA: 0.08,
  BUDGET_FPS_MIN: 60, // budget from min(measured refresh, 120)
  SCALE_DROP: 0.06, // per 0.35s when over budget
  SCALE_DROP_INTERVAL: 0.35,
  SCALE_RISE: 0.03, // per 0.7s when under budget
  SCALE_RISE_INTERVAL: 0.7,
  OVER_BUDGET_FACTOR: 1.18,
  UNDER_BUDGET_FACTOR: 0.72,
  MIN_SCALE: 0.5,
  /** tier demotion: renderScale bottomed out this long → demote */
  DEMOTE_SUSTAIN: 2.2,
  DEMOTE_COOLDOWN: 4,
  /** tier promotion: full scale with headroom this long → promote */
  PROMOTE_SUSTAIN: 8,
  PROMOTE_COOLDOWN: 10,
} as const;

export const TOUCH = {
  /** joystick travel radius = element width * this (L17) */
  STICK_RADIUS_FACTOR: 0.42,
  /** deadzone as fraction of radius */
  DEADZONE: 0.08,
} as const;

export const FEEL = {
  /** frame dt clamp per tier (LOW tolerates software-GL spikes) */
  DT_CLAMP: 0.05,
  DT_CLAMP_LOW: 0.22,
  /** heartbeat bob */
  BOB_FREQ: 2.2,
  SHAKE_FREQ: 5.1,
} as const;
