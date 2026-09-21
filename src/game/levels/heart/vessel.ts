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
  navigateT: 0.22, // where "NAVIGATE THE BLOODSTREAM" completes
  junctionT: 0.3, // branch junction center (LAD vs LCX choice)
  junctionEndT: 0.4, // "IDENTIFY THE CORONARY ARTERY" completes past the junction
  locateT: 0.54, // where "LOCATE THE PLAQUE" completes on approach
  plaqueScanT: 0.54,
  clotT0: 0.62,
  clotT1: 0.74,
  restoreT: 0.8,
  stabilizeT: 0.92,
};

/**
 * Branch junction (spec: vessels have BRANCHES): at t≈0.30 the artery splits.
 * The main spline IS the LAD (left anterior descending — the artery that
 * blocks in the classic heart-attack case). The spur is the LCX (left
 * circumflex) — a dead-end that teaches "wrong vessel, turn back".
 */
export const JUNCTION_T = 0.3;

function buildSpurPoints(): THREE.Vector3[] {
  const anchor = new THREE.Vector3();
  vesselAnchor(JUNCTION_T, anchor);
  const dir = new THREE.Vector3();
  vesselTangent(JUNCTION_T, dir);
  // basis for the branch direction (up-right off the main tube)
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, dir).normalize();
  const side = right.clone().multiplyScalar(0.85).add(up.clone().multiplyScalar(0.5)).normalize();
  return [
    anchor.clone().addScaledVector(dir, -1.2),
    anchor.clone().addScaledVector(dir, 0.6).addScaledVector(side, 1.4),
    anchor.clone().addScaledVector(dir, 2.6).addScaledVector(side, 4.2),
    anchor.clone().addScaledVector(dir, 4.6).addScaledVector(side, 7.2),
    anchor.clone().addScaledVector(dir, 6.4).addScaledVector(side, 9.8),
  ];
}

// imported lazily to avoid a circular import at module scope (vessel.ts in
// levels/heart exports the control points; systems/vessel builds the curve)
function vesselAnchor(t: number, out: THREE.Vector3): THREE.Vector3 {
  // linear interpolation across the raw control points is fine for placement
  const pts = HEART_VESSEL_POINTS;
  const f = t * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  return out.copy(pts[i]).lerp(pts[i + 1], f - i);
}
function vesselTangent(t: number, out: THREE.Vector3): THREE.Vector3 {
  const pts = HEART_VESSEL_POINTS;
  const f = t * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  return out.subVectors(pts[i + 1], pts[i]).normalize();
}

export const spurCurve = new THREE.CatmullRomCurve3(buildSpurPoints(), false, "catmullrom", 0.5);
export const SPUR_BASE_RADIUS = 1.35;
export const SPUR_LEN = spurCurve.getLength();

/** Radius along the spur: tapers closed toward the dead end. */
export function spurRadiusAt(t: number): number {
  return 1 - 0.62 * Math.pow(THREE.MathUtils.clamp(t, 0, 1), 1.4);
}
