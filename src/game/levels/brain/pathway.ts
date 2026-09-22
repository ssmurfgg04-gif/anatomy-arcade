/**
 * BRAIN MISSION — cerebral pathway world definition (spec §25 arc, mission 03).
 * The tube is a cerebral artery (MCA branch) running through a neural web.
 * Stage t-layout mirrors heart/viral 1:1.
 */
import * as THREE from "three";
import { TubeZone, anchorAt, tangentAt, buildSpur } from "@/game/levels/shared/world";

export const NEURAL_ZONES: TubeZone[] = [
  { id: "healthy", t0: 0.0, t1: 0.3 },
  { id: "narrowing", t0: 0.3, t1: 0.46 }, // vasospasm
  { id: "damaged", t0: 0.46, t1: 0.62 }, // wall degradation (lipid deposition)
  { id: "threat", t0: 0.62, t1: 0.74 }, // the aneurysm bulge
  { id: "post", t0: 0.74, t1: 1.0 },
];

export const NEURAL_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, -2, -90),
  new THREE.Vector3(5, -0.6, -72),
  new THREE.Vector3(-4, 1.0, -58),
  new THREE.Vector3(4, 1.8, -44),
  new THREE.Vector3(-3, -0.4, -30),
  new THREE.Vector3(5, 0.8, -18),
  new THREE.Vector3(0, 1.6, -8),
  new THREE.Vector3(0, 0.5, 0),
];

export const NEURAL_BASE_RADIUS = 1.8;

/** Radius at t — the aneurysm zone BALLOONS outward instead of narrowing. */
export function neuralRadiusAt(t: number, cleared: number): number {
  let r = 1;
  for (const z of NEURAL_ZONES) {
    if (t >= z.t0 && t <= z.t1) {
      const local = (t - z.t0) / (z.t1 - z.t0);
      const bell = Math.sin(local * Math.PI);
      switch (z.id) {
        case "narrowing":
          r *= 1 - 0.26 * bell;
          break;
        case "damaged":
          r *= 1 - 0.1 * bell;
          break;
        case "threat":
          // the bulge: swells outward; reinforcement matrix supports it back down
          r *= 1 + (0.55 - 0.3 * cleared) * bell;
          break;
        default:
          break;
      }
    }
  }
  return r;
}

/** Wall weakness 0..1 (shader warning pulse). */
export function neuralDamageAt(t: number): number {
  for (const z of NEURAL_ZONES) {
    if (t >= z.t0 && t <= z.t1) {
      const local = (t - z.t0) / (z.t1 - z.t0);
      const bell = Math.sin(local * Math.PI);
      if (z.id === "narrowing") return 0.25 * bell;
      if (z.id === "damaged") return 0.65 * bell;
      if (z.id === "threat") return 0.95 * bell;
    }
  }
  return 0;
}

export const NEURAL_OBJECTIVE_ZONES = {
  navigateT: 0.22,
  junctionT: 0.3,
  junctionEndT: 0.4,
  calibrateT: 0.33,
  locateT: 0.54,
  aneurysmT0: 0.62,
  aneurysmT1: 0.74,
  restoreT: 0.8,
  stabilizeT: 0.92,
};

export const JUNCTION_T = 0.3;

/** The spur is the ACA branch — healthy, dead end for this mission. */
export const spurCurve = buildSpur(NEURAL_POINTS, JUNCTION_T, { right: 0.8, up: -0.55 });
export const SPUR_BASE_RADIUS = 1.3;
export const spurRadiusAt = (t: number): number => 1 - 0.62 * Math.pow(THREE.MathUtils.clamp(t, 0, 1), 1.4);

export function neuralAnchor(t: number, out: THREE.Vector3): THREE.Vector3 {
  return anchorAt(NEURAL_POINTS, t, out);
}
export function neuralTangent(t: number, out: THREE.Vector3): THREE.Vector3 {
  return tangentAt(NEURAL_POINTS, t, out);
}
