/**
 * Heart mission definition — the vertical slice (spec §8, §23, §47).
 * The vessel is a Catmull-Rom spline; gameplay zones are parameterized along t (0..1).
 */
import * as THREE from "three";

export interface VesselZone {
  /** zone id */
  id: "healthy" | "narrowing" | "plaque" | "clot" | "post";
  /** start t along spline */
  t0: number;
  t1: number;
}

export const HEART_VESSEL_ZONES: VesselZone[] = [
  { id: "healthy", t0: 0.0, t1: 0.3 },
  { id: "narrowing", t0: 0.3, t1: 0.46 },
  { id: "plaque", t0: 0.46, t1: 0.62 },
  { id: "clot", t0: 0.62, t1: 0.74 },
  { id: "post", t0: 0.74, t1: 1.0 },
];

/** Control points for the coronary vessel path (world units, vessel radius ~1). */
export const HEART_VESSEL_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, -2, -90),
  new THREE.Vector3(4, -1.2, -72),
  new THREE.Vector3(-3, 0.5, -58),
  new THREE.Vector3(5, 1.6, -44),
  new THREE.Vector3(-2, -0.8, -30),
  new THREE.Vector3(6, 0.2, -18),
  new THREE.Vector3(1, 1.8, -8),
  new THREE.Vector3(0, 0.5, 0),
];

export const VESSEL_BASE_RADIUS = 1.9;

/** Radius multiplier at t, with narrowing + plaque constriction. */
export function vesselRadiusAt(t: number, cleared: number): number {
  let r = 1;
  for (const z of HEART_VESSEL_ZONES) {
    if (t >= z.t0 && t <= z.t1) {
      const local = (t - z.t0) / (z.t1 - z.t0);
      const bell = Math.sin(local * Math.PI);
      switch (z.id) {
        case "narrowing":
          r *= 1 - 0.28 * bell;
          break;
        case "plaque":
          r *= 1 - (0.52 - 0.3 * cleared) * bell;
          break;
        case "clot":
          r *= 1 - (0.6 - 0.55 * cleared) * bell;
          break;
        default:
          break;
      }
    }
  }
  return r;
}

export const HEART_OBJECTIVE_ZONES = {
  locateT: 0.36, // where "LOCATE FLOW ANOMALY" completes on approach
  plaqueScanT: 0.54,
  clotT0: 0.62,
  clotT1: 0.74,
  restoreT: 0.8,
  stabilizeT: 0.92,
};
