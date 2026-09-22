/**
 * VIRAL INVASION — airway world definition (spec §25 arc, mission 02).
 * The tube is a terminal bronchiole running into an acinus (alveolar cluster).
 * Zones mirror the heart mission's t-layout so the 10-stage machine, HUD and
 * E2E probes map 1:1.
 */
import * as THREE from "three";
import { TubeZone, anchorAt, tangentAt, buildSpur } from "@/game/levels/shared/world";

export const AIRWAY_ZONES: TubeZone[] = [
  { id: "healthy", t0: 0.0, t1: 0.3 },
  { id: "narrowing", t0: 0.3, t1: 0.46 }, // constricted bronchiole (smooth-muscle squeeze)
  { id: "damaged", t0: 0.46, t1: 0.62 }, // inflamed, mucus-coated wall
  { id: "threat", t0: 0.62, t1: 0.74 }, // infected epithelium under the viral colonies
  { id: "post", t0: 0.74, t1: 1.0 },
];

/** Control points: tracheal depth (far) up into the acinus (origin). */
export const AIRWAY_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, -2, -90),
  new THREE.Vector3(-4, -1.0, -72),
  new THREE.Vector3(3, 0.8, -58),
  new THREE.Vector3(-5, 1.4, -44),
  new THREE.Vector3(2, -0.6, -30),
  new THREE.Vector3(-6, 0.4, -18),
  new THREE.Vector3(-1, 1.6, -8),
  new THREE.Vector3(0, 0.5, 0),
];

export const AIRWAY_BASE_RADIUS = 2.1;

/** Radius at t: bronchiole squeeze + inflammatory swelling + mucus narrowing. */
export function airwayRadiusAt(t: number, cleared: number): number {
  let r = 1;
  for (const z of AIRWAY_ZONES) {
    if (t >= z.t0 && t <= z.t1) {
      const local = (t - z.t0) / (z.t1 - z.t0);
      const bell = Math.sin(local * Math.PI);
      switch (z.id) {
        case "narrowing":
          r *= 1 - 0.24 * bell;
          break;
        case "damaged":
          r *= 1 - (0.42 - 0.26 * cleared) * bell; // swelling subsides as infection clears
          break;
        case "threat":
          r *= 1 - (0.5 - 0.45 * cleared) * bell; // mucus/exudate plug
          break;
        default:
          break;
      }
    }
  }
  return r;
}

/** Wall inflammation 0..1 (shader warning pulse). */
export function airwayDamageAt(t: number): number {
  for (const z of AIRWAY_ZONES) {
    if (t >= z.t0 && t <= z.t1) {
      const local = (t - z.t0) / (z.t1 - z.t0);
      const bell = Math.sin(local * Math.PI);
      if (z.id === "narrowing") return 0.3 * bell;
      if (z.id === "damaged") return 0.7 * bell;
      if (z.id === "threat") return 0.9 * bell;
    }
  }
  return 0;
}

export const AIRWAY_OBJECTIVE_ZONES = {
  navigateT: 0.22,
  junctionT: 0.3,
  junctionEndT: 0.4,
  calibrateT: 0.33,
  locateT: 0.54,
  colonyT0: 0.62,
  colonyT1: 0.74,
  restoreT: 0.8,
  stabilizeT: 0.92,
};

/**
 * Branch junction (stage 04): the terminal bronchiole splits. The main tube
 * IS the right-lower-lobe acinus channel (where the infection is). The spur
 * is a healthy left-lobe branch — a dead end that teaches "wrong branch".
 */
export const JUNCTION_T = 0.3;

export const spurCurve = buildSpur(AIRWAY_POINTS, JUNCTION_T, { right: -0.85, up: 0.5 });
export const SPUR_BASE_RADIUS = 1.5;
export const spurRadiusAt = (t: number): number => 1 - 0.62 * Math.pow(THREE.MathUtils.clamp(t, 0, 1), 1.4);

/** Anchor helper for dressing placement (alveolar sac, macrophages). */
export function airwayAnchor(t: number, out: THREE.Vector3): THREE.Vector3 {
  return anchorAt(AIRWAY_POINTS, t, out);
}
export function airwayTangent(t: number, out: THREE.Vector3): THREE.Vector3 {
  return tangentAt(AIRWAY_POINTS, t, out);
}
